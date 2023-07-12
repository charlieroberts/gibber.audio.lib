const Presets = {
  process( description, args, Audio ) {
    let output

    // if the constructor arugment is not a string then no preset is being used
    if( typeof args[0] === 'object' ) {
      output = args[ 0 ]  
    }else if( typeof args[0] === 'string' ){
      if( args[0] === 'inspect' ) return null
      output = {}
      const preset = Presets[ description.category ][ description.name ][ args[0] ]

      if( preset !== undefined ) {
        for( let key in preset ) {
          if( key === 'presetInit' ) continue
          let value = preset[ key ]

          // if a value is a function, run the function to get the new value. these
          // preset functions are passed the main audio object, which they can typically
          // use, for example, to query the current sample rate.
          output[ key ] = typeof value === 'function' ? value( Audio ) : value
        }
        
        if( preset.presetInit !== undefined ) {
          output.__presetInit__ = preset.presetInit 
        } 
      }else{
        if( description.name === 'Sampler' || description.name === 'Multisampler' ) {
          console.log( 'loading samples ' + args[0] )
          output.__presetInit__ = function() { this.load( args[0] ) }
        }else{
          console.warn( `The preset ${args[0]} for the ${description.category.slice(0,-1)} ${description.name} does not exist.` )
        }
      }
      // if there is an extra argument to modify the preset...
      if( args.length > 1 ) {
        Object.assign( output, args[1] )
      }
    }else{
      output = {}
    }
    
    if( description.__defaults__ !== undefined ) {
      console.log( 'defaults:', description.__defaults__ )
      Object.assign( output, description.__defaults__ )
    }

    return output
  },

  instruments: {
    Complex:      require( './presets/complex_presets.js' ),
    Synth:        require( './presets/synth_presets.js' ),
    FM:           require( './presets/fm_presets.js' ),
    Monosynth:    require( './presets/monosynth_presets.js' ),
    PolyMono:     require( './presets/monosynth_presets.js' ),
    Snare:        require( './presets/snare_presets.js' ),
    Kick:         require( './presets/kick_presets.js' ),
    Hat:          require( './presets/hat_presets.js' ),
    EDrums:       require( './presets/edrums_presets.js' ),
    Drums:        require( './presets/drums_presets.js' ),
    Multisampler: require( './presets/multisampler.js' ),
    Soundfont:    require( './presets/soundfont_presets.js' )
  },

  effects: {
    Chorus:     require( './presets/chorus_presets.js' ),
    Distortion: require( './presets/distortion_presets.js' ),
    Flanger:    require( './presets/flanger_presets.js' ),
    Reverb:     require( './presets/reverb.js' ),
    Delay:      require( './presets/delay_presets.js' ),
  },

  misc: {
    Bus2: require( './presets/bus2_presets.js' )
  }

}

Presets.instruments.Sampler   = Presets.instruments.Multisampler
Presets.instruments.PolySynth = Presets.instruments.Synth
Presets.instruments.PolyFM    = Presets.instruments.FM
Presets.instruments.PolyMono  = Presets.instruments.Monosynth

module.exports = Presets
