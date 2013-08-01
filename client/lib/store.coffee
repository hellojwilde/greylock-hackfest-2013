"use strict"

class Store
  collections: {} # collection-id -> object-uuid -> data

  constructor: (@beacon, @directives = {}) ->
    _.extend @, new EventEmitter

  create: ->

  read: ->

  update: ->

  delete: ->

class Directive
  constructor: ->

StoreSingleton =
  config: (@beacon) ->

  get: ->