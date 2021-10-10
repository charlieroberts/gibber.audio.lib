module.exports = {

  lush: {
    fastFrequency:4,
    fastGain:.425,
    slowGain:3.5,
    slowFrequency:1,
    presetInit: function( audio ) {
      const gen = audio.Gen.ugens
      this.mod1 = audio.Gen.make( audio.Gen.ugens.cycle(.1) ).connect( this.fastFrequency )
      //this.fastGain =  audio.Gen.make( gen.add( .425, gen.cycle(.1) ) )
      this.mod2 = audio.Gen.make( audio.Gen.ugens.cycle(.05) ).connect( this.slowGain )
      //this.slowGain = audio.Gen.make( gen.add( 4.5, gen.cycle(.05) ) )
    }
  },

  warbly: {
    fastFrequency:4,
    slowGain:3,
    slowFrequency:1,
    fastGain:1.5,
    presetInit: function( audio ) {
      this.mod1 = audio.Gen.make( audio.Gen.ugens.cycle(.1) ).connect( this.fastFrequency )
      this.mod2 = audio.Gen.make( audio.Gen.ugens.cycle(.05) ).connect( this.slowGain )
    }
  }

}
