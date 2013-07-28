var id = "" + randBetween(0,100);

cfg = {
    host: 'ec2-54-215-180-78.us-west-1.compute.amazonaws.com',
    port: 9000
}
var client;
var peer = new Peer(null, cfg);
console.log(peer.id)
peer.on("open", function() {
    client = new Raft(peer, function(data) {
	console.error("apply:", data)
    }, Raft.states.leader)
    console.log("starting as " + peer.id)
})

// peer.on("error", function(err) {
//     peer = new Peer(room_id + "-" + ..., cfg);
// })

// client.join(room_id)
// client.send(msg)

window.onunload = function(){
    client.leave()
}
