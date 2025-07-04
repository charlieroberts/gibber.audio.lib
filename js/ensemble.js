module.exports = function( Audio ) {
  const Gibberish = Audio.Gibberish
  const Ensemble = function( props ) {
    const cp = {
      shouldAddToUgen:true
    }

    for( let key in props ) {
      const dict = props[ key ]
      const target = dict.target
      const method = dict.method
      const args = dict.args
      cp[ key ] = {
        play: function( ...args ) { 
          return Gibberish.worklet.ugens.get( this.target )[ this.method ]( ...args ) 
        },
        target:target.id,
        method,
        args,
        name:dict.name
      }

      //Object.defineProperty( cp[ key ], 'loudness', {
      //  set(v) {
      //    console.log( 'loudness:', v, Gibberish.worklet.ugens.get( this.target ))
      //    Gibberish.worklet.ugens.get( this.target ).loudness = v
      //  }
      //})
      cp[ dict.name ] = target
    }

    cp.play = function( __key ) {
      const key = isNaN(__key) ? __key : parseInt( __key ) 
      if( Gibberish.mode === 'processor' ) {
        return Gibberish.worklet.ugens.get( this[ key ].target )[ this[ key ].method ]( ...this[ key ].args )
      }else{
        return props[ key ].target[ this[ key ].method ]( ...this[ key ].args )
      }
    }

    const ens = Audio.busses.Bus2( cp )
    ens.__isEnsemble = true

    for( let key in props ) {
      props[ key ].target.connect( ens )
    }
    
    ens.tidals = []

    ens.stop = function() {
      ens.tidals.forEach( t => t.stop() )
      ens.__sequencers.forEach( t => t.stop() )
    }
    ens.start = function() {
      ens.tidals.forEach( t => t.start() )
      ens.__sequencers.forEach( t => t.start() )
    }

    ens.tidal = (pattern,num=0) => {
      const t =  Audio.Gibber.Tidal({
        target:ens,
        key:'play',
        pattern
      })

      if( t !== null ) {
        if( ens.tidals[ num ] !== undefined ) ens.tidals[ num ].stop()

        ens.tidals[ num ] = t
        t.start()
      }

      return ens
    }
    ens.__sequencers = []

    ens.seq = (values,timings,num=0,offset=0) => {
      if( ens.__sequencers[ num ] !== undefined ) ens.__sequencers[ num ].stop()

      ens.__sequencers[ num ] = Audio.Gibber.Seq({
        target:ens,
        key:'play',
        values,timings,offset
      }).start()

      return ens
    }

    ens.__seqDefault = 'play'
    return ens
  }

  return Ensemble
}
