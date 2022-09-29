const Gibberish   = require( 'gibberish-dsp' )
const Ugen        = require( './ugen.js' )
const Instruments = require( './instruments.js' )
const Oscillators = require( './oscillators.js' )
const Effects     = require( './effects.js' )
const Filters     = require( './filters.js' )
const Binops      = require( './binops.js' )
const Analysis    = require( './analysis.js' )
const Envelopes   = require( './envelopes.js' )
const Busses      = require( './busses.js' )
const Ensemble    = require( './ensemble.js' )
const Utility     = require( './utility.js' )
const Freesound   = require( './freesound.js' )
const Gen         = require( './gen.js' )
const WavePattern = require( './wavePattern.js' )
const WaveObjects = require( './waveObjects.js' )

const Audio = {
  Clock: require( './clock.js' ),
  Theory: require( './theory.js' ),
  Presets: require( './presets.js' ),
  __Make: require( './make.js' ),
  initialized:false,
  autoConnect:true,
  shouldDelay:false,
  instruments:{},
  oscillators:{},
  effects:{},
  exportTarget:null,

  export( obj ) {
    if( Audio.initialized ){ 
      Object.assign( 
        obj, 
        this.instruments, 
        this.oscillators,
        this.effects,
        this.filters,
        this.busses, 
        this.envelopes, 
        this.waveObjects, 
        this.binops, 
        this.analysis 
      )
      
      Utility.export( obj )
      this.Gen.export( obj )

      obj.Gibberish = this.Gibberish

      obj.gen = this.Gen.make
      obj.lfo = this.Gen.composites.lfo
      obj.Ensemble = this.Ensemble
      obj.Drums = this.Drums
      obj.EDrums = this.EDrums
      obj.Theory = this.Theory
      obj.Freesound = this.Freesound
      obj.Clock = this.Clock
      obj.Clock.export( obj )
      obj.WavePattern = this.WavePattern
      obj.Gen = this.Gen
      obj.stop = this.stop

      obj.Out = this.Out
      obj.Make = this.Make
      obj.future = this.Gibberish.utilities.future
    }else{
      Audio.exportTarget = obj
    } 
  },

  __defaults : {
    workletPath: '../dist/gibberish_worklet.js',
    ctx:         null,
    bufferSize:  2048,
    latencyHint: .05
  },

  init( options, Gibber  ) {
    let { workletPath, ctx, bufferSize, latencyHint } = Object.assign( {}, this.__defaults, options ) 
    this.Gibber = Gibber
    this.Core = Gibber

    // XXX should probably just call Audio.Core.createProperty to avoid confusion...
    this.createProperty = Gibber.createProperty

    Gibber.Audio = this
    this.Gibberish = Gibberish

    Gibberish.workletPath = workletPath 

    this.createPubSub()

    const p = new Promise( (resolve, reject) => {
      Gibberish.init( 44100*60*20, ctx, 'worklet', { latencyHint }).then( processorNode => {
        // XXX remove once gibber.core.lib has been properly integrated 
        Audio.Core.Audio = Audio.Core.audio = Audio

        Audio.Gibberish = Gibberish

        Audio.initialized = true
        Audio.node = processorNode
        Audio.Ugen = Ugen
        Audio.Make = Audio.__Make( Audio )
        Audio.Gen = Gen( Audio )
        Audio.Gen.init()
        Audio.Gen.export( Audio.Gen.ugens )
        Audio.Theory.init( window.Gibber )
        Audio.Utilities = Utility
        Audio.WavePattern = WavePattern( Audio )
        Audio.ctx = ctx
        Audio.Out = Gibberish.output
        
        // must wait for Gen to be initialized
        Audio.Clock.init( Audio.Gen, Audio )

        Audio.createUgens()
        
        if( Audio.exportTarget !== null ) Audio.export( Audio.exportTarget )

        Gibberish.worklet.port.__postMessage = Gibberish.worklet.port.postMessage

        Gibberish.worklet.port.postMessage = function( dict ) {
          if( Audio.shouldDelay === true ) dict.delay = true

          Gibberish.worklet.port.__postMessage( dict )
        }

        Audio.export( window )

        //const drums = Audio.Drums('x*o-')
        //drums.disconnect()
        //drums.stop()

        // store last location in memory... we can clear everything else in Gibber.clear9)
        const memIdx = Object.keys( Gibberish.memory.list ).reverse()[0]
        this.__memoryEnd = parseInt( memIdx ) + Gibberish.memory.list[ memIdx ]

        // XXX this forces the gibberish scheduler to start
        // running, but it's about as hacky as it can get...
        //const __start = Audio.instruments.Synth().connect()
        //__start.disconnect()

        //Audio.Gibberish.genishi.gen.histories.clear()
        Audio.clear()

        resolve( [Audio,'Audio'] )
      })
    })
    
    return p
  },

  restart() {
    Gibber.clear()
    Gibberish.worklet.port.close()
    window.w = Gibberish.worklet
    Gibberish.worklet.disconnect()

    Gibberish.init( 44100*60*20, undefined, 'worklet', true ).then( processorNode => {
      Audio.out = Gibberish.output
      Audio.node = processorNode

      Audio.Theory.deleteProperties()
      Audio.Theory.init( window.Gibber )

      Audio.initialized = true
      Audio.node = processorNode
      Audio.Out = Gibberish.output

      Audio.Make = Audio.__Make( Audio )
      Audio.Gen = Gen( Audio )
      Audio.Gen.init()
      Audio.Gen.export( Audio.Gen.ugens )

      Audio.WavePattern = WavePattern( Audio )
      Audio.createUgens()
        
      Audio.Clock.init( Audio.Gen, Audio )

      Gibberish.worklet.port.__postMessage = Gibberish.worklet.port.postMessage
      Gibberish.worklet.port.postMessage = function( dict ) {
        if( Audio.shouldDelay === true ) dict.delay = true

        Gibberish.worklet.port.__postMessage( dict )
      }

      Audio.export( window )
      Gibber.export( window )

      const memIdx = Object.keys( Gibberish.memory.list ).reverse()[0]
      this.__memoryEnd = parseInt( memIdx ) + Gibberish.memory.list[ memIdx ]

      // XXX this forces the gibberish scheduler to start
      // running, but it's about as hacky as it can get...
      const __start = Audio.instruments.Synth().connect()
      __start.disconnect()

      //Audio.Gibberish.genishi.gen.histories.clear()

      //Audio.clear()
      console.log( 'audio engine successfully restarted.' )
      Audio.publish( 'restart' )
    })
  },

  // XXX stop clock from being cleared.
  clear() { 
    Gibberish.clear() 
    Audio.Clock.init( Audio.Gen, Audio )

    // the idea is that we only clear memory that was filled after
    // the initial Gibber initialization... this stops objects
    // like Clock and Theory from having their memory cleared and
    // from having to re-initialize them.

    // fill memory with zeros from the end initialization block onwards
    Gibberish.memory.heap.fill( 0, this.__memoryEnd )

    // get locations of all memory blocks
    const memKeys = Object.keys( Gibberish.memory.list )

    // get idx of final initialization block
    const endIdx =  memKeys.indexOf( ''+this.__memoryEnd )

    // loop through all blocks after final initialzation block
    // and delete them in the memory list... they've already
    // been zeroed out.
    for( let i = endIdx; i < memKeys.length; i++ ) {
      delete Gibberish.memory.list[ memKeys[ i ] ]
    }
    
    Audio.publish('clear')
  },

  stop() {
    Gibber.Seq.sequencers.forEach( s => s.stop() )
  },

  start() {
    Gibber.Seq.sequencers.forEach( s => s.start() )
  },
  onload() {},

  createUgens() {
    //Core.export( this, this )

    this.Freesound = Freesound( this )
    this.binops = Binops.create( this )
    this.analysis = Analysis.create( this )
    this.oscillators = Oscillators.create( this )
    this.instruments = Instruments.create( this ) 
    this.envelopes   = Envelopes.create( this )
    this.filters     = Filters.create( this )
    this.effects = Effects.create( this )
    this.busses = Busses.create( this )
    this.Ensemble = Ensemble( this )
    this.waveObjects = WaveObjects( this )

    const Pattern = this.Core.__Pattern
    Pattern.transfer( this, Pattern.toString() )

    
    const drums = require( './drums.js' )( this )
    Object.assign( this, drums )
  },

  printcb() { 
    Gibber.Audio.Gibberish.worklet.port.postMessage({ address:'callback' }) 
  },
  printobj( obj ) {
    Gibber.Audio.Gibberish.worklet.port.postMessage({ address:'print', object:obj.id }) 
  },
  send( msg ){
    Gibber.Audio.Gibberish.worklet.port.postMessage( msg )
  },

  createPubSub() {
    const events = this.pubevents = {}
    this.subscribe = function( key, fcn ) {
      if( typeof events[ key ] === 'undefined' ) {
        events[ key ] = []
      }
      events[ key ].push( fcn )
    }

    this.unsubscribe = function( key, fcn ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.splice( arr.indexOf( fcn ), 1 )
      }
    }

    this.publish = function( key, data ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.forEach( v => v( data ) )
      }
    }
  },

  createMapping( from, to, name, wrappedTo ) {
    if( from.__useMapping === false ) {
      to[ name ].value = from
    }else if( from.type === 'audio' ) {
      const f = to[ '__' + name ].follow = Follow({ input: from })

      let m = f.multiplier
      Object.defineProperty( to[ name ], 'multiplier', {
        get() { return m },
        set(v) { m = v; f.multiplier = m }
      })

      let o = f.offset
      Object.defineProperty( to[ name ], 'offset', {
        get() { return o },
        set(v) { o = v; f.offset = o }
      })

      wrappedTo[ name ] = f
      //to[ '__'+name].value = f

    }else if( from.type === 'gen' ) {
      // gen objects can be referred to without the graphics/audio abstraction,
      // in which case they will have no .render() function, and don't need to be rendered
      const gen = from.render !== undefined ? from.render() : from

      wrappedTo[ name ] = gen
    }
  },

  createGetter( obj, name ) { return () => obj[ '__' + name ] },

  createSetter( obj, name, post, transform=null, isPoly=false ) {
    if( typeof obj.__wrapped__ === 'object' ) {
      let desc = Object.getOwnPropertyDescriptor( obj.__wrapped__, name )

      if( desc !== undefined ) {
        Object.defineProperty( obj.__wrapped__, name,  {
          configurable:true,
          set(v) {
            obj[ '__'+name ].value = v
            if( desc.set ) {
              desc.set( v )
            }else{
              obj.__wrapped__.value = v
            }
          }
        })
      }
    }
    const setter = v => {
      let value, shouldSend = true


      if( typeof v === 'number' || typeof v === 'string' || v === null ) {
        value = transform !== null ? transform( v ) : v

        if( isPoly === true ) {
          const __wrappedObject = obj.__wrapped__
          const voice = __wrappedObject.voices[ __wrappedObject.voiceCount % __wrappedObject.voices.length ]
          voice[ name ] = value

          shouldSend = false

          Gibberish.worklet.port.postMessage({
            address:'property',
            object:voice.id,
            name,
            value
          }) 

        }else{
          obj[ '__'+name].value = v
        }
      }else if( typeof v === 'object' && v !== null && v.type === 'gen' ) {
        // gen objects can be referred to without the graphics/audio abstraction,
        // in which case they will have no .render() function, and don't need to be rendered

        v = transform !== null ? transform( v ) : v       
        const gen = v.render !== undefined ? v.render() : v 

        obj['__'+ name ].value = gen 
        value = { id: gen.id }
      }else if( typeof v === 'object' ) { //&& typeof v !== null ) {
        //if( obj.__useMapping === false || name === 'input' ) {
        //  obj[ '__'+name].value = v
        //  value = v !== null ? { id:v.id } : v
        //}else{
        //  //Audio.createMapping( v, obj, name, obj.__wrapped__ )
        //  const f = obj[ '__' + name ].follow = Follow({ input: v })

        //  let m = f.multiplier
        //  Object.defineProperty( obj[ name ], 'multiplier', {
        //    get() { return m },
        //    set(v) { m = v; f.multiplier = m }
        //  })

        //  let o = f.offset
        //  Object.defineProperty( obj[ name ], 'offset', {
        //    get() { return o },
        //    set(v) { o = v; f.offset = o }
        //  })

          //wrappedTo[ name ] = f
          //obj[ '__'+name ].value = f.__wrapped__
          //value = { id:f.id }
          obj[ '__'+name ].value = v.__wrapped__
          value = { id:v.id }
        //}
               //
        //obj[ '__'+name].value = v
        //value = v !== null ? { id:v.id } : v
      }

      if( Gibberish.mode === 'worklet' && shouldSend === true ) {
        Gibberish.worklet.port.postMessage({
          address:'property',
          object:obj.id,
          name,
          value
        }) 
      }
      if( post !== null ) {
        post.call( obj )
      }     
      if( Gibberish.mode === 'worklet' ) Audio.publish( `property.set:${obj.id}`, obj, v )
    }

    return setter
  },

  createFade( from=null, to=null, time=1, obj, name, delay=0 ) {
    if( from === null ) from = obj[ name ].value
    if( to === null ) to = obj[ name ].value

    time = Audio.Clock.time( time )

    // XXX only covers condition where ramps from fades are assigned...
    // does this need to be more generic?
    if( isNaN( from ) && from.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
      from = from.to.value
    }
    if( isNaN( to ) && to.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
      to = to.to.value
    }

    let ramp = Audio.envelopes.Ramp({ from, to, length:time, shouldLoop:false })
    // this is a key to not use an envelope follower for mapping
    ramp.__useMapping = false
    ramp.__wrapped__.isFade = true

    if( delay === 0 ) {
      obj[ name ] = ramp
    } else {
      future( (obj,name,ramp) => { 
        obj[ name ] = ramp 
      }, delay, { obj, name, ramp:ramp.__wrapped__ } )
    }

    if( ramp.__wrapped__ === undefined ) ramp.__wrapped__ = {}
    ramp.__wrapped__.values = []

    ramp.__wrapped__.output = v => {
      if( ramp.__wrapped__ !== undefined ) {
        ramp.__wrapped__.values.unshift( v )
        while( ramp.__wrapped__.values.length > 60 ) ramp.__wrapped__.values.pop()
      }
    }

    ramp.__wrapped__.finalize = () => {
      const store = ramp.__wrapped__

      // XXX I can't quite figure out why I have to wait to reset the property 
      // value here... if I don't, then the fade ugen stays assigned in the worklet processor.
      // and 0 doesn't work!
      setTimeout( ()=> obj[ name ] = store.to === 0 ? .000001 : store.to, 0 )
      store.widget.clear()
    }

    ramp.__wrapped__.from = from
    ramp.__wrapped__.to = to

    return obj
  },

  // what properties should be automatically (automagickally?)
  // filtered through Audio.Clock.time()?
  timeProps : {
    Synth:[ 'attack', 'decay', 'sustain', 'release' ],
    PolySynth:[ 'attack', 'decay', 'sustain', 'release' ],
    Complex:[ 'attack', 'decay', 'sustain', 'release' ],
    PolyComplex:[ 'attack', 'decay', 'sustain', 'release' ],
    FM:[ 'attack', 'decay', 'sustain', 'release' ],
    PolyFM:[ 'attack', 'decay', 'sustain', 'release' ],
    Monosynth:[ 'attack', 'decay', 'sustain', 'release' ],
    PolyMono:[ 'attack', 'decay', 'sustain', 'release' ],
    Delay:[ 'time' ], 
  }
}

module.exports = Audio
