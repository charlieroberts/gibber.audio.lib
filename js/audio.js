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
const Core        = require( 'gibber.core.lib' )
//const Arp         = require( './arp.js' )
//const __Automata  = require( './automata.js' )

const Audio = {
  Clock: require( './clock.js' ),
  Theory: require( './theory.js' ),
  Presets: require( './presets.js' ),
  Make: require( './make.js' ),
  Core,
  initialized:false,
  autoConnect:true,
  shouldDelay:false,
  instruments:{},
  oscillators:{},
  effects:{},
  exportTarget:null,

  export( obj ) {
    if( Audio.initialized ){ 
      Object.assign( obj, this.instruments, this.oscillators, this.effects, this.filters, this.busses, this.envelopes, this.waveObjects, this.binops, this.analysis )
      
      Utility.export( obj )
      this.Gen.export( obj )
      this.Core.export( obj, this )

      obj.gen = this.Gen.make
      obj.lfo = this.Gen.composites.lfo
      obj.Ensemble = this.Ensemble
      obj.Drums = this.Drums
      obj.EDrums = this.EDrums
      obj.Theory = this.Theory
      obj.Freesound = this.Freesound
      obj.Clock = this.Clock
      obj.WavePattern = this.WavePattern
      obj.Master = this.Master
      //obj.Arp = this.Arp
      //obj.Automata = this.Automata
      obj.Out = this.Out
      obj.Steps = this.Steps
      obj.HexSteps = this.HexSteps
      obj.Hex = this.Hex
      obj.Triggers = this.Triggers
      obj.Seq = this.Seq
      obj.Tidal = this.Tidal
      obj.Make = this.Make
      obj.Gibberish = this.Gibberish
      obj.future = this.Gibberish.utilities.future
    }else{
      Audio.exportTarget = obj
    } 
  },

  __defaults : {
    workletPath: '../dist/gibberish_worklet.js',
    ctx:         null
  },

  init( options ) {
    let { workletPath, ctx } = Object.assign( {}, this.__defaults, options ) 
    this.Gibberish = Gibberish

    Gibberish.workletPath = workletPath 

    this.createPubSub()

    const p = new Promise( (resolve, reject) => {
      if( ctx === null ) {
        ctx = new AudioContext({ latencyHint:.05 })
        //ctx = new AudioContext()
      }

      Gibberish.init( 44100*60*10, ctx ).then( processorNode => {
        // XXX remove once gibber.core.lib has been properly integrated 
        Audio.Core.Audio = Audio.Core.audio = Audio

        Audio.initialized = true
        Audio.node = processorNode
        Audio.Gen = Gen( Gibber )
        Audio.Gen.init()
        //Audio.Arp = Arp( Gibber )
        Audio.Gen.export( Audio.Gen.ugens )
        Audio.Theory.init( Gibber )
        Audio.Ugen = Ugen
        Audio.Utilities = Utility
        Audio.WavePattern = WavePattern( Gibber )
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
        const __start = Gibber.instruments.Synth().connect()
        __start.disconnect()

        Gibber.Gibberish.genish.gen.histories.clear()

        resolve()
      })
    })
    
    return p
  },

  // XXX stop clock from being cleared.
  clear() { 
    Gibberish.clear() 
    Audio.Clock.init( Audio.Gen, Audio )

    Audio.Seq.clear()

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

  onload() {},

  createUgens() {
    Core.export( this, this )
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
    this.Seq = require( './seq.js' )( this )
    this.Tidal = require( './tidal.js' )( this )
    this.Steps = require( './steps.js' )( this )
    this.HexSteps = require( './hexSteps.js' )( this )
    this.waveObjects = WaveObjects( this )
    const Pattern = Core.Pattern
    Pattern.transfer( this, Pattern.toString() )
    //this.Pattern = Pattern( this )
    this.Hex = require( './hex.js' )( Gibber )
    this.Triggers = require( './triggers.js' )( Gibber )
    //this.Automata = __Automata( this )
    this.Make = this.Make( this )
    
    const drums = require( './drums.js' )( this )
    Object.assign( this, drums )
  },

  addSequencing( obj, methodName, priority=0 ) {

    if( Gibberish.mode === 'worklet' ) {
      obj[ methodName ].sequencers = []
      obj[ methodName ].tidals = []

      obj[ methodName ].seq = function( values, timings, number=0, delay=0 ) {
        let prevSeq = obj[ methodName ].sequencers[ number ] 
        if( prevSeq !== undefined ) prevSeq.stop()

        let s = Audio.Seq({ values, timings, target:obj, key:methodName, priority })

        s.start() // Audio.Clock.time( delay ) )
        obj[ methodName ].sequencers[ number ] = obj[ methodName ][ number ] = s 

        // return object for method chaining
        return obj
      }
      obj[ methodName ].tidal= function( pattern, number=0, delay=0 ) {
          let prevSeq = obj[ methodName ].tidals[ number ] 
          if( prevSeq !== undefined ) { 
            const idx = obj.__tidals.indexOf( prevSeq )
            obj.__tidals.splice( idx, 1 )
            prevSeq.stop()
            prevSeq.clear()
            // removeSeq( obj, prevSeq )
          }

          let s = Audio.Tidal({ pattern, target:obj, key:methodName })
          
          s.start( Audio.Clock.time( delay ) )
          obj[ methodName ].tidals[ number ] = obj[ methodName ][ number ] = s 
          obj.__tidals.push( s )

          // XXX need to clean this up! this is solely here for annotations, and to 
          // match what I did for ensembles... 
          obj[ methodName ].__tidal = s

          // return object for method chaining
          return obj
        }

      return obj[ methodName ].sequencers
    }
  },

  printcb() { 
    Gibber.Gibberish.worklet.port.postMessage({ address:'callback' }) 
  },
  printobj( obj ) {
    Gibber.Gibberish.worklet.port.postMessage({ address:'print', object:obj.id }) 
  },
  send( msg ){
    Gibber.Gibberish.worklet.port.postMessage( msg )
  },

  createPubSub() {
    const events = {}
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

  createProperty: Core.createProperty,

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
    }else if( from.type === 'gen' ) {
      // gen objects can be referred to without the graphics/audio abstraction,
      // in which case they will have no .render() function, and don't need to be rendered
      const gen = from.render !== undefined ? from.render() : from

      wrappedTo[ name ] = gen
    }
  },

  createGetter( obj, name ) { return () => obj[ '__' + name ] },

  createSetter( obj, name, post, transform=null, isPoly=false ) {
    const setter = v => {
      let value, shouldSend = true

      if( typeof v === 'number' || typeof v === 'string' ) {
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
        const gen = v.render !== undefined ? v.render() : from

        obj['__'+ name ].value = gen
        value = { id: gen.id }
      }else{
        obj[ '__'+name].value = v
        value = v !== null ? { id:v.id } : v
      }
        //Audio.createMapping( v, obj, name, obj.__wrapped__ )

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
    }

    return setter
  },

  createFade( from=null, to=null, time=1, obj, name ) {
    if( from === null ) from = obj[ name ].value
    if( to === null ) to = obj[ name ].value

    time = Gibber.Clock.time( time )

    // XXX only covers condition where ramps from fades are assigned...
    // does this need to be more generic?
    if( isNaN( from ) && from.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
      from = from.to.value
    }
    if( isNaN( to ) && to.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
      to = to.to.value
    }

    let ramp = Gibber.envelopes.Ramp({ from, to, length:time, shouldLoop:false })
    // this is a key to not use an envelope follower for mapping
    ramp.__useMapping = false

    obj[ name ] = ramp

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
