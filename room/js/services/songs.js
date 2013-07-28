var Songs = function(){
  var peer = null;
  var client = null;
  var rcvmsg = function (data) {
    console.log('data: ', data);
    if(data.action){
      switch(data.action){
        case "add":
          console.log("adding");
          retVal.add(data.obj);
          break;
        case "upvote":
          console.log("upvoting");
          retVal.upvote(data.uuid);
          break;
        case "downvote":
          console.log("downvoting");
          retVal.downvote(data.uuid);
          break;
        case "play":
          console.log("playing");
          retVal.play(data.uuid);
          break;
        default:
          console.warn("unknown action");
          break;
      }
    }
  };

  var retVal = {
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
            client.send({action:"upvote",uuid:"9070-8909"});
          });
        });
        peer.on('open', function(){
          client = new Raft(peer, rcvmsg, Raft.states.leader);
          console.log(client.id, id);
          client.join(id);
        });
      return this;
    },

    add: function (obj) {

    },

    upvote: function (uuid) {
      console.log('uuid: ', uuid);
    },

    downvote: function (uuid) {

    },

    play: function (uuid) {

    },

    sendMessage: function(action, uuid){
      client.send({
        action:action,
        uuid:uuid
      });
    },

    addSong: function(obj){
      client.send({
        action: 'add',
        obj:obj
      });
    }
  };
  return retVal;
}();