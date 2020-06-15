module.exports = {
  name:'FM',
  prototype: "instrument",
  doc: "The FM object pairs two oscillators (with one modulating the frequency of the other) with an envelope and a filter. The envelope controls the amplitude of the modulator (also known as the modulation index) , the overall gain of the synth (volume), and the cutoff frequency of the filter, making its sound perceptually brighter when the envelope is fully open. The synth's envelope also controls the amount that the modulator's output affects its own frequency (feedback).",
  
  properties: {
    cmRatio: {
      type: "number(sequencable)",
      default:2,
      min:.01, max:20,
      doc: "This controls the ratio between the carrier and modulation frequencies. When a note is trigger on this synth the frequency is assigned to the carrier oscillator; the frequency is then multiplied by this property and assigned ot the modulator."
    },
    index: {
      type: "number(sequencable)",
      default:5, min:.01, max:20,
      doc: "This property value, multiplied by the frequency of the carrier oscillator, determines the amplitude of the modulating oscillator."
    },
    feedback: {
      type: "number(sequencable)",
      default:0, min:.0, max:1,
      doc: "The modulating oscillator can direct its output to modulate its own frequency, resulting in chaotic and noisy sounds."
    },
    carrierWaveform: {
      type: "string",
      default:'saw',
      doc: "Controls the waveform of the carrier oscillator. Options include 'saw', 'triangle', 'pwm', 'sine', and 'square'." 
    },
    modulatorWaveform: {
      type: "string",
      default:'saw',
      doc: "Controls the waveform of the carrier oscillator. Options include 'saw', 'triangle', 'pwm', 'sine', and 'square'." 
    },
    antialias: {
      type: "boolean",
      default:true,
      doc: "When set to true, the synth's oscillators will use higher-quality (but more CPU expensive) anti-aliasing oscillators."
    },
    frequency: {
      type: "number(sequencable)",
      default:220, min:40, max:8000,
      doc: "This is the frequency that will be used when the .trigger() method is called, or if you call .note() and pass no argument. Calls to .note() (assuming you pass an argument) will set the value of this property."
    },
    loudness: {
      type: "number(sequencable)",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of the signal. In addition, in the FM instrument it also affects the cutoff frequency of the instrument's filter (assuming a filter is active), the amplitude of the modulator, and the amount of feedback applied to the modulator. All these effects correspond to much more complex timbres as the instrument gets louder."
    },

  },
  
  mixins:['env','filter','gain','pan','glide']
}