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
  //get/send a playing update
  $scope.playing = {};
  $scope.playing.name = "Nothing's playing!";
}

function NextQueueCtrl($scope, SongService) {
  $scope.songPlaying = null;
  $scope.songs = [];
  $scope.songsById = {}; // index for $scope.songs

  var obs = { observe: function (aAction, aData) {
    switch (aAction) {
      case "play":
        $scope.songPlaying = $scope.songsById[aData];
        break;
      case "upvote":
        $scope.songsById[aData].votes++;
        break;
      case "downvote":
        $scope.songsById[aData].votes--;
        break;
      case "add":
        $scope.songs.push($scope.songsById[aData.uuid] = aData);
        $scope.$apply();
        break;
    }
  } };
  SongService.addObserver(obs);
}

Dropzone.autoDiscover = false;
function NextUploadCtrl($scope, SongService) {
  $scope.dropped = {};

  $scope.dropzone = new Dropzone("#uploader");
  $scope.dropzone.on("addedfile", function (aFile) {
    var uuid = aFile.name;

    SongService.add({
      uuid: uuid,
      name: aFile.name,
      votes: 1
    });

    $scope.dropped[uuid] = aFile;

    aFile.status = Dropzone.SUCCESS;
  });

  /*$scope.observe = function (aAction, aData) {
    switch (aAction) {
      case "add":
        var file = $scope.dropped[aData.uuid];
        $scope.dropzone.removeFile(file);
        delete $scope.dropped[aData.uuid];
        break;
    }
  };
  SongService.addObserver($scope);*/
}
