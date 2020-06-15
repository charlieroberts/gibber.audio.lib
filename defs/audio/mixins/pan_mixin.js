module.exports = {
  panVoices: {
    type: 'boolean',
    default: true,
    doc:  "When set to true the instrument can be panned through the stereo sound image, adding a slight amount of computational expense." 
  },
  pan: {
    type: "number__sequencable",
    default:.5,
    min:0,
    max:1,
    doc:  "Controls the position of the sound between the left / right speakers or headphones. A value of 0 means the sound is panned to the left, a value of 1 meanns the sound is panned to the right, while .5 is centered."
  }
}
