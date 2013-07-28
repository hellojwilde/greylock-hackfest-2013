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

function NextQueueCtrl($scope, SongService) {
  $scope.$parent.songPlaying = null;
  $scope.songs = [];
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

Dropzone.autoDiscover = false;
function NextUploadCtrl($scope, SongService) {
  var dropped = {};

  $scope.dropzone = new Dropzone("#uploader");
  $scope.dropzone.on("addedfile", function (aFile) {
    var uuid = Math.random();
    aFile.status = Dropzone.SUCCESS;
    dropped[uuid] = aFile;

    SongService.add({
      uuid: uuid,
      name: aFile.name,
      votes: 1
    });
  });

  SongService.addObserver(function (aAction, aData) {
    switch (aAction) {
      case "add":
        console.log('observed add');
        var file = dropped[aData.uuid];
        if(file) $scope.dropzone.removeFile(file);
        $scope.dropzone.removeFile(file);
        var urlArr = window.location.toString().split('/');
        var id = urlArr[urlArr.length-1];
        id = id.replace('.', '-');
        if (Songs._client.state === Raft.states.leader) {
          console.log('wat')
          // XXX some stuff
        } else {
          var conn = Songs._client.peers[id].conn;
          conn.on('open', function() {
            console.log('sending file');
            conn.send(file);
          });
        }
        break;
    }
  });
}
