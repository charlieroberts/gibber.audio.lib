module.exports = function( Gibber ) {
  
let Steps = {
  type:'HexSteps',
  create( _steps, target ) {
    const stepseq = Object.create( Steps )
    
    stepseq.seqs = {}

    for ( let _key in _steps ) {
      const values = _steps[ _key ],
            key = parseInt( _key )

      //let seq = Gibber.Seq( key, Gibber.Hex( values ), 'midinote', track, 0 )
      //seq.trackID = track.id
      const seq = Gibber.Seq({
        'values':key,
        timings:Gibber.Hex( values ),
        'key': target.__isEnsemble !== true ? 'note' : 'play', 
        target, 
        priority:0
      })

      stepseq.seqs[ _key ] = seq
      stepseq[ _key ] = seq.values
    }

    stepseq.start()
    stepseq.addPatternMethods()

    return stepseq
  },
  
  addPatternMethods() {
    groupMethodNames.map( (name) => {
      this[ name ] = function( ...args ) {
        for( let key in this.seqs ) {
          this.seqs[ key ].values[ name ].apply( this, args )
        }
      }
    
      //Gibber.addSequencingToMethod( this, name, 1 )
    })
  },

  start() {
    for( let key in this.seqs ) { 
      this.seqs[ key ].start()
    }
  },

  stop() {
    for( let key in this.seqs ) { 
      this.seqs[ key ].stop()
    }
  },

  clear() { 
    this.stop() 

    for( let key in this.seqs ) {
      this.seqs[ key ].timings.clear()
    }
  },

  /*
   *rotate( amt ) {
   *  for( let key in this.seqs ) { 
   *    this.seqs[ key ].values.rotate( amt )
   *  }
   *},
   */
}

const groupMethodNames = [ 
  'rotate', 'reverse', 'transpose', 'range',
  'shuffle', 'scale', 'repeat', 'switch', 'store', 
  'reset','flip', 'invert', 'set'
]

return Steps.create

}

