module.exports = {

  earshred: {
    // unfortunately you can't write normal presets for
    // Drums and EDrums, because they don't go through
    // the Ugen constructor in the typical way (they are
    // processed as busses). It would also
    // be difficult to define properties for the individual
    // drum components (snare,kick etc.) using the standard
    // preset format. For these reasons, all property assignment
    // must be performed after initialization. 
    presetInit( audio ) {
      this.fx.add( audio.effects.Distortion('earshred') )

      this.kick.frequency = 55
      this.kick.decay = .975

      this.snare.tune = .25
      this.snare.snappy = 1.5
    }
  },

  hpf: {
    presetInit( audio ) {
      const hpf = audio.filters.Filter12Biquad({ input:this, mode:1, cutoff:.35, isStereo:true })
      this.fx.add( hpf )
      this.hpf = hpf
   }
  },
  lpf: {
    presetInit( audio ) {
      const lpf = audio.filters.Filter24Moog({ input:this, mode:1, cutoff:.35, isStereo:true })
      this.fx.add( lpf )
      this.lpf = lpf
    }
  },
  short: {
    presetInit( audio ) {
      this.kick.decay = .8
      this.snare.decay = .05
      this.closedHat.decay = .05
      this.openHat.decay = .2
    }
  },
  long: {
    presetInit( audio ) {
      this.kick.decay = .975
      this.snare.decay = .1
      this.closedHat.decay = .1
      this.openHat.decay = .25
    }
  }

}
