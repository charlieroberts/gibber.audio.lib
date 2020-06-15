module.exports = {
  name:'Synth',
  prototype: "instrument",
  doc: "The Synth object pairs a single oscillator, an envelope, and a filter. The envelope controls both the gain of the synth (volume) and the cutoff frequency of the filter, making its sound brighter when the envelope is fully open.",
  
  properties: {
    antialias: {
      type: "boolean",
      default:true,
      doc: "When set to true, the synth's oscillators will use higher-quality (but more CPU expensive) anti-aliasing oscillators."
    },
    frequency: {
      isa: "number(sequencable)",
      type:"float",
      default:220, min:40, max:8000,
      doc: "This is the frequency that will be used when the .trigger() method is called, or if you call .note() and pass no argument. Calls to .note() (assuming you pass an argument) will set the value of this property."
    },
    loudness: {
      isa: "number(sequencable)",
      type:"float",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of the signal. In addition, in the Synth instrument it also affects the cutoff frequency of the instrument's filter (assuming a filter is active), so that louder sounds also sound brighter."
    },
    waveform: {
      type: "string",
      default:'saw',
      doc: "The waveform used by the synth's oscillator. Options include 'saw','sine','triangle','square', and 'pwm'." 
    },
  },
  
  mixins:['env','filter','gain','pan','glide']
}