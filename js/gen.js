module.exports = function( Audio ) {
  
const binops = [ 
  'min','max','add','sub','mul','div','rdiv','mod',
  'and','or','gt','eq','eqp','gte','gtep','gtp','lt','lte','ltep','ltp','neq',
  'step' 
]

const monops = [
  'abs','acos','acosh','asin','asinh','atan','atan2','atanh','cos','cosh',
  'sin','sinh','tan','tanh', 'floor',
  'ceil', 'round', 'sign', 'trunc', 'fract', 'param', 'in',
]

const noops = [
  'noise'
]

const Gen  = {
  lastConnected:[],
  names:[],
  connected: [],

  isGen:true,
  debug:false,

  wavetable( frequency, props ) {
    const g = Audio.Gibberish.genish 
    let dataProps = { immutable:true }

    // use global references if applicable
    if( props.name !== undefined ) dataProps.global = props.name

    const buffer = Gen.ugens.data( props.buffer, 1, dataProps )

    return Gen.ugens.peek( buffer, Gen.ugens.phasor( frequency, 0, { min:0 } ) )
  },

  init() {
    Gen.ugens.wavetable = Gen.__wavetable
    Gen.createBinopFunctions()
    Gen.createMonopFunctions()

    Gen.names.push( ...binops )
    Gen.names.push( ...monops )
    Gen.names.push( ...Object.keys( Gen.constants ) )
    Gen.names.push( ...Object.keys( Gen.functions ) )
    //Gen.names.push( ...Object.keys( Gen.composites ) )
    Gen.names.push( 'gen' )
    Gen.names.push( 'lfo' )
    Gen.names.push( 'sine' )
    Gen.names.push( 'square' )
    Gen.names.push( 'tri' )
    Gen.names.push( 'saw' )

    //Gibber.subscribe( 'clear', ()=> Gen.lastConnected.length = 0 )
  },

  // if property is !== ugen (it's a number) a Param must be made using a default
  create( name ) {
    // rate needs custom function to skip sequencing input and only sequence rate adjustment

    const params = Array.prototype.slice.call( arguments, 1 )

    if( name === 'rate' ) return Gen.createRate( name, ...params )

    const obj = Object.create( this )
    let count = 0
    
    obj.name = name
    obj.active = false
    
    for( let key of Gen.functions[ name ].properties ) { 
      let value = params[ count++ ] || 0
      obj[ key ] = v => {
        if( v === undefined ) {
          return value
        }else{
          value = v
          if( obj.active ) {
            if( obj.__client === 'live' ) {
              Gibber.Communication.send( `genp ${obj.paramID} ${obj[ key ].uid} ${v}` ) 
            }else if( obj.__client === 'max' ) {
              Gibber.Communication.send( `sig ${obj.paramID} param ${obj[ key ].uid} ${v}`, 'max' ) 
            }
          }
        }
      }
      obj[ key ].uid = Gen.getUID()
 
      // XXX Gibber.addSequencingToMethod( obj, key )
    }

    // accomodate non-audio-rate options. during codegen the compiler
    // will check for the options property; if it exists it will write
    // the options into the generated code.
    if( params.length > Gen.functions[ name ].properties.length ) {
      obj.options = params[ Gen.functions[ name ].properties.length ]
    }

    return obj
  },

  createRate( name ) {
    let obj = Object.create( this ),
        count = 0,
        param = arguments[1] 
    
    obj.name = 'rate' 
    obj.active = false
    
    let value = param
    //console.log( 'value:', value, 'args:', arguments )
    obj[ 0 ] = v => {
      if( v === undefined ) {
        return value
      }else{
        value = v
        if( obj.active ) {
          Gibber.Communication.send( `genp ${obj.paramID} ${obj[ 0 ].uid} ${v}` ) 
        }
      }
    }

    Gen.getUID() // leave 0 behind...
    obj[ 0 ].uid = Gen.getUID()

    Gibber.addSequencingToMethod( obj, '0' )

    return obj
  },
 
  createBinopFunctions() {
    for( let key of binops ) {
      Gen.functions[ key ] = {
        properties:['0','1'], str:key
      }
    }
  },

  createMonopFunctions() {
    for( let key of monops ) {
      Gen.functions[ key ] = {
        properties:['0'], str:key
      }
    }
  },

  assignTrackAndParamID: function( track, id ) {
    this.paramID = id
    this.track = track

    let count = 0, param
    while( param = this[ count++ ] ) {
      if( typeof param() === 'object' ) {
        param().assignTrackAndParamID( track, id )
      }
    }
  },

  clear() {
    for( let ugen of Gen.connected ) {
      Gibber.Communication.send( `ungen ${ugen.paramID}` )
    }

    Gen.connected.length = 0
  },

  constants: {
    degtorad: Math.PI / 180,
    E :       Math.E,
    halfpi:   Math.PI / 2,
    invpi :   Math.PI * - 1,
    ln10  :   Math.LN10,
    ln2   :   Math.LN2,
    log10e:   Math.LOG10E,
    log2e :   Math.LOG2E,
    pi    :   Math.PI,  
    sqrt2 :   Math.SQRT2,
    sqrt1_2:  Math.SQRT1_2,
    twopi :   Math.PI * 2,
    samplerate: 'samplerate'
  },

  functions: {
    phasor: { properties:[ '0','1' ],  str:'phasor' },
    cycle:  { properties:[ '0' ],  str:'cycle' },
    phasorN:{ properties:[ '0','1' ],  str:'phasorN' },
    cycleN: { properties:[ '0' ],  str:'cycleN' },
    train:  { properties:[ '0','1' ],  str:'train' },
    rate:   { properties:[ '0' ], str:'rate' },
    noise:  { properties:[], str:'noise' },
    accum:  { properties:[ '0','1' ], str:'accum' },
    counter:{ properties:[ '0','1' ], str:'counter' },
    scale:  { properties: ['0', '1', '2', '3'], str:'scale' },
    sah:    { properties: ['0', '1', '2'], str:'sah' },
    clamp:  { properties: ['0', '1', '2'], str:'clamp' },
    ternary:{ properties: ['0', '1', '2'], str:'switch' },
    selector:{ properties: ['0', '1', '2'], str:'selector' },
    peek:   { properties:['0','1'], str:'peek' },
    data:   { properties:[], str:'data' }
  },

  _count: 0,

  getUID() {
    return 'p' + Gen._count++
  },

  time: 'time',

  out() {
    let paramArray = [],
        body, out
    
    body = this.gen( paramArray )

    out = paramArray.join( ';' )

    if( paramArray.length ) {
      out += ';'
    }
    
    out += 'out1='
    out += body + ';'
    
    if( Gen.debug ) console.log( out )

    return out
  },

  genMax( paramArray ) {
    let def = Gen.functions[ this.name ],
        str = def.str + '(',
        count = 0
    
    // tell Gibber that this gen object is part of an active gen graph
    // so that changes to it are forwarded to m4l
    this.active = true

    if( this.name === 'rate' ) {
      str += 'in1, '
      let pName = this[ 0 ].uid
      str += pName
      paramArray.push( `Param ${pName}(${this[0]()})` )
    }else{
      for( let property of def.properties ) {
        let p = this[ property ](),
            uid = this[ property ].uid
        
        //console.log( this.name, property, def.properties, uid )
        if( Gen.isPrototypeOf( p ) ) {
          str += p.gen( paramArray )
        }else if( typeof p === 'number' ) {
          let pName = uid
          str += pName
          paramArray.push( `Param ${pName}(${p})` )
        }else if( p === Gen.time ) {
          str += p
        }else if( typeof p === 'string' ) {
          str += p
        }else{
          console.log( 'CODEGEN ERROR:', p )
        }

        if( count++ < def.properties.length - 1 ) str += ','
      }
    }
    
    str += ')'

    return str
  },

  gen( paramArray ) {
    let def = Gen.functions[ this.name ],
        str = `g.${def.str}(`,
        count = 0
    
    // tell Gibber that this gen object is part of an active gen graph
    // so that changes to it are forwarded to m4l
    this.active = true

    for( let property of def.properties ) {
      let p = this[ property ](),
          uid = this[ property ].uid
      
      //console.log( this.name, property, def.properties, uid )
      if( Gen.isPrototypeOf( p ) ) {
        str += p.gen( paramArray )
      }else if( typeof p === 'number' ) {
        let pName = 'p'+paramArray.length
        //str += pName
        paramArray.push( [`${pName}`, p ] )
        str += `g.in('${pName}')`
      }else if( p === Gen.time ) {
        str += p
      }else if( typeof p === 'string' ) {
        str += p
      }else{
        console.log( 'CODEGEN ERROR:', p )
      }

      if( count++ < def.properties.length - 1 ) str += ','
    }

    if( this.options !== undefined ) {
      str += ',' + JSON.stringify( this.options )
    }
    
    str += ')'

    return str
  },

  composites: { 
    sine( frequency=2, amp=4, center=0, shouldRound=false ) {
      return Gen.composites.lfo( 'sine', frequency, amp, center, shouldRound )
    },
    siner( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'sine', frequency, amp, center, true )
    },
    square( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'square', frequency, amp, center )
    },
    saw( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'saw', frequency, amp, center )
    },
    tri( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'tri', frequency, amp, center )
    },
    lfo( type = 'sine', frequency = 2, amp = .5, center = .5, shouldRound = false ) {
      const g = Gen.ugens 
      const gibberish= Audio.Gibberish
      let osc

      switch( type ) {
        case 'saw':
          osc = g.phasor( frequency )
          break
        case 'square':
          osc = g.add( g.mul( g.gt( g.phasor( frequency ), 0 ), 2 ), -1 )
          break
        case 'noise':
          osc = g.sub( g.mul( g.noise(), 2 ), 1 )
          break
        case 'triangle':
        case 'tri':
          const p = g.phasor( frequency )
          osc = g.sub(
            1, 
            g.mul( 
              4, 
              g.abs(
                g.sub( 
                  g.round( p ),
                  p
                )
              )
            )
          )
            
          break
        case 'sine':
        default:
          osc = g.cycle( frequency )
          break
      }

      const _mul   = g.mul( osc, amp ),
            _add   = g.add( center, _mul ) 

      const lfo = shouldRound 
        ? Gen.make( g.round( _add ), ['bias', 'frequency', 'gain'] ) 
        : Gen.make( _add, [ 'bias', 'frequency', 'gain'] )

      Object.defineProperties( lfo, {
        frequency: {
          configurable:true,
          set(v) { lfo.rendered.p1 = v },
          get()  { return lfo.rendered.p1 }
        },
        gain: {
          configurable:true,
          set(v) { lfo.rendered.p2 = v },
          get()  { return lfo.rendered.p2 }
        },
        bias: {
          configurable:true,
          set(v) { lfo.rendered.p0 = v },
          get()  { return lfo.rendered.p0 }
        }
      })

      lfo.copy = function() {
        return Gen.composites.lfo( type, this.frequency.value, this.gain.value, this.bias.value )
      }

      return lfo
    },

    fade( time = 1, from = 1, to = 0 ) {
      let g = Gen.ugens
      let fade, amt, beatsInSeconds = time * ( 60 / Gibber.Live.LOM.bpm )
     
      if( from > to ) {
        amt = from - to

        fade = g.gtp( g.sub( from, g.accum( g.div( amt, g.mul(beatsInSeconds, g.samplerate ) ), 0 ) ), to )
      }else{
        amt = to - from
        fade = g.add( from, g.ltp( g.accum( g.div( amt, g.mul( beatsInSeconds, g.samplerate ) ), 0 ), to ) )
      }
      
      // XXX should this be available in ms? msToBeats()?
      let numbeats = time / 4
      fade.shouldKill = {
        after: numbeats, 
        final: to
      }
      
      return fade
    },
    
    //beats( num ) {
    //  return Gen.ugens.rate( num )
    //  // beat( n ) => rate(in1, n)
    //  // final string should be rate( in1, num )
    //}
    beats( b ) {
      return Gen.ugens.phasor( Audio.Utilities.btof( b ), 0, { min:0 } )
    }, 
    beats2( b ) {
      return Gen.ugens.phasor( 
        Audio.Utilities.btof( b ), 
        0, 
        { min:0 } )
    }, 
  },

  ugens:{},

  export( obj ) {
    for( let key in Gen.functions ) {
      this.ugens[ key ] = Gen.create.bind( Gen, key )
    }

    Object.assign( this.ugens, Gen.constants )
    Object.assign( this.ugens, Gen.composites )

    const __in = this.ugens.in
    delete this.ugens.in
    Object.assign( obj, this.ugens )
    this.ugens.in = __in
  },


  // defer creating genish object until we know whether
  // this will be used by an audio or visual object
  make( graph, propertyNames ) {
    const defer = { 
      graph, 
      __graph:graph,
      propertyNames,
      type:'gen',
      id: Audio.Gibberish.utilities.getUID(),
      rendered:null,
      copy() {
        return Gen.make( this.__graph )
      },
      render( samplerate=44100, type='audio' ) {
        if( type === 'audio' ) {
          if( this.rendered === null ) { 
            this.rendered = Gen.__make( this.graph, this.propertyNames, defer )
            const props = this.rendered.__wrapped__.__properties__
            for( let key in props ) { 
              Object.defineProperty( this, key, {
                configurable:true,
                get() { return this.rendered[ key] },
                set(v){
                  this.rendered[ key ] = v 
                }
              })
            } 
            this.rendered.widget = this.widget
            this.rendered.__graph = graph
          }

          return this.rendered
        }

        const store = Audio.Gibberish.genish.samplerate
        const g = Audio.Gibberish.genish

        Audio.Gibberish.genish.gen.samplerate = samplerate
        const params = []
        const __graph = eval( graph.gen( params ) )
        const callback = g.gen.createCallback( __graph )
        Audio.Gibberish.genish.gen.samplerate = store      

        const out = callback.bind( null, ...params.map( v => v[1] ), g.memory )

        // annotations can be added to the original defer, so store the defer
        // to access the annotations later
        out.pre = defer 

        return out
      },

      // XXX connecting gen objects to audio properties no longer seems
      // to work... must be assigned. FIX
      connect( target ) {
        if( target.type === 'audio' ) {
          if( this.rendered === null ) { 
            this.rendered = Gen.__make( this.graph, this.propertyNames, defer )
          }
          this.rendered.connect( target )
        }
      }
    }

    return defer
  },

  __make( graph, propertyNames, target ) {
    const ugen = Audio.Gibberish.prototypes.Ugen
    const g = Audio.Gibberish.genish

    // store properties of our gen object in this array
    // they will then become properties of our Gibber object
    const paramArray = []

    // get genish.js codelet for our graph
    const genCode = graph.gen( paramArray )

    // create a properties object out of our paramArray
    const params = {}
    for( let param of paramArray ) {
      params[ param[0] ] = param[1]
    } 

    const id = Gen.getUID()

    params.id = Audio.Gibberish.utilities.getUID()

    // pass a constructor to our worklet processor
    Audio.Gibberish.worklet.port.postMessage({ 
      address:'addMethod', 
      id:-1,
      key:'Gen' + id,
      function:`function() { 
        const g = Gibberish.genish; 
        const mymod = Object.create( Gibberish.prototypes.Ugen ); 
        Gibberish.factory( mymod, ${genCode}, 'Gen${id}', ${JSON.stringify(params)}, null, true ); 
        return mymod; 
      }`
    })

    // create a worklet-side Gibberish constructor
    const make = function() {
      const mymod = Object.create( ugen )
      // the second parameter doesn't matter in the worklet, only in the processor
      // so we can just input zeroes. hmmmm... I gues it probably matters for
      // sequencing?
      
      return Audio.Gibberish.factory( mymod, g.add(0,0), 'Gen'+id, params )
    }

    // XXX do I really have to make a Gibberish constructor and a Gibber constructor to
    // turn a genish graph into a Gibber ugen? Is there a shortcut to take? Is it worth
    // writing custom code for?

    // create a Gibber constructor using our Gibberish constructor
    let temp = params.id
    //delete params.id
    const Make = Audio.Ugen( make, { name:'Gen'+id, properties:params, methods:[]}, Audio )

    // create Gibber ugen and pass in properties dictionary to initailize
    const out = Make({ params })
    out.__wrapped__.id = temp 
    out.__wrapped__.connected = []

    let count = 0
    out.__wrapped__.output = out.output = function( v ) {
      //if( Audio.Gibber.Environment !== undefined ) {
        // XXX should these be averaged instead of only taking every sixth sample (roughly
        // corresponds to 58 frames a second)
        if( count++ % 6 === 0 ) {
          // XXX this shouldn't happen here, should happen when the annotation is created.
          if( Audio.Gibber.Environment.Annotations.waveform.widgets[ temp ] === undefined ) {
            Audio.Gibber.Environment.Annotations.waveform.widgets[ temp ] = out.widget
          }
          Audio.Gibber.Environment.Annotations.waveform.updateWidget( out.widget, v, false )
        }
      //}

      out.output.value = v
    }

    // optionally map user provided names to p values for better control / sequencing
    if( Array.isArray( propertyNames )) {
      for( let i = 0; i < propertyNames.length; i++ ){
        const propertyName = propertyNames[ i ]
        const desc = Object.getOwnPropertyDescriptor( target, propertyName )
        if( out[ 'p'+i ] !== undefined && propertyName !== null && propertyName !== undefined ){
          out[ '__'+propertyName ] = out[ 'p'+i ]
          Object.defineProperty( out, propertyName, {
            configurable:true,
            get() { return out[ '__' + propertyName ] },
            set(v){
              if( v === undefined || v === null ) return
              out[ '__' + propertyName ].value = v
            }
          })
          Object.defineProperty( target, propertyName, {
            configurable:true,
            get() { return out[ '__' + propertyName ] },
            set(v){
              if( v === undefined || v === null ) return
              out[ '__' + propertyName ].value = v

              if( typeof desc.set === 'function' ) desc.set.call( target, v )
            }
          })

        } 
      }
    }


    out.id = temp
    out.__isGen = out.__wrapped__.__isGen = true
    out.type = 'gen'

    return out
  }
}

Gen.init()

return Gen 
}
