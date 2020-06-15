module.exports = function( Gibber ) {
  const Gibberish = Gibber.Gibberish

  const fnc = function( props ){
    const name = props.name
    const type = props.type
    const properties = props.properties || {}
    const block = `
    const ugen = Object.create( Gibberish.prototypes[ '${type}' ] )
    const graphfnc = ${props.constructor.toString()}

    const proxy = Gibberish.factory( ugen, graphfnc(), '${name}', ${JSON.stringify(properties)} )
    return proxy`

    Gibberish[ name ] = new Function( block )

    Gibberish.worklet.port.postMessage({
      name,
      address:'addConstructor',
      constructorString:`function( Gibberish ) {
      const fnc = ${Gibberish[ name ].toString()}

      return fnc
    }`
    })

    const out = Gibber.Ugen( 
      Gibberish[ name  ],
      { properties, methods:[], name, category:'instruments'},
      Gibber
    )
    return out
  }

  return fnc
}

/* example use:
def = {
  name:'Mysine',
  type:'Ugen',
  properties:{ frequency:220 },
  constructor: function() {
    const gen = Gibberish.genish
    const graph = gen.cycle( gen.in('frequency') )
    return graph
  }
}
 
Mysine = Make( def )
sine = S()
sine.frequency.seq( [110,220,330], 1/8 )
sine.connect()
*/
