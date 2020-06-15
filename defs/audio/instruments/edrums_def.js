module.exports = {
  name: "EDrums",
  prototype: "instrument",
  doc: "The EDrums object is many of the synthetic drums sounds inspired by the 808 grouped together into a single output. You can sequence the different instruments by referring to them with the kd (kick drum), sd (snare drum), ch (closed hat), cp (clap), cb (cowbell), and oh (open hat) shorthands. You can also access each instrument individually to change gain, panning, and other properties.",
  
  properties: {
    kick: {
      type: "kick",
      doc: "Kick instrument."
    },
    snare: {
      type: "snare",
      doc: "Snare instrument."
    },
    closedHat: {
      type: "hat",
      doc: "Hat instrument with short decay time."
    },
    openHat: {
      type: "hat",
      doc: "Hat instrument with longer decay time."
    },
    clap: {
      type: "clap",
      doc: "Clap instrument."
    },
    cowbell: {
      type: "cowbell",
      doc:  "Cowbell instrument."
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