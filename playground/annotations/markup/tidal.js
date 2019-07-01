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
      { line: node.offset.vertical, ch:start }, 
      { line: node.offset.vertical + (node.loc.end.line - node.loc.start.line), ch:end }, 
      { className: 'annotation tidalblock' }
    )

    // this function recursively marks each number or string token in the pattern
    const markPattern = pattern => {
      if( pattern.type === 'repeat' ) {
        markPattern( pattern.value )
      }else if( pattern.values !== undefined ) {
        // recursively mark patterns
        pattern.values.forEach( markPattern )
      }else if( pattern.value !== undefined ) {
        let val = pattern.value //typeof pattern.value === 'string' ? pattern.value.trim() : pattern.value
        let uid = pattern.uid

        while( typeof val !== 'string' && typeof val !== 'number' && val !== undefined ) {
          const __store = val

          // get, for example, uids of values in repeat patterns
          uid = val.uid
          val = val.values || val.value
          
          if( val === undefined ) console.warn( 'tidal annotation leads to undefined:', __store )

          if( typeof val === 'function' ) {
            if( Array.isArray( __store ) ) {
              __store.forEach( markPattern )
              return
            }
          }
        }

        if( typeof val === 'string' ) val = val.trim()

        const loc = pattern.location
        if( shouldTrim( pattern.type ) ) {
          const len = typeof val === 'string' ? val.length : (''+val).length
          
          // check for whitespace and trim accordingly
          if( len < loc.end.column - loc.start.column ){
            loc.end.column = loc.start.column + len
          }
        }

        const className = `tidal-${tidal.uid}-${uid}`
        
        const lineModY = node.loc.start.line === node.loc.end.line ? -1 : 0
        const lineModX = node.loc.start.line === node.loc.end.line ? node.loc.start.column : -1

        const tokenStart = { line:line + loc.start.line + lineModY, ch:lineModX + loc.start.column }
        const tokenEnd   = { line:line + loc.end.line   + lineModY, ch:lineModX + loc.end.column } 

        const marker = cm.markText( 
          tokenStart, 
          tokenEnd,  
          { className: className+' cm-number tidal' } 
        )

        markers[ className ] = pattern
        
        pattern.cycle = Marker._createBorderCycleFunction( className, pattern )
        pattern.type = 'tidal'
        pattern.marker = marker
      }
    }

    markPattern( pattern )

    const clearCycle = name => {
      if( markers[ name ] ) {
        let cycle = markers[ name ].cycle
        cycle.tm = setTimeout( function() {
          cycle.clear()
          $( '.' + name ).remove( 'tidal-bright' )
        }, 250 )
      }
    }

    tidal.update = function( val ) {
      const name = `tidal-${tidal.uid}-${tidal.update.uid}`

      $( '.' + name ).add( 'tidal-bright' ) 

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

    tidal.update.clear = function() {
      clearCycle()
      for( let key in markers ) {
        markers[ key ].marker.clear()
      }
    }

  }

  return Tidal 
}
