/**
 * DPRM
 */

window.Dprm = Ember.Application.create();

/* Routes */
Dprm.Router.map(function () {
  // XXX an index route is created automagically

  this.resource('room', { path: '/room/:room_id' }, function () {
    this.route('add');
  });

  // TODO <jwilde>: add more routes for favorites and the like
});

/* Store & Models */

Dprm.Store = DS.Store.extend({
  revision: 13,
  adapter: DS.FixtureAdapter.create()
});

// represents an arbitrary song. displayed by song view.
Dprm.SongModel = DS.Model.extend({
  option: DS.belongsTo("Dprm.OptionModel"),

  albumName: DS.attr("string"),
  albumCover: DS.attr("string"), // data: url with an image
  name: DS.attr("string"),

  location: DS.attr("string")    // some sort of URI-type construct for
                                 // where a song is currently.
});

// represents a song that's up for voting. contains a song.
Dprm.OptionModel = DS.Model.extend({
  song: DS.belongsTo("Dprm.SongModel"),
  votes: DS.attr("number")
});

/* Views */
Dprm.SongView = Ember.View.extend({
  templateName: "view-song"
});

/* Controllers */