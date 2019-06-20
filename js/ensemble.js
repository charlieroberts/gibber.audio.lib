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
          Gibberish.worklet.ugens.get( this.target )[ this.method ]( ...args ) 
        },
        target:target.id,
        method,
        args
      }
      cp[ dict.name ] = target
    }

    cp.play = function( key ) {
      if( Gibberish.mode === 'processor' ) {
        Gibberish.worklet.ugens.get( this[ key ].target )[ this[ key ].method ]( ...this[ key ].args )
      }else{
        props[ key ].target[ this[ key ].method ]( ...this[ key ].args )
      }
    }

    const ens = Audio.busses.Bus2( cp )
    ens.__isEnsemble = true

    for( let key in props ) {
      props[ key ].target.connect( ens )
    }

    ens.tidal = pattern => {
      if( ens.__tidal !== undefined ) ens.__tidal.stop()

      ens.__tidal = Audio.Tidal({
        target:ens,
        key:'play',
        pattern
      }).start()

      return ens
    }

    return ens
  }

  return Ensemble
}
