dprm.directive('song', function () {
  return {
    restrict: 'E',
    transclude: false,
    scope: { song: "=boundSong", },
    controller: function ($scope, $element, SongService) {
      $scope.upvote = function (aSong) {
        SongService.upvote(aSong)
      };

      $scope.downvote = function (aSong) {
        SongService.downvote(aSong)
      };
    },
    template:
      '<div class="song">' +
        '<div class="voting">' +
          '<p class="votes">{{song.votes}}</p>' +
          '<div class="voting-buttons" ng-hide="{{song.haveVoted}}">' +
            '<button class="voting-up tiny" ng-click="upvote(song)">&#8593;</button>' +
            '<button class="voting-down tiny" ng-click="downvote(song)">&#8595;</button>' +
          '</div>' +
        '</div>' +
        '<p class="name">{{song.name}}</p>' +
      '</div>'
  };
});