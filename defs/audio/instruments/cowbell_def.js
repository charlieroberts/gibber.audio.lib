module.exports = {
  name: "Cowbell",
  prototype: "instrument",
  doc: "The Cowbell instrument emulates the iconic cowbell found on the Roland TR-808 drum machine, with two enveloped and filtered square waves.",
  properties: {
    decay: {
      isa: "number(sequencable)",
      type: "float",          
      default: .5,
      min:.001,
      max:1,
      doc: "Controls the length of each cowbell hit."
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