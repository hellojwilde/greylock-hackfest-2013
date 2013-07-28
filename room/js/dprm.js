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
  // song list
  $scope.songs = [];
  $scope.songsById = {};

  $scope.observe = function (aAction, aData) {
    console.log(aData);
    switch (aAction) {
      case "upvote":
        $scope.songsById[aData].votes++;
        break;
      case "downvote":
        $scope.songsById[aData].votes--;
        break;
      case "add":
        $scope.songs.push($scope.songsById[aData.uuid] = aData);
        break;
    }

    $scope.$apply();
  };
  SongService.addObserver($scope);
}

Dropzone.autoDiscover = false;
function NextUploadCtrl($scope, SongService) {
  $scope.dropzone = new Dropzone("#uploader");
  $scope.dropzone.on("addedfile", function (aFile) {
    SongService.add({
      uuid: aFile.name,
      name: aFile.name,
      votes: 1
    });
    aFile.status = Dropzone.SUCCESS;
  });
}
