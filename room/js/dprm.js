var dprm = angular.module('dprm', [], function ($provide) {
  /* Song storage backends. */
  $provide.factory('SongService', () => Songs.init());

  /* Individual search backends. */
  $provide.factory('SongSearchService', ['SongService', SongSearch.init]);
  $provide.factory('YouTubeSearchService', YouTubeSearch.init);
  $provide.factory('SoundCloudSearchService', SoundCloudSearch.init);

  /* Search backend that interleaves. */
  Search.init.$inject = ['SongSearchService', 'YouTubeSearchService',
                         'SoundCloudSearchService'];

  $provide.factory('SearchService', Search.init);
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

function NowCtrl($scope) {
  $scope.song = null;
}

function NextCtrl($scope) {
  $scope.isSearching = false;
}

function NextQueueCtrl($scope) {
  $scope.queue = function () {
    // XXX pull from service
    return [];
  };
}

function NextSearchCtrl($scope) {
  $scope.queryText = "";
  $scope.queries = [];
  $scope.results = [];

  $scope.editSearch = function () {
    $scope.resetSearch();

    if ($scope.queryText.length > 0) {
      $scope.isSearching = true;

      // XXX kick off the new search
    } else {
      $scope.isSearching = false;
    }
  };

  $scope.resetSearch = function() {
    $scope.queries.forEach((aQuery) => aQuery.cancel());
    $scope.results = [];
  }

  $scope.endSearch = function () {
    $scope.resetSearch();
    $scope.isSearching = false;
  };
}

// Dropzone

Dropzone.options.uploader = {
  autoProcessQueue: false
};

function NextUploadCtrl($scope) {
  var uploader = Dropzone.instances[0];
  if (!uploader) throw new Error('wat');
  uploader.files.forEach(function(f) { f.status = Dropzone.SUCCESS; });
}
