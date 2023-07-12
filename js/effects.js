const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Effects = {
  create( Audio ) {
    const effects = {}
    const poolEffects = ['Freeverb', 'Plate', 'BufferShuffler']
    Gibberish.effects = Gibberish.fx

    for( let effectName in Gibberish.effects ) {
      const gibberishConstructor = Gibberish.effects[ effectName ]

      const methods = Effects.descriptions[ effectName ] === undefined ? null : Effects.descriptions[ effectName ].methods

      // XXX how do we make this more generic for any model of reverb / any type of distortion etc.
      const replaceName = effectName === 'Freeverb' ? 'Reverb' : effectName 
      const description = { 
        properties:gibberishConstructor.defaults || {}, 
        methods:methods,
        name:replaceName,
        category:'effects'
      }
      description.properties.type = 'fx'

      const shouldUsePool = poolEffects.indexOf( effectName ) > -1 

      effects[ replaceName ] = Ugen( gibberishConstructor, description, Audio, shouldUsePool )
      
      effects[ replaceName ].presets = Audio.Presets.effects[ replaceName ] 
      if( effects[ replaceName ].presets !== undefined ) {
        effects[ replaceName ].presets.inspect = function() {
          console.table( this )
        }
      }else{
        effects[ replaceName ].presets = { inspect() { console.log( `${effectName} has no presets.` ) } }
      }
    }

    return effects
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Effects
