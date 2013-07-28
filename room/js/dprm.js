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

function NextSearchCtrl($scope, SongSearchService, YouTubeSearchService,
                        SoundCloudSearchService) {
  $scope.queryText = "";
  $scope.results = [];

  $scope.editSearch = function () {
    $scope.results = [];

    if ($scope.queryText.length > 0) {
      var query = $scope.queryText;
      var queries = [SongSearchService.search(query),
                     YouTubeSearchService.search(query),
                     SoundCloudSearchService.search(query)];
      var uniqueUUIDs = {};

      when.any(queries, function (aResultSet) {
        aResultSet.forEach(function (aResult) {
          if (uniqueUUIDs[aResult.uuid]) {
            return;
          }

          uniqueUUIDs[aResult.uuid] = true;
          $scope.results.push(aResult);
        });
      });

      $scope.isSearching = true;
    } else {
      $scope.isSearching = false;
    }
  };

  $scope.endSearch = function () {
    $scope.isSearching = false;
  };
}

// Dropzone

Dropzone.options.uploader = {
  autoProcessQueue: false
};

// some mock values
var Messager = {
  getPlayerId: function() { return '{{player}}' },
  getId: function() { return 1;},
  getPeer: function() {
    if (!Messager._peer) {
      Messager._peer = new Peer($('#me').val(), {host: 'localhost', port: 9000});
    }
    return Messager._peer;
  },
};

function NextUploadCtrl($scope) {
  $scope.upload = function () {
    var uploader = Dropzone.instances[0];
    if (!uploader) throw new Error('wat');

    var peer = Messager.getPeer();
    if (Messager.getPlayerId() != Messager.getId()) {
      var conn = peer.connect(Messager.getPlayerId());
      conn.on('open', function() {
        uploader.files.forEach(function(f) {
          console.log('trying to send', f)
          conn.send(f);
          f.status = Dropzone.SUCCESS;
        });
      });
      conn.on('error', function(err) {
        console.error(err);
      });
    }
  }
}
