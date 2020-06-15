const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Analysis = {
  create( Audio ) {
    const analysis = {}

    for( let analysisName in Gibberish.analysis ) {
      const gibberishConstructor = Gibberish.analysis[ analysisName ]

      const methods = Analysis.descriptions[ analysisName ] === undefined ? null : Analysis.descriptions[ analysisName ].methods
      const description = { 
        properties: { type:'analysis' },
        name:analysisName,
        methods,
        category:'analysis'
      }

      const constructor = Ugen( gibberishConstructor, description, Audio, false, true )
      analysis[ analysisName ] = function( ...args ) {
        const ugen = constructor( ...args )
        Gibberish.worklet.ugens.set( ugen.id, ugen )
        ugen.out = ugen.__wrapped__.out
        
        if( analysisName === 'Follow' ) {
          let m = ugen.__wrapped__.multiplier || 1
          Object.defineProperty( ugen, 'multiplier', {
            configurable:true,
            get() { return m },
            set(v) { m = v; ugen.__wrapped__.multiplier = m }
          }) 
          let o = ugen.__wrapped__.offset || 0
          Object.defineProperty( ugen, 'offset', {
            configurable:true,
            get() { return o },
            set(v) { o = v; ugen.__wrapped__.offset = o }
          }) 
        }
        return ugen
      } 

    }
    return analysis
  },

  descriptions: {
    //SSD: { methods:[ 'listen' ] }
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Analysis 
