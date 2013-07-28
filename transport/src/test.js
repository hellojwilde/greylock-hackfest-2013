var id = "" + randBetween(0,100);
console.log("starting as " + id)

var rtc = holla.createClient({host: "localhost", port:8080});
var client = new raft(rtc, id, function(data) {
    console.error("apply:", data)
})
console.log("after new raft")

console.log(holla.supported)

rtc.register(id, function(worked) {
    if(!worked) {
	console.error("couldn't register as " + id + " ack");
	return;
    }

    console.log("registered as " + id, worked)
    rtc.on("call", function(call){
	console.log("call", call)
	call.answer();
	call.on("chat", client.receive)
    })
})
