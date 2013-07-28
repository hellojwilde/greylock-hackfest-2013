var Songs = {
  _observers: [],
  _peer: null,
  _client: null,

  init: function () {
    var urlArr = window.location.toString().split('/');
    var id = urlArr[urlArr.length-1];
    id = id.replace('.','-');

    var cfg = {
      host: 'localhost',
      port: 9000
    };

    this._peer = new Peer(id, cfg);
    this._peer.on('open', function(){
      this._client = new Raft(this._peer,
			      this._handleRaftMessage.bind(this),
                              Raft.states.leader);
      console.log(id);
    }.bind(this));
    this._peer.on('error', function(err) {
      this._peer = new Peer(null, cfg);
      this._peer.on('open', function(){
        this._client = new Raft(this._peer, this._handleRaftMessage.bind(this));
        console.log(this._client.id, id);
        this._client.join(id);
      }.bind(this));
    }.bind(this));

    return this;
  },

  addObserver: function (aObserver) {
    this._observers.push(aObserver);
  },

  fireObserver: function (aAction, aData) {
    this._observers.forEach((aObserver) => aObserver(aAction, aData));
  },

  add: function (aSong) {
    this._sendMessage('add', aSong);
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

  _sendMessage: function (aAction, aData) {
    this._client.send({
      action: aAction,
      data: aData
    });
  },

  _handleRaftMessage: function (msg) {
    this.fireObserver(msg.action, msg.data);
  }
};
