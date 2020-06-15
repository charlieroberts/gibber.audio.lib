module.exports = {
  cutoff: {
    type: "number__sequencable",
    default:.5,
    min:0,
    max:1,
    doc: "The cutoff property provides a base for determining the cutoff frequency of the filter. The frequency is additionally affected by the envelope of the synth, multiplied by the filterMult property."
  },
  Q: {
    type: "number__sequencable",
    min:0,
    max:1,
    doc: "The Q property (also commonly known as resonance) determines the sharpness of the filter. This is canonically accompanied by a boost around the cutoff frequency; if the Q property is high enough this boost can turn into self-oscillation."
  },
  filterMult: {
    type: "number__sequencable",
    default:2,
    min:0,
    max:10,
    doc: "The filterMult property determines how much the cutoff frequency is affected by each synth's envelope. The default value of 2 means that a cutoff frequency would move between .25 and .5 over the course of the envelope." 
  },
  filterType: {
    type: "number",
    default:1,
    doc: "The filterType property determines what filter modeling algorithm is used. 0 means no filter is applied to the synth, 1 uses a Moog Ladder Filter, 2 uses  a TB303-style diode filter, 3 uses a state variable filter, and 4 uses a biquad filter design." 
  },
  filterMode: {
    type: "number",
    default:0,
    doc: "The filterMode property determines the type of filtering employed, however, some filter types do not support highpass or bandpass filtering. 0 = lowpass, 1 = highpass, 2 = bandpass." 
  },
  saturation: {
    type: "number__sequencable",
    default:.5,
    min:.5,
    max:20,
    doc: "Saturation is a waveshaping distortion that is part of the TB303 diode filter model (filterType 2). This property will have no effect for any other value of filterType." 
  }
}