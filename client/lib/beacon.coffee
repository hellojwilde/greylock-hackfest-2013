"use strict"

class Beacon
  constructor: (@peer) ->
    _.extend @, new EventEmitter

  broadcast: (data) ->
    throw new Error "Beacon.broadcast: not implemented"

  _prepare: (data, isBroadcast = true) ->
    {
      id: "#{@peer.id}_#{_.uniqueId()}"
      data: data
      isBroadcast: isBroadcast
    }

class LeaderBeacon extends Beacon
  followers: {} # remote-uuid -> connection

  constructor: (@peer) ->
    @peer.on "connection", @_handleConnOpen.bind(@)

  broadcast: (data) ->
    @sendToFollowers data, false

  sendToFollowers: (data, from) ->
    others = _.reject @followers, (v, k) -> k is from
    msg = @_prepare data
    conn.send msg for peer, conn of others

  _handleConnOpen: (conn) ->
    @followers[conn.peer] = conn
    conn.on "data", @_handleConnData.bind(@, conn)
    conn.on "close", @_handleConnClose.bind(@)

  _handleConnClose: (conn) ->
    delete @followers[conn.peer]

  _handleConnData: (conn, msg) ->
    @sendToFollowers details, conn
    @trigger "data", msg.data

class FollowerBeacon extends Beacon
  constructor (@peer, @conn) ->
    @conn.on "data", @_handleConnData.bind(@)

  broadcast: (data) ->
    msg = @_prepare data, true
    @conn.send msg

  sendToLeader: (data) ->
    msg = @_prepare data, dalse
    @conn.send msg

  _handleConnData: (msg) ->
    @trigger "data", msg.data

BeaconSingleton =
  config: (@id, @net, @conn) ->

  get: ->
    if not @id?
      throw new Error "BeaconSingleton.get: no configuration set"

    if not @promise?
      def = Q.defer()
      @promise = def.promise

      peer = new Peer @id, @net
      peer.on "open", () -> def.resolve(new Leader peer);
      peer.on "error", (error) =>
        switch error.type
          when "unavailable-id"
            peer = new Peer null, @net
            conn = peer.connect @id, @conn
            peer.on "open", () -> def.resolve(new Follower peer, conn)
            peer.on "error", (error) -> def.reject error
          else def.reject error

    @promise