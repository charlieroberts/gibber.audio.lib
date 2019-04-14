module.exports = function( Gibber ) {

const Pattern = Gibber.Pattern

const Triggers = function( __values ) {
  const values = __values.split('')
  const pattern = Pattern( ...values ) 
  pattern.isPattern = true
  pattern.type = 'Triggers'
  // need to define custom function to use key as value
  pattern.addFilter( new Function( 'args', 'ptrn', 
   `let sym = args[ 0 ],
        velocity = parseInt( sym, 16 ) / 15

    if( isNaN( velocity ) ) {
      velocity = 0
    }

    if( velocity !== 0 ) {
      ptrn.seq.target.__triggerLoudness = velocity
    }

    ptrn.output = {
      time : Gibberish.Clock.time( ${1/values.length} ),
      shouldExecute: sym !== '.' ? 1 : 0
    }

    args[0] = ptrn.output

    return args
  `) )

  return pattern
}

return Triggers

}
