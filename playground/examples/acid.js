Clock.bpm = 140
verb = Bus2('spaceverb')
delay = Bus2('delay.1/6')
 
drums = EDrums()
drums.cowbell.connect( verb, .25 )
drums.clap.connect( verb, .025 )
drums.tidal( 'kd <cp [cp kd] cp cb> <kd*2 [kd ~ kd ch]> <cp [cp kd] kd*2>' )
 
hat = Hat()
hat.trigger.seq( [1,.5], 1/16 )
hat.decay = gen( .035 + cycle(btof(2) ) * .03 )
hat.gain = .075
hat.fx.add( Distortion({ pregain:100, postgain:.15 }) )
 
bass = Synth('acidBass2', { saturation:20, gain:.3 })
  .connect( delay, .25 )
  .connect( verb, .125 )
 
bass.note.seq( [0,0,0,7,0,14,2,14], Euclid(9,16))                         
bass.glide.seq( [1,2500,1,1,5000,1], 1/8 )
bass.octave.seq( [-3,-2,-3,-1,-3,-3], [1/4,1/2] )
 
kick = Kick('deep')
kick.trigger.seq( 1,1/4 )
 
pad = PolySynth('rhodes', { decay:8, gain:.15 })
pad.chord.seq([[0,2,4,6], [1,2,4,7]], 4 )
pad.fx[0].connect( verb, .5 )
