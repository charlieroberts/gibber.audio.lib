const Marching = require( 'marching' )

let Gibber = null

const excludeFromSequencing = ['material']

const Graphics = {
  canvas:null,
  ctx:null,
  quality:3,
  animate:true,
  camera:null,
  initialized: false,
  __doNotExport: ['export', 'init', 'run', 'make' ],
  __running:     false,
  __scene:       [],
  __fogColor:    Marching.vectors.Vec3(0),
  __fogAmount:   0,
  __background:  Marching.vectors.Vec3(0),
  __onrender:    [],
  __protomethods:['translate','scale','rotate','texture','material'],
  __lights:[],

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
    obj.Texture  = Marching.Texture
    obj.Camera = Graphics.camera
    obj.Fog = Graphics.fog.bind( Graphics )
    obj.Background = Graphics.background.bind( Graphics )
    obj.Light = Graphics.light.bind( Graphics ) 
  },

  init( props, __Gibber ) {
    Gibber = __Gibber

    this.canvas = props.canvas || document.querySelector( 'canvas' )
    this.__native  = {}
    this.__wrapped = {}

    Marching.init( this.canvas, false )

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
    for( let name in Marching.distanceDeforms) {
      this.make( name, Marching.distanceDeforms[ name ] )
    }
    Object.assign( this, Marching.vectors )
    Marching.export( this.__native )

    this.clear = () => {
      Marching.clear()

      const sheet = window.document.styleSheets[ window.document.styleSheets.length - 1 ]
      if( sheet.cssRules.length > 0 ) {
        sheet.deleteRule(
          sheet.cssRules.length - 1
        )
      }
    }
    Gibber.subscribe( 'clear', this.clear )
  },

  run() {
    if( this.initialized === false ) {
      Marching.initBuffers()
      this.__running = true
      this.initialized = true
    }
  },

  background( color=Marching.vectors.Vec3(0) ) { Graphics.__background = color },
  fog( amount=.25, color=Marching.vectors.Vec3(0), shouldRender=true) {
    this.__fogColor = color
    this.__fogAmount = amount
    //if( shouldRender ) {
    //  console.log( Graphics.scene )
    //  console.log( Graphics[ Graphics.scene[0] ] )
    //  let obj =   Graphics[ Graphics.scene[0] ]( ...Graphics.scene[1] ) 

    //  obj.render()
    //  //scene.render( Graphics.quality, Graphics.animate )

    //  Graphics.camera.init()
    //}
    const obj = {
      get color() {
        if( Graphics.scene === undefined ) {
          return color
        }else{
          return Graphics.scene.postprocessing[0].color
        }
      },

      get amount() { 
        if( Graphics.scene === undefined ) {
          return amount 
        }else{
          return Graphics.scene.postprocessing[0].amount
        }
      },
      set amount(v) { 
        amount = v
        Graphics.scene.postprocessing[0].amount = v 
      }
    }

    Graphics.__onrender.push( ()=> {
      Graphics.createProperty( 
        obj, 
        'color', 
        Graphics.scene.postprocessing[0].color,
        Graphics.scene.postprocessing[0]
      )
    })
    Graphics.__onrender.push( ()=> {
      Graphics.createProperty( 
        obj, 
        'amount', 
        Graphics.scene.postprocessing[0].amount,
        Graphics.scene.postprocessing[0]
      )
    })
    return obj

  },


  texture( ...args ) {
    const tex = typeof args[0] === 'string' ? Marching.Texture( ...args ) : args[0]
    instance.__textureObj = wrapped.__textureObj = tex

    for( let p of tex.parameters ) {
      Graphics.createProperty( 
        instance.texture, 
        p.name, 
        tex[ p.name ],
        tex 
      )
    }

    instance.texture.tidals = wrapped.texture.tidals = []
    instance.texture.__sequencers = wrapped.texture.__sequencers = []
    instance.texture.__id = wrapped.texture.__id = __wrapped.__id = Gibber.Gibberish.utilities.getUID()
    Gibber.Gibberish.worklet.ugens.set( instance.texture.__id, instance.texture )

    return instance 
  },

  light( ...args ) {
    const light = Marching.Light( ...args )
    /*instance.__lightObj = wrapped.__lightObj = light 

    Graphics.createProperty( 
      instance.light, 
      p.name, 
      tex[ p.name ],
      tex 
    )
    instance.light.tidals = wrapped.light.tidals = []
    instance.light.__sequencers = wrapped.light.__sequencers = []
    instance.light.__id = wrapped.light.__id = __wrapped.__id = Gibber.Gibberish.utilities.getUID()
    Gibber.Gibberish.worklet.ugens.set( instance.light.__id, instance.light )*/
    Graphics.__lights.push( light )

    return light
  }, 

  make( name, op ) {
    this[ name ] = function( ...args ) {
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

        // XXX should this just be a proxy for the wrapped object?
        type:      wrapped.type,
        transform: wrapped.transform,
        material:  wrapped.material,
        texture:   wrapped.texture,

        tidals:[],

        stop() {
          this.__sequencers.forEach( s => s.stop() )
          this.texture.__sequencers.forEach( s => s.stop() )
        },

        start() {
          this.__sequencers.forEach( s => s.start() )
          this.texture.__sequencers.forEach( s => s.start() )
        },

        render( quality = null, animate = null ) {

          if( quality !== null ) Graphics.quality = quality

          if( Graphics.initialized === false ) {
            Graphics.run()
          }

          let scene = Marching.createScene( wrapped )
          if( Graphics.__fogAmount !== 0 ) {
            scene = scene.fog( Graphics.__fogAmount, Graphics.__fogColor, false )
          }
          scene = scene.background( Graphics.__background )
          if( Graphics.__lights.length !== 0 ) {
            scene = scene.light( ...Graphics.__lights )
            Graphics.__lights.length = 0
          }
          Graphics.scene = scene.render( Graphics.quality, animate !== null ? animate : Graphics.animate )

          Graphics.__onrender.forEach( v => v() )
          Graphics.__onrender.length = 0

          Graphics.camera.init()

          if( Gibber.Environment ) {
            const sheet = window.document.styleSheets[ window.document.styleSheets.length - 1 ]
            sheet.insertRule(
              '.CodeMirror pre { background-color: rgba( 0,0,0,.75 ) !important; }', 
              sheet.cssRules.length
            )
          }

          return instance
        }
      }

      if( wrapped.sdf !== undefined ) instance.sdf = wrapped.sdf
      if( wrapped.a !== undefined ) instance.a = wrapped.a
      if( wrapped.b !== undefined ) instance.b = wrapped.b
      
      // this id number is for communicating
      // with the worklet / sequencing
      let __id = wrapped.id || 0
      Object.defineProperty( wrapped, 'id', {
        get() { return __id },
        set(v) {
          __id = instance.id = v
        }
      })

      instance.id = wrapped.id

      // this is the primary id that is used inside of
      // the generated GLSL shader
      let __sdfID = 0
      Object.defineProperty( instance, '__sdfID', {
        get() { return __sdfID },
        set(v) {
          __sdfID = wrapped.__sdfID = v
        }
      })

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

      for( let param of Graphics.__protomethods ) {
        if( wrapped[ param ] !== undefined ) {
          // texture properties are dynamically created when the
          // function is called, so we want to wait for that function
          // call before wrapping...
          if( param !== 'texture' && param !== 'material' ) {
            instance[ param ] = function( ...args ) {
              wrapped[ param ]( ...args )

              return instance
            }
          }else if( param === 'texture' ) { 
            instance.texture = wrapped.texture = function( ...args ) {
              const tex = typeof args[0] === 'string' ? Marching.Texture( ...args ) : args[0]
              instance.__textureObj = wrapped.__textureObj = tex

              for( let p of tex.parameters ) {
                Graphics.createProperty( 
                  instance.texture, 
                  p.name, 
                  tex[ p.name ],
                  tex 
                )
                instance.texture.tidals = wrapped.texture.tidals = []
                instance.texture.__sequencers = wrapped.texture.__sequencers = []
                instance.texture.__id = wrapped.texture.__id = __wrapped.__id = Gibber.Gibberish.utilities.getUID()
                Gibber.Gibberish.worklet.ugens.set( instance.texture.__id, instance.texture )
              }


              return instance 
            }
          }else{
            const __wrapped = wrapped.material
            instance.material = wrapped.material = function( ...args ) {
              // check for presets and for passing a constructed material object
              const mat = typeof args[0] !== 'string'
                ? args[0].type === 'material'
                  ? args[0]               
                  : Marching.Material( ...args )
                : Marching.Material[ args[0] ]
              
              instance.__material = wrapped.__material = Marching.materials.addMaterial( mat )
              
              // mmmm... how do you sequence lighting params anyways?
              /*
              for( let p of mat.parameters ) {
                Graphics.createProperty( 
                  instance.material, 
                  p.name, 
                  mat[ p.name ],
                  mat 
                )
                instance.material.tidals = wrapped.material.tidals = []
                instance.material.__sequencers = wrapped.material.__sequencers = []
                instance.material.__id = wrapped.material.__id = __wrapped.__id = Gibber.Gibberish.utilities.getUID()
                Gibber.Gibberish.worklet.ugens.set( instance.material.__id, instance.material )
              }*/


              return instance 
            }

          }
        }
      }

      // hack to make audio sequencing work with graphical objects
      Gibber.Gibberish.worklet.ugens.set( instance.__id, instance )

      return instance
    }
  },

  createMapping( from, to, name, wrappedTo ) {
    if( from.type === 'audio' ) {
      const f = to[ '__' + name ].follow = Follow({ input: from, bufferSize:4096 })

      Marching.callbacks.push( time => {
        if( f.output !== undefined ) {
          to[ name ] = f.output
        }
      })

      let m = f.multiplier
      Object.defineProperty( to[ name ], 'multiplier', {
        configurable:true,
        get() { return m },
        set(v) { m = v; f.multiplier = m }
      })

      let o = f.offset
      Object.defineProperty( to[ name ], 'offset', {
        configurable:true,
        get() { return o },
        set(v) { o = v; f.offset = o }
      })
    }else if( from.type === 'gen' ) {
      const gen = from.render( 60, 'graphics' )

      // needed for annotations
      to[ name ].value.id = to[ name ].value.varName

      // XXX fix the two possible locations for the callback
      if( to[ name ].value.callback !== undefined ) {
        const idx = Marching.callbacks.indexOf( to[ name ].value.callback )
        Marching.callbacks.splice( idx, 1 )
      }else if( to[ '__'+name ].callback !== undefined ) {
        const idx = Marching.callbacks.indexOf( to[ '__'+name ].callback )
        Marching.callbacks.splice( idx, 1 )
      }

      // XXX fix the two possible locations for the callback
      if( typeof to[ name ].value === 'object' ) {
        to[ name ].value.callback = t => {
          const val = gen()
          to[ name ] = val
          //console.log( 'val:', val, to[ name ].value.widget !== undefined )
          let target = to[ name ].value.widget !== undefined ? to[ name ].value.widget : from.widget
          if( target === undefined ) target = to[ name ].value.mark.replacedWith
          Environment.codeMarkup.waveform.updateWidget( target, val, false )
        }
      }else{
        // assignment hack while DOM creation is taking place,
        // only needed for mappings to individual vector elements.
        if( to[ '__'+name ].widget === undefined ) {
          setTimeout( ()=> to[ '__'+name ].widget = gen.pre.widget, 150 )
        }

        to[ '__'+name ].callback = t => {
          const val = gen()
          to[ name ] = val
          Environment.codeMarkup.waveform.updateWidget( to[ '__'+name ].widget, val, false )
        }
      }

      if( typeof to[ name ].value !== 'object' ) {
        Marching.callbacks.push( to[ '__'+name ].callback )
      }else{
        Marching.callbacks.push( to[ name ].value.callback )
      }
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

      map( from, mult=null, offset=null ) {
        obj[ name ] = from
        if( mult !== null )   obj[ name ].offset = offset
        if( offset !== null ) obj[ name ].multiplier = mult
      },

      fade( from, to, time ) {
        if( from === null ) {
          from = obj[ '__'+name ].value
          while( typeof from === 'object' ) {
            from = from.value || from.x
          }
        }

        const lengthInFrames = time * 60
        const diff = to - from
        const incr = diff / lengthInFrames

        let frameCount = 0
        const fadeFunc = (timeInSeconds,timestamp) => {
          if( frameCount++ < lengthInFrames ) {
            const percent = frameCount / lengthInFrames 
            const val = Graphics.ease( percent ) 
            obj[ name ] = from + val * diff
            const widget = obj[ name ].__fadeObj.widget

            if( widget !== undefined ) {
              widget.isFade = true
              widget.min = from
              widget.max = to
              obj[ name ].value.from = from
              obj[ name ].value.to = to

              Environment.codeMarkup.waveform.updateWidget( widget, from + val * diff, false )
            }
          }else{
            const prop = obj[ name ].__fadeObj
            if( prop.widget !== undefined ) prop.widget.clear()
            delete prop.from
            delete prop.to

            Marching.callbacks.splice( Marching.callbacks.indexOf( fadeFunc ), 1 )
          }
        }

        obj[ name ].__fadeObj = { fnc: fadeFunc, from, to, values:[] }

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

        obj.__sequencers.push( obj[ '__'+name ][ number ] )
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

        obj.__sequencers.push( s )
        obj.tidals.push( s )

        // return object for method chaining
        return obj
      },
    }

    // determine if property is of type vector. if so, we need to create properties for the
    // x,y,z, and w values (depending on the size of the vector.
    if( wrapped[ name ] !== undefined && wrapped[ name ].type !== undefined && wrapped[ name ].type.indexOf( 'vec' ) > -1 ) {
      const props = ['x','y','z','w']
      const size = parseInt( wrapped[ name ].type[3] )

      for( let i = 0; i < size; i++ ) {
        Graphics.createProperty( obj[ '__'+name ], props[ i ], wrapped[ name ][ props[i] ], wrapped[ name ] )
        const id = obj[ '__'+name ].__id = Gibber.Gibberish.utilities.getUID()
        Gibber.Gibberish.worklet.ugens.set( id, obj[ '__'+name ] )
      }
    }

    const __getter = () => obj[ '__'+name ]
    const __setter = v => {
      obj['__'+name].value = v

      if( !isNaN( wrapped[ name ] ) ) {
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
