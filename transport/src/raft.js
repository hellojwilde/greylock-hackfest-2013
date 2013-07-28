function len(obj) {
    var size = 0;
    for(var key in obj)
	size++;
    return size;
};

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Peer(name, call) {
    this.nextId = -1;
    this.name = name;
    this.call = call;
}

function raft(rtc, self, cb) {
    var states = {
	leader: 1,
	follower: 2,
	candidate: 3
    }
    
    var log = [];
    var votedFor;
    var currentTerm = 0;
    var numVotes = 0;
    var state = states.follower;
    var leader;
    var lastIndex = 0;
    var commitIndex = 0;
    var peers = {};
    
    var callbacks = {};
    var baseElectionTimeout = 1000;
    var electionTimer;
    resetElectionTimeout();
    
    function send(name, msg) {
	msg.term = currentTerm
	msg.from = self
	var peer = peers[name]
	peer.call.chat(JSON.stringify(msg))
    }

    function broadcast(msg) {
	for(var idx in peers) {
	    var peer = peers[idx]
	    if(peer.name != self) {
		send(peer.name, msg)
	    }
	}
    }

    function apply(msg) {
	if(msg != "")
	    cb(msg)
    }
    
    function beginElection() {
	if(state == state.leader)
	   return

	console.log("begin election", self)
	
	currentTerm++;
	numVotes = 1;
	state = states.candidate;
	votedFor = self;
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
	if(votedFor == null) {
	    console.log("handle vote request for", msg, currentTerm);
	    votedFor = msg.from;
	    send(msg.from, {
		type: "voteAck"
	    });
	}
    }

    function handleVoteAck(msg) {
	numVotes++;
	if(numVotes >= Math.floor(len(peers)/2) + 1) {
	    console.log("won election")
	    stopElectionTimeout();
	    state = states.leader;
	    leader = self;
	}
    }
    
    function handleAppendEntries(msg) {
	if(msg.prevLogIndex >= 0 && !log[msg.prevLogIndex]) {
	    console.error("error handling msg: missing prevLogIndex", msg);
	    send(msg.from, {
		type: "res",
		status: "error",
		reason: "prevLogIndex",
		msg: msg
	    })
	  //} else if(msg.prevLogIndex >= 0 && log[msg.prevLogIndex].msg != msg.prevLogEntry) {
	  //   console.error("error handling msg: mismatch prevLogEntry", msg);
	  //   send(msg.from, {
	  // 	type: "res",
	  // 	status: "error",
	  // 	reason: "prevLogEntry",
	  // 	msg: msg
	  //   })
 	} else {
	    for(var idx in msg.entries) {
		var entry = msg.entries[idx];
		log[entry.id] = {
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
	    
	    for(; lastIndex < msg.lastCommittedIndex; lastIndex++) {
		log[lastIndex].committed = true;
		log[lastIndex].servers_committed.push(self)
		apply(log[lastIndex].msg);
		commitIndex = lastIndex;
	    }
	}
    }

    function handleCallback(res) {
	switch(res.status) {
	case "error":
	    peers[res.from].nextId--;
	    leaderInsert(res.msg.request, client);
	    break;
	case "success":
	    var entry = log[res.for];
	    entry.servers_committed.push(res.from);
	    peers[res.from].nextId = res.for
	    if(!entry.committed && entry.servers_committed.length >= Math.floor(len(peers)/2) + 1) {
		entry.committed = true;
		commitIndex = res.for;
		apply(res.msg);
		// todo: maybe send confirmation to original client.
	    }
	    break;
	}
    }

    // ping
    setInterval(function() { leaderInsert("") }, baseElectionTimeout / 2);
    function leaderInsert(request) {
	if(state != states.leader)
	    return;

	log[lastIndex] = {
	    servers_committed: [self],
	    term: currentTerm,
	    committed: false,
	    msg: request
	}

	for(var clientId in peers) {
	    var peer = peers[clientId]
	    if(peer.name == self)
		continue
	    
	    var entries = []
	    for(var i = peer.nextId; i <= lastIndex; i++)
		if(log[i])
		    entries.push({msg: log[i].msg, id: i});

	    send(clientId, {
		type: "appendEntries",
		prevLogIndex: peer.nextId,
		lastCommittedIndex: commitIndex,
		entries: entries,
		request: request
	    })
	}

	lastIndex++;
    }

    function join(client_name, call) {
	if(!call)
	    call = rtc.call(client_name)
	
	var peer = new Peer(client_name, call)
	peers[client_name] = peer
	peer.call.on("chat", receive)
    }

    function checkTerm(msg) {
	if(msg.term < currentTerm) {
	    console.log("reject old message")
	    return;
	} else if(msg.term > currentTerm) {
	    console.log("future term")
	    currentTerm = msg.term;
	    state = states.follower;
	    resetElectionTimeout();
	    votedFor = null;
	    numVotes = 0;
	}
    }
    
    function receive(str) {
	msg = JSON.parse(str);

	if(!peers[msg.from]) {
	    console.log("unknown peer " + msg.from)
	    join(msg.from)
	    return;
	}
	
	resetElectionTimeout();
	    
	switch(msg.type) {
	case "requestVote":
	    checkTerm(msg);
	    handleVoteRequest(msg);
	    break;
	case "appendEntries":
	    leader = msg.from;
	    checkTerm(msg);
	    handleAppendEntries(msg);
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
	default:
	    console.error("unknown message type: " + msg.type);
	    break;
	}
    }
    
    return {
	receive: receive,
	join: join,
	state: function() {
	    return {
		name: self,
		leader: leader,
		currentTerm: currentTerm,
		numVotes: numVotes,
		state: state,
		lastIndex: lastIndex,
		commitIndex: commitIndex,
		peers: peers,
		log: log
	    }
	},
	send: function(msg) {
	    if(state == states.leader) {
		leaderInsert(msg)
	    } else {
		send(leader, {type: "insert", data: msg});
	    }
	}
    }
}
