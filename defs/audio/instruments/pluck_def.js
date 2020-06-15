module.exports = {
  name:'Pluck',
  prototype: "instrument",
  doc: "A physically modeled string instrument, using the Karplus-Strong model.",
  
  properties: {
    blend: {
      default:1,
      min:0, max:1,
      doc: "A feature of the model used for this instrument is that it is easy to randomly add noise to the signal. Values slightly less than 1 will produce notes that sound almost errant, while values closer to .5 will produce bursts of noise and can be a useful percussive texture.",
      type: "number(sequencable)"
    },
    decay: {
      default:.97,
      min:0, max:1,
      doc: "Controls the time it takes for each note to fade to silence.",
      type: "number(sequencable)"
    },
    damping: {
      default:.2, min:0, max:1,
      doc: "Controls the amount of high frequency damping, or brightness, of the sound.",
      type: "number(sequencable)"
    },
    frequency: {
      type: "number(sequencable)",
      default:220, min:40, max:8000,
      doc: "This is the frequency that will be used when the .trigger() method is called, or if you call .note() and pass no argument. Calls to .note() (assuming you pass an argument) will set the value of this property."
    },
    loudness: {
      type: "number(sequencable)",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of the signal. In this instrument, there is no difference between loudness and gain."
    },
  },
  
  mixins:['gain','pan','glide']
}