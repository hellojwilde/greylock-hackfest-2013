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

function SongsCtrl($scope) {
  $scope.songs = {};

  // XXX set up raft here
};

function NowCtrl($scope) {
  // XXX player code here
}

function NextCtrl($scope) {
  $scope.isSearching = false;
}

function QueueCtrl($scope) {
  $scope.getItems = function () {
    let items = [];

  }
};

function SearchCtrl($scope) {
  $scope.search = "";
  $scope.searchResults = [];

  $scope.isSearchActive = function () {
    return $scope.search.length > 0;
  }

  $scope.beginSearch = function () {
    // TODO async
  };

  $scope.cancelSearch = function () {
    $scope.search = "";

    // TODO async
  };
}

function UploadCtrl($scope) {

}