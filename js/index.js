const Gibber = require( 'gibber.core.lib' )
const Audio  = require( './audio.js' )

const workletPath = './dist/gibberish_worklet.js' 

Gibber.__init = Gibber.init

Gibber.init = function( audioOptions ) {
  const defaults = Object.assign({ workletPath }, audioOptions )

  const promise = Gibber.__init([
    {
      name:    'Audio',
      plugin:  Audio, // Audio is required, imported, or grabbed via <script>
      options: defaults
    }
  ])

  return promise
}

module.exports = Gibber
