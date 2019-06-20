const Ugen = require( './ugen.js' )
const Presets = require( './presets.js' )

let Audio = null

const addMethod = ( obj, name, __value = 1, propOverrideName ) => {
  if( propOverrideName === undefined ) propOverrideName = name

  obj[ '__' + name ] = { 
    value: __value,
    isProperty:true,
    sequencers:[],
    mods:[],
    name,

    seq( values, timings, number = 0, delay = 0 ) {
      let prevSeq = obj['__'+name].sequencers[ number ] 
      if( prevSeq !== undefined ) { 
        prevSeq.stop(); prevSeq.clear(); 
        let idx = obj.__sequencers.indexOf( prevSeq )
        obj.__sequencers.splice( idx, 1 )
      }

      // XXX you have to add a method that does all this shit on the worklet. crap.
      obj['__'+name].sequencers[ number ] = obj['__'+name][ number ] = Audio.Seq({ 
        values, 
        timings, 
        target:obj.__wrapped__, 
        key:name,
        rate:Audio.Clock.audioClock
      })
      .start( Audio.Clock.time( delay ) )

      obj.__sequencers.push( obj['__'+name][ number ] )

      // return object for method chaining
      return obj
    },
  }

  Audio.Gibberish.worklet.port.postMessage({
    address:'addMethod',
    key:name,
    function:`function( ${name} ) {
        for( let input of this.inputs ) {
          if( typeof input === 'object' ) input[ '${propOverrideName}' ] = ${name}
        }
      }`,
    id:obj.id,
    delay:Audio.shouldDelay
  })

  Object.defineProperty( obj, name, {
    configurable:true,
    get() { return this[ '__' + name ] },
    set(v){ 
      this[ '__' + name ].value = v
      for( let sampler of this.samplers ) sampler[ propOverrideName ] = this[ '__' + name ].value 
    }
  })
}

module.exports = function( __Audio ) {
  Audio = __Audio

  const Drums = function( score, time, ...args ) { 
    // XXX what url prefix should I be using?

    const temp = Audio.autoConnect
    Audio.autoConnect = false
    const k  = Audio.instruments.Sampler({ filename:'./resources/audiofiles/kick.wav' })
    const s  = Audio.instruments.Sampler({ filename:'./resources/audiofiles/snare.wav' })
    const ch = Audio.instruments.Sampler({ filename:'./resources/audiofiles/hat.wav' })
    const oh = Audio.instruments.Sampler({ filename:'./resources/audiofiles/openhat.wav' })
    Audio.autoConnect = temp

    const drums = Audio.Ensemble({
      'x': { target:k,  method:'trigger', args:[1], name:'kick' },
      'o': { target:s,  method:'trigger', args:[1], name:'snare' },
      '*': { target:ch, method:'trigger', args:[1], name:'closedHat' },
      '-': { target:oh, method:'trigger', args:[1], name:'openHat' },
    })

    if( Audio.autoConnect === true ) drums.connect()

    drums.__sequencers = [ ]
    if( typeof score === 'string' ) {
      drums.seq = Audio.Seq({
        target:drums,
        key:'play',
        values:score.split(''),
        timings:time === undefined ? 1 / score.length : time
      }).start()
    

      drums.values = drums.seq.values
      drums.timings = drums.seq.timings

      drums.__sequencers.push( drums.seq )
    }else{
      Gibber.addSequencing( drums, 'play', 0 )
    }

    drums.samplers = [ k,s,ch,oh ]

    addMethod( drums, 'pitch', 1, 'rate' )
    addMethod( drums, 'start', 0 )
    addMethod( drums, 'end', 1 )

    props = Presets.process( { name:'Drums', category:'instruments' }, args, Audio )
    if( props !== undefined && props.__presetInit__ !== undefined ) {
      Object.assign( drums, props )
      if( props.__presetInit__ !== undefined ) props.__presetInit__.call( drums, Audio )
    }

    return drums
  }

  const EDrums = function( score, time, ...args ) {
    const temp = Audio.autoConnect
    Audio.autoConnect = false
    
    const kd = Audio.instruments.Kick()
    const sd = Audio.instruments.Snare()
    const ch = Audio.instruments.Hat({ decay:.1, gain:.2 })
    const oh = Audio.instruments.Hat({ decay:.5, gain:.2 })
    const cp = Audio.instruments.Clap()
    const cb = Audio.instruments.Cowbell()
    
    Audio.autoConnect = temp
    
    const drums = Audio.Ensemble({
      'kd': { target:kd, method:'trigger', args:[1], name:'kick' },
      'sd': { target:sd, method:'trigger', args:[1], name:'snare' },
      'ch': { target:ch, method:'trigger', args:[.2], name:'closedHat' },
      'oh': { target:oh, method:'trigger', args:[.2], name:'openHat' },
      'cp': { target:cp, method:'trigger', args:[.5], name:'clap' },
      'cb': { target:cb, method:'trigger', args:[.5], name:'cowbell' },
    })

    if( typeof score === 'string' ) {
      drums.seq = Audio.Seq({
        target:drums,
        key:'play',
        values:score.split(''),
        timings:time === undefined ? 1 / score.length : time,
        rate:Audio.Clock.audioClock
      }).start()

      drums.values = drums.seq.values
      drums.timings = drums.seq.timings
    }

    if( Audio.autoConnect === true ) drums.connect()

    props = Presets.process( { name:'EDrums', category:'instruments' }, args, Audio )
    if( props !== undefined && props.__presetInit__ !== undefined ) {
      props.__presetInit__.call( drums, Audio )
    }

    //drums.tidal = pattern => {
    //  if( drums.__tidal !== undefined ) drums.__tidal.stop()

    //  drums.__tidal = Audio.Tidal({
    //    target:drums,
    //    key:'play',
    //    pattern
    //  }).start()

    //  return drums
    //}

    return drums
  }

  return { Drums, EDrums }
}
