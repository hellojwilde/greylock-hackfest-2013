function len(obj) {
    var size = 0;
    for(var key in obj)
	size++;
    return size;
};

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Raft(peer, cb) {
    var self = this;
    self.peer = peer;
    self.id = peer.id;
    self.currentTerm = 0;
    self.log = [];
    self.votedFor;
    self.numVotes = 0;
    self.state = Raft.states.follower;
    self.leader = null;
    self.lastIndex = 0;
    self.commitIndex = 0;
    self.peers = {};

    var baseElectionTimeout = 1000;
    var electionTimer;

    peer.on('connection', function(conn) {
	self.join(conn.peer, conn)
    })

    resetElectionTimeout();

    function send(name, msg) {
	msg.term = self.currentTerm
	msg.from = self.id
	var peer = self.peers[name]
	if(peer.conn.open)
	    peer.conn.send(JSON.stringify(msg))
    }
    this.sendto = send

    function broadcast(msg) {
	for(var idx in self.peers) {
	    var peer = self.peers[idx]
	    if(peer.name != self.id) {
		send(peer.name, msg)
	    }
	}
    }
    this.broadcast = broadcast

    function apply(msg) {
	if(msg != "")
	    cb(msg)
    }

    function beginElection() {
	if(self.state == Raft.states.leader)
	    return

	console.log("begin election")

	self.currentTerm++;
	self.numVotes = 1;
	self.state = Raft.states.candidate;
	self.votedFor = self.id;
	resetElectionTimeout();

	broadcast({type: "requestVote"})
    }

    function stopElectionTimeout() {
	if(electionTimer)
	    clearInterval(electionTimer)
    }

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
	    send(msg.from, {
		type: "voteAck"
	    });
	}
    }

    function handleVoteAck(msg) {
	self.numVotes++;
	if(self.numVotes >= Math.floor(len(self.peers)/2) + 1) {
	    console.log("won election")
	    stopElectionTimeout();
	    self.state = Raft.states.leader;
	    self.leader = self.id;
	}
    }

    function handleCallback(res) {
	switch(res.status) {
	case "error":
	    self.peers[res.from].nextId--;
	    leaderInsert(res.msg.request, client);
	    break;
	case "success":
	    var entry = self.log[res.for];
	    entry.servers_committed.push(res.from);
	    self.peers[res.from].nextId = res.for;
	    if(!entry.committed && entry.servers_committed.length >= Math.floor(len(self.peers)/2) + 1) {
		entry.committed = true;
		self.commitIndex = res.for;
		apply(res.msg);
		broadcast({
		    type: "commit",
		    commitIndex: self.commitIndex
		})
		// todo: maybe send confirmation to original client.
	    }
	    break;
	}
    }

    function leaderInsert(request) {
	if(self.state != Raft.states.leader)
	    return;

	self.log[self.lastIndex] = {
	    servers_committed: [self.id],
	    term: self.currentTerm,
	    committed: false,
	    msg: request
	}

	for(var clientId in self.peers) {
	    var peer = self.peers[clientId]
	    if(peer.name == self.id)
		continue

	    var entries = []
	    for(var i = peer.nextId+1; i <= self.lastIndex; i++)
		if(self.log[i])
		    entries.push({msg: self.log[i].msg, id: i});

	    send(clientId, {
		type: "appendEntries",
		prevLogIndex: peer.nextId,
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
		    servers_committed: [msg.from],
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
    }

    function handleCommit(msg) {
	for(; self.lastIndex < msg.commitIndex; self.lastIndex++) {
	    self.log[self.lastIndex].committed = true;
	    self.log[self.lastIndex].servers_committed.push(self.id)
	    apply(self.log[self.lastIndex].msg);
	    self.commitIndex = self.lastIndex;
	}
    }

    function ping() {
	leaderInsert("")
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
	    self.numVotes = 0;
	}
    }

    function receive(str) {
	msg = JSON.parse(str);

	if(!self.peers[msg.from]) {
	    console.log("unknown peer " + msg.from)
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
	    self.leader = msg.from;
	    checkTerm(msg);
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
	    leaderInsert(msg.data);
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
    if(this.peers[client_name])
	return

    if(!conn)
	conn = this.peer.connect(client_name)
    conn.on('data', this.receive);

    this.broadcast({type: "join", name: client_name})

    this.peers[client_name] = {
	nextId: -1,
	name: client_name,
	conn: conn
    }
}

Raft.prototype.send = function(msg) {
    if(this.state == Raft.states.leader) {
	this.leaderInsert(msg)
    } else {
	this.sendto(this.leader, {type: "insert", data: msg});
    }
}
