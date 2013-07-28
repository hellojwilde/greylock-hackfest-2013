$(function() {

  var audioBlob = null;
  $('#audio').hide(); // FF complains if we do this as a CSS decl and try and change it later

  Dropzone.options.uploader = {
    init: function() {
      this.on('addedfile', function(file) {
        audioBlob = file;
      });
    },
    autoProcessQueue: false
  };

  $('#connect-btn').click(function() {
    var peer = new Peer($('#me').val(), {host: 'localhost', port: 9000});

    peer.on('connection', function(conn, meta){
      conn.on('data', function(data) {
        console.log('ok')
        var audioElem = $('#audio');
        audioElem.show()
        audioElem.attr('src', URL.createObjectURL(new Blob([data])));
        audioElem[0].play()
      });
    });

    peer.on('error', function(err){
      console.error(err);
    });

    var them = $('#them').val();
    if (them !== '') {
      var conn = peer.connect(them);
      conn.on('open', function() {
        conn.send(audioBlob);
      });
    }

  });

});
