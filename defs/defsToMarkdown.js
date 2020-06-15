const fs = require('fs'),
      gibberDef = require( './gibber.js' )
      
const displayHeader = function( obj, __text ) {
  const prototype = obj.prototype !== undefined 
    ? `*Prototype: [${obj.prototype}](#prototypes-${obj.prototype})*\n\n` 
    : ''
  
  const docs = obj.doc !== undefined ? `${obj.doc}\n` : ''
  
  const text = `${obj.name}
----
${prototype}${docs}
`

  return __text + text
}

const displayMethods = function( obj, __text ) {
  let text = ''
  if( obj.methods !== undefined ) {
    text = `
#### Methods ####
`
    for( let name in obj.methods ) {
      const method = obj.methods[ name ]
      text +=`### ${obj.name}.${name}( `
      let count = 0
      for( let arg of method.args ) {
        const optional = arg.optional ? '?' : ''
        text += ` *${arg.name}${optional}*`
        text += count++ < method.args.length -1 ? ', ' : ' ) ###\n'
      }
      for( let arg of method.args ) {
        const optional = arg.optional ? 'optional' : 'required'
        text += `**${arg.name}** *${arg.type}* (${optional}) - ${arg.doc||''}\n\n`
      } 
       
    }
  }
  
  return __text + text
}

const displayProperties = function( obj, __text ) {
  let text = ''
  if( obj.properties !== undefined ) {
    text = `
#### Properties ####
`
    for( let name in obj.properties ) {
      const property = obj.properties[ name ]
      const __default = property.default !== undefined ? `default: ${property.default}` : ''
      const range   = property.min !== undefined ? `range: ${property.min}-${property.max}` : ''
      const meta = property.default !== undefined
        ? property.min !== undefined
          ? `${__default}, ${range}. `
          : `${__default}. `
        : ''
      
      text +=`### ${obj.name}.${name} ###\n`
      text += `*${property.type}* ${meta} ${property.doc}\n`
    }
  }
  
  return __text + text
}

let text = `# Gibber

# Prototypes
## Audio
`

for( let proto of gibberDef.prototypes.audio ) {
  text = displayHeader( proto, text )
  text = displayMethods( proto, text )
  text = displayProperties( proto, text )  
}

text += `## Graphics\n`

for( let proto of gibberDef.prototypes.graphics ) {
  text = displayHeader( proto, text )
  text = displayMethods( proto, text )
  text = displayProperties( proto, text )  
}

text += `
# Instruments
`

for( let instrument of gibberDef.instruments ) {
  text = displayHeader( instrument, text )
  text = displayMethods( instrument, text )
  text = displayProperties( instrument, text )  
}

text += `
# Audio Effects
`

for( let effect of gibberDef.effects ) {
  text = displayHeader( effect, text )
  text = displayMethods( effect, text )
  text = displayProperties( effect, text )  
}

text += `
# Geometries
`

for( let effect of gibberDef.geometries ) {
  text = displayHeader( effect, text )
  text = displayMethods( effect, text )
  text = displayProperties( effect, text )  
}


text += `
# Graphics Misc
`

for( let effect of gibberDef.misc ) {
  text = displayHeader( effect, text )
  text = displayMethods( effect, text )
  text = displayProperties( effect, text )  
}


fs.writeFileSync( '../dist/docs/docs.md', text )
