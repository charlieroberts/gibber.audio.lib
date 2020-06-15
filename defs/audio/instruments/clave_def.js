module.exports = {
  name: "Clave",
  prototype: "instrument",
  doc: "The Clave instrument emulates the clave sound found on the Roland TR-808 drum machine.",
  properties: {
    decay: {
      isa: "number(sequencable)",
      type: "float",          
      default: .9,
      min:.001,
      max:1,
      doc: "Controls the length of each kick drum. Very high values (~.975 and above) result in long, booming sub-bass sounds."
    },  
    frequency: {
      type: "number(sequencable)",
      default:85, min:40, max:500,
      doc: "This is the frequency that will be used when the .trigger() method is called, or if you call .note() and pass no argument. Calls to .note() (assuming you pass an argument) will set the value of this property."
    },
    loudness: {
      isa: "number(sequencable)",
      type: "float",          
      default: 1,
      min:0,
      max:1,
      doc: "Loudness linearly controls the signal pre-filter."
    },
    tone: {
      isa: "number(sequencable)",
      type: "float",
      default:.25, min:0, max:1, 
      doc: "Controls the amount of a high-frequency click at the start of each kick."
    },
  },
  
  mixins:[ 'gain' ]
}