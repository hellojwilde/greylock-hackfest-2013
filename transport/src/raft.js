function len(obj) {
    var size = 0;
    for(var key in obj)
	size++;
    return size;
};

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Raft(peer, cb, initial_state) {
    // the reason we allow the user to pass in the initial state here is that we want
    // them to be able to be a leader in a group of one if there is actually only one person
    // in the room. Normally you don't do this, since starting nodes as leaders and issuing
    // commits to them before they join together would cause message loss.
    // This is not a problem our case, since we can differentiate between a party of 1 vs a
    // party of n plus 1 by whether or not we have the room_id name.
    if(!initial_state)
	initial_state = Raft.states.follower

    var self = this;
    self.peer = peer;
    self.currentTerm = 0;
    self.log = [];
    self.votedFor;
    self.votes = {};
    self.state = initial_state;
    self.lastIndex = 0;
    self.commitIndex = 0;
    self.peers = {};
    self.queue = []

    var baseElectionTimeout = 1000;
    var electionTimer;

    self.id = peer.id;
    if(self.state == Raft.states.leader)
	self.leader = self.id
    else
	self.leader = null;
    resetElectionTimeout();

    peer.on('open', function(id) {
	self.id = id;
	if(self.state == Raft.states.leader)
	    self.leader = self.id
	else
	    self.leader = null;
    })
    peer.on('connection', function(conn) {
	self.join(conn.peer, conn)
    })
    window.addEventListener("unload", function() {
	self.leave();
    })

    function send(name, msg) {
	msg.term = self.currentTerm
	msg.from = self.id
	var peer = self.peers[name]
	if(peer && peer.conn.open)
	    peer.conn.send(JSON.stringify(msg))
    }
    this.sendto = send

    function broadcast(msg) {
	for(var idx in self.peers) {
	    var peer = self.peers[idx]
	    send(peer.name, msg)
	}
    }
    this.broadcast = broadcast

    function apply(msg) {
	try {
	    switch(msg.data) {
	    case "":
		// do nothing on a ping.
		break;
	    default:
		cb(msg.data, msg.from)
		break;
	    }
	} catch(e) {
	    console.error(e)
	}
    }

    function flushMsgQueue() {
	if(!self.leader)
	    return;

	for(var m in self.queue) {
	    msg = self.queue[m];

	    if(self.state == Raft.states.leader)
		self.leaderInsert({data: msg, from: self.id})
	    else
		// if we don't have a leader yet, queue up the message for later
		self.sendto(self.leader, {type: "insert", data: msg});
	}
	self.queue = []
    }
    this.flushMsgQueue = flushMsgQueue
    setInterval(this.flushMsgQueue, 500)


    function beginElection() {
	if(self.state == Raft.states.leader)
	    return

	console.log("begin election")

	self.currentTerm++;
	self.votes = {}
	self.votes[self.id] = true
	self.state = Raft.states.candidate;
 	self.votedFor = self.id;
	resetElectionTimeout();

	broadcast({type: "requestVote"})
    }

    function stopElectionTimeout() {
	if(electionTimer)
	    clearInterval(electionTimer)
    }
    this.stopElectionTimeout = stopElectionTimeout

    function startElectionTimeout() {
	// restart timer at a random interval to prevent infinite recovery rounds.
	var timeout = randBetween(baseElectionTimeout, 2*baseElectionTimeout);
	electionTimer = setInterval(beginElection, timeout);
    }

    function resetElectionTimeout() {
	stopElectionTimeout()
	startElectionTimeout()
    }

    function handleVoteRequest(msg) {
	if(self.votedFor == null) {
	    self.votedFor = msg.from;
	    send(msg.from, {type: "voteAck"});
	}
    }

    function handleVoteAck(msg) {
	self.votes[msg.from] = true;
	console.log(self.votes)
	if(isMajority(len(self.votes))) {
	    console.log("won election")
	    stopElectionTimeout();
	    self.state = Raft.states.leader;
	    self.leader = self.id;
	}
    }

    function commit(id) {
	if(!self.log[id]) {
	    console.log("missing log entry for", id)
	    return;
	}

	var entry = self.log[id];
	entry.committed = true;
	self.commitIndex = id;
	apply(self.log[id].msg);

	if(self.state == Raft.states.leader)
	    broadcast({
		type: "commit",
		commitIndex: self.commitIndex
	    })
	// todo: maybe send confirmation to original client.
    }

    function handleCommit(msg) {
	for(; self.lastIndex < msg.commitIndex; self.lastIndex++)
	    commit(self.lastIndex)
    }

    function isMajority(i) {
	return i >= Math.floor((len(self.peers) + 1)/2) + 1
    }

    function handleCallback(res) {
	switch(res.status) {
	case "error":
	    self.peers[res.from].nextId--;
	    leaderInsert(res.msg.request, client);
	    break;
	case "success":
	    var entry = self.log[res.for];
	    entry.servers_responded.push(res.from);
	    self.peers[res.from].nextId = res.for;
	    if(!entry.committed && isMajority(entry.servers_responded.length))
		commit(res.for)
	    break;
	}
    }

    function leaderInsert(request) {
	if(self.state != Raft.states.leader)
	    return;

	self.log[self.lastIndex] = {
	    servers_responded: [self.id],
	    term: self.currentTerm,
	    committed: false,
	    msg: request
	}

	// if we're a majority, we can just commit the message
	if(isMajority(1))
	    commit(self.lastIndex)

	for(var clientId in self.peers) {
	    var peer = self.peers[clientId]
	    var entries = []
	    for(var i = peer.nextId+1; i <= self.lastIndex; i++)
		if(self.log[i])
		    entries.push({msg: self.log[i].msg, id: i});

	    send(clientId, {
		type: "appendEntries",
		prevLogIndex: peer.nextId,
		commitIndex: self.commitIndex,
		entries: entries,
		request: request
	    })
	}

	self.lastIndex++;
    }
    this.leaderInsert = leaderInsert


    function handleAppendEntries(msg) {
	if(msg.prevLogIndex >= 0 && !self.log[msg.prevLogIndex]) {
	    console.error("error handling msg: missing prevLogIndex", msg);
	    send(msg.from, {
		type: "res",
		status: "error",
		reason: "prevLogIndex",
		msg: msg
	    })
 	} else {
	    for(var idx in msg.entries) {
		var entry = msg.entries[idx];
		self.log[entry.id] = {
		    servers_responded: [msg.from],
		    committed: false,
		    msg: entry.msg
		};
		// deal with it.
		send(msg.from, {
		    type: "res",
		    for: entry.id,
		    status: "success",
		    msg: entry.msg
		})
	    }
	}
	// we handle commit separately in a separate message as an optimization,
	// but handle it again here, just in case the message gets dropped or whatever
	handleCommit(msg)
    }

    function ping() {
	leaderInsert({from:self.id, data:""})
    }
    setInterval(ping, baseElectionTimeout / 2);

    function checkTerm(msg) {
	if(msg.term < self.currentTerm) {
	    console.log("reject old message ("+self.currentTerm+" > "+msg.term+")", msg)
	    send(msg.from, {type: "checkTerm"})
	    return;
	} else if(msg.term > self.currentTerm) {
	    console.log("future term")
	    self.currentTerm = msg.term;
	    self.state = Raft.states.follower;
	    resetElectionTimeout();
	    self.votedFor = null;
	    self.votes = [];
	}
    }

    function receive(str) {
	msg = JSON.parse(str);

	if(!self.peers[msg.from]) {
	    console.log("unknown peer " + msg.from, msg)
	    return;
	}

	resetElectionTimeout();

	switch(msg.type) {
	case "requestVote":
	    checkTerm(msg);
	    handleVoteRequest(msg);
	    break;
	case "checkTerm":
	    checkTerm(msg);
	    break;
	case "appendEntries":
	    checkTerm(msg);
	    self.leader = msg.from;
	    handleAppendEntries(msg);
	    break;
	case "commit":
	    checkTerm(msg);
	    handleCommit(msg);
	    break;
	case "voteAck":
	    handleVoteAck(msg);
	    break;
	case "insert":
	    leaderInsert({data: msg.data, from: msg.from});
	    break;
	case "res":
	    handleCallback(msg);
	    break;
	case "join":
	    checkTerm(msg);
	    self.join(msg.name)
	    break;
	default:
	    console.error("unknown message type: " + msg.type);
	    break;
	}
    }
    this.receive = receive
}

Raft.states = {
    leader: 1,
    follower: 2,
    candidate: 3
}

Raft.prototype.join = function(client_name, conn) {
    if(this.peers[client_name] || client_name == this.id)
	return

    if(!conn)
	conn = this.peer.connect(client_name)
    conn.on('data', this.receive);
    var self = this;
    conn.on('close', function() {
	delete self.peers[conn.peer];
    })

    this.broadcast({type: "join", name: client_name})

    this.peers[client_name] = {
	nextId: -1,
	name: client_name,
	conn: conn
    }
}

Raft.prototype.send = function(msg) {
    this.queue.push(msg)
    if(!this.leader)
	return;

    this.flushMsgQueue();
}

Raft.prototype.leave = function() {
    this.stopElectionTimeout();
    this.peer.destroy()
    for(var idx in this.peers)
	delete this.peers[idx]
}
