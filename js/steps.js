module.exports = function( Gibber ) {
 
const Steps = {
  type:'Steps',
  create( _steps, target ) {
    const stepseq = Object.create( Steps )
    
    stepseq.seqs = {}

    for ( let _key in _steps ) {
      let values = _steps[ _key ]
      const parsedKey = parseInt( _key )
      const key =  isNaN( parsedKey ) ? _key : parsedKey

      //let seq = Gibber.Seq( key, Gibber.Hex( values ), 'midinote', track, 0 )
      //seq.trackID = track.id

      let usesStringValues = false
      if( values.isPattern !== true ) {
        if( Array.isArray( values ) ) {
          values = Gibber.Pattern( ...values )
        }else if( typeof values === 'string' ) {
          values = values.split('')
          usesStringValues = true
        }else{
          values = Gibber.Pattern( values )
        }
      }

      const seq = Gibber.Seq({
        values: usesStringValues ? values : key,
        timings: usesStringValues ?  [ 1  / values.length ] : values,
        'key': target.__isEnsemble !== true ? 'note' : 'play', 
        target, 
        priority:0
      })

      if( usesStringValues ) {
        seq.values.addFilter( new Function( 'args', 'ptrn', 
         `let sym = args[ 0 ],
              velocity = parseInt( sym, 16 ) / 15

          if( isNaN( velocity ) ) {
            velocity = 0
          }

          // TODO: is there a better way to get access to beat, beatOffset and scheduler?
          if( velocity !== 0 ) {
            ptrn.seq.target.loudness = velocity
          }

          args[ 0 ] = sym === '.' ? -987654321 : ${typeof key === 'string' ? `'${key}'` : key }

          return args
        `) )
      }

      stepseq.seqs[ _key ] = seq
      stepseq[ _key ] = seq.timings
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


  //rotate( amt ) {
  //  for( let key in this.seqs ) { 
  //    this.seqs[ key ].values.rotate( amt )
  //  }
  //},

}

const groupMethodNames = [ 
  'rotate', 'reverse', 'transpose', 'range',
  'shuffle', 'scale', 'repeat', 'switch', 'store', 
  'reset','flip', 'invert', 'set'
]

return Steps.create

}



/*
const Steps = {
  type:'Steps',
  create( _steps, target ) {
    let stepseq = Object.create( Steps )
  
    stepseq.seqs = {}

    //  create( values, timings, key, object = null, priority=0 )
    for( let _key in _steps ) {
      const values = _steps[ _key ].split('')
      const parsedKey = parseInt( _key )
      const key =  isNaN(parsedKey) ? _key : parsedKey

      debugger
      const seq = Gibber.Seq({
        values, 
        timings:[1 / values.length],
        'key': target.__isEnsemble !== true ? 'note' : 'play', 
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
          ptrn.seq.target.loudness = velocity
        }

        args[ 0 ] = sym === '.' ? ptrn.DNR : ${typeof key === 'string' ? `'${key}'` : key }

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


rotate( amt ) {
  for( let key in this.seqs ) { 
    this.seqs[ key ].values.rotate( amt )
  }
},
}

const groupMethodNames = [ 
  'rotate', 'reverse', 'transpose', 'range',
  'shuffle', 'scale', 'repeat', 'switch', 'store', 
  'reset','flip', 'invert', 'set'
]

return Steps.create

}

*/
