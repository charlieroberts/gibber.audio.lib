const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Binops = {
  create( Audio ) {
    const binops = {}

    for( let binopName in Gibberish.binops ) {
      const gibberishConstructor = Gibberish.binops[ binopName ]

      const methods = Binops.descriptions[ binopName ] === undefined ? null : Binops.descriptions[ binopName ].methods
      const description = { 
        properties:gibberishConstructor.defaults,
        methods:methods,
        name:binopName,
        category:'binops'
      }
      description.properties.type = 'binop'

      const constructor = Ugen( gibberishConstructor, description, Audio, false, true )
      binops[ binopName ] = function( ...args ) {
        const ugen = constructor( ...args )
        ugen[0] = ugen.__wrapped__[0]
        ugen[1] = ugen.__wrapped__[1]

        return ugen
      } 
    }
    return binops
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Binops
