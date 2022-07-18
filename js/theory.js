const Gibberish = require( 'gibberish-dsp' )
const serialize = require( 'serialize-javascript' )
const Tune      = require( './external/tune-api-only.js' )

let Gibber = null

const Theory = {
  // needed to force library to be serialized for transport to 
  // worklet processor, must use key:function() {} format
  // for methods for serialize to work
  __Tune:Tune,

  Tune:null,
  id:null,
  type: 'Audio',
  nogibberish:true,
  quality:'minor',
  baseNumber:60,
  __tuning:'et',
  __mode: 'aeolian',
  __root:440,
  __offset:0,
  __degree:'i',
  __loadingPrefix:'js/external/tune.json/', 
  __loadingExt:'js',
  __tunings:{
    et: {
      root:'60',
      mode:'absolute',
      frequencies:[
        261.62558,
        277.182617,
        293.664764,
        311.126984,
        329.627563,
        349.228241,
        369.994415,
        391.995422,
        415.304688,
        440,
        466.163757,
        493.883301,
        523.251083727363
      ],
      description:'equal tempered (edo)'
    }
  },  

  modes: {
    ionian:     [0,2,4,5,7,9,11],
    dorian:     [0,2,3,5,7,9,10],
    phrygian:   [0,1,3,5,7,8,10],
    lydian:     [0,2,4,6,7,9,11],
    mixolydian: [0,2,4,5,7,9,10],
    aeolian:    [0,2,3,5,7,8,10],
    locrian:    [0,1,3,5,6,8,10],
    melodicminor:[0,2,3,5,7,8,11],
    wholeHalf:  [0,2,3,5,6,8,9,11],
    halfWhole:  [0,1,3,4,6,7,9,10],
    chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
  },

  store:function() { 
    Gibberish.Theory = this

    this.Tune.TuningList = this.__tunings

    this.initProperties()
  },

  setup( tuning='et', mode='aeolian' ) {
    this.tuning = tuning
    this.mode = mode
  }, 

  // adapted from https://gist.github.com/stuartmemo/3766449
  __noteToFreq( note ) {
    note = note.toUpperCase() 

    let notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
        octave,
        keyNumber

    if (note.length === 3) {
      octave = note.charAt(2)
    } else {
      octave = note.charAt(1)
    }
    keyNumber = notes.indexOf(note.slice(0, -1))
    if (keyNumber < 3) {
      keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1
    } else {
      keyNumber = keyNumber + ((octave - 1) * 12) + 1
    }

    return 440 * Math.pow(2, (keyNumber- 49) / 12)
  },

  deleteProperties: function() {
    if( Gibberish.mode === 'worklet' ) {
      delete this.__root
      delete this.__tuning
      delete this.__mode
      delete this.__offset
      delete this.__degree

      Theory.markup = {
        textMarkers : {},
        cssClasses: {}
      }

      this.__root = 440
      this.__tuning = 'et'
      this.__offset = 0
      this.__degree = 'i'
      this.__mode = 'aeolian'
    }
  },

  initProperties: function() {
    if( Gibberish.mode === 'worklet' ) {
      Gibber.createProperty( 
        this, 'root', 440, function() {
          if( typeof Theory.__root.value === 'string' ) {
            Theory.root = Theory.__noteToFreq( Theory.__root.value )
          } 
        },
        
        1
      )

      Gibber.createProperty( 
        this, 'tuning', 'et', 
        function() { // XXX why doesn't this work??? duplicated below... 
          this.loadScale( this.__tuning.value ) 
        },
        1
      )

      Gibber.createProperty( this, 'mode', 'aeolian', null, 0 )
      Gibber.createProperty( this, 'offset', 0, null, 0 )
      Gibber.createProperty( this, 'degree', 'i', null, 0 )

      //setTimeout( ()=> Theory.tuning = 'et', 250 )
      this.tuning = 'et'
      //this.loadScale('et')
    }else{
      this.__initDegrees()

      Object.defineProperty( this, 'root', {
        get() { return this.__root },
        set(v) {
          if( typeof v=== 'string' ) {
            v = this.__noteToFreq( v )
          } 
          this.__root = v
          this.Tune.tonicize( this.__root )
        }
      })

      Object.defineProperty( this, 'tuning', {
        get() { return this.__tuning },
        set(v) {
          this.__tuning = v
          //this.loadScale( v )
        }
      })

      Object.defineProperty( this, 'mode', {
        get()  { return this.__mode },
        set(v) { 
          if( this.modes[ v ] !== undefined || v === null ) {
            this.__mode = v 
          }else{
            console.error( `The mode "${v}" is not valid. Valid modes include ${Object.keys(this.modes).toString()}, and null. No change to Theory.mode was applied.` )
          }
        }
      })

      Object.defineProperty( this, 'offset', {
        get()  { return this.__offset },
        set(v) { this.__offset = v }
      })

      Object.defineProperty( this, 'degree', { 
        get() { return this.__degree },
        set( __degree ) {
          if( typeof __degree  === 'string' ) {
            const degree = this.__degrees[ this.quality ][ __degree ]
        
            this.__degree = degree
            //this.rootNumber = degree.offset + this.baseNumber
            this.mode = degree.mode
          }
        }
      })

      this.degree = 'i'
    }
  },

  __degrees: { major:{}, minor:{} },

  __initDegrees:function() {
    const base = [ 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii' ]

    const scales = [ { name:'minor', values:this.modes.aeolian }, { name:'major', values:this.modes.ionian } ]

    for( let scale of scales ) {
      let name = scale.name
      let values = scale.values

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ]
        this.__degrees[ name ][ chord ] = { mode:'aeolian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'aeolian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'aeolian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'aeolian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'aeolian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ].toUpperCase()
        this.__degrees[ name ][ chord ] = { mode:'ionian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'ionian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'ionian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'ionian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'ionian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ] + '7'
        this.__degrees[ name ][ chord ] = { mode:'dorian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'dorian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'dorian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'dorian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'dorian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ].toUpperCase() + '7'
        this.__degrees[ name ][ chord ] = { mode:'mixolydian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'mixolydian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'mixolydian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'mixolydian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'mixolydian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ] + 'o'
        this.__degrees[ name ][ chord ] = { mode:'locrian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'locrian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'locrian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'locrian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'locrian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ] + 'M7'
        this.__degrees[ name ][ chord ] = { mode:'melodicminor', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'melodicminor', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'melodicminor', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'melodicminor', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'melodicminor', offset: values[i] + 24 }
      }
    }
  },

  init:function( __Gibber ) {
    Gibber = __Gibber

    this.Tune = new this.__Tune()
    this.Tune.TuningList = this.__tunings

    if( Gibberish.mode === 'worklet' ) {
      this.id = Gibberish.utilities.getUID()

      // can't send prototype methods of Tune over processor
      // so they need to be explicitly assigned
      this.Tune.loadScale = this.Tune.__proto__.loadScale
      this.Tune.note = this.Tune.__proto__.note
      this.Tune.frequency = this.Tune.__proto__.frequency
      this.Tune.tonicize = this.Tune.__proto__.tonicize
      this.Tune.ratio = this.Tune.__proto__.ratio
      this.Tune.MIDI = this.Tune.__proto__.MIDI
      
      Gibberish.worklet.port.postMessage({
        address:'add',
        properties:serialize( Theory ),
        id:this.id,
        post:'store'
      })

      Gibber.subscribe( 'clear', () => this.reset() )
      this.initProperties()
    }

    this.__initDegrees()
  },

  reset:function() {
    Theory.root = 440
    Theory.mode = 'aeolian'
    Theory.tuning = 'et'
    Theory.degree = 'i'
    Theory.offset = 0
  },

  freeze:function() {
    if( Gibberish.mode === 'worklet' ) {
      Gibber.Theory.degree.sequencers.forEach( s => s.stop() )  
      Gibber.Theory.offset.sequencers.forEach( s => s.stop() )  
      Gibber.Theory.mode.sequencers.forEach( s => s.stop() )  
      Gibber.Theory.root.sequencers.forEach( s => s.stop() )  
    }
  },

  thaw:function() {
    if( Gibberish.mode === 'worklet' ) {
      this.degree.sequencers.forEach( s => s.start() )  
      this.offset.sequencers.forEach( s => s.start() )  
      this.mode.sequencers.forEach( s => s.start() )  
      this.root.sequencers.forEach( s => s.start() )  
    }
  },

  loadScale: function( name ) {
    if( Gibberish.mode === 'worklet' ) {
      // if the scale is already loaded...
      if( this.__tunings[ name ] !== undefined ) {
        this.__tuning.value = name
        this.Tune.loadScale( name )

        Gibberish.worklet.port.postMessage({
          address:'method',
          object:this.id,
          name:'loadScale',
          args:[name]
        })
        return
      }

      const path = this.__loadingPrefix + name + '.' + this.__loadingExt 
      fetch( path )
        .catch( console.err )
        .then( data => {
          if( data.ok ) {
            return data.json()
          }else{
            console.error( `The tuning ${name} wasn't found. Please visit http://abbernie.github.io/tune/scales.html to find the names of valid tunings.`) 
          } 
        })
        .then( json => {
          this.addScaleJSON( json, name )
          //this.__tuning.value = name
          //Gibberish.worklet.port.postMessage({
          //  address:'addToProperty',
          //  object:this.id,
          //  name:'__tunings',
          //  key:name,
          //  value:json
          //})

          //Gibberish.worklet.port.postMessage({
          //  address:'method',
          //  object:this.id,
          //  name:'loadScale',
          //  args:[name]
          //})

          //this.__tunings[ name ] = json
          //this.Tune.loadScale( name )
        })
    }else{
      this.Tune.loadScale( name )
    }
  },

  addScaleJSON: function( json, name ) {
    this.__tuning.value = name
    Gibberish.worklet.port.postMessage({
      address:'addToProperty',
      object:this.id,
      name:'__tunings',
      key:name,
      value:json
    })

    Gibberish.worklet.port.postMessage({
      address:'method',
      object:this.id,
      name:'loadScale',
      args:[name]
    })

    this.__tunings[ name ] = json
    this.Tune.loadScale( name )
  },

  // REMEMBER THAT THE .note METHOD IS ALSO MONKEY-PATCHED
  // IN ugen.js, THIS IS WHERE MOST OF THE AWPROCESSOR NOTE
  // METHOD IS IMPLEMENTED.
  note: function( __idx, octave=0, round=true ) {
    let finalIdx, mode = null, __float = __idx % 1, baseOctave, nextOctave

    let isInt = __float === 0
    if( !isInt && round===true ) {
      __idx = Math.round( __idx )
      isInt = true
    }
    
    let baseIndex = __idx < 0 ? Math.ceil( __idx ) : Math.floor( __idx ),
        nextIndex = __idx >= 0 ? baseIndex + 1 : baseIndex - 1

    baseIndex += Gibberish.Theory.__offset
    nextIndex += Gibberish.Theory.__offset

    if( Gibberish.Theory.mode !== 'chromatic' && Gibberish.Theory.mode !== null ) {
      mode = Gibberish.Theory.modes[ Gibberish.Theory.mode ]
      baseOctave = Math.floor( baseIndex / mode.length )
      nextOctave = Math.floor( nextIndex / mode.length )
      
      // XXX this looks crazy ugly but works with negative note numbers...
      baseIndex = baseIndex < 0 
        ? mode[ (mode.length - (Math.abs( baseIndex ) % mode.length)) % mode.length ] 
        : mode[ Math.abs( baseIndex ) % mode.length ]

      if( !isInt ) {
        nextIndex = nextIndex < 0 
          ? mode[ (mode.length - (Math.abs( nextIndex ) % mode.length)) % mode.length ] 
          : mode[ Math.abs( nextIndex ) % mode.length ]
      }
    }else{
      // null mode also means to use 'chromatic' mode
      mode = Gibberish.Theory.modes[ 'chromatic' ]
      const l = Gibberish.Theory.Tune.scale.length 
      baseOctave = Math.floor( baseIndex / l )
      nextOctave = Math.floor( baseIndex / l )

      baseIndex = baseIndex < 0 
        ? mode[ (l - (Math.abs( baseIndex ) % l)) % l ] 
        : mode[ Math.abs( baseIndex ) % l ]

      if( !isInt ) {
        nextIndex = nextIndex < 0 
          ? mode[ (l - (Math.abs( nextIndex ) % l)) % l ] 
          : mode[ Math.abs( nextIndex ) % l ]
      }
    }

    baseIndex += this.__degree.offset
    nextIndex += this.__degree.offset

    let outputFreq = 0
    if( !isInt ) {
      const freq0 = Gibberish.Theory.Tune.note( baseIndex, baseOctave )
      const freq1 = Gibberish.Theory.Tune.note( nextIndex, nextOctave )
      let   diff  = freq1 - freq0
      if( __idx < 0 ) diff *= -1
      outputFreq = freq0 + (diff*__float)
    }else{
      outputFreq = Gibberish.Theory.Tune.note( baseIndex, baseOctave )
    }

    return outputFreq 
  },
}

module.exports = Theory
