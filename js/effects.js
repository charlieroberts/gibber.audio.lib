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

      effects[ effectName ] = Ugen( gibberishConstructor, description, Audio, shouldUsePool )
      
      effects[ effectName ].presets = Audio.Presets.effects[ effectName ] 
      if( effects[ effectName ].presets !== undefined ) {
        effects[ effectName ].presets.inspect = function() {
          console.table( this )
        }
      }else{
        effects[ effectName ].presets = { inspect() { console.log( `${effectName} has no presets.` ) } }
      }
    }

    effects.Reverb = function( ...args ) {
      let argprops = null
      if( args.length === 1 ) {
        if( typeof args[0] === 'object' ) argprops = args[0]
      }else if( args.length === 2 ) {
        argprops = args[1]
      }
      const props = Object.assign( {}, { model:0 }, argprops )

      let ugen = null
      switch( props.model ) {
        case 0:
        default:
          ugen = effects.Freeverb(...args )
          break;
      }

      return ugen
    }

    return effects
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Effects
