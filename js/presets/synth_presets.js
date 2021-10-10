module.exports = {

  acidBass: {
    Q:.9,
    filterModel:2,
    filterMult:4,
    cutoff:1.25,
    saturation:3.5,
    attack:1/8192,
    decay:1/10,
    octave:-3,
    glide:2000,
    description:`A sawtooth feeding a TB303-style lowpass filter, with high Q settings and a short envelope.`
  },

  acidBass2: {
    Q:.7,
    filterModel:2,
    filterMult:3.5,
    cutoff:.5,
    saturation:10,
    attack:1/8192,
    decay:1/10,
    octave:-2,
    glide:100
  },

  'bass.hollow': {
    Q:.2,
    filterModel:2,
    filterMult:4,
    cutoff:1.25,
    saturation:20,
    attack:1/8192,
    decay:1/4,
    octave:-3,
    glide:1000
  },

  'bleep.dry': { 
    attack:1/256, decay:1/32, 
    waveform:'sine' 
  },
  'bleep': { 
    attack:1/256, decay:1/32, 
    waveform:'sine' 
  },

  'bleep.echo': { 
    waveform:'sine', 
    attack:1/256, decay:1/32, 
    gain:.25,
    presetInit: function( audio ) {
      this.fx.push( audio.effects.Delay({ feedback:.5, time:1/12 }) )
    }
  },

  shimmer: {
    attack:1/128, decay:2,
    waveform:'pwm',
    filterModel:1,
    cutoff:1,
    filterMult:1,
    Q:.6,
    maxVoices:3,
    gain:.1,
    antialias:false,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Chorus('warbly') )
      this.pwmod = audio.Gen.make( audio.Gen.ugens.mul( audio.Gen.ugens.cycle(8), .275 ) )
      this.pwmod.connect( this.pulsewidth )
    }
  },

  stringPad: {
    attack:1/2, decay:1.5, gain:.015,
    presetInit: function( audio ) {
      this.fx.chorus = audio.effects.Chorus('lush')
      this.fx.add( this.fx.chorus  )
    }
  },

  cry: {
    attack:1/2, decay:1.5, gain:.045,
    panVoices:true,
    presetInit: function( audio ) {
      this.chorus = audio.effects.Chorus('lush', { isStereo:true })
      this.fx.add( this.chorus  )
      this.bitCrusher = audio.effects.BitCrusher({ bitDepth:.5, isStereo:true })
      this.fx.add( this.bitCrusher )
      //// gen( .5 + cycle( btof(16) ) * .35
      this.srmod = audio.Gen.make( audio.Gen.ugens.add( .5, audio.Gen.ugens.mul( audio.Gen.ugens.cycle(.125/2), .35 ) ) )
      this.bitCrusher.sampleRate = this.srmod
      this.delay = audio.effects.Delay({ time:1/6, feedback:.75 })
      this.fx.add( this.delay )
    }
  },

  brass: {
    attack:1/6, decay:1.5, gain:.05,
    filterModel:1, Q:.5575, cutoff:2,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Chorus('lush') )
      this.chorus = this.fx[0]
    }
  },

  'brass.short':{
    gain:.75,
    filterModel:1,
    antialias:true,
    attack:1/32,
    decay:1/16,
    filterMult:3,
    cutoff:.175,
    Q:.6
  },

  'pwm.squeak':{
    waveform:'pwm',
    attack:1/4096,
    decay:1/16,
    Q:.8,
    cutoff:.65,
    saturation:5,
    filterModel:2,
    glide:500
  },

  'pwm.short':{
    attack:1/1024,
    decay:1/8,
    antialias:true,
    waveform:'pwm'
  },

  chirp: { filterModel:2, cutoff:.325, decay:1/16 }, 

  'square.perc': { 
    waveform:'square', 
    shape:'exponential', 
    antialias:true, 
    filterModel:2, 
    cutoff:.25, 
    decay:1/8,
    panVoices:true
  },

  'square.perc.long': { 
    waveform:'square', 
    shape:'exponential', 
    antialias:true, 
    filterModel:2, 
    cutoff:.25, 
    decay:2,
    panVoices:true
  },

  rhodes:{
    waveform:'sine',
    presetInit( audio ) {
      this.tremolo = audio.effects.Tremolo()
      this.fx.add( this.tremolo )
    },
    decay:4,
    gain:.125,
    shape:'exponential'
  },

  blank: {
    filterModel:0,
    waveform:'sine',
    antialias:false
  }
}
