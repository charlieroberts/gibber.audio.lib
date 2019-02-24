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
    }
  },

  hpf: {
    presetInit( audio ) {
      // XXX have to specify input because of filter errors...
      const hpf = audio.filters.Filter12Biquad({ input:this, mode:1, cutoff:.275, Q:.25, isStereo:true })
      this.fx.add( hpf )
      this.hpf = hpf
   }
  },
  lpf: {
    presetInit( audio ) {
      // XXX have to specify input because of filter errors...
      const lpf = audio.filters.Filter24Moog({ input:this, mode:1, cutoff:.5, Q:.75, isStereo:true })
      this.fx.add( lpf )
      this.lpf = lpf
    }
  }

}
