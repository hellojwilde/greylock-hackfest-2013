/**
 * DPRM
 */

window.Dprm = Ember.Application.create();

/* Routes */
Dprm.Router.map(function () {
  /* XXX an index route is created automagically */

  this.resource('room', { path: '/room/:room_id' }, function () {
    this.route('add');
  });

  /* TODO <jwilde>: add more routes for favorites and the like */
});

/* Models */

/* Controllers */