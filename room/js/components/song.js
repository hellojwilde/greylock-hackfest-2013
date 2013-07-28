dprm.directive('song', function () {
  return {
    restrict: 'E',
    transclude: false,
    scope: { song: "=boundSong", },
    controller: function ($scope, $element, SongService) {
      $scope.upvote = function (aId) {
        SongService.upvote(aSong)
      };

      $scope.downvote = function (aSong) {
        SongService.downvote(aSong)
      };

      $scope.enqueue = function (aSong) {
        SongService.add(aSong);
      };
    },
    template:
      '<div class="song">' +
        '<img src="{{song.thumbnail}}" alt="{{song.name}}"/>' +
        '<p class="name">{{song.name}}</p>' +

        '<div class="voting" ng-show="{{song.isQueued}}">' +
          '<div class="voting-buttons" ng-hide="{{song.haveVoted}}">' +
            '<button class="voting-up success button" ng-click="upvote(song.uuid)">Up</button>' +
            '<button class="voting-down alert button" ng-click="downvote(song.uuid)">Down</button>' +
          '</div>' +
          '<p class="votes">{{song.votes}}</p>' +
        '</div>' +

        '<div class="queuing" ng-hide="{{song.isQueued}}">' +
          '<button class="queue" ng-click="enqueue(song)">Add to Queue</button>' +
        '</div>' +
      '</div>'
  };
});