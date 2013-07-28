angular.module('dprm', []).
  directive('song', function () {
    return {
      restrict: 'E',
      transclude: false,
      scope: {},
      template:
        '<div class="song">' +
          '<img src="{{song.thumbnail}}" alt="{{song.name}}"/>' +
          '<p class="name">{{song.name}}</p>' +

          '<div class="voting" ng-show="{{song.isQueued}}">' +
            '<div class="voting-buttons" ng-hide="{{song.haveVoted}}">' +
              '<button class="voting-up">Up</button>' +
              '<button class="voting-down">Down</button>' +
            '</div>' +
            '<p class="votes">{{song.votes}}</p>' +
          '</div>' +

          '<div class="queuing" ng-hide="{{song.isQueued}}">' +
            '<button class="queue" ng-click="enqueue({{song}})">Add to Queue</button>' +
          '</div>' +
        '</div>'
    }
  })

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

  $scope.upvote = function (aId) {
    // XXX bump votes up
  };

  $scope.downvote = function (aId) {
    // XXX bump votes down
  };

  $scope.enqueue = function (aId) {
    // XXX add to queue, upvote
  };
}

function NextQueueCtrl($scope) {
  $scope.queued = function () {

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
    }
  };

  $scope.resetSearch = function() {
    $scope.searchQueries.forEach((aQuery) => aQuery.cancel());
    $scope.results = [];
  }

  $scope.endSearch = function () {
    $scope.resetSearch();
    $scope.isSearching = false;
  };
}