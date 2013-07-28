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
        //'<img src="{{song.thumbnail}}" alt="{{song.name}}"/>' +
        '<p class="name">{{song.name}}</p>' +

        '<div class="voting">' +
          '<div class="voting-buttons" ng-hide="{{song.haveVoted}}">' +
            '<button class="voting-up" ng-click="upvote(song)">Up</button>' +
            '<button class="voting-down" ng-click="downvote(song)">Down</button>' +
          '</div>' +
          '<p class="votes">{{song.votes}}</p>' +
        '</div>' +
      '</div>'
  };
});