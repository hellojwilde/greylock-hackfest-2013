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

$('#audio').hide();

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
    if (Object.keys(Songs._client.peers).length === 0 &&
        Songs._client.state === Raft.states.leader) {
      console.log('I am the sole user in the room');
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

function play(uuid) {
  console.log('trying to play', uuid)
}

$('#play').click(function() {
  theSongs.sort(function(a,b) { return b.votes > a.votes; });
  var aud = $('#audio');
  aud.attr('src', URL.createObjectURL(songDataCollection[theSongs[0].uuid]));
  aud.show();
  aud[0].play();
});
