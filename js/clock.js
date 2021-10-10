const Gibberish = require( 'gibberish-dsp' )
const serialize = require( 'serialize-javascript' )

// XXX must use form key:function() {} due to serialization
const Clock = {
  __beatCount:0,
  id:null,
  nogibberish:true,
  bpm:140,
  __lastBPM:140,
  seq:null,

  export:function( obj ) {
    obj.btos = Clock.btos.bind( Clock )
    obj.btoms = Clock.btoms.bind( Clock )
    obj.stob = Clock.stob.bind( Clock )
  },

  store:function() { 
    Gibberish.Clock = this
    this.beatCount = 0
    this.queue = []
    this.init()
  },

  addToQueue:function( ...args ) {
    if( Gibberish.mode === 'processor' ) {
      args = args[0]
      args.forEach( v => Gibberish.Clock.queue.push( v ) )
    }else{
      Gibberish.worklet.port.postMessage({
        address: 'method',
        object: this.id,
        name: 'addToQueue',
        args: serialize( args ),
        functions: true
      }) 
    }
  },

  init:function( Gen, Audio ) {
    // needed so that when the clock is re-initialized (for example, after clearing)
    // gibber won't try and serialized its sequencer
    this.seq = null

    const clockFunc = ()=> {
      Gibberish.worklet.port.postMessage({
        address: 'beat',
        value: this.beatCount
      }) 

      if( this.beatCount++ % 4 === 0 ) {
        Gibberish.processor.playQueue()//.forEach( f => { f() } )
      }
    }

    if( Gibberish.mode === 'worklet' ) {
      this.id = Gibberish.utilities.getUID()
      this.audioClock = null
      this.__rate = null

      Gibberish.worklet.port.postMessage({
        address:'add',
        properties:serialize( Clock ),
        id:this.id,
        post: 'store'    
      })
      
      let bpm = this.__lastBPM
      Object.defineProperty( this, 'bpm', {
        get() { return bpm },
        set(v){ 
          bpm = v
          if( Gibberish.mode === 'worklet' ) {
            this.__lastBPM = v
            if( Audio.Gibber.Tidal !== undefined ) Audio.Gibber.Tidal.cps = bpm/120/2
            Gibberish.worklet.port.postMessage({
              address:'set',
              object:this.id,
              name:'bpm',
              value:bpm 
            }) 
          }
        }
      })

      this.audioClock = Gen.make( Gen.ugens.abs(1) )
      //this.__rate = this.audioClock.__p0 

      Object.defineProperty( this, 'rate', {
        configurable:true,
        get() { return this.audioClock },
        set(v){
          this.audioClock.p0 = v
        }
      })

      //Gibberish.worklet.port.postMessage({
      //  address:'set',
      //  value: Gen.make( Gen.ugens.abs(1) ),
      //  object:this.id,
      //  name:'audioClock'
      //})

      this.bpm = this.__lastBPM
    }

    if( Gibberish.mode === 'processor' )
      this.seq = Gibberish.Sequencer.make( [ clockFunc ], [ ()=>Gibberish.Clock.time( 1/4 ) ] ).start()

  },

  connect: function() {
    if( this.audioClock !== undefined ) {
      Gibberish.analyzers.push( this.audioClock )
      Gibberish.dirty( Gibberish.analyzers )
      console.log( 'clock connected' )
    }
  },

  // time accepts an input value and converts it into samples. the input value
  // may be measured in milliseconds, beats or samples.
  time: function( inputTime = 0 ) {
    let outputTime = inputTime

    // if input is an annotated time value such as what is returned
    // by samples() or ms()...
    // console.log( 'input time:' , inputTime )
    if( isNaN( inputTime ) ) {
      if( typeof inputTime === 'object' ) { 
        if( inputTime.type === 'samples' ) {
          outputTime = inputTime.value
        }else if( inputTime.type === 'ms' ) {
          outputTime = this.mstos( inputTime.value ) 
        }
      } 
    }else{
      // XXX 4 is a magic number, needs to account for the current time signature
      outputTime = this.btos( inputTime * 4 )
    }
    
    return outputTime
  },

  // does not work... says Gibberish can't be found? I guess Gibberish isn't in the
  // global scope of the worklet?
  Time: function( inputTime ) {
    return new Function( `return Gibberish.Clock.time( ${inputTime} )` )
  },

  mstos: function( ms ) {
    return ( ms / 1000 ) * Gibberish.ctx.sampleRate
  },

  // convert beats to samples
  btos: function( beats ) {
    const samplesPerBeat = Gibberish.ctx.sampleRate / (this.bpm / 60 )
    return samplesPerBeat * beats 
  },

  // convert samples to beats (for pattern visualizations)
  stob: function( samples ) {
    const samplesPerBeat = Gibberish.ctx.sampleRate / (this.bpm / 60 )
    return (samples / samplesPerBeat) * .25 // XXX magic number should be denominator of time signature 
  },
  // convert beats to milliseconds
  btoms: function( beats ) {
    const samplesPerMs = Gibberish.ctx.sampleRate / 1000
    return beats * samplesPerMs
  },

  ms: function( value ) {
    return { type:'ms', value }
  },

  samples: function( value ) {
    return { type:'samples', value }
  }
}

module.exports = Clock
