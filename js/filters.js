const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const filterNames = [
  "none", "Filter24Moog", "Filter24TB303", "Filter12SVF", "Filter12Biquad", "Filter24Classic"
]

const Filters = {
  create( Audio ) {
    const filters = {}

    for( let filterName in Gibberish.filters ) {
      const gibberishConstructor = Gibberish.filters[ filterName ]

      const methods = Filters.descriptions[ filterName ] === undefined ? null : Filters.descriptions[ filterName ].methods
      const description = { 
        properties:gibberishConstructor.defaults || {}, 
        methods:methods,
        name:filterName,
        category:'effects'
      }
      description.__defaults__ = { isStereo : true }
      description.properties.isStereo = true
      description.properties.type = 'fx'

      filters[ filterName ] = Ugen( gibberishConstructor, description, Audio, false )
    }

    filters.LPF = filters.Filter24Moog

    filters.Filter = function( props ) {
      if( props === undefined ) props = { model: 1 }
      if( props.model === undefined ) props.model = 1

      const name = filterNames[ props.model ]

      delete props.model

      return filters[ name ]( props ) 
    }

    const description = { 
      properties: Object.assign( {}, Gibberish.filters[ 'Filter12Biquad' ].defaults, { mode:1 } ),
      methods:null,
      name:'HPF',
      category:'effects',
      __defaults__: { mode:1 }
    }
   
    filters.HPF = Ugen( Gibberish.filters[ 'Filter12Biquad' ], description, Audio, false )

    return filters
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Filters
