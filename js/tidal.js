const Gibberish = require( 'gibberish-dsp' )

module.exports = function( Audio ) {

  const Seq = function( props ) { 
    const pattern   = props.pattern
    const target    = props.target
    const key       = props.key
    const priority  = props.priority
    const filters   = []
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
      
      if( this.values !== undefined && this.values.clear !== undefined  ) {
        this.values.clear()
      }
      if( this.timings !== undefined && this.timings !== null && this.timings.clear !== undefined ) this.timings.clear()

      
      if( Gibberish.mode === 'worklet' ) {
        const idx = Seq.sequencers.indexOf( seq )
        seq.stop()
        const __seq = Seq.sequencers.splice( idx, 1 )[0]
        if( __seq !== undefined ) {
          __seq.stop()
        }
      }
    }

    //const offsetRate = Gibberish.binops.Mul(rate, Audio.Clock.audioClock )
    // XXX we need to add priority to Sequencer2; this priority will determine the order
    // that sequencers are added to the callback, ensuring that sequencers with higher
    // priority will fire first.
    const seq = Gibberish.Tidal({ pattern, target, key, priority })
    seq.clear = clear

    //values.setSeq( seq )

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
