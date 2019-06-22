const Utility = require( '../../../js/utility.js' )
const $ = Utility.create

module.exports = function( Marker ) {
  // Marker.patternMarkupFunctions.tidal( tidalNode, state, tidalObj, container, seqNumber )

  const trimmers = [ 'string' ]
  const shouldTrim = type => trimmers.indexOf( type ) > -1

  const Tidal = function( node, state, tidal, container=null, index=0 ) {
    if( node.processed === true ) return 

    const cm = state.cm
    const target = tidal.target // XXX seq.object for gibberwocky
    const pattern = tidal.__pattern.__data
    
    const markers = {}

    const line  = node.offset.vertical
    const start = node.start
    const end   = node.end

    const marker = cm.markText( 
      { line, ch:start }, 
      { line, ch:end }, 
      { className:  'annotation' }
    )

    // this function recursively marks each number or string token in the pattern
    const markPattern = pattern => {
      if( pattern.values !== undefined ) {
        // recursively mark patterns
        pattern.values.forEach( markPattern )
      }else if( pattern.value !== undefined ) {
        let val = pattern.value //typeof pattern.value === 'string' ? pattern.value.trim() : pattern.value
        let uid = pattern.uid

        while( typeof val !== 'string' && typeof val !== 'number' ) {
          // get, for example, uids of values in repeat patterns
          uid = val.uid
          val = val.values || val.value
        }
        if( typeof val === 'string' ) val = val.trim()

        const loc = pattern.location
        if( shouldTrim( pattern.type ) ) {
          const len = typeof val === 'string' ? val.length : (''+val).length
          
          // check for whitespace and trim accordingly
          if( len < loc.end.offset - loc.start.offset ){
            loc.end.offset = loc.start.offset + len
          }
        }

        // XXX FIX THIS MUST BE UNIQUE
        let className = `tidal-${uid}`
        
        cm.markText( 
          { line, ch:start + 1 + loc.start.offset }, 
          { line, ch:start + 1 + loc.end.offset }, 
          { className }
        )

        markers[ className ] = pattern
        pattern.cycle = Marker._createBorderCycleFunction( className, pattern )
        pattern.type = 'tidal'
      }
    }

    markPattern( pattern )

    const clearCycle = name => {
      let cycle = markers[ name ].cycle
      cycle.tm = setTimeout( function() {
        cycle.clear()
        $( '.' + name ).remove( 'annotation-full' )
      }, 250 )
    }

    tidal.update = function( val ) {
      const name = `tidal-${tidal.update.uid}`

      $( '.' + name ).add( 'annotation-full' ) 

      const cycle = markers[ name ].cycle

      if( cycle.tm !== undefined ) clearTimeout( cycle.tm )

      cycle() 
      clearCycle( name )
    }

    let value = null
    Object.defineProperty( tidal.update, 'value', {
      get() { return value },
      set(v){ 
        if( typeof v === 'string' ) v = v.trim()
        value = v
        tidal.update( value )
      }
    })

  }

  return Tidal 
}
