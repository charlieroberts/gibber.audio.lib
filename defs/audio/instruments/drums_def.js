module.exports = {
  name: "Drums",
  prototype: "instrument",
  doc: "The Drums object is four samplers grouped together into a single output. You can sequence the different samplers by referring to them with the kd (kick drum), sd (snare drum), ch (closed hat), and oh (open hat) shorthands. You can also access each sampler individually to change gain, panning, pitch, and other properties.",
  
  properties: {
    rate: {
      isa: "number(sequencable)",
      type:"float",
      default:1, min:-100, max:100,
      doc: "Global control of each sampler's playback rate.",
    },
    start: {
      isa: "number(sequencable)",
      type:"float",
      default:0, min:0, max:1,
      doc: "Global control of the each sampler's starting position.",
    },
    end: {
      isa: "number(sequencable)",
      type:"float",
      default:0, min:0, max:1,
      doc: "Global control of the each sampler's end position.",
    },
    kick: {
      type: "sampler",
      doc: "Sampler that is loaded with a kick drum sample."
    },
    snare: {
      type: "sampler",
      doc: "Sampler that is loaded with a snare drum sample."
    },
    closedHat: {
      type: "sampler",
      doc: "Sampler that is loaded with a closed hihat sample."
    },
    openHat: {
      type: "sampler",
      doc: "Sampler that is loaded with a open hihat sample."
    },
    loudness: {
      isa: "number(sequencable)",
      type:"float",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of signal, and also affects the ratio of tuned sound to noise. Higher values will result in more noise in the overall signal, making it perceptually brighter."
    },
    pan: {
      type: "number__sequencable",
      default:.5,
      min:0,
      max:1,
      doc:  "Controls the position of the drus between the left / right speakers or headphones. A value of 0 means the sound is panned to the left, a value of 1 meanns the sound is panned to the right, while .5 is centered."
    }
  },
  
  mixins:[ 'gain' ]
}