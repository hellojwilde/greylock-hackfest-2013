var Songs = {
  _songs: {},

  init: function () {
      var peer;
      var client;
      var urlArr = window.location.toString().split('/');
      var id = urlArr[urlArr.length-1];
      var cfg = {
        host: 'ec2-54-215-180-78.us-west-1.compute.amazonaws.com',
        port: 9000
      };
      peer = new Peer(id, cfg);
      console.log('connecting: ',peer);
      peer.on('error', function(err) {
        peer = new Peer(null, cfg);
        console.log('that failed: now to ', peer);
        peer.on('open', function(){
          client = new Raft(peer, Songs.recieveMessage);
          console.log(client);
          client.join(id);
        });
      });
      peer.on('open', function(){
        client = new Raft(peer, Songs.recieveMessage);
        console.log(client);
        client.join(id);
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

  receiveMessage: function () {

  }
};