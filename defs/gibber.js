module.exports = {
  prototypes:  {
    graphics:  require('./graphics/prototypes_defs.js'),
    audio:     require('./audio/prototypes_defs.js'),
  },
  effects:     require('./audio/effects_defs.js'),
  instruments: require('./audio/instruments_defs.js'),
  mixins:      require('./mixins_defs.js'),
  misc:        require('./graphics/misc_defs.js'),
  geometries:  require('./graphics/geometries_defs.js'),
}
