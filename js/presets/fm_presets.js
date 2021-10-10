module.exports = {

  bass : {
    cmRatio:1,
    index:3,
    attack:1/256,
    decay:1/16,
    octave:-2
  },
  deepbass : {
    cmRatio:1,
    index:3,
    attack:1/256,
    decay:1/2,
    octave:-3,
    feedback:.005
  },
  kick:{
    attack : 1/4096,
    index : 5,
    cmRatio : 4/3,
    decay : 1/4,
    octave : -3,
    shape:'exponential'
  },

  perc:{
    attack : 1/4096,
    index : .5,
    cmRatio : 4/3,
    decay : 1/8,
    shape:'exponential',
    presetInit: function( audio ) {
      if( this.voices && this.voices.length > 1 ) {
        this.spread( .99 )
      }
    }
  },

  'bass.electro' : {
    cmRatio:1,
    index:3,
    attack:1/256,
    decay:1/16,
    octave:-2,
    filterModel:2,
    saturation:200,
    Q:.25,
    cutoff:.6835
  },

  glockenspiel : {
    cmRatio	: 3.5307,
    index 	: 1,
    attack	: audio => audio.Clock.ms( 1 ),
    decay	: audio => audio.Clock.ms( 1000 ),
  },

  'glockenspiel.short' : {
    cmRatio	: 3.5307,
    index 	: 1,
    attack	: audio => audio.Clock.ms( 1 ),
    decay	  : 1/12,
    octave  : 1,
    gain    :.05 
  },

  frog : { //ljp
    cmRatio: 0.1,
    index: 2.0,
    attack: audio => audio.Clock.ms( 300 ), 
    decay: audio => audio.Clock.ms( 5 )
  },

  gong : {
    cmRatio: 1.4,
	  index: .95,
	  attack: 1/256,
	  decay: 2,
	},

  drum : {
	  cmRatio: 1.40007,
	  index: 2,
	  attack: 1/2048,
    decay: audio => audio.Clock.ms(1000) 
	},

	drum2: {
		cmRatio: 1 + Math.sqrt(2),
		index: .2,
		attack: 1/256,
		decay: audio => audio.Clock.ms(20) 
  },

	brass : {
    maxVoices:4,
	  cmRatio : 1 / 1.0007,
		index	: 5,
		attack: audio => audio.Clock.ms(100),
		decay	: 1,
    gain:.5,
  },

	clarinet : {
		cmRatio	: 3 / 2,
		index	: 1.5,
		attack: audio => audio.Clock.ms( 50 ), 
		decay:  audio => audio.Clock.ms( 200 )
  },

  fun : {
    decay:1/2,
    feedback: .0015,
    gain:.1
  },

  chirp: {
		attack: audio => audio.Clock.ms( 1 ), 
    index : 1.15,
    glide : 1,
    feedback : .5,
    cmRatio : 1.5,
    decay : 1/4,
    octave : 1,
    shape:'exponential'
  }
}
