module.exports = {  
  attack: {
    type: "duration",
    doc: "The attack property controls the duration it takes for the synth to reach full volume after triggering. The duration is written in measures. A value of 1/4 means one quarter of a measure, a value of 1 means 1 measure."
  },
  decay: {
    type: "duration",
    doc: "The decay property controls the length of time it takes for the synth to decay to silence after reaching full volume during its attack phase. The duration is written in measures e.g. a value of 1/4 means one quarter of a measure, a value of 1 means 1 measure."
  },
  sustain: {
    type: "duration",
    doc: "The sustain property controls the length of time the synths envelope stays at steady state after the attack and decay of the envelope have completed. The duration is written in measures e.g. a value of 1/4 means one quarter of a measure, a value of 1 means 1 measure."
  },
  release: {
    type: "duration",
    doc: "The release determines the amount of time the envelope takes to fade to zero after the sustain portion is complete. The duration is written in measures e.g. a value of 1/4 means one quarter of a measure, a value of 1 means 1 measurei."
  },
  shape: {
    type: "string",
    default:'linear',
    doc: "Controls the shape of the synth's envelope stages. Choosee between 'linear' and 'exponential'." 
  },
  useADSR: {
    type: "boolean",
    default:false,
    doc: "When false, the synth uses a two-stage envelope where durations are determined by the attack and decay properties. When true, the synth uses a four-stage envelope." 
  }
}