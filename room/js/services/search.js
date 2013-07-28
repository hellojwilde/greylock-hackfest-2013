var SongSearch = {
  _SongService: null,
  init: function (SongService) {
    this._SongService = SongService;
    return this;
  },

  search: function (aQueryString) {
    var deferred = when.defer();



    return deferred.promise;
  }
};

var YouTubeSearch = {
  init: function () {
    return this;
  },

  search: function (aQueryString, aMaxResults) {
    var deferred = when.defer();
    var maxResults = aMaxResults || 3;
    var url = "https://gdata.youtube.com/feeds/api/videos?q=" +
                encodeURIComponent(aQueryString) + "&max-results=" +
                encodeURIComponent(maxResults) + "&v=2&alt=json";

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
  }
};

var SoundCloudSearch = {
  init: function () {
    SC.initialize({
      client_id: '959ac7f0a5f44a4934896183faab5a2d'
    });

    return this;
  },

  search: function (aQueryString, aMaxResults) {
    var maxResults = aMaxResults || 3;
    var deferred = when.defer();

    SC.get('/tracks', { q: aQueryString }, function(tracks, err) {
      if (err != null) {
        return deferred.reject(err);
      }
      // display artwork_url?
      tracks = tracks.filter(function(t) {
        return t.streamable && maxResults >= 0;
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
};