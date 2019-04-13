module.exports = function( Gibber ) {
  
const Steps = {
  type:'Steps',
  create( _steps, target ) {
    let stepseq = Object.create( Steps )
    
    stepseq.seqs = {}

    //  create( values, timings, key, object = null, priority=0 )
    for( let _key in _steps ) {
      const values = _steps[ _key ].split(''),
            key = parseInt( _key )

      //Gibber.addSequencingToMethod( d, 'midinote',  0, d.path+'midinote', 'max' ) 
      const seq = Gibber.Seq({
        values, 
        timings:[1 / values.length],
        'key': 'note', 
        target, 
        priority:0
      })

      // need to define custom function to use key as value
      seq.values.addFilter( new Function( 'args', 'ptrn', 
       `let sym = args[ 0 ],
            velocity = parseInt( sym, 16 ) / 15

        if( isNaN( velocity ) ) {
          velocity = 0
        }

        // TODO: is there a better way to get access to beat, beatOffset and scheduler?
        if( velocity !== 0 ) {
          //let msg = seq.externalMessages[ 'velocity' ]( velocity, seq.values.beat + seq.values.beatOffset, seq.trackID )
          //seq.values.scheduler.msgs.push( msg ) 
          ptrn.seq.target.loudness = velocity
        }

        args[ 0 ] = sym === '.' ? ptrn.DNR : ${key}

        return args
      `) )

      stepseq.seqs[ _key ] = seq
      stepseq[ _key ] = seq.values
    }

    stepseq.start()
    //stepseq.addPatternMethods()

    return stepseq
  },
  
  addPatternMethods() {
    groupMethodNames.map( (name) => {
      this[ name ] = function( ...args ) {
        for( let key in this.seqs ) {
          this.seqs[ key ].values[ name ].apply( this, args )
        }
      }
    
      Gibber.addSequencingToMethod( this, name, 1 )
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

  clear() { this.stop() },

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
