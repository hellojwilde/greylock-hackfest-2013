var Songs = {
  _observers: [],
  _peer: null,
  _client: null,

  songs: {},

  init: function () {
    var urlArr = window.location.toString().split('/');
    var id = urlArr[urlArr.length-1];
    id = id.replace('.','-');

    var cfg = {
      host: 'ec2-54-215-180-78.us-west-1.compute.amazonaws.com',
      port: 9000
    };

    this._peer = new Peer(id, cfg);
    console.log('connecting: ', this._peer);

    this._peer.on('error', function(err) {
      this._peer = new Peer(null, cfg);

      this._peer.on('open', function(){
        this._client = new Raft(this._peer, this._handleRaftMessage.bind(this));
        console.log(this._client.id, id);
        this._client.join(id);

        // XXX test code
        this._client.send({action:"upvote",uuid:"9070-8909"});
      }.bind(this));
    }.bind(this));

    this._peer.on('open', function(){
      this._client = new Raft(this._peer, this._handleRaftMessage.bind(this),
                              Raft.states.leader);
      console.log(this._client.id, id);
      this._client.join(id);
    }.bind(this));

    return this;
  },

  addObserver: function (aObserver) {
    this._observers.push(aObserver);
  },

  fireObserver: function (aMessage, aData) {
    this._observers.forEach((aObserver) => aObserver.observe(aMessage, aData));
  },

  add: function (obj) {
    this.songs[obj.uuid] = obj;
    this._client.send({
      action: 'add',
      obj: obj
    });
  },

  upvote: function (uuid) {
    this.songs[uuid].votes++;
    this.songs[uuid].haveVoted = true;
    this._sendMessage("upvote", uuid);
  },

  downvote: function (uuid) {
    this.songs[uuid].votes--;
    this.songs[uuid].haveVoted = true;
    this._sendMessage("downvote", uuid);
  },

  play: function (uuid) {
    this._sendMessage("play", uuid);
  },

  _sendMessage: function (action, uuid) {
    this._client.send({
      action: action,
      uuid: uuid
    });
  },

  _handleRaftMessage: function (data) {
    console.log('data: ', data);
    if (data.action){
      switch(data.action){
        case "add":
          console.log("adding");
          this.songs[data.obj.uuid] = data.obj;
          this.fireObserver(data.action, data.obj);
          break;
        case "upvote":
          console.log("upvoting");
          this.songs[data.uuid].votes++;
          this.fireObserver(data.action, data.uuid);
          break;
        case "downvote":
          console.log("downvoting");
          this.songs[data.uuid].votes--;
          this.fireObserver(data.action, data.uuid);
          break;
        case "play":
          console.log("playing");
          this.fireObserver(data.action, data.uuid);
          break;
        default:
          console.warn("unknown action: " + data.action);
          break;
      }
    }
  }
};