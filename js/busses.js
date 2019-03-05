const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Busses = {
  create( Audio ) {
    const busses = {}

    const busDescription = { 
      properties:Gibberish.Bus.defaults,
      methods:null,
      name:'Bus',
      category:'misc'
    }

    busses.Bus = Ugen( Gibberish.Bus, busDescription, Audio )
    busses.__Bus = function( ...args ) {
      let props
      if( args.length > 1 || args.length === 1 && typeof args[0] !== 'string' ) {
        props = { inputs:args }
      }else if( args.length === 1 ) {
        props = args[0]
      }
      
      return props !== undefined ? busses.__Bus( props ) : busses.__Bus()
    }

    const bus2Description = { 
      properties:Gibberish.Bus2.defaults,
      methods:null,
      name:'Bus2',
      category:'misc'
    }

    busses.Bus2 = Ugen( Gibberish.Bus2, bus2Description, Audio )
    busses.__Bus2 = function( ...args ) {
      let props
      if( args.length > 1 || (args.length === 1 && typeof args[0] !== 'string' && args[0].type !== 'ensemble' )) {
        props = { inputs:args }
      }else if( args.length === 1 ) {
        props = args[0]
      }
      
      return props !== undefined ? busses.__Bus2( props ) : busses.__Bus2()
    }

    return busses
  }
}

module.exports = Busses
