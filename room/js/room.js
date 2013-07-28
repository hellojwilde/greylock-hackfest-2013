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
  //code
}

var SearchEngines = {
  peer: function () {
    return
  },

  youtube: function () {

  },

  soundcloud: function () {

  }
};

function NextCtrl($scope) {
  /* Search */

  $scope.isSearching = false;
  $scope.searchQueryText = "";
  $scope.searchQueries = [];
  $scope.searchResults = [];

  $scope.modifySearch = function () {
    if ($scope.searchQuery == "") {
      $scope.endSearch();
    }

    $scope.isSearching = true;
  };

  $scope.endSearch = function () {
    $scope.searchQueries.forEach(function (aQuery) {
      aQuery.cancel();
    });
    $scope.isSearching = false;
  };

  /* Queue */

  $scope.results = function () {
    [];
  }

  /* Song */

  $scope.upvote = function (aId) {
    // XXX bump votes up
  };

  $scope.downvote = function (aId) {
    // XXX bump votes down
  };

  $scope.enqueue = function (aId) {
    // XXX add to queue, upvote
  };

  /* Upload */

  // XXX todo
}