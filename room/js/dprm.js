var dprm = angular.module('dprm', [], function ($provide) {
  /* Song storage backends. */
  $provide.factory('SongService', Songs.init.bind(Songs));

  /* Individual search backends. */
  $provide.factory('SongSearchService',
                   ['SongService', SongSearch.init.bind(SongSearch)]);
  $provide.factory('YouTubeSearchService',
                   YouTubeSearch.init.bind(YouTubeSearch));
  $provide.factory('SoundCloudSearchService',
                   SoundCloudSearch.init.bind(SoundCloudSearch));
});

/**
 * schema for a song:
 * {
 *   uuid: <String>,
 *   name: <String>,
 *   thumbnail: <String>, (data: url)
 *   isQueued: <Boolean>,
 *   votes: <Number>,
 *   haveVoted: <Boolean>,
 *   sourceType: <String> ["peer"|"youtube"|"soundcloud"],
 *   source: <String> (URL or computer ID)
 * }
 */

function NowCtrl($scope, SongService) {
  $scope.$parent.songPlaying = null;
}

var theSongs;

function NextQueueCtrl($scope, SongService) {
  $scope.$parent.songPlaying = null;
  $scope.$parent.isQueue = false;
  $scope.songs = [];
  theSongs = $scope.songs; // XXX let this escape the fn
  $scope.songsById = {}; // index for $scope.songs

  SongService.addObserver(function (aAction, aData) {
    switch (aAction) {
      case "play":
        $scope.$parent.songPlaying = $scope.songsById[aData];
        break;
      case "upvote":
        $scope.songsById[aData].votes++;
        break;
      case "downvote":
        $scope.songsById[aData].votes--;
        break;
      case "add":
        if (!$scope.songsById[aData.uuid]) {
          $scope.songs.push($scope.songsById[aData.uuid] = aData);
          $scope.$parent.isQueue = true;
        }
        break;
    }

    $scope.$apply();
  });
}

var songDataCollection = {};
Dropzone.autoDiscover = false;
function NextUploadCtrl($scope, SongService) {
  var dropped = {};

  $scope.dropzone = new Dropzone(document.body, {
    url: "/room/upload",
    previewsContainer: "#upload-previews",
    clickable: "#upload-clickable"
  });

  $scope.dropzone.on("addedfile", function (aFile) {
    var uuid = Math.random();
    aFile.status = Dropzone.SUCCESS;
    dropped[uuid] = aFile;

    SongService.add({
      uuid: uuid,
      name: aFile.name,
      votes: 1
    });

    var urlArr = window.location.toString().split('/');
    var id = urlArr[urlArr.length-1];
    id = id.replace('.', '-');
    console.log('I am', Songs._client.id);
    if (id === Songs._client.id) {
      console.log('Adding the song data to myself');
      songDataCollection[uuid] = aFile;
    } else {
      console.log('Should send file to', id);
      var conn = Songs._client.peers[id].conn;
      Songs._client.sendto(id,{
        type: "songData",
        uuid: uuid,
        data: aFile
      });
    }
  });

  SongService.addObserver(function (aAction, aData) {
    switch (aAction) {
      case "add":
        console.log('observed add');
        var file = dropped[aData.uuid];
        if(file) {
          $scope.dropzone.removeFile(file);
        }
        break;
    }
  });
}

function addSongData(uuid, data) {
  console.log('adding song data')
  songDataCollection[uuid] = new Blob([data]);
}

var playBtnState;
var playIdx = 0;

function justPlay() {
  theSongs.sort(function(a,b) { return b.votes > a.votes; });
  var aud = $('#audio');
  if (playIdx > theSongs.length) playIdx = 0;
  aud.attr('src', URL.createObjectURL(songDataCollection[theSongs[playIdx].uuid]));
  aud[0].play();
  $("#now").attr("playing", "true");
  $('#play').text('Pause that music >:(');
  playBtnState = 'PLAY';
}

$('#play').click(function() {
  if (playBtnState !== 'PLAY') {
    theSongs.sort(function(a,b) { return b.votes > a.votes; });
    var aud = $('#audio');
    aud.attr('src', URL.createObjectURL(songDataCollection[theSongs[playIdx].uuid]));
    aud[0].play();

    $('#play').text('Pause that music >:(');
    playBtnState = 'PLAY';
    justPlay();
  } else {
    var aud = $('#audio');
    aud[0].pause();
    $("#now").attr("playing", "false");
    $('#play').text('Play that music');
    playBtnState = 'PAUSE';
  }
});

$('#skip').click(function() { playIdx++; justPlay(); });

aud.addEventListener('ended', function() { playIdx++ });
