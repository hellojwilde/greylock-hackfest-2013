/**
 * DPRM
 */

window.Dprm = Ember.Application.create();

/* Store */

Dprm.Store = DS.Store.extend({
  revision: 13,

  // TODO <jwilde>: add real adapter here
  adapter: DS.FixtureAdapter.create()
});

/* Structure: Song */

Dprm.SongModel = DS.Model.extend({
  votes: DS.attr("number"),
  haveVoted: DS.attr("boolean"),

  location: DS.attr("string"),   // some sort of URI-type construct for
                                 // where a song is currently.

  albumName: DS.attr("string"),
  albumCover: DS.attr("string"), // data: url with an image
  name: DS.attr("string")
});

Dprm.SongModel.FIXTURES = [
  { votes: 5, haveVoted: false, location: "", albumName: "Wootalbum", name: "Wootsong" },
  { votes: 2, haveVoted: true, location: "", albumName: "Wootalbum", name: "Wootsong2" }
];

Dprm.SongView = Ember.View.extend({
  templateName: "view-song"
});

Dprm.SongController = Ember.ObjectController.extend({
  voteUp: function () {
    var model = this.get("model");
    if (model.get("haveVoted")) return;

    model.set("votes", model.get("votes") + 1);
  },

  voteDown: function () {
    var model = this.get("model");
    if (model.get("haveVoted")) return;

    model.set("votes", model.get("votes") - 1);
  }
});

/* Routes */

Dprm.Router.map(function () {
  // XXX an index route is created automagically

  this.resource('room', { path: '/room/:room_id' }, function () {
    this.route('add');
  });

  // TODO <jwilde>: add more routes for favorites and the like
});

/* Routes */

Dprm.Router.map(function () {
  // XXX an index route is created automagically

  this.resource('room', { path: '/room/:room_id' }, function () {
    this.route('add');
  });

  // TODO <jwilde>: add more routes for favorites and the like.
});

/* Route: Index */

Dprm.IndexController = Ember.ObjectController.extend({

});

/* Route: Room  */

Dprm.RoomIndexController = Ember.ObjectController.extend({

})

/* Route: Room - Add Song */

Dprm.RoomAddController = Ember.ObjectController.extend({

});