module.exports = {

  'short.dry' : { 
    attack: audio => audio.Clock.ms(.25), 
    decay: 1/12,
    cutoff:.3,
    filterType:1,
    filterMult:3
  },

  arpy : {
    antialias:true,
    attack: audio => audio.Clock.ms(.5),
    decay: 1/16, 
    gain:0.2,
    cutoff:.15,
    filterMult:1,
    Q:.3,
    filterType:1,
    filterMode:1
  },

  lead : {
    presetInit : function( audio ) { this.fx.push( audio.effects.Delay({ time:1/6, feedback:.65 }) )  },
    attack: audio => audio.Clock.ms(.5),
    decay: 1/2, 
    octave3:0,
    cutoff:1,
    filterMult:2.5,
    Q:.975,
    filterType:1,
    filterMode:1
  },
  // not as bright / loud
  lead2 : {
    presetInit : function( audio ) { this.fx.push( audio.effects.Delay({ time:1/6, feedback:.65 }) )  },
    attack: audio => audio.Clock.ms(.5),
    decay: 1/2, 
    octave3:0,
    cutoff:1,
    filterMult:2.5,
    Q:.8,
    gain:.175,
    filterType:1,
    filterMode:1
  },

  dirty: { 
    gain:.325,
    filterType:2,
    attack:1/2048, 
    decay:1/4, 
    cutoff:1.5, 
    filterMult:4, 
    saturation:10000, 
    Q:.225, 
    detune2:-.505,
    detune3:-.5075,
    octave:-2,
    waveform:'pwm', 
    pulsewidth:.15 
  },

  winsome : {
    presetInit : function( audio ) { 
      this.lfo = audio.oscillators.Sine({ frequency:2, gain:.075 })
      this.lfo.connect( this.cutoff )
      this.lfo.connect( this.detune2 )
      this.lfo.connect( this.detune3 )
    },
    attack: audio => audio.Clock.ms(1), 
    decay:1,
    cutoff:.2,
  },

  pluckEcho: {
    presetInit : function( audio ) { this.fx.push( audio.effects.Delay({ time:1/6, feedback:.65 }) )  },
    attack: audio => audio.Clock.ms(.1),
    decay: 1/16, 
    octave3:0,
    cutoff:.15,
    filterMult:1,
    Q:.5,
    filterType:1,
    filterMode:1,
    panVoices:true
  },

  bassPad : { 
    attack: audio => audio.Clock.ms(.1),
    decay: 2,	
    octave:-4,
    cutoff: .225,
    filterMult:3.5,
    Q:.5,
    detune2:1.0125,
    detune3:1-.0125
  },

  warble : { 
    attack: audio => audio.Clock.ms(1),
    decay: 1/2,	
    octave: -3,
    octave2 : -1,
    cutoff: .8,
    filterMult:3,
    Q:.75,
    detune2:.0275,
    detune3:-.0275
  }, 
  dark: { 
    attack: audio => audio.Clock.ms(1),
    decay: 1,	
    octave: -3,
    octave2 : -1,
    cutoff: 1.5,
    filterMult:3,
    Q:.75,
    detune2:.0125,
    detune3:-.0125
  },
  bass: { 
    attack: audio => audio.Clock.ms(1),
    decay: 1/4,	
    octave: -3,
    cutoff: .35,
    filterMult:3,
    Q:.15,
    glide:1250,
    waveform:'pwm',
    pulsewidth:.45,
    detune2:.005,
    detune3:-.005
  },
  bass2 : {
    attack: audio => audio.Clock.ms(1), 
    decay:	1/6,
    octave: -2,
    octave2 : 0,
    octave3 : 0,      
    cutoff: .5,
    filterMult:2,
    Q:.5,
    gain:.35
  },
  
  edgy: {
    decay:1/8,
    attack:1/1024,
    octave: -2,
    octave2: -1,
    cutoff: .5,
    filterMult:3,
    Q:.75, 
    waveform:'pwm', 
    pulsewidth:.2,
    detune2:0,
    gain:.2
  },

  easy : {
    attack: audio=> audio.Clock.ms(1),
    decay:2,
    cutoff:.3,
    glide:.9995,
  },
  
  easyfx : {
    attack: audio=> audio.Clock.ms(1),
    decay:2,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Delay( Clock.time(1/6), .3) )
    },
    cutoff:.125,
    glide:1000,
    detune2:.001,
    detune3:-.001,
    filterType:1,
    filterMult:4,
    Q:.5,
  },
  chords: {
    attack: audio=> audio.Clock.ms(1),
    decay:1/2,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Delay( Clock.time(1/6), .5) )
    },
    amp:.3,
    octave2:0,
    octave3:0,
    cutoff:.5,
    glide:.9995,
    filterType:1,
    filterMult:3,
    Q:.75,
  },

  wander: {
    attack: 1/2,
    decay:  2,
    presetInit: function( audio ) {},
    amp:.2,
    detune2:.501,
    detune3:-.501,
    cutoff:.2,
    glide:5000,
    filterType:1,
    filterMult:1.5,
    Q:.25,
  },

  'chords.short': {
    attack: audio=> audio.Clock.ms(1),
    decay:1/8,
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ delay:audio.Clock.time(1/8), feedback:.5, wetdry:.25 }) 
      this.fx.push( this.delay )
    },
    amp:.3,
    octave2:0,
    octave3:0,
    cutoff:.35,
    glide:1,
    filterType:1,
    filterMult:3,
    Q:.5,
  },

  jump: { 
    decay:1/2048, 
    useADSR:true, 
    sustain:1/4, 
    release:1/1024,  
    maxVoices:3, 
    cutoff:35, 
    filterMult:0,
    detune2:.01,
    detune3:-.01 
  },

  shinybass2: {
    Q:.125,
    cutoff:35,
    useADSR:true,
    decay:1/10,
    sustain:1/4,
    filterMult:0,
    release:1/1024,
    octave:-3,
    panVoices:true
  },
  shinybass: {
    Q:.125,
    cutoff:5,
    useADSR:false,
    attack:1/1024,
    decay:1/10,
    filterMult:0,
    octave:-3,
    panVoices:true
  },

  'bass.muted': {
    Q:.45,
    cutoff:.5,
    useADSR:true,
    shape:'exponential',
    decay:1/8,
    sustain:1/4,
    release:1/1024,
    octave:-3,
    panVoices:true,
    filterMult:.5
  },
  'bass.stab': {
    Q:.35,
    detune2:1.5,
    detune3:.5,
    cutoff:.5,
    useADSR:true,
    shape:'exponential',
    decay:1/10,
    sustain:1/4,
    release:1/1024,
    octave:-3,
    filterMult:1.85,
    gain:.75
  },
  short: { 
    attack:1/4096,
    decay:1/16, 
    maxVoices:3, 
    cutoff:1.5, 
    filterMult:0,
    useADSR:false,
    gain:.5
  },

  noise: {
    resonance:20,
    decay:1/2,
    cutoff:.3,
    glide:.99995,
    detune3:0,
    detune2:0,
    filterMult:0,
    presetInit: function( audio ) { this.fx.add( audio.effects.Gain(.1), audio.effects.Delay(1/6,.75) ) }
  },

}
