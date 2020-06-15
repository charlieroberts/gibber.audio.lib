module.exports = {
  name: "Snare",
  prototype: "instrument",
  doc: "The Snare instrument emulates the snare found on the Roland TR-808 drum machine. It consists of an two resonant bandpass filters mixed with high-passed noise, all scaled by an exponential decay.",
  
  properties: {
    tune: {
      isa: "number(sequencable)",
      type:"float",
      doc: "default: 0, range -4–4. The pitch of the snare drum."
    },
    decay: {
      isa: "number(sequencable)",
      type:"float",
      default:.1, min:0, max:1,
      doc: "Controls the length of each snare drum hit."
    },
    snappy: {
      isa: "number(sequencable)",
      type:"float",
      default:1, min:0, max:1,
      doc: "Controls the amount of high-frequency noise in the instrument sound"
    },
    loudness: {
      isa: "number(sequencable)",
      type:"float",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of signal, and also affects the ratio of tuned sound to noise. Higher values will result in more noise in the overall signal, making it perceptually brighter."
    },
  },
  
  mixins:[ 'gain' ]
}