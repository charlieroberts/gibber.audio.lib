const optional = true,
      required = true,
      mixins   = require( './audio_mixins.js' )

const defs = [
  require( './instruments/fm_def.js' ),
  require( './instruments/pluck_def.js' ),
  require( './instruments/monosynth_def.js' ),
  require( './instruments/synth_def.js' ),

  require( './instruments/clave_def.js' ),
  require( './instruments/clap_def.js' ),
  require( './instruments/cowbell_def.js' ),
  require( './instruments/kick_def.js' ),
  require( './instruments/snare_def.js' ),
  require( './instruments/hat_def.js' ),
  
  require( './instruments/drums_def.js' ),
  require( './instruments/edrums_def.js' ),

  require( './instruments/sampler.js' ),
  require( './instruments/freesound.js' )
]

defs.forEach( v => {
  if( v.mixins !== undefined ) {
    for( let key of v.mixins ) {
      Object.assign( v.properties, mixins[ key ] )
    }
    delete v.mixins
  }
})

defs.forEach( v => v.constructorDoc = `Constructor for a ${v.name} instrument. The constructor can accept two types of arguments: pass an object specifying property values for the new object, or, pass a preset name and an optional object containing modifications to the preset.` )

module.exports = defs
