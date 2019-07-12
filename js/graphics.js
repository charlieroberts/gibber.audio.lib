const Marching = require( 'marching' )

let Gibber = null

const excludeFromSequencing = ['material']

const Graphics = {
  canvas:null,
  ctx:null,
  quality:3,
  animate:true,
  camera:null,
  __doNotExport: ['export', 'init', 'run', 'make' ],
  __running:     false,
  __scene:       [],
  __fogColor:    Marching.vectors.Vec3(0),
  __fogAmount:   0,

  camera : {
    pos: { x:0, y:0, z:5 },
    dir: { x:0, y:0, z:1 },
    rotation: 0,
    initialized: false,

    // XXX we have to run this everytime we render as Marching.js
    // makes a brand new camera
    init() {
      let storepos, storedir
      if( Graphics.camera.initialized === true ) {
        // store current camera data
        storepos = { x:Graphics.camera.pos.x, y:Graphics.camera.pos.y, z:Graphics.camera.pos.z }
        storedir = { x:Graphics.camera.dir.x, y:Graphics.camera.dir.y, z:Graphics.camera.dir.z }
        storerot = Graphics.camera.rotation.value
      }

      // we must re-execute to use current Marching.js camera
      Graphics.createProperty( Graphics.camera.pos, 'x', 0, Marching.camera.pos ) 
      Graphics.createProperty( Graphics.camera.pos, 'y', 0, Marching.camera.pos ) 
      Graphics.createProperty( Graphics.camera.pos, 'z', 5, Marching.camera.pos ) 
      
      Graphics.createProperty( Graphics.camera, 'rotation', 0, Marching.camera ) 
      
      if( Graphics.camera.initialized === true ) {
        camera.pos.z = storepos.z.value
        camera.pos.x = storepos.x.value
        camera.pos.y = storepos.y.value

        camera.rotation = storerot
        // XXX do dir
      }

      Graphics.camera.initialized = true
    }
  },

  export( obj ) {
    for( key in this ) {
      if( this.__doNotExport.indexOf( key ) === -1 ) obj[ key ] = this[ key ]
    }

    obj.march = Marching.createScene.bind( Marching )
    obj.Material = Marching.Material
    obj.Camera = Graphics.camera
    obj.Fog = Graphics.fog.bind( Graphics )
  },

  init( props, __Gibber ) {
    Gibber = __Gibber

    this.canvas = props.canvas || document.querySelector( 'canvas' )
    this.__native  = {}
    this.__wrapped = {}

    this.run()


    for( let name in Marching.primitives ) {
      this.make( name, Marching.primitives[ name ] )
    }
    for( let name in Marching.distanceOps ) {
      this.make( name, Marching.distanceOps[ name ] )
    }
    for( let name in Marching.domainOps ) {
      this.make( name, Marching.domainOps[ name ] )
    }
    for( let name in Marching.alterations ) {
      this.make( name, Marching.alterations[ name ] )
    }
    Object.assign( this, Marching.vectors )
    Marching.export( this.__native )

    Gibber.subscribe( 'clear', Marching.clear.bind( Marching ) )
  },

  run() {
    Marching.init( this.canvas )
    this.__running = true
  },

  fog( amount=.25, color=Marching.vectors.Vec3(0) ) {
    this.__fogColor = color
    this.__fogAmount = amount
  },

  make( name, op ) {
    this[ name ] = function( ...args ) {
      if( this.__running === false ) this.run()

      // XXX do these need to be proxies? We're basically creating
      // proxies by binding the GLSL codegen functions below...
      const wrapped = op( ...args )

      const instance = {
        __wrapped: wrapped,
        __id: Gibber.Gibberish.utilities.getUID(),
        __sequencers:[],

        emit: wrapped.emit.bind( wrapped ),
        emit_decl: wrapped.emit_decl.bind( wrapped ),
        update_location: wrapped.update_location.bind( wrapped ),
        //

        tidals:[],

        render( animate=null ) {
          //if( Graphics.__scene.indexOf( instance ) === -1 ) {
          //  Graphics.__scene.push( instance )
          //}
          ///// XXX need to replace overwritten .emit methods from previous scenes...
          //Marching.createScene( ...Graphics.__scene ).render( Graphics.quality, Graphics.animate )

          /* XXX
           * Should multiple ops be allowed to render at once? similar to march( obj1, obj2 )
           * we could combine them in a Union... we'd have to previously written .emit methods
           * or figure out a better way to deal with that from inside marching.js
           */

          let scene = Marching.createScene( wrapped )
          if( Graphics.__fogAmount !== 0 ) {
            scene = scene.fog( Graphics.__fogAmount, Graphics.__fogColor )
          }

          scene.render( Graphics.quality, animate !== null ? animate : Graphics.animate )

          Graphics.camera.init()

          return instance
        }

      }

      if( wrapped.upload_data !== undefined ) instance.upload_data = wrapped.upload_data.bind( wrapped )

      for( let param of wrapped.__desc.parameters ) {
        if( excludeFromSequencing.indexOf( param.name )  > -1 || param.name === undefined ) continue

        Graphics.createProperty( 
          instance, 
          param.name, 
          wrapped[ param.name ],
          wrapped
        )

      }

      // hack to make audio sequencing work with graphical objects
      Gibber.Gibberish.worklet.ugens.set( instance.__id, instance )

      return instance
    }
  },

  createMapping( from, to, name, wrappedTo ) {
    if( from.type === 'audio' ) {
      const f = to[ '__' + name ].follow = Follow({ input: from })

      Marching.callbacks.push( time => {
        if( f.output !== undefined ) {
          to[ name ] = f.output
        }
      })

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
    }else if( from.type === 'gen' ) {
      const gen = from.render( 60, 'graphics' )

      // needed for annotations
      to[ name ].value.id = to[ name ].value.varName

      if( to[ name ].value.callback  !== undefined ) {
        const idx = Marching.callbacks.indexOf( to[ name ].value.callback )
        Marching.callbacks.splice( idx, 1 )
      }
      to[ name ].value.callback = t => {
        const val = gen()
        to[ name ] = val
        //console.log( 'val:', val, to[ name ].value.widget !== undefined )
        Environment.codeMarkup.waveform.updateWidget( to[ name ].value.widget, val, false )
      }
      Marching.callbacks.push( to[ name ].value.callback )
    }
  },

  ease( t ) {  return t < .5 ? 2*t*t : -1+(4-2*t)*t },

  createProperty( obj, name, value, wrapped ) {
    obj[ '__' + name ] = { 
      get value() { 
        return wrapped[ name ] 
      },
      set value(v) { 
        if( typeof v === 'object' ) {
          Graphics.createMapping( v, obj, name, wrapped )
        }else{
          wrapped[ name ] = v 
        }
      },

      isProperty:true,
      type:'graphics',
      sequencers:[],
      tidals:[],
      name,
      valueOf() { return __getter() },

      map( from, mult, offset ) {
        obj[ '__' + name ].value = from
        obj[ '__' + name ].offset = offset
        obj[ '__' + name ].multiplier = mult
      },

      fade( from, to, time ) {
        const lengthInFrames = time * 60
        const diff = to - from
        const incr = diff / lengthInFrames

        let frameCount = 0
        const fadeFunc = (timeInSeconds,timestamp) => {
          if( frameCount++ < lengthInFrames ) {
            const percent = frameCount / lengthInFrames 
            const val = Graphics.ease( percent ) 
            obj[ name ] = from + val * diff
            const widget = obj[ name ].value.widget

            if( widget !== undefined ) {
              widget.isFade = true
              widget.min = from
              widget.max = to
              obj[ name ].value.from = from
              obj[ name ].value.to = to

              Environment.codeMarkup.waveform.updateWidget( widget, from + val * diff, false )
            }
          }else{
            const prop = obj[ name ].value
            if( prop.widget !== undefined ) prop.widget.clear()
            delete prop.from
            delete prop.to

            Marching.callbacks.splice( Marching.callbacks.indexOf( fadeFunc ), 1 )
          }
        }

        Marching.callbacks.push( fadeFunc )
      },

      seq( values, timings, number = 0, delay = 0 ) {
        let prevSeq = obj[ '__' + name ].sequencers[ number ] 
        if( prevSeq !== undefined ) { 
          prevSeq.clear();
        }

        // XXX you have to add a method that does all this shit on the worklet. crap.
        obj[ '__' + name ].sequencers[ number ] = obj[ '__'+name ][ number ] = Gibber.Seq({ 
          values, 
          timings, 
          target:{ id:obj.__id }, 
          // ridiculous hack for making graphical objects work with audio sequencing
          mainthreadonly:obj.__id,
          key:name,
          priority:0, 
        })
        .start( Gibber.Clock.time( delay ) )

        // return object for method chaining
        return obj
      },
      tidal( pattern,  number = 0, delay = 0 ) {
        let prevSeq = obj[ '__' + name ].sequencers[ number ] 
        if( prevSeq !== undefined ) {
          const idx = obj.__sequencers.indexOf( prevSeq )
          obj.__sequencers.splice( idx, 1 )
          // XXX stop() destroys an extra sequencer for some reason????
          prevSeq.stop()
          prevSeq.clear()
          //removeSeq( obj, prevSeq )
        }

        const s = Gibber.Tidal({ 
          pattern, 
          target:{ id:obj.__id }, 
          mainthreadonly:obj.__id,
          key:name,
        })

        s.start( Gibber.Clock.time( delay ) )

        obj[ '__' + name ].sequencers[ number ] = obj[ '__' + name ][ number ] =  obj[ '__'+name].tidals[ number ] = s

        obj.tidals.push( s )

        // return object for method chaining
        return obj
      },
    }

    //const __getter = () => getter()
    const __getter = () => {
      return obj[ '__'+name ]
    }

    const __setter = v => {
      obj['__'+name].value = v

      if( isNaN( wrapped[ name ] ) ) {
      
      }else{
        wrapped[ name ] = v
      }
    }

    Object.defineProperty( obj, name, {
      configurable:true,
      get: __getter,
      set: __setter
    })
  }


}

module.exports = Graphics
