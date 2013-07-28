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

function NextCtrl($scope) {
  $scope.queue = function () {
    // XXX put real data here
    return [
      {
        uuid: "fasdf",
        name: "test song",
        isQueued: true,
        votes: 4,
        haveVoted: true
      },
      {
        uuid: "fasdf",
        name: "test song 43",
        isQueued: true,
        votes: 2,
        haveVoted: false
      }
    ];
  };

  $scope.query = "";
  $scope.isSearching = function () {
    return $scope.query.length > 0;
  };

  $scope.searchResults = [];
  $scope.beginSearch = function () {
    $scope.query = "";
  };
  $scope.endSearch = function () {
    $scope.query = "";
  };
}