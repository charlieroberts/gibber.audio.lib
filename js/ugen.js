const Presets = require( './presets.js' )
const Theory  = require( './theory.js' )
const Gibberish = require( 'gibberish-dsp' )

// what properties should be automatically (automagickally?)
// filtered through Audio.Clock.time()?
const __timeProps = {
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

// Gibber ugens are essentially wrappers around underlying gibberish 
// ugens, providing convenience methods for rapidly sequencing
// and modulating them.

const poolSize = 12

// DRY method for removing a sequence and its associated annotations.
const removeSeq = function( obj, seq ) {
  const idx = obj.__sequencers.indexOf( seq )
  obj.__sequencers.splice( idx, 1 )
  seq.stop()
  seq.clear()
}

const createMapping = function( from, to, name, wrappedTo ) {
  if( from.__useMapping === false ) {
    wrappedTo[ name ] = from
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
}
const createProperty = function( obj, propertyName, __wrappedObject, timeProps, Audio, isPoly=false ) {
  const namestore = propertyName 
  if( isPoly === true ) propertyName += 'V'

  const prop =  obj[ '__' + propertyName ] = {
    isProperty:true,
    sequencers:[],
    type:'audio',
    tidals:[],
    mods:[],
    name:propertyName,
    __isPoly:isPoly,

    get value() {
      return __wrappedObject[ propertyName ]
    },
    set value(v) {
      if( v !== undefined ) {
        if( typeof v === 'number' || typeof v === 'string' ) {
          const value = timeProps.indexOf( isPoly===true ? namestore : propertyName ) > -1 && typeof v === 'number' ? Audio.Clock.time( v ) : v

          if( isPoly === true ) {
            __wrappedObject.voices[ __wrappedObject.voiceCount % __wrappedObject.voices.length ][ namestore ] = value
          }else{
            __wrappedObject[ propertyName ] = value
          }
        }else{
          createMapping( v, obj, propertyName, __wrappedObject )
        }
      }
    },

    seq( values, timings, number = 0, delay = 0 ) {
      let prevSeq = obj[ propertyName ].sequencers[ number ] 
      if( prevSeq !== undefined ) {
        const idx = obj.__sequencers.indexOf( prevSeq )
        obj.__sequencers.splice( idx, 1 )
        // XXX stop() destroys an extra sequencer for some reason????
        //prevSeq.stop()
        prevSeq.clear()
        //removeSeq( obj, prevSeq )
      }

      const s = Audio.Seq({ 
        values, 
        timings, 
        target:__wrappedObject, 
        key:propertyName,
      })

      if( timeProps.indexOf( isPoly === true ? namestore : propertyName ) !== -1  ) {
        s.values.addFilter( (args,ptrn) => {
          if( Gibberish.mode === 'processor' ) {
            args[0] = Gibberish.Clock.time( args[0] )
            return args
          }
        })
      }

      s.start( Audio.Clock.time( delay ) )

      obj[ propertyName ].sequencers[ number ] = obj[ propertyName ][ number ] = s
      obj.__sequencers.push( s )

      // return object for method chaining
      return obj
    },

    tidal( pattern,  number = 0, delay = 0 ) {
      let prevSeq = obj[ propertyName ].tidals[ number ] 
      if( prevSeq !== undefined ) {
        const idx = obj.__tidals.indexOf( prevSeq )
        obj.__tidals.splice( idx, 1 )
        // XXX stop() destroys an extra sequencer for some reason????
        prevSeq.stop()
        prevSeq.clear()
        //removeSeq( obj, prevSeq )
      }

      const s = Audio.Tidal({ 
        pattern, 
        target:__wrappedObject, 
        key:propertyName,
      })

      s.start( Audio.Clock.time( delay ) )

      obj[ propertyName ].tidals[ number ] = obj[ propertyName ][ number ] = s
      obj.__tidals.push( s )

      // return object for method chaining
      return obj
    },

    fade( from=null, to=null, time=1 ) {
      if( from === null ) from = prop.value
      if( to === null ) to = prop.value

      time = Gibber.Clock.time( time )

      // XXX only covers condition where ramps from fades are assigned...
      // does this need to be more generic?
      if( isNaN( from ) && from.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
        from = from.to.value
      }
      if( isNaN( to ) && to.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
        to = to.to.value
      }

      let value = Gibber.envelopes.Ramp({ from, to, length:time, shouldLoop:false })
      // this is a key to not use an envelope follower for mapping
      value.__useMapping = false

      prop.value = value

      if( prop.value.__wrapped__ === undefined ) prop.value.__wrapped__ = {}
      prop.value.__wrapped__.values = []

      prop.value.__wrapped__.output = v => {
        if( prop.value.__wrapped__ !== undefined ) {
          prop.value.__wrapped__.values.unshift( v )
          while( prop.value.__wrapped__.values.length > 60 ) prop.value.__wrapped__.values.pop()
        }
      }

      prop.value.__wrapped__.finalize = () => {
        const store = prop.value

        // XXX I can't quite figure out why I have to wait to reset the property
        // value here... if I don't, then the fade ugen stays assigned in the worklet processor.
        // and 0 doesn't work!
        setTimeout( ()=> obj[ propertyName ] = store.to.value === 0 ? .000001 : store.to.value, 0 )
        store.__wrapped__.widget.clear()
      }

      return obj
    },

    ugen:obj
  }

  prop.mods.clear = ()=> prop.mods.length = 0

  Object.defineProperty( obj, propertyName, {
    get() { return obj[ '__' + propertyName ] },
    set(v){
      // XXX need to accomodate non-scalar values
      // i.e. mappings

      if( v === undefined || v === null ) return
      if( typeof v === 'number' && isNaN(v) ) {
        if( obj.__isGen !== true ) {
          console.warn('An invalid property assignment was attempted. Did you forget to use property.value?')
          return
        }
      }

      //if( v !== null && typeof v !== 'object' ) 
        obj[ '__' + propertyName ].value = v
      //else
      //  obj[ '__' + propertyName ] = v
    }
  })

}

const Ugen = function( gibberishConstructor, description, Audio, shouldUsePool = false, isBinop = false ) {

  let   poolCount = poolSize
  const pool = []

  const constructor = function( ...args ) {
    const properties = Presets.process( description, args, Audio ) 
    const timeProps = __timeProps[ description.name ] === undefined ? [] : __timeProps[ description.name ]

    if( timeProps.length > 0 ) {
      for( let key in properties ) {
        if( timeProps.indexOf( key ) > -1 ) {
          properties[ key ] = Audio.Clock.time( properties[ key ] )
        }
      }
    }

    // XXX if you want to use pooling you must also uncomment near the bottom of this file...
    // Pooling could work for reverbs IF:
    // 1. There would have to be separate mono and stereo pools.2
    // 2. Reverbs would need to run with 0 input for a while so that the functions are JIT'd

    //if( shouldUsePool && poolCount < pool.length ) {
    //  pool[ poolCount ].inUse = true
    //  const poolUgen = pool[ poolCount ].ugen
    //  poolCount++
    //  Object.assign( poolUgen, properties, args )
    //  console.log( 'pool ugen:', poolUgen )
    //  return poolUgen
    //}

    let __wrappedObject
    if( isBinop === true ) {
      __wrappedObject = gibberishConstructor( ...args ) 
    }else{
      __wrappedObject = gibberishConstructor( properties )
    }
    
    const obj = { 
      __wrapped__ :__wrappedObject,
      __sequencers : [], 
      __tidals: [],
      type:'audio',

      stop() {
        for( let seq of this.__sequencers ) seq.stop()
        for( let seq of this.__tidals ) seq.stop()
      },
      start() {
        for( let seq of this.__sequencers ) seq.start()
        for( let seq of this.__tidals ) seq.start()
      },
      clear() {
        for( let seq of this.__sequencers ) {
          seq.clear()
        }
        for( let seq of this.__tidals ) {
          seq.clear()
        }
        //console.log( Gibberish.mode, __wrappedObject.connected )
        if( __wrappedObject.connected !== undefined ) {
          for( let connection of __wrappedObject.connected ) {
            if( this.fx.indexOf( connection[ 0 ] ) === -1 ) {
              this.disconnect( connection[ 0 ] )
            }else{
              this.disconnect()
            }
          }
        }
        if( this.__onclear !== undefined ) {
          this.__onclear()
        }
      }
    }

    // add poly methods
    if( description.name.indexOf('Poly') > -1 ) {
      obj.spread = function( amt=1 ) {
        if( amt === 0 ) {
          children.forEach( c => c.pan = .5 )
          return
        }
        const children = this.__wrapped__.voices
        const incr = 1/(children.length-1) * amt
        children.forEach( (c,i) => c.pan = (.5 - amt/2) + i * incr )
      }
      obj.voices = obj.__wrapped__.voices
    }

    // wrap properties and add sequencing to them
    for( let propertyName in description.properties ) {
      // XXX we have to pass id in the values dictionary under 
      // certain conditions involoving gen ugens, but we don't 
      // want .id to be sequencable!
      if( propertyName !== 'id' && propertyName !== 'type' ){
        createProperty( obj, propertyName, __wrappedObject, timeProps, Audio )

        // create per-voice version of property... what properties should be excluded?
        if( description.name.indexOf('Poly') > -1 ) {
          createProperty( obj, propertyName, __wrappedObject, timeProps, Audio, true )
          // we don't have a way to add properties to objects in the processor thread
          // so we'll just add a method... sequencing will still work the same.
          Gibberish.worklet.port.postMessage({
            address:'addMethod',
            id:__wrappedObject.id,
            key:propertyName+'V',
            function:`function( v ) {this.voices[ this.voiceCount % this.voices.length ][ '${propertyName}' ] = v }`
          })
        }
      }
    }

    // wrap methods and add sequencing to them
    if( description.methods !== null ) {
      for( let methodName of description.methods ) {
        if( methodName !== 'note' ) {
          obj[ methodName ] = __wrappedObject[ methodName ].bind( __wrappedObject )
        }else{
          // in this block we are monkey patching the note method of Gibberish synths so that
          // they use Gibber's harmonic system inside the AudioWorkletProcessor.

          obj[ methodName ] = function( ...args ) {
            // this should only be for direct calls from the IDE
            if( Gibberish.mode === 'worklet' ) {
              Gibberish.worklet.port.postMessage({
                address:'method',
                object:__wrappedObject.id,
                name:methodName,
                args
              })
            }
          }

          // when a message is received at the address 'monkeyPatch',
          // Gibberish will create a copy of the method identified by
          // the 'key' field, and then assign it back to the object prefaced
          // with double underscores (e.g. __note). The function that is being
          // patched in can then call the original function using the prefaced 
          // name, as is done in the last line of the argument function below.
          Gibberish.worklet.port.postMessage({
            address:'monkeyPatch',
            id:__wrappedObject.id,
            key:'note',
            function:`function( note ){ 
              const octave = this.octave || 0
              let notesInOctave = 7
              const mode = Gibberish.Theory.mode

              if( mode !== null ) {
                notesInOctave = mode !== 'chromatic' ? Gibberish.Theory.modes[ mode ].length : Gibberish.Theory.Tune.scale.length
              }else{
                notesInOctave = Gibberish.Theory.Tune.scale.length
              }

              const offset = octave * notesInOctave
              let __note = Gibberish.Theory.note( note + offset );

              this.___note( __note, this.__triggerLoudness ) 
            }`
          })
          
        }

        obj[ methodName ].sequencers = []
        obj[ methodName ].tidals = []

        obj[ methodName ].seq = function( values, timings, number=0, delay=0 ) {
          let prevSeq = obj[ methodName ].sequencers[ number ] 
          if( prevSeq !== undefined ) { 
            const idx = obj.__sequencers.indexOf( prevSeq )
            obj.__sequencers.splice( idx, 1 )
            //prevSeq.stop()
            prevSeq.clear()
            // removeSeq( obj, prevSeq )
          }

          let s = Audio.Seq({ values, timings, target:__wrappedObject, key:methodName })
          
          s.start( Audio.Clock.time( delay ) )
          obj[ methodName ].sequencers[ number ] = obj[ methodName ][ number ] = s 
          obj.__sequencers.push( s )

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

          let s = Audio.Tidal({ pattern, target:__wrappedObject, key:methodName })
          
          s.start( Audio.Clock.time( delay ) )
          obj[ methodName ].tidals[ number ] = obj[ methodName ][ number ] = s 
          obj.__tidals.push( s )

          // XXX need to clean this up! this is solely here for annotations, and to 
          // match what I did for ensembles... 
          obj[ methodName ].__tidal = s

          // return object for method chaining
          return obj
        }
      }
    }


    let id = __wrappedObject.id
    Object.defineProperty( __wrappedObject, 'id', {
      configurable:false,
      get() { return id },
      set(v) {
        //console.log( 'tried to change id:', obj )
        //debugger
      }
    })
    obj.id = __wrappedObject.id

    // XXX where does shouldAddToUgen come from? Not from presets.js...
    if( properties !== undefined && properties.shouldAddToUgen ) Object.assign( obj, properties )

    // create fx chaining api. e.g. synth.fx.add( Chorus(), Freeverb() )
    // we use the 'add' method to enable method chaining alongside instrument calls to
    // .connect() and .seq()

    const __fx = []
    __fx.__push = __fx.push.bind( __fx )
    __fx.add = function( ...args ) {
      obj.fx.push( ...args )
      return obj
    }
    obj.fx = new Proxy( __fx, {
      set( target, property, value, receiver ) {

        const lengthCheck = target.length
        const old = target.slice(0)
        target[ property ] = value
        
        if( property === 'length' ) { 
          if( target.length > 1 ) {
            // XXX need to store and reassign to end connection
            target[ target.length - 2 ].disconnect()
            target[ target.length - 2 ].connect( target[ target.length - 1 ] )
            target[ target.length - 1 ].connect()
          }else if( target.length === 1 ) {
            const connected = __wrappedObject.connected !== undefined ?__wrappedObject.connected.slice(0) : null
            __wrappedObject.disconnect()
            __wrappedObject.connect( target[ 0 ] )

            if( connected !== null ) {
              for( let connection of connected ) {
                // 0 is bus, 1 is ugen adding the fx, 2 is send amount
                target[0].connect( connection[0], connection[2] )
              }
            }else{
              target[0].connect( Audio.Master )
            }
          }else if( value === 0 && lengthCheck !== 0 ) {
            // ugh...
            if( __wrappedObject.connected !== undefined ) {
              if( __wrappedObject.connected[0] !== undefined ) {
                __wrappedObject.connect( 
                  __wrappedObject.connected[ 0 ][ 0 ].__wrapped__.connected[ 0 ][ 0 ], 
                  __wrappedObject.connected[ 0 ][ 0 ].__wrapped__.connected[ 0 ][ 2 ] 
                )

                __wrappedObject.connected[ 0 ][ 0 ].disconnect()
              }
            }
          }

        }

        return true
      }
    })

    obj.connect = (dest,level=1) => {
      if( typeof dest !== 'number' ) {
        if( dest !== undefined && dest.isProperty === true ) {
          // if first modulation for property, store it's initial
          // value before modulating it.
          if( dest.preModValue === undefined ) { 
            dest.preModValue = dest.value
          }

          dest.mods.push( obj )

          const sum = dest.mods.concat( dest.preModValue )
          const add = Gibber.binops.Add( ...sum ) 
          add.__useMapping = false
          dest.ugen[ dest.name ] = add

          obj.__wrapped__.connected.push( [ dest.ugen[ dest.name ], obj ] )
        }else{
          // if no fx chain, connect directly to output
          if( obj.fx.length === 0 ) {
            __wrappedObject.connect( dest,level )
          }else{
            // otherwise, connect last effect in chain to output
            obj.fx[ obj.fx.length - 1 ].__wrapped__.connect( dest, level )
          }
        }
      }else{
        console.warn( 'You cannot connect to a number; perhaps you meant this to be the level for your connection?' )
      }

      return obj 
    } 

    obj.disconnect = dest => { 
      // if there's an effect chain, we disconnect that in addition
      // to disconnecting the ugen itself.
      if( dest === undefined && obj.fx.length > 0 ) {
        obj.fx[ obj.fx.length - 1 ].disconnect()
      }

      __wrappedObject.disconnect(); 
      
      return obj 
    } 

    Object.defineProperty( obj, '_', { get() { obj.disconnect(); return obj } })

    // presetInit is a function in presets that triggers actions after the ugen
    // has been instantiated... it is primarily used to add effects and modulations
    // to a preset.
    if( properties !== undefined && properties.__presetInit__ !== undefined ) {
      properties.__presetInit__.call( obj, Audio )
    }

    // only connect if shouldNotConneect does not equal true (for LFOs and other modulation sources)
    if( obj.__wrapped__.type === 'instrument' || obj.__wrapped__.type === 'oscillator' ) {
      if( typeof properties !== 'object' || properties.shouldNotConnect !== true ) {
        
        if( Audio.autoConnect === true ) {
          // ensure that the ugen hasn't already been connected through the fx chain,
          // possibly through initialization of a preset
          if( obj.fx.length === 0 ) obj.connect( Audio.Master )
        }
      }
    }

    return obj
  }

  //if( shouldUsePool ) {
  //  for( let i=0; i < poolSize; i++ ) {
  //    pool[ i ] = {
  //      inUse:false,
  //      ugen: constructor()
  //    }
  //  } 

  //  poolCount = 0
  //}
  
  Ugen.createProperty = createProperty

  return constructor
}

module.exports = Ugen
