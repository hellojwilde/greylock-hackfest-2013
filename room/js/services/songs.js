var Songs = function(){
  var peer = null;
  var client = null;
  return {
    _songs: {},

    init: function () {
        var urlArr = window.location.toString().split('/');
        var id = urlArr[urlArr.length-1];
        id = id.replace('.','-');
        var cfg = {
          host: 'ec2-54-215-180-78.us-west-1.compute.amazonaws.com',
          port: 9000
        };
        peer = new Peer(id, cfg);
        console.log('connecting: ',peer);
        peer.on('error', function(err) {
          console.log(err);
          peer = new Peer(null, cfg);
          console.log('that failed: now to ', peer);
          peer.on('open', function(){
            client = new Raft(peer, rcvmsg);
            console.log(client.id, id);
            client.join(id);
            client.send("hello!");
          });
        });
        peer.on('open', function(){
          client = new Raft(peer, rcvmsg);
          console.log(client.id, id);
          client.join(id);
          client.send("hello!");
        });
      return this;
    },

    add: function () {

    },

    upvote: function () {

    },

    downvote: function () {

    },

    enqueue: function () {

    },

    play: function () {

    },

    receiveMessage: rcvmsg
  };
}();

var rcvmsg = function (data) {
  console.log('data: ', data);
};