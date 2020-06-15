module.exports = {
  name: "Hat",
  prototype: "instrument",
  doc: "The Hat instrument emulates the hihat found on the Roland TR-808 drum machine. It consists of six tuned square waves feeding bandpass and highpass filters scaled by an exponential decay.",
  
  properties: {
    tune: {
      isa: "number(sequencable)",
      type:"float",
      default:.6, min:0, max:.8,
      doc: "Controls the tuning of the oscillators in the hihat."
    },
    decay: {
      isa: "number(sequencable)",
      type:"float",
      default:.1, min:0, max:1,
      doc: "Controls the length of each hihat hit."
    },
    loudness: {
      isa: "number(sequencable)",
      type: "float",          
      default: 1,
      min:0,
      max:1,
      doc: "Loudness linearly controls the overall volume. For this instrument, it's really no different from the gain property."
    }
  },
  mixins:[ 'gain' ]
}