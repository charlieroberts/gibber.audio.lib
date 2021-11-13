const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Instruments = {
  create( Audio ) {
    const instruments = {}
    //const pooledInstruments = ['Synth','Monosynth','FM']
    for( let instrumentName in Gibberish.instruments ) {
      const gibberishConstructor = Gibberish.instruments[ instrumentName ]
      if( typeof gibberishConstructor.defaults === 'object' ) gibberishConstructor.defaults.octave = 0

      const methods = Instruments.descriptions[ instrumentName ] === undefined ? null : Instruments.descriptions[ instrumentName ].methods
      const description = { 
        properties:gibberishConstructor.defaults, 
        methods:methods,
        name:instrumentName,
        category:'instruments'
      }

      //const shouldPool = pooledInstruments.indexOf( instrumentName ) > -1
      instruments[ instrumentName ] = Ugen( gibberishConstructor, description, Audio, false ) 

      // for poly notation like Synth[3]()
      // create or extend dictionary with maxVoices property
      for( let i = 0; i < 20; i++ ) {
        instruments[ instrumentName ][i] = function( ...args ) {
          if( args.length > 0 ) {
            if( typeof args[0] === 'string' ) {
              if( args.length > 1 ) {
                if( typeof args[1] === 'object' ) {
                  args[1].maxVoices = i || 1
                } 
              }else{
                args[1] = { maxVoices:i || 1 }
              }
            }else if( typeof args[0] === 'object' ) {
              args[0].maxVoices = i || 1
            }
          }else{
            args[0] = { maxVoices:i || 1 }
          } 

          // use monophonic version if voice count is 1 or less
          let name
          if( i > 1 ) {
            name = instrumentName === 'Sampler' ? 'Multisampler' : 'Poly'+instrumentName
            if( name === 'PolyMonosynth' ) name = 'PolyMono' 
          }else{
            name = instrumentName
          }

          return instruments[ name ]( ...args )
        }
      }


      instruments[ instrumentName ].presets = Audio.Presets.instruments[ instrumentName ] 
      if( instruments[ instrumentName ].presets !== undefined ) {
        instruments[ instrumentName ].presets.inspect = function() {
          console.table( this )
        }
      }else{
        instruments[ instrumentName ].presets = { inspect() { console.log( `${instrumentName} has no presets.` ) } }
      }
    }
    instruments.Pluck = instruments.Karplus
    return instruments
  },

  descriptions: {
    Clap:{
      methods:[ 'trigger' ],
    },   
    Conga:{
      methods:[ 'note','trigger' ],
    },
    Clave:{
      methods:[ 'note','trigger' ],
    },
    Cowbell:{
      methods:[ 'note','trigger' ],
    },
    FM:{
      methods:[ 'note','trigger' ],
    },
    Hat:{
      methods:[ 'note','trigger' ],
    },
    Karplus:{
      methods:[ 'note','trigger' ],
    },
    Kick:{
      methods:[ 'note','trigger' ],
    },
    Monosynth:{
      methods:[ 'note','trigger' ],
    },
    Sampler:{
      methods:[ 'note', 'trigger', 'loadFile', 'loadBuffer' ],
    },
    Multisampler:{
      methods:[ 'note', 'trigger', 'pick', 'pickFile', 'pickplay', 'loadSample', 'setpan', 'setrate' ], 
    },
    Soundfont:{
      methods:[ 'note', 'trigger', 'midinote', 'midichord', 'chord', 'load', 'setpan', 'setrate' ], 
    },
    Snare:{
      methods:[ 'note','trigger' ],
    },
    Synth:{
      methods:[ 'note','trigger' ],
    },
    Complex:{
      methods:[ 'note','trigger' ],
    },
    Tom:{
      methods:[ 'note','trigger' ],
    },
    PolySynth:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyComplex:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyFM:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyKarplus:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyMono:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyConga:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyTom:{
      methods:[ 'chord','note','trigger' ],
    },
  },
  
}

module.exports = Instruments
