const required = true

module.exports = {
  name:'Sampler',
  prototype: "instrument",
  doc: "Plays audio files at adjustable speeds, with control over start and end points and looping.",
  
  properties: {
    start: {
      default:0,
      min:0, max:1,
      doc: "The starting point for playback of the audiofile, measured from 0-1, where 0 is the absolute start of the file and 1 is the end.",
      type: "number(sequencable)"
    },
    end: {
      default:1,
      min:0, max:1,
      doc: "The ending point for playback of the audiofile, measured from 0-1, where 0 is the absolute start of the file and 1 is the end.",
      type: "number(sequencable)"
    },  
    loops: {
      default:0,
      min:0, max:1,
      doc: "If a value of 1 is assigned to this property the audiofile will loop between its start and end points indefinitely.",
      type: "number(sequencable)"
    },
    loudness: {
      type: "number(sequencable)",
      default:1, min:0, max:1,
      doc: "Loudness linearly controls the output of the signal. In this instrument, there is no difference between loudness and gain."
    },
    rate: {
      default:1,
      min:-1000, max:1000,
      doc: "Controls the playback speed of the sample, with negative values playing the sample in reverse. This property is also affected by the .note() method of the sampler.",
      type: "number(sequencable)"
    },

  },

  methods: {
    pickplay: {
      isa: "method(sequencable)",
      args: [{
        name: "sampleIndex",
        type: "int",
        doc: "The sample index loaded in the multisampler (assuming there are multiple samples loaded).",
        required
      }, ],
      returns: "this",
      doc: ".pickplay both selects the current sample used by the sampler and triggers sample playback."
    }

  },
  
  mixins:['gain','pan']
}
