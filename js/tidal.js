const Gibberish = require( 'gibberish-dsp' )

module.exports = function( Audio ) {

  const Seq = function( props ) { 
    const pattern   = props.pattern
    const target    = props.target
    const key       = props.key
    const priority  = props.priority
    let   rate      = props.rate || 1
    let   density   = props.density || 1
    let   autotrig  = false

    // XXX TODO
    //if( key === 'note' || key === 'chord' || key === 'trigger' ) {
    //  values.addFilter( ( args,ptrn ) => {
    //    if( ptrn.seq.target.autotrig !== undefined ) {
    //      for( let s of ptrn.seq.target.autotrig ) {
    //        s.fire()
    //      }
    //    }
    //    return args
    //  })
    //} 

    const clear = function() {
      this.stop()
      
      if( Gibberish.mode === 'worklet' ) {
        const idx = Seq.sequencers.indexOf( seq )
        seq.stop()
        const __seq = Seq.sequencers.splice( idx, 1 )[0]
        if( __seq !== undefined ) {
          __seq.stop()
        }
      }
    }

    const filters = [
      // report back triggered tokens for annotations
      function( val, tidal, uid ) {
        if( Gibberish.mode === 'processor' ) {
          Gibberish.processor.messages.push( tidal.id, 'update.uid', uid )   
          Gibberish.processor.messages.push( tidal.id, 'update.value', val )   
        }
        return val
      } 
    ]

    const seq = Gibberish.Tidal({ pattern, target, key, priority, filters })
    seq.clear = clear

    //Gibberish.proxyEnabled = false
    //Audio.Ugen.createProperty( seq, 'density', timings, [], Audio )
    //Gibberish.proxyEnabled = true

    Seq.sequencers.push( seq )

    return seq
  }

  Seq.sequencers = []
  Seq.clear = function() {
    Seq.sequencers.forEach( seq => seq.clear() )
    //for( let i = Seq.sequencers.length - 1; i >= 0; i-- ) {
    //  Seq.sequencers[ i ].clear()
    //}
    Seq.sequencers = []
  }
  Seq.DNR = -987654321

  return Seq

}
