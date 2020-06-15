module.exports = {
  name:'Monosynth',
  prototype: "instrument",
  doc: "The Monosynth object pairs three oscillators, an envelope, and a filter. The envelope controls both the gain of the synth (volume) and the cutoff frequency of the filter, make it's sound brighter when the envelope is fully open. Oscillators can be detuned from each other creating a fuller sound than a single oscillator alone.",
  
  properties: {
    antialias: {
      type: "boolean",
      default:true,
      doc: "When set to true, the synth's oscillators will use higher-quality (but more CPU expensive) anti-aliasing oscillators."
    },
    detune2: {
      type: "number(sequencable)",
      default:.005,min:-1, max:1,
      doc: "The frequency for oscillator #2 will be determined by taking the value of the .frequency property (which controls the frequency of oscillator #1) and offsetting it by the the value of this property multiplied by the base frequency. So, if the base .frqeuency property was 1000 Hz, oscillator #2 would run at a frequency of 1005 Hz using the default value of .005"
    },
    detune3: {
      type: "number(sequencable)",
      default:-.005,min:-1, max:1,
      doc: "The frequency for oscillator #3 will be determined by taking the value of the .frequency property (which controls the frequency of oscillator #1) and offsetting it by the the value of this property multiplied by the base frequency. So, if the base .frqeuency property was 1000 Hz, oscillator #2 would run at a frequency of 1005 Hz using the default value of .005"
    },
    frequency: {
      type: "number(sequencable)",
      default:220, min:40, max:8000,
      doc: "This is the frequency that will be used when the .trigger() method is called, or if you call .note() and pass no argument. Calls to .note() (assuming you pass an argument) will set the value of this property."
    },
    loudness: {
      type: "number(sequencable)",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of the signal. In addition, in the Synth instrument it also affects the cutoff frequency of the instrument's filter (assuming a filter is active), so that louder sounds also sound brighter."
    },
    waveform: {
      type: "string",
      default:'saw',
      doc: "The waveform used by the synth's oscillator. Options include 'saw','sine','triangle','square', and 'pwm'." 
    }
  },
  
  mixins:['env','filter','gain','pan','glide']
}