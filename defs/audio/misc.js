const optional = true,
      required = true,
      overloaded = '?'

module.exports = [{
  name: "lfo",
  type: "ugen",
  doc: "The lfo is a shorthand for creating signal processing objects that can be used to modulate properties. It is called by passing a waveform (default 'sine', but also 'square', 'saw', 'tri', and 'noise'), a frequency, a gain, and a bias (center point). The waveform can only be set when the lfo is first created, the other three properties can be freely changed / sequenced.",
  properties: {
    frequency: {
      type: "float",
      doc: "A frequency in Hz for the lfo to run at. For beat-synced lfos, use the btof() function (beats-to-frequency).",
      default: 2
    },
    gain: {
      type: "float",
      doc: "The amplitude of the lfo.", 
      default: .5
    },
    bias: {
      type: "float",
      doc: "The center point for the output of lfos. All lfos are bipolar (they have positive and negative valuess) around this center point.",
      default: .5
    }
  }
},
{
  name: "sine",
  type: "ugen",
  doc: "A shorthand to create a lfo that uses a sine oscillator.",
  properties: {
    frequency: {
      type: "float",
      doc: "A frequency in Hz for the lfo to run at. For beat-synced lfos, use the btof() function (beats-to-frequency).",
      default: 2
    },
    gain: {
      type: "float",
      doc: "The amplitude of the lfo.", 
      default: .5
    },
    bias: {
      type: "float",
      doc: "The center point for the output of lfos. All lfos are bipolar (they have positive and negative valuess) around this center point.",
      default: .5
    }
  }
},
{
  name: "tri",
  type: "ugen",
  doc: "A shorthand to create a lfo that uses a triangle oscillator.",
  properties: {
    frequency: {
      type: "float",
      doc: "A frequency in Hz for the lfo to run at. For beat-synced lfos, use the btof() function (beats-to-frequency).",
      default: 2
    },
    gain: {
      type: "float",
      doc: "The amplitude of the lfo.", 
      default: 4
    },
    bias: {
      type: "float",
      doc: "The center point for the output of lfos. All lfos are bipolar (they have positive and negative valuess) around this center point.",
      default: 0
    }
  }
},
{
  name: "square",
  type: "ugen",
  doc: "A shorthand to create a lfo that uses a square wave oscillator.",
  properties: {
    frequency: {
      type: "float",
      doc: "A frequency in Hz for the lfo to run at. For beat-synced lfos, use the btof() function (beats-to-frequency).",
      default: 2
    },
    gain: {
      type: "float",
      doc: "The amplitude of the lfo.", 
      default: 4
    },
    bias: {
      type: "float",
      doc: "The center point for the output of lfos. All lfos are bipolar (they have positive and negative valuess) around this center point.",
      default: 0
    }
  }
},
{
  name: "saw",
  type: "ugen",
  doc: "A shorthand to create a lfo that uses a sawtooth oscillator.",
  properties: {
    frequency: {
      type: "float",
      doc: "A frequency in Hz for the lfo to run at. For beat-synced lfos, use the btof() function (beats-to-frequency).",
      default: 2
    },
    gain: {
      type: "float",
      doc: "The amplitude of the lfo.", 
      default: 4
    },
    bias: {
      type: "float",
      doc: "The center point for the output of lfos. All lfos are bipolar (they have positive and negative valuess) around this center point.",
      default: 0
    }
  }
},
{
  name: "Theory",
  type: "object",
  doc: "The `Theory` object controls harmony inside of gibber, including the ability to specify chord progressions and tunings.",
  properties: {
    mode: {
      type: "string",
      doc: 'When the `Theory.mode` property is not set to `null`, only certain pitches in a given tuning will be played ussing the standard `.note` method of instruments. A value of `null` means that all pitches in the tuning can be played e.g. a chromatic scale. This property is primarily used in conjunction with "Western" tuning systems. The available modes are ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian", "melodicminor", "wholeHalf", "halfWhole", "chromatic"]. ',
      default: "aeolian"
    },
    root: {
      type: "float",
      doc: "The base tuning value for all pitches in the tuning system.", 
      default: 440.
    },
    tuning: {
      type: "string",
      doc: "The tuning property controls the ratios of each pitch in the harmonic system. There are thousands of tunings that are available; these can be explored at the [tune.js website](http://abbernie.github.io/tune/scales.html).",
      default: "et"
    },
    offset: {
      type:"int",
      doc:"The offset property will transpose all sequences.",
      default:0
    },
    degree: {
      type:"string",
      doc: "The degree property controls both the `.offset` and the `.mode` of the `Theory` object. For example, a value of 'III' says that the offset is 3 and the mode is 'major', while a value of 'viio' (diminshed-7 chord) specifies an offset of 7 and a mode of 'locrian'. The '+', '++', '-', and '--' modified can be added to degree values to raise or lower them by one or two octaves."
    }
  }
}  
]
