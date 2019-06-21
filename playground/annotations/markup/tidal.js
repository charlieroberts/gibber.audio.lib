const Utility = require( '../../../js/utility.js' )
const $ = Utility.create

module.exports = function( Marker ) {
  // Marker.patternMarkupFunctions.tidal( tidalNode, state, tidalObj, container, seqNumber )
  const trimmers = ['string']
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

    console.log( 'start:', start, 'end:', end )

    const marker = cm.markText( 
      { line, ch:start }, 
      { line, ch:end }, 
      { 
        className:  'annotation' // annotation-full',
        //startStyle: 'annotation-no-right-border',
        //endStyle:   'annotation-no-left-border',
        //inclusiveLeft:true, inclusiveRight:true
      }
    )

    const markPattern = pattern => {
      if( pattern.values !== undefined ) {
        pattern.values.forEach( markPattern )
      }else if( pattern.value !== undefined ) {
        let val = pattern.value //typeof pattern.value === 'string' ? pattern.value.trim() : pattern.value

        while( typeof val !== 'string' && typeof val !== 'number' ) {
          val = val.values || val.value
        }
        if( typeof val === 'string' ) val = val.trim()

        const loc = pattern.location
        if( loc === undefined ) console.log( 'pattern:', pattern )
        if( shouldTrim( pattern.type ) ) {
          const len = typeof val === 'string' ? val.length : (''+val).length
          
          // check for whitespace and trim accordingly
          if( len < loc.end.offset - loc.start.offset ){
            loc.end.offset = loc.start.offset + len
          }
        }
        let className = 'tidal-'+val
        
        cm.markText( 
          { line, ch:start + 1 + loc.start.offset }, 
          { line, ch:start + 1 + loc.end.offset }, 
          { className }
        )

        markers[ val ] = pattern
        pattern.cycle = Marker._createBorderCycleFunction( className, pattern )
        pattern.type = 'tidal'
      }
    }

    markPattern( pattern )

    const clearCycle = val => {
      let cycle = markers[ val ].cycle
      cycle.tm = setTimeout( function() {
        cycle.clear()
        $('.tidal-'+val).remove( 'annotation-full' )
      }, 250 )
    }

    tidal.update = function( val ) {
      $( '.tidal-'+val ).add( 'annotation-full' ) 
      const cycle = markers[ val ].cycle
      if( cycle.tm !== undefined ) clearTimeout( cycle.tm )
      cycle() 
      clearCycle( val )
    }

    let value = null
    Object.defineProperty( tidal.update, 'value', {
      get() { return value },
      set(v){ 
        value = v.trim() 
        tidal.update( value )
      }
    })

    /*
    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType, index )
    const cssName = className

    const marker = cm.markText( start, end, { 
      'className': cssName + ' annotation-border', 
      //inclusiveLeft: true,
      //inclusiveRight: true
    })

    if( seqTarget.markup === undefined ) Marker.prepareObject( seqTarget )

    seqTarget.markup.textMarkers[ className ] = marker

    if( seqTarget.markup.cssClasses[ className ] === undefined ) seqTarget.markup.cssClasses[ className ] = []

    seqTarget.markup.cssClasses[ className ][ index ] = cssName    
    
    patternObject.marker = marker
    Marker.finalizePatternAnnotation( patternObject, className, seqTarget, marker )
  }
  */


  }

  return Tidal 
}
