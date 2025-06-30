module.exports = {
  'plucked': {
    bias:.35,
    gain:1,
    decay:1/5,
    pregain:4,
    postgain:4,
    description:'a short, clean sounding preset with a minimum of distortion/wavefolding.'
  },
  'bass': {
    bias:.15,
    gain:1,
    decay:1,
    pregain:4,
    postgain:15,
    filterMult:4,
    Q:.75,
    octave:-3,
    description:'a relatively clean, percussive bass.'
  },
  
  'perc': {
    bias:.35,
    gain:1,
    decay:1/5,
    pregain:5,
    description:'a short, clean sounding preset with a minimum of distortion/wavefolding.'
  },

  stab: {
    waveform:'saw', 
    decay:1/4, 
    bias:.1, 
    filterMult:0, 
    cutoff:.8, 
    Q:.15, 
    pregain:10, 
    postgain:.25, 
    filterModel:2, 
    saturation:50,
    presetInit( audio ) {
      this.fx.push( audio.effects.Distortion('earshred') )
    },
    description:'a short, heavily distorted and filtered sound. in addition to the standard Complex wavefolding, this preset also adds an additional Distortion effect (preset earsred).'
  }

}
