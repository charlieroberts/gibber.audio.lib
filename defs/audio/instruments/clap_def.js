module.exports = {
  name: "Clap",
  prototype: "instrument",
  doc: "The Clap instrument poorly emulates the clap found on the Roland TR-808 drum machine, with three enveloped and filtered noise bursts slightly offset from each other in time. Currently it doesn't really sound that close to a TR-808... but it still sounds nice.",
  
  properties: {
    decay: {
      isa: "number(sequencable)",
      type:"float",
      default:.2, min:0, max:1,
      doc: "Controls the length of each clap."
    },
    loudness: {
      isa: "number(sequencable)",
      type: "float",          
      default: 1, min:0, max:1,
      doc: "Loudness linearly controls the overall volume. For this instrument, it's really no different from the gain property."
    },
    spacing: {
      isa: "number(sequencable)",
      type: "float",          
      default: 100, min:1, max:1000,
      doc: "The spacing, in Hz, between each noise envelope."
    },
  },
  
  mixins:[ 'gain' ]
}