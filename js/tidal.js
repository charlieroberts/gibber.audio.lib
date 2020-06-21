const Gibberish = require( 'gibberish-dsp' )

module.exports = function( Audio ) {

  const Seq = function( props ) { 
    const pattern   = props.pattern
    const target    = props.target
    const key       = props.key
    const number    = props.number
    const priority  = props.priority || 0
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
        if( seq.update && seq.update.clear ) {
          seq.update.clear()
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

    if( key === 'note' || key === 'chord' || key === 'trigger' ) {
      filters.push( ( args,tidal ) => {
        if( tidal.target.autotrig !== undefined ) {
          for( let s of tidal.target.autotrig ) {
            s.fire()
          }
        }
        return args
      })
    }

    const seq = Gibberish.Tidal({ pattern, target, key, priority, filters, mainthreadonly:props.mainthreadonly })
    seq.clear = clear
    seq.uid = Gibberish.Tidal.getUID()
    
    //Gibberish.proxyEnabled = false
    //Audio.Ugen.createProperty( seq, 'density', timings, [], Audio )
    //Gibberish.proxyEnabled = true

    Audio.addSequencing( seq, 'rotate', 1 )

    Seq.sequencers.push( seq )

    Audio.subscribe( 'clear', ()=> seq.clear() )

    // if x.y.tidal() etc. 
    // standalone === false is most common use case
    if( props.standalone === false ) {
      let prevSeq = target[ '__' + key ].tidals[ number ] 
      if( prevSeq !== undefined ) {
        const idx = target.__sequencers.indexOf( prevSeq )
        target.__sequencers.splice( idx, 1 )
        // XXX stop() destroys an extra sequencer for some reason????
        prevSeq.stop()
        prevSeq.clear()
        //removeSeq( obj, prevSeq )
      }

      seq.start( Audio.Clock.time( delay ) )

      target[ '__' + key ].tidals[ number ] = obj[ '__' + key ][ number ] = seq
    }

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

  let val = 1 
  Object.defineProperty( Seq, 'cps', {
    get() { return val },
    set(v) {
      val = v
      Gibber.Gibberish.Tidal.cps = v
    }
  })

  return Seq

}
