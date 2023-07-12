module.exports = function( Audio ) {
  const Gibberish = Audio.Gibberish

  // make async?
  const fnc = function( props ){
    const name = props.name
    const type = props.type
    const properties = props.properties || {}
    const block = `
    const ugen = Object.create( Gibberish.prototypes[ '${type}' ] )
    const graphfnc = ${props.constructor.toString()}

    // XXX what if graphfnc() returns a promise? this is the case
    // when attempting to return a graph create inside a promise made
    // by calling g.data, for example. 
    // can we make the final function async and wait for the resulting
    // graph to be full generated?
    let value = graphfnc()
    if( value.then !== undefined ) {
      // promise
      value = value()
    }
    const proxy = Gibberish.factory( ugen, value, '${name}', ${JSON.stringify(properties)} );
    return proxy;`

    Gibberish[ name ] = new Function( block )//function() { eval( block ) }

    Gibberish.worklet.port.postMessage({
      name,
      address:'addConstructor',
      constructorString:`function( Gibberish ) {
      const fnc = ${Gibberish[ name ].toString()}

      return fnc
    }`
    })

    const out = Audio.Ugen( 
      Gibberish[ name  ],
      { properties, methods:[], name, category:'instruments'},
      Audio 
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
