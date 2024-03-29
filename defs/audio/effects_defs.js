const optional = true,
      required = true

module.exports = [
  {
    name: "BitCrusher",
    prototype: "effect",
    doc: "A sample-rate / bit-rate reduction effect.",
    properties: {
      bitDepth: {
        isa: "number(sequencable)",
        type: "float",          
        default: .5,
        min:.01,
        max:1,
        doc: "This controls the number of bits in each processed sample. A value of 1 corresponds to 16-bits."
      },
      sampleRate: {
        isa: "number(sequencable)",
        type: "float",          
        default: .5,
        min:0,
        max:1,
        doc: "This controls the sampling rate of the input signal. A value of 1 equals whatever the sampling rate of the current session is."
      },
    }
  },
  {
    name: "Delay",
    prototype: "effect",
    doc: "A feedback delay (echo) effect.",
    properties: {
      feedback: {
        isa: "number(sequencable)",
        type: "float",          
        default: .5,
        min:0,
        max:1,
        doc: "This controls the amount of feedback, which determines how long the echoes carry on for. Note that values over 1 can produce an interesting effect, but will eventually blow up your speakers and potentially your ears... be careful!"
      },
      time: {
        isa: "number(sequencable)",
        type: "duration",          
        default: "1/8",
        min:"1/512",
        max:1,
        doc: "This controls the amount of time betweeen echoes, or, if no feedback is applied, the amount of time between the original signal and the delayed signal."
      }
    }
  },
  {
    name: "Distortion",
    prototype: "effect",
    doc: "A waveshaping distortion taken from Csound, which calls it a 'modified hyperbolic tangent distortion'.",
    properties: {
      pregain: {
        isa: "number(sequencable)",
        type: "float",          
        default: 2,
        min:0,
        max:10,
        doc: "This the boost that is applied to the input signal; applying more of a boost will create more distortion."
      },
      postgain: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:0,
        max:1,
        doc: "This property can be used to decrease the volume of the signal after it has gone through the wavefolder."
      },
    }
  },
  {
    name: "Filter",
    prototype: "effect",
    doc: "A filter effect with different models (ladder, diode, biquad etc.) and modes (lowpass, highpass etc.). All models support lowpass filtering, but only biquad and svf filter support highpass, bandpass, and notch filtering.",
    properties: {
      cutoff: {
        isa: "number(sequencable)",
        type: "float",          
        default: .25,
        min:0,
        max:1,
        doc: "This controls the cutoff frequency of the filter, normalized to 0-1. For a lowpass filter, frequencies above this value will be attenuated. For a highpass filter, frequencies below this value will be attenuated." 
      },
      Q: {
        isa: "number(sequencable)",
        type: "float",          
        default: ".25",
        min:0,
        max:1,
        doc: "This is the 'quality' of the filter, which controls how much of a boost is present around the cutoff frequency. This boost to the cutoff frequency yields the classic filter sweep sound when the cutoff frequency changes over time."
      },
      model: {
        isa: "number",
        type: "int",          
        default: "1",
        min:1,
        max:5,
        doc: `The model the filter uses can only be specified when the filter is constructed, options include: 1-Moog-style Ladder filter (LP), 2-TB303-style Diode Filter (LP), 3-State Variable Filter (LP,BP,HP), 4-Biquad Filter (LP, HP, BP, Notch)`
      },
     mode: {
        isa: "number",
        type: "int",          
        default: "0",
        min:0,
        max:3,
        doc: `The filter mode determines how frequencies are attenuated. 1-Lowpass: frequencies above the cutoff frequencies are attenuated, 2-Highpass: filters below the cutoff frequency are attenuated, 3-Bandpass: Frequencies outside of a band surrounding the cutoff frequency are attenuated, and 4-Notch: frequencies around the cutoff frequency are attenuated.`
      }
    }
  },
  {
    name: "Flanger",
    prototype: "effect",
    doc: "The classic flanging effect featuring a modulated delay line with feedback.",
    properties: {
      feedback: {
        isa: "number(sequencable)",
        type: "float",          
        default: .85,
        min:0,
        max:1,
        doc: "This controls the amount of feedback, which determines how long the echoes carry on for. Note that values over 1 can produce an interesting effect, but will eventually blow up your speakers and potentially your ears... be careful!"
      },
      frequency: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:.0001,
        max:40,
        doc: "This controls the frequnecy of the sine oscillator that is modulating the lookup in the delay line."
      },
      offset: {
        isa: "number(sequencable)",
        type: "float",          
        default: .125,
        min:.01,
        max:1,
        doc: "This controls how far back the delay line is reading from. Larger values yield more dramatic results. A value of 1 === 500 samples in the past."
      }
    }
  },
  {
    name: "Freeverb",
    prototype: "effect",
    doc: "This is a reverberation model that uses four allpass filters in series and then eight comb filters in parallel. It is the same as the generic Reverb effect in Gibber.",
    properties: {
      roomSize: {
        isa: "number(sequencable)",
        type: "float",          
        default: .925,
        min:0,
        max:.999,
        doc: "This controls the amount of feedback in the comb filters, which has the effect of shortening or lengthening the reverb tail."
      },
      damping: {
        isa: "number(sequencable)",
        type: "float",          
        default: .5,
        min:0,
        max:1,
        doc: "This limits the high frequency content in the reverberated signal."
      },
      dry: {
        isa: "number(sequencable)",
        type: "float",          
        default: .5,
        min:0,
        max:1,
        doc: "The amount of dry signal in the output. Set to 0 if you're using this on a bus, or to higher values if it is in an effects chain."
      },
      wet1: {
        isa: "number(sequencable)",
        type: "float",
        default: 1,
        min:0,
        max:1,
        doc: "Using different values for this and .wet2 will affect the stereo output by sending some of the left output to the right channel and vice versa. With a value of 1 for this property and 0 for .wet2 each output will only go to one channel."
      },
      wet2: {
        isa: "number(sequencable)",
        type: "float",
        default: 0,
        min:0,
        max:1,
        doc: "Using different values for this and .wet1 will affect the stereo output by sending some of the left output to the right channel and vice versa. With a value of 0 for this property and 1 for .wet1 each output will only go to one channel."
      }
    }
  },
  {
    name: "RingMod",
    prototype: "effect",
    doc: "A classic effect where the output of a sine wave running at audio rate frequencies modulates the amplitude of another sound; when the output of the sinewave is running at sub-audio rates this is equivalent to Tremolo.",
    properties: {
      frequency: {
        isa: "number(sequencable)",
        type: "float",          
        default: 220,
        min:.01,
        max:22050,
        doc: "The frequency of the sine oscillator used for modulation"
      },
      mix: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:0,
        max:1,
        doc: "The mix of the wet to dry signal"
      }
    }
  },
  {
    name: "Vibrato",
    prototype: "effect",
    doc: "An effect that modulates the pitch of an incoming signal over time... think opera singers.",
    properties: {
      feedback: {
        isa: "number(sequencable)",
        type: "float",          
        default: .01,
        min:0,
        max:1,
        doc: "Although not used for traditional vibrato, increasing feedback can introduce interesting distortions."
      },
      frequency: {
        isa: "number(sequencable)",
        type: "float",          
        default: 4,
        min:.0001,
        max:40,
        doc: "This controls the frequnecy of the modulating oscillator."
      },
      amount: {
        isa: "number(sequencable)",
        type: "float",          
        default: .5,
        min:.01,
        max:1,
        doc: "Controls the width of the vibrato, or how much the pitch fluctuates."
      }
    }
  },
  {
    name: "Tremolo",
    prototype: "effect",
    doc: "An effect that modulates the volume of an incoming signal over time.",
    properties: {
      amount: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:.01,
        max:1,
        doc: "Controls the width of the vibrato, or how much the pitch fluctuates."
      },
      frequency: {
        isa: "number(sequencable)",
        type: "float",          
        default: 2,
        min:.0001,
        max:40,
        doc: "This controls the frequnecy of the modulating oscillator."
      },
      shape: {
        type: "string",          
        default: 'sine',
        doc: "Controls the type of oscillation; options are 'sine', 'square', and 'saw'."
      },
    }
  },
  {
    name: "Wavefolder",
    prototype: "effect",
    doc: "A wavefolding effect, where a signal is 'folded' repeatedly when it exceeds a certain threshold, adding spectral complexity and creating distortion.",
    properties: {
      gain: {
        isa: "number(sequencable)",
        type: "float",          
        default: 2,
        min:0,
        max:10,
        doc: "This the boost that is applied to the input signal; applying more of a boost will create more distortion."
      },
      postgain: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:0,
        max:1,
        doc: "This property can be used to decrease the volume of the signal after it has gone through the wavefolder."
      },
    }
  },
]

module.exports.forEach( v => v.constructorDoc = `Constructor for a ${v.name} effect. The constructor can accept two types of arguments: pass an object specifying property values for the new object, or, pass a preset name and an optional object containing modifications to the preset.`)
