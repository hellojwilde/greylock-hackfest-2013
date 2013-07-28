var id = "" + randBetween(0,100);
console.log("starting as " + id)

cfg = {
    host: 'localhost',
    port: 9000
}
var peer = new Peer(id, cfg);
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
