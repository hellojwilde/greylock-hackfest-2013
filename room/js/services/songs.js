var Songs = {
  _observers: [],
  _peer: null,
  _client: null,

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

  fireObserver: function (aAction, aData) {
    this._observers.forEach((aObserver) => aObserver.observe(aAction, aData));
  },

  add: function (aSong) {
    this._client.send({
      action: 'add',
      obj: aSong
    });
  },

  upvote: function (aSong) {
    this._sendMessage("upvote", aSong.uuid);
  },

  downvote: function (aSong) {
    this._sendMessage("downvote", aSong.uuid);
  },

  play: function (aSong) {
    // XXX need to track who's the current player
    this._sendMessage("play", aSong.uuid);
  },

  _sendMessage: function (aAction, aUUID) {
    this._client.send({
      action: aAction,
      uuid: aUUID
    });
  },

  _handleRaftMessage: function (data) {
    if (data.action){
      switch(data.action) {
        case "add":
          this.fireObserver(data.action, data.obj);
          break;
        case "upvote":
          this.fireObserver(data.action, data.uuid);
          break;
        case "downvote":
          this.fireObserver(data.action, data.uuid);
          break;
        case "play":
          this.fireObserver(data.action, data.uuid);
          break;
        default:
          console.warn("unknown action: " + data.action);
          break;
      }
    }
  }
};
