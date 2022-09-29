const Presets = require( './presets.js' )
const Theory  = require( './theory.js' )
const Gibberish = require( 'gibberish-dsp' )
const seqDefaults = require( './defaults.js' )
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

const Ugen = function( gibberishConstructor, description, Audio, shouldUsePool = false, isBinop = false ) {

  let   poolCount = poolSize
  const pool = []

  const constructor = function( ...args ) {
    const properties = Presets.process( description, args, Audio ) 
    const timeProps = Audio.timeProps[ description.name ] === undefined ? [] : Audio.timeProps[ description.name ]

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
      name:description.name,
      type:'audio',

      stop( time=null ) {
        if( time === null ) {
          for( let seq of this.__sequencers ) seq.stop()
          for( let seq of this.__tidals ) seq.stop()
        }else{
          time = Audio.Clock.time( time )
          for( let seq of this.__sequencers ) {
            future( seq => seq.stop(), time, { seq })
          }

          for( let seq of this.__tidals ) {
            future( seq => seq.stop(), time, { seq })
          }
        }
        return this
      },
      play( time=null ) {
        if( time === null ) {
          for( let seq of this.__sequencers ) seq.start()
          for( let seq of this.__tidals ) seq.start()
        }else{
          time = Audio.Clock.time( time )
          for( let seq of this.__sequencers ) {
            future( seq => seq.start(), time, { seq })
          }

          for( let seq of this.__tidals ) {
            future( seq => seq.start(), time, { seq })
          }
        }

        return this
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
    if( description.name.indexOf('Poly') > -1 || description.name.indexOf('Multi') > -1 || description.name.indexOf('Soundfont') > -1 ) {
      let useProp = description.name.indexOf('Poly') > -1
      obj.spread = function( amt=1 ) {
        if( amt === 0 ) {
          children.forEach( (c,i) => { 
            if( useProp ) 
              c.pan = .5 
            else 
              if( obj.maxVoices.value > 1 ) obj.setpan(i,.5) 
          })
          return obj
        }
        const children = this.__wrapped__.voices
        const incr = 1/(children.length-1) * amt
        children.forEach( (c,i) => {
          if( useProp ) 
            c.pan = (.5 - amt/2) + i * incr
          else
            if( obj.maxVoices.value > 1 ) obj.setpan( i, (.5-amt/2) + i * incr )
        })

        return obj
      }
      obj.voices = obj.__wrapped__.voices
      obj.inspect = function() {
        console.group( 'Inspecting ' + description.name )
        console.table( Object.assign({}, obj.voices[0].__wrapped__.__properties__, obj.__wrapped__.__properties__ ) )
        console.groupEnd()
      }
      for( let i = 0; i < 20; i++ ) {
        Object.defineProperty( obj, i, { get() { return obj.voices[i] } })
      }
    }
//btos: function( beats ) {
//    const samplesPerBeat = Gibberish.ctx.sampleRate / (this.bpm / 60 )
//    return samplesPerBeat * beats 
//  }
    // transform beat values to samples
    // in the case of a gen graph convert to a new gen object
    const timetransform = function( v ) {
      const out = typeof v === 'number' 
        ? Audio.Clock.time( v ) 
        : v.type === 'gen' 
          ? Gen.make( 
              genish.mul( 
                genish.div( 44100, genish.div( Clock.bpm, 60 ) ),
                v.graph
              ) 
            )
          : v

      return out
    }

    // wrap properties and add sequencing to them
    for( let propertyName in description.properties ) {
      if( __wrappedObject.__requiredRecompilation && __wrappedObject.__requiresRecompilation.indexOf( propertyName ) > -1 ) continue
      // XXX we have to pass id in the values dictionary under 
      // certain conditions involoving gen ugens, but we don't 
      // want .id to be sequencable!
      if( propertyName !== 'id' && propertyName !== 'type' ){
        const transform = timeProps.indexOf( propertyName ) > -1 
          ? timetransform
          : null 

        const value = __wrappedObject[ propertyName ] === undefined 
          ? __wrappedObject.__properties__[ propertyName ]
          : __wrappedObject[ propertyName ]

        Audio.createProperty( obj, propertyName, value, null, 0, transform )

        // create per-voice version of property... what properties should be excluded?
        if( description.name.indexOf('Poly') > -1 || description.name.indexOf('Multi') > -1 || description.name.indexOf('Soundfont') > -1 ) {
          Audio.createProperty( obj, propertyName+'V', value, null, 0, transform, true )//, timeProps, Audio, true )

          //createProperty( obj, propertyName, __wrappedObject, timeProps, Audio, true )
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

    if( description.methods !== null && description.methods.indexOf( 'note' ) > -1 ) { 
      description.methods.push( 'notef' )
      description.methods.push( 'notec' )
    }

    // wrap methods and add sequencing to them
    if( description.methods !== null ) {
      for( let methodName of description.methods ) {
        if( methodName !== 'note' || description.name.indexOf('Sampler') > -1 || description.name.indexOf('Multisampler') > -1 ) { //|| description.name.indexOf('Soundfont') > -1 ) {
          //obj[ methodName ] = __wrappedObject[ methodName ].bind( __wrappedObject )
          obj[ methodName ] = function( ...args ) {
            if( args.length === 0 ) {
              __wrappedObject[ methodName ]()
            }else{ //if( args.length === 1 ) {
              //if( Array.isArray( args[0] ) ) {
              //  obj[ methodName ].seq( args[0], 1/args[0].length )
              //}else if( typeof args[0] === 'string' ) {
              //  obj[ methodName ].tidal( args[0] )
              //}else{
                __wrappedObject[ methodName ]( ...args )
              //}
            }/*else{
              // could be a .tidal or a seq 
              if( typeof args[0] === 'string' ) { // must be tidal with tidal id #
                obj[ methodName ].tidal( ...args )
              }else{
                obj[ methodName ].seq( ...args )  // must be sequence
              }
            }*/

            return obj
          }
          obj[ methodName ].__name  = methodName
          obj[ methodName ].__owner = obj
        }else{
          // in this block we are monkey patching the note method of Gibberish synths so that
          // they use Gibber's harmonic system inside the AudioWorkletProcessor.

          obj[ methodName ] = function( ...args ) {
            let shouldSendNoteNow = false
            if( args.length === 0 ) {
               shouldSendNoteNow = true
            }else if( args.length === 1 ) {
              if( Array.isArray( args[0] ) ) {
                obj[ methodName ].seq( args[0], 1/args[0].length )
              }else if( typeof args[0] === 'string' ) {
                obj[ methodName ].tidal( args[0] )
              }else{
                shouldSendNoteNow = true
              }
            }else{
              /*
              // could be a .tidal or a seq 
              if( typeof args[0] === 'string' ) { // must be tidal with tidal id #
                obj[ methodName ].tidal( ...args )
              }else{
                obj[ methodName ].seq( ...args )  // must be sequence
              }
              */
            }

            // this should only be for direct calls from the IDE
            if( shouldSendNoteNow && Gibberish.mode === 'worklet' ) {
              Gibberish.worklet.port.postMessage({
                address:'method',
                object:__wrappedObject.id,
                name:methodName,
                args
              })
            }

            return obj
          }
          obj[ methodName ].__name = methodName
          obj[ methodName ].__owner = obj

          Gibberish.worklet.port.postMessage({
            address:'addMethod',
            id:__wrappedObject.id,
            key:'notef',
            function:`function( note, __loudness=null ){
              const loudness = __loudness = null ? this.__triggerLoudness : __loudness
              this.___note( note, loudness ) 
            }`
          })
          Gibberish.worklet.port.postMessage({
            address:'addMethod',
            id:__wrappedObject.id,
            key:'notec',
            function:`function( note, __loudness=null ){
              const loudness = __loudness = null ? this.__triggerLoudness : __loudness
              this.note( note, loudness, false ) 
            }`
          })
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
            function:`function( note, __loudness, round=true ){ 
              const octave = this.octave || 0
              let notesInOctave = 7
              const mode = Gibberish.Theory.mode

              if( mode !== null ) {
                notesInOctave = mode !== 'chromatic' ? Gibberish.Theory.modes[ mode ].length : Gibberish.Theory.Tune.scale.length
              }else{
                notesInOctave = Gibberish.Theory.Tune.scale.length
              }

              const offset = octave * notesInOctave
              let __note = Gibberish.Theory.note( note + offset, 0, round )

              const loudness = __loudness = null ? this.__triggerLoudness : __loudness
              this.___note( __note, loudness ) 
            }`
          })
          
        }

        if( methodName === 'notef' ) {
          obj.notef = function( ...args ) {
            __wrappedObject.frequency = args[0]
            __wrappedObject.trigger( __wrappedObject.__triggerLoudness )

            return obj
          }
        }

        if( methodName === 'notec' ) {
          obj.notec = function( ...args ) {
            //__wrappedObject.frequency = args[0]
            //__wrappedObject.trigger( __wrappedObject.__triggerLoudness )
            Gibberish.worklet.port.postMessage({
              address:'method',
              object:__wrappedObject.id,
              name:'notec',
              args
            })
            return obj
          }
        }
        obj[ methodName ].sequencers = []
        obj[ methodName ].tidals = []

        obj[ methodName ].seq = function( values, timings, number=0, delay=0, priority=10000 ) {
          let prevSeq = obj[ methodName ].sequencers[ number ] 
          if( prevSeq !== undefined ) { 
            const idx = obj.__sequencers.indexOf( prevSeq )
            obj.__sequencers.splice( idx, 1 )
            //prevSeq.stop()
            prevSeq.clear()
            // removeSeq( obj, prevSeq )
          }

          let s = Audio.Core.Seq({ values, timings, target:obj/*__wrappedObject*/, key:methodName, priority })
          
          if( typeof delay !== 'function' ) {
            s.start( Audio.Clock.time( delay ) )
          }else{
            delay.seqs.push( s )
          }
          obj[ methodName ].sequencers[ number ] = obj[ methodName ][ number ] = s 
          obj.__sequencers.push( s )

          // return object for method chaining
          return obj
        }
        obj[ methodName ].tidal= function( pattern, number=0, delay=0 ) {
          let prevSeq = obj[ methodName ].tidals[ number ] 
          let s = Audio.Core.Tidal({ pattern, target:__wrappedObject, key:methodName })
          if( s !== null ) {
            if( prevSeq !== undefined ) { 
              const idx = obj.__tidals.indexOf( prevSeq )
              obj.__tidals.splice( idx, 1 )
              prevSeq.stop()
              prevSeq.clear()
              // removeSeq( obj, prevSeq )
            }

            s.start( Audio.Clock.time( delay ) )
            obj[ methodName ].tidals[ number ] = obj[ methodName ][ number ] = s 
            obj.__tidals.push( s )

            // XXX need to clean this up! this is solely here for annotations, and to 
            // match what I did for ensembles... 
            obj[ methodName ].__tidal = s
          }

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

    obj.__follow = null

    const followcheck = ()=> {

    }

    Object.defineProperty( obj, '__out', {
      configurable:false,
      get() {
        if( obj.__follow === null ) {
          obj.__follow = Audio.analysis.Follow({ input:obj }) 
        }

        const output = obj.__follow.output
         
        // will take a few buffers to initialize...
        if( output === undefined ) return 0

        return output[1] === undefined ? output[0] : output[0] + output[1] 
      },
      set(v) {}
    })

    obj.inspect = ()=> {
      console.group( 'Inspecting ' + description.name )
      const keys = Object.keys( obj.__wrapped__.__properties__ )
      const props = {}
      keys.forEach( key => {
        if( key[0] !== '_' ) {
          if( obj[ key ] !== null && obj[ key ] !== undefined ) {
            props[ key ] = obj[ key ].value
          }
        }
      })
      console.table( props ) 
      //console.table( obj.__wrapped__.__properties__ )
      console.groupEnd()
    }

    obj.out = function( scale=1, offset=0, bufferSize=null ) {
      // if the buffer size changes...
      if( bufferSize !== null ) {
        if( obj.__follow !== null ) {
          if( bufferSize !== obj.__follow.__wrapped__.bufferSize ) {
            //console.log( 'prev follow', bufferSize, obj.__follow.__wrapped__.bufferSize, obj.__follow )
            
            const tmp = obj.__follow
            // XXX need to remove the previous follow from the graph...
            obj.__follow = Audio.analysis.Follow({ input:Audio.Gibberish.worklet.ugens.get( obj.__follow.__wrapped__.input.id ), bufferSize })

            Audio.Gibberish.worklet.port.postMessage({
              address:'eval',
              code:`const idx = Gibberish.analyzers.findIndex( ugen => ugen.id === ${tmp.id} )
                    if( idx > -1 ) {
                      Gibberish.analyzers.splice(idx,1)
                      Gibberish.dirty( Gibberish.analyzers )
                    }`
            })
          }
        }
      }

      if( Ugen.OUTPUT === Ugen.OUTPUT_FUNCTION )
        return ()=> obj.__out * scale + offset
      else
        return Math.abs( obj.__out * scale ) + offset 
    }

    // XXX where does shouldAddToUgen come from? Not from presets.js...
    if( properties !== undefined && properties.shouldAddToUgen ) Object.assign( obj, properties )

    // create fx chaining api. e.g. synth.fx.add( Chorus(), Freeverb() )
    // we use the 'add' method to enable method chaining alongside instrument calls to
    // .connect() and .seq()

    const __fx = []
    __fx.__push = __fx.push.bind( __fx )
    __fx.add = function( ...args ) {
      args.forEach( fx => obj.__fx.push( fx ) )
      console.log( `added ${args.length} effect(s) to ${obj.name}` )
      return obj
    }
    __fx.inspect = function() {
      if( __fx.length > 0 )
        console.table( __fx.map( fx=>fx.name ) )
      else
        console.log( `there are no effects on ${obj.name} to inspect.` )
    }
    __fx.remove = function( effect=null ) {
      if( effect === null ) {
        obj.__fx.length = 0
        console.log( `all effects from ${obj.name} were removed.` )
      }else if( typeof effect === 'number' ) {
        // XXX broken for indices that !== 0
        const del = obj.__fx.splice( effect, 1 )
        console.log( `${del[0].name} at fx slot ${effect} was removed from ${obj.name}.` ) 
      }else if( typeof effect === 'string' ) {
        const indexesToErase = []
        __fx.forEach( (__effect,i) => { if( effect === __effect.name ) indexesToErase.push( i ) })
        console.log( `${indexesToErase.length} effect(s) were removed from ${obj.name}.` ) 
        for( let i = __fx.length - 1; i >= 0; i-- ) {
          if( indexesToErase.includes( i ) ) __fx.splice( i, 1 )
        }   
      } else if( typeof effect === 'object' ) {
        const idx = __fx.indexOf( effect )
        __fx.splice( idx, 1 )
        console.log( `effect ${effect.name} was removed from ${obj.name}.` ) 
      }
    }
    obj.__fx = new Proxy( __fx, {
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

    Object.defineProperty( obj, 'fx', {
      get() { return obj.__fx },
      set(v) {
        const tmpLength = obj.__fx.length
        obj.__fx.length = 0
        if( Array.isArray( v ) ) {
          v.forEach( effect => obj.__fx.push( effect ) ) 
        }else{
          obj.__fx.push( v ) 
        }

        if( tmpLength > 0 ) {

            console.log( `${tmpLength} effect(s) were replaced with ${obj.__fx.length} effect(s) on ${obj.name}` )
        }else{

          if( Array.isArray( v ) ) {
            console.log( `${v.length} effect(s) were added to the fx chain of ${obj.name}` )
          }else{
            console.log( `a ${v.name} was added to the fx chain  of ${obj.name}` )
          }
        }
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
          const add = Audio.binops.Add( ...sum ) 
          // below works for oscillators, above works for instruments...
          //const add = Gibber.Gibberish.binops.Add( ...sum ) 
          add.__useMapping = false
          dest.__owner[ dest.name ] = add

          obj.__wrapped__.connected.push( [ dest.__owner[ dest.name ], obj ] )
        }else{
          // if no fx chain, connect directly to output
          if( obj.fx.length === 0 ) {
            __wrappedObject.connect( dest, level )
          }else{
            // otherwise, connect last effect in chain to output
            obj.fx[ obj.fx.length - 1 ].__wrapped__.connect( dest, level )
          }
        }
      }else{
        console.log( '%cYou cannot connect to a number; perhaps you meant this to be the level for your connection?', 'color:white;background:#900' )
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

    const instrumentName = description.name ==='Multisampler' ? 'Sampler' : description.name
    if( Gibber.extensions !== undefined && Gibber.extensions[ instrumentName ] !== undefined ) {
      Object.assign( obj, Gibber.extensions[ instrumentName ] ) 
    }
    // presetInit is a function in presets that triggers actions after the ugen
    // has been instantiated... it is primarily used to add effects and modulations
    // to a preset.
    if( properties !== undefined && properties.__presetInit__ !== undefined ) {
      properties.__presetInit__.call( obj, Audio, args[1] )
    }

    // only connect if shouldNotConneect does not equal true (for LFOs and other modulation sources)
    if( obj.__wrapped__.type === 'instrument' || obj.__wrapped__.type === 'oscillator' || description.name.indexOf('Poly') > -1 ) {
      if( typeof properties !== 'object' || properties.shouldNotConnect !== true ) {
        
        if( Audio.autoConnect === true ) {
          // ensure that the ugen hasn't already been connected through the fx chain,
          // possibly through initialization of a preset
          if( obj.fx.length === 0 ) obj.connect( Audio.Master )
        }
      }

    }else if( obj.__wrapped__.type === 'effect' ) {
      obj.bus = function() {
        const b = Audio.busses.Bus2()
        b.fx.add( obj )

        const p = new Proxy( b, {
          set( target, property, value, receiver ) {
            // console.log( 'set:', target, property, value, receiver )
            if( b[ property ] === undefined && property !== 'input' ) {
              obj[ property ] = value
            }else{
              b[ property ] = value
            }
          },
          get( target, property, value, receiver ) {
            if( b[ property ] === undefined && property !== 'input' ) {
              return obj[ property ]
            }else{
              return b[ property ]
            }
          }
        })

        p.inspect = function() {
          console.group( 'Inspecting ' + description.name + ' ' + 'Bus' )

          const objKeys = Object.keys( obj.__wrapped__.__properties__ )
          const __obj = {}
          objKeys.forEach( key => {
            //console.log( 'key:', key, obj.__wrapped__ )
            if( key[0] !== '_' && key !== 'bypass' && obj[key] !== undefined ) {
              __obj[ key ] = obj[ key ].value !== undefined
                ? obj[ key ].value
                : obj.__wrapped__.__properties__[ key ].value
            }
          })
          console.group( description.name.toLowerCase() )
          console.table( __obj )
          console.groupEnd()

          console.group('bus')
          console.table( b.__wrapped__.__properties__ )
          console.groupEnd()

          console.groupEnd()
        }

        return p
      }
    }

    // create default sequencing methods
    if( obj.seq === undefined ) {
      obj.seq = function( values, timings, number=0, delay=0, priority=10000 ) {
        const methodName = seqDefaults[ obj.name ] 
        let prevSeq = obj[ methodName ].sequencers[ number ] 
        if( prevSeq !== undefined ) { 
          const idx = obj.__sequencers.indexOf( prevSeq )
          obj.__sequencers.splice( idx, 1 )
          //prevSeq.stop()
          prevSeq.clear()
          // removeSeq( obj, prevSeq )
        }

        let s = Audio.Core.Seq({ values, timings, target:obj/*__wrappedObject*/, key:methodName, priority })

        if( typeof delay !== 'function' ) {
          s.start( Audio.Clock.time( delay ) )
        }else{
          delay.seqs.push( s )
        }
        obj[ methodName ].sequencers[ number ] = obj[ methodName ][ number ] = s 
        obj.__sequencers.push( s )

        // return object for method chaining
        return obj
      }
      obj.tidal= function( pattern, number=0, delay=0 ) {
        const methodName = seqDefaults[ obj.name ] 
        let prevSeq = obj[ methodName ].tidals[ number ] 
        let s = Audio.Core.Tidal({ pattern, target:__wrappedObject, key:methodName })
        if( s !== null ) {
          if( prevSeq !== undefined ) { 
            const idx = obj.__tidals.indexOf( prevSeq )
            obj.__tidals.splice( idx, 1 )
            prevSeq.stop()
            prevSeq.clear()
            // removeSeq( obj, prevSeq )
          }

          s.start( Audio.Clock.time( delay ) )
          obj[ methodName ].tidals[ number ] = obj[ methodName ][ number ] = s 
          obj.__tidals.push( s )

          // XXX need to clean this up! this is solely here for annotations, and to 
          // match what I did for ensembles... 
          obj[ methodName ].__tidal = s
        }

        // return object for method chaining
        return obj
      } 
    }
    //console.log( `%c${description.name} created.`, 'color:white;background:#009' )
    Audio.publish( 'new ugen', description.name + ' created'  )

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
  
  //Ugen.createProperty = createProperty

  return constructor
}

Ugen.OUTPUT_FUNCTION = 0
Ugen.OUTPUT_SCALAR = 1
Ugen.OUTPUT = 1


module.exports = Ugen
