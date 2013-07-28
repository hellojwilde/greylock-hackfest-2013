var dprm = angular.module('dprm', []);

dprm.directive('song', function () {
  return {
    restrict: 'E',
    transclude: false,
    scope: { song: "=boundSong", },
    controller: function ($scope, $element) {
      $scope.upvote = function (aId) {
        // XXX bump votes up
      };

      $scope.downvote = function (aId) {
        // XXX bump votes down
      };

      $scope.enqueue = function (aId) {
        // XXX add to queue, upvote
      };
    },
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

function initSoundCloudSearch() {
  SC.initialize({
    client_id: '959ac7f0a5f44a4934896183faab5a2d'
  });

  return function(queryString) {
    var deferred = when.defer();

    SC.get('/tracks', { q: queryString }, function(tracks, err) {
      if (err != null) {
        return deferred.reject(err);
      }
      // display artwork_url?
      tracks = tracks.filter(function(t) {
        return t.streamable;
      }).map(function(t) {
        return {
          uuid: t.id,
          name: t.title,
          thumbnail: t.artwork_url,
          isQueued: false,
          votes: 0,
          haveVoted: false,
          sourceType: 'soundcloud',
          source: t.permalink_url,
        };
      });
      deferred.resolve(tracks);
    });

    return deferred.promise;
  }
}

var SearchEngines = {
  peer: function () {
    return
  },

  youtube: function (queryString) {
    var deferred = when.defer();

    var url = "https://gdata.youtube.com/feeds/api/videos?q=" + encodeURIComponent(queryString) + "&max-results=10&v=2&alt=json";
    $.ajax({
      url: url,
      dataType: 'json',
      success: function(data) {
        deferred.resolve(data.feed.entry.map(function (t) {
          return {
            uuid: t.media$group.yt$videoid.$t,
            name: t.title.$t,
            thumbnail: t.media$group.media$thumbnail[0].url, // can pick other sizes too
            isQueued: false,
            votes: 0,
            haveVoted: false,
            sourceType: 'youtube',
            source: t.media$group.media$player.url,
          };
        }));
      },
      error: function(jqXHR, textStatus, errorThrown) {
        deferred.reject(textStatus);
      }
    });

    return deferred.promise;
  },

  soundcloud: initSoundCloudSearch()
};

window.SearchEngines = SearchEngines; // for console debugging

function NowCtrl($scope) {
  $scope.song = null;
}

function NextCtrl($scope, SongService) {
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

function name(args) {
  //code
}
