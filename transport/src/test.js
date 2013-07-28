var id = "" + randBetween(0,100);

cfg = {
    host: 'ec2-54-215-180-78.us-west-1.compute.amazonaws.com',
    port: 9000
}
var peer = new Peer(null, cfg);
peer.on("open", function() {
    console.log("starting as " + peer.id)
})
// peer.on("error", function(err) {
//     peer = new Peer(room_id + "-" + ..., cfg);
// })

var client = new Raft(peer, function(data) {
    console.error("apply:", data)
})
// client.join(room_id)
// client.send(msg)

window.onunload = function(){
    client.leave()
}
