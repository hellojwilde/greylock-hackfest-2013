var id = "" + randBetween(0,100);
console.log("starting as " + id)

var peer = new Peer(id, {host: 'localhost', port: 9000});
var client = new Raft(peer, function(data) {
    console.error("apply:", data)
})
