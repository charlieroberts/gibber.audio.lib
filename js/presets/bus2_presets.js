module.exports = {

  'spaceverb': {
    presetInit: function( audio ) {
      this.fx.verb = audio.effects.Reverb({ roomSize:.985, dry:1 })
      this.fx.add( this.fx.verb )
    }
  },
  'echoverb.1/3': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/3, feedback:.35, wetdry:.5 })
      this.fx.reverb  = audio.effects.Reverb({ roomSize:.985, dry:1 })
      this.fx.add( this.fx.delay )
      this.fx.add( this.fx.reverb )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
      this.roomSize = this.fx.reverb.roomSize
    }
  },
  'echoverb.1/6': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/6, feedback:.35, wetdry:.5 })
      this.fx.verb  = audio.effects.Reverb({ roomSize:.985, dry:1 })
      this.fx.add( this.fx.delay, this.fx.reverb )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
      this.roomSize = this.fx.reverb.roomSize
    }
  },
  'delay.1/6': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/6, feedback:.35, wetdry:.5 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  },
  'delay.1/3': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/3, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  }, 
  'delay.1/6.fb': {
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ time:1/6, feedback:.825, wetdry:1 })
      this.fx.add( this.delay ) 
    }
  },
  'delay.1/3.fb': {
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ time:1/3, feedback:.825, wetdry:1 })
      this.fx.add( this.delay )
    }
  },
  'delay.1/5': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/5, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  },
  'delay.1/8': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/8, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  },
  'delay.1/9': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/9, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
    }
  },
}
