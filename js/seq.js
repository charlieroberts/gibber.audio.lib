const Gibberish = require( 'gibberish-dsp' )

module.exports = function( Audio ) {

  const Seq = function( props ) { 
    let   __values  = props.values
    const __timings = props.timings
    const delay     = props.delay
    const target    = props.target
    const key       = props.key
    const priority  = props.priority
    let   rate      = props.rate || 1
    let   density   = props.density || 1
    let   autotrig  = false

    if( __values.type === 'gen' ) __values = __values.render()

    let values
    if( Array.isArray( __values ) ) {
      values =  Audio.Pattern( ...__values )
    }else{
      values = Audio.Pattern( __values )
    }

    if( __values.randomFlag ) {
      values.addFilter( ( args,ptrn ) => {
        const range = ptrn.values.length - 1
        const idx = Math.round( Math.random() * range )
        return [ ptrn.values[ idx ], 1, idx ] 
      })
      //for( let i = 0; i < this.values.randomArgs.length; i+=2 ) {
      //  valuesPattern.repeat( this.values.randomArgs[ i ], this.values.randomArgs[ i + 1 ] )
      //}
    }

    if( key === 'note' || key === 'chord' || key === 'trigger' ) {
      values.addFilter( ( args,ptrn ) => {
        if( ptrn.seq.target.autotrig !== undefined ) {
          for( let s of ptrn.seq.target.autotrig ) {
            s.fire()
          }
        }
        return args
      })
    } 

    let timings
    if( Array.isArray( __timings ) ) {
      timings  = Audio.Pattern( ...__timings )
    }else if( typeof __timings === 'function' && __timings.isPattern === true ) {
      timings = __timings
    }else if( __timings !== undefined && __timings !== null ) {
      timings = Audio.Pattern( __timings )
    }else{
      timings = null
      autotrig = true
    }

    if( autotrig === false ) {
      if( __timings.randomFlag ) {
        timings.addFilter( ( args,ptrn ) => {
          const range = ptrn.values.length - 1
          const idx = Math.round( Math.random() * range )
          return [ ptrn.values[ idx ], 1, idx ] 
        })
        //for( let i = 0; i < this.values.randomArgs.length; i+=2 ) {
        //  valuesPattern.repeat( this.values.randomArgs[ i ], this.values.randomArgs[ i + 1 ] )
        //}
      }
      timings.output = { time, shouldExecute:0 }
      timings.density = 1

      timings.addFilter( function( args ) {
        if( !isNaN( args[0] ) ) {
          args[ 0 ] = Gibberish.Clock.time( args[0] )
        }

        return args
      })

      // XXX delay annotations so that they occur after values annotations have occurred. There might
      // need to be more checks for this flag in the various annotation update files... right now
      // the check is only in createBorderCycle.js.
      timings.__delayAnnotations = true
    }

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

    values.__patternType = 'values'
    timings.__patternType = 'timings'
    //const offsetRate = Gibberish.binops.Mul(rate, Audio.Clock.audioClock )
    // XXX we need to add priority to Sequencer2; this priority will determine the order
    // that sequencers are added to the callback, ensuring that sequencers with higher
    // priority will fire first.

    // XXX need to fix so that we can use the clock rate as the base
    const seq = Gibberish.Sequencer2({ values, timings, density, target, key, priority, rate:1/*Audio.Clock.audioClock*/, clear, autotrig, mainthreadonly:props.mainthreadonly })

    values.setSeq( seq )

    if( autotrig === false ) {
      timings.setSeq( seq )
    }else{
      if( target.autotrig === undefined ) {
        target.autotrig = []
      }
      // object name key value
      if( Gibberish.mode === 'worklet' ) {
        Gibberish.worklet.port.postMessage({
          address:'addObjectToProperty',
          name:'autotrig',
          object:target.id,
          key:target.autotrig.length,
          value:seq.id
        })
        target.autotrig.push( seq )
      }
    } 

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
