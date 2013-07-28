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

function NowCtrl($scope, SongService) {
  //get/send a playing update
  $scope.playing = {};
  $scope.playing.name = "Nothing's playing!";
}

function NextCtrl($scope, SongService) {
  //send an add update
  $scope.$parent.isSearching = false;
}

function QueueController($scope, SongService) {
  //get/send queue updates
  $scope.queue = function () {
    return [];
  };
}

function NextSearchCtrl($scope, SongSearchService, YouTubeSearchService,
                        SoundCloudSearchService) {
  $scope.queryText = "";
  $scope.results = { songs: [], youtube: [], soundcloud: [] };

  $scope.editSearch = function () {
    if ($scope.queryText.length > 0) {
      var fetch = function (aResultArea, aSearchService) {
        aSearchService.search($scope.queryText).then(function (aResultSet) {
          aResultArea.forEach(() => aResultArea.pop());
          aResultSet.forEach((aItem) => aResultArea.push(aItem));
        });
      };

      fetch($scope.results.songs, SongSearchService);
      fetch($scope.results.youtube, YouTubeSearchService);
      fetch($scope.results.soundcloud, SoundCloudSearchService);

      $scope.$parent.isSearching = true;
    } else {
      $scope.$parent.isSearching = false;
    }
  };

  $scope.endSearch = function () {
    $scope.$parent.isSearching = false;
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
