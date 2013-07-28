var Songs = (function() {
  observers = []
  peer = null
  client = null
  songs = {}

  var _sendMessage = function (action, data) {
    client.send({
      action: action,
      data: data
    });
  }

  var _handleRaftMessage = function (data) {
    console.log('data: ', data);
    for(var o in observers)
	observers[o](data)
  }

  var _initCallbacks = function() {
    subscribe("add", function(obj) {
      console.log("add", obj, obj.uuid, songs)
      songs[obj.uuid] = obj;
    });
    subscribe("upvote", function(uuid) {
      console.log("upvote", uuid)
      songs[uuid].votes++;
      songs[uuid].haveVoted = true;
    });
    subscribe("downvote", function(uuid) {
      console.log("downvote", uuid)
      songs[uuid].votes--;
      songs[uuid].haveVoted = false;
    });
    subscribe("play", function(uuid) {
      console.log("play", uuid);
    });
      
    return this;
  }

  var subscribe = function(type, cb) {
    observers.push(function(msg) {
      if(msg.action == type)
        cb(msg.data)
    });
  }

  return {
    init: function () {
      var urlArr = window.location.toString().split('/');
      var id = urlArr[urlArr.length-1];
      id = id.replace('.','-');
  
      var cfg = {
        host: 'localhost',
        port: 9000
      };
  
      peer = new Peer(id, cfg);
      peer.on('open', function(){
        client = new Raft(peer, _handleRaftMessage, Raft.states.leader);
        console.log(client.id, id);
        client.join(id);
      }.bind(this));
      peer.on('error', function(err) {
        peer = new Peer(null, cfg);
        peer.on('open', function(){
          client = new Raft(peer, _handleRaftMessage)
          console.log(client.id, id);
          client.join(id);
        });
      });
        
      _initCallbacks()
    },
  
    add: function (obj) {
      _sendMessage('add', obj);
    },
  
    upvote: function (uuid) {
      _sendMessage("upvote", uuid);
    },
  
    downvote: function (uuid) {
      _sendMessage("downvote", uuid);
    },
  
    play: function (uuid) {
      _sendMessage("play", uuid);
    }
  }
})();
