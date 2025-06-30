(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Gibber = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'abs',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet ? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.abs' : Math.abs })

      out = `${ref}abs( ${inputs[0]} )`

    } else {
      out = Math.abs( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let abs = Object.create( proto )

  abs.inputs = [ x ]

  return abs
}

},{"./gen.js":33}],2:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'accum',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        genName = 'gen.' + this.name,
        functionBody

    gen.requestMemory( this.memory )

    gen.memory.heap[ this.memory.value.idx ] = this.initialValue

    functionBody = this.callback( genName, inputs[0], inputs[1], `memory[${this.memory.value.idx}]` )

    //gen.closures.add({ [ this.name ]: this }) 

    gen.memo[ this.name ] = this.name + '_value'
    
    return [ this.name + '_value', functionBody ]
  },

  callback( _name, _incr, _reset, valueRef ) {
    let diff = this.max - this.min,
        out = '',
        wrap = ''
    
    /* three different methods of wrapping, third is most expensive:
     *
     * 1: range {0,1}: y = x - (x | 0)
     * 2: log2(this.max) == integer: y = x & (this.max - 1)
     * 3: all others: if( x >= this.max ) y = this.max -x
     *
     */

    // must check for reset before storing value for output
    if( !(typeof this.inputs[1] === 'number' && this.inputs[1] < 1) ) { 
      if( this.resetValue !== this.min ) {

        out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.resetValue}\n\n`
        //out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.min}\n\n`
      }else{
        out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.min}\n\n`
        //out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.initialValue}\n\n`
      }
    }

    out += `  var ${this.name}_value = ${valueRef}\n`
    
    if( this.shouldWrap === false && this.shouldClamp === true ) {
      out += `  if( ${valueRef} < ${this.max } ) ${valueRef} += ${_incr}\n`
    }else{
      out += `  ${valueRef} += ${_incr}\n` // store output value before accumulating  
    }

    if( this.max !== Infinity  && this.shouldWrapMax ) wrap += `  if( ${valueRef} >= ${this.max} ) ${valueRef} -= ${diff}\n`
    if( this.min !== -Infinity && this.shouldWrapMin ) wrap += `  if( ${valueRef} < ${this.min} ) ${valueRef} += ${diff}\n`

    //if( this.min === 0 && this.max === 1 ) { 
    //  wrap =  `  ${valueRef} = ${valueRef} - (${valueRef} | 0)\n\n`
    //} else if( this.min === 0 && ( Math.log2( this.max ) | 0 ) === Math.log2( this.max ) ) {
    //  wrap =  `  ${valueRef} = ${valueRef} & (${this.max} - 1)\n\n`
    //} else if( this.max !== Infinity ){
    //  wrap = `  if( ${valueRef} >= ${this.max} ) ${valueRef} -= ${diff}\n\n`
    //}

    out = out + wrap + '\n'

    return out
  },

  defaults : { min:0, max:1, resetValue:0, initialValue:0, shouldWrap:true, shouldWrapMax: true, shouldWrapMin:true, shouldClamp:false }
}

module.exports = ( incr, reset=0, properties ) => {
  const ugen = Object.create( proto )
      
  Object.assign( ugen, 
    { 
      uid:    gen.getUID(),
      inputs: [ incr, reset ],
      memory: {
        value: { length:1, idx:null }
      }
    },
    proto.defaults,
    properties 
  )

  if( properties !== undefined && properties.shouldWrapMax === undefined && properties.shouldWrapMin === undefined ) {
    if( properties.shouldWrap !== undefined ) {
      ugen.shouldWrapMin = ugen.shouldWrapMax = properties.shouldWrap
    }
  }

  if( properties !== undefined && properties.resetValue === undefined ) {
    ugen.resetValue = ugen.min
  }

  if( ugen.initialValue === undefined ) ugen.initialValue = ugen.min

  Object.defineProperty( ugen, 'value', {
    get()  { 
      //console.log( 'gen:', gen, gen.memory )
      return gen.memory.heap[ this.memory.value.idx ] 
    },
    set(v) { gen.memory.heap[ this.memory.value.idx ] = v }
  })

  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],3:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'acos',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    

    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet ? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'acos': isWorklet ? 'Math.acos' :Math.acos })

      out = `${ref}acos( ${inputs[0]} )` 

    } else {
      out = Math.acos( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let acos = Object.create( proto )

  acos.inputs = [ x ]
  acos.id = gen.getUID()
  acos.name = `${acos.basename}{acos.id}`

  return acos
}

},{"./gen.js":33}],4:[function(require,module,exports){
'use strict'

let gen      = require( './gen.js' ),
    mul      = require( './mul.js' ),
    sub      = require( './sub.js' ),
    div      = require( './div.js' ),
    data     = require( './data.js' ),
    peek     = require( './peek.js' ),
    accum    = require( './accum.js' ),
    ifelse   = require( './ifelseif.js' ),
    lt       = require( './lt.js' ),
    bang     = require( './bang.js' ),
    env      = require( './env.js' ),
    add      = require( './add.js' ),
    poke     = require( './poke.js' ),
    neq      = require( './neq.js' ),
    and      = require( './and.js' ),
    gte      = require( './gte.js' ),
    memo     = require( './memo.js' ),
    utilities= require( './utilities.js' )

module.exports = ( attackTime = 44100, decayTime = 44100, _props ) => {
  const props = Object.assign({}, { shape:'exponential', alpha:5, trigger:null }, _props )
  const _bang = props.trigger !== null ? props.trigger : bang(),
        phase = accum( 1, _bang, { min:0, max: Infinity, initialValue:-Infinity, shouldWrap:false })
      
  let bufferData, bufferDataReverse, decayData, out, buffer

  //console.log( 'shape:', props.shape, 'attack time:', attackTime, 'decay time:', decayTime )
  let completeFlag = data( [0] )
  
  // slightly more efficient to use existing phase accumulator for linear envelopes
  if( props.shape === 'linear' ) {
    out = ifelse( 
      and( gte( phase, 0), lt( phase, attackTime )),
      div( phase, attackTime ),

      and( gte( phase, 0),  lt( phase, add( attackTime, decayTime ) ) ),
      sub( 1, div( sub( phase, attackTime ), decayTime ) ),
      
      neq( phase, -Infinity),
      poke( completeFlag, 1, 0, { inline:0 }),

      0 
    )
  } else {
    bufferData = env({ length:1024, type:props.shape, alpha:props.alpha })
    bufferDataReverse = env({ length:1024, type:props.shape, alpha:props.alpha, reverse:true })

    out = ifelse( 
      and( gte( phase, 0), lt( phase, attackTime ) ), 
      peek( bufferData, div( phase, attackTime ), { boundmode:'clamp' } ), 

      and( gte(phase,0), lt( phase, add( attackTime, decayTime ) ) ), 
      peek( bufferDataReverse, div( sub( phase, attackTime ), decayTime ), { boundmode:'clamp' }),

      neq( phase, -Infinity ),
      poke( completeFlag, 1, 0, { inline:0 }),

      0
    )
  }

  const usingWorklet = gen.mode === 'worklet'
  if( usingWorklet === true ) {
    out.node = null
    utilities.register( out )
  }

  // needed for gibberish... getting this to work right with worklets
  // via promises will probably be tricky
  out.isComplete = ()=> {
    if( usingWorklet === true && out.node !== null ) {
      const p = new Promise( resolve => {
        out.node.getMemoryValue( completeFlag.memory.values.idx, resolve )
      })

      return p
    }else{
      return gen.memory.heap[ completeFlag.memory.values.idx ]
    }
  }

  out.trigger = ()=> {
    if( usingWorklet === true && out.node !== null ) {
      out.node.port.postMessage({ key:'set', idx:completeFlag.memory.values.idx, value:0 })
    }
    //else{
    //  gen.memory.heap[ completeFlag.memory.values.idx ] = 0
    //}
    _bang.trigger()
  }

  return out 
}

},{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":19,"./div.js":24,"./env.js":25,"./gen.js":33,"./gte.js":35,"./ifelseif.js":38,"./lt.js":41,"./memo.js":45,"./mul.js":51,"./neq.js":52,"./peek.js":58,"./poke.js":62,"./sub.js":73,"./utilities.js":79}],5:[function(require,module,exports){
'use strict'

const gen = require('./gen.js')

const proto = { 
  basename:'add',
  gen() {
    let inputs = gen.getInputs( this ),
        out='',
        sum = 0, numCount = 0, adderAtEnd = false, alreadyFullSummed = true

    if( inputs.length === 0 ) return 0

    out = `  var ${this.name} = `

    inputs.forEach( (v,i) => {
      if( isNaN( v ) ) {
        out += v
        if( i < inputs.length -1 ) {
          adderAtEnd = true
          out += ' + '
        }
        alreadyFullSummed = false
      }else{
        sum += parseFloat( v )
        numCount++
      }
    })

    if( numCount > 0 ) {
      out += adderAtEnd || alreadyFullSummed ? sum : ' + ' + sum
    }

    out += '\n'

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = ( ...args ) => {
  const add = Object.create( proto )
  add.id = gen.getUID()
  add.name = add.basename + add.id
  add.inputs = args

  return add
}

},{"./gen.js":33}],6:[function(require,module,exports){
'use strict'

let gen      = require( './gen.js' ),
    mul      = require( './mul.js' ),
    sub      = require( './sub.js' ),
    div      = require( './div.js' ),
    data     = require( './data.js' ),
    peek     = require( './peek.js' ),
    accum    = require( './accum.js' ),
    ifelse   = require( './ifelseif.js' ),
    lt       = require( './lt.js' ),
    bang     = require( './bang.js' ),
    env      = require( './env.js' ),
    param    = require( './param.js' ),
    add      = require( './add.js' ),
    gtp      = require( './gtp.js' ),
    not      = require( './not.js' ),
    and      = require( './and.js' ),
    neq      = require( './neq.js' ),
    poke     = require( './poke.js' )

module.exports = ( attackTime=44, decayTime=22050, sustainTime=44100, sustainLevel=.6, releaseTime=44100, _props ) => {
  let envTrigger = bang(),
      phase = accum( 1, envTrigger, { max: Infinity, shouldWrap:false, initialValue:Infinity }),
      shouldSustain = param( 1 ),
      defaults = {
         shape: 'exponential',
         alpha: 5,
         triggerRelease: false,
      },
      props = Object.assign({}, defaults, _props ),
      bufferData, decayData, out, buffer, sustainCondition, releaseAccum, releaseCondition


  const completeFlag = data( [0] )

  bufferData = env({ length:1024, alpha:props.alpha, shift:0, type:props.shape })

  sustainCondition = props.triggerRelease 
    ? shouldSustain
    : lt( phase, add( attackTime, decayTime, sustainTime ) )

  releaseAccum = props.triggerRelease
    ? gtp( sub( sustainLevel, accum( div( sustainLevel, releaseTime ) , 0, { shouldWrap:false }) ), 0 )
    : sub( sustainLevel, mul( div( sub( phase, add( attackTime, decayTime, sustainTime ) ), releaseTime ), sustainLevel ) ), 

  releaseCondition = props.triggerRelease
    ? not( shouldSustain )
    : lt( phase, add( attackTime, decayTime, sustainTime, releaseTime ) )

  out = ifelse(
    // attack 
    lt( phase,  attackTime ), 
    peek( bufferData, div( phase, attackTime ), { boundmode:'clamp' } ), 

    // decay
    lt( phase, add( attackTime, decayTime ) ), 
    peek( bufferData, sub( 1, mul( div( sub( phase,  attackTime ),  decayTime ), sub( 1,  sustainLevel ) ) ), { boundmode:'clamp' }),

    // sustain
    and( sustainCondition, neq( phase, Infinity ) ),
    peek( bufferData,  sustainLevel ),

    // release
    releaseCondition, //lt( phase,  attackTime +  decayTime +  sustainTime +  releaseTime ),
    peek( 
      bufferData,
      releaseAccum, 
      //sub(  sustainLevel, mul( div( sub( phase,  attackTime +  decayTime +  sustainTime),  releaseTime ),  sustainLevel ) ), 
      { boundmode:'clamp' }
    ),

    neq( phase, Infinity ),
    poke( completeFlag, 1, 0, { inline:0 }),

    0
  )
   
  const usingWorklet = gen.mode === 'worklet'
  if( usingWorklet === true ) {
    out.node = null
    utilities.register( out )
  }

  out.trigger = ()=> {
    shouldSustain.value = 1
    envTrigger.trigger()
  }
 
  // needed for gibberish... getting this to work right with worklets
  // via promises will probably be tricky
  out.isComplete = ()=> {
    if( usingWorklet === true && out.node !== null ) {
      const p = new Promise( resolve => {
        out.node.getMemoryValue( completeFlag.memory.values.idx, resolve )
      })

      return p
    }else{
      return gen.memory.heap[ completeFlag.memory.values.idx ]
    }
  }


  out.release = ()=> {
    shouldSustain.value = 0
    // XXX pretty nasty... grabs accum inside of gtp and resets value manually
    // unfortunately envTrigger won't work as it's back to 0 by the time the release block is triggered...
    if( usingWorklet && out.node !== null ) {
      out.node.port.postMessage({ key:'set', idx:releaseAccum.inputs[0].inputs[1].memory.value.idx, value:0 })
    }else{
      gen.memory.heap[ releaseAccum.inputs[0].inputs[1].memory.value.idx ] = 0
    }
  }

  return out 
}

},{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":19,"./div.js":24,"./env.js":25,"./gen.js":33,"./gtp.js":36,"./ifelseif.js":38,"./lt.js":41,"./mul.js":51,"./neq.js":52,"./not.js":54,"./param.js":57,"./peek.js":58,"./poke.js":62,"./sub.js":73}],7:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'and',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = `  var ${this.name} = (${inputs[0]} !== 0 && ${inputs[1]} !== 0) | 0\n\n`

    gen.memo[ this.name ] = `${this.name}`

    return [ `${this.name}`, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],8:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'asin',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet ? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'asin': isWorklet ? 'Math.sin' : Math.asin })

      out = `${ref}asin( ${inputs[0]} )` 

    } else {
      out = Math.asin( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let asin = Object.create( proto )

  asin.inputs = [ x ]
  asin.id = gen.getUID()
  asin.name = `${asin.basename}{asin.id}`

  return asin
}

},{"./gen.js":33}],9:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'atan',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet ? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'atan': isWorklet ? 'Math.atan' : Math.atan })

      out = `${ref}atan( ${inputs[0]} )` 

    } else {
      out = Math.atan( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let atan = Object.create( proto )

  atan.inputs = [ x ]
  atan.id = gen.getUID()
  atan.name = `${atan.basename}{atan.id}`

  return atan
}

},{"./gen.js":33}],10:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    mul     = require( './mul.js' ),
    sub     = require( './sub.js' )

module.exports = ( decayTime = 44100 ) => {
  let ssd = history ( 1 ),
      t60 = Math.exp( -6.907755278921 / decayTime )

  ssd.in( mul( ssd.out, t60 ) )

  ssd.out.trigger = ()=> {
    ssd.value = 1
  }

  return sub( 1, ssd.out )
}

},{"./gen.js":33,"./history.js":37,"./mul.js":51,"./sub.js":73}],11:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  gen() {
    gen.requestMemory( this.memory )
    
    let out = 
`  var ${this.name} = memory[${this.memory.value.idx}]
  if( ${this.name} === 1 ) memory[${this.memory.value.idx}] = 0      
      
`
    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  } 
}

module.exports = ( _props ) => {
  let ugen = Object.create( proto ),
      props = Object.assign({}, { min:0, max:1 }, _props )

  ugen.name = 'bang' + gen.getUID()

  ugen.min = props.min
  ugen.max = props.max

  const usingWorklet = gen.mode === 'worklet'
  if( usingWorklet === true ) {
    ugen.node = null
    utilities.register( ugen )
  }

  ugen.trigger = () => {
    if( usingWorklet === true && ugen.node !== null ) {
      ugen.node.port.postMessage({ key:'set', idx:ugen.memory.value.idx, value:ugen.max })
    }else{
      if( gen.memory && gen.memory.heap )
        gen.memory.heap[ ugen.memory.value.idx ] = ugen.max 
    }
  }

  ugen.memory = {
    value: { length:1, idx:null }
  }

  return ugen
}

},{"./gen.js":33}],12:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'bool',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = `${inputs[0]} === 0 ? 0 : 1`
    
    //gen.memo[ this.name ] = `gen.data.${this.name}`

    //return [ `gen.data.${this.name}`, ' ' +out ]
    return out
  }
}

module.exports = ( in1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    uid:        gen.getUID(),
    inputs:     [ in1 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}


},{"./gen.js":33}],13:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'ceil',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet ? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.ceil' : Math.ceil })

      out = `${ref}ceil( ${inputs[0]} )`

    } else {
      out = Math.ceil( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let ceil = Object.create( proto )

  ceil.inputs = [ x ]

  return ceil
}

},{"./gen.js":33}],14:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
    floor= require('./floor.js'),
    sub  = require('./sub.js'),
    memo = require('./memo.js')

let proto = {
  basename:'clip',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        out

    out =

` var ${this.name} = ${inputs[0]}
  if( ${this.name} > ${inputs[2]} ) ${this.name} = ${inputs[2]}
  else if( ${this.name} < ${inputs[1]} ) ${this.name} = ${inputs[1]}
`
    out = ' ' + out
    
    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  },
}

module.exports = ( in1, min=-1, max=1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    min, 
    max,
    uid:    gen.getUID(),
    inputs: [ in1, min, max ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./floor.js":30,"./gen.js":33,"./memo.js":45,"./sub.js":73}],15:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'cos',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    
    const isWorklet = gen.mode === 'worklet'

    const ref = isWorklet ? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'cos': isWorklet ? 'Math.cos' : Math.cos })

      out = `${ref}cos( ${inputs[0]} )` 

    } else {
      out = Math.cos( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let cos = Object.create( proto )

  cos.inputs = [ x ]
  cos.id = gen.getUID()
  cos.name = `${cos.basename}{cos.id}`

  return cos
}

},{"./gen.js":33}],16:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'counter',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        genName = 'gen.' + this.name,
        functionBody
       
    if( this.memory.value.idx === null ) gen.requestMemory( this.memory )
    gen.memory.heap[ this.memory.value.idx ] = this.initialValue
    
    functionBody  = this.callback( genName, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4],  `memory[${this.memory.value.idx}]`, `memory[${this.memory.wrap.idx}]`  )

    gen.memo[ this.name ] = this.name + '_value'
   
    if( gen.memo[ this.wrap.name ] === undefined ) this.wrap.gen()

    return [ this.name + '_value', functionBody ]
  },

  callback( _name, _incr, _min, _max, _reset, loops, valueRef, wrapRef ) {
    let diff = this.max - this.min,
        out = '',
        wrap = ''
    // must check for reset before storing value for output
    if( !(typeof this.inputs[3] === 'number' && this.inputs[3] < 1) ) { 
      out += `  if( ${_reset} >= 1 ) ${valueRef} = ${_min}\n`
    }

    out += `  var ${this.name}_value = ${valueRef};\n  ${valueRef} += ${_incr}\n` // store output value before accumulating  
    
    if( typeof this.max === 'number' && this.max !== Infinity && typeof this.min !== 'number' ) {
      wrap = 
`  if( ${valueRef} >= ${this.max} &&  ${loops} > 0) {
    ${valueRef} -= ${diff}
    ${wrapRef} = 1
  }else{
    ${wrapRef} = 0
  }\n`
    }else if( this.max !== Infinity && this.min !== Infinity ) {
      wrap = 
`  if( ${valueRef} >= ${_max} &&  ${loops} > 0) {
    ${valueRef} -= ${_max} - ${_min}
    ${wrapRef} = 1
  }else if( ${valueRef} < ${_min} &&  ${loops} > 0) {
    ${valueRef} += ${_max} - ${_min}
    ${wrapRef} = 1
  }else{
    ${wrapRef} = 0
  }\n`
    }else{
      out += '\n'
    }

    out = out + wrap

    return out
  }
}

module.exports = ( incr=1, min=0, max=Infinity, reset=0, loops=1,  properties ) => {
  let ugen = Object.create( proto ),
      defaults = Object.assign( { initialValue: 0, shouldWrap:true }, properties )

  Object.assign( ugen, { 
    min:    min, 
    max:    max,
    initialValue: defaults.initialValue,
    value:  defaults.initialValue,
    uid:    gen.getUID(),
    inputs: [ incr, min, max, reset, loops ],
    memory: {
      value: { length:1, idx: null },
      wrap:  { length:1, idx: null } 
    },
    wrap : {
      gen() { 
        if( ugen.memory.wrap.idx === null ) {
          gen.requestMemory( ugen.memory )
        }
        gen.getInputs( this )
        gen.memo[ this.name ] = `memory[ ${ugen.memory.wrap.idx} ]`
        return `memory[ ${ugen.memory.wrap.idx} ]` 
      }
    }
  },
  defaults )
 
  Object.defineProperty( ugen, 'value', {
    get() { 
      //console.log( 'counter value', this.memory.value.idx, gen.memory.heap[ this.memory.value.idx ], gen.memory )
        
      if( this.memory.value.idx !== null ) {
        return gen.memory.heap[ this.memory.value.idx ]
      }
    },
    set( v ) {
      if( this.memory.value.idx !== null ) {
        //console.log( 'settting counter', v )
        gen.memory.heap[ this.memory.value.idx ] = v 
      }
    }
  })
  
  ugen.wrap.inputs = [ ugen ]
  ugen.name = `${ugen.basename}${ugen.uid}`
  ugen.wrap.name = ugen.name + '_wrap'
  return ugen
} 

},{"./gen.js":33}],17:[function(require,module,exports){
'use strict'

let gen  = require( './gen.js' ),
    accum= require( './phasor.js' ),
    data = require( './data.js' ),
    peek = require( './peek.js' ),
    mul  = require( './mul.js' ),
    phasor=require( './phasor.js')

let proto = {
  basename:'cycle',

  initTable() {    
    let buffer = new Float32Array( 1024 )

    for( let i = 0, l = buffer.length; i < l; i++ ) {
      buffer[ i ] = Math.sin( ( i / l ) * ( Math.PI * 2 ) )
    }

    gen.globals.cycle = data( buffer, 1, { immutable:true } )
  }

}

module.exports = ( frequency=1, reset=0, _props ) => {
  if( typeof gen.globals.cycle === 'undefined' ) proto.initTable() 
  const props = Object.assign({}, { min:0 }, _props )

  const ugen = peek( gen.globals.cycle, phasor( frequency, reset, props ))
  ugen.name = 'cycle' + gen.getUID()

  return ugen
}

},{"./data.js":19,"./gen.js":33,"./mul.js":51,"./peek.js":58,"./phasor.js":60}],18:[function(require,module,exports){
'use strict'

const gen  = require( './gen.js' ),
      accum= require( './phasor.js' ),
      data = require( './data.js' ),
      peek = require( './peek.js' ),
      mul  = require( './mul.js' ),
      add  = require( './add.js' ),
      phasor=require( './phasor.js')

const proto = {
  basename:'cycleN',

  initTable() {    
    let buffer = new Float32Array( 1024 )

    for( let i = 0, l = buffer.length; i < l; i++ ) {
      buffer[ i ] = Math.sin( ( i / l ) * ( Math.PI * 2 ) )
    }

    gen.globals.cycle = data( buffer, 1, { immutable:true } )
  }

}

module.exports = ( frequency=1, reset=0, _props ) => {
  if( typeof gen.globals.cycle === 'undefined' ) proto.initTable() 
  const props = Object.assign({}, { min:0 }, _props )

  const ugen = mul( add( 1, peek( gen.globals.cycle, phasor( frequency, reset, props )) ), .5 )
  ugen.name = 'cycle' + gen.getUID()

  return ugen
}

},{"./add.js":5,"./data.js":19,"./gen.js":33,"./mul.js":51,"./peek.js":58,"./phasor.js":60}],19:[function(require,module,exports){
'use strict'

const gen  = require('./gen.js'),
      utilities = require( './utilities.js' ),
      peek = require('./peek.js'),
      poke = require('./poke.js')

const proto = {
  basename:'data',
  globals: {},
  memo:{},

  gen() {
    let idx
    //console.log( 'data name:', this.name, proto.memo )
    //debugger
    if( gen.memo[ this.name ] === undefined ) {
      let ugen = this
      gen.requestMemory( this.memory, this.immutable ) 
      idx = this.memory.values.idx
      if( this.buffer !== undefined ) {
        try {
          gen.memory.heap.set( this.buffer, idx )
        }catch( e ) {
          console.log( e )
          throw Error( 'error with request. asking for ' + this.buffer.length +'. current index: ' + gen.memoryIndex + ' of ' + gen.memory.heap.length )
        }
      }
      //gen.data[ this.name ] = this
      //return 'gen.memory' + this.name + '.buffer'
      if( this.name.indexOf('data') === -1 ) {
        proto.memo[ this.name ] = idx
      }else{
        gen.memo[ this.name ] = idx
      }
    }else{
      //console.log( 'using gen data memo', proto.memo[ this.name ] )
      idx = gen.memo[ this.name ]
    }
    return idx
  },
}

module.exports = ( x, y=1, properties ) => {
  let ugen, buffer, shouldLoad = false
  
  if( properties !== undefined && properties.global !== undefined ) {
    if( gen.globals[ properties.global ] ) {
      return gen.globals[ properties.global ]
    }
  }

  if( typeof x === 'number' ) {
    if( y !== 1 ) {
      buffer = []
      for( let i = 0; i < y; i++ ) {
        buffer[ i ] = new Float32Array( x )
      }
    }else{
      buffer = new Float32Array( x )
    }
  }else if( Array.isArray( x ) ) { //! (x instanceof Float32Array ) ) {
    let size = x.length
    buffer = new Float32Array( size )
    for( let i = 0; i < x.length; i++ ) {
      buffer[ i ] = x[ i ]
    }
  }else if( typeof x === 'string' ) {
    //buffer = { length: y > 1 ? y : gen.samplerate * 60 } // XXX what???
    //if( proto.memo[ x ] === undefined ) {
      buffer = { length: y > 1 ? y : 1 } // XXX what???
      shouldLoad = true
    //}else{
      //buffer = proto.memo[ x ]
    //}
  }else if( x instanceof Float32Array ) {
    buffer = x
  }else if( x instanceof Uint8Array ) {
    buffer = x
  }else if( x instanceof AudioBuffer ) {
    buffer = x.getChannelData(0)
  }
  
  ugen = Object.create( proto ) 

  Object.assign( ugen, 
  { 
    buffer,
    name: proto.basename + gen.getUID(),
    dim:  buffer !== undefined ? buffer.length : 1, // XXX how do we dynamically allocate this?
    channels : 1,
    onload: properties !== undefined ? properties.onload || null : null,
    //then( fnc ) {
    //  ugen.onload = fnc
    //  return ugen
    //},
    immutable: properties !== undefined && properties.immutable === true ? true : false,
    load( filename, __resolve ) {
      let promise = utilities.loadSample( filename, ugen )
      promise.then( _buffer => { 
        proto.memo[ x ] = _buffer
        ugen.name = filename
        ugen.memory.values.length = ugen.dim = _buffer.length

        gen.requestMemory( ugen.memory, ugen.immutable ) 
        gen.memory.heap.set( _buffer, ugen.memory.values.idx )
        if( typeof ugen.onload === 'function' ) ugen.onload( _buffer ) 
        __resolve( ugen )
      })
    },
    memory : {
      values: { length:buffer !== undefined ? buffer.length : 1, idx:null }
    }
  },
  properties
  )

  
  if( properties !== undefined ) {
    if( properties.global !== undefined ) {
      gen.globals[ properties.global ] = ugen
    }
    if( properties.meta === true ) {
      for( let i = 0, length = ugen.buffer.length; i < length; i++ ) {
        Object.defineProperty( ugen, i, {
          get () {
            return peek( ugen, i, { mode:'simple', interp:'none' } )
          },
          set( v ) {
            return poke( ugen, v, i )
          }
        })
      }
    }
  }

  let returnValue
  if( shouldLoad === true ) {
    returnValue = new Promise( (resolve,reject) => {
      //ugen.load( x, resolve )
      let promise = utilities.loadSample( x, ugen )
      promise.then( _buffer => { 
        proto.memo[ x ] = _buffer
        ugen.memory.values.length = ugen.dim = _buffer.length

        ugen.buffer = _buffer
        //gen.once( 'memory init', ()=> {
        //  console.log( "CALLED", ugen.memory )
        //  gen.requestMemory( ugen.memory, ugen.immutable ) 
        //  gen.memory.heap.set( _buffer, ugen.memory.values.idx )
        //  if( typeof ugen.onload === 'function' ) ugen.onload( _buffer ) 
        //})
        
        resolve( ugen )
      })     
    })
  }else if( proto.memo[ x ] !== undefined ) {

    gen.once( 'memory init', ()=> {
      gen.requestMemory( ugen.memory, ugen.immutable ) 
      gen.memory.heap.set( ugen.buffer, ugen.memory.values.idx )
      if( typeof ugen.onload === 'function' ) ugen.onload( ugen.buffer ) 
    })

    returnValue = ugen
  }else{
    returnValue = ugen
  }

  return returnValue 
}


},{"./gen.js":33,"./peek.js":58,"./poke.js":62,"./utilities.js":79}],20:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' ),
    add     = require( './add.js' ),
    mul     = require( './mul.js' ),
    memo    = require( './memo.js' )

module.exports = ( in1 ) => {
  let x1 = history(),
      y1 = history(),
      filter

  //History x1, y1; y = in1 - x1 + y1*0.9997; x1 = in1; y1 = y; out1 = y;
  filter = memo( add( sub( in1, x1.out ), mul( y1.out, .9997 ) ) )
  x1.in( in1 )
  y1.in( filter )

  return filter
}

},{"./add.js":5,"./gen.js":33,"./history.js":37,"./memo.js":45,"./mul.js":51,"./sub.js":73}],21:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    mul     = require( './mul.js' ),
    t60     = require( './t60.js' )

module.exports = ( decayTime = 44100, props ) => {
  let properties = Object.assign({}, { initValue:1 }, props ),
      ssd = history ( properties.initValue )

  ssd.in( mul( ssd.out, t60( decayTime ) ) )

  ssd.out.trigger = ()=> {
    ssd.value = 1
  }

  return ssd.out 
}

},{"./gen.js":33,"./history.js":37,"./mul.js":51,"./t60.js":75}],22:[function(require,module,exports){
'use strict'

const gen  = require( './gen.js'  ),
      data = require( './data.js' ),
      poke = require( './poke.js' ),
      peek = require( './peek.js' ),
      sub  = require( './sub.js'  ),
      wrap = require( './wrap.js' ),
      accum= require( './accum.js'),
      memo = require( './memo.js' )

const proto = {
  basename:'delay',

  gen() {
    let inputs = gen.getInputs( this )
    
    gen.memo[ this.name ] = inputs[0]
    
    return inputs[0]
  },
}

const defaults = { size: 512, interp:'none' }

module.exports = ( in1, taps, properties ) => {
  const ugen = Object.create( proto )
  let writeIdx, readIdx, delaydata

  if( Array.isArray( taps ) === false ) taps = [ taps ]
  
  const props = Object.assign( {}, defaults, properties )

  const maxTapSize = Math.max( ...taps )
  if( props.size < maxTapSize ) props.size = maxTapSize

  delaydata = data( props.size )
  
  ugen.inputs = []

  writeIdx = accum( 1, 0, { max:props.size, min:0 })
  
  for( let i = 0; i < taps.length; i++ ) {
    ugen.inputs[ i ] = peek( delaydata, wrap( sub( writeIdx, taps[i] ), 0, props.size ),{ mode:'samples', interp:props.interp })
  }
  
  ugen.outputs = ugen.inputs // XXX ugh, Ugh, UGH! but i guess it works.

  poke( delaydata, in1, writeIdx )

  ugen.name = `${ugen.basename}${gen.getUID()}`

  return ugen
}

},{"./accum.js":2,"./data.js":19,"./gen.js":33,"./memo.js":45,"./peek.js":58,"./poke.js":62,"./sub.js":73,"./wrap.js":81}],23:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' )

module.exports = ( in1 ) => {
  let n1 = history()
    
  n1.in( in1 )

  let ugen = sub( in1, n1.out )
  ugen.name = 'delta'+gen.getUID()

  return ugen
}

},{"./gen.js":33,"./history.js":37,"./sub.js":73}],24:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

const proto = {
  basename:'div',
  gen() {
    let inputs = gen.getInputs( this ),
        out=`  var ${this.name} = `,
        diff = 0, 
        numCount = 0,
        lastNumber = inputs[ 0 ],
        lastNumberIsUgen = isNaN( lastNumber ), 
        divAtEnd = false

    inputs.forEach( (v,i) => {
      if( i === 0 ) return

      let isNumberUgen = isNaN( v ),
        isFinalIdx   = i === inputs.length - 1

      if( !lastNumberIsUgen && !isNumberUgen ) {
        lastNumber = lastNumber / v
        out += lastNumber
      }else{
        out += `${lastNumber} / ${v}`
      }

      if( !isFinalIdx ) out += ' / ' 
    })

    out += '\n'

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = (...args) => {
  const div = Object.create( proto )
  
  Object.assign( div, {
    id:     gen.getUID(),
    inputs: args,
  })

  div.name = div.basename + div.id
  
  return div
}

},{"./gen.js":33}],25:[function(require,module,exports){
'use strict'

let gen     = require( './gen' ),
    windows = require( './windows' ),
    data    = require( './data' ),
    defaults = {
      type:'triangular', length:1024, alpha:.15, shift:0, reverse:false 
    }

module.exports = props => {
  
  let properties = Object.assign( {}, defaults, props )
  let buffer = new Float32Array( properties.length )

  let name = properties.type + '_' + properties.length + '_' + properties.shift + '_' + properties.reverse + '_' + properties.alpha
  if( typeof gen.globals.windows[ name ] === 'undefined' ) { 

    for( let i = 0; i < properties.length; i++ ) {
      buffer[ i ] = windows[ properties.type ]( properties.length, i, properties.alpha, properties.shift )
    }

    if( properties.reverse === true ) { 
      buffer.reverse()
    }
    gen.globals.windows[ name ] = data( buffer )
  }

  let ugen = gen.globals.windows[ name ] 
  ugen.name = 'env' + gen.getUID()

  return ugen
}

},{"./data":19,"./gen":33,"./windows":80}],26:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'eq',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = this.inputs[0] === this.inputs[1] ? 1 : `  var ${this.name} = (${inputs[0]} === ${inputs[1]}) | 0\n\n`

    gen.memo[ this.name ] = `${this.name}`

    return [ `${this.name}`, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],27:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'exp',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.exp' : Math.exp })

      out = `${ref}exp( ${inputs[0]} )`

    } else {
      out = Math.exp( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let exp = Object.create( proto )

  exp.inputs = [ x ]

  return exp
}

},{"./gen.js":33}],28:[function(require,module,exports){
/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// originally from:
// https://github.com/GoogleChromeLabs/audioworklet-polyfill
// I am modifying it to accept variable buffer sizes
// and to get rid of some strange global initialization that seems required to use it
// with browserify. Also, I added changes to fix a bug in Safari for the AudioWorkletProcessor
// property not having a prototype (see:https://github.com/GoogleChromeLabs/audioworklet-polyfill/pull/25)
// TODO: Why is there an iframe involved? (realm.js)

const Realm = require( './realm.js' )

const AWPF = function( self = window, bufferSize = 4096 ) {
  const PARAMS = []
  let nextPort

  if (typeof AudioWorkletNode !== 'function' || !("audioWorklet" in AudioContext.prototype)) {
    self.AudioWorkletNode = function AudioWorkletNode (context, name, options) {
      const processor = getProcessorsForContext(context)[name];
      const outputChannels = options && options.outputChannelCount ? options.outputChannelCount[0] : 2;
      const scriptProcessor = context.createScriptProcessor( bufferSize, 2, outputChannels);

      scriptProcessor.parameters = new Map();
      if (processor.properties) {
        for (let i = 0; i < processor.properties.length; i++) {
          const prop = processor.properties[i];
          const node = context.createGain().gain;
          node.value = prop.defaultValue;
          // @TODO there's no good way to construct the proxy AudioParam here
          scriptProcessor.parameters.set(prop.name, node);
        }
      }

      const mc = new MessageChannel();
      nextPort = mc.port2;
      const inst = new processor.Processor(options || {});
      nextPort = null;

      scriptProcessor.port = mc.port1;
      scriptProcessor.processor = processor;
      scriptProcessor.instance = inst;
      scriptProcessor.onaudioprocess = onAudioProcess;
      return scriptProcessor;
    };

    Object.defineProperty((self.AudioContext || self.webkitAudioContext).prototype, 'audioWorklet', {
      get () {
        return this.$$audioWorklet || (this.$$audioWorklet = new self.AudioWorklet(this));
      }
    });

    /* XXX - ADDED TO OVERCOME PROBLEM IN SAFARI WHERE AUDIOWORKLETPROCESSOR PROTOTYPE IS NOT AN OBJECT */
    const AudioWorkletProcessor = function() {
      this.port = nextPort
    }
    AudioWorkletProcessor.prototype = {}

    self.AudioWorklet = class AudioWorklet {
      constructor (audioContext) {
        this.$$context = audioContext;
      }

      addModule (url, options) {
        return fetch(url).then(r => {
          if (!r.ok) throw Error(r.status);
          return r.text();
        }).then( code => {
          const context = {
            sampleRate: this.$$context.sampleRate,
            currentTime: this.$$context.currentTime,
            AudioWorkletProcessor,
            registerProcessor: (name, Processor) => {
              const processors = getProcessorsForContext(this.$$context);
              processors[name] = {
                realm,
                context,
                Processor,
                properties: Processor.parameterDescriptors || []
              };
            }
          };

          context.self = context;
          const realm = new Realm(context, document.documentElement);
          realm.exec(((options && options.transpile) || String)(code));
          return null;
        });
      }
    };
  }

  function onAudioProcess (e) {
    const parameters = {};
    let index = -1;
    this.parameters.forEach((value, key) => {
      const arr = PARAMS[++index] || (PARAMS[index] = new Float32Array(this.bufferSize));
      // @TODO proper values here if possible
      arr.fill(value.value);
      parameters[key] = arr;
    });
    this.processor.realm.exec(
      'self.sampleRate=sampleRate=' + this.context.sampleRate + ';' +
      'self.currentTime=currentTime=' + this.context.currentTime
    );
    const inputs = channelToArray(e.inputBuffer);
    const outputs = channelToArray(e.outputBuffer);
    this.instance.process([inputs], [outputs], parameters);
  }

  function channelToArray (ch) {
    const out = [];
    for (let i = 0; i < ch.numberOfChannels; i++) {
      out[i] = ch.getChannelData(i);
    }
    return out;
  }

  function getProcessorsForContext (audioContext) {
    return audioContext.$$processors || (audioContext.$$processors = {});
  }
}

module.exports = AWPF

},{"./realm.js":29}],29:[function(require,module,exports){
/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

module.exports = function Realm (scope, parentElement) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:absolute;left:0;top:-999px;width:1px;height:1px;';
  parentElement.appendChild(frame);
  const win = frame.contentWindow;
  const doc = win.document;
  let vars = 'var window,$hook';
  for (const i in win) {
    if (!(i in scope) && i !== 'eval') {
      vars += ',';
      vars += i;
    }
  }
  for (const i in scope) {
    vars += ',';
    vars += i;
    vars += '=self.';
    vars += i;
  }
  const script = doc.createElement('script');
  script.appendChild(doc.createTextNode(
    `function $hook(self,console) {"use strict";
        ${vars};return function() {return eval(arguments[0])}}`
  ));
  doc.body.appendChild(script);
  this.exec = win.$hook.call(scope, scope, console);
}

},{}],30:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'floor',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      //gen.closures.add({ [ this.name ]: Math.floor })

      out = `( ${inputs[0]} | 0 )`

    } else {
      out = inputs[0] | 0
    }
    
    return out
  }
}

module.exports = x => {
  let floor = Object.create( proto )

  floor.inputs = [ x ]

  return floor
}

},{"./gen.js":33}],31:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'fold',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        out

    out = this.createCallback( inputs[0], this.min, this.max ) 

    gen.memo[ this.name ] = this.name + '_value'

    return [ this.name + '_value', out ]
  },

  createCallback( v, lo, hi ) {
    let out =
` var ${this.name}_value = ${v},
      ${this.name}_range = ${hi} - ${lo},
      ${this.name}_numWraps = 0

  if(${this.name}_value >= ${hi}){
    ${this.name}_value -= ${this.name}_range
    if(${this.name}_value >= ${hi}){
      ${this.name}_numWraps = ((${this.name}_value - ${lo}) / ${this.name}_range) | 0
      ${this.name}_value -= ${this.name}_range * ${this.name}_numWraps
    }
    ${this.name}_numWraps++
  } else if(${this.name}_value < ${lo}){
    ${this.name}_value += ${this.name}_range
    if(${this.name}_value < ${lo}){
      ${this.name}_numWraps = ((${this.name}_value - ${lo}) / ${this.name}_range- 1) | 0
      ${this.name}_value -= ${this.name}_range * ${this.name}_numWraps
    }
    ${this.name}_numWraps--
  }
  if(${this.name}_numWraps & 1) ${this.name}_value = ${hi} + ${lo} - ${this.name}_value
`
    return ' ' + out
  }
}

module.exports = ( in1, min=0, max=1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    min, 
    max,
    uid:    gen.getUID(),
    inputs: [ in1 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],32:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'gate',
  controlString:null, // insert into output codegen for determining indexing
  gen() {
    let inputs = gen.getInputs( this ), out
    
    gen.requestMemory( this.memory )
    
    let lastInputMemoryIdx = 'memory[ ' + this.memory.lastInput.idx + ' ]',
        outputMemoryStartIdx = this.memory.lastInput.idx + 1,
        inputSignal = inputs[0],
        controlSignal = inputs[1]
    
    /* 
     * we check to see if the current control inputs equals our last input
     * if so, we store the signal input in the memory associated with the currently
     * selected index. If not, we put 0 in the memory associated with the last selected index,
     * change the selected index, and then store the signal in put in the memery assoicated
     * with the newly selected index
     */
    
    out =

` if( ${controlSignal} !== ${lastInputMemoryIdx} ) {
    memory[ ${lastInputMemoryIdx} + ${outputMemoryStartIdx}  ] = 0 
    ${lastInputMemoryIdx} = ${controlSignal}
  }
  memory[ ${outputMemoryStartIdx} + ${controlSignal} ] = ${inputSignal}

`
    this.controlString = inputs[1]
    this.initialized = true

    gen.memo[ this.name ] = this.name

    this.outputs.forEach( v => v.gen() )

    return [ null, ' ' + out ]
  },

  childgen() {
    if( this.parent.initialized === false ) {
      gen.getInputs( this ) // parent gate is only input of a gate output, should only be gen'd once.
    }

    if( gen.memo[ this.name ] === undefined ) {
      gen.requestMemory( this.memory )

      gen.memo[ this.name ] = `memory[ ${this.memory.value.idx} ]`
    }
    
    return  `memory[ ${this.memory.value.idx} ]`
  }
}

module.exports = ( control, in1, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { count: 2 }

  if( typeof properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, {
    outputs: [],
    uid:     gen.getUID(),
    inputs:  [ in1, control ],
    memory: {
      lastInput: { length:1, idx:null }
    },
    initialized:false
  },
  defaults )
  
  ugen.name = `${ugen.basename}${gen.getUID()}`

  for( let i = 0; i < ugen.count; i++ ) {
    ugen.outputs.push({
      index:i,
      gen: proto.childgen,
      parent:ugen,
      inputs: [ ugen ],
      memory: {
        value: { length:1, idx:null }
      },
      initialized:false,
      name: `${ugen.name}_out${gen.getUID()}`
    })
  }

  return ugen
}

},{"./gen.js":33}],33:[function(require,module,exports){
'use strict'

/* gen.js
 *
 * low-level code generation for unit generators
 *
 */
const MemoryHelper = require( 'memory-helper' )
const EE = require( 'events' ).EventEmitter

const gen = {

  accum:0,
  getUID() { return this.accum++ },
  debug:false,
  samplerate: 44100, // change on audiocontext creation
  shouldLocalize: false,
  graph:null,
  alwaysReturnArrays: false,
  globals:{
    windows: {},
  },
  mode:'worklet',
  
  /* closures
   *
   * Functions that are included as arguments to master callback. Examples: Math.abs, Math.random etc.
   * XXX Should probably be renamed callbackProperties or something similar... closures are no longer used.
   */

  closures: new Set(),
  params:   new Set(),
  inputs:   new Set(),

  parameters: new Set(),
  endBlock: new Set(),
  histories: new Map(),

  memo: {},

  //data: {},
  
  /* export
   *
   * place gen functions into another object for easier reference
   */

  export( obj ) {},

  addToEndBlock( v ) {
    this.endBlock.add( '  ' + v )
  },
  
  requestMemory( memorySpec, immutable=false ) {
    for( let key in memorySpec ) {
      let request = memorySpec[ key ]

      //console.log( 'requesting ' + key + ':' , JSON.stringify( request ) )

      if( request.length === undefined ) {
        console.log( 'undefined length for:', key )

        continue
      }

      request.idx = gen.memory.alloc( request.length, immutable )
    }
  },

  createMemory( amount=4096, type ) {
    const mem = MemoryHelper.create( amount, type )
    return mem
  },

  createCallback( ugen, mem, debug = false, shouldInlineMemory=false, memType = Float64Array ) {
    const numChannels = Array.isArray( ugen ) ? ugen.length : 1
    let isStereo = Array.isArray( ugen ) && ugen.length > 1,
        callback, 
        channel1, channel2

    if( typeof mem === 'number' || mem === undefined ) {
      this.memory = this.createMemory( mem, memType )
    }else{
      this.memory = mem
    }
    
    this.outputIdx = this.memory.alloc( numChannels, true )
    this.emit( 'memory init' )

    //console.log( 'cb memory:', mem )
    this.graph = ugen
    this.memo = {} 
    this.endBlock.clear()
    this.closures.clear()
    this.inputs.clear()
    this.params.clear()
    this.globals = { windows:{} }
    
    this.parameters.clear()
    
    this.functionBody = "  'use strict'\n"
    if( shouldInlineMemory===false ) {
      this.functionBody += this.mode === 'worklet' ? 
        "  var memory = this.memory\n\n" :
        "  var memory = gen.memory\n\n"
    }

    // call .gen() on the head of the graph we are generating the callback for
    //console.log( 'HEAD', ugen )
    for( let i = 0; i < numChannels; i++ ) {
      if( typeof ugen[i] === 'number' ) continue

      //let channel = isStereo ? ugen[i].gen() : ugen.gen(),
      let channel = numChannels > 1 ? this.getInput( ugen[i] ) : this.getInput( ugen ), 
          body = ''

      // if .gen() returns array, add ugen callback (graphOutput[1]) to our output functions body
      // and then return name of ugen. If .gen() only generates a number (for really simple graphs)
      // just return that number (graphOutput[0]).
      if( Array.isArray( channel ) ) {
        for( let j = 0; j < channel.length; j++ ) {
          body += channel[ j ] + '\n'
        }
      }else{
        body += channel
      }

      // split body to inject return keyword on last line
      body = body.split('\n')
     
      //if( debug ) console.log( 'functionBody length', body )
      
      // next line is to accommodate memo as graph head
      if( body[ body.length -1 ].trim().indexOf('let') > -1 ) { body.push( '\n' ) } 

      // get index of last line
      let lastidx = body.length - 1

      // insert return keyword
      body[ lastidx ] = '  memory[' + (this.outputIdx + i) + ']  = ' + body[ lastidx ] + '\n'

      this.functionBody += body.join('\n')
    }
    
    this.histories.forEach( value => {
      if( value !== null )
        value.gen()      
    })

    let returnStatement =  `  return ` 

    // if we are returning an array of values, add starting bracket
    if( numChannels !== 1 || this.alwaysReturnArray === true ) {
      returnStatement += '[ '
    }

    returnStatement += `memory[ ${this.outputIdx} ]`
    if( numChannels > 1 || this.alwaysReturnArray === true ) {
      for( let i = 1; i < numChannels; i++ ) {
        returnStatement += `, memory[ ${this.outputIdx + i} ]`
      }
      returnStatement += ' ] '
    }
     // memory[${this.outputIdx + 1}] ]` : `  return memory[${this.outputIdx}]`
    
    this.functionBody = this.functionBody.split('\n')

    if( this.endBlock.size ) { 
      this.functionBody = this.functionBody.concat( Array.from( this.endBlock ) )
      this.functionBody.push( returnStatement )
    }else{
      this.functionBody.push( returnStatement )
    }
    // reassemble function body
    this.functionBody = this.functionBody.join('\n')

    // we can only dynamically create a named function by dynamically creating another function
    // to construct the named function! sheesh...
    //
    if( shouldInlineMemory === true ) {
      this.parameters.add( 'memory' )
    }

    let paramString = ''
    if( this.mode === 'worklet' ) {
      for( let name of this.parameters.values() ) {
        paramString += name + ','
      }
      paramString = paramString.slice(0,-1)
    }

    const separator = this.parameters.size !== 0 && this.inputs.size > 0 ? ', ' : ''

    let inputString = ''
    if( this.mode === 'worklet' ) {
      for( let ugen of this.inputs.values() ) {
        inputString += ugen.name + ','
      }
      inputString = inputString.slice(0,-1)
    }

    let buildString = this.mode === 'worklet'
      ? `return function( ${inputString} ${separator} ${paramString} ){ \n${ this.functionBody }\n}`
      : `return function gen( ${ [...this.parameters].join(',') } ){ \n${ this.functionBody }\n}`
    
    if( this.debug || debug ) console.log( buildString ) 

    callback = new Function( buildString )()

    // assign properties to named function
    for( let dict of this.closures.values() ) {
      let name = Object.keys( dict )[0],
          value = dict[ name ]

      callback[ name ] = value
    }

    for( let dict of this.params.values() ) {
      let name = Object.keys( dict )[0],
          ugen = dict[ name ]
      
      Object.defineProperty( callback, name, {
        configurable: true,
        get() { return ugen.value },
        set(v){ ugen.value = v }
      })
      //callback[ name ] = value
    }

    callback.members = this.closures
    callback.data = this.data
    callback.params = this.params
    callback.inputs = this.inputs
    callback.parameters = this.parameters//.slice( 0 )
    callback.out = this.memory.heap.subarray( this.outputIdx, this.outputIdx + numChannels )
    callback.isStereo = isStereo

    //if( MemoryHelper.isPrototypeOf( this.memory ) ) 
    callback.memory = this.memory.heap

    this.histories.clear()

    return callback
  },
  
  /* getInputs
   *
   * Called by each individual ugen when their .gen() method is called to resolve their various inputs.
   * If an input is a number, return the number. If
   * it is an ugen, call .gen() on the ugen, memoize the result and return the result. If the
   * ugen has previously been memoized return the memoized value.
   *
   */
  getInputs( ugen ) {
    return ugen.inputs.map( gen.getInput ) 
  },

  getInput( input ) {
    let isObject = typeof input === 'object',
        processedInput

    if( isObject ) { // if input is a ugen... 
      //console.log( input.name, gen.memo[ input.name ] )
      if( gen.memo[ input.name ] ) { // if it has been memoized...
        processedInput = gen.memo[ input.name ]
      }else if( Array.isArray( input ) ) {
        gen.getInput( input[0] )
        gen.getInput( input[1] )
      }else{ // if not memoized generate code  
        if( typeof input.gen !== 'function' ) {
          console.log( 'no gen found:', input, input.gen )
          input = input.graph
        }
        let code = input.gen()
        //if( code.indexOf( 'Object' ) > -1 ) console.log( 'bad input:', input, code )
        
        if( Array.isArray( code ) ) {
          if( !gen.shouldLocalize ) {
            gen.functionBody += code[1]
          }else{
            gen.codeName = code[0]
            gen.localizedCode.push( code[1] )
          }
          //console.log( 'after GEN' , this.functionBody )
          processedInput = code[0]
        }else{
          processedInput = code
        }
      }
    }else{ // it input is a number
      processedInput = input
    }

    return processedInput
  },

  startLocalize() {
    this.localizedCode = []
    this.shouldLocalize = true
  },
  endLocalize() {
    this.shouldLocalize = false

    return [ this.codeName, this.localizedCode.slice(0) ]
  },

  free( graph ) {
    if( Array.isArray( graph ) ) { // stereo ugen
      for( let channel of graph ) {
        this.free( channel )
      }
    } else {
      if( typeof graph === 'object' ) {
        if( graph.memory !== undefined ) {
          for( let memoryKey in graph.memory ) {
            this.memory.free( graph.memory[ memoryKey ].idx )
          }
        }
        if( Array.isArray( graph.inputs ) ) {
          for( let ugen of graph.inputs ) {
            this.free( ugen )
          }
        }
      }
    }
  }
}

gen.__proto__ = new EE()

module.exports = gen

},{"events":125,"memory-helper":212}],34:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'gt',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `(( ${inputs[0]} > ${inputs[1]}) | 0 )`
    } else {
      out += inputs[0] > inputs[1] ? 1 : 0 
    }
    out += '\n\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (x,y) => {
  let gt = Object.create( proto )

  gt.inputs = [ x,y ]
  gt.name = gt.basename + gen.getUID()

  return gt
}

},{"./gen.js":33}],35:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  name:'gte',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `( ${inputs[0]} >= ${inputs[1]} | 0 )`
    } else {
      out += inputs[0] >= inputs[1] ? 1 : 0 
    }
    out += '\n\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (x,y) => {
  let gt = Object.create( proto )

  gt.inputs = [ x,y ]
  gt.name = 'gte' + gen.getUID()

  return gt
}

},{"./gen.js":33}],36:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'gtp',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out = `(${inputs[ 0 ]} * ( ( ${inputs[0]} > ${inputs[1]} ) | 0 ) )` 
    } else {
      out = inputs[0] * ( ( inputs[0] > inputs[1] ) | 0 )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let gtp = Object.create( proto )

  gtp.inputs = [ x,y ]

  return gtp
}

},{"./gen.js":33}],37:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

module.exports = ( in1=0 ) => {
  let ugen = {
    inputs: [ in1 ],
    memory: { value: { length:1, idx: null } },
    recorder: null,

    in( v ) {
      if( gen.histories.has( v ) ){
        let memoHistory = gen.histories.get( v )
        ugen.name = memoHistory.name
        return memoHistory
      }

      let obj = {
        gen() {
          let inputs = gen.getInputs( ugen )

          if( ugen.memory.value.idx === null ) {
            gen.requestMemory( ugen.memory )
            gen.memory.heap[ ugen.memory.value.idx ] = in1
          }

          let idx = ugen.memory.value.idx
          
          gen.addToEndBlock( 'memory[ ' + idx + ' ] = ' + inputs[ 0 ] )
          
          // return ugen that is being recorded instead of ssd.
          // this effectively makes a call to ssd.record() transparent to the graph.
          // recording is triggered by prior call to gen.addToEndBlock.
          gen.histories.set( v, obj )

          return inputs[ 0 ]
        },
        name: ugen.name + '_in'+gen.getUID(),
        memory: ugen.memory
      }

      this.inputs[ 0 ] = v
      
      ugen.recorder = obj

      return obj
    },
    
    out: {
            
      gen() {
        if( ugen.memory.value.idx === null ) {
          if( gen.histories.get( ugen.inputs[0] ) === undefined ) {
            gen.histories.set( ugen.inputs[0], ugen.recorder )
          }
          gen.requestMemory( ugen.memory )
          gen.memory.heap[ ugen.memory.value.idx ] = parseFloat( in1 )
        }
        let idx = ugen.memory.value.idx
         
        return 'memory[ ' + idx + ' ] '
      },
    },

    uid: gen.getUID(),
  }
  
  ugen.out.memory = ugen.memory 

  ugen.name = 'history' + ugen.uid
  ugen.out.name = ugen.name + '_out'
  ugen.in._name  = ugen.name = '_in'

  Object.defineProperty( ugen, 'value', {
    get() {
      if( this.memory.value.idx !== null ) {
        return gen.memory.heap[ this.memory.value.idx ]
      }
    },
    set( v ) {
      if( this.memory.value.idx !== null ) {
        gen.memory.heap[ this.memory.value.idx ] = v 
      }
    }
  })

  return ugen
}

},{"./gen.js":33}],38:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'ifelse',

  gen() {
    let conditionals = this.inputs[0],
        defaultValue = gen.getInput( conditionals[ conditionals.length - 1] ),
        out = `  var ${this.name}_out = ${defaultValue}\n` 

    //console.log( 'conditionals:', this.name, conditionals )

    //console.log( 'defaultValue:', defaultValue )

    for( let i = 0; i < conditionals.length - 2; i+= 2 ) {
      let isEndBlock = i === conditionals.length - 3,
          cond  = gen.getInput( conditionals[ i ] ),
          preblock = conditionals[ i+1 ],
          block, blockName, output

      //console.log( 'pb', preblock )

      if( typeof preblock === 'number' ){
        block = preblock
        blockName = null
      }else{
        if( gen.memo[ preblock.name ] === undefined ) {
          // used to place all code dependencies in appropriate blocks
          gen.startLocalize()

          gen.getInput( preblock )

          block = gen.endLocalize()
          blockName = block[0]
          block = block[ 1 ].join('')
          block = '  ' + block.replace( /\n/gi, '\n  ' )
        }else{
          block = ''
          blockName = gen.memo[ preblock.name ]
        }
      }

      output = blockName === null ? 
        `  ${this.name}_out = ${block}` :
        `${block}  ${this.name}_out = ${blockName}`
      
      if( i===0 ) out += ' '
      out += 
` if( ${cond} === 1 ) {
${output}
  }`

      if( !isEndBlock ) {
        out += ` else`
      }else{
        out += `\n`
      }
    }

    gen.memo[ this.name ] = `${this.name}_out`

    return [ `${this.name}_out`, out ]
  }
}

module.exports = ( ...args  ) => {
  let ugen = Object.create( proto ),
      conditions = Array.isArray( args[0] ) ? args[0] : args

  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ conditions ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],39:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  basename:'in',

  gen() {
    const isWorklet = gen.mode === 'worklet'

    if( isWorklet ) {
      gen.inputs.add( this )
    }else{
      gen.parameters.add( this.name )
    }

    gen.memo[ this.name ] = isWorklet === true ? this.name + '[i]' : this.name

    return gen.memo[ this.name ]
  } 
}

module.exports = ( name, inputNumber=0, channelNumber=0, defaultValue=0, min=0, max=1 ) => {
  let input = Object.create( proto )

  input.id   = gen.getUID()
  input.name = name !== undefined ? name : `${input.basename}${input.id}`
  Object.assign( input, { defaultValue, min, max, inputNumber, channelNumber })

  input[0] = {
    gen() {
      if( ! gen.parameters.has( input.name ) ) gen.parameters.add( input.name )
      return input.name + '[0]'
    }
  }
  input[1] = {
    gen() {
      if( ! gen.parameters.has( input.name ) ) gen.parameters.add( input.name )
      return input.name + '[1]'
    }
  }


  return input
}

},{"./gen.js":33}],40:[function(require,module,exports){
'use strict'

const library = {
  export( destination ) {
    if( destination === window ) {
      destination.ssd = library.history    // history is window object property, so use ssd as alias
      destination.input = library.in       // in is a keyword in javascript
      destination.ternary = library.switch // switch is a keyword in javascript

      delete library.history
      delete library.in
      delete library.switch
    }

    Object.assign( destination, library )

    Object.defineProperty( library, 'samplerate', {
      get() { return library.gen.samplerate },
      set(v) {}
    })

    library.in = destination.input
    library.history = destination.ssd
    library.switch = destination.ternary

    destination.clip = library.clamp
  },

  gen:      require( './gen.js' ),
  
  abs:      require( './abs.js' ),
  round:    require( './round.js' ),
  param:    require( './param.js' ),
  add:      require( './add.js' ),
  sub:      require( './sub.js' ),
  mul:      require( './mul.js' ),
  div:      require( './div.js' ),
  accum:    require( './accum.js' ),
  counter:  require( './counter.js' ),
  sin:      require( './sin.js' ),
  cos:      require( './cos.js' ),
  tan:      require( './tan.js' ),
  tanh:     require( './tanh.js' ),
  asin:     require( './asin.js' ),
  acos:     require( './acos.js' ),
  atan:     require( './atan.js' ),  
  phasor:   require( './phasor.js' ),
  phasorN:  require( './phasorN.js' ),
  data:     require( './data.js' ),
  peek:     require( './peek.js' ),
  peekDyn:  require( './peekDyn.js' ),
  cycle:    require( './cycle.js' ),
  cycleN:   require( './cycleN.js' ),
  history:  require( './history.js' ),
  delta:    require( './delta.js' ),
  floor:    require( './floor.js' ),
  ceil:     require( './ceil.js' ),
  min:      require( './min.js' ),
  max:      require( './max.js' ),
  sign:     require( './sign.js' ),
  dcblock:  require( './dcblock.js' ),
  memo:     require( './memo.js' ),
  rate:     require( './rate.js' ),
  wrap:     require( './wrap.js' ),
  mix:      require( './mix.js' ),
  clamp:    require( './clamp.js' ),
  poke:     require( './poke.js' ),
  delay:    require( './delay.js' ),
  fold:     require( './fold.js' ),
  mod :     require( './mod.js' ),
  sah :     require( './sah.js' ),
  noise:    require( './noise.js' ),
  not:      require( './not.js' ),
  gt:       require( './gt.js' ),
  gte:      require( './gte.js' ),
  lt:       require( './lt.js' ), 
  lte:      require( './lte.js' ), 
  bool:     require( './bool.js' ),
  gate:     require( './gate.js' ),
  train:    require( './train.js' ),
  slide:    require( './slide.js' ),
  in:       require( './in.js' ),
  t60:      require( './t60.js'),
  mtof:     require( './mtof.js'),
  ltp:      require( './ltp.js'),        // TODO: test
  gtp:      require( './gtp.js'),        // TODO: test
  switch:   require( './switch.js' ),
  mstosamps:require( './mstosamps.js' ), // TODO: needs test,
  selector: require( './selector.js' ),
  utilities:require( './utilities.js' ),
  pow:      require( './pow.js' ),
  attack:   require( './attack.js' ),
  decay:    require( './decay.js' ),
  windows:  require( './windows.js' ),
  env:      require( './env.js' ),
  ad:       require( './ad.js'  ),
  adsr:     require( './adsr.js' ),
  ifelse:   require( './ifelseif.js' ),
  bang:     require( './bang.js' ),
  and:      require( './and.js' ),
  or:       require( './or.js' ),
  pan:      require( './pan.js' ),
  eq:       require( './eq.js' ),
  neq:      require( './neq.js' ),
  exp:      require( './exp.js' ),
  process:  require( './process.js' ),
  seq:      require( './seq.js' )
}

library.gen.lib = library

module.exports = library

},{"./abs.js":1,"./accum.js":2,"./acos.js":3,"./ad.js":4,"./add.js":5,"./adsr.js":6,"./and.js":7,"./asin.js":8,"./atan.js":9,"./attack.js":10,"./bang.js":11,"./bool.js":12,"./ceil.js":13,"./clamp.js":14,"./cos.js":15,"./counter.js":16,"./cycle.js":17,"./cycleN.js":18,"./data.js":19,"./dcblock.js":20,"./decay.js":21,"./delay.js":22,"./delta.js":23,"./div.js":24,"./env.js":25,"./eq.js":26,"./exp.js":27,"./floor.js":30,"./fold.js":31,"./gate.js":32,"./gen.js":33,"./gt.js":34,"./gte.js":35,"./gtp.js":36,"./history.js":37,"./ifelseif.js":38,"./in.js":39,"./lt.js":41,"./lte.js":42,"./ltp.js":43,"./max.js":44,"./memo.js":45,"./min.js":46,"./mix.js":47,"./mod.js":48,"./mstosamps.js":49,"./mtof.js":50,"./mul.js":51,"./neq.js":52,"./noise.js":53,"./not.js":54,"./or.js":55,"./pan.js":56,"./param.js":57,"./peek.js":58,"./peekDyn.js":59,"./phasor.js":60,"./phasorN.js":61,"./poke.js":62,"./pow.js":63,"./process.js":64,"./rate.js":65,"./round.js":66,"./sah.js":67,"./selector.js":68,"./seq.js":69,"./sign.js":70,"./sin.js":71,"./slide.js":72,"./sub.js":73,"./switch.js":74,"./t60.js":75,"./tan.js":76,"./tanh.js":77,"./train.js":78,"./utilities.js":79,"./windows.js":80,"./wrap.js":81}],41:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'lt',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `(( ${inputs[0]} < ${inputs[1]}) | 0  )`
    } else {
      out += inputs[0] < inputs[1] ? 1 : 0 
    }
    out += '\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (x,y) => {
  let lt = Object.create( proto )

  lt.inputs = [ x,y ]
  lt.name = lt.basename + gen.getUID()

  return lt
}

},{"./gen.js":33}],42:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'lte',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `( ${inputs[0]} <= ${inputs[1]} | 0  )`
    } else {
      out += inputs[0] <= inputs[1] ? 1 : 0 
    }
    out += '\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (x,y) => {
  let lt = Object.create( proto )

  lt.inputs = [ x,y ]
  lt.name = 'lte' + gen.getUID()

  return lt
}

},{"./gen.js":33}],43:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'ltp',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out = `(${inputs[ 0 ]} * (( ${inputs[0]} < ${inputs[1]} ) | 0 ) )` 
    } else {
      out = inputs[0] * (( inputs[0] < inputs[1] ) | 0 )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let ltp = Object.create( proto )

  ltp.inputs = [ x,y ]

  return ltp
}

},{"./gen.js":33}],44:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'max',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) || isNaN( inputs[1] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.max' : Math.max })

      out = `${ref}max( ${inputs[0]}, ${inputs[1]} )`

    } else {
      out = Math.max( parseFloat( inputs[0] ), parseFloat( inputs[1] ) )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let max = Object.create( proto )

  max.inputs = [ x,y ]

  return max
}

},{"./gen.js":33}],45:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  basename:'memo',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    out = `  var ${this.name} = ${inputs[0]}\n`

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  } 
}

module.exports = (in1,memoName) => {
  let memo = Object.create( proto )
  
  memo.inputs = [ in1 ]
  memo.id   = gen.getUID()
  memo.name = memoName !== undefined ? memoName + '_' + gen.getUID() : `${memo.basename}${memo.id}`

  return memo
}

},{"./gen.js":33}],46:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'min',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) || isNaN( inputs[1] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.min' : Math.min })

      out = `${ref}min( ${inputs[0]}, ${inputs[1]} )`

    } else {
      out = Math.min( parseFloat( inputs[0] ), parseFloat( inputs[1] ) )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let min = Object.create( proto )

  min.inputs = [ x,y ]

  return min
}

},{"./gen.js":33}],47:[function(require,module,exports){
'use strict'

let gen = require('./gen.js'),
    add = require('./add.js'),
    mul = require('./mul.js'),
    sub = require('./sub.js'),
    memo= require('./memo.js')

module.exports = ( in1, in2, t=.5 ) => {
  let ugen = memo( add( mul(in1, sub(1,t ) ), mul( in2, t ) ) )
  ugen.name = 'mix' + gen.getUID()

  return ugen
}

},{"./add.js":5,"./gen.js":33,"./memo.js":45,"./mul.js":51,"./sub.js":73}],48:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

module.exports = (...args) => {
  let mod = {
    id:     gen.getUID(),
    inputs: args,

    gen() {
      let inputs = gen.getInputs( this ),
          out='(',
          diff = 0, 
          numCount = 0,
          lastNumber = inputs[ 0 ],
          lastNumberIsUgen = isNaN( lastNumber ), 
          modAtEnd = false

      inputs.forEach( (v,i) => {
        if( i === 0 ) return

        let isNumberUgen = isNaN( v ),
            isFinalIdx   = i === inputs.length - 1

        if( !lastNumberIsUgen && !isNumberUgen ) {
          lastNumber = lastNumber % v
          out += lastNumber
        }else{
          out += `${lastNumber} % ${v}`
        }

        if( !isFinalIdx ) out += ' % ' 
      })

      out += ')'

      return out
    }
  }
  
  return mod
}

},{"./gen.js":33}],49:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'mstosamps',

  gen() {
    let out,
        inputs = gen.getInputs( this ),
        returnValue

    if( isNaN( inputs[0] ) ) {
      out = `  var ${this.name } = ${gen.samplerate} / 1000 * ${inputs[0]} \n\n`
     
      gen.memo[ this.name ] = out
      
      returnValue = [ this.name, out ]
    } else {
      out = gen.samplerate / 1000 * this.inputs[0]

      returnValue = out
    }    

    return returnValue
  }
}

module.exports = x => {
  let mstosamps = Object.create( proto )

  mstosamps.inputs = [ x ]
  mstosamps.name = proto.basename + gen.getUID()

  return mstosamps
}

},{"./gen.js":33}],50:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'mtof',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.exp })

      out = `( ${this.tuning} * gen.exp( .057762265 * (${inputs[0]} - 69) ) )`

    } else {
      out = this.tuning * Math.exp( .057762265 * ( inputs[0] - 69) )
    }
    
    return out
  }
}

module.exports = ( x, props ) => {
  let ugen = Object.create( proto ),
      defaults = { tuning:440 }
  
  if( props !== undefined ) Object.assign( props.defaults )

  Object.assign( ugen, defaults )
  ugen.inputs = [ x ]
  

  return ugen
}

},{"./gen.js":33}],51:[function(require,module,exports){
'use strict'

const gen = require('./gen.js')

const proto = {
  basename: 'mul',

  gen() {
    let inputs = gen.getInputs( this ),
        out = `  var ${this.name} = `,
        sum = 1, numCount = 0, mulAtEnd = false, alreadyFullSummed = true

    inputs.forEach( (v,i) => {
      if( isNaN( v ) ) {
        out += v
        if( i < inputs.length -1 ) {
          mulAtEnd = true
          out += ' * '
        }
        alreadyFullSummed = false
      }else{
        if( i === 0 ) {
          sum = v
        }else{
          sum *= parseFloat( v )
        }
        numCount++
      }
    })

    if( numCount > 0 ) {
      out += mulAtEnd || alreadyFullSummed ? sum : ' * ' + sum
    }

    out += '\n'

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = ( ...args ) => {
  const mul = Object.create( proto )
  
  Object.assign( mul, {
      id:     gen.getUID(),
      inputs: args,
  })
  
  mul.name = mul.basename + mul.id

  return mul
}

},{"./gen.js":33}],52:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'neq',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = /*this.inputs[0] !== this.inputs[1] ? 1 :*/ `  var ${this.name} = (${inputs[0]} !== ${inputs[1]}) | 0\n\n`

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],53:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'noise',

  gen() {
    let out

    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    gen.closures.add({ 'noise' : isWorklet ? 'Math.random' : Math.random })

    out = `  var ${this.name} = ${ref}noise()\n`
    
    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = x => {
  let noise = Object.create( proto )
  noise.name = proto.name + gen.getUID()

  return noise
}

},{"./gen.js":33}],54:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'not',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( this.inputs[0] ) ) {
      out = `( ${inputs[0]} === 0 ? 1 : 0 )`
    } else {
      out = !inputs[0] === 0 ? 1 : 0
    }
    
    return out
  }
}

module.exports = x => {
  let not = Object.create( proto )

  not.inputs = [ x ]

  return not
}

},{"./gen.js":33}],55:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'or',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = `  var ${this.name} = (${inputs[0]} !== 0 || ${inputs[1]} !== 0) | 0\n\n`

    gen.memo[ this.name ] = `${this.name}`

    return [ `${this.name}`, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],56:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' ),
    data = require( './data.js' ),
    peek = require( './peek.js' ),
    mul  = require( './mul.js' )

let proto = {
  basename:'pan', 
  initTable() {    
    let bufferL = new Float32Array( 1024 ),
        bufferR = new Float32Array( 1024 )

    const angToRad = Math.PI / 180
    for( let i = 0; i < 1024; i++ ) { 
      let pan = i * ( 90 / 1024 )
      bufferL[i] = Math.cos( pan * angToRad ) 
      bufferR[i] = Math.sin( pan * angToRad )
    }

    gen.globals.panL = data( bufferL, 1, { immutable:true })
    gen.globals.panR = data( bufferR, 1, { immutable:true })
  }

}

module.exports = ( leftInput, rightInput, pan =.5, properties ) => {
  if( gen.globals.panL === undefined ) proto.initTable()

  let ugen = Object.create( proto )

  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ leftInput, rightInput ],
    left:    mul( leftInput, peek( gen.globals.panL, pan, { boundmode:'clamp' }) ),
    right:   mul( rightInput, peek( gen.globals.panR, pan, { boundmode:'clamp' }) )
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./data.js":19,"./gen.js":33,"./mul.js":51,"./peek.js":58}],57:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  basename: 'param',

  gen() {
    gen.requestMemory( this.memory )
    
    gen.params.add( this )

    const isWorklet = gen.mode === 'worklet'

    if( isWorklet ) gen.parameters.add( this.name )

    this.value = this.initialValue

    gen.memo[ this.name ] = isWorklet ? this.name : `memory[${this.memory.value.idx}]`

    return gen.memo[ this.name ]
  } 
}

module.exports = ( propName=0, value=0, min=0, max=1 ) => {
  let ugen = Object.create( proto )
  
  if( typeof propName !== 'string' ) {
    ugen.name = ugen.basename + gen.getUID()
    ugen.initialValue = propName
    ugen.min = value
    ugen.max = min
  }else{
    ugen.name = propName
    ugen.min = min
    ugen.max = max
    ugen.initialValue = value
  }

  ugen.defaultValue = ugen.initialValue

  // for storing worklet nodes once they're instantiated
  ugen.waapi = null

  ugen.isWorklet = gen.mode === 'worklet'

  Object.defineProperty( ugen, 'value', {
    get() {
      if( this.memory.value.idx !== null ) {
        return gen.memory.heap[ this.memory.value.idx ]
      }else{
        return this.initialValue
      }
    },
    set( v ) {
      if( this.memory.value.idx !== null ) {
        if( this.isWorklet && this.waapi !== null ) {
          this.waapi[ propName ].value = v
        }else{
          gen.memory.heap[ this.memory.value.idx ] = v
        } 
      }
    }
  })

  ugen.memory = {
    value: { length:1, idx:null }
  }

  return ugen
}

},{"./gen.js":33}],58:[function(require,module,exports){

const gen  = require('./gen.js'),
      dataUgen = require('./data.js')

let proto = {
  basename:'peek',

  gen() {
    let genName = 'gen.' + this.name,
        inputs = gen.getInputs( this ),
        out, functionBody, next, lengthIsLog2, idx
    
    idx = inputs[1]
    lengthIsLog2 = (Math.log2( this.data.buffer.length ) | 0)  === Math.log2( this.data.buffer.length )

    if( this.mode !== 'simple' ) {

    functionBody = `  var ${this.name}_dataIdx  = ${idx}, 
      ${this.name}_phase = ${this.mode === 'samples' ? inputs[0] : inputs[0] + ' * ' + (this.data.buffer.length) }, 
      ${this.name}_index = ${this.name}_phase | 0,\n`

    if( this.boundmode === 'wrap' ) {
      next = lengthIsLog2 ?
      `( ${this.name}_index + 1 ) & (${this.data.buffer.length} - 1)` :
      `${this.name}_index + 1 >= ${this.data.buffer.length} ? ${this.name}_index + 1 - ${this.data.buffer.length} : ${this.name}_index + 1`
    }else if( this.boundmode === 'clamp' ) {
      next = 
        `${this.name}_index + 1 >= ${this.data.buffer.length - 1} ? ${this.data.buffer.length - 1} : ${this.name}_index + 1`
    } else if( this.boundmode === 'fold' || this.boundmode === 'mirror' ) {
      next = 
        `${this.name}_index + 1 >= ${this.data.buffer.length - 1} ? ${this.name}_index - ${this.data.buffer.length - 1} : ${this.name}_index + 1`
    }else{
       next = 
      `${this.name}_index + 1`     
    }

    if( this.interp === 'linear' ) {      
    functionBody += `      ${this.name}_frac  = ${this.name}_phase - ${this.name}_index,
      ${this.name}_base  = memory[ ${this.name}_dataIdx +  ${this.name}_index ],
      ${this.name}_next  = ${next},`
      
      if( this.boundmode === 'ignore' ) {
        functionBody += `
      ${this.name}_out   = ${this.name}_index >= ${this.data.buffer.length - 1} || ${this.name}_index < 0 ? 0 : ${this.name}_base + ${this.name}_frac * ( memory[ ${this.name}_dataIdx + ${this.name}_next ] - ${this.name}_base )\n\n`
      }else{
        functionBody += `
      ${this.name}_out   = ${this.name}_base + ${this.name}_frac * ( memory[ ${this.name}_dataIdx + ${this.name}_next ] - ${this.name}_base )\n\n`
      }
    }else{
      functionBody += `      ${this.name}_out = memory[ ${this.name}_dataIdx + ${this.name}_index ]\n\n`
    }

    } else { // mode is simple
      functionBody = `memory[ ${idx} + ${ inputs[0] } ]`
      
      return functionBody
    }

    gen.memo[ this.name ] = this.name + '_out'

    return [ this.name+'_out', functionBody ]
  },

  defaults : { channels:1, mode:'phase', interp:'linear', boundmode:'wrap' }
}

module.exports = ( input_data, index=0, properties ) => {
  let ugen = Object.create( proto )

  //console.log( dataUgen, gen.data )

  // XXX why is dataUgen not the actual function? some type of browserify nonsense...
  const finalData = typeof input_data.basename === 'undefined' ? gen.lib.data( input_data ) : input_data

  Object.assign( ugen, 
    { 
      'data':     finalData,
      dataName:   finalData.name,
      uid:        gen.getUID(),
      inputs:     [ index, finalData ],
    },
    proto.defaults,
    properties 
  )
  
  ugen.name = ugen.basename + ugen.uid

  return ugen
}


},{"./data.js":19,"./gen.js":33}],59:[function(require,module,exports){
const gen  = require('./gen.js'),
      dataUgen = require('./data.js')

const proto = {
  basename:'peek',

  gen() {
    let genName = 'gen.' + this.name,
        inputs = gen.getInputs( this ),
        out, functionBody, next, lengthIsLog2, indexer, dataStart, length
    
    // data object codegens to its starting index
    dataStart = inputs[0]
    length    = inputs[1]
    indexer   = inputs[2]

    //lengthIsLog2 = (Math.log2( length ) | 0)  === Math.log2( length )

    if( this.mode !== 'simple' ) {

      functionBody = `  var ${this.name}_dataIdx  = ${dataStart}, 
        ${this.name}_phase = ${this.mode === 'samples' ? indexer : indexer + ' * ' + (length) }, 
        ${this.name}_index = ${this.name}_phase | 0,\n`

      if( this.boundmode === 'wrap' ) {
        next =`${this.name}_index + 1 >= ${length} ? ${this.name}_index + 1 - ${length} : ${this.name}_index + 1`
      }else if( this.boundmode === 'clamp' ) {
        next = 
          `${this.name}_index + 1 >= ${length} -1 ? ${length} - 1 : ${this.name}_index + 1`
      } else if( this.boundmode === 'fold' || this.boundmode === 'mirror' ) {
        next = 
          `${this.name}_index + 1 >= ${length} - 1 ? ${this.name}_index - ${length} - 1 : ${this.name}_index + 1`
      }else{
         next = 
        `${this.name}_index + 1`     
      }

      if( this.interp === 'linear' ) {      
        functionBody += `      ${this.name}_frac  = ${this.name}_phase - ${this.name}_index,
        ${this.name}_base  = memory[ ${this.name}_dataIdx +  ${this.name}_index ],
        ${this.name}_next  = ${next},`
        
        if( this.boundmode === 'ignore' ) {
          functionBody += `
        ${this.name}_out   = ${this.name}_index >= ${length} - 1 || ${this.name}_index < 0 ? 0 : ${this.name}_base + ${this.name}_frac * ( memory[ ${this.name}_dataIdx + ${this.name}_next ] - ${this.name}_base )\n\n`
        }else{
          functionBody += `
        ${this.name}_out   = ${this.name}_base + ${this.name}_frac * ( memory[ ${this.name}_dataIdx + ${this.name}_next ] - ${this.name}_base )\n\n`
        }
      }else{
        functionBody += `      ${this.name}_out = memory[ ${this.name}_dataIdx + ${this.name}_index ]\n\n`
      }

    } else { // mode is simple
      functionBody = `memory[ ${dataStart} + ${ indexer } ]`
      
      return functionBody
    }

    gen.memo[ this.name ] = this.name + '_out'

    return [ this.name+'_out', functionBody ]
  },

  defaults : { channels:1, mode:'phase', interp:'linear', boundmode:'wrap' }
}

module.exports = ( input_data, length, index=0, properties ) => {
  const ugen = Object.create( proto )

  // XXX why is dataUgen not the actual function? some type of browserify nonsense...
  const finalData = typeof input_data.basename === 'undefined' ? gen.lib.data( input_data ) : input_data

  Object.assign( ugen, 
    { 
      'data':     finalData,
      dataName:   finalData.name,
      uid:        gen.getUID(),
      inputs:     [ input_data, length, index, finalData ],
    },
    proto.defaults,
    properties 
  )
  
  ugen.name = ugen.basename + ugen.uid

  return ugen
}


},{"./data.js":19,"./gen.js":33}],60:[function(require,module,exports){
'use strict'

const gen   = require( './gen.js' ),
      accum = require( './accum.js' ),
      mul   = require( './mul.js' ),
      proto = { basename:'phasor' },
      div   = require( './div.js' )

const defaults = { min: -1, max: 1 }

module.exports = ( frequency = 1, reset = 0, _props ) => {
  const props = Object.assign( {}, defaults, _props )

  const range = props.max - props.min

  const ugen = typeof frequency === 'number' 
    ? accum( (frequency * range) / gen.samplerate, reset, props ) 
    : accum( 
        div( 
          mul( frequency, range ),
          gen.samplerate
        ), 
        reset, props 
    )

  ugen.name = proto.basename + gen.getUID()

  return ugen
}

},{"./accum.js":2,"./div.js":24,"./gen.js":33,"./mul.js":51}],61:[function(require,module,exports){
'use strict'

const gen   = require( './gen.js' ),
      accum = require( './accum.js' ),
      mul   = require( './mul.js' ),
      proto = { basename:'phasorN' },
      div   = require( './div.js' )

const defaults = { min: 0, max: 1 }

module.exports = ( frequency = 1, reset = 0, _props ) => {
  const props = Object.assign( {}, defaults, _props )

  const range = props.max - props.min

  const ugen = typeof frequency === 'number' 
    ? accum( (frequency * range) / gen.samplerate, reset, props ) 
    : accum( 
        div( 
          mul( frequency, range ),
          gen.samplerate
        ), 
        reset, props 
    )

  ugen.name = proto.basename + gen.getUID()

  return ugen
}

},{"./accum.js":2,"./div.js":24,"./gen.js":33,"./mul.js":51}],62:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
    mul  = require('./mul.js'),
    wrap = require('./wrap.js')

let proto = {
  basename:'poke',

  gen() {
    let dataName = 'memory',
        inputs = gen.getInputs( this ),
        idx, out, wrapped
    
    idx = this.data.gen()

    //gen.requestMemory( this.memory )
    //wrapped = wrap( this.inputs[1], 0, this.dataLength ).gen()
    //idx = wrapped[0]
    //gen.functionBody += wrapped[1]
    let outputStr = this.inputs[1] === 0 ?
      `  ${dataName}[ ${idx} ] = ${inputs[0]}\n` :
      `  ${dataName}[ ${idx} + ${inputs[1]} ] = ${inputs[0]}\n`

    if( this.inline === undefined ) {
      gen.functionBody += outputStr
    }else{
      return [ this.inline, outputStr ]
    }
  }
}
module.exports = ( data, value, index, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { channels:1 } 

  if( properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, { 
    data,
    dataName:   data.name,
    dataLength: data.buffer.length,
    uid:        gen.getUID(),
    inputs:     [ value, index ],
  },
  defaults )


  ugen.name = ugen.basename + ugen.uid
  
  gen.histories.set( ugen.name, ugen )

  return ugen
}

},{"./gen.js":33,"./mul.js":51,"./wrap.js":81}],63:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'pow',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) || isNaN( inputs[1] ) ) {
      gen.closures.add({ 'pow': isWorklet ? 'Math.pow' : Math.pow })

      out = `${ref}pow( ${inputs[0]}, ${inputs[1]} )` 

    } else {
      if( typeof inputs[0] === 'string' && inputs[0][0] === '(' ) {
        inputs[0] = inputs[0].slice(1,-1)
      }
      if( typeof inputs[1] === 'string' && inputs[1][0] === '(' ) {
        inputs[1] = inputs[1].slice(1,-1)
      }

      out = Math.pow( parseFloat( inputs[0] ), parseFloat( inputs[1]) )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let pow = Object.create( proto )

  pow.inputs = [ x,y ]
  pow.id = gen.getUID()
  pow.name = `${pow.basename}{pow.id}`

  return pow
}

},{"./gen.js":33}],64:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')
const proto = {
  basename:'process',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    gen.closures.add({ [''+this.funcname] : this.func })

    out = `  var ${this.name} = gen['${this.funcname}'](`

    inputs.forEach( (v,i,arr ) => {
      out += arr[ i ]
      if( i < arr.length - 1 ) out += ','
    })

    out += ')\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (...args) => {
  const process = {}// Object.create( proto )
  const id = gen.getUID()
  process.name = 'process' + id 

  process.func = new Function( ...args )

  //gen.globals[ process.name ] = process.func

  process.call = function( ...args  ) {
    const output = Object.create( proto )
    output.funcname = process.name
    output.func = process.func
    output.name = 'process_out_' + id
    output.process = process

    output.inputs = args

    return output
  }

  return process 
}

},{"./gen.js":33}],65:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' ),
    add     = require( './add.js' ),
    mul     = require( './mul.js' ),
    memo    = require( './memo.js' ),
    delta   = require( './delta.js' ),
    wrap    = require( './wrap.js' )

let proto = {
  basename:'rate',

  gen() {
    let inputs = gen.getInputs( this ),
        phase  = history(),
        inMinus1 = history(),
        genName = 'gen.' + this.name,
        filter, sum, out

    gen.closures.add({ [ this.name ]: this }) 

    out = 
` var ${this.name}_diff = ${inputs[0]} - ${genName}.lastSample
  if( ${this.name}_diff < -.5 ) ${this.name}_diff += 1
  ${genName}.phase += ${this.name}_diff * ${inputs[1]}
  if( ${genName}.phase > 1 ) ${genName}.phase -= 1
  ${genName}.lastSample = ${inputs[0]}
`
    out = ' ' + out

    return [ genName + '.phase', out ]
  }
}

module.exports = ( in1, rate ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    phase:      0,
    lastSample: 0,
    uid:        gen.getUID(),
    inputs:     [ in1, rate ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./add.js":5,"./delta.js":23,"./gen.js":33,"./history.js":37,"./memo.js":45,"./mul.js":51,"./sub.js":73,"./wrap.js":81}],66:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'round',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.round' : Math.round })

      out = `${ref}round( ${inputs[0]} )`

    } else {
      out = Math.round( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let round = Object.create( proto )

  round.inputs = [ x ]

  return round
}

},{"./gen.js":33}],67:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' )

let proto = {
  basename:'sah',

  gen() {
    let inputs = gen.getInputs( this ), out

    //gen.data[ this.name ] = 0
    //gen.data[ this.name + '_control' ] = 0

    gen.requestMemory( this.memory )


    out = 
` var ${this.name}_control = memory[${this.memory.control.idx}],
      ${this.name}_trigger = ${inputs[1]} > ${inputs[2]} ? 1 : 0

  if( ${this.name}_trigger !== ${this.name}_control  ) {
    if( ${this.name}_trigger === 1 ) 
      memory[${this.memory.value.idx}] = ${inputs[0]}
    
    memory[${this.memory.control.idx}] = ${this.name}_trigger
  }
`
    
    gen.memo[ this.name ] = `memory[${this.memory.value.idx}]`//`gen.data.${this.name}`

    return [ `memory[${this.memory.value.idx}]`, ' ' +out ]
  }
}

module.exports = ( in1, control, threshold=0, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { init:0 }

  if( properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, { 
    lastSample: 0,
    uid:        gen.getUID(),
    inputs:     [ in1, control,threshold ],
    memory: {
      control: { idx:null, length:1 },
      value:   { idx:null, length:1 },
    }
  },
  defaults )
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],68:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'selector',

  gen() {
    let inputs = gen.getInputs( this ), out, returnValue = 0
    
    switch( inputs.length ) {
      case 2 :
        returnValue = inputs[1]
        break;
      case 3 :
        out = `  var ${this.name}_out = ${inputs[0]} === 1 ? ${inputs[1]} : ${inputs[2]}\n\n`;
        returnValue = [ this.name + '_out', out ]
        break;  
      default:
        out = 
` var ${this.name}_out = 0
  switch( ${inputs[0]} + 1 ) {\n`

        for( let i = 1; i < inputs.length; i++ ){
          out +=`    case ${i}: ${this.name}_out = ${inputs[i]}; break;\n` 
        }

        out += '  }\n\n'
        
        returnValue = [ this.name + '_out', ' ' + out ]
    }

    gen.memo[ this.name ] = this.name + '_out'

    return returnValue
  },
}

module.exports = ( ...inputs ) => {
  let ugen = Object.create( proto )
  
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],69:[function(require,module,exports){
'use strict'

let gen   = require( './gen.js' ),
    accum = require( './accum.js' ),
    counter= require( './counter.js' ),
    peek  = require( './peek.js' ),
    ssd   = require( './history.js' ),
    data  = require( './data.js' ),
    proto = { basename:'seq' }

module.exports = ( durations = 11025, values = [0,1], phaseIncrement = 1) => {
  let clock
  
  if( Array.isArray( durations ) ) {
    // we want a counter that is using our current
    // rate value, but we want the rate value to be derived from
    // the counter. must insert a single-sample dealy to avoid
    // infinite loop.
    const clock2 = counter( 0, 0, durations.length )
    const __durations = peek( data( durations ), clock2, { mode:'simple' }) 
    clock = counter( phaseIncrement, 0, __durations )
    
    // add one sample delay to avoid codegen loop
    const s = ssd()
    s.in( clock.wrap )
    clock2.inputs[0] = s.out
  }else{
    // if the rate argument is a single value we don't need to
    // do anything tricky.
    clock = counter( phaseIncrement, 0, durations )
  }
  
  const stepper = accum( clock.wrap, 0, { min:0, max:values.length })
   
  const ugen = peek( data( values ), stepper, { mode:'simple' })

  ugen.name = proto.basename + gen.getUID()
  ugen.trigger = clock.wrap

  return ugen
}

},{"./accum.js":2,"./counter.js":16,"./data.js":19,"./gen.js":33,"./history.js":37,"./peek.js":58}],70:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'sign',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: isWorklet ? 'Math.sign' : Math.sign })

      out = `${ref}sign( ${inputs[0]} )`

    } else {
      out = Math.sign( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let sign = Object.create( proto )

  sign.inputs = [ x ]

  return sign
}

},{"./gen.js":33}],71:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'sin',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'sin': isWorklet ? 'Math.sin' : Math.sin })

      out = `${ref}sin( ${inputs[0]} )` 

    } else {
      out = Math.sin( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let sin = Object.create( proto )

  sin.inputs = [ x ]
  sin.id = gen.getUID()
  sin.name = `${sin.basename}{sin.id}`

  return sin
}

},{"./gen.js":33}],72:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' ),
    add     = require( './add.js' ),
    mul     = require( './mul.js' ),
    memo    = require( './memo.js' ),
    gt      = require( './gt.js' ),
    div     = require( './div.js' ),
    _switch = require( './switch.js' )

module.exports = ( in1, slideUp = 1, slideDown = 1 ) => {
  let y1 = history(0),
      filter, slideAmount

  //y (n) = y (n-1) + ((x (n) - y (n-1))/slide) 
  slideAmount = _switch( gt(in1,y1.out), slideUp, slideDown )

  filter = memo( add( y1.out, div( sub( in1, y1.out ), slideAmount ) ) )

  y1.in( filter )

  return filter
}

},{"./add.js":5,"./div.js":24,"./gen.js":33,"./gt.js":34,"./history.js":37,"./memo.js":45,"./mul.js":51,"./sub.js":73,"./switch.js":74}],73:[function(require,module,exports){
'use strict'

const gen = require('./gen.js')

const proto = {
  basename:'sub',
  gen() {
    let inputs = gen.getInputs( this ),
        out=0,
        diff = 0,
        needsParens = false, 
        numCount = 0,
        lastNumber = inputs[ 0 ],
        lastNumberIsUgen = isNaN( lastNumber ), 
        subAtEnd = false,
        hasUgens = false,
        returnValue = 0

    this.inputs.forEach( value => { if( isNaN( value ) ) hasUgens = true })

    out = '  var ' + this.name + ' = '

    inputs.forEach( (v,i) => {
      if( i === 0 ) return

      let isNumberUgen = isNaN( v ),
          isFinalIdx   = i === inputs.length - 1

      if( !lastNumberIsUgen && !isNumberUgen ) {
        lastNumber = lastNumber - v
        out += lastNumber
        return
      }else{
        needsParens = true
        out += `${lastNumber} - ${v}`
      }

      if( !isFinalIdx ) out += ' - ' 
    })

    out += '\n'

    returnValue = [ this.name, out ]

    gen.memo[ this.name ] = this.name

    return returnValue
  }

}

module.exports = ( ...args ) => {
  let sub = Object.create( proto )

  Object.assign( sub, {
    id:     gen.getUID(),
    inputs: args
  })
       
  sub.name = 'sub' + sub.id

  return sub
}

},{"./gen.js":33}],74:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'switch',

  gen() {
    let inputs = gen.getInputs( this ), out

    if( inputs[1] === inputs[2] ) return inputs[1] // if both potential outputs are the same just return one of them
    
    out = `  var ${this.name}_out = ${inputs[0]} === 1 ? ${inputs[1]} : ${inputs[2]}\n`

    gen.memo[ this.name ] = `${this.name}_out`

    return [ `${this.name}_out`, out ]
  },

}

module.exports = ( control, in1 = 1, in2 = 0 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ control, in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":33}],75:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'t60',

  gen() {
    let out,
        inputs = gen.getInputs( this ),
        returnValue

    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ 'exp' ]: isWorklet ? 'Math.exp' : Math.exp })

      out = `  var ${this.name} = ${ref}exp( -6.907755278921 / ${inputs[0]} )\n\n`
     
      gen.memo[ this.name ] = out
      
      returnValue = [ this.name, out ]
    } else {
      out = Math.exp( -6.907755278921 / inputs[0] )

      returnValue = out
    }    

    return returnValue
  }
}

module.exports = x => {
  let t60 = Object.create( proto )

  t60.inputs = [ x ]
  t60.name = proto.basename + gen.getUID()

  return t60
}

},{"./gen.js":33}],76:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'tan',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'tan': isWorklet ? 'Math.tan' : Math.tan })

      out = `${ref}tan( ${inputs[0]} )` 

    } else {
      out = Math.tan( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let tan = Object.create( proto )

  tan.inputs = [ x ]
  tan.id = gen.getUID()
  tan.name = `${tan.basename}{tan.id}`

  return tan
}

},{"./gen.js":33}],77:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'tanh',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    
    const isWorklet = gen.mode === 'worklet'
    const ref = isWorklet? '' : 'gen.'

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'tanh': isWorklet ? 'Math.tan' : Math.tanh })

      out = `${ref}tanh( ${inputs[0]} )` 

    } else {
      out = Math.tanh( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let tanh = Object.create( proto )

  tanh.inputs = [ x ]
  tanh.id = gen.getUID()
  tanh.name = `${tanh.basename}{tanh.id}`

  return tanh
}

},{"./gen.js":33}],78:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    lt      = require( './lt.js' ),
    accum   = require( './accum.js' ),
    div     = require( './div.js' )

module.exports = ( frequency=440, pulsewidth=.5 ) => {
  let graph = lt( accum( div( frequency, 44100 ) ), pulsewidth )

  graph.name = `train${gen.getUID()}`

  return graph
}


},{"./accum.js":2,"./div.js":24,"./gen.js":33,"./lt.js":41}],79:[function(require,module,exports){
'use strict'

const AWPF = require( './external/audioworklet-polyfill.js' ),
      gen  = require( './gen.js' ),
      data = require( './data.js' )

let isStereo = false

const utilities = {
  ctx: null,
  buffers: {},
  isStereo:false,

  clear() {
    if( this.workletNode !== undefined ) {
      this.workletNode.disconnect()
    }else{
      this.callback = () => 0
    }
    this.clear.callbacks.forEach( v => v() )
    this.clear.callbacks.length = 0

    this.isStereo = false

    if( gen.graph !== null ) gen.free( gen.graph )
  },

  createContext( bufferSize = 2048, __AC=null ) {
    if( __AC === null ) {
      const AC = typeof AudioContext === 'undefined' ? webkitAudioContext : AudioContext
      
      // tell polyfill global object and buffersize
      AWPF( window, bufferSize )

      const start = () => {
        if( typeof AC !== 'undefined' ) {
          this.ctx = new AC({ latencyHint:.0125 })

          gen.samplerate = this.ctx.sampleRate

          if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
            window.removeEventListener( 'touchstart', start )
          }else{
            window.removeEventListener( 'mousedown', start )
            window.removeEventListener( 'keydown', start )
          }

          const mySource = utilities.ctx.createBufferSource()
          mySource.connect( utilities.ctx.destination )
          mySource.start()
        }
      }

      if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
        window.addEventListener( 'touchstart', start )
      }else{
        window.addEventListener( 'mousedown', start )
        window.addEventListener( 'keydown', start )
      }
    }else{
      this.ctx = __AC
      gen.samplerate = this.ctx.sampleRate
    }

    return this
  },

  createScriptProcessor() {
    this.node = this.ctx.createScriptProcessor( 1024, 0, 2 )
    this.clearFunction = function() { return 0 }
    if( typeof this.callback === 'undefined' ) this.callback = this.clearFunction

    this.node.onaudioprocess = function( audioProcessingEvent ) {
      const outputBuffer = audioProcessingEvent.outputBuffer

      const left = outputBuffer.getChannelData( 0 ),
            right= outputBuffer.getChannelData( 1 ),
            isStereo = utilities.isStereo

     for( var sample = 0; sample < left.length; sample++ ) {
        var out = utilities.callback()

        if( isStereo === false ) {
          left[ sample ] = right[ sample ] = out 
        }else{
          left[ sample  ] = out[0]
          right[ sample ] = out[1]
        }
      }
    }

    this.node.connect( this.ctx.destination )

    return this
  },

  // remove starting stuff and add tabs
  prettyPrintCallback( cb ) {
    // get rid of "function gen" and start with parenthesis
    // const shortendCB = cb.toString().slice(9)
    const cbSplit = cb.toString().split('\n')
    const cbTrim = cbSplit.slice( 3, -2 )
    const cbTabbed = cbTrim.map( v => '      ' + v ) 
    
    return cbTabbed.join('\n')
  },

  createParameterDescriptors( cb ) {
    // [{name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1}];
    let paramStr = ''

    //for( let ugen of cb.params.values() ) {
    //  paramStr += `{ name:'${ugen.name}', defaultValue:${ugen.value}, minValue:${ugen.min}, maxValue:${ugen.max} },\n      `
    //}
    for( let ugen of cb.params.values() ) {
      paramStr += `{ name:'${ugen.name}', automationRate:'k-rate', defaultValue:${ugen.defaultValue}, minValue:${ugen.min}, maxValue:${ugen.max} },\n      `
    }
    return paramStr
  },

  createParameterDereferences( cb ) {
    let str = cb.params.size > 0 ? '\n      ' : ''
    for( let ugen of cb.params.values() ) {
      str += `const ${ugen.name} = parameters.${ugen.name}[0]\n      `
    }

    return str
  },

  createParameterArguments( cb ) {
    let  paramList = ''
    for( let ugen of cb.params.values() ) {
      paramList += ugen.name + '[i],'
    }
    paramList = paramList.slice( 0, -1 )

    return paramList
  },

  createInputDereferences( cb ) {
    let str = cb.inputs.size > 0 ? '\n' : ''
    for( let input of  cb.inputs.values() ) {
      str += `const ${input.name} = inputs[ ${input.inputNumber} ][ ${input.channelNumber} ]\n      `
    }

    return str
  },


  createInputArguments( cb ) {
    let  paramList = ''
    for( let input of cb.inputs.values() ) {
      paramList += input.name + '[i],'
    }
    paramList = paramList.slice( 0, -1 )

    return paramList
  },
      
  createFunctionDereferences( cb ) {
    let memberString = cb.members.size > 0 ? '\n' : ''
    let memo = {}
    for( let dict of cb.members.values() ) {
      const name = Object.keys( dict )[0],
            value = dict[ name ]

      if( memo[ name ] !== undefined ) continue
      memo[ name ] = true

      memberString += `      const ${name} = ${value}\n`
    }

    return memberString
  },

  createWorkletProcessor( graph, name, debug, mem=44100*10, __eval=false, kernel=false ) {
    const numChannels = Array.isArray( graph ) ? graph.length : 1
    //const mem = MemoryHelper.create( 4096, Float64Array )
    const cb = gen.createCallback( graph, mem, debug )
    const inputs = cb.inputs

    // get all inputs and create appropriate audioparam initializers
    const parameterDescriptors = this.createParameterDescriptors( cb )
    const parameterDereferences = this.createParameterDereferences( cb )
    const paramList = this.createParameterArguments( cb )
    const inputDereferences = this.createInputDereferences( cb )
    const inputList = this.createInputArguments( cb )   
    const memberString = this.createFunctionDereferences( cb )

    let inputsString = ''
    let genishOutputLine = ''
    for( let i = 0; i < numChannels; i++ ) {
      inputsString += `const channel${i} = output[ ${i} ]\n\t\t`
      genishOutputLine += `channel${i}[ i ] = memory[ ${i} ]\n\t\t`
    }

    // change output based on number of channels.
    //const genishOutputLine = cb.isStereo === false
    //  ? `left[ i ] = memory[0]`
    //  : `left[ i ] = memory[0];\n\t\tright[ i ] = memory[1]\n`
    

    const prettyCallback = this.prettyPrintCallback( cb )

    // if __eval, provide the ability of eval code in worklet
    const evalString = __eval
      ? ` else if( event.data.key === 'eval' ) {
        eval( event.data.code )
      }
`
      : ''

    const kernelFncString = `this.kernel = function( memory ) {
      ${prettyCallback}
    }`
    /***** begin callback code ****/
    // note that we have to check to see that memory has been passed
    // to the worker before running the callback function, otherwise
    // it can be passed too slowly and fail on occassion

    const workletCode = `
class ${name}Processor extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    const params = [
      ${ parameterDescriptors }      
    ]
    return params
  }
 
  constructor( options ) {
    super( options )
    this.port.onmessage = this.handleMessage.bind( this )
    this.initialized = false
    ${ kernel ? kernelFncString : '' }
  }

  handleMessage( event ) {
    if( event.data.key === 'init' ) {
      this.memory = event.data.memory
      this.initialized = true
    }else if( event.data.key === 'set' ) {
      this.memory[ event.data.idx ] = event.data.value
    }else if( event.data.key === 'get' ) {
      this.port.postMessage({ key:'return', idx:event.data.idx, value:this.memory[event.data.idx] })     
    }${ evalString }
  }

  process( inputs, outputs, parameters ) {
    if( this.initialized === true ) {

      const output = outputs[0]
      ${inputsString}
      const len    = channel0.length
      const memory = this.memory ${parameterDereferences}${inputDereferences}${memberString}
      ${kernel ? 'const kernel = this.kernel' : '' }


      for( let i = 0; i < len; ++i ) {
        ${kernel ? 'kernel( memory )\n' : prettyCallback}
        ${genishOutputLine}
      }
    }
    return true
  }
}
    
registerProcessor( '${name}', ${name}Processor)`

    
    /***** end callback code *****/


    if( debug === true ) console.log( workletCode )

    const url = window.URL.createObjectURL(
      new Blob(
        [ workletCode ], 
        { type: 'text/javascript' }
      )
    )

    return [ url, workletCode, inputs, cb.params, numChannels ] 
  },

  registeredForNodeAssignment: [],
  register( ugen ) {
    if( this.registeredForNodeAssignment.indexOf( ugen ) === -1 ) {
      this.registeredForNodeAssignment.push( ugen )
    }
  },

  makeWorklet( graph, name, debug=false, mem=44100 * 1, __eval=false, kernel=false ) {
    const [ url, codeString, inputs, params, numChannels ] = utilities.createWorkletProcessor( graph, name, debug, mem, __eval, kernel )

    const nodePromise = new Promise( (resolve,reject) => {
      utilities.ctx.audioWorklet.addModule( url ).then( ()=> {
        const workletNode = new AudioWorkletNode( utilities.ctx, name, { channelInterpretation:'discrete', channelCount: numChannels, outputChannelCount:[ numChannels ] })

        workletNode.callbacks = {}
        workletNode.onmessage = function( event ) {
          if( event.data.message === 'return' ) {
            workletNode.callbacks[ event.data.idx ]( event.data.value )


            delete workletNode.callbacks[ event.data.idx ]
          }
        }

        workletNode.getMemoryValue = function( idx, cb ) {
          this.workletCallbacks[ idx ] = cb
          this.workletNode.port.postMessage({ key:'get', idx: idx })
        }
        
        workletNode.port.postMessage({ key:'init', memory:gen.memory.heap })
        utilities.workletNode = workletNode

        utilities.registeredForNodeAssignment.forEach( ugen => ugen.node = workletNode )
        utilities.registeredForNodeAssignment.length = 0

        // assign all params as properties of node for easier reference 
        for( let dict of inputs.values() ) {
          const name = Object.keys( dict )[0]
          const param = workletNode.parameters.get( name )
      
          Object.defineProperty( workletNode, name, {
            set( v ) {
              param.value = v
            },
            get() {
              return param.value
            }
          })
        }

        for( let ugen of params.values() ) {
          const name = ugen.name
          const param = workletNode.parameters.get( name )
          ugen.waapi = param 
          // initialize?
          param.value = ugen.defaultValue

          Object.defineProperty( workletNode, name, {
            set( v ) {
              param.value = v
            },
            get() {
              return param.value
            }
          })
        }

        resolve( workletNode )
      })

    })

    return nodePromise
  },


  playWorklet( graph, name, debug=false, mem=44100 * 60, __eval=false, kernel=false ) {
    utilities.clear()

    const [ url, codeString, inputs, params, numChannels ] = utilities.createWorkletProcessor( graph, name, debug, mem, __eval, kernel )
    console.log( 'numChannels:', numChannels )

    const nodePromise = new Promise( (resolve,reject) => {
   
      utilities.ctx.audioWorklet.addModule( url ).then( ()=> {
        const workletNode = new AudioWorkletNode( utilities.ctx, name, { channelInterpretation:'discrete', channelCount: numChannels, outputChannelCount:[ numChannels ] })

        workletNode.callbacks = {}
        workletNode.onmessage = function( event ) {
          if( event.data.message === 'return' ) {
            workletNode.callbacks[ event.data.idx ]( event.data.value )
            delete workletNode.callbacks[ event.data.idx ]
          }
        }

        workletNode.getMemoryValue = function( idx, cb ) {
          this.workletCallbacks[ idx ] = cb
          this.workletNode.port.postMessage({ key:'get', idx: idx })
        }
        
        workletNode.port.postMessage({ key:'init', memory:gen.memory.heap })
        utilities.workletNode = workletNode

        utilities.registeredForNodeAssignment.forEach( ugen => ugen.node = workletNode )
        utilities.registeredForNodeAssignment.length = 0

        // assign all params as properties of node for easier reference 
        for( let dict of inputs.values() ) {
          const name = Object.keys( dict )[0]
          const param = workletNode.parameters.get( name )
      
          Object.defineProperty( workletNode, name, {
            set( v ) {
              param.value = v
            },
            get() {
              return param.value
            }
          })
        }

        for( let ugen of params.values() ) {
          const name = ugen.name
          const param = workletNode.parameters.get( name )
          ugen.waapi = param 
          // initialize?
          param.value = ugen.defaultValue

          Object.defineProperty( workletNode, name, {
            set( v ) {
              param.value = v
            },
            get() {
              return param.value
            }
          })
        }

        if( utilities.console ) utilities.console.setValue( codeString )

        workletNode.connect( utilities.ctx.destination )

        resolve( workletNode )
      })

    })

    return nodePromise
  },
  
  playGraph( graph, debug, mem=44100*10, memType=Float32Array ) {
    utilities.clear()
    if( debug === undefined ) debug = false
          
    this.isStereo = Array.isArray( graph )

    utilities.callback = gen.createCallback( graph, mem, debug, false, memType )
    
    if( utilities.console ) utilities.console.setValue( utilities.callback.toString() )

    return utilities.callback
  },

  loadSample( soundFilePath, data ) {
    const isLoaded = utilities.buffers[ soundFilePath ] !== undefined

    let req = new XMLHttpRequest()
    req.open( 'GET', soundFilePath, true )
    req.responseType = 'arraybuffer' 
    
    let promise = new Promise( (resolve,reject) => {
      if( !isLoaded ) {
        req.onload = function() {
          var audioData = req.response

          utilities.ctx.decodeAudioData( audioData, (buffer) => {
            data.buffer = buffer.getChannelData(0)
            utilities.buffers[ soundFilePath ] = data.buffer
            resolve( data.buffer )
          })
        }
      }else{
        setTimeout( ()=> resolve( utilities.buffers[ soundFilePath ] ), 0 )
      }
    })

    if( !isLoaded ) req.send()

    return promise
  }

}

utilities.clear.callbacks = []

module.exports = utilities

},{"./data.js":19,"./external/audioworklet-polyfill.js":28,"./gen.js":33}],80:[function(require,module,exports){
'use strict'

/*
 * many windows here adapted from https://github.com/corbanbrook/dsp.js/blob/master/dsp.js
 * starting at line 1427
 * taken 8/15/16
*/ 

const windows = module.exports = { 
  bartlett( length, index ) {
    return 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2)) 
  },

  bartlettHann( length, index ) {
    return 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos( 2 * Math.PI * index / (length - 1))
  },

  blackman( length, index, alpha ) {
    let a0 = (1 - alpha) / 2,
        a1 = 0.5,
        a2 = alpha / 2

    return a0 - a1 * Math.cos(2 * Math.PI * index / (length - 1)) + a2 * Math.cos(4 * Math.PI * index / (length - 1))
  },

  cosine( length, index ) {
    return Math.cos(Math.PI * index / (length - 1) - Math.PI / 2)
  },

  gauss( length, index, alpha ) {
    return Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2))
  },

  hamming( length, index ) {
    return 0.54 - 0.46 * Math.cos( Math.PI * 2 * index / (length - 1))
  },

  hann( length, index ) {
    return 0.5 * (1 - Math.cos( Math.PI * 2 * index / (length - 1)) )
  },

  lanczos( length, index ) {
    let x = 2 * index / (length - 1) - 1;
    return Math.sin(Math.PI * x) / (Math.PI * x)
  },

  rectangular( length, index ) {
    return 1
  },

  triangular( length, index ) {
    return 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2))
  },

  // parabola
  welch( length, _index, ignore, shift=0 ) {
    //w[n] = 1 - Math.pow( ( n - ( (N-1) / 2 ) ) / (( N-1 ) / 2 ), 2 )
    const index = shift === 0 ? _index : (_index + Math.floor( shift * length )) % length
    const n_1_over2 = (length - 1) / 2 

    return 1 - Math.pow( ( index - n_1_over2 ) / n_1_over2, 2 )
  },
  inversewelch( length, _index, ignore, shift=0 ) {
    //w[n] = 1 - Math.pow( ( n - ( (N-1) / 2 ) ) / (( N-1 ) / 2 ), 2 )
    let index = shift === 0 ? _index : (_index + Math.floor( shift * length )) % length
    const n_1_over2 = (length - 1) / 2

    return Math.pow( ( index - n_1_over2 ) / n_1_over2, 2 )
  },

  parabola( length, index ) {
    if( index <= length / 2 ) {
      return windows.inversewelch( length / 2, index ) - 1
    }else{
      return 1 - windows.inversewelch( length / 2, index - length / 2 )
    }
  },

  exponential( length, index, alpha ) {
    return Math.pow( index / length, alpha )
  },

  rexponential( length, index, alpha ) {
    return Math.pow( index / length, alpha )
  },

  linear( length, index ) {
    return index / length
  }
}

windows.expodec = windows.rexponential
windows.rexpodec = windows.exponential

},{}],81:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
    floor= require('./floor.js'),
    sub  = require('./sub.js'),
    memo = require('./memo.js')

let proto = {
  basename:'wrap',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        signal = inputs[0], min = inputs[1], max = inputs[2],
        out, diff

    //out = `(((${inputs[0]} - ${this.min}) % ${diff}  + ${diff}) % ${diff} + ${this.min})`
    //const long numWraps = long((v-lo)/range) - (v < lo);
    //return v - range * double(numWraps);   
    
    if( this.min === 0 ) {
      diff = max
    }else if ( isNaN( max ) || isNaN( min ) ) {
      diff = `${max} - ${min}`
    }else{
      diff = max - min
    }

    out =
` var ${this.name} = ${inputs[0]}
  if( ${this.name} < ${this.min} ) ${this.name} += ${diff}
  else if( ${this.name} > ${this.max} ) ${this.name} -= ${diff}

`

    return [ this.name, ' ' + out ]
  },
}

module.exports = ( in1, min=0, max=1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    min, 
    max,
    uid:    gen.getUID(),
    inputs: [ in1, min, max ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./floor.js":30,"./gen.js":33,"./memo.js":45,"./sub.js":73}],82:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Analysis = {
  create( Audio ) {
    const analysis = {}

    for( let analysisName in Gibberish.analysis ) {
      const gibberishConstructor = Gibberish.analysis[ analysisName ]

      const methods = Analysis.descriptions[ analysisName ] === undefined ? null : Analysis.descriptions[ analysisName ].methods
      const description = { 
        properties: { type:'analysis' },
        name:analysisName,
        methods,
        category:'analysis'
      }

      const constructor = Ugen( gibberishConstructor, description, Audio, false, true )
      analysis[ analysisName ] = function( ...args ) {
        const ugen = constructor( ...args )
        Gibberish.worklet.ugens.set( ugen.id, ugen )
        ugen.out = ugen.__wrapped__.out
        
        if( analysisName === 'Follow' ) {
          let m = ugen.__wrapped__.multiplier || 1
          Object.defineProperty( ugen, 'multiplier', {
            configurable:true,
            get() { return m },
            set(v) { m = v; ugen.__wrapped__.multiplier = m }
          }) 
          let o = ugen.__wrapped__.offset || 0
          Object.defineProperty( ugen, 'offset', {
            configurable:true,
            get() { return o },
            set(v) { o = v; ugen.__wrapped__.offset = o }
          }) 
        }
        return ugen
      } 

    }
    return analysis
  },

  descriptions: {
    //SSD: { methods:[ 'listen' ] }
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Analysis 

},{"./ugen.js":122,"gibberish-dsp":169}],83:[function(require,module,exports){
(function (global){
const Gibberish   = require( 'gibberish-dsp' )
const Ugen        = require( './ugen.js' )
const Instruments = require( './instruments.js' )
const Oscillators = require( './oscillators.js' )
const Effects     = require( './effects.js' )
const Filters     = require( './filters.js' )
const Binops      = require( './binops.js' )
const Analysis    = require( './analysis.js' )
const Envelopes   = require( './envelopes.js' )
const Busses      = require( './busses.js' )
const Ensemble    = require( './ensemble.js' )
const Utility     = require( './utility.js' )
const Freesound   = require( './freesound.js' )
const Gen         = require( './gen.js' )
const WavePattern = require( './wavePattern.js' )
//const WaveObjects = require( './waveObjects.js' )

const Audio = {
  Clock: require( './clock.js' ),
  Theory: require( './theory.js' ),
  Presets: require( './presets.js' ),
  __seqDefaults: require('./defaults.js'),
  __Make: require( './make.js' ),
  initialized:false,
  autoConnect:true,
  shouldDelay:false,
  instruments:{},
  oscillators:{},
  effects:{},
  exportTarget:null,
  memoryLimit: 44100 * 60 * 20,
  latencyHint:.05,

  export( obj ) {
    if( Audio.initialized ){ 
      Object.assign( 
        obj, 
        this.instruments, 
        this.oscillators,
        this.effects,
        this.filters,
        this.busses, 
        this.envelopes, 
        //this.waveObjects, 
        this.binops, 
        this.analysis
      )
      
      Utility.export( obj )
      this.Gen.export( obj )

      obj.Gibberish = this.Gibberish

      obj.gen = this.Gen.make
      obj.lfo = this.Gen.composites.lfo
      obj.Ensemble = this.Ensemble
      obj.Drums = this.Drums
      obj.EDrums = this.EDrums
      obj.Theory = this.Theory
      obj.Freesound = this.Freesound
      obj.Clock = this.Clock
      obj.Clock.export( obj )
      obj.WavePattern = this.WavePattern
      obj.Gen = this.Gen
      obj.stop = this.stop

      obj.Out = this.Out
      obj.Make = this.Make
      obj.future = this.Gibberish.utilities.future
    }else{
      Audio.exportTarget = obj
    } 
  },

  __defaults : {
    workletPath: '../dist/gibberish_worklet.js',
    ctx:         null,
    bufferSize:  2048,
    latencyHint: .05
  },

  init( options, Gibber  ) {
    let { workletPath, ctx, bufferSize, latencyHint } = Object.assign( {}, this.__defaults, options ) 
    this.Gibber = Gibber
    this.Core = Gibber

    // XXX should probably just call Audio.Core.createProperty to avoid confusion...
    this.createProperty = Gibber.createProperty

    Gibber.Audio = this
    this.Gibberish = Gibberish

    Gibberish.workletPath = workletPath 

    this.createPubSub()

    const p = new Promise( (resolve, reject) => {
      Gibberish.init( Audio.memoryLimit, ctx, 'worklet', { latencyHint:Audio.latencyHint }).then( processorNode => {
        // XXX remove once gibber.core.lib has been properly integrated 
        Audio.Core.Audio = Audio.Core.audio = Audio

        Audio.Gibberish = Gibberish

        Audio.initialized = true
        Audio.node = processorNode
        Audio.Ugen = Ugen
        Audio.Make = Audio.__Make( Audio )
        Audio.Gen = Gen( Audio )
        Audio.Gen.init()
        Audio.Gen.export( Audio.Gen.ugens )
        Audio.Theory.init( window.Gibber )
        Audio.Utilities = Utility
        Audio.WavePattern = WavePattern( Audio )
        Audio.ctx = ctx
        
        // must wait for Gen to be initialized
        Audio.Clock.init( Audio.Gen, Audio )

        Audio.createUgens()
        Audio.Out = Audio.busses.Bus2()//Gibberish.output
        Audio.Out.connect( Gibberish.output )
        
        if( Audio.exportTarget !== null ) Audio.export( Audio.exportTarget )

        Gibberish.worklet.port.__postMessage = Gibberish.worklet.port.postMessage

        Gibberish.worklet.port.postMessage = function( dict ) {
          if( Audio.shouldDelay === true ) dict.delay = true

          Gibberish.worklet.port.__postMessage( dict )
        }

        Audio.export( window )
        Audio.phase = Audio.makePhase()
        Audio.phase.connect( Audio.Out, 0 )
        Audio.setupGlobals()

        //const drums = Audio.Drums('x*o-')
        //drums.disconnect()
        //drums.stop()

        // store last location in memory... we can clear everything else in Gibber.clear9)
        const memIdx = Object.keys( Gibberish.memory.list ).reverse()[0]
        this.__memoryEnd = parseInt( memIdx ) + Gibberish.memory.list[ memIdx ]

        // XXX this forces the gibberish scheduler to start
        // running, but it's about as hacky as it can get...
        //const __start = Audio.instruments.Synth().connect()
        //__start.disconnect()

        //Audio.Gibberish.genishi.gen.histories.clear()
        Audio.clear()


        resolve( [Audio,'Audio'] )
      })
    })
    
    return p
  },

  restart() {
    Gibber.clear()
    Gibberish.worklet.port.close()
    window.w = Gibberish.worklet
    Gibberish.worklet.disconnect()

    Gibberish.init( Audio.memoryLimit, undefined, 'worklet', true ).then( processorNode => {
      Audio.out = Gibberish.output
      Audio.node = processorNode

      Audio.Theory.deleteProperties()
      Audio.Theory.init( window.Gibber )

      Audio.initialized = true
      Audio.node = processorNode
      Audio.Out = Gibberish.output

      Audio.Make = Audio.__Make( Audio )
      Audio.Gen = Gen( Audio )
      Audio.Gen.init()
      Audio.Gen.export( Audio.Gen.ugens )

      Audio.WavePattern = WavePattern( Audio )
      Audio.createUgens()
        
      Audio.Clock.init( Audio.Gen, Audio )

      Gibberish.worklet.port.__postMessage = Gibberish.worklet.port.postMessage
      Gibberish.worklet.port.postMessage = function( dict ) {
        if( Audio.shouldDelay === true ) dict.delay = true

        Gibberish.worklet.port.__postMessage( dict )
      }

      Audio.export( window )
      Gibber.export( window )

      Audio.phase = Audio.makePhase()
      Audio.phase.connect( Audio.Out, 0 ) 

      const memIdx = Object.keys( Gibberish.memory.list ).reverse()[0]
      this.__memoryEnd = parseInt( memIdx ) + Gibberish.memory.list[ memIdx ]

      // XXX this forces the gibberish scheduler to start
      // running, but it's about as hacky as it can get...
      const __start = Audio.instruments.Synth().connect()
      __start.disconnect()

      //Audio.Gibberish.genishi.gen.histories.clear()

      //Audio.clear()
      console.log( 'audio engine successfully restarted.' )
      Audio.publish( 'restart' )
    })
  },

  setupGlobals() {
    const run = fnc => {
      const str = fnc.toString()
      const idx = str.indexOf('=>') + 2
      const code = str.slice( idx ).trim()
      Gibberish.worklet.port.__postMessage({
        address:'eval',
        code
      })
    }

    run( ()=> {
      global.main = function( fnc ) {
        let str = fnc.toString()
        let idx = str.indexOf('=>') + 2

        Gibberish.processor.port.postMessage({
          address:'eval',
          code:str.slice( idx ).trim()
        })
      }

      Clock = Gibberish.Clock
    })

    run( ()=> {
      global.recursions = {}
      //sin = Math.sin
      //sinn = v => .5 + Math.sin(v) * .5
      //sinr = v => Math.round( Math.sin(v) )
      //cos = Math.cos
      //cosn = v => .5 + Math.cos(v) * .5
      //cosr = v => Math.round( Math.cos(v) )
      abs = Math.abs
      floor = Math.floor
      ceil = Math.ceil
      random = Math.random
      round = Math.round
      min = Math.min
      max = Math.max
      g = global
      g.phase = Gibberish.ugens.get( 6 )
      g.line = (freq=1,gain=1,offset=0) => offset + (((g.phase.graph.value*(1/freq)) / (Math.PI * 2)) % 1 ) * gain
      cos  = (freq=1,gain=1,offset=0) => offset + Math.cos( g.phase.graph.value*(1/freq)*6.283185307179586) * gain
      cosn = (freq=1,gain=1,offset=0) => offset + (.5+Math.cos(g.phase.graph.value*(1/freq)*6.283185307179586)*.5) * gain + offset
      sin  = (freq=1,gain=1,offset=0) => offset + Math.sin( g.phase.graph.value*(1/freq)*6.283185307179586) * gain
      sinn = (freq=1,gain=1,offset=0) => offset + (.5+Math.sin(g.phase.graph.value*(1/freq)*6.283185307179586)*.5) * gain + offset

      global.tr = function( fnc, name, dict, delay=0 ) {
        // there are two versions of this function, in effect (I KNOW)
        // the first function is called when a recursion is created from
        // within the audio thread. The second version is called when
        // the recursion is created within the main thread... in this case
        // the function is compiled to a string and sent to the audio
        // thread to be evaluated.

        /*********** BEGIN AUDIO THREAD RECURSION FUNCTION ************/
        const keys = Object.keys( dict )
        const objs = keys.map( key => {
          let val = null
          if( typeof dict[key] === 'object' || typeof dict[key] === 'function' ) {
            if( dict[ key ].id !== undefined ) {
              val = Gibberish.ugens.get( dict[ key ].id )
            }else{
              val = JSON.stringify( dict[ key ] )
            }
          }else{
            val = dict[ key ]
          }
          return val
        })

        // we need to wait to make our new recursion until after any nudge/delay
        // has been scheduled, so we create the recursion inside the *make* function
        // which is then scheduled for delayed execution (if needed) or called immediately
        // if no delay is applied
        const make = function() {
          const remove = function( num = 0 ) {
            // TODO could we just look for name? wouldn't that be shorter?
            const idx = Gibberish.scheduler.queue.data.findIndex( 
              evt => evt.func.toString().indexOf( `global.recursions['${name}'](...objs)`) > -1 
            )
            if( idx > -1 ) {
              Gibberish.scheduler.queue.data.splice( idx, 1 )
            }
          }
          
          let floatError = 0
          global.recursions[name] = function( ...args ) {
            let __nexttime__ = fnc(...args)
            if( __nexttime__ === -987654321 ) {
              return
            }
            if( isNaN( __nexttime__ ) === false && __nexttime__ <= 0 ) {
              console.warn( 'temporal recursion scheduled with a time <= 0; this would create a potentially infinite loop. substituting a time of one measure.' )
              __nexttime__ = 1
            }
            if( __nexttime__ && __nexttime__ > 0 ) {
              
              const t = Clock.time( __nexttime__ )
              let newTime = Math.floor(t)
              floatError += t - newTime

              while( floatError >= 1 ) {
                newTime += 1
                floatError -= 1
              }

              Gibberish.scheduler.add(
                newTime,
                // bad hack to force the function to be found when looking
                // for recursion replacement, include function name in string
                // at top of function
                eval( `()=> { global.recursions['${name}'](...objs) }` ),
                0
              )
            }
          }
          global.recursions[ name ].remove = remove 
        }

        if( delay === 0 ) {
          if( global.recursions[ name ] !== undefined ) global.recursions[ name ].remove()
          make()
          global.recursions[name](...objs)
        }else{
          Gibberish.scheduler.add(
            Clock.time( delay ),
            ()=>{
              if( global.recursions[ name ] !== undefined ) global.recursions[ name ].remove()
              make()
              // don't adjust spacing below for realz don't
              global.recursions[name](...objs)
            },
            1
          )
        }
      } 
    })

    /************* BEGIN MAIN THREAD RECURSION CONSTRUCTION *************/
    const tr = function( fnc, name, dict, immediate=0, delay=0 ) {
      let code = fnc.toString()
      const keys = Object.keys( dict )

      code = `
        const make = function() {
          const objs = [
            ${keys.map( key => typeof dict[key] === 'object' || typeof dict[key] === 'function'
              ? dict[ key ].id !== undefined
                ? 'Gibberish.ugens.get(' + dict[ key ].id + ')'
                : JSON.stringify( dict[ key ] )
              : `'${dict[ key ]}'` )
            .join(',')
          }]
          ;
          let floatError = 0;
          global.recursions['${name}'] = function ${name} (${keys}) {
            let __nexttime__ = ( ${code} )(${keys})

            if( __nexttime__ === -987654321 ) {
              return
            }
            if( isNaN( __nexttime__ ) === false && __nexttime__ <= 0 ) {
              console.warn( 'temporal recursion scheduled with a time <= 0; this would create a potentially infinite loop. substituting a time of one measure.' )
              __nexttime__ = 1
            }
            if( __nexttime__ && __nexttime__ > 0 ) {
              const t = Clock.time( __nexttime__ )
              let newTime = Math.floor(t)
              floatError += t - newTime

              while( floatError >= 1 ) {
                newTime += 1
                floatError -= 1
              }
              Gibberish.scheduler.add(
                newTime,
                (${keys})=>{
                  global.recursions['${name}'](...objs)
                },
                100
              )
            }
          }
          const remove = function( num = 0 ) {
            if( global.recursions['${name}'] !== undefined ) {
              const idx = Gibberish.scheduler.queue.data.findIndex( evt => evt.func.toString().indexOf( "global.recursions['${name}'](...objs)") > -1 )
              if( idx > -1 ) {
                Gibberish.scheduler.queue.data.splice( idx, 1 )
                Gibberish.scheduler.queue.length--
              }
            }
          }

          global.recursions['${name}'].remove = remove;
          return objs
        }

      if( ${delay} === 0 ) {
        if( global.recursions['${name}'] !== undefined ) global.recursions['${name}'].remove()
        const objs = make()
        global.recursions[ '${name}' ](...objs)
      }else{
        Gibberish.scheduler.add(
          Clock.time( ${delay} ),
          ()=>{
            if( global.recursions['${name}'] !== undefined ) global.recursions['${name}'].remove()
            const objs = make()
            global.recursions[ '${name}' ](...objs)
          },
          -1
        )
      }
  `


      if( immediate === 0 ) {
        Gibberish.worklet.port.postMessage({
          address:'eval',
          code
        })
      }else{
        Gibberish.worklet.port.__postMessage({
          address:'eval',
          code
        })
      }
    }

    const Score = function( score ) {
      for( let i = 0; i < score.length; i+=2 ) {
        let cmd = score[ i + 1 ].toString()
        const arrowIndex = cmd.indexOf('=>')
        const functionIndex = cmd.indexOf('function')

        if( arrowIndex > -1 ) {
          cmd = cmd.slice( arrowIndex + 2 )
        }else if( functionIndex > -1 ) {
          cmd = cmd.slice( cmd.indexOf('{') )
        }

        future( 
          new Function(`global.main( ()=> eval(\`${cmd}\`) )`),
          score[ i ],
          {}
        )
      }
    }
    
    Audio.globals = { run, tr, Score }
  },

  // XXX stop clock from being cleared.
  clear() { 
    Gibberish.clear() 
    Audio.Out = Audio.busses.Bus2()//Gibberish.output
    Audio.Out.connect( Gibberish.output )
    Audio.Clock.init( Audio.Gen, Audio )
    Audio.phase.connect( Audio.Out, 0 )

    // the idea is that we only clear memory that was filled after
    // the initial Gibber initialization... this stops objects
    // like Clock and Theory from having their memory cleared and
    // from having to re-initialize them.

    // fill memory with zeros from the end initialization block onwards
    Gibberish.memory.heap.fill( 0, this.__memoryEnd )

    // get locations of all memory blocks
    const memKeys = Object.keys( Gibberish.memory.list )

    // get idx of final initialization block
    const endIdx =  memKeys.indexOf( ''+this.__memoryEnd )

    // loop through all blocks after final initialzation block
    // and delete them in the memory list... they've already
    // been zeroed out.
    for( let i = endIdx; i < memKeys.length; i++ ) {
      delete Gibberish.memory.list[ memKeys[ i ] ]
    }
    
    Audio.publish('clear')
  },

  makePhase() {
    const def = {
      name:'Phase',
      type:'Ugen',
      properties: { bpm:Audio.Clock.bpm, sr:Gibberish.ctx.sampleRate },
      constructor: function() {
        const gen = Gibberish.genish
        const graph = gen.accum(
          gen.div( gen.div( gen.in('bpm'), 240), gen.in('sr')),
          0,
          { max:Infinity }
        )
        return graph
      }
    }

    return Make( def )()
  },

  stop() {
    Gibber.Seq.sequencers.forEach( s => s.stop() )
  },

  start() {
    Gibber.Seq.sequencers.forEach( s => s.start() )
  },
  onload() {},

  createUgens() {
    //Core.export( this, this )

    this.Freesound = Freesound( this )
    this.binops = Binops.create( this )
    this.analysis = Analysis.create( this )
    this.oscillators = Oscillators.create( this )
    this.instruments = Instruments.create( this ) 
    this.envelopes   = Envelopes.create( this )
    this.filters     = Filters.create( this )
    this.effects = Effects.create( this )
    this.busses = Busses.create( this )
    this.Ensemble = Ensemble( this )
    //this.waveObjects = WaveObjects( this )

    const Pattern = this.Core.__Pattern
    Pattern.transfer( this, Pattern.toString() )

    
    const drums = require( './drums.js' )( this )
    Object.assign( this, drums )
  },

  printcb() { 
    Gibber.Audio.Gibberish.worklet.port.postMessage({ address:'callback' }) 
  },
  printobj( obj ) {
    Gibber.Audio.Gibberish.worklet.port.postMessage({ address:'print', object:obj.id }) 
  },
  send( msg ){
    Gibber.Audio.Gibberish.worklet.port.postMessage( msg )
  },

  createPubSub() {
    const events = this.pubevents = {}
    this.subscribe = function( key, fcn ) {
      if( typeof events[ key ] === 'undefined' ) {
        events[ key ] = []
      }
      events[ key ].push( fcn )
    }

    this.unsubscribe = function( key, fcn ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.splice( arr.indexOf( fcn ), 1 )
      }
    }

    this.publish = function( key, data ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.forEach( v => v( data ) )
      }
    }
  },

  createMapping( from, to, name, wrappedTo ) {
    if( from.__useMapping === false ) {
      to[ name ].value = from
    }else if( from.type === 'audio' ) {
      const f = to[ '__' + name ].follow = Follow({ input: from })

      let m = f.multiplier
      Object.defineProperty( to[ name ], 'multiplier', {
        get() { return m },
        set(v) { m = v; f.multiplier = m }
      })

      let o = f.offset
      Object.defineProperty( to[ name ], 'offset', {
        get() { return o },
        set(v) { o = v; f.offset = o }
      })

      wrappedTo[ name ] = f
      //to[ '__'+name].value = f

    }else if( from.type === 'gen' ) {
      // gen objects can be referred to without the graphics/audio abstraction,
      // in which case they will have no .render() function, and don't need to be rendered
      const gen = from.render !== undefined ? from.render() : from

      wrappedTo[ name ] = gen
    }
  },

  createGetter( obj, name ) { return () => obj[ '__' + name ] },

  createSetter( obj, name, post, transform=null, isPoly=false ) {
    if( typeof obj.__wrapped__ === 'object' ) {
      let desc = Object.getOwnPropertyDescriptor( obj.__wrapped__, name )

      if( desc !== undefined ) {
        Object.defineProperty( obj.__wrapped__, name,  {
          configurable:true,
          set(v) {
            obj[ '__'+name ].value = v
            if( desc.set ) {
              desc.set( v )
            }else{
              obj.__wrapped__.value = v
            }
          }
        })
      }
    }
    const setter = v => {
      let value, shouldSend = true


      if( typeof v === 'number' || typeof v === 'string' || v === null ) {
        value = transform !== null ? transform( v ) : v

        if( isPoly === true ) {
          const __wrappedObject = obj.__wrapped__
          const voice = __wrappedObject.voices[ __wrappedObject.voiceCount % __wrappedObject.voices.length ]
          voice[ name ] = value

          shouldSend = false

          Gibberish.worklet.port.postMessage({
            address:'property',
            object:voice.id,
            name,
            value
          }) 

        }else{
          obj[ '__'+name].value = v
        }
      }else if( typeof v === 'object' && v !== null && v.type === 'gen' ) {
        // gen objects can be referred to without the graphics/audio abstraction,
        // in which case they will have no .render() function, and don't need to be rendered

        v = transform !== null ? transform( v ) : v       
        const gen = v.render !== undefined ? v.render() : v 

        obj['__'+ name ].value = gen 
        value = { id: gen.id }
      }else if( typeof v === 'object' ) { //&& typeof v !== null ) {
        //if( obj.__useMapping === false || name === 'input' ) {
        //  obj[ '__'+name].value = v
        //  value = v !== null ? { id:v.id } : v
        //}else{
        //  //Audio.createMapping( v, obj, name, obj.__wrapped__ )
        //  const f = obj[ '__' + name ].follow = Follow({ input: v })

        //  let m = f.multiplier
        //  Object.defineProperty( obj[ name ], 'multiplier', {
        //    get() { return m },
        //    set(v) { m = v; f.multiplier = m }
        //  })

        //  let o = f.offset
        //  Object.defineProperty( obj[ name ], 'offset', {
        //    get() { return o },
        //    set(v) { o = v; f.offset = o }
        //  })

          //wrappedTo[ name ] = f
          //obj[ '__'+name ].value = f.__wrapped__
          //value = { id:f.id }
          obj[ '__'+name ].value = v.__wrapped__
          value = { id:v.id }
        //}
               //
        //obj[ '__'+name].value = v
        //value = v !== null ? { id:v.id } : v
      }

      if( Gibberish.mode === 'worklet' && shouldSend === true ) {
        Gibberish.worklet.port.postMessage({
          address:'property',
          object:obj.id,
          name,
          value
        }) 
      }
      if( post !== null ) {
        post.call( obj )
      }     
      if( Gibberish.mode === 'worklet' ) Audio.publish( `property.set:${obj.id}`, obj, v )
    }

    return setter
  },

  createFade( from=null, to=null, time=1, obj, name, delay=0 ) {
    if( from === null ) from = obj[ name ].value
    if( to === null ) to = obj[ name ].value

    time = Audio.Clock.time( time )

    // XXX only covers condition where ramps from fades are assigned...
    // does this need to be more generic?
    if( isNaN( from ) && from.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
      from = from.to.value
    }
    if( isNaN( to ) && to.__wrapped__.ugenName.indexOf('ramp') > -1 ) {
      to = to.to.value
    }

    let ramp = Audio.envelopes.Ramp({ from, to, length:time, shouldLoop:false })
    // this is a key to not use an envelope follower for mapping
    ramp.__useMapping = false
    ramp.__wrapped__.isFade = true

    if( delay === 0 ) {
      obj[ name ] = ramp
    } else {
      future( (obj,name,ramp) => { 
        obj[ name ] = ramp 
      }, delay, { obj, name, ramp:ramp.__wrapped__ } )
    }

    if( ramp.__wrapped__ === undefined ) ramp.__wrapped__ = {}
    ramp.__wrapped__.values = []

    ramp.__wrapped__.output = v => {
      if( ramp.__wrapped__ !== undefined ) {
        ramp.__wrapped__.values.unshift( v )
        while( ramp.__wrapped__.values.length > 60 ) ramp.__wrapped__.values.pop()
      }
    }

    ramp.__wrapped__.finalize = () => {
      const store = ramp.__wrapped__

      // XXX I can't quite figure out why I have to wait to reset the property 
      // value here... if I don't, then the fade ugen stays assigned in the worklet processor.
      // and 0 doesn't work!
      setTimeout( ()=> obj[ name ] = store.to === 0 ? .000001 : store.to, 0 )
      store.widget.clear()
    }

    ramp.__wrapped__.from = from
    ramp.__wrapped__.to = to

    return obj
  },

  // what properties should be automatically (automagickally?)
  // filtered through Audio.Clock.time()?
  timeProps : {
    Synth:[ 'attack', 'decay', 'sustain', 'release' ],
    PolySynth:[ 'attack', 'decay', 'sustain', 'release' ],
    Complex:[ 'attack', 'decay', 'sustain', 'release' ],
    PolyComplex:[ 'attack', 'decay', 'sustain', 'release' ],
    FM:[ 'attack', 'decay', 'sustain', 'release' ],
    PolyFM:[ 'attack', 'decay', 'sustain', 'release' ],
    Monosynth:[ 'attack', 'decay', 'sustain', 'release' ],
    PolyMono:[ 'attack', 'decay', 'sustain', 'release' ],
    Delay:[ 'time' ], 
  }
}

module.exports = Audio

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./analysis.js":82,"./binops.js":84,"./busses.js":85,"./clock.js":86,"./defaults.js":87,"./drums.js":88,"./effects.js":89,"./ensemble.js":90,"./envelopes.js":91,"./filters.js":93,"./freesound.js":94,"./gen.js":95,"./instruments.js":97,"./make.js":98,"./oscillators.js":99,"./presets.js":100,"./theory.js":121,"./ugen.js":122,"./utility.js":123,"./wavePattern.js":124,"gibberish-dsp":169}],84:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Binops = {
  create( Audio ) {
    const binops = {}

    for( let binopName in Gibberish.binops ) {
      const gibberishConstructor = Gibberish.binops[ binopName ]

      const methods = Binops.descriptions[ binopName ] === undefined ? null : Binops.descriptions[ binopName ].methods
      const description = { 
        properties:gibberishConstructor.defaults,
        methods:methods,
        name:binopName,
        category:'binops'
      }
      description.properties.type = 'binop'

      const constructor = Ugen( gibberishConstructor, description, Audio, false, true )
      binops[ binopName ] = function( ...args ) {
        const ugen = constructor( ...args )
        ugen[0] = ugen.__wrapped__[0]
        ugen[1] = ugen.__wrapped__[1]

        return ugen
      } 
    }
    return binops
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Binops

},{"./ugen.js":122,"gibberish-dsp":169}],85:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Busses = {
  create( Audio ) {
    const busses = {}

    const busDescription = { 
      properties:Gibberish.Bus.defaults,
      methods:null,
      name:'Bus',
      category:'misc'
    }

    busses.Bus = Ugen( Gibberish.Bus, busDescription, Audio )
    busses.__Bus = function( ...args ) {
      let props
      if( args.length > 1 || args.length === 1 && typeof args[0] !== 'string' ) {
        props = { inputs:args }
      }else if( args.length === 1 ) {
        props = args[0]
      }
      
      return props !== undefined ? busses.__Bus( props ) : busses.__Bus()
    }

    const bus2Description = { 
      properties:Gibberish.Bus2.defaults,
      methods:null,
      name:'Bus2',
      category:'misc'
    }

    busses.Bus2 = Ugen( Gibberish.Bus2, bus2Description, Audio )
    busses.__Bus2 = function( ...args ) {
      let props
      if( args.length > 1 || (args.length === 1 && typeof args[0] !== 'string' && args[0].type !== 'ensemble' )) {
        props = { inputs:args }
      }else if( args.length === 1 ) {
        props = args[0]
      }
      
      return props !== undefined ? busses.__Bus2( props ) : busses.__Bus2()
    }

    return busses
  }
}

module.exports = Busses

},{"./ugen.js":122,"gibberish-dsp":169}],86:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const serialize = require( 'serialize-javascript' )

// XXX must use form key:function() {} due to serialization
const Clock = {
  __beatCount:0,
  id:null,
  name:'Clock',
  nogibberish:true,
  bpm:140,
  __lastBPM:140,
  seq:null,

  export:function( obj ) {
    obj.btos = Clock.btos.bind( Clock )
    obj.btoms = Clock.btoms.bind( Clock )
    obj.stob = Clock.stob.bind( Clock )
  },

  store:function() { 
    Gibberish.Clock = this
    this.beatCount = 0
    this.queue = []
    this.init()
  },

  addToQueue:function( ...args ) {
    if( Gibberish.mode === 'processor' ) {
      args = args[0]
      args.forEach( v => Gibberish.Clock.queue.push( v ) )
    }else{
      Gibberish.worklet.port.postMessage({
        address: 'method',
        object: this.id,
        name: 'addToQueue',
        args: serialize( args ),
        functions: true
      }) 
    }
  },

  init:function( Gen, Audio ) {
    // needed so that when the clock is re-initialized (for example, after clearing)
    // gibber won't try and serialized its sequencer
    if( this.seq === null ) {

      this.clockFunc = ()=> {
        Gibberish.worklet.port.postMessage({
          address: 'beat',
          value: this.beatCount
        }) 

        if( this.beatCount++ % 4 === 0 ) {
          Gibberish.processor.playQueue()//.forEach( f => { f() } )
        }
      }

      if( Gibberish.mode === 'worklet' ) {
        this.id = Gibberish.utilities.getUID()
        this.audioClock = null
        this.__rate = null

        Gibberish.worklet.port.postMessage({
          address:'add',
          properties:serialize( Clock ),
          id:this.id,
          post: 'store'    
        })
        
        let bpm = this.__lastBPM
        Object.defineProperty( this, 'bpm', {
          get() { return bpm },
          set(v){ 
            bpm = v
            if( Gibberish.mode === 'worklet' ) {
              this.__lastBPM = v
              if( Audio.Gibber.Tidal !== undefined ) Audio.Gibber.Tidal.cps = bpm/120/2
              if( Audio.phase !== undefined ) Audio.phase.bpm = bpm

              // watch out! always using same id here...
              Gibberish.worklet.port.postMessage({
                address:'set',
                object:3,
                name:'bpm',
                value:bpm 
              }) 
            }
          }
        })

        this.audioClock = Gen.make( Gen.ugens.abs(1) )
        //this.__rate = this.audioClock.__p0 

        Object.defineProperty( this, 'rate', {
          configurable:true,
          get() { return this.audioClock },
          set(v){
            this.audioClock.p0 = v
          }
        })

        //Gibberish.worklet.port.postMessage({
        //  address:'set',
        //  value: Gen.make( Gen.ugens.abs(1) ),
        //  object:this.id,
        //  name:'audioClock'
        //})

        this.bpm = this.__lastBPM
      }
    }

    if( Gibberish.mode === 'processor' )
      this.seq = Gibberish.Sequencer.make( [ this.clockFunc ], [ ()=>Gibberish.Clock.time( 1/4 ) ] ).start()
    

  },

  connect: function() {
    if( this.audioClock !== undefined ) {
      Gibberish.analyzers.push( this.audioClock )
      Gibberish.dirty( Gibberish.analyzers )
      console.log( 'clock connected' )
    }
  },

  // time accepts an input value and converts it into samples. the input value
  // may be measured in milliseconds, beats or samples.
  time: function( inputTime = 0 ) {
    let outputTime = inputTime

    // if input is an annotated time value such as what is returned
    // by samples() or ms()...
    // console.log( 'input time:' , inputTime )
    if( isNaN( inputTime ) ) {
      if( typeof inputTime === 'object' ) { 
        if( inputTime.type === 'samples' ) {
          outputTime = inputTime.value
        }else if( inputTime.type === 'ms' ) {
          outputTime = this.mstos( inputTime.value ) 
        }
      } 
    }else{
      // XXX 4 is a magic number, needs to account for the current time signature
      outputTime = this.btos( inputTime * 4 )
    }
    
    return outputTime
  },

  // does not work... says Gibberish can't be found? I guess Gibberish isn't in the
  // global scope of the worklet?
  Time: function( inputTime ) {
    return new Function( `return Gibberish.Clock.time( ${inputTime} )` )
  },

  mstos: function( ms ) {
    return ( ms / 1000 ) * Gibberish.ctx.sampleRate
  },

  // convert beats to samples
  btos: function( beats ) {
    const samplesPerBeat = Gibberish.ctx.sampleRate / (this.bpm / 60 )
    return samplesPerBeat * beats 
  },

  // convert samples to beats (for pattern visualizations)
  stob: function( samples ) {
    const samplesPerBeat = Gibberish.ctx.sampleRate / (this.bpm / 60 )
    return (samples / samplesPerBeat) * .25 // XXX magic number should be denominator of time signature 
  },
  // convert beats to milliseconds
  btoms: function( beats ) {
    const samplesPerMs = Gibberish.ctx.sampleRate / 1000
    return beats * samplesPerMs
  },

  ms: function( value ) {
    return { type:'ms', value }
  },

  samples: function( value ) {
    return { type:'samples', value }
  }
}

module.exports = Clock

},{"gibberish-dsp":169,"serialize-javascript":126}],87:[function(require,module,exports){
module.exports = {
  Synth:     'note',
  FM:        'note',
  Monosynth: 'note',
  Complex:   'note',
  Sampler:   'pickplay',
  Snare:     'trigger',
  Kick:      'trigger',
  Clave:     'trigger',
  Tom:       'note:',
  Clap:      'trigger',
  Hat:       'trigger',
  Pluck:     'note',
  Karplus:   'note',
  Soundfont: 'note',
  Conga:     'note',
  PolySynth: 'note',
  PolyFM:    'note',
  PolyMono:  'note',
  PolyComplex:'note',
  Multisampler:'pickplay',
  Grains:'pickplay',
  PolyConga: 'note',
  PolyTom:   'note',
  PolyKarplus:'note'
}

},{}],88:[function(require,module,exports){
const Ugen = require( './ugen.js' )
const Presets = require( './presets.js' )

let Audio = null

const addMethod = ( obj, name, __value = 1, propOverrideName ) => {
  if( propOverrideName === undefined ) propOverrideName = name

  obj[ '__' + name ] = { 
    value: __value,
    isProperty:true,
    sequencers:[],
    mods:[],
    name,

    seq( values, timings, number = 0, delay = 0 ) {
      let prevSeq = obj['__'+name].sequencers[ number ] 
      if( prevSeq !== undefined ) { 
        prevSeq.stop(); prevSeq.clear(); 
        let idx = obj.__sequencers.indexOf( prevSeq )
        obj.__sequencers.splice( idx, 1 )
      }

      // XXX you have to add a method that does all this shit on the worklet. crap.
      obj['__'+name].sequencers[ number ] = obj['__'+name][ number ] = Audio.Core.Seq({ 
        values, 
        timings, 
        target:obj.__wrapped__, 
        key:name,
        rate:Audio.Clock.audioClock
      })
      .start( Audio.Clock.time( delay ) )

      obj.__sequencers.push( obj['__'+name][ number ] )

      // return object for method chaining
      return obj
    },
  }

  Audio.Gibberish.worklet.port.postMessage({
    address:'addMethod',
    key:name,
    function:`function( ${name} ) {
        for( let input of this.inputs ) {
          if( typeof input === 'object' ) input[ '${propOverrideName}' ] = ${name}
        }
      }`,
    id:obj.id,
    delay:Audio.shouldDelay
  })

  Object.defineProperty( obj, name, {
    configurable:true,
    get() { return this[ '__' + name ] },
    set(v){ 
      this[ '__' + name ].value = v
      for( let sampler of this.samplers ) sampler[ propOverrideName ] = this[ '__' + name ].value 
    }
  })
}

module.exports = function( __Audio ) {
  Audio = __Audio

  const Drums = function( score, time, ...args ) { 
    // XXX what url prefix should I be using?

    const temp = Audio.autoConnect
    Audio.autoConnect = false
    const k  = Audio.instruments.Sampler({ files:[Drums.prefix + '/resources/audiofiles/kick.wav' ] })
    const s  = Audio.instruments.Sampler({ files:[Drums.prefix + '/resources/audiofiles/snare.wav' ] })
    const ch = Audio.instruments.Sampler({ files:[Drums.prefix + '/resources/audiofiles/hat.wav' ] })
    const oh = Audio.instruments.Sampler({ files:[Drums.prefix + '/resources/audiofiles/openhat.wav' ] })
    Audio.autoConnect = temp

    const drums = Audio.Ensemble({
      'kd': { target:k,  method:'trigger', args:[1], name:'kick' },
      [0]: { target:k,  method:'trigger', args:[1], name:'kick' },
      'sd': { target:s,  method:'trigger', args:[1], name:'snare' },
      'sn': { target:s,  method:'trigger', args:[1], name:'snare' },
      [1]: { target:s,  method:'trigger', args:[1], name:'snare' },
      'ch': { target:ch, method:'trigger', args:[1], name:'closedHat' },
      [2]: { target:ch, method:'trigger', args:[1], name:'closedHat' },
      'oh': { target:oh, method:'trigger', args:[1], name:'openHat' },
      [3]: { target:oh, method:'trigger', args:[1], name:'openHat' },
    })

    if( Audio.autoConnect === true ) drums.connect()

    drums.__sequencers = [ ]

    //if( typeof score === 'string' ) {
    //  drums.seq = Audio.Seq({
    //    target:drums,
    //    key:'play',
    //    values:score.split(''),
    //    timings:time === undefined ? 1 / score.length : time
    //  }).start()
    

    //  drums.values = drums.seq.values
    //  drums.timings = drums.seq.timings

    //  drums.__sequencers.push( drums.seq )
    //}else{
    //  Gibber.addSequencing( drums, 'play', 0 )
    //}

    drums.samplers = [ k,s,ch,oh ]

    addMethod( drums, 'pitch', 1, 'rate' )
    addMethod( drums, 'start', 0 )
    addMethod( drums, 'end', 1 )

    props = Presets.process( { name:'Drums', category:'instruments' }, args, Audio )
    if( props !== undefined ) {
      Object.assign( drums, props )
      if( props.__presetInit__ !== undefined ) props.__presetInit__.call( drums, Audio )
    }

    drums.name = 'Drums'
    return drums
  }
  Drums.prefix = '.'

  const EDrums = function(  ...args ) {
    const temp = Audio.autoConnect
    Audio.autoConnect = false
    
    const kd = Audio.instruments.Kick()
    const sd = Audio.instruments.Snare()
    const ch = Audio.instruments.Hat({ decay:.1, gain:.3 })
    const oh = Audio.instruments.Hat({ decay:.5, gain:.3 })
    const cp = Audio.instruments.Clap()
    const cb = Audio.instruments.Cowbell({ gain:.65 })
    
    Audio.autoConnect = temp
    
    const drums = Audio.Ensemble({
      'kd': { target:kd, method:'trigger', args:[1], name:'kick' },
      [0]: { target:kd, method:'trigger', args:[1], name:'kick' },
      [1]: { target:sd, method:'trigger', args:[1], name:'snare' },
      'sd': { target:sd, method:'trigger', args:[1], name:'snare' },
      [2]: { target:ch, method:'trigger', args:[.2], name:'closedHat' },
      'ch': { target:ch, method:'trigger', args:[.2], name:'closedHat' },
      [3]: { target:oh, method:'trigger', args:[.2], name:'openHat' },
      'oh': { target:oh, method:'trigger', args:[.2], name:'openHat' },
      [4]: { target:cp, method:'trigger', args:[.5], name:'clap' },
      'cp': { target:cp, method:'trigger', args:[.5], name:'clap' },
      [5]: { target:cb, method:'trigger', args:[.5], name:'cowbell' },
      'cb': { target:cb, method:'trigger', args:[.5], name:'cowbell' },
    })

    //if( typeof score === 'string' ) {
    //  drums.seq = Audio.Seq({
    //    target:drums,
    //    key:'play',
    //    values:score.split(''),
    //    timings:time === undefined ? 1 / score.length : time,
    //    rate:Audio.Clock.audioClock
    //  }).start()

    //  drums.values = drums.seq.values
    //  drums.timings = drums.seq.timings
    //}

    if( Audio.autoConnect === true ) drums.connect()

    props = Presets.process( { name:'EDrums', category:'instruments' }, args, Audio )
    if( props !== undefined && props.__presetInit__ !== undefined ) {
      props.__presetInit__.call( drums, Audio )
    }

    //drums.tidal = pattern => {
    //  if( drums.__tidal !== undefined ) drums.__tidal.stop()

    //  drums.__tidal = Audio.Tidal({
    //    target:drums,
    //    key:'play',
    //    pattern
    //  }).start()

    //  return drums
    //}

    drums.name = 'EDrums'
    return drums
  }

  return { Drums, EDrums }
}

},{"./presets.js":100,"./ugen.js":122}],89:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Effects = {
  create( Audio ) {
    const effects = {}
    const poolEffects = ['Freeverb', 'Plate', 'BufferShuffler']
    Gibberish.effects = Gibberish.fx

    for( let effectName in Gibberish.effects ) {
      const gibberishConstructor = Gibberish.effects[ effectName ]

      const methods = Effects.descriptions[ effectName ] === undefined ? null : Effects.descriptions[ effectName ].methods

      // XXX how do we make this more generic for any model of reverb / any type of distortion etc.
      const replaceName = effectName === 'Freeverb' ? 'Reverb' : effectName 
      const description = { 
        properties:gibberishConstructor.defaults || {}, 
        methods:methods,
        name:replaceName,
        category:'effects'
      }
      description.properties.type = 'fx'

      const shouldUsePool = poolEffects.indexOf( effectName ) > -1 

      effects[ replaceName ] = Ugen( gibberishConstructor, description, Audio, shouldUsePool )
      
      effects[ replaceName ].presets = Audio.Presets.effects[ replaceName ] 
      if( effects[ replaceName ].presets !== undefined ) {
        effects[ replaceName ].presets.inspect = function() {
          console.table( this )
        }
      }else{
        effects[ replaceName ].presets = { inspect() { console.log( `${effectName} has no presets.` ) } }
      }
    }

    return effects
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Effects

},{"./ugen.js":122,"gibberish-dsp":169}],90:[function(require,module,exports){
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

},{}],91:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Envelopes = {
  create( Audio ) {
    const envelopes = {}

    for( let envelopeName in Gibberish.envelopes ) {
      const gibberishConstructor = Gibberish.envelopes[ envelopeName ]

      const methods = Envelopes.descriptions[ envelopeName ] === undefined ? null : Envelopes.descriptions[ envelopeName ].methods
      const description = { 
        properties:gibberishConstructor.defaults || {}, 
        methods:methods,
        name:envelopeName,
        category:'envelopes'
      }
      description.properties.type = 'envelope'

      envelopes[ envelopeName ] = Ugen( gibberishConstructor, description, Audio )
    }
    return envelopes
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Envelopes

},{"./ugen.js":122,"gibberish-dsp":169}],92:[function(require,module,exports){

// See all scales at: http://abbernie.github.io/tune/scales.html


const Tune = function(){

	// the scale as ratios
	this.scale = []

	// i/o modes
	this.mode = {
		output: "frequency",
		input: "step"
	}

	// ET major, for reference
	this.etmajor= [ 261.62558,
		293.664764,
		329.627563,
		349.228241,
		391.995422,
		440,
		493.883301,
		523.25116
	]

  
  this.TuningList = null
	// Root frequency.
	this.tonic = 440

	console.log("{{{{ Tune.js v0.1 Loaded }}}}");

}

/* Set the tonic frequency */

Tune.prototype.tonicize = function(newTonic) {
	this.tonic = newTonic
}

/* Return data in the mode you are in (freq, ratio, or midi) */

Tune.prototype.note = function(input,octave){

	var newvalue;

	if (this.mode.output == "frequency") { 
		newvalue = this.frequency(input,octave)
	} else if (this.mode.output == "ratio") { 
		newvalue = this.ratio(input,octave)
	} else if (this.mode.output == "MIDI") { 
		newvalue = this.MIDI(input,octave)
	} else {
		newvalue = this.frequency(input,octave)
	}

	
	return newvalue;

}


/* Return freq data */

Tune.prototype.frequency = function(stepIn, octaveIn) {

	if (this.mode.input == "midi" || this.mode.input == "MIDI" ) {
		this.stepIn += 60
	}
	
	// what octave is our input
	var octave = Math.floor(stepIn/this.scale.length)

	if (octaveIn) { 
		octave += octaveIn
	}
	
	// which scale degree (0 - scale length) is our input
	var scaleDegree = stepIn % this.scale.length

	while (scaleDegree < 0) {
		scaleDegree += this.scale.length
	}
	
	var freq = this.tonic*this.scale[scaleDegree]
	
	freq = freq*(Math.pow(2,octave))
	
	// truncate irrational numbers
	freq = Math.floor(freq*100000000000)/100000000000
	
	return freq

}

/* Force return ratio data */

Tune.prototype.ratio = function(stepIn, octaveIn) {

	if (this.mode.input == "midi" || this.mode.input == "MIDI" ) {
		this.stepIn += 60
	}
	
	// what octave is our input
	var octave = Math.floor(stepIn/this.scale.length)

	if (octaveIn) { 
		octave += octaveIn
	}
	
	// which scale degree (0 - scale length) is our input
	var scaleDegree = stepIn % this.scale.length

	// what ratio is our input to our key
	var ratio = Math.pow(2,octave)*this.scale[scaleDegree]

	ratio = Math.floor(ratio*100000000000)/100000000000

	return ratio

}

/* Force return adjusted MIDI data */

Tune.prototype.MIDI = function(stepIn,octaveIn) {

	var newvalue = this.frequency(stepIn,octaveIn)

	var n = 69 + 12*Math.log(newvalue/440)/Math.log(2)

	n = Math.floor(n*1000000000)/1000000000

	return n

}

/* Load a new scale */

Tune.prototype.loadScale = function(name){

	/* load the scale */
	var freqs = this.TuningList[name].frequencies
	this.scale = []
	for (var i=0;i<freqs.length-1;i++) {
		this.scale.push(freqs[i]/freqs[0])
	}

	/* visualize in console */
	//console.log(" ");
	//console.log("LOADED "+name);
	//console.log(this.TuningList[name].description);
	//console.log(this.scale);
	//var vis = [];
	//for (var i=0;i<100;i++) {
	//  vis[i] = " ";
	//}
	//for (var i=0;i<this.scale.length;i++) {
	//  var spot = Math.round(this.scale[i] * 100 - 100);
	//  if (i<10) {
	//    vis.splice(spot,1,i+1);
	//  } else {
	//    vis.splice(spot,5,i+1);
	//  }
	//}
	//var textvis = "";
	//for (var i=0;i<vis.length;i++) {
	//  textvis += vis[i];
	//}
	//console.log(name)
	//console.log(textvis)
	//// ET scale vis
	//var vis = [];
	//for (var i=0;i<100;i++) {
	//  vis[i] = " ";
	//}
	//for (var i=0;i<this.etmajor.length;i++) {
	//  var spot = Math.round(this.etmajor[i]/this.etmajor[0] * 100 - 100);
	//  if (i<10) {
	//    vis.splice(spot,1,i+1);
	//  } else {
	//    vis.splice(spot,5,i+1);
	//  }
		
	//}
	//var textvis = "";
	//for (var i=0;i<vis.length;i++) {
	//  textvis += vis[i];
	//}
	//console.log(textvis)
	//console.log("equal-tempered major (reference)")
}

/* Search the names of tunings
	 Returns an array of names of tunings */

Tune.prototype.search = function(letters) {
	var possible = []
	for (var key in this.TuningList) {
		if (key.toLowerCase().indexOf(letters.toLowerCase())!=-1) {
			possible.push(key)
		}
	}
	return possible
}

/* Return a collection of notes as an array */

Tune.prototype.chord = function(midis) {
	var output = []
	for (var i=0;i<midis.length;i++) {
		output.push(this.note(midis[i]))
	}
	return output;
}


/* Change the tonic frequency? */

Tune.prototype.root = function(newmidi, newfreq) {
	this.rootFreq = newfreq
	// not working now ... needs much work.
	// setKey is not transposing now, either.
}

module.exports = Tune

},{}],93:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const filterNames = [
  "none", "Filter24Moog", "Filter24TB303", "Filter12SVF", "Filter12Biquad", "Filter24Classic"
]

const Filters = {
  create( Audio ) {
    const filters = {}

    for( let filterName in Gibberish.filters ) {
      const gibberishConstructor = Gibberish.filters[ filterName ]

      const methods = Filters.descriptions[ filterName ] === undefined ? null : Filters.descriptions[ filterName ].methods
      const description = { 
        properties:gibberishConstructor.defaults || {}, 
        methods:methods,
        name:filterName,
        category:'effects'
      }
      description.__defaults__ = { isStereo : true }
      description.properties.isStereo = true
      description.properties.type = 'fx'

      filters[ filterName ] = Ugen( gibberishConstructor, description, Audio, false )
    }

    filters.LPF = filters.Filter24Moog

    filters.Filter = function( props ) {
      if( props === undefined ) props = { model: 1 }
      if( props.model === undefined ) props.model = 1

      const name = filterNames[ props.model ]

      delete props.model

      return filters[ name ]( props ) 
    }

    const description = { 
      properties: Object.assign( {}, Gibberish.filters[ 'Filter12Biquad' ].defaults, { mode:1 } ),
      methods:null,
      name:'HPF',
      category:'effects',
      __defaults__: { mode:1 }
    }
   
    filters.HPF = Ugen( Gibberish.filters[ 'Filter12Biquad' ], description, Audio, false )

    return filters
  },

  descriptions: {
    //Chorus:{ methods:[] },
  },
  
}

module.exports = Filters

},{"./ugen.js":122,"gibberish-dsp":169}],94:[function(require,module,exports){
module.exports = function( Audio ) {
  const token = '6a00f80ba02b2755a044cc4ef004febfc4ccd476'

  const Freesound = function( query, options ) {
    const props = Object.assign( {}, Freesound.defaultProps,  typeof query === 'object' ? query : options )
    const sampler = Audio.instruments[ props.type ]( props )
    if( sampler.loadSample === undefined ) sampler.loadSample = sampler.__wrapped__.loadSample
    setTimeout( ()=>queries[ typeof query ]( query, sampler, props.count ), 0 )
 
    return sampler
  }

  Freesound.loaded = {}
  Freesound.queries = {}
  Freesound.defaultProps = { count:1, maxVoices:1, panVoices:true, type:'Multisampler' }
  Freesound.defaults = {
    sort: 'downloads',
    single:true,
    filename:false,
    min: 0,
    max: .5,
    reverse:false,
    count:15
  }

  // add Freesound[5] notation...
  for( let i = 0; i < 20; i++ ) {
    Freesound[ i ] = function( ...args ) {
      if( args.length > 0 ) {
        if( typeof args[0] === 'string' ) {
          if( args.length > 1 ) {
            if( typeof args[1] === 'object' ) {
              args[1].maxVoices = i || 1
            } 
          }else{
            args[1] = { maxVoices:i || 1 }
          }
        }else if( typeof args[0] === 'object' ) {
          args[0].maxVoices = i || 1
        }
      }else{
        args[0] = { maxVoices:i || 1 }
      } 

      return Freesound( ...args ) 
    }
  }

  const queries = {
    number( id, sampler, num=0 ) {
      if (typeof Freesound.loaded[ id ] === 'undefined') {
        fetch( `https://freesound.org/apiv2/sounds/${id}/?&format=json&token=${token}` )
          .then( response => response.json() )
          .then( json => {
            const path = json.previews[ 'preview-hq-mp3' ]
            
            //sampler.loadSample( path )
            sampler.loadSample( path, (__sampler,buffer) => {
              Freesound.loaded[ id ] = buffer.data.buffer
            })

            console.log( 'freesound now loading:', path )
          }) 
      }else{
        if( Audio.Gibberish.mode === 'worklet' ) {
          console.log( 'reusing loaded freesound:', id )
          sampler.loadSample( id, null, Freesound.loaded[ id ] )
        }
      }
    },

    // search for text query, and then use returned id to 
    // fetch by number 
    string( query, sampler, count, originalQuery ) {
      sampler.length = count
      let queryString ='https://freesound.org/apiv2/search/text/?'

      console.group('Querying Freesound for: ' + originalQuery || query )
      if( query.indexOf( 'query' ) > -1 ) {
        queryString += query
        queryString += `&token=${token}&fields=name,id,previews,username,license&page_size=${count} `
      }else{
        queryString += `query=${query}&token=${token}&fields=name,id,previews,username,license&filter=original_filename:${query.split(' ')[0]} ac_single_event:true&sort=downloads_desc&page_size=${count}`

      }

      fetch( queryString )
        .then( data => data.json() )
        .then( sounds => {
          if( sounds.results.length > 0 ) {
            if( sounds.results.length > count ) sounds.results = sounds.results.slice(0,count)
            console.log(`%c${sounds.results.length} sounds found. Starting downloads:`, `background:black;color:white`)
          }else{
            console.log(`%cNo sounds were found for this query!`, `background:red;color:white`)
          }
          sampler.length = count < sounds.results.length ? count : sounds.results.length
          console.table( sounds.results.map( r=>({file:r.name, id:r.id, author:r.username,license:'CC/'+r.license.split('/').slice(4).join('/') }) ) )
          for( let i = 0; i < sampler.length; i++ ) {
            const result = sounds.results[i]
            if( result !== undefined ) {
              const filename = result.name,
                    id = result.id,
                    url = result.previews[ 'preview-hq-mp3' ] 

              if( Freesound.loaded[ url ] === undefined ) {
                //console.log( `%c${filename}`, `color:white;background:#333333;` )

                sampler.loadSample( url, (__sampler,buffer) => {
                  Freesound.loaded[ url ] = buffer.data.buffer
                })

              }else{
                // XXX memoing the files causes an error
                if( Gibberish.mode === 'worklet' ) {
                  //console.log( 'reusing freesound file:', filename )
                  sampler.loadSample( url, null, Freesound.loaded[ url ] )
                }
              }
            }
          }
          console.groupEnd()
        })
    },

    object( queryObj, sampler ) {
      const q = Object.assign( {}, Freesound.defaults, queryObj )
 
      let query = `query=${q.query}&format=json`
  
      query += `&filter=duration:[${q.min} TO ${q.max}]`
      if( q.single ) query += ` ac_single_event:true`
      if( q.filename ) query += ` original_filename:${q.query}`

      let sort = q.sort

      // user error check
      if( sort === 'ratings' ) sort = 'rating'

      sort += q.reverse ? '_asc' : '_desc'

      query += `&sort=${sort}`

      queries.string( query, sampler, q.count, q.query )
    }
  }

  return Freesound
}

},{}],95:[function(require,module,exports){
module.exports = function( Audio ) {
  
const binops = [ 
  'min','max','add','sub','mul','div','rdiv','mod',
  'and','or','gt','eq','eqp','gte','gtep','gtp','lt','lte','ltep','ltp','neq',
  'step' 
]

const monops = [
  'abs','acos','acosh','asin','asinh','atan','atan2','atanh','cos','cosh',
  'sin','sinh','tan','tanh', 'floor',
  'ceil', 'round', 'sign', 'trunc', 'fract', 'param', 'in'
]

const noops = [
  'noise', 'bang'
]

const Gen  = {
  lastConnected:[],
  names:[],
  connected: [],

  isGen:true,
  debug:false,

  wavetable( frequency, props ) {
    const g = Audio.Gibberish.genish 
    let dataProps = { immutable:true }

    // use global references if applicable
    if( props.name !== undefined ) dataProps.global = props.name

    const buffer = Gen.ugens.data( props.buffer, 1, dataProps )

    return Gen.ugens.peek( buffer, Gen.ugens.phasor( frequency, 0, { min:0 } ) )
  },

  init() {
    Gen.ugens.wavetable = Gen.__wavetable
    Gen.createBinopFunctions()
    Gen.createMonopFunctions()

    Gen.names.push( ...binops )
    Gen.names.push( ...monops )
    Gen.names.push( ...Object.keys( Gen.constants ) )
    Gen.names.push( ...Object.keys( Gen.functions ) )
    //Gen.names.push( ...Object.keys( Gen.composites ) )
    Gen.names.push( 'gen' )
    Gen.names.push( 'line')
    Gen.names.push( 'lfo' )
    Gen.names.push( 'sine' )
    Gen.names.push( 'square' )
    Gen.names.push( 'tri' )
    Gen.names.push( 'saw' )

    //Gibber.subscribe( 'clear', ()=> Gen.lastConnected.length = 0 )
  },

  // if property is !== ugen (it's a number) a Param must be made using a default
  create( name ) {
    // rate needs custom function to skip sequencing input and only sequence rate adjustment

    const params = Array.prototype.slice.call( arguments, 1 )

    if( name === 'rate' ) return Gen.createRate( name, ...params )

    const obj = Object.create( this )
    let count = 0
    
    obj.name = name
    obj.active = false
    
    for( let key of Gen.functions[ name ].properties ) { 
      let value = params[ count++ ] || 0
      obj[ key ] = v => {
        if( v === undefined ) {
          return value
        }else{
          value = v
          if( obj.active ) {
            if( obj.__client === 'live' ) {
              Gibber.Communication.send( `genp ${obj.paramID} ${obj[ key ].uid} ${v}` ) 
            }else if( obj.__client === 'max' ) {
              Gibber.Communication.send( `sig ${obj.paramID} param ${obj[ key ].uid} ${v}`, 'max' ) 
            }
          }
        }
      }
      obj[ key ].uid = Gen.getUID()
 
      // XXX Gibber.addSequencingToMethod( obj, key )
    }

    // accomodate non-audio-rate options. during codegen the compiler
    // will check for the options property; if it exists it will write
    // the options into the generated code.
    if( params.length > Gen.functions[ name ].properties.length ) {
      obj.options = params[ Gen.functions[ name ].properties.length ]
    }

    return obj
  },

  createRate( name ) {
    let obj = Object.create( this ),
        count = 0,
        param = arguments[1] 
    
    obj.name = 'rate' 
    obj.active = false
    
    let value = param
    //console.log( 'value:', value, 'args:', arguments )
    obj[ 0 ] = v => {
      if( v === undefined ) {
        return value
      }else{
        value = v
        if( obj.active ) {
          Gibber.Communication.send( `genp ${obj.paramID} ${obj[ 0 ].uid} ${v}` ) 
        }
      }
    }

    Gen.getUID() // leave 0 behind...
    obj[ 0 ].uid = Gen.getUID()

    Gibber.addSequencingToMethod( obj, '0' )

    return obj
  },
 
  createBinopFunctions() {
    for( let key of binops ) {
      Gen.functions[ key ] = {
        properties:['0','1'], str:key
      }
    }
  },

  createMonopFunctions() {
    for( let key of monops ) {
      Gen.functions[ key ] = {
        properties:['0'], str:key
      }
    }
  },

  assignTrackAndParamID: function( track, id ) {
    this.paramID = id
    this.track = track

    let count = 0, param
    while( param = this[ count++ ] ) {
      if( typeof param() === 'object' ) {
        param().assignTrackAndParamID( track, id )
      }
    }
  },

  clear() {
    for( let ugen of Gen.connected ) {
      Gibber.Communication.send( `ungen ${ugen.paramID}` )
    }

    Gen.connected.length = 0
  },

  constants: {
    degtorad: Math.PI / 180,
    E :       Math.E,
    halfpi:   Math.PI / 2,
    invpi :   Math.PI * - 1,
    ln10  :   Math.LN10,
    ln2   :   Math.LN2,
    log10e:   Math.LOG10E,
    log2e :   Math.LOG2E,
    pi    :   Math.PI,  
    sqrt2 :   Math.SQRT2,
    sqrt1_2:  Math.SQRT1_2,
    twopi :   Math.PI * 2,
    samplerate: 'samplerate'
  },

  functions: {
    phasor: { properties:[ '0','1' ],  str:'phasor' },
    cycle:  { properties:[ '0' ],  str:'cycle' },
    phasorN:{ properties:[ '0','1' ],  str:'phasorN' },
    cycleN: { properties:[ '0' ],  str:'cycleN' },
    train:  { properties:[ '0','1' ],  str:'train' },
    rate:   { properties:[ '0' ], str:'rate' },
    noise:  { properties:[], str:'noise' },
    bang:   { properties:[], str:'bang' },
    accum:  { properties:[ '0','1' ], str:'accum' },
    counter:{ properties:[ '0','1' ], str:'counter' },
    scale:  { properties: ['0', '1', '2', '3'], str:'scale' },
    sah:    { properties: ['0', '1', '2'], str:'sah' },
    clamp:  { properties: ['0', '1', '2'], str:'clamp' },
    ternary:{ properties: ['0', '1', '2'], str:'switch' },
    selector:{ properties: ['0', '1', '2'], str:'selector' },
    peek:   { properties:['0','1'], str:'peek' },
    data:   { properties:[], str:'data' }
  },

  _count: 0,

  getUID() {
    return 'p' + Gen._count++
  },

  time: 'time',

  out() {
    let paramArray = [],
        body, out
    
    body = this.gen( paramArray )

    out = paramArray.join( ';' )

    if( paramArray.length ) {
      out += ';'
    }
    
    out += 'out1='
    out += body + ';'
    
    if( Gen.debug ) console.log( out )

    return out
  },

  genMax( paramArray ) {
    let def = Gen.functions[ this.name ],
        str = def.str + '(',
        count = 0
    
    // tell Gibber that this gen object is part of an active gen graph
    // so that changes to it are forwarded to m4l
    this.active = true

    if( this.name === 'rate' ) {
      str += 'in1, '
      let pName = this[ 0 ].uid
      str += pName
      paramArray.push( `Param ${pName}(${this[0]()})` )
    }else{
      for( let property of def.properties ) {
        let p = this[ property ](),
            uid = this[ property ].uid
        
        //console.log( this.name, property, def.properties, uid )
        if( Gen.isPrototypeOf( p ) ) {
          str += p.gen( paramArray )
        }else if( typeof p === 'number' ) {
          let pName = uid
          str += pName
          paramArray.push( `Param ${pName}(${p})` )
        }else if( p === Gen.time ) {
          str += p
        }else if( typeof p === 'string' ) {
          str += p
        }else{
          console.log( 'CODEGEN ERROR:', p )
        }

        if( count++ < def.properties.length - 1 ) str += ','
      }
    }
    
    str += ')'

    return str
  },

  gen( paramArray ) {
    let def = Gen.functions[ this.name ],
        str = `g.${def.str}(`,
        count = 0
    
    // tell Gibber that this gen object is part of an active gen graph
    // so that changes to it are forwarded to m4l
    this.active = true

    for( let property of def.properties ) {
      let p = this[ property ](),
          uid = this[ property ].uid
      
      //console.log( this.name, property, def.properties, uid )
      if( Gen.isPrototypeOf( p ) ) {
        str += p.gen( paramArray )
      }else if( typeof p === 'number' ) {
        let pName = 'p'+paramArray.length
        //str += pName
        paramArray.push( [`${pName}`, p ] )
        str += `g.in('${pName}')`
      }else if( p === Gen.time ) {
        str += p
      }else if( typeof p === 'string' ) {
        str += p
      }else if( typeof p === 'object' && p.type ==='gen' ) { 
        let pName = 'p'+paramArray.length
        //str += pName
        p.toString = new Function(`return 'v_${p.id}'`)
        paramArray.push( [`${pName}`, p ] )
        str += `g.in('${pName}')`
        // if another gen graph... but 
        //str += `'v_${p.id}'` 
      }else{
        console.log( 'CODEGEN ERROR:', p )
      }

      if( count++ < def.properties.length - 1 ) str += ','
    }

    if( this.options !== undefined ) {
      str += ',' + JSON.stringify( this.options )
    }
    
    str += ')'
    //console.log( str )

    return str
  },

  composites: { 
    line( period=4, min=0, max=1 ) {
      const range = max - min
      // XXX 4 is magic number, only works as long as we're in 4/4
      return Gen.make( Gen.ugens.add( min, Gen.ugens.mul( Gen.ugens.phasor( Audio.Utilities.btof( period * 4 ), 0, { min:0 } ), range )))
    },
    sine( frequency=2, amp=4, center=0, shouldRound=false ) {
      return Gen.composites.lfo( 'sine', frequency, amp, center, shouldRound )
    },
    siner( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'sine', frequency, amp, center, true )
    },
    square( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'square', frequency, amp, center )
    },
    saw( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'saw', frequency, amp, center )
    },
    tri( frequency=2, amp=4, center=0 ) {
      return Gen.composites.lfo( 'tri', frequency, amp, center )
    },
    lfo( type = 'sine', frequency = 2, amp = .5, center = .5, shouldRound = false ) {
      const g = Gen.ugens 
      const gibberish= Audio.Gibberish
      let osc

      switch( type ) {
        case 'saw':
          osc = g.phasor( frequency )
          break
        case 'square':
          osc = g.add( g.mul( g.gt( g.phasor( frequency ), 0 ), 2 ), -1 )
          break
        case 'noise':
          osc = g.sub( g.mul( g.noise(), 2 ), 1 )
          break
        case 'triangle':
        case 'tri':
          const p = g.phasor( frequency )
          osc = g.sub(
            1, 
            g.mul( 
              4, 
              g.abs(
                g.sub( 
                  g.round( p ),
                  p
                )
              )
            )
          )
            
          break
        case 'sine':
        default:
          osc = g.cycle( frequency )
          break
      }

      const _mul   = g.mul( osc, amp ),
            _add   = g.add( center, _mul ) 

      const lfo = shouldRound 
        ? Gen.make( g.round( _add ), ['bias', 'frequency', 'gain'] ) 
        : Gen.make( _add, [ 'bias', 'frequency', 'gain'] )

      Object.defineProperties( lfo, {
        frequency: {
          configurable:true,
          set(v) { lfo.rendered.p1 = v },
          get()  { return lfo.rendered.p1 }
        },
        gain: {
          configurable:true,
          set(v) { lfo.rendered.p2 = v },
          get()  { return lfo.rendered.p2 }
        },
        bias: {
          configurable:true,
          set(v) { lfo.rendered.p0 = v },
          get()  { return lfo.rendered.p0 }
        }
      })

      lfo.copy = function() {
        return Gen.composites.lfo( type, this.frequency.value, this.gain.value, this.bias.value )
      }

      return lfo
    },

    fade( time = 1, from = 1, to = 0 ) {
      let g = Gen.ugens
      let fade, amt, beatsInSeconds = time * ( 60 / Gibber.Live.LOM.bpm )
     
      if( from > to ) {
        amt = from - to

        fade = g.gtp( g.sub( from, g.accum( g.div( amt, g.mul(beatsInSeconds, g.samplerate ) ), 0 ) ), to )

      }else{
        amt = to - from
        fade = g.add( from, g.ltp( g.accum( g.div( amt, g.mul( beatsInSeconds, g.samplerate ) ), 0 ), to ) )
      }
      
      // XXX should this be available in ms? msToBeats()?
      let numbeats = time / 4
      fade.shouldKill = {
        after: numbeats, 
        final: to
      }
      
      return fade
    },
    
    //beats( num ) {
    //  return Gen.ugens.rate( num )
    //  // beat( n ) => rate(in1, n)
    //  // final string should be rate( in1, num )
    //}
    beats( b ) {
      return Gen.ugens.phasor( Audio.Utilities.btof( b ), 0, { min:0 } )
    }, 
    beats2( b ) {
      return Gen.ugens.phasor( 
        Audio.Utilities.btof( b ), 
        0, 
        { min:0 } )
    }, 
  },

  ugens:{},

  export( obj ) {
    for( let key in Gen.functions ) {
      this.ugens[ key ] = Gen.create.bind( Gen, key )
    }

    Object.assign( this.ugens, Gen.constants )
    Object.assign( this.ugens, Gen.composites )

    const __in = this.ugens.in
    delete this.ugens.in
    Object.assign( obj, this.ugens )
    this.ugens.in = __in
  },


  // defer creating genish object until we know whether
  // this will be used by an audio or visual object
  make( graph, propertyNames ) {
    const defer = { 
      graph, 
      __graph:graph,
      propertyNames,
      type:'gen',
      id: Audio.Gibberish.utilities.getUID(),
      rendered:null,
      copy() {
        return Gen.make( this.__graph )
      },
      render( samplerate=44100, type='audio' ) {
        if( type === 'audio' ) {
          if( this.rendered === null ) { 
            this.rendered = Gen.__make( this.graph, this.propertyNames, defer )
            const props = this.rendered.__wrapped__.__properties__
            for( let key in props ) { 
              Object.defineProperty( this, key, {
                configurable:true,
                get() { return this.rendered[ key] },
                set(v){
                  this.rendered[ key ] = v 
                }
              })
            } 
            this.rendered.widget = this.widget
            this.rendered.__graph = graph
          }

          return this.rendered
        }

        const store = Audio.Gibberish.genish.samplerate
        const g = Audio.Gibberish.genish

        Audio.Gibberish.genish.gen.samplerate = samplerate
        const params = []
        const __graph = eval( graph.gen( params ) )
        const callback = g.gen.createCallback( __graph )
        Audio.Gibberish.genish.gen.samplerate = store      

        const out = callback.bind( null, ...params.map( v => v[1] ), g.memory )

        // annotations can be added to the original defer, so store the defer
        // to access the annotations later
        out.pre = defer 

        return out
      },

      // XXX connecting gen objects to audio properties no longer seems
      // to work... must be assigned. FIX
      connect( target ) {
        if( target.type === 'audio' ) {
          if( this.rendered === null ) { 
            this.rendered = Gen.__make( this.graph, this.propertyNames, defer )
          }
          this.rendered.connect( target )
        }
      }
    }

    return defer
  },

  __make( graph, propertyNames, target ) {
    const ugen = Audio.Gibberish.prototypes.Ugen
    const g = Audio.Gibberish.genish

    // store properties of our gen object in this array
    // they will then become properties of our Gibber object
    const paramArray = []

    // get genish.js codelet for our graph
    const genCode = graph.gen( paramArray )

    // create a properties object out of our paramArray
    const params = {}
    for( let param of paramArray ) {
      params[ param[0] ] = param[1]
    } 

    const id = Gen.getUID()

    params.id = Audio.Gibberish.utilities.getUID()

    // pass a constructor to our worklet processor
    Audio.Gibberish.worklet.port.postMessage({ 
      address:'addMethod', 
      id:-1,
      key:'Gen' + id,
      function:`function() { 
        const g = Gibberish.genish; 
        const mymod = Object.create( Gibberish.prototypes.Ugen ); 
        Gibberish.factory( mymod, ${genCode}, 'Gen${id}', ${JSON.stringify(params)}, null, true ); 
        return mymod; 
      }`
    })

    // create a worklet-side Gibberish constructor
    const make = function() {
      const mymod = Object.create( ugen )
      // the second parameter doesn't matter in the worklet, only in the processor
      // so we can just input zeroes. hmmmm... I gues it probably matters for
      // sequencing?
      
      return Audio.Gibberish.factory( mymod, g.add(0,0), 'Gen'+id, params )
    }

    // XXX do I really have to make a Gibberish constructor and a Gibber constructor to
    // turn a genish graph into a Gibber ugen? Is there a shortcut to take? Is it worth
    // writing custom code for?

    // create a Gibber constructor using our Gibberish constructor
    let temp = params.id
    //delete params.id
    const Make = Audio.Ugen( make, { name:'Gen'+id, properties:params, methods:[]}, Audio )

    // create Gibber ugen and pass in properties dictionary to initailize
    const out = Make({ params })
    out.__wrapped__.id = temp 
    out.__wrapped__.connected = []

    let count = 0
    out.__wrapped__.output = out.output = function( v ) {
      //if( Audio.Gibber.Environment !== undefined ) {
        // XXX should these be averaged instead of only taking every sixth sample (roughly
        // corresponds to 58 frames a second)
        if( count++ % 6 === 0 ) {
          // XXX this shouldn't happen here, should happen when the annotation is created.
          if( Audio.Gibber.Environment !== undefined ) {
            if( Audio.Gibber.Environment.Annotations.waveform.widgets[ temp ] === undefined ) {
              Audio.Gibber.Environment.Annotations.waveform.widgets[ temp ] = out.widget
            }
            Audio.Gibber.Environment.Annotations.waveform.updateWidget( out.widget, v, false )
          }
        }
      //}

      out.output.value = v
    }

    // optionally map user provided names to p values for better control / sequencing
    if( Array.isArray( propertyNames )) {
      for( let i = 0; i < propertyNames.length; i++ ){
        const propertyName = propertyNames[ i ]
        const desc = Object.getOwnPropertyDescriptor( target, propertyName )
        if( out[ 'p'+i ] !== undefined && propertyName !== null && propertyName !== undefined ){
          out[ '__'+propertyName ] = out[ 'p'+i ]
          Object.defineProperty( out, propertyName, {
            configurable:true,
            get() { return out[ '__' + propertyName ] },
            set(v){
              if( v === undefined || v === null ) return
              out[ '__' + propertyName ].value = v
            }
          })
          Object.defineProperty( target, propertyName, {
            configurable:true,
            get() { return out[ '__' + propertyName ] },
            set(v){
              if( v === undefined || v === null ) return
              out[ '__' + propertyName ].value = v

              if( typeof desc.set === 'function' ) desc.set.call( target, v )
            }
          })

        } 
      }
    }


    out.id = temp
    out.__isGen = out.__wrapped__.__isGen = true
    out.type = 'gen'

    return out
  }
}

Gen.init()

return Gen 
}

},{}],96:[function(require,module,exports){
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

},{"./audio.js":83,"gibber.core.lib":129}],97:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Instruments = {
  create( Audio ) {
    const instruments = { extensions:{} }
    //const pooledInstruments = ['Synth','Monosynth','FM']
    for( let instrumentName in Gibberish.instruments ) {
      const gibberishConstructor = Gibberish.instruments[ instrumentName ]
      if( typeof gibberishConstructor.defaults === 'object' ) gibberishConstructor.defaults.octave = 0

      const methods = Instruments.descriptions[ instrumentName ] === undefined ? null : Instruments.descriptions[ instrumentName ].methods
      const description = { 
        properties:gibberishConstructor.defaults, 
        methods:methods,
        name:instrumentName,
        category:'instruments'
      }

      //const shouldPool = pooledInstruments.indexOf( instrumentName ) > -1
      //const constructor = Ugen( gibberishConstructor, description, Audio, false ) 
      //instruments[ instrumentName ] = function(...args) {
      //  let instr = constructor( ...args )
      //  if( instruments.extensions[ instrumentName ] !== undefined ) {
      //    instr = Object.assign( instr, extensions[ instrumentName ] ) 
      //  }
      //  return instr
      //}

      instruments[ instrumentName ] = Ugen( gibberishConstructor, description, Audio, false ) 
      // for poly notation like Synth[3]()
      // create or extend dictionary with maxVoices property
      for( let i = 0; i < 20; i++ ) {
        instruments[ instrumentName ][i] = function( ...args ) {
          if( args.length > 0 ) {
            if( typeof args[0] === 'string' ) {
              if( args.length > 1 ) {
                if( typeof args[1] === 'object' ) {
                  args[1].maxVoices = i || 1
                } 
              }else{
                args[1] = { maxVoices:i || 1 }
              }
            }else if( typeof args[0] === 'object' ) {
              args[0].maxVoices = i || 1
            }
          }else{
            args[0] = { maxVoices:i || 1 }
          } 

          // use monophonic version if voice count is 1 or less
          let name
          if( i > 1 && instrumentName !== 'Multisampler' ) {
            name = 'Poly'+instrumentName
            if( name === 'PolyMonosynth' ) name = 'PolyMono' 
          }else{
            name = instrumentName
          }

          let instr =  instruments[ name ]( ...args )

          // mixin extra functions as needed
          //if( instruments.extensions[ instrumentName ] !== undefined ) {
          //  instr = Object.assign( instr, extensions[ instrumentName ] ) 
          //}
          return instr
        }
      }


      instruments[ instrumentName ].presets = Audio.Presets.instruments[ instrumentName ] 
      if( instruments[ instrumentName ].presets !== undefined ) {
        instruments[ instrumentName ].presets.inspect = function() {
          console.table( this )
        }
      }else{
        instruments[ instrumentName ].presets = { 
          inspect() { console.log( `${instrumentName} has no presets.` ) } 
        }
      }
      instruments[ instrumentName ].presets.list = function() {
        const names = Object.keys( this )
        names.splice( names.indexOf( 'inspect' ), 1 )
        names.splice( names.indexOf( 'list' ), 1 )
        console.group( `${instrumentName} presets` )
        names.forEach( v=>console.log(v) )
        console.groupEnd()
      }
    }
    instruments.Pluck = instruments.Karplus
    instruments.Sampler = instruments.Multisampler
    return instruments
  },

  descriptions: {
    Clap:{
      methods:[ 'trigger' ],
    },   
    Conga:{
      methods:[ 'note','trigger' ],
    },
    Clave:{
      methods:[ 'note','trigger' ],
    },
    Cowbell:{
      methods:[ 'note','trigger' ],
    },
    FM:{
      methods:[ 'note','trigger' ],
    },
    Hat:{
      methods:[ 'note','trigger' ],
    },
    Karplus:{
      methods:[ 'note','trigger' ],
    },
    Kick:{
      methods:[ 'note','trigger' ],
    },
    Monosynth:{
      methods:[ 'note','trigger' ],
    },
    Sampler:{
      methods:[ 'note', 'trigger', 'loadFile', 'loadBuffer' ],
    },
    Multisampler:{
      methods:[ 'note', 'trigger', 'pick', 'pickFile', 'pickplay', 'loadSample', 'setpan', 'setrate' ], 
    },
    Soundfont:{
      methods:[ 'note', 'trigger', 'midinote', 'midichord', 'chord', 'load', 'setpan', 'setrate' ], 
    },
    Snare:{
      methods:[ 'note','trigger' ],
    },
    Synth:{
      methods:[ 'note','trigger' ],
    },
    Complex:{
      methods:[ 'note','trigger' ],
    },
    Tom:{
      methods:[ 'note','trigger' ],
    },
    PolySynth:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyComplex:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyFM:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyKarplus:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyMono:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyConga:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyTom:{
      methods:[ 'chord','note','trigger' ],
    },
    PolyKick:{
      methods:[ 'note','trigger' ],
    },
  },
  
}

module.exports = Instruments

},{"./ugen.js":122,"gibberish-dsp":169}],98:[function(require,module,exports){
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

},{}],99:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const Ugen      = require( './ugen.js' )

const Oscillators = {
  create( Audio ) {
    const oscillators = {}
    const defaults = {
      frequency:220, gain:.25, pulsewidth:.5
    }
    for( let oscillatorName in Gibberish.oscillators ) {
      const gibberishConstructor = Gibberish.oscillators[ oscillatorName ]

      //const methods = Oscillators.descriptions[ oscillatorName ] === undefined ? null : Oscillators.descriptions[ oscillatorName ].methods
      const description = { 
        properties:defaults, 
        methods:[],
        name:oscillatorName,
        category:'oscillators'
      }

      oscillators[ oscillatorName ] = Ugen( gibberishConstructor, description, Audio )

    }
    return oscillators
  },

  descriptions: {},
  
}

module.exports = Oscillators

},{"./ugen.js":122,"gibberish-dsp":169}],100:[function(require,module,exports){
const Presets = {
  process( description, args, Audio ) {
    let output

    // if the constructor arugment is not a string then no preset is being used
    if( typeof args[0] === 'object' ) {
      output = args[ 0 ]  
    }else if( typeof args[0] === 'string' ){
      if( args[0] === 'inspect' ) return null
      output = {}
      const preset = Presets[ description.category ][ description.name ][ args[0] ]

      if( preset !== undefined ) {
        for( let key in preset ) {
          if( key === 'presetInit' ) continue
          let value = preset[ key ]

          // if a value is a function, run the function to get the new value. these
          // preset functions are passed the main audio object, which they can typically
          // use, for example, to query the current sample rate.
          output[ key ] = typeof value === 'function' ? value( Audio ) : value
        }
        
        if( preset.presetInit !== undefined ) {
          output.__presetInit__ = preset.presetInit 
        } 
      }else{
        if( description.name === 'Sampler' || description.name === 'Multisampler'  || description.name === 'Grains' ) {
          console.log( 'loading samples ' + args[0] )
          output.__presetInit__ = function() { this.load( args[0] ) }
        }else{
          console.warn( `The preset ${args[0]} for the ${description.category.slice(0,-1)} ${description.name} does not exist.` )
        }
      }
      // if there is an extra argument to modify the preset...
      if( args.length > 1 ) {
        Object.assign( output, args[1] )
      }
    }else{
      output = {}
    }
    
    if( description.__defaults__ !== undefined ) {
      console.log( 'defaults:', description.__defaults__ )
      Object.assign( output, description.__defaults__ )
    }

    return output
  },

  instruments: {
    Complex:      require( './presets/complex_presets.js' ),
    Synth:        require( './presets/synth_presets.js' ),
    FM:           require( './presets/fm_presets.js' ),
    Monosynth:    require( './presets/monosynth_presets.js' ),
    PolyMono:     require( './presets/monosynth_presets.js' ),
    Snare:        require( './presets/snare_presets.js' ),
    Cowbell:      require( './presets/cowbell_presets.js' ),
    Kick:         require( './presets/kick_presets.js' ),
    Hat:          require( './presets/hat_presets.js' ),
    EDrums:       require( './presets/edrums_presets.js' ),
    Drums:        require( './presets/drums_presets.js' ),
    Multisampler: require( './presets/multisampler.js' ),
    Grains:       require( './presets/grains.js' ),
    Soundfont:    require( './presets/soundfont_presets.js' ),
    Karplus:      require( './presets/karplus_presets.js' )
  },

  effects: {
    Chorus:     require( './presets/chorus_presets.js' ),
    Distortion: require( './presets/distortion_presets.js' ),
    Flanger:    require( './presets/flanger_presets.js' ),
    Reverb:     require( './presets/reverb.js' ),
    Delay:      require( './presets/delay_presets.js' ),
  },

  misc: {
    Bus2: require( './presets/bus2_presets.js' )
  }

}

Presets.instruments.Sampler   = Presets.instruments.Multisampler
Presets.instruments.PolySynth = Presets.instruments.Synth
Presets.instruments.PolyFM    = Presets.instruments.FM
Presets.instruments.PolyMono  = Presets.instruments.Monosynth
Presets.instruments.PolyKick  = Presets.instruments.Kick
Presets.instruments.PolyKarplus  = Presets.instruments.Karplus
Presets.instruments.PolyComplex  = Presets.instruments.Complex

module.exports = Presets

},{"./presets/bus2_presets.js":101,"./presets/chorus_presets.js":102,"./presets/complex_presets.js":103,"./presets/cowbell_presets.js":104,"./presets/delay_presets.js":105,"./presets/distortion_presets.js":106,"./presets/drums_presets.js":107,"./presets/edrums_presets.js":108,"./presets/flanger_presets.js":109,"./presets/fm_presets.js":110,"./presets/grains.js":111,"./presets/hat_presets.js":112,"./presets/karplus_presets.js":113,"./presets/kick_presets.js":114,"./presets/monosynth_presets.js":115,"./presets/multisampler.js":116,"./presets/reverb.js":117,"./presets/snare_presets.js":118,"./presets/soundfont_presets.js":119,"./presets/synth_presets.js":120}],101:[function(require,module,exports){
module.exports = {

  'spaceverb': {
    presetInit: function( audio ) {
      this.fx.verb = audio.effects.Reverb({ roomSize:.985, dry:1 })
      this.fx.add( this.fx.verb )
    }
  },
  'echoverb.1/3': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/3, feedback:.35, wetdry:.5 })
      this.fx.reverb  = audio.effects.Reverb({ roomSize:.985, dry:1 })
      this.fx.add( this.fx.delay )
      this.fx.add( this.fx.reverb )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
      this.roomSize = this.fx.reverb.roomSize
    }
  },
  'echoverb.1/6': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/6, feedback:.35, wetdry:.5 })
      this.fx.verb  = audio.effects.Reverb({ roomSize:.985, dry:1 })
      this.fx.add( this.fx.delay, this.fx.reverb )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
      this.roomSize = this.fx.reverb.roomSize
    }
  },
  'delay.1/6': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/6, feedback:.35, wetdry:.5 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  },
  'delay.1/3': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/3, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  }, 
  'delay.1/6.fb': {
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ time:1/6, feedback:.825, wetdry:1 })
      this.fx.add( this.delay ) 
    }
  },
  'delay.1/3.fb': {
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ time:1/3, feedback:.825, wetdry:1 })
      this.fx.add( this.delay )
    }
  },
  'delay.1/5': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/5, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  },
  'delay.1/8': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/8, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
      this.feedback = this.fx.delay.feedback
      this.time = this.fx.delay.time
    }
  },
  'delay.1/9': {
    presetInit: function( audio ) {
      this.fx.delay = audio.effects.Delay({ time:1/9, feedback:.35, wetdry:1 })
      this.fx.add( this.fx.delay )
    }
  },
}

},{}],102:[function(require,module,exports){
module.exports = {

  lush: {
    fastFrequency:4,
    fastGain:.425,
    slowGain:3.5,
    slowFrequency:1,
    presetInit: function( audio ) {
      const gen = audio.Gen.ugens
      this.mod1 = audio.Gen.make( audio.Gen.ugens.cycle(.1) ).connect( this.fastFrequency )
      //this.fastGain =  audio.Gen.make( gen.add( .425, gen.cycle(.1) ) )
      this.mod2 = audio.Gen.make( audio.Gen.ugens.cycle(.05) ).connect( this.slowGain )
      //this.slowGain = audio.Gen.make( gen.add( 4.5, gen.cycle(.05) ) )
    }
  },

  warbly: {
    fastFrequency:4,
    slowGain:3,
    slowFrequency:1,
    fastGain:1.5,
    presetInit: function( audio ) {
      this.mod1 = audio.Gen.make( audio.Gen.ugens.cycle(.1) ).connect( this.fastFrequency )
      this.mod2 = audio.Gen.make( audio.Gen.ugens.cycle(.05) ).connect( this.slowGain )
    }
  }

}

},{}],103:[function(require,module,exports){
module.exports = {
  'plucked': {
    bias:.35,
    gain:1,
    decay:1/5,
    pregain:4,
    postgain:4,
    description:'a short, clean sounding preset with a minimum of distortion/wavefolding.'
  },
  'bass': {
    bias:.15,
    gain:1,
    decay:1,
    pregain:4,
    postgain:15,
    filterMult:4,
    Q:.75,
    octave:-3,
    description:'a relatively clean, percussive bass.'
  },
  
  'perc': {
    bias:.35,
    gain:1,
    decay:1/5,
    pregain:5,
    description:'a short, clean sounding preset with a minimum of distortion/wavefolding.'
  },

  stab: {
    waveform:'saw', 
    decay:1/4, 
    bias:.1, 
    filterMult:0, 
    cutoff:.8, 
    Q:.15, 
    pregain:10, 
    postgain:.25, 
    filterModel:2, 
    saturation:50,
    presetInit( audio ) {
      this.fx.push( audio.effects.Distortion('earshred') )
    },
    description:'a short, heavily distorted and filtered sound. in addition to the standard Complex wavefolding, this preset also adds an additional Distortion effect (preset earsred).'
  }

}

},{}],104:[function(require,module,exports){
module.exports = {
  short: {
    decay:.05,
  },

  med: {
    decay:.2,
  },

  long: {
    decay:.5,
  }

}

},{}],105:[function(require,module,exports){
module.exports = {
  '1/3' : {
    time:1/3, feedback:.35, wetdry:1 
  },
  '1/6' : {
    time:1/6, feedback:.35, wetdry:1
  },
  '1/8' : {
    time:1/8, feedback:.35, wetdry:1
  },
  '1/9' : {
    time:1/9, feedback:.35, wetdry:1
  },
  '1/3.fb' : {
    time:1/3, feedback:.85, wetdry:1 
  },
  '1/6.fb' : {
    time:1/6, feedback:.85, wetdry:1
  },
  '1/8.fb' : {
    time:1/8, feedback:.85, wetdry:1
  },
  '1/9.fb' : {
    time:1/9, feedback:.85, wetdry:1
  },
  '1/3.dry' : {
    time:1/3, feedback:.35, wetdry:.5 
  },
  '1/6.dry' : {
    time:1/6, feedback:.35, wetdry:.5
  },
  '1/8.dry' : {
    time:1/8, feedback:.35, wetdry:.5
  },
  '1/9.dry' : {
    time:1/9, feedback:.35, wetdry:.5
  },
  '1/3.dry.fb' : {
    time:1/3, feedback:.85, wetdry:.5 
  },
  '1/6.dry.fb' : {
    time:1/6, feedback:.35, wetdry:.5
  },
  '1/8.dry.fb' : {
    time:1/8, feedback:.85, wetdry:.5
  },
  '1/9.dry.fb' : {
    time:1/9, feedback:.85, wetdry:.5
  }
}

},{}],106:[function(require,module,exports){
module.exports = {

  crunch: {
    pregain:10, 
    postgain:.35
  },

  earshred: {
   pregain: 500,
   postgain: .06,
   shape1: .001,
   shape2: -3
  },

  bass: {
    pregain:10,
    postgain:.35,
    shape1:3,
    shape2:10
  },

  medium: {
    pregain:40,
    postgain:.125/4
  }
}

},{}],107:[function(require,module,exports){
module.exports = {

  earshred: {
    // unfortunately you can't write normal presets for
    // Drums and EDrums, because they don't go through
    // the Ugen constructor in the typical way (they are
    // processed as busses). It would also
    // be difficult to define properties for the individual
    // drum components (snare,kick etc.) using the standard
    // preset format. For these reasons, all property assignment
    // must be performed after initialization. 
    presetInit( audio ) {
      this.fx.add( audio.effects.Distortion('earshred') )
    }
  },

  hpf: {
    presetInit( audio ) {
      // XXX have to specify input because of filter errors...
      const hpf = audio.filters.Filter12Biquad({ input:this, mode:1, cutoff:.25, Q:.5, isStereo:true })
      this.fx.add( hpf )
      this.hpf = hpf
   }
  },
  lpf: {
    presetInit( audio ) {
      // XXX have to specify input because of filter errors...
      const lpf = audio.filters.Filter24Moog({ input:this, mode:0, cutoff:.25, Q:.75, isStereo:true })
      this.fx.add( lpf )
      this.lpf = lpf
    }
  }

}

},{}],108:[function(require,module,exports){
module.exports = {

  earshred: {
    // unfortunately you can't write normal presets for
    // Drums and EDrums, because they don't go through
    // the Ugen constructor in the typical way (they are
    // processed as busses). It would also
    // be difficult to define properties for the individual
    // drum components (snare,kick etc.) using the standard
    // preset format. For these reasons, all property assignment
    // must be performed after initialization. 
    presetInit( audio ) {
      this.fx.add( audio.effects.Distortion('earshred') )

      this.kick.frequency = 55
      this.kick.decay = .975

      this.snare.tune = .25
      this.snare.snappy = 1.5
    }
  },

  warbly: {
    presetInit( audio ) {
      const bc = audio.effects.BitCrusher({ input:this, sampleRate:.35, bitDepth:.5, isStereo:true })
      this.fx.add( bc )
      this.bitcrusher = bc
      const flanger = audio.effects.Flanger({ input:this, frequency:.8, feedback:.935, isStereo:true })
      this.fx.add( flanger )
      this.flanger = flanger
      this.gain.value *= 1.35
   }
  },
  hpf: {
    presetInit( audio ) {
      const hpf = audio.filters.Filter12Biquad({ input:this, mode:1, cutoff:.35, isStereo:true })
      this.fx.add( hpf )
      this.hpf = hpf
   }
  },
  lpf: {
    presetInit( audio ) {
      const lpf = audio.filters.Filter24Moog({ input:this, mode:1, cutoff:.35, isStereo:true })
      this.fx.add( lpf )
      this.lpf = lpf
    }
  },
  short: {
    presetInit( audio ) {
      this.kick.decay = .8
      this.snare.decay = .05
      this.closedHat.decay = .05
      this.openHat.decay = .2
      this.cowbell.decay = .1
    }
  },
  long: {
    presetInit( audio ) {
      this.kick.decay = .975
      this.snare.decay = .1
      this.closedHat.decay = .1
      this.openHat.decay = .25
    }
  }

}

},{}],109:[function(require,module,exports){
module.exports = {
  moderate: {
    feedback: .25,
    frequency:.5,
    offset:.1
  },

  extreme: {
    feedback:.85,
    offset:.05,
    frequency:4
  },

}

},{}],110:[function(require,module,exports){
module.exports = {

  bass : {
    cmRatio:1,
    index:3,
    attack:1/256,
    decay:1/16,
    octave:-2
  },
  deepbass : {
    cmRatio:1,
    index:3,
    attack:1/256,
    decay:1/2,
    octave:-3,
    feedback:.005
  },
  kick:{
    attack : 1/4096,
    index : 5,
    cmRatio : 4/3,
    decay : 1/4,
    octave : -3,
    shape:'exponential'
  },

  perc:{
    attack : 1/4096,
    index : .5,
    cmRatio : 4/3,
    decay : 1/8,
    shape:'exponential',
    presetInit: function( audio ) {
      if( this.voices && this.voices.length > 1 ) {
        this.spread( .99 )
      }
    }
  },

  'bass.electro' : {
    cmRatio:1,
    index:3,
    attack:1/256,
    decay:1/16,
    octave:-2,
    filterModel:2,
    saturation:200,
    Q:.25,
    cutoff:.6835
  },

  glockenspiel : {
    cmRatio	: 3.5307,
    index 	: 1,
    attack	: audio => audio.Clock.ms( 1 ),
    decay	: audio => audio.Clock.ms( 1000 ),
  },

  'glockenspiel.short' : {
    cmRatio	: 3.5307,
    index 	: 1,
    attack	: audio => audio.Clock.ms( 1 ),
    decay	  : 1/12,
    octave  : 1,
    gain    :.05 
  },

  frog : { //ljp
    cmRatio: 0.1,
    index: 2.0,
    attack: audio => audio.Clock.ms( 300 ), 
    decay: audio => audio.Clock.ms( 5 )
  },

  gong : {
    cmRatio: 1.4,
	  index: .95,
	  attack: 1/256,
	  decay: 2,
	},

  drum : {
	  cmRatio: 1.40007,
	  index: 2,
	  attack: 1/2048,
    decay: audio => audio.Clock.ms(1000) 
	},

	drum2: {
		cmRatio: 1 + Math.sqrt(2),
		index: .2,
		attack: 1/256,
		decay: audio => audio.Clock.ms(20) 
  },

	brass : {
    maxVoices:4,
	  cmRatio : 1 / 1.0007,
		index	: 5,
		attack: audio => audio.Clock.ms(100),
		decay	: 1,
    gain:.5,
  },

	clarinet : {
		cmRatio	: 3 / 2,
		index	: 1.5,
		attack: audio => audio.Clock.ms( 50 ), 
		decay:  audio => audio.Clock.ms( 200 )
  },

  fun : {
    decay:1/2,
    feedback: .0015,
    gain:.1
  },

  chirp: {
		attack: audio => audio.Clock.ms( 1 ), 
    index : 1.15,
    glide : 1,
    feedback : .5,
    cmRatio : 1.5,
    decay : 1/4,
    octave : 1,
    shape:'exponential'
  }
}

},{}],111:[function(require,module,exports){
module.exports = {
  drums: { 
    files:[
      'resources/audiofiles/kick.wav',
      'resources/audiofiles/hat.wav',
      'resources/audiofiles/snare.wav',
      'resources/audiofiles/openhat.wav'
    ],
    presetInit() {
      this.length = 4
    }
  },
  trumpet: {
    files:[
      'resources/audiofiles/trumpet.wav'
    ],
    presetInit() { this.length = 1 }
  },
  beatbox: {
    files:[
      'resources/audiofiles/beatbox/^k.wav',
      'resources/audiofiles/beatbox/^p.wav',
      'resources/audiofiles/beatbox/^tss.wav',
      'resources/audiofiles/beatbox/8.wav',
      'resources/audiofiles/beatbox/a.wav',
      'resources/audiofiles/beatbox/b.wav',
      'resources/audiofiles/beatbox/d.wav',
      'resources/audiofiles/beatbox/dot.wav',
      'resources/audiofiles/beatbox/duf.wav',
      'resources/audiofiles/beatbox/f.wav',
      'resources/audiofiles/beatbox/k.wav',
      'resources/audiofiles/beatbox/h.wav',
      'resources/audiofiles/beatbox/m.wav',
      'resources/audiofiles/beatbox/n.wav',
    ],
    presetInit() {
      this.length = 14
    }
  },
  bleeps: {
    files:[
      'resources/audiofiles/bent-bleeps/51063__stamperadam__bleep1.wav',
      'resources/audiofiles/bent-bleeps/51064__stamperadam__bleep2.wav',
      'resources/audiofiles/bent-bleeps/51065__stamperadam__clap.wav',
      'resources/audiofiles/bent-bleeps/51066__stamperadam__click.wav',
      'resources/audiofiles/bent-bleeps/51067__stamperadam__click1.wav',
      'resources/audiofiles/bent-bleeps/51068__stamperadam__g1.wav',
      'resources/audiofiles/bent-bleeps/51069__stamperadam__g2.wav',
      'resources/audiofiles/bent-bleeps/51070__stamperadam__g3.wav',
      'resources/audiofiles/bent-bleeps/51071__stamperadam__g4.wav',
      'resources/audiofiles/bent-bleeps/51072__stamperadam__g5.wav',
      'resources/audiofiles/bent-bleeps/51073__stamperadam__g6.wav',
      'resources/audiofiles/bent-bleeps/51074__stamperadam__g7.wav',
      'resources/audiofiles/bent-bleeps/51075__stamperadam__g8.wav',
      'resources/audiofiles/bent-bleeps/51076__stamperadam__g9.wav',
      'resources/audiofiles/bent-bleeps/51077__stamperadam__glitch.wav',
      'resources/audiofiles/bent-bleeps/51078__stamperadam__hatt.wav',
      'resources/audiofiles/bent-bleeps/51079__stamperadam__hit.wav',
      'resources/audiofiles/bent-bleeps/51080__stamperadam__hitt.wav',
      'resources/audiofiles/bent-bleeps/51081__stamperadam__hum.wav',
      'resources/audiofiles/bent-bleeps/51082__stamperadam__kik.wav',
      'resources/audiofiles/bent-bleeps/51083__stamperadam__snar.wav',
      'resources/audiofiles/bent-bleeps/51084__stamperadam__wa.wav',
    ],
    presetInit() {
      this.length = 22
    }
  },
  breaks: {
    files:[
      './resources/audiofiles/breaks.120bpm/188553__mika55__120bpm-drum-loop.wav',
      './resources/audiofiles/breaks.120bpm/188553__mika55__120bpm-drum-loop.wav',
      './resources/audiofiles/breaks.120bpm/381956__waveplaysfx__drumloop-120-bpm-edm-drum-loop-023.wav',
      './resources/audiofiles/breaks.120bpm/404052__theflakesmaster__dance-beat.wav',
      './resources/audiofiles/breaks.120bpm/474932__disquantic__ragga-tech-drums-by-dsqt-120-bpm.wav',
      './resources/audiofiles/breaks.120bpm/515673__akustika__120-disco80.wav',
    ],
    presetInit() {
      this.length = 5
    }
  },

  cr7030: {
    files:[
      './resources/audiofiles/cr7030/68602__birdflu__bongo7030.wav',
      './resources/audiofiles/cr7030/68603__birdflu__clave7030.wav',
      './resources/audiofiles/cr7030/68606__birdflu__hatclosed7030.wav',
      './resources/audiofiles/cr7030/68607__birdflu__hatopen7030.wav',
      './resources/audiofiles/cr7030/68608__birdflu__kick7030.wav',
      './resources/audiofiles/cr7030/68609__birdflu__snare7030.wav',
      './resources/audiofiles/cr7030/68610__birdflu__tom7030.wav',
    ],
    presetInit(){
      this.length = 7
    }
  },
  kicks: {
    files:[
      'resources/audiofiles/kicks/249200__netr-si__kick-32.wav',
      'resources/audiofiles/kicks/249201__netr-si__kick-33.wav',
      'resources/audiofiles/kicks/249202__netr-si__kick-27.wav',
      'resources/audiofiles/kicks/249203__netr-si__kick-28.wav',
      'resources/audiofiles/kicks/249204__netr-si__kick-25.wav',
      'resources/audiofiles/kicks/249205__netr-si__kick-26.wav',
      'resources/audiofiles/kicks/249206__netr-si__kick-30.wav',
      'resources/audiofiles/kicks/249207__netr-si__kick-31.wav',
      'resources/audiofiles/kicks/249208__netr-si__kick-29.wav',
      'resources/audiofiles/kicks/249209__netr-si__kick-3.wav',
      'resources/audiofiles/kicks/249211__netr-si__kick-42.wav',
      'resources/audiofiles/kicks/249212__netr-si__kick-41.wav',
      'resources/audiofiles/kicks/249213__netr-si__kick-35.wav',
      'resources/audiofiles/kicks/249214__netr-si__kick-34.wav',
      'resources/audiofiles/kicks/249215__netr-si__kick-37.wav',
      'resources/audiofiles/kicks/249216__netr-si__kick-36.wav',
      'resources/audiofiles/kicks/249217__netr-si__kick-39.wav',
      'resources/audiofiles/kicks/249218__netr-si__kick-38.wav',
      'resources/audiofiles/kicks/249219__netr-si__kick-40.wav',
      'resources/audiofiles/kicks/249220__netr-si__kick-4.wav',
      'resources/audiofiles/kicks/249222__netr-si__kick-87.wav',
      'resources/audiofiles/kicks/249223__netr-si__kick-9.wav',
      'resources/audiofiles/kicks/249224__netr-si__kick-83.wav',
      'resources/audiofiles/kicks/249225__netr-si__kick-84.wav',
      'resources/audiofiles/kicks/249226__netr-si__kick-85.wav',
      'resources/audiofiles/kicks/249227__netr-si__kick-86.wav',
      'resources/audiofiles/kicks/249228__netr-si__kick-8.wav',
      'resources/audiofiles/kicks/249229__netr-si__kick-80.wav',
      'resources/audiofiles/kicks/249230__netr-si__kick-81.wav',
      'resources/audiofiles/kicks/249231__netr-si__kick-82.wav',
      'resources/audiofiles/kicks/249232__netr-si__kick-20.wav',
      'resources/audiofiles/kicks/249233__netr-si__kick-2.wav',
      'resources/audiofiles/kicks/249234__netr-si__kick-19.wav',
      'resources/audiofiles/kicks/249235__netr-si__kick-18.wav',
      'resources/audiofiles/kicks/249236__netr-si__kick-24.wav',
      'resources/audiofiles/kicks/249237__netr-si__kick-23.wav',
      'resources/audiofiles/kicks/249238__netr-si__kick-22.wav',
      'resources/audiofiles/kicks/249239__netr-si__kick-21.wav',
      'resources/audiofiles/kicks/249240__netr-si__kick-25-2.wav',
      'resources/audiofiles/kicks/249241__netr-si__kick-25-1.wav',
      'resources/audiofiles/kicks/249242__netr-si__kick-12.wav',
      'resources/audiofiles/kicks/249243__netr-si__kick-11.wav',
      'resources/audiofiles/kicks/249244__netr-si__kick-10.wav',
      'resources/audiofiles/kicks/249245__netr-si__kick-1.wav',
      'resources/audiofiles/kicks/249246__netr-si__kick-15.wav',
      'resources/audiofiles/kicks/249247__netr-si__kick-14.wav',
      'resources/audiofiles/kicks/249248__netr-si__kick-14-1.wav',
      'resources/audiofiles/kicks/249249__netr-si__kick-13.wav',
      'resources/audiofiles/kicks/249250__netr-si__kick-17.wav',
      'resources/audiofiles/kicks/249251__netr-si__kick-16.wav',
      'resources/audiofiles/kicks/249252__netr-si__kick-67.wav',
      'resources/audiofiles/kicks/249253__netr-si__kick-68.wav',
      'resources/audiofiles/kicks/249254__netr-si__kick-65.wav',
      'resources/audiofiles/kicks/249255__netr-si__kick-66.wav',
      'resources/audiofiles/kicks/249256__netr-si__kick-63.wav',
      'resources/audiofiles/kicks/249257__netr-si__kick-64.wav',
      'resources/audiofiles/kicks/249258__netr-si__kick-61.wav',
      'resources/audiofiles/kicks/249259__netr-si__kick-62s.wav',
      'resources/audiofiles/kicks/249260__netr-si__kick-69.wav',
      'resources/audiofiles/kicks/249261__netr-si__kick-7.wav',
      'resources/audiofiles/kicks/249262__netr-si__kick-75.wav',
      'resources/audiofiles/kicks/249263__netr-si__kick-74.wav',
      'resources/audiofiles/kicks/249264__netr-si__kick-77.wav',
      'resources/audiofiles/kicks/249265__netr-si__kick-76.wav',
      'resources/audiofiles/kicks/249266__netr-si__kick-71.wav',
      'resources/audiofiles/kicks/249267__netr-si__kick-70.wav',
      'resources/audiofiles/kicks/249268__netr-si__kick-73.wav',
      'resources/audiofiles/kicks/249269__netr-si__kick-72.wav',
      'resources/audiofiles/kicks/249270__netr-si__kick-79.wav',
      'resources/audiofiles/kicks/249271__netr-si__kick-78.wav',
      'resources/audiofiles/kicks/249272__netr-si__kick-43.wav',
      'resources/audiofiles/kicks/249273__netr-si__kick-44.wav',
      'resources/audiofiles/kicks/249274__netr-si__kick-45.wav',
      'resources/audiofiles/kicks/249275__netr-si__kick-46.wav',
      'resources/audiofiles/kicks/249276__netr-si__kick-47.wav',
      'resources/audiofiles/kicks/249277__netr-si__kick-48.wav',
      'resources/audiofiles/kicks/249278__netr-si__kick-49.wav',
      'resources/audiofiles/kicks/249279__netr-si__kick-5.wav',
      'resources/audiofiles/kicks/249280__netr-si__kick-50.wav',
      'resources/audiofiles/kicks/249281__netr-si__kick-51.wav',
      'resources/audiofiles/kicks/249282__netr-si__kick-60.wav',
      'resources/audiofiles/kicks/249283__netr-si__kick-6.wav',
      'resources/audiofiles/kicks/249284__netr-si__kick-59.wav',
      'resources/audiofiles/kicks/249285__netr-si__kick-58.wav',
      'resources/audiofiles/kicks/249286__netr-si__kick-57.wav',
      'resources/audiofiles/kicks/249287__netr-si__kick-56.wav',
      'resources/audiofiles/kicks/249288__netr-si__kick-55.wav',
      'resources/audiofiles/kicks/249289__netr-si__kick-54.wav',
      'resources/audiofiles/kicks/249290__netr-si__kick-53.wav',
      'resources/audiofiles/kicks/249291__netr-si__kick-52.wav',
    ],
    presetInit() { this.length = 90 }
  }
}

},{}],112:[function(require,module,exports){
module.exports = {
  short: {
    decay:.01
  }
}

},{}],113:[function(require,module,exports){
module.exports = {
  'short.bright': {
    decay:.125,
    damping:.1,
  },
  'short.dull': {
    decay:.125,
    damping:.9,
  },

  'long.bright': {
    decay:3,
    damping:.1
  },
  'long.dull': {
    decay:3,
    damping:.9
  },
  'hat': {
    decay:.125,
    damping:.1,
    blend:.5
  },

}

},{}],114:[function(require,module,exports){
module.exports = {

  deep: {
    frequency:55,
    decay:.96,
  },

  tight: {
    frequency:80, 
    decay:.85,
    tone:.5
  },

  long: {
    frequency:80,
    decay:.975,
  },

  boom: {
    frequency:55,
    decay:.99,
    tone:.05
  }


}

},{}],115:[function(require,module,exports){
module.exports = {

  'short.dry' : { 
    attack: audio => audio.Clock.ms(.25), 
    decay: 1/12,
    cutoff:.3,
    filterModel:1,
    filterMult:3
  },

  arpy : {
    antialias:true,
    attack: audio => audio.Clock.ms(.5),
    decay: 1/16, 
    gain:0.2,
    cutoff:.15,
    filterMult:1,
    Q:.3,
    filterModel:1,
    filterMode:1
  },
  arpy2: {
    attack: audio=> audio.Clock.ms(1),
    decay:1/32,
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ delay:audio.Clock.time(1/8), feedback:.5, wetdry:.25 }) 
      this.fx.push( this.delay )
    },
    panVoices:true,
    gain:.3,
    octave2:0,
    octave3:0,
    cutoff:.35,
    glide:1,
    filterModel:1,
    filterMult:3,
    Q:.5,
  },

  lead : {
    presetInit : function( audio ) { this.fx.push( audio.effects.Delay({ time:1/6, feedback:.65 }) )  },
    attack: audio => audio.Clock.ms(.5),
    decay: 1/2, 
    octave3:0,
    cutoff:1,
    filterMult:2.5,
    Q:.975,
    filterModel:1,
    filterMode:1
  },
  // not as bright / loud
  lead2 : {
    presetInit : function( audio ) { this.fx.push( audio.effects.Delay({ time:1/6, feedback:.65 }) )  },
    attack: audio => audio.Clock.ms(.5),
    decay: 1/2, 
    octave3:0,
    cutoff:1,
    filterMult:2.5,
    Q:.8,
    gain:.175,
    filterModel:1,
    filterMode:1
  },

  dirty: { 
    gain:.325,
    filterModel:2,
    attack:1/2048, 
    decay:1/4, 
    cutoff:1.5, 
    filterMult:4, 
    saturation:10000, 
    Q:.225, 
    detune2:-.505,
    detune3:-.5075,
    octave:-2,
    waveform:'pwm', 
    pulsewidth:.15 
  },

  winsome : {
    presetInit : function( audio ) { 
      this.lfo = audio.oscillators.Sine({ frequency:2, gain:.075 })
      this.lfo.connect( this.cutoff )
      this.lfo.connect( this.detune2 )
      this.lfo.connect( this.detune3 )
    },
    attack: audio => audio.Clock.ms(1), 
    decay:1,
    cutoff:.2,
  },

  pluckEcho: {
    presetInit : function( audio ) { this.fx.push( audio.effects.Delay({ time:1/6, feedback:.65 }) )  },
    attack: audio => audio.Clock.ms(.1),
    decay: 1/16, 
    octave3:0,
    cutoff:.15,
    filterMult:1,
    Q:.5,
    filterModel:1,
    filterMode:1,
    panVoices:true
  },

  bassPad : { 
    attack: audio => audio.Clock.ms(.1),
    decay: 2,	
    octave:-4,
    cutoff: .225,
    filterMult:3.5,
    Q:.5,
    detune2:1.0125,
    detune3:1-.0125
  },

  warble : { 
    attack: audio => audio.Clock.ms(1),
    decay: 1/2,	
    octave: -3,
    octave2 : -1,
    cutoff: .8,
    filterMult:3,
    Q:.75,
    detune2:.0275,
    detune3:-.0275
  }, 
  dark: { 
    attack: audio => audio.Clock.ms(1),
    decay: 1,	
    octave: -3,
    octave2 : -1,
    cutoff: 1.5,
    filterMult:3,
    Q:.75,
    detune2:.0125,
    detune3:-.0125
  },
  bass: { 
    attack: audio => audio.Clock.ms(1),
    decay: 1/4,	
    octave: -3,
    cutoff: .35,
    filterMult:3,
    Q:.15,
    glide:1250,
    waveform:'pwm',
    pulsewidth:.45,
    detune2:.005,
    detune3:-.005
  },
  bass2 : {
    attack: audio => audio.Clock.ms(1), 
    decay:	1/6,
    octave: -2,
    octave2 : 0,
    octave3 : 0,      
    cutoff: .5,
    filterMult:2,
    Q:.5,
    gain:.35
  },

  bass3: {
    attack: audio => audio.Clock.ms(1),
    decay:1/4,
    gain:.5,
    glide:10, shape:'exponential',  detune2:-.505, octave:-3,
    cutoff:.35,
    filterMult:3.5,
    waveform:'pwm',
    pulsewidth:.25,
    detune3:.005
  },
  
  edgy: {
    decay:1/8,
    attack:1/1024,
    octave: -2,
    octave2: -1,
    cutoff: .5,
    filterMult:3,
    Q:.75, 
    waveform:'pwm', 
    pulsewidth:.2,
    detune2:0,
    gain:.2
  },

  easy : {
    attack: audio=> audio.Clock.ms(1),
    decay:2,
    cutoff:.3,
    glide:.9995,
  },
  
  easyfx : {
    attack: audio=> audio.Clock.ms(1),
    decay:2,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Delay( Clock.time(1/6), .3) )
    },
    cutoff:.125,
    glide:1000,
    detune2:.001,
    detune3:-.001,
    filterModel:1,
    filterMult:4,
    Q:.5,
  },
  chords: {
    attack: audio=> audio.Clock.ms(1),
    decay:1/2,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Delay( Clock.time(1/6), .5) )
    },
    amp:.3,
    octave2:0,
    octave3:0,
    cutoff:.5,
    glide:.9995,
    filterModel:1,
    filterMult:3,
    Q:.75,
  },

  wander: {
    attack: 1/2,
    decay:  2,
    presetInit: function( audio ) {},
    amp:.2,
    detune2:.501,
    detune3:-.501,
    cutoff:.2,
    glide:5000,
    filterModel:1,
    filterMult:1.5,
    Q:.25,
  },

  'chords.short': {
    attack: audio=> audio.Clock.ms(1),
    decay:1/8,
    presetInit: function( audio ) {
      this.delay = audio.effects.Delay({ delay:audio.Clock.time(1/8), feedback:.5, wetdry:.25 }) 
      this.fx.push( this.delay )
    },
    amp:.3,
    octave2:0,
    octave3:0,
    cutoff:.35,
    glide:1,
    filterModel:1,
    filterMult:3,
    Q:.5,
  },

  jump: { 
    decay:1/2048, 
    useADSR:true, 
    sustain:1/4, 
    release:1/1024,  
    maxVoices:3, 
    cutoff:35, 
    filterMult:0,
    detune2:.01,
    detune3:-.01 
  },

  supersaw: {
    attack:1/4096,
    decay:1/8, 
    cutoff:2, 
    filterMult:4,
    antialias:true,
    useADSR:false,
    gain:.25,
    detune2:.005,
    detune3:-.005
  },

  shinybass2: {
    Q:.125,
    cutoff:35,
    useADSR:true,
    decay:1/10,
    sustain:1/4,
    filterMult:0,
    release:1/1024,
    octave:-3,
    panVoices:true
  },
  shinybass: {
    Q:.125,
    cutoff:5,
    useADSR:false,
    attack:1/1024,
    decay:1/10,
    filterMult:0,
    octave:-3,
    panVoices:true
  },

  'bass.muted': {
    Q:.45,
    cutoff:.5,
    useADSR:true,
    shape:'exponential',
    decay:1/8,
    sustain:1/4,
    release:1/1024,
    octave:-3,
    panVoices:true,
    filterMult:.5
  },
  'bass.stab': {
    Q:.35,
    detune2:1.5,
    detune3:.5,
    cutoff:.5,
    useADSR:true,
    shape:'exponential',
    decay:1/10,
    sustain:1/4,
    release:1/1024,
    octave:-3,
    filterMult:1.85,
    gain:.75
  },
  short: { 
    attack:1/4096,
    decay:1/16, 
    maxVoices:3, 
    cutoff:1.5, 
    filterMult:0,
    useADSR:false,
    gain:.5
  },

  noise: {
    decay:1/2,
    cutoff:.3,
    glide:10000,
    detune3:0,
    detune2:0,
    filterMult:0,
    presetInit: function( audio ) { this.fx.add( audio.effects.Gain(.1), audio.effects.Delay(1/6,.75) ) }
  },

}

},{}],116:[function(require,module,exports){
module.exports = {

  '808': {
    files:[
      'resources/audiofiles/dirt/808bd/BD0050.WAV',
      'resources/audiofiles/dirt/808sd/SD0050.WAV',
      'resources/audiofiles/dirt/808/CH.WAV',
      'resources/audiofiles/dirt/808/MA.WAV',
      'resources/audiofiles/dirt/808/CL.WAV',
      'resources/audiofiles/dirt/808/CP.WAV',
      'resources/audiofiles/dirt/808/CB.WAV',
      'resources/audiofiles/dirt/808oh/OH10.WAV',
      'resources/audiofiles/dirt/808cy/CY0025.WAV',
    ],
    presetInit() { this.length = 9 }
  },
  drums: { 
    files:[
      'resources/audiofiles/kick.wav',
      'resources/audiofiles/hat.wav',
      'resources/audiofiles/snare.wav',
      'resources/audiofiles/hat.wav',
      'resources/audiofiles/openhat.wav'
    ],
    presetInit() {
      this.length = 4
    }
  },
  beatbox: {
    files:[
      'resources/audiofiles/beatbox/^k.wav',
      'resources/audiofiles/beatbox/^p.wav',
      'resources/audiofiles/beatbox/^tss.wav',
      'resources/audiofiles/beatbox/8.wav',
      'resources/audiofiles/beatbox/a.wav',
      'resources/audiofiles/beatbox/b.wav',
      'resources/audiofiles/beatbox/d.wav',
      'resources/audiofiles/beatbox/dot.wav',
      'resources/audiofiles/beatbox/duf.wav',
      'resources/audiofiles/beatbox/f.wav',
      'resources/audiofiles/beatbox/k.wav',
      'resources/audiofiles/beatbox/h.wav',
      'resources/audiofiles/beatbox/m.wav',
      'resources/audiofiles/beatbox/n.wav',
    ],
    presetInit() {
      this.length = 14
    }
  },
  bleeps: {
    files:[
      'resources/audiofiles/bent-bleeps/51063__stamperadam__bleep1.wav',
      'resources/audiofiles/bent-bleeps/51064__stamperadam__bleep2.wav',
      'resources/audiofiles/bent-bleeps/51065__stamperadam__clap.wav',
      'resources/audiofiles/bent-bleeps/51066__stamperadam__click.wav',
      'resources/audiofiles/bent-bleeps/51067__stamperadam__click1.wav',
      'resources/audiofiles/bent-bleeps/51068__stamperadam__g1.wav',
      'resources/audiofiles/bent-bleeps/51069__stamperadam__g2.wav',
      'resources/audiofiles/bent-bleeps/51070__stamperadam__g3.wav',
      'resources/audiofiles/bent-bleeps/51071__stamperadam__g4.wav',
      'resources/audiofiles/bent-bleeps/51072__stamperadam__g5.wav',
      'resources/audiofiles/bent-bleeps/51073__stamperadam__g6.wav',
      'resources/audiofiles/bent-bleeps/51074__stamperadam__g7.wav',
      'resources/audiofiles/bent-bleeps/51075__stamperadam__g8.wav',
      'resources/audiofiles/bent-bleeps/51076__stamperadam__g9.wav',
      'resources/audiofiles/bent-bleeps/51077__stamperadam__glitch.wav',
      'resources/audiofiles/bent-bleeps/51078__stamperadam__hatt.wav',
      'resources/audiofiles/bent-bleeps/51079__stamperadam__hit.wav',
      'resources/audiofiles/bent-bleeps/51080__stamperadam__hitt.wav',
      'resources/audiofiles/bent-bleeps/51081__stamperadam__hum.wav',
      'resources/audiofiles/bent-bleeps/51082__stamperadam__kik.wav',
      'resources/audiofiles/bent-bleeps/51083__stamperadam__snar.wav',
      'resources/audiofiles/bent-bleeps/51084__stamperadam__wa.wav',
    ],
    presetInit() {
      this.length = 22
    }
  },
  breaks: {
    files:[
      './resources/audiofiles/breaks.120bpm/188553__mika55__120bpm-drum-loop.wav',
      './resources/audiofiles/breaks.120bpm/381956__waveplaysfx__drumloop-120-bpm-edm-drum-loop-023.wav',
      './resources/audiofiles/breaks.120bpm/404052__theflakesmaster__dance-beat.wav',
      './resources/audiofiles/breaks.120bpm/474932__disquantic__ragga-tech-drums-by-dsqt-120-bpm.wav',
      './resources/audiofiles/breaks.120bpm/515673__akustika__120-disco80.wav',
    ],
    presetInit() {
      this.length = 5
    }
  },
  cr7030: {
    files:[
      './resources/audiofiles/cr7030/68602__birdflu__bongo7030.wav',
      './resources/audiofiles/cr7030/68603__birdflu__clave7030.wav',
      './resources/audiofiles/cr7030/68606__birdflu__hatclosed7030.wav',
      './resources/audiofiles/cr7030/68607__birdflu__hatopen7030.wav',
      './resources/audiofiles/cr7030/68608__birdflu__kick7030.wav',
      './resources/audiofiles/cr7030/68609__birdflu__snare7030.wav',
      './resources/audiofiles/cr7030/68610__birdflu__tom7030.wav',
    ],
    presetInit(){
      this.length = 7
    }
  },
  kicks: {
    files:[
      'resources/audiofiles/kicks/249200__netr-si__kick-32.wav',
      'resources/audiofiles/kicks/249201__netr-si__kick-33.wav',
      'resources/audiofiles/kicks/249202__netr-si__kick-27.wav',
      'resources/audiofiles/kicks/249203__netr-si__kick-28.wav',
      'resources/audiofiles/kicks/249204__netr-si__kick-25.wav',
      'resources/audiofiles/kicks/249205__netr-si__kick-26.wav',
      'resources/audiofiles/kicks/249206__netr-si__kick-30.wav',
      'resources/audiofiles/kicks/249207__netr-si__kick-31.wav',
      'resources/audiofiles/kicks/249208__netr-si__kick-29.wav',
      'resources/audiofiles/kicks/249209__netr-si__kick-3.wav',
      'resources/audiofiles/kicks/249211__netr-si__kick-42.wav',
      'resources/audiofiles/kicks/249212__netr-si__kick-41.wav',
      'resources/audiofiles/kicks/249213__netr-si__kick-35.wav',
      'resources/audiofiles/kicks/249214__netr-si__kick-34.wav',
      'resources/audiofiles/kicks/249215__netr-si__kick-37.wav',
      'resources/audiofiles/kicks/249216__netr-si__kick-36.wav',
      'resources/audiofiles/kicks/249217__netr-si__kick-39.wav',
      'resources/audiofiles/kicks/249218__netr-si__kick-38.wav',
      'resources/audiofiles/kicks/249219__netr-si__kick-40.wav',
      'resources/audiofiles/kicks/249220__netr-si__kick-4.wav',
      'resources/audiofiles/kicks/249222__netr-si__kick-87.wav',
      'resources/audiofiles/kicks/249223__netr-si__kick-9.wav',
      'resources/audiofiles/kicks/249224__netr-si__kick-83.wav',
      'resources/audiofiles/kicks/249225__netr-si__kick-84.wav',
      'resources/audiofiles/kicks/249226__netr-si__kick-85.wav',
      'resources/audiofiles/kicks/249227__netr-si__kick-86.wav',
      'resources/audiofiles/kicks/249228__netr-si__kick-8.wav',
      'resources/audiofiles/kicks/249229__netr-si__kick-80.wav',
      'resources/audiofiles/kicks/249230__netr-si__kick-81.wav',
      'resources/audiofiles/kicks/249231__netr-si__kick-82.wav',
      'resources/audiofiles/kicks/249232__netr-si__kick-20.wav',
      'resources/audiofiles/kicks/249233__netr-si__kick-2.wav',
      'resources/audiofiles/kicks/249234__netr-si__kick-19.wav',
      'resources/audiofiles/kicks/249235__netr-si__kick-18.wav',
      'resources/audiofiles/kicks/249236__netr-si__kick-24.wav',
      'resources/audiofiles/kicks/249237__netr-si__kick-23.wav',
      'resources/audiofiles/kicks/249238__netr-si__kick-22.wav',
      'resources/audiofiles/kicks/249239__netr-si__kick-21.wav',
      'resources/audiofiles/kicks/249240__netr-si__kick-25-2.wav',
      'resources/audiofiles/kicks/249241__netr-si__kick-25-1.wav',
      'resources/audiofiles/kicks/249242__netr-si__kick-12.wav',
      'resources/audiofiles/kicks/249243__netr-si__kick-11.wav',
      'resources/audiofiles/kicks/249244__netr-si__kick-10.wav',
      'resources/audiofiles/kicks/249245__netr-si__kick-1.wav',
      'resources/audiofiles/kicks/249246__netr-si__kick-15.wav',
      'resources/audiofiles/kicks/249247__netr-si__kick-14.wav',
      'resources/audiofiles/kicks/249248__netr-si__kick-14-1.wav',
      'resources/audiofiles/kicks/249249__netr-si__kick-13.wav',
      'resources/audiofiles/kicks/249250__netr-si__kick-17.wav',
      'resources/audiofiles/kicks/249251__netr-si__kick-16.wav',
      'resources/audiofiles/kicks/249252__netr-si__kick-67.wav',
      'resources/audiofiles/kicks/249253__netr-si__kick-68.wav',
      'resources/audiofiles/kicks/249254__netr-si__kick-65.wav',
      'resources/audiofiles/kicks/249255__netr-si__kick-66.wav',
      'resources/audiofiles/kicks/249256__netr-si__kick-63.wav',
      'resources/audiofiles/kicks/249257__netr-si__kick-64.wav',
      'resources/audiofiles/kicks/249258__netr-si__kick-61.wav',
      'resources/audiofiles/kicks/249259__netr-si__kick-62s.wav',
      'resources/audiofiles/kicks/249260__netr-si__kick-69.wav',
      'resources/audiofiles/kicks/249261__netr-si__kick-7.wav',
      'resources/audiofiles/kicks/249262__netr-si__kick-75.wav',
      'resources/audiofiles/kicks/249263__netr-si__kick-74.wav',
      'resources/audiofiles/kicks/249264__netr-si__kick-77.wav',
      'resources/audiofiles/kicks/249265__netr-si__kick-76.wav',
      'resources/audiofiles/kicks/249266__netr-si__kick-71.wav',
      'resources/audiofiles/kicks/249267__netr-si__kick-70.wav',
      'resources/audiofiles/kicks/249268__netr-si__kick-73.wav',
      'resources/audiofiles/kicks/249269__netr-si__kick-72.wav',
      'resources/audiofiles/kicks/249270__netr-si__kick-79.wav',
      'resources/audiofiles/kicks/249271__netr-si__kick-78.wav',
      'resources/audiofiles/kicks/249272__netr-si__kick-43.wav',
      'resources/audiofiles/kicks/249273__netr-si__kick-44.wav',
      'resources/audiofiles/kicks/249274__netr-si__kick-45.wav',
      'resources/audiofiles/kicks/249275__netr-si__kick-46.wav',
      'resources/audiofiles/kicks/249276__netr-si__kick-47.wav',
      'resources/audiofiles/kicks/249277__netr-si__kick-48.wav',
      'resources/audiofiles/kicks/249278__netr-si__kick-49.wav',
      'resources/audiofiles/kicks/249279__netr-si__kick-5.wav',
      'resources/audiofiles/kicks/249280__netr-si__kick-50.wav',
      'resources/audiofiles/kicks/249281__netr-si__kick-51.wav',
      'resources/audiofiles/kicks/249282__netr-si__kick-60.wav',
      'resources/audiofiles/kicks/249283__netr-si__kick-6.wav',
      'resources/audiofiles/kicks/249284__netr-si__kick-59.wav',
      'resources/audiofiles/kicks/249285__netr-si__kick-58.wav',
      'resources/audiofiles/kicks/249286__netr-si__kick-57.wav',
      'resources/audiofiles/kicks/249287__netr-si__kick-56.wav',
      'resources/audiofiles/kicks/249288__netr-si__kick-55.wav',
      'resources/audiofiles/kicks/249289__netr-si__kick-54.wav',
      'resources/audiofiles/kicks/249290__netr-si__kick-53.wav',
      'resources/audiofiles/kicks/249291__netr-si__kick-52.wav',
    ],
    presetInit() { this.length = 90 }
  },
  trumpet: {
    files:[
      'resources/audiofiles/trumpet.wav'
    ],
    presetInit() { this.length = 1 }
  },

}

},{}],117:[function(require,module,exports){
module.exports = {

  'space': {
    roomSize:.985, 
    dry:1 
  }
}

},{}],118:[function(require,module,exports){
module.exports = {

  snappy: {
    decay:.125,
    snappy:1.5,
    tune:.1
  },

  dull: {
    snappy:.15,
    decay:.15,
    tune:-.1
  }

}

},{}],119:[function(require,module,exports){
 const names = [
    "Acoustic Grand Piano",
    "Bright Acoustic Piano",
    "Electric Grand Piano",
    "Honky-tonk Piano",
    "Electric Piano 1",
    "Electric Piano 2",
    "Harpsichord",
    "Clavi",
    "Celesta",
    "Glockenspiel",
    "Music Box",
    "Vibraphone",
    "Marimba",
    "Xylophone",
    "Tubular Bells",
    "Dulcimer",
    "Drawbar Organ",
    "Percussive Organ",
    "Rock Organ",
    "Church Organ",
    "Reed Organ",
    "Accordion",
    "Harmonica",
    "Tango Accordion",
    "Acoustic Guitar (nylon)",
    "Acoustic Guitar (steel)",
    "Electric Guitar (jazz)",
    "Electric Guitar (clean)",
    "Electric Guitar (muted)",
    "Overdriven Guitar",
    "Distortion Guitar",
    "Guitar harmonics",
    "Acoustic Bass",
    "Electric Bass (finger)",
    "Electric Bass (pick)",
    "Fretless Bass",
    "Slap Bass 1",
    "Slap Bass 2",
    "Synth Bass 1",
    "Synth Bass 2",
    "Violin",
    "Viola",
    "Cello",
    "Contrabass",
    "Tremolo Strings",
    "Pizzicato Strings",
    "Orchestral Harp",
    "Timpani",
    "String Ensemble 1",
    "String Ensemble 2",
    "SynthStrings 1",
    "SynthStrings 2",
    "Choir Aahs",
    "Voice Oohs",
    "Synth Voice",
    "Orchestra Hit",
    "Trumpet",
    "Trombone",
    "Tuba",
    "Muted Trumpet",
    "French Horn",
    "Brass Section",
    "SynthBrass 1",
    "SynthBrass 2",
    "Soprano Sax",
    "Alto Sax",
    "Tenor Sax",
    "Baritone Sax",
    "Oboe",
    "English Horn",
    "Bassoon",
    "Clarinet",
    "Piccolo",
    "Flute",
    "Recorder",
    "Pan Flute",
    "Blown Bottle",
    "Shakuhachi",
    "Whistle",
    "Ocarina",
    "Lead 1 (square)",
    "Lead 2 (sawtooth)",
    "Lead 3 (calliope)",
    "Lead 4 (chiff)",
    "Lead 5 (charang)",
    "Lead 6 (voice)",
    "Lead 7 (fifths)",
    "Lead 8 (bass + lead)",
    "Pad 1 (new age)",
    "Pad 2 (warm)",
    "Pad 3 (polysynth)",
    "Pad 4 (choir)",
    "Pad 5 (bowed)",
    "Pad 6 (metallic)",
    "Pad 7 (halo)",
    "Pad 8 (sweep)",
    "FX 1 (rain)",
    "FX 2 (soundtrack)",
    "FX 3 (crystal)",
    "FX 4 (atmosphere)",
    "FX 5 (brightness)",
    "FX 6 (goblins)",
    "FX 7 (echoes)",
    "FX 8 (sci-fi)",
    "Sitar",
    "Banjo",
    "Shamisen",
    "Koto",
    "Kalimba",
    "Bag pipe",
    "Fiddle",
    "Shanai",
    "Tinkle Bell",
    "Agogo",
    "Steel Drums",
    "Woodblock",
    "Taiko Drum",
    "Melodic Tom",
    "Synth Drum",
    "Reverse Cymbal",
    "Guitar Fret Noise",
    "Breath Noise",
    "Seashore",
    "Bird Tweet",
    "Telephone Ring",
    "Helicopter",
    "Applause",
    "Gunshot"
  ]

module.exports = {}

for( let name of names ) {
  module.exports[ name ] = {
    presetInit( audio, props ) {
      this.load( names.indexOf( name ), props === undefined ? 0 : props.bank || 0 )
    }
  }
  if( name.indexOf( ' ' ) > -1 ) {
    const underscorename = name.replaceAll( ' ', '_' )
    module.exports[ underscorename ] = module.exports[ name ]
  }
}


},{}],120:[function(require,module,exports){
module.exports = {

  acidBass: {
    Q:.9,
    filterModel:2,
    filterMult:4,
    cutoff:1.25,
    saturation:3.5,
    attack:1/8192,
    decay:1/10,
    octave:-3,
    glide:2000,
    description:`A sawtooth feeding a TB303-style lowpass filter, with high Q settings and a short envelope.`
  },

  acidBass2: {
    Q:.7,
    filterModel:2,
    filterMult:3.5,
    cutoff:.5,
    saturation:10,
    attack:1/8192,
    decay:1/10,
    octave:-2,
    glide:100
  },

  'bass.hollow': {
    Q:.2,
    filterModel:2,
    filterMult:4,
    cutoff:1.25,
    saturation:20,
    attack:1/8192,
    decay:1/4,
    octave:-3,
    glide:1000
  },

  'bleep.dry': { 
    attack:1/256, decay:1/32, 
    waveform:'sine' 
  },
  'bleep': { 
    attack:1/256, decay:1/32, 
    waveform:'sine' 
  },

  'bleep.echo': { 
    waveform:'sine', 
    attack:1/256, decay:1/32, 
    gain:.25,
    presetInit: function( audio ) {
      this.fx.push( audio.effects.Delay({ feedback:.5, time:1/12 }) )
    }
  },

  shimmer: {
    attack:1/128, decay:2,
    waveform:'pwm',
    filterModel:1,
    cutoff:1,
    filterMult:1,
    Q:.6,
    maxVoices:3,
    gain:.1,
    antialias:false,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Chorus('warbly') )
      this.pwmod = audio.Gen.make( audio.Gen.ugens.mul( audio.Gen.ugens.cycle(8), .275 ) )
      this.pwmod.connect( this.pulsewidth )
    }
  },

  stringPad: {
    attack:1/2, decay:1.5, gain:.015,
    presetInit: function( audio ) {
      this.fx.chorus = audio.effects.Chorus('lush')
      this.fx.add( this.fx.chorus  )
    }
  },

  cry: {
    attack:1/2, decay:1.5, gain:.045,
    panVoices:true,
    presetInit: function( audio ) {
      this.chorus = audio.effects.Chorus('lush', { isStereo:true })
      this.fx.add( this.chorus  )
      this.bitCrusher = audio.effects.BitCrusher({ bitDepth:.5, isStereo:true })
      this.fx.add( this.bitCrusher )
      //// gen( .5 + cycle( btof(16) ) * .35
      this.srmod = audio.Gen.make( audio.Gen.ugens.add( .5, audio.Gen.ugens.mul( audio.Gen.ugens.cycle(.125/2), .35 ) ) )
      this.bitCrusher.sampleRate = this.srmod
      this.delay = audio.effects.Delay({ time:1/6, feedback:.75 })
      this.fx.add( this.delay )
    }
  },

  brass: {
    attack:1/6, decay:1.5, gain:.05,
    filterModel:1, Q:.5575, cutoff:2,
    presetInit: function( audio ) {
      this.fx.add( audio.effects.Chorus('lush') )
      this.chorus = this.fx[0]
    }
  },

  'brass.short':{
    gain:.75,
    filterModel:1,
    antialias:true,
    attack:1/32,
    decay:1/16,
    filterMult:3,
    cutoff:.175,
    Q:.6
  },

  'pwm.squeak':{
    waveform:'pwm',
    attack:1/4096,
    decay:1/16,
    Q:.8,
    cutoff:.65,
    saturation:5,
    filterModel:2,
    glide:500
  },

  'pwm.short':{
    attack:1/1024,
    decay:1/8,
    antialias:true,
    waveform:'pwm'
  },

  chirp: { filterModel:2, cutoff:.325, decay:1/16 }, 

  'square.perc': { 
    waveform:'square', 
    shape:'exponential', 
    antialias:true, 
    filterModel:2, 
    cutoff:.25, 
    decay:1/8,
    panVoices:true
  },
  'square.bass': {
    waveform:'square',
    shape:'exponential',
    antialias:true,
    filterModel:2,
    cutoff:.25,
    decay:1/4,
    panVoices:false,
    octave:-3,
    gain:1
  },
  'square.perc.long': { 
    waveform:'square', 
    shape:'exponential', 
    antialias:true, 
    filterModel:2, 
    cutoff:.25, 
    decay:2,
    panVoices:true
  },

  rhodes:{
    waveform:'sine',
    presetInit( audio ) {
      this.tremolo = audio.effects.Tremolo()
      this.fx.add( this.tremolo )
    },
    decay:4,
    gain:.125,
    shape:'exponential'
  },

  blank: {
    filterModel:0,
    waveform:'sine',
    antialias:false
  }
}

},{}],121:[function(require,module,exports){
const Gibberish = require( 'gibberish-dsp' )
const serialize = require( 'serialize-javascript' )
const Tune      = require( './external/tune-api-only.js' )

let Gibber = null

const Theory = {
  // needed to force library to be serialized for transport to 
  // worklet processor, must use key:function() {} format
  // for methods for serialize to work
  __Tune:Tune,

  Tune:null,
  name:'Theory',
  id:null,
  type: 'Audio',
  nogibberish:true,
  quality:'minor',
  baseNumber:60,
  __tuning:'et',
  __mode: 'aeolian',
  __root:440,
  __offset:0,
  __degree:'i',
  __loadingPrefix:'js/external/tune.json/', 
  __loadingExt:'js',
  __tunings:{
    et: {
      root:'60',
      mode:'absolute',
      frequencies:[
        261.62558,
        277.182617,
        293.664764,
        311.126984,
        329.627563,
        349.228241,
        369.994415,
        391.995422,
        415.304688,
        440,
        466.163757,
        493.883301,
        523.251083727363
      ],
      description:'equal tempered (edo)'
    }
  },  

  modes: {
    ionian:     [0,2,4,5,7,9,11],
    dorian:     [0,2,3,5,7,9,10],
    phrygian:   [0,1,3,5,7,8,10],
    lydian:     [0,2,4,6,7,9,11],
    mixolydian: [0,2,4,5,7,9,10],
    aeolian:    [0,2,3,5,7,8,10],
    locrian:    [0,1,3,5,6,8,10],
    melodicminor:[0,2,3,5,7,8,11],
    wholeHalf:  [0,2,3,5,6,8,9,11],
    halfWhole:  [0,1,3,4,6,7,9,10],
    chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
  },

  store:function() { 
    Gibberish.Theory = this

    this.Tune.TuningList = this.__tunings

    this.initProperties()
  },

  setup( tuning='et', mode='aeolian' ) {
    this.tuning = tuning
    this.mode = mode
  }, 

  // adapted from https://gist.github.com/stuartmemo/3766449
  __noteToFreq( note ) {
    note = note.toUpperCase() 

    let notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
        octave,
        keyNumber

    if (note.length === 3) {
      octave = note.charAt(2)
    } else {
      octave = note.charAt(1)
    }
    keyNumber = notes.indexOf(note.slice(0, -1))
    if (keyNumber < 3) {
      keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1
    } else {
      keyNumber = keyNumber + ((octave - 1) * 12) + 1
    }

    return 440 * Math.pow(2, (keyNumber- 49) / 12)
  },

  deleteProperties: function() {
    if( Gibberish.mode === 'worklet' ) {
      delete this.__root
      delete this.__tuning
      delete this.__mode
      delete this.__offset
      delete this.__degree

      Theory.markup = {
        textMarkers : {},
        cssClasses: {}
      }

      this.__root = 440
      this.__tuning = 'et'
      this.__offset = 0
      this.__degree = 'i'
      this.__mode = 'aeolian'
    }
  },

  initProperties: function() {
    if( Gibberish.mode === 'worklet' ) {
      Gibber.createProperty( 
        this, 'root', 440, function() {
          if( typeof Theory.__root.value === 'string' ) {
            Theory.root = Theory.__noteToFreq( Theory.__root.value )
          } 
        },
        
        1
      )

      Gibber.createProperty( 
        this, 'tuning', 'et', 
        function() { // XXX why doesn't this work??? duplicated below... 
          this.loadScale( this.__tuning.value ) 
        },
        1
      )

      Gibber.createProperty( this, 'mode', 'aeolian', null, 0 )
      Gibber.createProperty( this, 'offset', 0, null, 0 )
      Gibber.createProperty( this, 'degree', 'i', null, 0 )

      //setTimeout( ()=> Theory.tuning = 'et', 250 )
      this.tuning = 'et'
      //this.loadScale('et')
    }else{
      this.__initDegrees()

      Object.defineProperty( this, 'root', {
        get() { return this.__root },
        set(v) {
          if( typeof v=== 'string' ) {
            v = this.__noteToFreq( v )
          } 
          this.__root = v
          this.Tune.tonicize( this.__root )
        }
      })

      Object.defineProperty( this, 'tuning', {
        get() { return this.__tuning },
        set(v) {
          this.__tuning = v
          //this.loadScale( v )
        }
      })

      Object.defineProperty( this, 'mode', {
        get()  { return this.__mode },
        set(v) { 
          if( this.modes[ v ] !== undefined || v === null ) {
            this.__mode = v 
          }else{
            console.error( `The mode "${v}" is not valid. Valid modes include ${Object.keys(this.modes).toString()}, and null. No change to Theory.mode was applied.` )
          }
        }
      })

      Object.defineProperty( this, 'offset', {
        get()  { return this.__offset },
        set(v) { this.__offset = v }
      })

      Object.defineProperty( this, 'degree', { 
        get() { return this.__degree },
        set( __degree ) {
          if( typeof __degree  === 'string' ) {
            const degree = this.__degrees[ this.quality ][ __degree ]
        
            this.__degree = degree
            //this.rootNumber = degree.offset + this.baseNumber
            this.mode = degree.mode
          }
        }
      })

      this.degree = 'i'
    }
  },

  __degrees: { major:{}, minor:{} },

  __initDegrees:function() {
    const base = [ 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii' ]

    const scales = [ { name:'minor', values:this.modes.aeolian }, { name:'major', values:this.modes.ionian } ]

    for( let scale of scales ) {
      let name = scale.name
      let values = scale.values

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ]
        this.__degrees[ name ][ chord ] = { mode:'aeolian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'aeolian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'aeolian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'aeolian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'aeolian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ].toUpperCase()
        this.__degrees[ name ][ chord ] = { mode:'ionian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'ionian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'ionian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'ionian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'ionian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ] + '7'
        this.__degrees[ name ][ chord ] = { mode:'dorian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'dorian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'dorian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'dorian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'dorian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ].toUpperCase() + '7'
        this.__degrees[ name ][ chord ] = { mode:'mixolydian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'mixolydian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'mixolydian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'mixolydian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'mixolydian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ] + 'o'
        this.__degrees[ name ][ chord ] = { mode:'locrian', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'locrian', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'locrian', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'locrian', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'locrian', offset: values[i] + 24 }
      }

      for( let i = 0; i < base.length; i++ ) {
        const chord = base[ i ] + 'M7'
        this.__degrees[ name ][ chord ] = { mode:'melodicminor', offset: values[i] }
        this.__degrees[ name ][ '-'+chord ] = { mode:'melodicminor', offset: values[i] - 12 }
        this.__degrees[ name ][ '--'+chord ] = { mode:'melodicminor', offset: values[i] - 24 }
        this.__degrees[ name ][ '+'+chord ] = { mode:'melodicminor', offset: values[i] + 12 }
        this.__degrees[ name ][ '++'+chord ] = { mode:'melodicminor', offset: values[i] + 24 }
      }
    }
  },

  init:function( __Gibber ) {
    Gibber = __Gibber

    this.Tune = new this.__Tune()
    this.Tune.TuningList = this.__tunings

    if( Gibberish.mode === 'worklet' ) {
      this.id = Gibberish.utilities.getUID()

      // can't send prototype methods of Tune over processor
      // so they need to be explicitly assigned
      this.Tune.loadScale = this.Tune.__proto__.loadScale
      this.Tune.note = this.Tune.__proto__.note
      this.Tune.frequency = this.Tune.__proto__.frequency
      this.Tune.tonicize = this.Tune.__proto__.tonicize
      this.Tune.ratio = this.Tune.__proto__.ratio
      this.Tune.MIDI = this.Tune.__proto__.MIDI
      
      Gibberish.worklet.port.postMessage({
        address:'add',
        properties:serialize( Theory ),
        id:this.id,
        post:'store'
      })

      Gibber.subscribe( 'clear', () => this.reset() )
      this.initProperties()
    }

    this.__initDegrees()
  },

  reset:function() {
    Theory.root = 440
    Theory.mode = 'aeolian'
    Theory.tuning = 'et'
    Theory.degree = 'i'
    Theory.offset = 0
  },

  freeze:function() {
    if( Gibberish.mode === 'worklet' ) {
      Gibber.Theory.degree.sequencers.forEach( s => s.stop() )  
      Gibber.Theory.offset.sequencers.forEach( s => s.stop() )  
      Gibber.Theory.mode.sequencers.forEach( s => s.stop() )  
      Gibber.Theory.root.sequencers.forEach( s => s.stop() )  
    }
  },

  thaw:function() {
    if( Gibberish.mode === 'worklet' ) {
      this.degree.sequencers.forEach( s => s.start() )  
      this.offset.sequencers.forEach( s => s.start() )  
      this.mode.sequencers.forEach( s => s.start() )  
      this.root.sequencers.forEach( s => s.start() )  
    }
  },

  loadScale: function( name ) {
    if( Gibberish.mode === 'worklet' ) {
      // if the scale is already loaded...
      if( this.__tunings[ name ] !== undefined ) {
        this.__tuning.value = name
        this.Tune.loadScale( name )

        Gibberish.worklet.port.postMessage({
          address:'method',
          object:this.id,
          name:'loadScale',
          args:[name]
        })
        return
      }

      const path = this.__loadingPrefix + name + '.' + this.__loadingExt 
      fetch( path )
        .catch( console.err )
        .then( data => {
          if( data.ok ) {
            return data.json()
          }else{
            console.error( `The tuning ${name} wasn't found. Please visit http://abbernie.github.io/tune/scales.html to find the names of valid tunings.`) 
          } 
        })
        .then( json => {
          this.addScaleJSON( json, name )
          //this.__tuning.value = name
          //Gibberish.worklet.port.postMessage({
          //  address:'addToProperty',
          //  object:this.id,
          //  name:'__tunings',
          //  key:name,
          //  value:json
          //})

          //Gibberish.worklet.port.postMessage({
          //  address:'method',
          //  object:this.id,
          //  name:'loadScale',
          //  args:[name]
          //})

          //this.__tunings[ name ] = json
          //this.Tune.loadScale( name )
        })
    }else{
      this.Tune.loadScale( name )
    }
  },

  addScaleJSON: function( json, name ) {
    this.__tuning.value = name
    Gibberish.worklet.port.postMessage({
      address:'addToProperty',
      object:this.id,
      name:'__tunings',
      key:name,
      value:json
    })

    Gibberish.worklet.port.postMessage({
      address:'method',
      object:this.id,
      name:'loadScale',
      args:[name]
    })

    this.__tunings[ name ] = json
    this.Tune.loadScale( name )
  },

  // REMEMBER THAT THE .note METHOD IS ALSO MONKEY-PATCHED
  // IN ugen.js, THIS IS WHERE MOST OF THE AWPROCESSOR NOTE
  // METHOD IS IMPLEMENTED.
  note: function( __idx, octave=0, round=true ) {
    let finalIdx, mode = null, __float = __idx % 1, baseOctave, nextOctave

    let isInt = __float === 0
    if( !isInt && round===true ) {
      __idx = Math.round( __idx )
      isInt = true
    }
    
    let baseIndex = __idx < 0 ? Math.ceil( __idx ) : Math.floor( __idx ),
        nextIndex = __idx >= 0 ? baseIndex + 1 : baseIndex - 1

    baseIndex += Gibberish.Theory.__offset
    nextIndex += Gibberish.Theory.__offset

    if( Gibberish.Theory.mode !== 'chromatic' && Gibberish.Theory.mode !== null ) {
      mode = Gibberish.Theory.modes[ Gibberish.Theory.mode ]
      baseOctave = Math.floor( baseIndex / mode.length )
      nextOctave = Math.floor( nextIndex / mode.length )
      
      // XXX this looks crazy ugly but works with negative note numbers...
      baseIndex = baseIndex < 0 
        ? mode[ (mode.length - (Math.abs( baseIndex ) % mode.length)) % mode.length ] 
        : mode[ Math.abs( baseIndex ) % mode.length ]

      if( !isInt ) {
        nextIndex = nextIndex < 0 
          ? mode[ (mode.length - (Math.abs( nextIndex ) % mode.length)) % mode.length ] 
          : mode[ Math.abs( nextIndex ) % mode.length ]
      }
    }else{
      // null mode also means to use 'chromatic' mode
      mode = Gibberish.Theory.modes[ 'chromatic' ]
      const l = Gibberish.Theory.Tune.scale.length 
      baseOctave = Math.floor( baseIndex / l )
      nextOctave = Math.floor( baseIndex / l )

      baseIndex = baseIndex < 0 
        ? mode[ (l - (Math.abs( baseIndex ) % l)) % l ] 
        : mode[ Math.abs( baseIndex ) % l ]

      if( !isInt ) {
        nextIndex = nextIndex < 0 
          ? mode[ (l - (Math.abs( nextIndex ) % l)) % l ] 
          : mode[ Math.abs( nextIndex ) % l ]
      }
    }

    baseIndex += this.__degree.offset
    nextIndex += this.__degree.offset

    let outputFreq = 0
    if( !isInt ) {
      const freq0 = Gibberish.Theory.Tune.note( baseIndex, baseOctave )
      const freq1 = Gibberish.Theory.Tune.note( nextIndex, nextOctave )
      let   diff  = freq1 - freq0
      if( __idx < 0 ) diff *= -1
      outputFreq = freq0 + (diff*__float)
    }else{
      outputFreq = Gibberish.Theory.Tune.note( baseIndex, baseOctave )
    }

    return outputFreq 
  },
}

module.exports = Theory

},{"./external/tune-api-only.js":92,"gibberish-dsp":169,"serialize-javascript":126}],122:[function(require,module,exports){
const Presets = require( './presets.js' )
const Theory  = require( './theory.js' )
const Gibberish = require( 'gibberish-dsp' )
const seqDefaults = require( './defaults.js' )
// Gibber ugens are essentially wrappers around underlying gibberish 
// ugens, providing convenience methods for rapidly sequencing
// and modulating them.

const poolSize = 12

// DRY method for removing a sequence and its associated annotations.
const removeSeq = function( obj, seq ) {
  const idx = obj.__sequencers.indexOf( seq )
  obj.__sequencers.splice( idx, 1 )
  seq.stop()
  seq.clear()
}

const createMapping = function( from, to, name, wrappedTo ) {
  if( from.__useMapping === false ) {
    wrappedTo[ name ] = from
  }else if( from.type === 'audio' ) {
    const f = to[ '__' + name ].follow = Follow({ input: from })

    let m = f.multiplier
    Object.defineProperty( to[ name ], 'multiplier', {
      get() { return m },
      set(v) { m = v; f.multiplier = m }
    })

    let o = f.offset
    Object.defineProperty( to[ name ], 'offset', {
      get() { return o },
      set(v) { o = v; f.offset = o }
    })

    wrappedTo[ name ] = f
  }else if( from.type === 'gen' ) {
    // gen objects can be referred to without the graphics/audio abstraction,
    // in which case they will have no .render() function, and don't need to be rendered
    const gen = from.render !== undefined ? from.render() : from

    wrappedTo[ name ] = gen
  }
}

const Ugen = function( gibberishConstructor, description, Audio, shouldUsePool = false, isBinop = false ) {

  let   poolCount = poolSize
  const pool = []

  const constructor = function( ...args ) {
    const properties = Presets.process( description, args, Audio ) 
    const timeProps = Audio.timeProps[ description.name ] === undefined ? [] : Audio.timeProps[ description.name ]

    if( timeProps.length > 0 ) {
      for( let key in properties ) {
        if( timeProps.indexOf( key ) > -1 ) {
          properties[ key ] = Audio.Clock.time( properties[ key ] )
        }
      }
    }

    // XXX if you want to use pooling you must also uncomment near the bottom of this file...
    // Pooling could work for reverbs IF:
    // 1. There would have to be separate mono and stereo pools.2
    // 2. Reverbs would need to run with 0 input for a while so that the functions are JIT'd

    //if( shouldUsePool && poolCount < pool.length ) {
    //  pool[ poolCount ].inUse = true
    //  const poolUgen = pool[ poolCount ].ugen
    //  poolCount++
    //  Object.assign( poolUgen, properties, args )
    //  console.log( 'pool ugen:', poolUgen )
    //  return poolUgen
    //}

    let __wrappedObject
    if( isBinop === true ) {
      __wrappedObject = gibberishConstructor( ...args ) 
    }else{
      __wrappedObject = gibberishConstructor( properties )
    }
    
    const obj = { 
      __wrapped__ :__wrappedObject,
      __sequencers : [], 
      __tidals: [],
      name:description.name,
      type:'audio',

      stop( time=null ) {
        if( time === null ) {
          for( let seq of this.__sequencers ) seq.stop()
          for( let seq of this.__tidals ) seq.stop()
        }else{
          time = Audio.Clock.time( time )
          for( let seq of this.__sequencers ) {
            future( seq => seq.stop(), time, { seq })
          }

          for( let seq of this.__tidals ) {
            future( seq => seq.stop(), time, { seq })
          }
        }
        return this
      },
      play( time=null ) {
        if( time === null ) {
          for( let seq of this.__sequencers ) seq.start()
          for( let seq of this.__tidals ) seq.start()
        }else{
          time = Audio.Clock.time( time )
          for( let seq of this.__sequencers ) {
            future( seq => seq.start(), time, { seq })
          }

          for( let seq of this.__tidals ) {
            future( seq => seq.start(), time, { seq })
          }
        }

        return this
      },
      clear() {
        for( let seq of this.__sequencers ) {
          seq.clear()
        }
        for( let seq of this.__tidals ) {
          seq.clear()
        }
        //console.log( Gibberish.mode, __wrappedObject.connected )
        if( __wrappedObject.connected !== undefined ) {
          for( let connection of __wrappedObject.connected ) {
            if( this.fx.indexOf( connection[ 0 ] ) === -1 ) {
              this.disconnect( connection[ 0 ] )
            }else{
              this.disconnect()
            }
          }
        }
        if( this.__onclear !== undefined ) {
          this.__onclear()
        }
      }
    }

    // add poly methods
    if( description.name.indexOf('Poly') > -1 || description.name.indexOf('Multi') > -1 || description.name.indexOf('Soundfont') > -1 ) {
      let useProp = description.name.indexOf('Poly') > -1
      obj.spread = function( amt=1 ) {
        if( amt === 0 ) {
          children.forEach( (c,i) => { 
            if( useProp ) 
              c.pan = .5 
            else 
              if( obj.maxVoices.value > 1 ) obj.setpan(i,.5) 
          })
          return obj
        }
        const children = this.__wrapped__.voices
        const incr = 1/(children.length-1) * amt
        children.forEach( (c,i) => {
          if( useProp ) 
            c.pan = Math.min(.999999,(.5 - amt/2) + i * incr)
          else
            if( obj.maxVoices.value > 1 ) obj.setpan( i, Math.min(.999999,(.5-amt/2) + i * incr ))
        })

        return obj
      }
      obj.voices = obj.__wrapped__.voices
      obj.inspect = function() {
        console.group( 'Inspecting ' + description.name )
        console.table( Object.assign({}, obj.voices[0].__wrapped__.__properties__, obj.__wrapped__.__properties__ ) )
        console.groupEnd()
      }
      for( let i = 0; i < 20; i++ ) {
        Object.defineProperty( obj, i, { get() { return obj.voices[i] } })
      }
    }
//btos: function( beats ) {
//    const samplesPerBeat = Gibberish.ctx.sampleRate / (this.bpm / 60 )
//    return samplesPerBeat * beats 
//  }
    // transform beat values to samples
    // in the case of a gen graph convert to a new gen object
    const timetransform = function( v ) {
      const out = typeof v === 'number' 
        ? Audio.Clock.time( v ) 
        : v.type === 'gen' 
          ? Gen.make( 
              genish.mul( 
                genish.div( 44100, genish.div( Clock.bpm, 60 ) ),
                v.graph
              ) 
            )
          : v

      return out
    }

    // wrap properties and add sequencing to them
    for( let propertyName in description.properties ) {
      if( __wrappedObject.__requiredRecompilation && __wrappedObject.__requiresRecompilation.indexOf( propertyName ) > -1 ) continue
      // XXX we have to pass id in the values dictionary under 
      // certain conditions involoving gen ugens, but we don't 
      // want .id to be sequencable!
      if( propertyName !== 'id' && propertyName !== 'type' ){
        const transform = timeProps.indexOf( propertyName ) > -1 
          ? timetransform
          : null 

        const value = __wrappedObject[ propertyName ] === undefined 
          ? __wrappedObject.__properties__[ propertyName ]
          : __wrappedObject[ propertyName ]

        if( propertyName === 'octave' ) {
          obj.octave = properties.octave || 0
          __wrappedObject.__properties__.octave = __wrappedObject.octave = obj.octave
        }else{
          Audio.createProperty( obj, propertyName, value, null, 0, transform )
        }

        // create per-voice version of property... what properties should be excluded?
        if( description.name.indexOf('Poly') > -1 || description.name.indexOf('Multi') > -1 || description.name.indexOf('Soundfont') > -1 ) {
          Audio.createProperty( obj, propertyName+'V', value, null, 0, transform, true )//, timeProps, Audio, true )

          //createProperty( obj, propertyName, __wrappedObject, timeProps, Audio, true )
          // we don't have a way to add properties to objects in the processor thread
          // so we'll just add a method... sequencing will still work the same.
          Gibberish.worklet.port.postMessage({
            address:'addMethod',
            id:__wrappedObject.id,
            key:propertyName+'V',
            function:`function( v ) {this.voices[ this.voiceCount % this.voices.length ][ '${propertyName}' ] = v }`
          })
        }
      }
    }

    if( description.methods !== null && description.methods.indexOf( 'note' ) > -1 ) { 
      description.methods.push( 'notef' )
      description.methods.push( 'notec' )
    }

    // wrap methods and add sequencing to them
    if( description.methods !== null ) {
      for( let methodName of description.methods ) {
        if( methodName !== 'note' || description.name.indexOf('Sampler') > -1 || description.name.indexOf('Multisampler') > -1 ) { //|| description.name.indexOf('Soundfont') > -1 ) {
          //obj[ methodName ] = __wrappedObject[ methodName ].bind( __wrappedObject )
          obj[ methodName ] = function( ...args ) {
            if( args.length === 0 ) {
              __wrappedObject[ methodName ]()
            }else{ //if( args.length === 1 ) {
              //if( Array.isArray( args[0] ) ) {
              //  obj[ methodName ].seq( args[0], 1/args[0].length )
              //}else if( typeof args[0] === 'string' ) {
              //  obj[ methodName ].tidal( args[0] )
              //}else{
                __wrappedObject[ methodName ]( ...args )
              //}
            }/*else{
              // could be a .tidal or a seq 
              if( typeof args[0] === 'string' ) { // must be tidal with tidal id #
                obj[ methodName ].tidal( ...args )
              }else{
                obj[ methodName ].seq( ...args )  // must be sequence
              }
            }*/

            return obj
          }
          obj[ methodName ].__name  = methodName
          obj[ methodName ].__owner = obj
        }else{
          // in this block we are monkey patching the note method of Gibberish synths so that
          // they use Gibber's harmonic system inside the AudioWorkletProcessor.

          obj[ methodName ] = function( ...args ) {
            let shouldSendNoteNow = false
            if( args.length === 0 ) {
               shouldSendNoteNow = true
            }else if( args.length === 1 ) {
              if( Array.isArray( args[0] ) ) {
                obj[ methodName ].seq( args[0], 1/args[0].length )
              }else if( typeof args[0] === 'string' ) {
                obj[ methodName ].tidal( args[0] )
              }else{
                shouldSendNoteNow = true
              }
            }else{
              /*
              // could be a .tidal or a seq 
              if( typeof args[0] === 'string' ) { // must be tidal with tidal id #
                obj[ methodName ].tidal( ...args )
              }else{
                obj[ methodName ].seq( ...args )  // must be sequence
              }
              */
            }

            // this should only be for direct calls from the IDE
            if( shouldSendNoteNow && Gibberish.mode === 'worklet' ) {
              Gibberish.worklet.port.postMessage({
                address:'method',
                object:__wrappedObject.id,
                name:methodName,
                args
              })
            }

            return obj
          }
          obj[ methodName ].__name = methodName
          obj[ methodName ].__owner = obj

          Gibberish.worklet.port.postMessage({
            address:'addMethod',
            id:__wrappedObject.id,
            key:'notef',
            function:`function( note, __loudness=null, decay=null ){
              const loudness = __loudness = null ? this.__triggerLoudness : __loudness
              this.___note( note, loudness, decay ) 
            }`
          })
          Gibberish.worklet.port.postMessage({
            address:'addMethod',
            id:__wrappedObject.id,
            key:'notec',
            function:`function( note, __loudness=null, decay=null ){
              const loudness = __loudness = null ? this.__triggerLoudness : __loudness
              this.note( note, loudness, decay, false ) 
            }`
          })
          // when a message is received at the address 'monkeyPatch',
          // Gibberish will create a copy of the method identified by
          // the 'key' field, and then assign it back to the object prefaced
          // with double underscores (e.g. __note). The function that is being
          // patched in can then call the original function using the prefaced 
          // name, as is done in the last line of the argument function below.
          Gibberish.worklet.port.postMessage({
            address:'monkeyPatch',
            id:__wrappedObject.id,
            key:'note',
            function:`function( note, __loudness, decay=null, round=true ){ 
              const octave = this.octave || 0
              let notesInOctave = 7
              const mode = Gibberish.Theory.mode

              if( mode !== null ) {
                notesInOctave = mode !== 'chromatic' ? Gibberish.Theory.modes[ mode ].length : Gibberish.Theory.Tune.scale.length
              }else{
                notesInOctave = Gibberish.Theory.Tune.scale.length
              }

              const offset = octave * notesInOctave
              let __note = Gibberish.Theory.note( note + offset, 0, round )

              const loudness = __loudness = null ? this.__triggerLoudness : __loudness
              return this.___note( __note, loudness, decay ) 
            }`
          })
          
        }

        if( methodName === 'notef' ) {
          obj.notef = function( ...args ) {
            __wrappedObject.frequency = args[0]
            __wrappedObject.trigger( __wrappedObject.__triggerLoudness )

            return obj
          }
        }

        if( methodName === 'notec' ) {
          obj.notec = function( ...args ) {
            //__wrappedObject.frequency = args[0]
            //__wrappedObject.trigger( __wrappedObject.__triggerLoudness )
            Gibberish.worklet.port.postMessage({
              address:'method',
              object:__wrappedObject.id,
              name:'notec',
              args
            })
            return obj
          }
        }
        obj[ methodName ].sequencers = []
        obj[ methodName ].tidals = []

        obj[ methodName ].seq = function( values, timings, number=0, delay=0, priority=10000 ) {
          let prevSeq = obj[ methodName ].sequencers[ number ] 
          if( prevSeq !== undefined ) { 
            const idx = obj.__sequencers.indexOf( prevSeq )
            obj.__sequencers.splice( idx, 1 )
            //prevSeq.stop()
            prevSeq.clear()
            // removeSeq( obj, prevSeq )
          }

          let s = Audio.Core.Seq({ values, timings, target:obj/*__wrappedObject*/, key:methodName, priority })
          
          if( typeof delay !== 'function' ) {
            s.start( Audio.Clock.time( delay ) )
          }else{
            delay.seqs.push( s )
          }
          obj[ methodName ].sequencers[ number ] = obj[ methodName ][ number ] = s 
          obj.__sequencers.push( s )

          // return object for method chaining
          return obj
        }
        obj[ methodName ].tidal= function( pattern, number=0, delay=0 ) {
          let prevSeq = obj[ methodName ].tidals[ number ] 
          let s = Audio.Core.Tidal({ pattern, target:__wrappedObject, key:methodName })
          if( s !== null ) {
            if( prevSeq !== undefined ) { 
              const idx = obj.__tidals.indexOf( prevSeq )
              obj.__tidals.splice( idx, 1 )
              prevSeq.stop()
              prevSeq.clear()
              // removeSeq( obj, prevSeq )
            }

            s.start( Audio.Clock.time( delay ) )
            obj[ methodName ].tidals[ number ] = obj[ methodName ][ number ] = s 
            obj.__tidals.push( s )

            // XXX need to clean this up! this is solely here for annotations, and to 
            // match what I did for ensembles... 
            obj[ methodName ].__tidal = s
          }

          // return object for method chaining
          return obj
        }

        
      }
    }


    let id = __wrappedObject.id
    Object.defineProperty( __wrappedObject, 'id', {
      configurable:false,
      get() { return id },
      set(v) {
        //console.log( 'tried to change id:', obj )
        //debugger
      }
    })
    obj.id = __wrappedObject.id

    obj.__follow = null

    const followcheck = ()=> {

    }

    Object.defineProperty( obj, '__out', {
      configurable:false,
      get() {
        if( obj.__follow === null ) {
          obj.__follow = Audio.analysis.Follow({ input:obj }) 
        }

        const output = obj.__follow.output
         
        // will take a few buffers to initialize...
        if( output === undefined ) return 0

        return output[1] === undefined ? output[0] : output[0] + output[1] 
      },
      set(v) {}
    })

    obj.map = ( scale=1,offset=0 ) => {
      const f = Audio.analysis.Follow({ input:obj })
      f.multiplier = scale
      f.offset = offset
      return f
    }

    obj.inspect = ()=> {
      console.group( 'Inspecting ' + description.name )
      const keys = Object.keys( obj.__wrapped__.__properties__ )
      const props = {}
      keys.forEach( key => {
        if( key[0] !== '_' ) {
          if( obj[ key ] !== null && obj[ key ] !== undefined ) {
            props[ key ] = obj[ key ].value
          }
        }
      })
      console.table( props ) 
      //console.table( obj.__wrapped__.__properties__ )
      console.groupEnd()
    }

    obj.follow = function( scale=1, offset=0, bufferSize=null ) {
      return obj.out( scale, offset, bufferSize, true )
    }

    obj.out = function( scale=1, offset=0, bufferSize=null, continuous=null ) {
      // if the buffer size changes...
      if( bufferSize !== null ) {
        if( obj.__follow !== null ) {
          if( bufferSize !== obj.__follow.__wrapped__.bufferSize ) {
            //console.log( 'prev follow', bufferSize, obj.__follow.__wrapped__.bufferSize, obj.__follow )
            
            const tmp = obj.__follow
            // XXX need to remove the previous follow from the graph...
            obj.__follow = Audio.analysis.Follow({ input:Audio.Gibberish.worklet.ugens.get( obj.__follow.__wrapped__.input.id ), bufferSize })

            Audio.Gibberish.worklet.port.postMessage({
              address:'eval',
              code:`const idx = Gibberish.analyzers.findIndex( ugen => ugen.id === ${tmp.id} )
                    if( idx > -1 ) {
                      Gibberish.analyzers.splice(idx,1)
                      Gibberish.dirty( Gibberish.analyzers )
                    }`
            })
          }
        }
      }

      if( continuous === true || Ugen.OUTPUT === Ugen.OUTPUT_FUNCTION )
        return ()=> obj.__out * scale + offset
      else
        return Math.abs( obj.__out * scale ) + offset 
    }

    // XXX where does shouldAddToUgen come from? Not from presets.js...
    if( properties !== undefined && properties.shouldAddToUgen ) Object.assign( obj, properties )

    // create fx chaining api. e.g. synth.fx.add( Chorus(), Freeverb() )
    // we use the 'add' method to enable method chaining alongside instrument calls to
    // .connect() and .seq()

    const __fx = []
    __fx.__push = __fx.push.bind( __fx )
    __fx.add = function( ...args ) {
      args.forEach( fx => obj.__fx.push( fx ) )
      console.log( `added ${args.length} effect(s) to ${obj.name}` )
      return obj
    }
    __fx.inspect = function() {
      if( __fx.length > 0 )
        console.table( __fx.map( fx=>fx.name ) )
      else
        console.log( `there are no effects on ${obj.name} to inspect.` )
    }
    __fx.remove = function( effect=null ) {
      if( effect === null ) {
        obj.__fx.length = 0
        console.log( `all effects from ${obj.name} were removed.` )
      }else if( typeof effect === 'number' ) {
        // XXX broken for indices that !== 0
        const del = obj.__fx.splice( effect, 1 )
        console.log( `${del[0].name} at fx slot ${effect} was removed from ${obj.name}.` ) 
      }else if( typeof effect === 'string' ) {
        const indexesToErase = []
        __fx.forEach( (__effect,i) => { if( effect === __effect.name ) indexesToErase.push( i ) })
        console.log( `${indexesToErase.length} effect(s) were removed from ${obj.name}.` ) 
        for( let i = __fx.length - 1; i >= 0; i-- ) {
          if( indexesToErase.includes( i ) ) __fx.splice( i, 1 )
        }   
      } else if( typeof effect === 'object' ) {
        const idx = __fx.indexOf( effect )
        __fx.splice( idx, 1 )
        console.log( `effect ${effect.name} was removed from ${obj.name}.` ) 
      }
    }
    obj.__fx = new Proxy( __fx, {
      set( target, property, value, receiver ) {

        const lengthCheck = target.length
        const old = target.slice(0)
        target[ property ] = value
        
        if( property === 'length' ) { 
          if( target.length > 1 ) {
            // XXX need to store and reassign to end connection
            target[ target.length - 2 ].disconnect()
            target[ target.length - 2 ].connect( target[ target.length - 1 ] )
            target[ target.length - 1 ].connect()
          }else if( target.length === 1 ) {
            const connected = __wrappedObject.connected !== undefined ?__wrappedObject.connected.slice(0) : null
            __wrappedObject.disconnect()
            __wrappedObject.connect( target[ 0 ] )

            if( connected !== null ) {
              for( let connection of connected ) {
                // 0 is bus, 1 is ugen adding the fx, 2 is send amount
                target[0].connect( connection[0], connection[2] )
              }
            }else{
              target[0].connect( Audio.Out )
            }
          }else if( value === 0 && lengthCheck !== 0 ) {
            // ugh...
            if( __wrappedObject.connected !== undefined ) {
              if( __wrappedObject.connected[0] !== undefined ) {
                __wrappedObject.connect( 
                  __wrappedObject.connected[ 0 ][ 0 ].__wrapped__.connected[ 0 ][ 0 ], 
                  __wrappedObject.connected[ 0 ][ 0 ].__wrapped__.connected[ 0 ][ 2 ] 
                )

                __wrappedObject.connected[ 0 ][ 0 ].disconnect()
              }
            }
          }

        }

        return true
      }
    })

    Object.defineProperty( obj, 'fx', {
      get() { return obj.__fx },
      set(v) {
        const tmpLength = obj.__fx.length
        obj.__fx.length = 0
        if( Array.isArray( v ) ) {
          v.forEach( effect => obj.__fx.push( effect ) ) 
        }else{
          obj.__fx.push( v ) 
        }

        if( tmpLength > 0 ) {

            console.log( `${tmpLength} effect(s) were replaced with ${obj.__fx.length} effect(s) on ${obj.name}` )
        }else{

          if( Array.isArray( v ) ) {
            console.log( `${v.length} effect(s) were added to the fx chain of ${obj.name}` )
          }else{
            console.log( `a ${v.name} was added to the fx chain  of ${obj.name}` )
          }
        }
      }
    })

    obj.connect = (dest,level=1) => {
      if( typeof dest !== 'number' ) {
        if( dest !== undefined && dest.isProperty === true ) {
          // if first modulation for property, store it's initial
          // value before modulating it.
          if( dest.preModValue === undefined ) { 
            dest.preModValue = dest.value
          }

          dest.mods.push( obj )

          const sum = dest.mods.concat( dest.preModValue )
          const add = Audio.binops.Add( ...sum ) 
          // below works for oscillators, above works for instruments...
          //const add = Gibber.Gibberish.binops.Add( ...sum ) 
          add.__useMapping = false
          dest.__owner[ dest.name ] = add

          obj.__wrapped__.connected.push( [ dest.__owner[ dest.name ], obj ] )
        }else{
          // if no fx chain, connect directly to output
          if( obj.fx.length === 0 ) {
            __wrappedObject.connect( dest || Audio.Out, level )
          }else{
            // otherwise, connect last effect in chain to output
            obj.fx[ obj.fx.length - 1 ].__wrapped__.connect( dest, level )
          }
        }
      }else{
        console.log( '%cYou cannot connect to a number; perhaps you meant this to be the level for your connection?', 'color:white;background:#900' )
      }

      return obj 
    } 

    obj.disconnect = dest => { 
      // if there's an effect chain, we disconnect that in addition
      // to disconnecting the ugen itself.
      if( dest === undefined && obj.fx.length > 0 ) {
        obj.fx[ obj.fx.length - 1 ].disconnect()
      }

      __wrappedObject.disconnect(); 
      
      return obj 
    } 

    Object.defineProperty( obj, '_', { get() { obj.disconnect(); return obj } })

    const instrumentName = description.name ==='Multisampler' ? 'Sampler' : description.name
    if( Gibber.extensions !== undefined && Gibber.extensions[ instrumentName ] !== undefined ) {
      Object.assign( obj, Gibber.extensions[ instrumentName ] ) 
    }
    // presetInit is a function in presets that triggers actions after the ugen
    // has been instantiated... it is primarily used to add effects and modulations
    // to a preset.
    if( properties !== undefined && properties.__presetInit__ !== undefined ) {
      properties.__presetInit__.call( obj, Audio, args[1] )
    }

    // only connect if shouldNotConneect does not equal true (for LFOs and other modulation sources)
    if( obj.__wrapped__.type === 'instrument' || obj.__wrapped__.type === 'oscillator' || description.name.indexOf('Poly') > -1 ) {
      if( typeof properties !== 'object' || properties.shouldNotConnect !== true ) {
        
        if( Audio.autoConnect === true ) {
          // ensure that the ugen hasn't already been connected through the fx chain,
          // possibly through initialization of a preset
          if( obj.fx.length === 0 ) obj.connect( Audio.Out )
        }
      }

    }else if( obj.__wrapped__.type === 'effect' ) {
      obj.bus = function() {
        const b = Audio.busses.Bus2()
        b.fx.add( obj )

        const p = new Proxy( b, {
          set( target, property, value, receiver ) {
            // console.log( 'set:', target, property, value, receiver )
            if( b[ property ] === undefined && property !== 'input' ) {
              obj[ property ] = value
            }else{
              b[ property ] = value
            }
          },
          get( target, property, value, receiver ) {
            if( b[ property ] === undefined && property !== 'input' ) {
              return obj[ property ]
            }else{
              return b[ property ]
            }
          }
        })

        p.inspect = function() {
          console.group( 'Inspecting ' + description.name + ' ' + 'Bus' )

          const objKeys = Object.keys( obj.__wrapped__.__properties__ )
          const __obj = {}
          objKeys.forEach( key => {
            //console.log( 'key:', key, obj.__wrapped__ )
            if( key[0] !== '_' && key !== 'bypass' && obj[key] !== undefined ) {
              __obj[ key ] = obj[ key ].value !== undefined
                ? obj[ key ].value
                : obj.__wrapped__.__properties__[ key ].value
            }
          })
          console.group( description.name.toLowerCase() )
          console.table( __obj )
          console.groupEnd()

          console.group('bus')
          console.table( b.__wrapped__.__properties__ )
          console.groupEnd()

          console.groupEnd()
        }

        return p
      }
    }

    // create default sequencing methods
    if( obj.seq === undefined ) {
      obj.seq = function( values, timings, number=0, delay=0, priority=10000 ) {
        const methodName = seqDefaults[ obj.name ] 
        let prevSeq = obj[ methodName ].sequencers[ number ] 
        if( prevSeq !== undefined ) { 
          const idx = obj.__sequencers.indexOf( prevSeq )
          obj.__sequencers.splice( idx, 1 )
          //prevSeq.stop()
          prevSeq.clear()
          // removeSeq( obj, prevSeq )
        }

        let s = Audio.Core.Seq({ values, timings, target:obj/*__wrappedObject*/, key:methodName, priority })

        if( typeof delay !== 'function' ) {
          s.start( Audio.Clock.time( delay ) )
        }else{
          delay.seqs.push( s )
        }
        obj[ methodName ].sequencers[ number ] = obj[ methodName ][ number ] = s 
        obj.__sequencers.push( s )

        // return object for method chaining
        return obj
      }
      obj.tidal= function( pattern, number=0, delay=0 ) {
        const methodName = seqDefaults[ obj.name ] 
        let prevSeq = obj[ methodName ].tidals[ number ] 
        let s = Audio.Core.Tidal({ pattern, target:__wrappedObject, key:methodName })
        if( s !== null ) {
          if( prevSeq !== undefined ) { 
            const idx = obj.__tidals.indexOf( prevSeq )
            obj.__tidals.splice( idx, 1 )
            prevSeq.stop()
            prevSeq.clear()
            // removeSeq( obj, prevSeq )
          }

          s.start( Audio.Clock.time( delay ) )
          obj[ methodName ].tidals[ number ] = obj[ methodName ][ number ] = s 
          obj.__tidals.push( s )

          // XXX need to clean this up! this is solely here for annotations, and to 
          // match what I did for ensembles... 
          obj[ methodName ].__tidal = s
        }


        // return object for method chaining
        return obj
      }
      obj.__seqDefault = seqDefaults[ obj.name ] || 'trigger'
    }
    //console.log( `%c${description.name} created.`, 'color:white;background:#009' )
    Audio.publish( 'new ugen', description.name + ' created', obj  )

    return obj
  }

  //if( shouldUsePool ) {
  //  for( let i=0; i < poolSize; i++ ) {
  //    pool[ i ] = {
  //      inUse:false,
  //      ugen: constructor()
  //    }
  //  } 

  //  poolCount = 0
  //}
  
  //Ugen.createProperty = createProperty

  return constructor
}

Ugen.OUTPUT_FUNCTION = 0
Ugen.OUTPUT_SCALAR = 1
Ugen.OUTPUT = 1


module.exports = Ugen

},{"./defaults.js":87,"./presets.js":100,"./theory.js":121,"gibberish-dsp":169}],123:[function(require,module,exports){
const Utility = {
  rndf( min=0, max=1, number, canRepeat=true ) {
    let out = 0
  	if( number === undefined ) {
  		let diff = max - min,
  		    r = Math.random(),
  		    rr = diff * r

  		out =  min + rr;
  	}else{
      let output = [],
  		    tmp = []

  		for( let i = 0; i < number; i++ ) {
  			let num
        if( canRepeat ) {
          num = Utility.rndf(min, max)
        }else{
          num = Utility.rndf( min, max )
          while( tmp.indexOf( num ) > -1) {
            num = Utility.rndf( min, max )
          }
          tmp.push( num )
        }
  			output.push( num )
  		}

  		out = output
  	}

    return out
  },

  Rndf( _min = 0, _max = 1, quantity, canRepeat=true ) {
    // have to code gen function to hard code min / max values inside, as closures
    // or bound values won't be passed through the worklet port.XXX perhaps there should
    // be a way to transfer a function and its upvalues through the worklet? OTOH,
    // codegen works fine.

    const fncString = `const min = ${_min}
    const max = ${_max} 
    const range = max - min
    const canRepeat = ${quantity} > range ? true : ${ canRepeat }

    let out

    if( ${quantity} > 1 ) { 
      out = []
      for( let i = 0; i < ${quantity}; i++ ) {
        let num = min + Math.random() * range

        if( canRepeat === false ) {
          while( out.indexOf( num ) > -1 ) {
            num = min + Math.random() * range
          }
        }
        out[ i ] = num
      }
    }else{
      out = min + Math.random() * range 
    }

    return out;`
    
    return new Function( fncString )
  },

  rndi( min = 0, max = 1, number, canRepeat = true ) {
    let range = max - min,
        out
    
    if( range < number ) canRepeat = true

    if( typeof number === 'undefined' ) {
      range = max - min
      out = Math.round( min + Math.random() * range )
    }else{
  		let output = [],
  		    tmp = []

  		for( let i = 0; i < number; i++ ) {
  			let num
  			if( canRepeat ) {
  				num = Utility.rndi( min, max )
  			}else{
  				num = Utility.rndi( min, max )
  				while( tmp.indexOf( num ) > -1 ) {
  					num = Utility.rndi( min, max )
  				}
  				tmp.push( num )
  			}
  			output.push( num )
  		}
  		out = output
    }
    return out
  },

  Rndi( _min = 0, _max = 1, quantity=1, canRepeat = false ) {
    // have to code gen function to hard code min / max values inside, as closures
    // or bound values won't be passed through the worklet port.XXX perhaps there should
    // be a way to transfer a function and its upvalues through the worklet? OTOH,
    // codegen works fine.

    const fncString = `const min = ${_min}
    const max = ${_max} 
    const range = max - min
    const canRepeat = ${quantity} > range ? true : ${ canRepeat }

    let out

    if( ${quantity} > 1 ) { 
      out = []
      for( let i = 0; i < ${quantity}; i++ ) {
        let num = min + Math.round( Math.random() * range );

        if( canRepeat === false ) {
          while( out.indexOf( num ) > -1 ) {
            num = min + Math.round( Math.random() * range );
          }
        }
        out[ i ] = num
      }
    }else{
      out = min + Math.round( Math.random() * range ); 
    }

    return out;`
    
    return new Function( fncString )
  },

  time( v ) { return Gibber.Audio.Clock.time( v ) },
  btof( beats ) { return 1 / (beats * ( 60 / Gibber.Audio.Clock.bpm )) },

  random(...args) {
    this.randomFlag = true
    this.randomArgs = args

    return this
  },

  elementArray: function( list ) {
    let out = []

    for( var i = 0; i < list.length; i++ ) {
      out.push( list.item( i ) )
    }

    return out
  },
  
  __classListMethods: [ 'toggle', 'add', 'remove' ],

  create( query ) {
    let elementList = document.querySelectorAll( query ),
        arr = Utility.elementArray( elementList )
    
    for( let method of Utility.__classListMethods ) { 
      arr[ method ] = style => {
        for( let element of arr ) { 
          element.classList[ method ]( style )
        }
      } 
    }

    return arr
  },

  chord( ptrn, offsets ) {
    // gotta codegen function for worklet processor... similar to Rndi etc.
    let fncstr = `args.override = args[0]
    const values = []\n`

    for( let i = 0; i < offsets.length; i++ ) {
      fncstr += `values[${i}] = args[0] + ${offsets[i]}\n`
    }

    fncstr += `args[0] = values\n  return args`

    const fnc = new Function( 'args', fncstr )

    ptrn.addFilter( fnc )

    return ptrn
  },

  export( obj ) {
    obj.rndi = this.rndi
    obj.rndf = this.rndf
    obj.Rndi = this.Rndi
    obj.Rndf = this.Rndf
    obj.btof = this.btof
    obj.chord = this.chord
    obj.time = this.time

    Array.prototype.rnd = this.random
  }
}

module.exports = Utility

},{}],124:[function(require,module,exports){
module.exports = function( Gibber ) {

  const WavePattern = function( ugen ) {
    
    const fnc = function() {
      return fnc.ugen.__wrapped__.callback.out[0] 
    }

    fnc.ugen = ugen

    return Gibber.Pattern( fnc )
  }

  return WavePattern
}

},{}],125:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],126:[function(require,module,exports){
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

'use strict';

// Generate an internal UID to make the regexp pattern harder to guess.
var UID                 = Math.floor(Math.random() * 0x10000000000).toString(16);
var PLACE_HOLDER_REGEXP = new RegExp('"@__(F|R|D|M|S)-' + UID + '-(\\d+)__@"', 'g');

var IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
var IS_PURE_FUNCTION = /function.*?\(/;
var IS_ARROW_FUNCTION = /.*?=>.*?/;
var UNSAFE_CHARS_REGEXP   = /[<>\/\u2028\u2029]/g;

var RESERVED_SYMBOLS = ['*', 'async'];

// Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
// Unicode char counterparts which are safe to use in JavaScript strings.
var ESCAPED_CHARS = {
    '<'     : '\\u003C',
    '>'     : '\\u003E',
    '/'     : '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};

function escapeUnsafeChars(unsafeChar) {
    return ESCAPED_CHARS[unsafeChar];
}

module.exports = function serialize(obj, options) {
    options || (options = {});

    // Backwards-compatibility for `space` as the second argument.
    if (typeof options === 'number' || typeof options === 'string') {
        options = {space: options};
    }

    var functions = [];
    var regexps   = [];
    var dates     = [];
    var maps      = [];
    var sets      = [];

    // Returns placeholders for functions and regexps (identified by index)
    // which are later replaced by their string representation.
    function replacer(key, value) {
        if (!value) {
            return value;
        }

        // If the value is an object w/ a toJSON method, toJSON is called before
        // the replacer runs, so we use this[key] to get the non-toJSONed value.
        var origValue = this[key];
        var type = typeof origValue;

        if (type === 'object') {
            if(origValue instanceof RegExp) {
                return '@__R-' + UID + '-' + (regexps.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Date) {
                return '@__D-' + UID + '-' + (dates.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Map) {
                return '@__M-' + UID + '-' + (maps.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Set) {
                return '@__S-' + UID + '-' + (sets.push(origValue) - 1) + '__@';
            }
        }

        if (type === 'function') {
            return '@__F-' + UID + '-' + (functions.push(origValue) - 1) + '__@';
        }

        return value;
    }

    function serializeFunc(fn) {
      var serializedFn = fn.toString();
      if (IS_NATIVE_CODE_REGEXP.test(serializedFn)) {
          throw new TypeError('Serializing native function: ' + fn.name);
      }

      // pure functions, example: {key: function() {}}
      if(IS_PURE_FUNCTION.test(serializedFn)) {
          return serializedFn;
      }

      // arrow functions, example: arg1 => arg1+5
      if(IS_ARROW_FUNCTION.test(serializedFn)) {
          return serializedFn;
      }

      var argsStartsAt = serializedFn.indexOf('(');
      var def = serializedFn.substr(0, argsStartsAt)
        .trim()
        .split(' ')
        .filter(function(val) { return val.length > 0 });

      var nonReservedSymbols = def.filter(function(val) {
        return RESERVED_SYMBOLS.indexOf(val) === -1
      });

      // enhanced literal objects, example: {key() {}}
      if(nonReservedSymbols.length > 0) {
          return (def.indexOf('async') > -1 ? 'async ' : '') + 'function'
            + (def.join('').indexOf('*') > -1 ? '*' : '')
            + serializedFn.substr(argsStartsAt);
      }

      // arrow functions
      return serializedFn;
    }

    var str;

    // Creates a JSON string representation of the value.
    // NOTE: Node 0.12 goes into slow mode with extra JSON.stringify() args.
    if (options.isJSON && !options.space) {
        str = JSON.stringify(obj);
    } else {
        str = JSON.stringify(obj, options.isJSON ? null : replacer, options.space);
    }

    // Protects against `JSON.stringify()` returning `undefined`, by serializing
    // to the literal string: "undefined".
    if (typeof str !== 'string') {
        return String(str);
    }

    // Replace unsafe HTML and invalid JavaScript line terminator chars with
    // their safe Unicode char counterpart. This _must_ happen before the
    // regexps and functions are serialized and added back to the string.
    if (options.unsafe !== true) {
        str = str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
    }

    if (functions.length === 0 && regexps.length === 0 && dates.length === 0 && maps.length === 0 && sets.length === 0) {
        return str;
    }

    // Replaces all occurrences of function, regexp, date, map and set placeholders in the
    // JSON string with their string representations. If the original value can
    // not be found, then `undefined` is used.
    return str.replace(PLACE_HOLDER_REGEXP, function (match, type, valueIndex) {
        if (type === 'D') {
            return "new Date(\"" + dates[valueIndex].toISOString() + "\")";
        }

        if (type === 'R') {
            return regexps[valueIndex].toString();
        }

        if (type === 'M') {
            return "new Map(" + serialize(Array.from(maps[valueIndex].entries()), options) + ")";
        }

        if (type === 'S') {
            return "new Set(" + serialize(Array.from(sets[valueIndex].values()), options) + ")";
        }

        var fn = functions[valueIndex];

        return serializeFunc(fn);
    });
}

},{}],127:[function(require,module,exports){
module.exports = function( Gibber ) {

let Pattern = Gibber.Pattern

// taken from https://github.com/mkontogiannis/euclidean-rhythms
const getPattern = (pulses, steps) => {
  if (pulses < 0 || steps < 0 || steps < pulses) {
  	return [];
  }

  let first = new Array(pulses).fill([1]);
  let second = new Array(steps - pulses).fill([0]);

  let firstLength = first.length;
  let minLength = Math.min(firstLength, second.length);

  let loopThreshold = 0;
  while (minLength > loopThreshold) {
  	if (loopThreshold === 0) {
  		loopThreshold = 1;
  	}

    for (var x = 0; x < minLength; x++) {
      first[x] = Array.prototype.concat.call(first[x], second[x]);
    }

    if (minLength === firstLength) {
    	second = Array.prototype.slice.call(second, minLength);
    }
    else {
      second = Array.prototype.slice.call(first, minLength);
      first = Array.prototype.slice.call(first, 0, minLength);
    }
    firstLength = first.length;
    minLength = Math.min(firstLength, second.length);
	}

  let pattern = [];
  first.forEach(f => {
    pattern = Array.prototype.concat.call(pattern, f);
  });
  second.forEach(s => {
    pattern = Array.prototype.concat.call(pattern, s);
  });

  return pattern;
};


let Euclid = function( ones, length, time, rotation=0 ) {
  let count = 0,
      onesAndZeros

  onesAndZeros = getPattern( ones,length )

  let pattern = Gibber.Pattern( ...onesAndZeros )

  if( isNaN( time ) || time === null ) time = 1 / onesAndZeros.length

  pattern.onrender = function( rendered ) {
    rendered.type = 'Euclid'

    rendered.time = time

    rendered.output = { time, shouldExecute: 0 }

    rendered.addFilter( ( args, ptrn ) => {
      let val = args[ 0 ]

      ptrn.output.time = Gibberish.Clock.time( ptrn.time )
      ptrn.output.shouldExecute = val 

      args[ 0 ] = ptrn.output 

      return args
    })
  }

  pattern.reseed = ( ...args )=> {
    let n, k
    
    if( Array.isArray( args[0] ) ) {
      k = args[0][0]
      n = args[0][1]
    }else{
      k = args[0]
      n = args[1]
    }

    if( n === undefined ) n = 16
    
    out = createStartingArray( n,k )
    let _onesAndZeros = Inner( n,k )
    
    pattern.set( _onesAndZeros )
    pattern.time = 1 / n

    // this.checkForUpdateFunction( 'reseed', pattern )

    return pattern
  }

  //Gibber.addSequencingToMethod( pattern, 'reseed' )

  if( rotation !== 0 ) pattern.rotate( rotation )
  return pattern
}

// E(5,8) = [ .25, .125, .25, .125, .25 ]
let calculateRhythms = function( values, dur ) {
  let out = []
  
  if( typeof dur === 'undefined' ) dur = 1 / values.length

  let idx = 0,
      currentDur = 0
  
  while( idx < values.length ) {
    idx++
    currentDur += dur
    
    if( values[ idx ] == 1 || idx === values.length ) {
      out.push( currentDur )
      currentDur = 0
    } 
  }
  
  return out
}

let answers = {
  '1,4' : '1000',
  '2,3' : '101',
  '2,5' : '10100',
  '3,4' : '1011',
  '3,5' : '10101',
  '3,7' : '1010100',
  '3,8' : '10010010',
  '4,7' : '1010101',
  '4,9' : '101010100',
  '4,11': '10010010010',
  '5,6' : '101111',
  '5,7' : '1011011',
  '5,8' : '10110110',
  '5,9' : '101010101',
  '5,11': '10101010100',
  '5,12': '100101001010',
  '5,16': '1001001001001000',
  '7,8' : '10111111',
  '11,24': '100101010101001010101010'
}

Euclid.test = function( testKey ) {
  let failed = 0, passed = 0

  if( typeof testKey !== 'string' ) {
    for( let key in answers ) {
      let expectedResult = answers[ key ],
          result = Euclid.apply( null, key.split(',').map( v => parseInt(v) ) ).values.join('')

      console.log( result, expectedResult )

      if( result === expectedResult ) {
        console.log("TEST PASSED", key )
        passed++
      }else{
        console.log("TEST FAILED", key )
        failed++
      }
    }
    console.log("*****************************TEST RESULTS - Passed: " + passed + ", Failed: " + failed )
  }else{
    let expectedResult = answers[testKey],
				result = flatten.call( Euclid.apply( null, testKey.split(',') ) ).join('')

    console.log( result, expectedResult )

    if( result == expectedResult ) {
      console.log("TEST PASSED FOR", testKey)
    }else{
      console.log("TEST FAILED FOR", testKey)
    }
  }
}

return Euclid
}

},{}],128:[function(require,module,exports){
module.exports = function( Gibber ) {

const Pattern = Gibber.Pattern

const Hex = function( hexString, time = 1/16, rotation ) {
  let count = 0,
      onesAndZeros = ''

  if( typeof hexString === 'string' ) {
    for( let chr of hexString ) {
      let num = Number( '0x'+chr )

      onesAndZeros += (num & 8) > 0 ? 1 : 0
      onesAndZeros += (num & 4) > 0 ? 1 : 0
      onesAndZeros += (num & 2) > 0 ? 1 : 0
      onesAndZeros += (num & 1) > 0 ? 1 : 0
    }
  }else{
    onesAndZeros = hexString.toString(2)
    while( onesAndZeros.length < 16 ) {
      onesAndZeros = '0'+onesAndZeros
    }
  }

  let __onesAndZeros = onesAndZeros.split('') 

  const pattern = Gibber.Pattern( ...__onesAndZeros ) 
  
  pattern.onrender = function( rendered ) {
    rendered.type = 'Hex'

    rendered.time = time

    rendered.output = { time, shouldExecute: 0 }

    rendered.addFilter( ( args, ptrn ) => {
      let val = args[ 0 ]

      ptrn.output.time = Gibberish.Clock.time( ptrn.time )
      ptrn.output.shouldExecute = parseInt(val) 

      args[ 0 ] = ptrn.output 

      return args
    })
  }

  pattern.reseed = ( ...args )=> {
    let n, k
    
    if( Array.isArray( args[0] ) ) {
      k = args[0][0]
      n = args[0][1]
    }else{
      k = args[0]
      n = args[1]
    }

    if( n === undefined ) n = 16
    
    out = createStartingArray( n,k )
    let _onesAndZeros = Inner( n,k )
    
    pattern.set( _onesAndZeros )
    pattern.time = 1 / n

    // this.checkForUpdateFunction( 'reseed', pattern )

    return pattern
  }

  //Gibber.addSequencingToMethod( pattern, 'reseed' )

  if( typeof rotation === 'number' ) pattern.rotate( rotation )

  return pattern
}

return Hex

}

},{}],129:[function(require,module,exports){
const Gibber = {
  initialized: false,
  exportTarget: null,
  plugins: [],
  // needed so audio plugin can transfer pattern function string to worklet
  __Pattern: require( './pattern.js' ),

  /* 
   * const promises = Gibber.init([
   *   {
   *     plugin:Audio, // Audio is required, imported, or grabbed via <script>
   *     options: { workletPath:'../dist/gibberish_worklet.js' }
   *   },
   *   {
   *     plugin:Graphics,
   *     options:{ canvas:document.querySelector('canvas' ) }
   *   }
   * ])
  */

  init( plugins ) { 
    this.createPubSub( this )
    this.plugins = plugins

    const promises = []

    // init each plugin and collect promises
    for( let plugin of plugins ) {
      promises.push( 
        plugin.plugin.init( plugin.options, this ) 
      )
    }

    const p = new Promise( (resolve,reject) => {
      const finishedInitPromise = Promise.all( promises ).then( values => {
        
        this.Pattern = this.__Pattern( this )
        this.Seq      = require( './seq.js'      )( this )
        this.Tidal    = require( './tidal.js'    )( this )
        this.Euclid   = require( './euclid.js'   )( this )
        this.Hex      = require( './hex.js'      )( this ) 
        this.Triggers = require( './triggers.js' )( this )
        this.Steps    = require( './steps.js'    )( this )

        values.forEach( v => {
          if( Array.isArray( v ) ) 
            this[ v[1] ] = v[0]
        })

        Gibber.publish( 'init' )
        
        resolve()
      })
    })
  
    return p
  },

  log( ...args ) {
    if( Gibber.Environment ) {
      Gibber.Environment.log( ...args )
    }else{
      console.log( ...args )
    }
  },

  error( ...args ) {
    if( Gibber.Environment ) {
      Gibber.Environment.error( ...args )
    }else{
      console.error( ...args )
    }
  },

  export( obj ) {
    // XXX must keep reference to main pattern function
    // so it can be serialized and transferred to audioworklet  
    obj.Pattern  = this.Pattern
    obj.Seq = this.Seq
    obj.Tidal = this.Tidal
    obj.Euclid = this.Euclid
    obj.Hex = this.Hex
    obj.Triggers = this.Triggers
    obj.Steps = this.Steps

    this.plugins.forEach( p => {
      p.plugin.export( obj, Gibber ) 
    })

    //obj.Clock = this.Clock
    //obj.WavePattern = this.WavePattern
  },

  // XXX stop clock from being cleared.
  clear( shouldPrint=true) { 
    for( let plugin of Gibber.plugins ) {
      plugin.plugin.clear()
    }

    this.Seq.clear()
    this.Tidal.clear()

    this.publish( 'clear', shouldPrint )
  },

  onload() {},

  createPubSub( obj ) {
    const events = {}
    obj.subscribe = function( key, fcn ) {
      if( typeof events[ key ] === 'undefined' ) {
        events[ key ] = []
      }
      events[ key ].push( fcn )
    }

    obj.unsubscribe = function( key, fcn ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.splice( arr.indexOf( fcn ), 1 )
      }
    }

    obj.publish = function( key, data ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.forEach( v => v( data ) )
      }
    }
    obj.once = function( key, fnc ) {
      const __once = ()=> {
        fnc()
        obj.unsubscribe( key, __once )
      }
      obj.subscribe( key, __once )
    }
  },

  // When a property is created, a proxy-ish object is made that is
  // prefaced by a double underscore. This object holds the value of the 
  // property, sequencers for the property, and modulations for the property.
  // Alternative getter/setter methods can be passed as arguments.
  createProperty( obj, name, value, post=null, priority=0, transform=null, isPoly=false ) {
    obj[ '__' + name ] = { 
      value,
      isProperty:true,
      sequencers:[],
      tidals:[],
      mods:[],
      name,
      type:obj.type,
      __owner:obj,

      fade( from=null, to=null, time=4, delay=0 ) {
        if( from === null ) from = this.value
        if( to   === null ) to   = this.value
        Gibber[ obj.type ].createFade( from, to, time, obj, name, delay )
        return obj
      }
    }

    Gibber.addSequencing( obj, name, priority, value, '__' )

    Object.defineProperty( obj, name, {
      configurable:true,
      get: Gibber[ obj.type ].createGetter( obj, name ),
      set: Gibber[ obj.type ].createSetter( obj, name, post, transform, isPoly )
    })
  },

  getType( obj ) {
    let type
    switch( from.type ) {
      case 'audio':
      case 'Audio':
        type = Gibber.Audio
        break
      case 'graphics':
      case 'Graphics':
        type = Gibber.Graphics
        break
      case 'gen':
        type = 'gen'
        break
    }

    return type
  },

  mappings: {},
  
  createMapping( from, to, name, wrappedTo ) {
    const fromlib = this.getType( from ),
          tolib   = this.getType( to )


    if( mappings[ tolib ] !== undefined &&
      mappings[ tolib ][ fromlib ] !== undefined ) {
      
      const mapper = mappings[ tolib ][ fromlib ]

      mapper( name, to, from )
    }

  
    //if( from.type === 'audio' ) {
    //  const f = to[ '__' + name ].follow = Follow({ input: from, bufferSize:4096 })

    //  Marching.callbacks.push( time => {
    //    if( f.output !== undefined ) {
    //      to[ name ] = f.output
    //    }
    //  })

    //  let m = f.multiplier
    //  Object.defineProperty( to[ name ], 'multiplier', {
    //    configurable:true,
    //    get() { return m },
    //    set(v) { m = v; f.multiplier = m }
    //  })

    //  let o = f.offset
    //  Object.defineProperty( to[ name ], 'offset', {
    //    configurable:true,
    //    get() { return o },
    //    set(v) { o = v; f.offset = o }
    //  })
    //}else if( from.type === 'gen' ) {
    //  const gen = from.render( 60, 'graphics' )

    //  // needed for annotations
    //  to[ name ].value.id = to[ name ].value.varName

    //  // XXX fix the two possible locations for the callback
    //  if( to[ name ].value.callback !== undefined ) {
    //    const idx = Marching.callbacks.indexOf( to[ name ].value.callback )
    //    Marching.callbacks.splice( idx, 1 )
    //  }else if( to[ '__'+name ].callback !== undefined ) {
    //    const idx = Marching.callbacks.indexOf( to[ '__'+name ].callback )
    //    Marching.callbacks.splice( idx, 1 )
    //  }

    //  // XXX fix the two possible locations for the callback
    //  if( typeof to[ name ].value === 'object' ) {
    //    to[ name ].value.callback = t => {
    //      const val = gen()
    //      to[ name ] = val
    //      //console.log( 'val:', val, to[ name ].value.widget !== undefined )
    //      let target = to[ name ].value.widget !== undefined ? to[ name ].value.widget : from.widget

    //      if( target === undefined && to[ name ].value.mark !== undefined ) 
    //        target = to[ name ].value.mark.replacedWith

    //      Gibber.Environment.codeMarkup.waveform.updateWidget( target, val, false )
    //    }
    //  }else{
    //    // assignment hack while DOM creation is taking place,
    //    // only needed for mappings to individual vector elements.
    //    if( to[ '__'+name ].widget === undefined ) {
    //      setTimeout( ()=> to[ '__'+name ].widget = gen.pre.widget, 150 )
    //    }

    //    to[ '__'+name ].callback = t => {
    //      const val = gen()
    //      to[ name ] = val
    //      Gibber.Environment.codeMarkup.waveform.updateWidget( to[ '__'+name ].widget, val, false )
    //    }
    //  }

    //  if( typeof to[ name ].value !== 'object' ) {
    //    Marching.callbacks.push( to[ '__'+name ].callback )
    //  }else{
    //    Marching.callbacks.push( to[ name ].value.callback )
    //  }
    //}
  },

  addSequencing( obj, name, priority, value, prefix='' ) {
    if( obj[ prefix+name ] === undefined ) obj[ prefix+name ] = {}

    obj[ prefix+name ].__owner = obj
    obj[ prefix+name ].__name = name
    obj[ prefix+name ].sequencers = []
    obj[ prefix+name ].seq = function ( values, timings, number = 0, delay = 0 ) {
      if( value !== undefined && typeof value === 'object' ) value.name = obj.name
      const type = obj.type === 'gen' ? 'audio' : obj.type
      Gibber.Seq({ 
        values, 
        timings, 
        target:obj,
        key:name,
        priority,
        delay,
        number,
        standalone:false,
        name:obj.name
      })

      return obj
    }

    obj[ prefix+name ].tidal = function( pattern,  number = 0, delay = 0 ) {
      if( value !== undefined && typeof value !== 'number' ) value.name = obj.name
      const type = obj.type === 'gen' ? 'audio' : obj.type
      const s = Gibber.Tidal({ 
        pattern, 
        target:obj, 
        key:name,
        number,
        delay,
        standalone:false
      })

      // return object for method chaining
      return obj
    }
  }
  
}

module.exports = Gibber 

},{"./euclid.js":127,"./hex.js":128,"./pattern.js":130,"./seq.js":131,"./steps.js":132,"./tidal.js":133,"./triggers.js":134}],130:[function(require,module,exports){
const patternWrapper = function( Gibber ) {
  "use strict"

  // hack to pass Gibberish to pattern generator from within worklet processor
  let Gibberish
  if( Gibber.Gibberish === undefined ) {
    Gibberish = Gibber.Audio !== undefined ? Gibber.Audio.Gibberish : Gibber 
  }else{
    Gibberish = Gibber.Gibberish
  }

  const PatternProto = Object.create( function(){} )

  // this prototype is somewhat limited, as we want to be able to add
  // .seq() methods to everything. This means that every pattern needs its own
  // copy of each method. One alternative would be to use a more comprehensive
  // prototype and then place proxies on each method of each pattern that access
  // object-specific sequencers... but just making copies of all functions is certainly
  // simpler.
  Object.assign( PatternProto, {
    type:'pattern',
    DNR: -987654321,
    concat( _pattern ) { this.values = this.values.concat( _pattern.values ) },  
    //toString() { return this.values.toString() },
    //valueOf() { return this.values },

    __message(  key, args ) {
      if( this.category === 'audio' ) {
        if( Gibberish.mode === 'processor' )
          Gibberish.processor.messages.push( this.id, key, args )
      } 
    },

    getLength() {
      let l
      if( this.start <= this.end ) {
        l = this.end - this.start + 1
      }else{
        l = this.values.length + this.end - this.start + 1
      }
      return l
    },

    runFilters( val, idx ) {
      let args = [ val, 1, idx ] // 1 is phaseModifier

      for( let filter of this.filters ) {
        const __args = args
        try {
          args = filter( args, this ) 
        } catch( e ) {
          console.error( e )
          console.log( `removing bad filter from pattern: ${filter.toString()}` ) 
          const idx = this.filters.indexOf( filter )
          this.filters.splice( idx, 1 )
          args = __args
        }
      }

      // XXX why is this one off from the worklet-side pattern id?
      this.__message( 'update.value', args.override === undefined ? args[0] : args.override ) 
      this.__message( 'update.currentIndex', args[2] ) 
      if( this.isGen === true ) {
        this.__message( 'waveformPoint', args.override === undefined ? args[0] : args.override ) 
      }

      return args
    },

    checkForUpdateFunction( name, ...args ) {
      if( this.__delayAnnotations === true ) {
        setTimeout( ()=> {
          if( this.listeners[ name ] ) {
            this.listeners[ name ].apply( this, args )
          }else if( Pattern.listeners[ name ] ) {
            Pattern.listeners[ name ].apply( this, args )
          }
        }, 5 )
      }else{
        if( this.listeners[ name ] ) {
          this.listeners[ name ].apply( this, args )
        }else if( Pattern.listeners[ name ] ) {
          Pattern.listeners[ name ].apply( this, args )
        }
      }
    },

    // used when _onchange has not been assigned to individual patterns
    _onchange() {},

    // XXX it would be nice if filters used a similar style to fx chains...
    // pattern.filters.add( ) etc.
    addFilter( filter, name=null ) {
      if( name !== null ) {
        filter.__name = name
        const idx = this.filters.findIndex( f => f.__name === name )
        this.filters.splice( idx, 1 )  
      }
      this.filters.push( filter )
      return this
    },

    removeFilter( idx=null ) {
      if( idx !== null ) {
        this.filters.splice( idx, 1 )  
      }else{
        this.filters.length = 0
      }

      return this
    },

    inspect() {
      if( Gibberish.mode === 'processor' ) 
        console.table({ values:this.values.toString(), 'number of filters':this.filters.length, phase:this.phase })
    },

    render( cat='Audio' ) {
      this.category = cat
      if( typeof Gibber[ cat ] === 'object' && typeof Gibber[ cat ].patternRender === 'function' ) {
        Gibber[ cat ].patternRender( this )
      }
      if( typeof this.onrender === 'function' ) {
        this.onrender()
      }
    },

    copy() {
      const p = Pattern( ...this.values )
      //this.filters.forEach( f => p.addFilter( f ) )
      p.start = this.start
      p.end   = this.end
      p.phase = this.phase

      return p
    },

    __methodNames:  [
      'rotate','switch','invert','flip',
      'transpose','reverse','shuffle','scale',
      'store', 'range', 'set', 'freeze', 'thaw', 'double'
    ]

  })

  const Pattern = function( ...args ) {
    //console.log( 'args[0]:', args[0].isPattern, args[0] )
    //if( typeof args[0] === 'function' && args[0] !== null && args[0].isPattern === true ) {
    //  console.log( 'got pattern' )
    //  return args[0]
    //}

    const isFunction = args.length === 1 && typeof args[0] === 'function',
          isGen = typeof args[0] === 'object' && args[0].__isGen

    //if( isGen === true ) { 
    //  // must have a priority or it screws us codegen for analysis
    //  args[0].priority = 0
    //  Gibberish.analyzers.push( args[0] )
    //  Gibberish.dirty( Gibberish.analyzers )
    //}


    const fnc = function() {
      let len = fnc.getLength(),
          idx, val, args

      if( len === 1 ) { 
        idx = 0 
      }else{
        idx = fnc.phase > -1 ? Math.floor( fnc.start + (fnc.phase % len ) ) : Math.floor( fnc.end + (fnc.phase % len ) )
      }

      if( isFunction ) {
        val = fnc.values[ 0 ]()
        args = fnc.runFilters( val, idx )
        val = args[0]
      } else if( isGen === true ) {
        val = fnc.values[ 0 ].callback.out[0]

        args = fnc.runFilters( val, idx )
        val = args[0]
      }else{
        val = fnc.values[ Math.floor( idx % fnc.values.length ) ]
        args = fnc.runFilters( val, idx )
      
        fnc.phase += fnc.stepSize * args[ 1 ]


        val = args[ 0 ]
      }
      // check to see if value is a function, and if so evaluate it
      //if( typeof val === 'function' ) {
        //val = val()
      //}
      /*else if ( Array.isArray( val ) ) {
        // if val is an Array, loop through array and evaluate any functions found there. TODO: IS THIS SMART?

        for( let i = 0; i < val.length; i++ ){
          if( typeof val[ i ] === 'function' ) {
            val[ i ] = val[ i ]()
          }
        }
      }
      */

      //XXX is this needed? Adding it interferes with Steps
      //if( val === fnc.DNR ) val = null

      return val
    }


    //if( Array.isArray( args ) ) {
    //  if( args.patterns === undefined ) {
    //    args.patterns = []
    //  }
    //  args.patterns.push( fnc )
    //} 

    let out 
    const DNR = -987654321 

    Object.assign( fnc, {
      category:'audio',
      start : 0,
      end   : 0,
      phase : 0,
      values : args, 
      isPattern: true,
      __frozen:false,
      // wrap annotation update in setTimeout( func, 0 )
      __delayAnnotations:false,
      //values : typeof arguments[0] !== 'string' || arguments.length > 1 ? Array.prototype.slice.call( arguments, 0 ) : arguments[0].split(''),    
      original : null,
      storage : [],
      stepSize : 1,
      integersOnly : false,
      filters : [],
      __listeners: [],
      onchange : null,
      isop:true,
      repeats: {},
      isGen,

      freeze( shouldFreezeTheory = true ) {
        fnc.__frozen = true
      },
      thaw() {
        fnc.__frozen = false
        Gibber.Theory.thaw()
      },

      setSeq( seq ) {
        this.seq = seq
      },

      range(...args) {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.range( ...args )
          return this
        }

        if( !fnc.__frozen ) {
          let start, end
          
          if( Array.isArray( arguments[0] ) ) {
            start = arguments[0][0]
            end   = arguments[0][1]
          }else{
            start = arguments[0]
            end   = arguments[1]
          }
          
          if( start < end ) {
            fnc.start = start
            fnc.end = end
          }else{
            fnc.start = end
            fnc.end = start
          }

          this.checkForUpdateFunction( 'range', fnc )
        }

        return fnc
      },

      // doubles length of the array by duplicating values
      double(...args) {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.double(...args)
          return this
        }
        if( !fnc.__frozen ) {

          fnc.values.push( ...fnc.values ) 
          
          fnc.end = fnc.values.length - 1
          
          // if( fnc.end > fnc.values.length - 1 ) {
          //   fnc.end = fnc.values.length - 1
          // }else if( fnc.end < )
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }
          fnc._onchange()
        }
        
        return fnc
      },   

      set(...args) {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.set(...args)
          return this
        }
        if( !fnc.__frozen ) {
          let args = Array.isArray( arguments[ 0 ] ) ? arguments[ 0 ] : arguments
          
          fnc.values.length = 0

          const tmp = [] 
          
          for( let i = 0; i < args.length; i++ ) {
            const val = args[i].isPattern === true ? args[ i ].original.slice(0) : args[ i ] 
            tmp.push( val )
          }
          fnc.values = tmp
          
          fnc.end = fnc.values.length - 1
          
          // if( fnc.end > fnc.values.length - 1 ) {
          //   fnc.end = fnc.values.length - 1
          // }else if( fnc.end < )
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }
          fnc._onchange( 'set', fnc.values ) //args )
        }
        
        return fnc
      },
       
      reverse() {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.reverse()
          return this
        }
        if( !fnc.__frozen ) {
          let array = fnc.values,
              left = null,
              right = null,
              length = array.length,
              temporary;
              
          for ( left = 0, right = length - 1; left < right; left += 1, right -= 1 ) {
            temporary = array[ left ]
            array[ left ] = array[ right ]
            array[ right ] = temporary;
          }
          
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', array ) 
            fnc.__message( '_onchange', true ) 
          }

          fnc._onchange( 'reverse', null )
        }
        
        return fnc
      },
      // humanize: function( randomMin, randomMax ) {
   //      let lastAmt = 0
   //
   //      for( let i = 0; i < this.filters.length; i++ ) {
   //        if( this.filters[ i ].humanize ) {
   //          lastAmt = this.filters[ i ].lastAmt
   //          this.filters.splice( i, 1 )
   //          break;
   //        }
   //      }
   //
   //      let filter = function( args ) {
   //        console.log( filter.lastAmt, args[0])
   //        args[ 0 ] -= filter.lastAmt
   //        filter.lastAmt = Gibber.Clock.time( Gibber.Utilities.rndi( randomMin, randomMax ) )
   //
   //        console.log( "LA", filter.lastAmt )
   //        args[0] += filter.lastAmt
   //
   //        return args
   //      }
   //      filter.lastAmt = lastAmt
   //      filter.humanize = true
   //
   //      this.filters.push( filter )
   //
   //      return this
   //    },
      random( ...repeats ) {
        const filter = function( args, __ptrn ) {
          args[2] = Math.floor( Math.random() * __ptrn.values.length )
          args[0] = __ptrn.values[ args[2] ]

          return args
        }

        fnc.filters.push( filter )

        if( repeats.length > 0 ) fnc.repeat( ...repeats )

        return fnc
      },
      //  TODO how do we make this run in the audio thread?
      //  syn.note.seq( [0,1,2,3].rnd( 1/16,2, 1/3,3 )
      repeat( ...args ) {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.repeat(...args)
          return this
        }

        let filter = function( args, _ ) {
          let value = args[ 0 ], phaseModifier = args[ 1 ], output = args
          
          //console.log( args, counts )
          if( _.repeating === false && _.repeats[ value ] ) {
            _.repeating = true
            _.repeatValue = value
            _.repeatIndex = args[2]
          }
          
          if( _.repeating === true ) {
            if( _.repeats[ _.repeatValue ].phase !== _.repeats[ _.repeatValue ].target ) {
              output[ 0 ] = _.repeatValue            
              output[ 1 ] = 0
              output[ 2 ] = _.repeatIndex
              //[ val, 1, idx ]
              _.repeats[ _.repeatValue ].phase++
            }else{
              _.repeats[ _.repeatValue ].phase = 0
              output[ 1 ] = 1
              if( value !== _.repeatValue ) { 
                _.repeating = false
              }else{
                _.repeats[ _.repeatValue ].phase++
              }
            }
          }
        
          return output
        }

        for( let i = 0; i < arguments.length; i +=2 ) {
          fnc.repeats[ arguments[ i ] ] = {
            phase: 0,
            target: arguments[ i + 1 ]
          }
        }
        
        fnc.repeating = false
        fnc.repeatValue = null
        fnc.repeatIndex = null

        fnc.filters.push( filter )
      
        return fnc
      },
    
      reset() { 
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.reset()
          return this
        }
        if( !fnc.__frozen ) {
          // XXX replace with some type of standard deep copy
          if( Array.isArray( fnc.original[0] ) ) {
            const arr = []
            for( let i = 0; i < fnc.original.length; i++ ) {
              const chord = fnc.original[ i ]
              arr[ i ] = []
              for( let j = 0; j < chord.length; j++ ) {
                arr[ i ][ j ] = chord[ j ] 
              }
            }
            fnc.values = arr
          }else{
            fnc.values = fnc.original.slice(0)
          }
          //fnc.set( fnc.original.slice( 0 ) );
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }  
          fnc._onchange( 'reset', null )
        }

        return fnc 
      },

      store( pos ) { fnc.storage[ pos || fnc.storage.length ] = fnc.values.slice( 0 ); return fnc; },

      transpose( amt ) { 
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.transpose( amt )
          return this
        }
        if( !fnc.__frozen ) {
          for( let i = 0; i < fnc.values.length; i++ ) { 
            let val = fnc.values[ i ]
            
            if( Array.isArray( val ) ) {
              for( let j = 0; j < val.length; j++ ) {
                if( typeof val[ j ] === 'number' && val !== -987654321 ) {
                  val[ j ] = fnc.integersOnly ? Math.round( val[ j ] + amt ) : val[ j ] + amt
                }
              }
            }else{
              if( typeof val === 'number' && val !== -987654321 ) {
                fnc.values[ i ] = fnc.integersOnly ? Math.round( fnc.values[ i ] + amt ) : fnc.values[ i ] + amt
              }
            }
          }
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', ['transpose', amt] ) 
          }      
          //fnc._onchange( 'transpose', amt )
        }
        
        return fnc
      },

      shuffle() { 
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.shuffle( )
          return this
        }
        if( !fnc.__frozen ) {
          Gibber.Utility.shuffle( fnc.values )
          fnc._onchange( 'shuffule', null )
        }
        
        return fnc
      },

      scale( amt ) { 
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.scale( amt )
          return this
        }
        if( !fnc.__frozen ) {
          fnc.values.map( (val, idx, array) => {
            if( Array.isArray( val ) ) {
              array[ idx ] = val.map( inside  => {
                if( typeof inside === 'number' && inside !== DNR) {
                  return fnc.integersOnly ? Math.round( inside * amt ) : inside * amt
                } else {
                  return inside
                }
              })
            }else{
              if( typeof val === 'number' && val !== DNR ) {
                array[ idx ] = fnc.integersOnly ? Math.round( val * amt ) : val * amt
              }
            }
          })
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }
          fnc._onchange( 'scale', amt )
        }
        
        return fnc
      },

      flip() {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.flip( )
          return this
        }
        if( !fnc.__frozen ) {
          let start = [],
              ordered = null
        
          ordered = fnc.values.filter( function(elem) {
            let shouldPush = start.indexOf( elem ) === -1
            if( shouldPush ) start.push( elem )
            return shouldPush
          })
        
          ordered = ordered.sort( function( a,b ){ return a - b } )
        
          for( let i = 0; i < fnc.values.length; i++ ) {
            let pos = ordered.indexOf( fnc.values[ i ] )
            fnc.values[ i ] = ordered[ ordered.length - pos - 1 ]
          }
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }       
          fnc._onchange( 'flip', null )
        }
      
        return fnc
      },
      
      invert() {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.invert( )
          return this
        }
        if( !fnc.__frozen ) {
          // first non-rest value
          let prime0 = fnc.values.find( v=> v !== DNR )
          
          for( let i = 1; i < fnc.values.length; i++ ) {
            if( typeof fnc.values[ i ] === 'number' && fnc.values[i] !== DNR ) {
              let inverse = prime0 + (prime0 - fnc.values[ i ])
              fnc.values[ i ] = inverse
            }
          }
          
          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }

          fnc._onchange( 'invert', null )
        }
        
        return fnc
      },
    
      switch( to ) {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.switch( to )
          return this
        }
        if( !fnc.__frozen ) {
          if( fnc.storage[ to ] ) {
            fnc.values = fnc.storage[ to ].slice( 0 )
          }
          
          fnc._onchange( 'switch', to )
        }
        
        return fnc
      },
    
      rotate( amt ) {
        if( this.__rendered !== undefined && this.__rendered !== this ) {
          this.__rendered.rotate( amt )
          return this
        }
        if( !fnc.__frozen ) {
          if( amt > 0 ) {
            while( amt > 0 ) {
              let end = fnc.values.pop()
              fnc.values.unshift( end )
              amt--
            }
          }else if( amt < 0 ) {
            while( amt < 0 ) {
              let begin = fnc.values.shift()
              fnc.values.push( begin )
              amt++
            }
          }

          if( Gibberish.mode === 'processor' ) {
            fnc.__message( 'values', fnc.values ) 
            fnc.__message( '_onchange', true ) 
          }

          fnc._onchange( 'rotate', amt )
        }
        
        return fnc
      },

      clear() {
        if( Gibberish.mode === 'worklet' ) {
          for( let key of PatternProto.__methodNames ) {
            for( let i = 0; i < out[ key ].sequencers.length; i++ ) {
              // this can most certainly be optimized, but I had real problems
              // getting this clearing to work, perhaps related to proxy behaviors?
              const __seq = Gibber.Seq.sequencers.find( s => s.id === out[ key ][ i ].id )
              if( __seq !== undefined ) {
                Gibber.Audio.Gibberish.worklet.port.postMessage({ address:'method', object:__seq.id, name:'stop', args:[] })
              
                __seq.stop()
                __seq.clear()

                const idx = Gibber.Seq.sequencers.indexOf( __seq )
                Gibber.Seq.sequencers.splice( idx, 1 )
                __seq.target[ __seq.key ][0].stop()
              }
            }
          } 
        }else{
          // genish-based patterns are connected as analyzers so that they
          // don't have to feed into a bus to get rendered. we must remove them
          // from the analysis array to finalize clearing.
          if( out.isGen === true ) {
            const idx = Gibberish.analyzers.indexOf( args[0] )
            if( idx !== -1 ) {
              Gibberish.analyzers.splice( idx, 1 )
              Gibberish.analyzers.dirty = true
            }
          }
        }
      }
    })
    
    if( Gibberish.mode === 'worklet' ) {
      fnc.id = Gibberish.utilities.getUID()

      if( isGen === true ) {
        fnc.waveformPoint = val => {
          // accounts for annoying edge case where wave pattern is
          // inlined to a call to .seq
          // XXX fix in parsing or somehow figure out how to only do this once
          if( fnc.widget !== undefined ) fnc.values[0].widget = fnc.widget
          if( fnc.values[0].widget !== undefined ) {

            // convert samples to beats
            if( fnc.__patternType === 'timings' ) {
              val = Gibber.Clock.stob( val )
            }
            fnc.values[0].widget.values[ fnc.values[0].widget.values.length - 1 ] = { value:val } 
          }
        }
      }
    }
    //fnc.filters.pattern = fnc
    // can I resotre this without making the object non-serializable?
    //fnc.retrograde = fnc.reverse.bind( fnc )
    
    fnc.end = fnc.values.length - 1
    
    /*
    fnc.filters.test = function() { console.log( 'test' ) }
    
    fnc.filters.add = function( f ) {
      this.filters.push( f )
    }.bind(fnc)
    fnc.filters.remove = function( idx ) {
      console.log( 'filter:', this )
      this.filters.splice( idx, 1 )
    }.bind( fnc )
    fnc.filters.inspect = function() {
      console.log( `there are currenly ${this.length} filters on this pattern` )
    }.bind(fnc)
    */

    if( Array.isArray( fnc.values[0] ) ) {
      const arr = []
      for( let i = 0; i < fnc.values.length; i++ ) {
        const chord = fnc.values[ i ]
        arr[ i ] = []
        for( let j = 0; j < chord.length; j++ ) {
          arr[ i ][ j ] = chord[ j ] 
        }
      }
      fnc.original = arr
    }else{
      fnc.original = fnc.values.slice(0)
    }

    fnc.storage[ 0 ] = fnc.original.slice( 0 )
    fnc.integersOnly = fnc.values.every( function( n ) { return n === +n && n === (n|0); })
    
    fnc.listeners = {}
    fnc.sequences = {}

    if( Gibberish.mode === 'worklet' ) {

      for( let key of PatternProto.__methodNames ) { 
        Gibber.addSequencing( fnc,key,2,undefined )
      }
      //for( let key of PatternProto.__methodNames ) { 
      //  fnc.sequencers[ key ] = Gibber.Core !== undefined 
      //    ? Gibber.Core.addSequencing( fnc, key, 2 ) 
      //    : Gibber.addSequencing( fnc,key,2 )
      //}
      fnc.sequences.reset = Gibber.addSequencing( fnc, 'reset', 1 )
    }
    
    // TODO: Gibber.createProxyProperties( fnc, { 'stepSize':0, 'start':0, 'end':0 })
    
    fnc.__proto__ = PatternProto 

    let pn = ''
    Object.defineProperty( fnc, 'patternName', {
      get() { return pn },
      set(__pn) {
        pn = __pn
      }
    })

    fnc.render = function( mode='audio' ) {
      if( mode === 'audio' ) {
        // 'isPattern' is a hack to force pattern initialization arguments to be submitted as
        // a list, instead of in a property dictionary. When 'isPattern' is true, gibberish
        // looks for an 'inputs' property and then passes its value (assumed to be an array)
        // using the spread operator to the constructor. 
        out = Gibberish.Proxy( 'pattern', { inputs:fnc.values, isPattern:true, filters:fnc.filters, id:fnc.id }, fnc ) 

        if( isGen === true ) { 
          // must have a priority or it screws up codegen for analysis
          args[0].priority = 0
          Gibberish.analyzers.push( args[0] )
          Gibberish.dirty( Gibberish.analyzers )
        }
      }

      if( args.filters ) {
        args.filters.forEach( f => out.addFilter( f ) )
      }else if( typeof args[0] === 'object' && args[0].filters ) {
        args[0].filters.forEach( f => out.addFilter( f ) )
      }

      Pattern.children.push( out )

      if( fnc.onrender ) fnc.onrender( out )

      fnc.__rendered = out

      return out
    }
    if( Gibberish.mode === 'processor' ) return fnc.render()

    return fnc 
  }

  Pattern.listeners = {}
  Pattern.children = []
  Pattern.__isFrozen = false
  Pattern.freeze = function( shouldFreezeTheory = true ) {
    Pattern.children.forEach( p => p.freeze() ) 
    if( shouldFreezeTheory === true ) {
      Gibber.Theory.freeze()
      Pattern.__isFrozen = true
    }
  }
  Pattern.thaw = ()=> {
    Pattern.children.forEach( p => p.thaw() )
    if( Pattern.__isFrozen === true ) {
      Gibber.Theory.thaw()
      Pattern.__isFrozen = false
    }
  }

  Pattern.export = function( obj ) {
    obj.freeze = Pattern.freeze
    obj.thaw   = Pattern.thaw
  }

  Pattern.listeners.range = function( fnc ) {
    //if( !Notation.isRunning ) return
    
    if( Gibberish.mode === 'processor' ) return

    // TODO: don't use Gibber.currentTrack, store the object in the pattern
    let rangeStart = fnc.markers[ fnc.start ].find(),
        rangeEnd   = fnc.markers[ fnc.end ].find()

    if( !fnc.range.init ) {
      fnc.range.init = true
      var ptrnStart = fnc.markers[ 0 ].find(),
          ptrnEnd = fnc.markers[ fnc.markers.length - 1 ].find()

      //fnc.column.editor.markText( ptrnStart.from, ptrnEnd.to, { className:'rangeOutside' })
      Gibber.Environment.editor.markText( ptrnStart.from, ptrnEnd.to, { className:'rangeOutside' })//className:'pattern-update-range-outside' })
      if( !Pattern.listeners.range.initialzied ) Pattern.listeners.range.init()
    }

    if( fnc.range.mark ) fnc.range.mark.clear()
    //fnc.range.mark = fnc.column.editor.markText( rangeStart.from, rangeEnd.to, { className:'rangeInside' })
    // TODO: Dont use GE.codemirror... how else do I get this? stored in pattern is created?
    fnc.range.mark = Gibber.Environment.editor.markText( rangeStart.from, rangeEnd.to, { className:'rangeInside' })
  }

  Pattern.listeners.range.init = function() {
    //$.injectCSS({ 
    //  '.rangeOutside': {
    //    'color':'#666 !important'
    //  },
    //  '.rangeInside': {
    //    'color':'rgba(102, 153, 221, 1) !important'
    //  }
    //})
    Pattern.listeners.range.initialized = true
  }

  //Pattern.prototype = PatternProto*/

  return Pattern

}

// helper function to pass the pattern constructor to the gibberish worklet processor.
patternWrapper.transfer = function( Audio, constructorString ) {
  if( Audio.Gibberish !== undefined && Audio.Gibberish.mode === 'worklet' ) {
    Audio.Gibberish.worklet.port.postMessage({
      address:'addConstructor',
      name:'Pattern',
      constructorString
    })
  }
}


module.exports = patternWrapper

},{}],131:[function(require,module,exports){
const autotrig = [ 'note','chord','trigger','pickplay','notec','notef' ]

module.exports = function( Gibber ) {
  const addValuesFilters = (seq,key,target) => {
    const values = seq.values

    // XXX support [1/8,1/4,1/16].rnd( 1/16, 2 ) syntax
    // to always play 1/16th notes twice
    if( values.randomFlag ) {
      values.addFilter( ( args,ptrn ) => {
        const range = ptrn.values.length - 1
        const idx = Math.round( Math.random() * range )
        return [ ptrn.values[ idx ], 1, idx ] 
      })
      for( let i = 0; i < values.randomArgs.length; i+=2 ) {
        values.repeat( values.randomArgs[ i ], values.randomArgs[ i + 1 ] )
      }
    }

    // trigger autotrig patterns
    if( autotrig.indexOf( key ) > -1 ) {
      values.addFilter( ( args,ptrn ) => {
        if( ptrn.seq.target.autotrig !== undefined ) {
          for( let s of ptrn.seq.target.autotrig ) {
            s.fire()
          }
        }
        return args
      })
    } 
  }

  const addTimingFilters = function( seq,key,renderMode ) {
    const __timings = seq.timings
    if( __timings.randomFlag ) {
      __timings.addFilter( ( args,ptrn ) => {
        const range = ptrn.values.length - 1
        const idx = Math.round( Math.random() * range )
        return [ ptrn.values[ idx ], 1, idx ] 
      })
      for( let i = 0; i < __timings.randomArgs.length; i+=2 ) {
        __timings.repeat( __timings.randomArgs[ i ], __timings.randomArgs[ i + 1 ] )
      }
    }

    const filter = renderMode === 'Audio' 
      ? (args,ptrn) => {
        if( typeof args[0] === 'number' ) {
          args[0] = Gibberish.Clock.time( args[0] )
        }
        return args
      }
      : (args,ptrn) => {
        if( typeof args[0] === 'number' ) {
          args[0] = Gibber.Clock.time( args[0] )
        }
        return args
      }  

    seq.timings.addFilter( (args,ptrn)=>{
      if( args[0] === 0 ) {
        ptrn.seq.stop()
        console.warn( 'sequencer attempting to fire with a time of zero; this will result in an infinite loop, so the sequencer has been stopped.' )
      }
      return args
    })
    seq.timings.addFilter( filter ) 
  }

  const Seq = function( props ) { 
    let   __values  = props.values
    const __timings = props.timings
    const delay     = props.delay
    const target    = props.target
    const key       = props.key
    const priority  = props.priority
    let   rate      = props.rate || 1
    let   density   = props.density || 1
    let   autotrig  = false
    const render    = props.render || 'Audio'

    const Gibberish = Gibber.Audio.Gibberish !== undefined ? Gibber.Audio.Gibberish : null

    if( __values.type === 'gen' ) {
      __values = __values.render()
    }

    if( Array.isArray( __values ) && __values.length <= 0 ) throw Error('arrays passed to sequences must have at least one value inside of them')
    // convert to pattern if needed and render
    const values = Array.isArray( __values ) 
      ? Gibber.Pattern( ...__values ).render()
      : typeof __values === 'function' && __values.isPattern 
        ? __values.render()
        : __values.requiresRender 
          ? __values
          : Gibber.Pattern( __values ).render()

    // if an array of values is passed, let users call pattern method on that array, for example:
    // a.note.seq( b=[0,1,2,3], 1/4 )
    // b.transpose.seq( 1,1 )
    // also set random flag if needed
    if( Array.isArray( __values ) ) {
      Object.assign( __values, values )
      __values.addFilter = values.addFilter.bind( values )
      __values.removeFilter = values.removeFilter.bind( values )
      __values.inspect = values.inspect.bind( values )
      if( __values.randomFlag !== undefined ) values.randomFlag = __values.randomFlag
      if( __values.randomArgs !== undefined ) values.randomArgs = __values.randomArgs
      
      __values.addPattern( values )
     
    } else if( typeof __values === 'object' && __values.type==='gen' ) {
      props.values.addFilter = values.addFilter.bind( values )
      props.values.removeFilter = values.removeFilter.bind( values )
      props.values.inspect = values.inspect.bind( values )
    }

    // process time values
    if( target !== undefined ) {
      if( Gibber[ render ].timeProps[ target.name ] !== undefined 
        && Gibber[ render ].timeProps[ target.name ].indexOf( key ) !== -1  ) {

        const filter = render === 'Audio' 
          ? (args,ptrn) => {
              args[0] = Gibberish.Clock.time( args[0] )
              return args
            }
          : (args,ptrn) => {
              args[0] = Gibber.Audio.Clock.time( args[0] )
              return args
            }

        values.addFilter( filter )
      }
    }
 
    const timings = Array.isArray( __timings ) 
      ? Gibber.Pattern( ...__timings ).render()
      : typeof __timings === 'function' && __timings.isPattern 
        ? __timings.render()
        : __timings === undefined || __timings === null 
          ? null
          : __timings.requiresRender
            ? __timings
            : Gibber.Pattern( __timings ).render()


    if( timings === null ) autotrig = true

    if( Array.isArray( __timings ) ) {
      Object.assign( __timings, timings )
      __timings.addFilter = timings.addFilter.bind( timings )
      if( __timings.randomFlag !== undefined ) timings.randomFlag = __timings.randomFlag
      if( __timings.randomArgs !== undefined ) timings.randomArgs = __timings.randomArgs

      __timings.addPattern( timings )
    }
    if( autotrig === false ) {
      timings.output = { time:'time', shouldExecute:0 }
      timings.density = 1

      // XXX delay annotations so that they occur after values annotations have occurred. There might
      // need to be more checks for this flag in the various annotation update files... right now
      // the check is only in createBorderCycle.js.
      timings.__delayAnnotations = true
    }

    // if an array is passed to the seq, enable users to call pattern methods on array
    //if( Array.isArray( __timings ) ) Object.assign( __timings, timings )

    const clear = render === 'Audio'
      ? function() {
          this.stop()
          
          if( this.values !== undefined && this.values.clear !== undefined  ) {
            this.values.clear()
          }
          if( this.timings !== undefined && this.timings !== null && this.timings.clear !== undefined ) this.timings.clear()

          
          if( Gibberish.mode === 'worklet' ) {
            const idx = Seq.sequencers.indexOf( seq )
            seq.stop()
            const __seq = Seq.sequencers.splice( idx, 1 )[0]
            if( __seq !== undefined ) {
              __seq.stop()
            }
          }
        }
      : function() {
          this.stop()
          
          if( this.values !== undefined && this.values.clear !== undefined  ) this.values.clear()
          if( this.timings !== undefined && this.timings !== null && this.timings.clear !== undefined ) this.timings.clear()

          const idx = Seq.sequencers.indexOf( seq )
          const __seq = Seq.sequencers.splice( idx, 1 )[0]
          if( __seq !== undefined ) {
            __seq.stop()
          }
        }

    values.__patternType = 'values'
    if( timings !== null ) timings.__patternType = 'timings'

    //const offsetRate = Gibberish.binops.Mul(rate, Gibber.Clock.AudioClock )

    // XXX need to fix so that we can use the clock rate as the base
    // XXX need to abstract this so that a graphics sequencer could also be called...
    const seq = Gibber.Audio.Gibberish.Sequencer({ values, timings, density, target, key, priority, rate:1/*Gibber.Clock.AudioClock*/, clear, autotrig, mainthreadonly:props.mainthreadonly })

    if( values.setSeq ) values.setSeq( seq )

    addValuesFilters( seq,key )

    if( autotrig === false ) {
      addTimingFilters( seq,key,render )
      if( timings.setSeq ) timings.setSeq( seq )
    }else{
      if( target !== undefined ) {
        if( target.autotrig === undefined ) {
          target.autotrig = []
          Gibber.Audio.Gibberish.worklet.port.postMessage({
            address:'property',
            name:'autotrig',
            value:[],
            object:target.id
          })

        }
        // object name key value
        if( Gibber.Audio.Gibberish.mode === 'worklet' ) {
          Gibber.Audio.Gibberish.worklet.port.postMessage({
            address:'addObjectToProperty',
            name:'autotrig',
            object:target.id,
            key:target.autotrig.length,
            value:seq.id
          })
          target.autotrig.push( seq )
        }
      }else{
        throw Error('you must define timings for any sequence without a target')
      }
    } 

    //Gibberish.proxyEnabled = false
    //Gibber.Ugen.createProperty( seq, 'density', timings, [], Gibber )
    //Gibberish.proxyEnabled = true

    Seq.sequencers.push( seq )

    // if x.y.seq() etc. 
    // standalone === false is most common use case
    if( props.standalone === false ) { 
      // required ternary because pattern methods don't have __ prefix 
      const targetProp = target[ '__' + key ] === undefined 
        ? target[ key ] 
        : target[ '__' + key ]
      
      const prevSeq = targetProp.sequencers[ props.number ] 
      if( prevSeq !== undefined ) { 
        prevSeq.clear();
      }


      // XXX you have to add a method that does all this shit on the worklet. crap.
      targetProp.sequencers[ props.number ] = seq
      targetProp[ props.number ] = seq 
      //target.__sequencers.push( seq )
      if( typeof delay !== 'function' ) { 
        seq.start( Gibber.Audio.Clock.time( delay ) )
      } else {
        delay.seqs.push( seq )
      }
    }

    Gibber.publish( 'new sequence', seq )

    return seq
  }

  Seq.sequencers = []
  Seq.clear = function() {
    Seq.sequencers.forEach( seq => seq.clear() )
    //for( let i = Seq.sequencers.length - 1; i >= 0; i-- ) {
    //  Seq.sequencers[ i ].clear()
    //}
    Seq.sequencers = []
  }
  Seq.DNR = -987654321

  return Seq

}

},{}],132:[function(require,module,exports){
module.exports = function( Gibber ) {
 
const Steps = {
  type:'Steps',
  create( _steps, target ) {
    const stepseq = Object.create( Steps )
    
    stepseq.seqs = {}

    for( let _key in _steps ) {
      let values = _steps[ _key ]
      const parsedKey = parseInt( _key )
      const key = isNaN( parsedKey ) ? _key : parsedKey

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
        'key': target.__isEnsemble !== true ? 'note' : 'trigger', 
        target: target.__isEnsemble ? target[ target[ key ].name ] : target, 
        priority:0
      })

      const onlyUsesVelocity = typeof key === 'string'


      if( usesStringValues ) {
        seq.values.addFilter( new Function( 'args', 'ptrn', 
         `let sym = args[ 0 ],
              velocity = parseInt( sym, 16 ) / 15

          if( isNaN( velocity ) ) {
            velocity = sym === 'x' 
              ? 1
              : sym === 'X'
                ? 1.5
                : 0
          }

          // TODO: is there a better way to get access to beat, beatOffset and scheduler?
          if( velocity !== 0 ) {
            ${ onlyUsesVelocity ? '' :'ptrn.seq.target.__triggerLoudness = velocity' }
          }

          args[ 0 ] = sym === '.' ? -987654321 : ${typeof key === 'string' ? 'velocity' : key }

          return args
        `) )
      }

      stepseq.seqs[ _key ] = seq
      stepseq[ _key ] = usesStringValues ? seq.values : seq.timings
    }

    stepseq.start()
    stepseq.addPatternMethods()

    return stepseq
  },
  
  /* two parts:
   * 1. The easy part, make methods that can be called from the main thread
   *    and run over every seq instance in the step sequencer
   * 2. The hard part, make an object that lives in the audio thread
   *    and can be sequenced. It needs references to all sequencers in the 
   *    step sequencer.
   */
  addPatternMethods() {
    // XXX shouldn't use audio id by default... sigh
    const id = Gibber.Audio.Gibberish.utilities.getUID()

    // store ids of all controlled sequencers
    const seqIds = []
    for( let key in this.seqs ) {
      seqIds.push( this.seqs[ key ].id )
    }

    // this object will be transferred to audio thread
    const obj = { id, seqIds }

    groupMethodNames.forEach( name => {
      // EASY PART 
      this[ name ] = function( ...args ) { 
        for( let key in this.seqs ) { 
          this.seqs[ key ].values[ name ].apply( this, args ) 
        } 
      }

      this[ name ].sequencers = []
      this[ name ].seq = ( values, timings, number = 0, delay = 0 ) => {
        const s = Gibber.Seq({ 
          values, 
          timings, 
          target:this.__wrapped,
          key:name,
          priority:1,
        }).start()
        
        this[ name ].sequencers.push( s )

        // needed for annotations
        this[ name ][ number ] = s

        return this 
      } 

      // store function body to create function in audio thread representation of steps
      // needs to be one line for stringify / parsing
      // XXX ugh arguments? is there ever more than one argument?
      obj[ name ] = `for( let seq of this.seqs ) { seq.values.${name}.apply( this, arguments ); seq.timings.${name}.apply( this, arguments )}`
    })

    // HARD PART
    // code to be evaluated in audio thread
    // 1. create a new object, steps, bassed on stringifying obj
    // 2. add all of the transform methods
    // 3. store all controlled sequencers in steps.seqs after getting references
    //    from Gibberish.ugens 
    const code = `const steps = JSON.parse( \`${JSON.stringify(obj)}\` )
      const methods = ${JSON.stringify( groupMethodNames ) }
      steps.seqs = steps.seqIds.map( id => Gibberish.ugens.get( id ) )
      for( let method of methods ) {
        steps[ method ] = new Function( steps[ method ] ) 
      }
      Gibberish.ugens.set( steps.id, steps )`
 
    Gibber.Audio.Gibberish.worklet.port.postMessage({
      address:'eval',
      code
    }) 

    this.__wrapped = obj
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
  }

}

const groupMethodNames = [ 
  'rotate', 'reverse', 'transpose', 'range',
  'shuffle', 'scale', 'repeat', 'store', 
  'reset','flip', 'invert', 'set', 'double'
]

return Steps.create

}

},{}],133:[function(require,module,exports){
module.exports = function( Gibber ) {

  const buildAndCheckPattern = function( pattern, key, target ) {
    try {
      p = Gibber.Audio.Gibberish.Tidal.Pattern( pattern ) 
    } catch(e) {
      Gibber.publish( 'error', `Your Tidal pattern ${pattern} used invalid syntax.` )
      return null
    }


    // we assume if the key is play or pickplay then some type of
    // multisampler / ensemble is being used, and that valid tokens
    // will also be properties of the target object
    if( key === 'play' || key === 'pickplay' ) {
      const tokens = [...pattern.matchAll(/[a-zA-Z]+/g)].map( v=>v[0] )
      let tokenNotFound = false
      tokens.forEach( t => {
        if( t !== '~' ) {
          if( target[ t ] === undefined ) {
            Gibber.publish( 'error', `\nYour Tidal pattern is using a token (${t}) that can't be found on the targeted instrument.\n` )
            tokenNotFound = true
          }
        }
      })

      if( tokenNotFound === true ) return null
    }else{
      // more common case... sequencing a number
      // for note / trigger / some other property
      // NOTE THAT THIS FAILS FOR PATTERNING CHORD
      // PROGRESSIONS WITH TIDAL... this is the only 
      // use case I think of besides ensembles where you
      // sequence with strings.
      const numbersRegEx = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g
      const tokens = pattern.split(' ')

      //const tokens = [...pattern.matchAll( numbersRegEx )].map( v=>v[0] )
      let tokenNotNumber = false
      tokens.forEach( t => {
        if( t !== '~' ) {
          if( t.match( numbersRegEx ) === null ) {
            tokenNotNumber = true
            Gibber.publish( 'error', `\nYour Tidal pattern is using a token (${t}) that isn't a valid value for what you are sequencing.\n` )
         
          }
        }
      })

      if( tokenNotNumber === true ) return null

    }

    return p
  }

  const Seq = function( props ) { 
    const pattern   = props.pattern
    const target    = props.target
    const key       = props.key
    const number    = props.number
    const delay     = props.delay
    const priority  = props.priority || 0
    let   rate      = props.rate || 1
    let   density   = props.density || 1
    let   autotrig  = false

    const render    = target.type !== undefined ? target.type.toLowerCase() : 'audio'
    //const Gibber.Audio.Gibberish = Gibber.Gibber.Audio.Gibberish !== undefined ? Gibber.Gibber.Audio.Gibberish : null

    const clear = render === 'audio'
      ? function() {
          this.stop()
          
          if( Gibber.Audio.Gibberish.mode === 'worklet' ) {
            const idx = Seq.sequencers.indexOf( seq )
            seq.stop()
            const __seq = Seq.sequencers.splice( idx, 1 )[0]
            if( __seq !== undefined ) {
              __seq.stop()
            }
          }
        }
      : function() {
          this.stop()
          
          const idx = Seq.sequencers.indexOf( seq )
          const __seq = Seq.sequencers.splice( idx, 1 )[0]
          if( __seq !== undefined ) {
            __seq.stop()
          }
      }

    const filters = [
      // report back triggered tokens for annotations
      function( val, tidal, uid ) {
        if( Gibberish.mode === 'processor' ) {
          Gibberish.processor.messages.push( tidal.id, 'update.uid', uid )   
          Gibberish.processor.messages.push( tidal.id, 'update.value', val )   
        }
        return val
      } 
    ]

    if( key === 'note' || key === 'chord' || key === 'trigger' ) {
      filters.push( ( args,tidal ) => {
        if( tidal.target.autotrig !== undefined ) {
          for( let s of tidal.target.autotrig ) {
            s.fire()
          }
        }
        return args
      })
    }

    let p = buildAndCheckPattern( pattern, key, target )
    
    if( p === null ) return null

    const seq = Gibber.Audio.Gibberish.Tidal({ pattern, target, key, priority, filters, mainthreadonly:props.mainthreadonly })
    seq.clear = clear
    seq.uid = Gibber.Audio.Gibberish.Tidal.getUID()
    
    //Gibber.Audio.Gibberish.proxyEnabled = false
    //Audio.Ugen.createProperty( seq, 'density', timings, [], Audio )
    //Gibber.Audio.Gibberish.proxyEnabled = true

    Gibber.addSequencing( seq, 'rotate', 1 )

    Seq.sequencers.push( seq )

    Gibber.subscribe( 'clear', ()=> seq.clear() )

    // if x.y.tidal() etc. 
    // standalone === false is most common use case
    if( props.standalone === false ) {
      let prevSeq = target[ '__' + key ].tidals[ number ] 
      if( prevSeq !== undefined ) {
        if( target.__sequencers !== undefined ) {
          const idx = target.__sequencers.indexOf( prevSeq )
          target.__sequencers.splice( idx, 1 )
        }
        // XXX stop() destroys an extra sequencer for some reason????
        prevSeq.stop()
        prevSeq.clear()
        //removeSeq( obj, prevSeq )
      }

      seq.start( Gibber.Audio.Clock.time( delay ) )

      target[ '__' + key ].tidals[ number ] = target[ '__' + key ][ number ] = seq
    }

    Gibber.publish( 'new tidal', seq )
    return seq
  }

  Seq.sequencers = []
  Seq.clear = function() {
    Seq.sequencers.forEach( seq => seq.clear() )
    //for( let i = Seq.sequencers.length - 1; i >= 0; i-- ) {
    //  Seq.sequencers[ i ].clear()
    //}
    Seq.sequencers = []
  }
  Seq.DNR = -987654321
  Seq.check = buildAndCheckPattern

  let val = 1 
  Object.defineProperty( Seq, 'cps', {
    get() { return val },
    set(v) {
      val = v
      Gibber.Audio.Gibberish.Tidal.cps = v
    }
  })

  return Seq

}

},{}],134:[function(require,module,exports){
module.exports = function( Gibber ) {

const Pattern = Gibber.Pattern

const Triggers = function( __values ) {
  const values = __values.split('')
  const pattern = Pattern( ...values ) 
  pattern.isPattern = true
  pattern.type = 'Triggers'
  // need to define custom function to use key as value
  pattern.onrender = function( rendered ) {
    rendered.addFilter( new Function( 'args', 'ptrn', 
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

      return args`
    ))
  }

  return pattern
}

return Triggers

}

},{}],135:[function(require,module,exports){
let ugen = require( '../ugen.js' )

let analyzer = Object.create( ugen )

Object.assign( analyzer, {
  __type__: 'analyzer',
  priority:0
})

module.exports = analyzer

},{"../ugen.js":208}],136:[function(require,module,exports){
module.exports = function( Gibberish ) {
  const { In, Out, SSD } = require( './singlesampledelay.js'  )( Gibberish )

  const analyzers = {
    SSD,
    SSD_In: In,
    SSD_Out: Out, 
    Follow: require( './follow.dsp.js'  )( Gibberish )
  }
  analyzers.Follow_out = analyzers.Follow.out
  analyzers.Follow_in  = analyzers.Follow.in
  
  analyzers.export = target => {
    for( let key in analyzers ) {
      if( key !== 'export' ) {
        target[ key ] = analyzers[ key ]
      }
    }
  }

  return analyzers

}

},{"./follow.dsp.js":137,"./singlesampledelay.js":138}],137:[function(require,module,exports){
const g = require( 'genish.js' ),
      analyzer = require( './analyzer.js' ),
      ugen = require( '../ugen.js' )

const genish = g

module.exports = function( Gibberish ) {

  const Follow = function( __props ){
    const props = Object.assign( {}, Follow.defaults, __props )

    let isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false

    let out = props 

    /* if we are in the main thread,
     * only send a command to make a Follow instance
     * to the processor thread and include the id #
     * of the input ugen.
     */

    //console.log( 'isStereo:', Gibberish.mode, isStereo, props.input )
    if( Gibberish.mode === 'worklet' ) {
      // send obj to be made in processor thread
      props.input = { id: props.input.id }
      props.isStereo = isStereo

      // creates clashes in processor thread unless
      // we skip a number here... nice
      Gibberish.utilities.getUID()

      props.overrideid = Gibberish.utilities.getUID()

      // XXX seems like this id gets overridden somewhere
      // hence .overrideid
      props.id = props.overrideid

      Gibberish.worklet.port.postMessage({
        address:'add',

        properties:JSON.stringify( props ),

        name:['analysis','Follow']
      })

      Gibberish.worklet.ugens.set( props.overrideid, out )

      let mult = props.multiplier

      Object.defineProperty( out, 'multiplier', {
        get() { return mult },
        set(v){
          mult = v
          Gibberish.worklet.port.postMessage({ 
            address:'set', 
            object:props.overrideid,
            name:'multiplier',
            value:mult
          })
        }
      })

      let offset = props.offset
      Object.defineProperty( out, 'offset', {
        get() { return offset },
        set(v){
          offset = v
          Gibberish.worklet.port.postMessage({ 
            address:'set', 
            object:props.overrideid,
            name:'offset',
            value:offset
          })
        }
      })
    }else{
      //isStereo = props.isStereo

      const buffer = g.data( props.bufferSize, 1 )
      const input  = g.in( 'input' )
      const multiplier = g.in( 'multiplier' )
      const offset     = g.in( 'offset' )
      
      const follow_out = Object.create( analyzer )
      follow_out.id = props.id = __props.overrideid

      let avg = g.data( 1,1, { meta:true } ) // output; make available outside jsdsp block
      const idx = avg.memory.values.idx
  
      const callback = function( memory ) {
        return avg[0]
      }

      const out = {
        callback,
        input:props.input,
        isStereo,
        dirty:true,
        inputNames:[ 'input', 'memory' ],
        inputs:[ props.input ],
        id: Gibberish.utilities.getUID(),

        __properties__: { input:props.input },
      }

      // nonsense to make our custom function work
      out.callback.ugenName = out.ugenName = `follow_out_${follow_out.id}`
      out.id = __props.overrideid

      // begin input tracker
      const follow_in = Object.create( ugen )

      if( isStereo === true ) {
        if( props.outputStereo === false ) {
          { 
            "use jsdsp"
            // phase to write to follow buffer
            const bufferPhaseOut = g.accum( 1,0,{ max:props.bufferSize, min:0 })

            // hold running sum
            const sum = g.data( 1, 1, { meta:true })

            const mono = props.abs === true ? g.abs( input[0] + input[1] ) : input[0] + input[1]

            sum[0] = sum[0] + mono - g.peek( buffer, bufferPhaseOut, { mode:'simple' })

            g.poke( buffer, g.abs( mono ), bufferPhaseOut )

            avg = (sum[0] / props.bufferSize) * multiplier + offset
          }
        }else{
          const bufferL = buffer
          const bufferR = g.data( props.bufferSize, 1 )

          { 
            "use jsdsp"
            // phase to write to follow buffer
            const bufferPhaseOut = g.accum( 1,0,{ max:props.bufferSize, min:0 })

            // hold running sum
            const sumL = g.data( 1, 1, { meta:true })
            const sumR = g.data( 1, 1, { meta:true })

            const left = props.abs === true  ? g.abs( input[0] ) : input[0]
            const right = props.abs === true ? g.abs( input[1] ) : input[1]

            sumL[0] = sumL[0] + left - g.peek( bufferL, bufferPhaseOut, { mode:'simple' })
            sumR[0] = sumR[0] + right- g.peek( bufferR, bufferPhaseOut, { mode:'simple' })

            g.poke( bufferL, g.abs( left  ), bufferPhaseOut )
            g.poke( bufferR, g.abs( right ), bufferPhaseOut )

            avg = [
              (sumL[0] / props.bufferSize) * multiplier + offset,
              (sumR[0] / props.bufferSize) * multiplier + offset,
            ]
          }
        }
      }else{
        {
          "use jsdsp"
          // phase to write to follow buffer
          const bufferPhaseOut = g.accum( 1,0,{ max:props.bufferSize, min:0 })

          // hold running sum
          const sum = g.data( 1, 1, { meta:true })

          const __input = props.abs === true ? g.abs( input ) : input

          sum[0] = sum[0] + __input - g.peek( buffer, bufferPhaseOut, { mode:'simple' })
          
          g.poke( buffer, g.abs( input ), bufferPhaseOut )

          avg = (sum[0] / props.bufferSize) * multiplier + offset
        }
      }
      Gibberish.utilities.getUID()

      props.isStereo = false
      const record = Gibberish.factory( 
        follow_in,
        avg, 
        ['analysis', 'follow_in'], 
        props
      )

      // nonsense to make our custom function work
      record.callback.ugenName = record.ugenName = `follow_in_${follow_out.id}`

      if( Gibberish.analyzers.indexOf( record ) === -1 ) Gibberish.analyzers.push( record )

      Gibberish.dirty( Gibberish.analyzers )

      Gibberish.ugens.set( __props.overrideid, record )

      out.record = record
    }

    return out

  }
 
  Follow.defaults = {
    input:0,
    bufferSize:1024,
    multiplier:1,
    abs: true,
    outputStereo:false,
    offset:0,
    min:-Infinity,
    max:Infinity
  }

  return Follow

}

},{"../ugen.js":208,"./analyzer.js":135,"genish.js":40}],138:[function(require,module,exports){
const g = require( 'genish.js' ),
      analyzer = require( './analyzer.js' ),
      proxy    = require( '../workletProxy.js' ),
      ugen     = require( '../ugen.js' )

module.exports = function( Gibberish ) {
 
// an SSD ugen is in effect two-in-one,
// one for input and one for output.  
  
const SSD = inputProps => {
  const ssd = Object.create( analyzer )

  const props = Object.assign({}, SSD.defaults, inputProps )
  const isStereo = props.isStereo 
  const input    = g.in( 'input' )
  const historyL = g.history(0)
  const historyR = g.history(0)

  ssd.out = Out( [historyL,historyR], props )
  ssd.in  =  In( [historyL,historyR], props )

  ssd.listen = ssd.in.listen

  return ssd 
}

const Out = ( histories,props ) => {
  let history
  // if we don't find our history ugen in the processor thread,
  // just go ahead and make a new one, they're cheap...
  if( Gibberish.mode === 'processor' ) {
    const id = Array.isArray( histories ) ? histories[0].id : histories.id
    history = Gibberish.ugens.get( id )
    if( history === undefined ) {
      history = g.history( 0 )
      Gibberish.ugens.set( id, history )
    }
    if( props === undefined ) props = { id }
  }else{
    history = histories[0]
  }

  return Gibberish.factory( Object.create( ugen ), history.out, ['analysis','SSD_Out'], props, null )
}

const In = histories => {
  const input = g.in( 'input' )
  let historyL, historyR
  
  if( Gibberish.mode === 'processor' ) {
    // for some reason the proessor id is always one off from the main thread id
    historyL = Gibberish.ugens.get( histories.id - 1 )
    historyR = Gibberish.ugens.get( histories.id )
  }else{
    historyL = histories[0]
    historyR = histories[1]
  }

  // deliberate let
  let ssdin = Object.create( ugen )
  
  ssdin.listen = function( input ) {
    ssdin.input = input
    // changing the input must trigger codegen
    Gibberish.dirty( Gibberish.analyzers ) 

    let isStereo = input.isStereo
    if( input.isStereo === undefined && input.isop === true ) {
      isStereo = input.inputs[0].isStereo === true || input.inputs[1].isStereo === true 
    }
    if( isStereo === true && Gibberish.mode === 'processor' ) {
      const idx = historyL.graph.memory.value.idx     
      ssdin.callback = function( input, memory ) {
        memory[ idx ] = input[ 0 ]
        memory[ idx + 1 ] = input[ 1 ]
        return 0     
      }

      // when each ugen callback is passed to the master callback function
      // it needs to have a ugenName property; we'll just copy this over
      ssdin.callback.ugenName = ssdin.ugenName
    }
  }

  ssdin = Gibberish.factory( ssdin, input, ['analysis','SSD_In'], { 'input':0 } )

  // overwrite the callback function in the processor thread...
  if( Gibberish.mode === 'processor' ) {
    const idx = historyL.graph.memory.value.idx
    
    ssdin.callback = function( input, memory ) {
      memory[ idx ] = input
      return 0     
    }

    // when each ugen callback is passed to the master callback function
    // it needs to have a ugenName property; we'll just copy this over
    ssdin.callback.ugenName = ssdin.ugenName
  }

  ssdin.type = 'analysis'
  Gibberish.analyzers.push( ssdin )

  return ssdin
}

SSD.defaults = {
  input:0,
  isStereo:false
}

return { In, Out, SSD }

}

},{"../ugen.js":208,"../workletProxy.js":210,"./analyzer.js":135,"genish.js":40}],139:[function(require,module,exports){
const ugen = require( '../ugen.js' ),
      g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const AD = function( argumentProps ) {
    const ad = Object.create( ugen ),
          attack  = g.in( 'attack' ),
          decay   = g.in( 'decay' )

    const props = Object.assign( {}, AD.defaults, argumentProps )

    const graph = g.ad( attack, decay, { shape:props.shape, alpha:props.alpha })

    ad.trigger = graph.trigger
    
    const __out = Gibberish.factory( ad, graph, ['envelopes','AD'], props )

    return __out
  }

  AD.defaults = { attack:44100, decay:44100, shape:'exponential', alpha:5 } 

  return AD

}

},{"../ugen.js":208,"genish.js":40}],140:[function(require,module,exports){
const ugen = require( '../ugen.js' ),
      g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const ADSR = function( argumentProps ) {
    const adsr  = Object.create( ugen ),
          attack  = g.in( 'attack' ),
          decay   = g.in( 'decay' ),
          sustain = g.in( 'sustain' ),
          release = g.in( 'release' ),
          sustainLevel = g.in( 'sustainLevel' )

    const props = Object.assign( {}, ADSR.defaults, argumentProps )

    Object.assign( adsr, props )

    const graph = g.adsr( 
      attack, decay, sustain, sustainLevel, release, 
      { triggerRelease: props.triggerRelease, shape:props.shape, alpha:props.alpha } 
    )

    adsr.trigger = graph.trigger
    adsr.advance = graph.release

    const __out = Gibberish.factory( adsr, graph, ['envelopes','ADSR'], props )

    return __out 
  }

  ADSR.defaults = { 
    attack:22050, 
    decay:22050, 
    sustain:44100, 
    sustainLevel:.6, 
    release: 44100, 
    triggerRelease:false,
    shape:'exponential',
    alpha:5 
  } 

  return ADSR
}

},{"../ugen.js":208,"genish.js":40}],141:[function(require,module,exports){
const g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const Envelopes = {
    AD     : require( './ad.js' )( Gibberish ),
    ADSR   : require( './adsr.js' )( Gibberish ),
    Ramp   : require( './ramp.js' )( Gibberish ),

    export : target => {
      for( let key in Envelopes ) {
        if( key !== 'export' && key !== 'factory' ) {
          target[ key ] = Envelopes[ key ]
        }
      }
    },

    factory( useADSR, shape, attack, decay, sustain, sustainLevel, release, triggerRelease=false ) {
      let env

      // deliberate use of single = to accomodate both 1 and true
      if( useADSR != true ) {
        env = g.ad( attack, decay, { shape }) 
      }else {
        env = g.adsr( attack, decay, sustain, sustainLevel, release, { shape, triggerRelease })
        env.advance = env.release
      }

      return env
    }
  } 

  return Envelopes
}

},{"./ad.js":139,"./adsr.js":140,"./ramp.js":142,"genish.js":40}],142:[function(require,module,exports){
const ugen = require( '../ugen.js' ),
      g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const Ramp = function( argumentProps ) {
    const ramp   = Object.create( ugen ),
          length = g.in( 'length' ),
          from   = g.in( 'from' ),
          to     = g.in( 'to' )

    const props = Object.assign({}, Ramp.defaults, argumentProps )

    const reset = g.bang()

    const phase = g.accum( g.div( 1, length ), reset, { shouldWrap:props.shouldLoop, shouldClamp:true }),
          diff = g.sub( to, from ),
          graph = g.add( from, g.mul( phase, diff ) )
        
    ramp.trigger = reset.trigger

    const out = Gibberish.factory( ramp, graph, ['envelopes','ramp'], props )


    return out
  }

  Ramp.defaults = { from:0, to:1, length:g.gen.samplerate, shouldLoop:false }

  return Ramp

}

},{"../ugen.js":208,"genish.js":40}],143:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./realm.js":145,"dup":28}],144:[function(require,module,exports){
"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
function peg$subclass(child, parent) {
  function C() {
    this.constructor = child;
  }
  C.prototype = parent.prototype;
  child.prototype = new C();
}
function peg$SyntaxError(message, expected, found, location) {
  var self = Error.call(this, message);
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}
peg$subclass(peg$SyntaxError, Error);
function peg$padEnd(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) {
    return str;
  }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}
peg$SyntaxError.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var loc = this.location.source + ":" + s.line + ":" + s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd("", s.line.toString().length, " ");
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      var hatLen = last - s.column || 1;
      str += "\n --> " + loc + "\n" + filler + " |\n" + s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1, " ") + peg$padEnd("", hatLen, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};
peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return '"' + literalEscape(expectation.text) + '"';
    },
    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
      });
      return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
    },
    any: function() {
      return "any character";
    },
    end: function() {
      return "end of input";
    },
    other: function(expectation) {
      return expectation.description;
    }
  };
  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }
  function literalEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
      return "\\x" + hex(ch);
    });
  }
  function classEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
      return "\\x0" + hex(ch);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
      return "\\x" + hex(ch);
    });
  }
  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }
  function describeExpected(expected2) {
    var descriptions = expected2.map(describeExpectation);
    var i, j;
    descriptions.sort();
    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }
    switch (descriptions.length) {
      case 1:
        return descriptions[0];
      case 2:
        return descriptions[0] + " or " + descriptions[1];
      default:
        return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
    }
  }
  function describeFound(found2) {
    return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
  }
  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function peg$parse(input, options) {
  options = options !== void 0 ? options : {};
  var peg$FAILED = {};
  var peg$source = options.grammarSource;
  var peg$startRuleFunctions = { start: peg$parsestart };
  var peg$startRuleFunction = peg$parsestart;
  var peg$c0 = ".";
  var peg$c1 = "-";
  var peg$c2 = "+";
  var peg$c3 = "0";
  var peg$c4 = ",";
  var peg$c5 = "|";
  var peg$c6 = '"';
  var peg$c7 = "'";
  var peg$c8 = "#";
  var peg$c9 = "^";
  var peg$c10 = "_";
  var peg$c11 = ":";
  var peg$c12 = "[";
  var peg$c13 = "]";
  var peg$c14 = "{";
  var peg$c15 = "}";
  var peg$c16 = "%";
  var peg$c17 = "<";
  var peg$c18 = ">";
  var peg$c19 = "@";
  var peg$c20 = "!";
  var peg$c21 = "(";
  var peg$c22 = ")";
  var peg$c23 = "/";
  var peg$c24 = "*";
  var peg$c25 = "?";
  var peg$c26 = "struct";
  var peg$c27 = "target";
  var peg$c28 = "euclid";
  var peg$c29 = "slow";
  var peg$c30 = "rotL";
  var peg$c31 = "rotR";
  var peg$c32 = "fast";
  var peg$c33 = "scale";
  var peg$c34 = "//";
  var peg$c35 = "cat";
  var peg$c36 = "$";
  var peg$c37 = "setcps";
  var peg$c38 = "setbpm";
  var peg$c39 = "hush";
  var peg$r0 = /^[1-9]/;
  var peg$r1 = /^[eE]/;
  var peg$r2 = /^[0-9]/;
  var peg$r3 = /^[ \n\r\t]/;
  var peg$r4 = /^[0-9a-zA-Z~]/;
  var peg$r5 = /^[^\n]/;
  var peg$e0 = peg$otherExpectation("number");
  var peg$e1 = peg$literalExpectation(".", false);
  var peg$e2 = peg$classExpectation([["1", "9"]], false, false);
  var peg$e3 = peg$classExpectation(["e", "E"], false, false);
  var peg$e4 = peg$literalExpectation("-", false);
  var peg$e5 = peg$literalExpectation("+", false);
  var peg$e6 = peg$literalExpectation("0", false);
  var peg$e7 = peg$classExpectation([["0", "9"]], false, false);
  var peg$e8 = peg$otherExpectation("whitespace");
  var peg$e9 = peg$classExpectation([" ", "\n", "\r", "	"], false, false);
  var peg$e10 = peg$literalExpectation(",", false);
  var peg$e11 = peg$literalExpectation("|", false);
  var peg$e12 = peg$literalExpectation('"', false);
  var peg$e13 = peg$literalExpectation("'", false);
  var peg$e14 = peg$classExpectation([["0", "9"], ["a", "z"], ["A", "Z"], "~"], false, false);
  var peg$e15 = peg$literalExpectation("#", false);
  var peg$e16 = peg$literalExpectation("^", false);
  var peg$e17 = peg$literalExpectation("_", false);
  var peg$e18 = peg$literalExpectation(":", false);
  var peg$e19 = peg$literalExpectation("[", false);
  var peg$e20 = peg$literalExpectation("]", false);
  var peg$e21 = peg$literalExpectation("{", false);
  var peg$e22 = peg$literalExpectation("}", false);
  var peg$e23 = peg$literalExpectation("%", false);
  var peg$e24 = peg$literalExpectation("<", false);
  var peg$e25 = peg$literalExpectation(">", false);
  var peg$e26 = peg$literalExpectation("@", false);
  var peg$e27 = peg$literalExpectation("!", false);
  var peg$e28 = peg$literalExpectation("(", false);
  var peg$e29 = peg$literalExpectation(")", false);
  var peg$e30 = peg$literalExpectation("/", false);
  var peg$e31 = peg$literalExpectation("*", false);
  var peg$e32 = peg$literalExpectation("?", false);
  var peg$e33 = peg$literalExpectation("struct", false);
  var peg$e34 = peg$literalExpectation("target", false);
  var peg$e35 = peg$literalExpectation("euclid", false);
  var peg$e36 = peg$literalExpectation("slow", false);
  var peg$e37 = peg$literalExpectation("rotL", false);
  var peg$e38 = peg$literalExpectation("rotR", false);
  var peg$e39 = peg$literalExpectation("fast", false);
  var peg$e40 = peg$literalExpectation("scale", false);
  var peg$e41 = peg$literalExpectation("//", false);
  var peg$e42 = peg$classExpectation(["\n"], true, false);
  var peg$e43 = peg$literalExpectation("cat", false);
  var peg$e44 = peg$literalExpectation("$", false);
  var peg$e45 = peg$literalExpectation("setcps", false);
  var peg$e46 = peg$literalExpectation("setbpm", false);
  var peg$e47 = peg$literalExpectation("hush", false);
  var peg$f0 = function() {
    return parseFloat(text());
  };
  var peg$f1 = function(chars) {
    return new AtomStub(chars.join(""));
  };
  var peg$f2 = function(s) {
    return s;
  };
  var peg$f3 = function(s, stepsPerCycle) {
    s.arguments_.stepsPerCycle = stepsPerCycle;
    return s;
  };
  var peg$f4 = function(a2) {
    return a2;
  };
  var peg$f5 = function(s) {
    s.arguments_.alignment = "slowcat";
    return s;
  };
  var peg$f6 = function(a2) {
    return { weight: a2 };
  };
  var peg$f7 = function(a2) {
    return { replicate: a2 };
  };
  var peg$f8 = function(p, s, r2) {
    return { operator: { type_: "bjorklund", arguments_: { pulse: p, step: s, rotation: r2 } } };
  };
  var peg$f9 = function(a2) {
    return { operator: { type_: "stretch", arguments_: { amount: a2, type: "slow" } } };
  };
  var peg$f10 = function(a2) {
    return { operator: { type_: "stretch", arguments_: { amount: a2, type: "fast" } } };
  };
  var peg$f11 = function(a2) {
    return { operator: { type_: "degradeBy", arguments_: { amount: a2 } } };
  };
  var peg$f12 = function(s, o) {
    return new ElementStub(s, o);
  };
  var peg$f13 = function(s) {
    return new PatternStub(s, "fastcat");
  };
  var peg$f14 = function(tail) {
    return { alignment: "stack", list: tail };
  };
  var peg$f15 = function(tail) {
    return { alignment: "rand", list: tail };
  };
  var peg$f16 = function(head, tail) {
    if (tail && tail.list.length > 0) {
      return new PatternStub([head, ...tail.list], tail.alignment);
    } else {
      return head;
    }
  };
  var peg$f17 = function(head, tail) {
    return new PatternStub(tail ? [head, ...tail.list] : [head], "polymeter");
  };
  var peg$f18 = function(sc) {
    return sc;
  };
  var peg$f19 = function(s) {
    return { name: "struct", args: { mini: s } };
  };
  var peg$f20 = function(s) {
    return { name: "target", args: { name: s } };
  };
  var peg$f21 = function(p, s, r2) {
    return { name: "bjorklund", args: { pulse: p, step: parseInt(s) } };
  };
  var peg$f22 = function(a2) {
    return { name: "stretch", args: { amount: a2 } };
  };
  var peg$f23 = function(a2) {
    return { name: "shift", args: { amount: "-" + a2 } };
  };
  var peg$f24 = function(a2) {
    return { name: "shift", args: { amount: a2 } };
  };
  var peg$f25 = function(a2) {
    return { name: "stretch", args: { amount: "1/" + a2 } };
  };
  var peg$f26 = function(s) {
    return { name: "scale", args: { scale: s.join("") } };
  };
  var peg$f27 = function(s, v) {
    return v;
  };
  var peg$f28 = function(s, ss) {
    ss.unshift(s);
    return new PatternStub(ss, "slowcat");
  };
  var peg$f29 = function(sg) {
    return sg;
  };
  var peg$f30 = function(o, soc) {
    return new OperatorStub(o.name, o.args, soc);
  };
  var peg$f31 = function(sc) {
    return sc;
  };
  var peg$f32 = function(c) {
    return c;
  };
  var peg$f33 = function(v) {
    return new CommandStub("setcps", { value: v });
  };
  var peg$f34 = function(v) {
    return new CommandStub("setcps", { value: v / 120 / 2 });
  };
  var peg$f35 = function() {
    return new CommandStub("hush");
  };
  var peg$currPos = 0;
  var peg$savedPos = 0;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = 0;
  var peg$maxFailExpected = [];
  var peg$silentFails = 0;
  var peg$result;
  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
    }
    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }
  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }
  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }
  function peg$literalExpectation(text2, ignoreCase) {
    return { type: "literal", text: text2, ignoreCase };
  }
  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts, inverted, ignoreCase };
  }
  function peg$endExpectation() {
    return { type: "end" };
  }
  function peg$otherExpectation(description) {
    return { type: "other", description };
  }
  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;
    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }
      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };
      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }
        p++;
      }
      peg$posDetailsCache[pos] = details;
      return details;
    }
  }
  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);
    return {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }
  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) {
      return;
    }
    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }
    peg$maxFailExpected.push(expected);
  }
  function peg$buildStructuredError(expected, found, location2) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location2
    );
  }
  function peg$parsestart() {
    var s0;
    s0 = peg$parsestatement();
    return s0;
  }
  function peg$parsenumber() {
    var s0, s2;
    peg$silentFails++;
    s0 = peg$currPos;
    peg$parseminus();
    s2 = peg$parseint();
    if (s2 !== peg$FAILED) {
      peg$parsefrac();
      peg$parseexp();
      peg$savedPos = s0;
      s0 = peg$f0();
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      if (peg$silentFails === 0) {
        peg$fail(peg$e0);
      }
    }
    return s0;
  }
  function peg$parsedecimal_point() {
    var s0;
    if (input.charCodeAt(peg$currPos) === 46) {
      s0 = peg$c0;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e1);
      }
    }
    return s0;
  }
  function peg$parsedigit1_9() {
    var s0;
    if (peg$r0.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e2);
      }
    }
    return s0;
  }
  function peg$parsee() {
    var s0;
    if (peg$r1.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e3);
      }
    }
    return s0;
  }
  function peg$parseexp() {
    var s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = peg$parsee();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseminus();
      if (s2 === peg$FAILED) {
        s2 = peg$parseplus();
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = [];
      s4 = peg$parseDIGIT();
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parseDIGIT();
        }
      } else {
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsefrac() {
    var s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parsedecimal_point();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseDIGIT();
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDIGIT();
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseint() {
    var s0, s1, s2, s3;
    s0 = peg$parsezero();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsedigit1_9();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDIGIT();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseDIGIT();
        }
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    return s0;
  }
  function peg$parseminus() {
    var s0;
    if (input.charCodeAt(peg$currPos) === 45) {
      s0 = peg$c1;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e4);
      }
    }
    return s0;
  }
  function peg$parseplus() {
    var s0;
    if (input.charCodeAt(peg$currPos) === 43) {
      s0 = peg$c2;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e5);
      }
    }
    return s0;
  }
  function peg$parsezero() {
    var s0;
    if (input.charCodeAt(peg$currPos) === 48) {
      s0 = peg$c3;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e6);
      }
    }
    return s0;
  }
  function peg$parseDIGIT() {
    var s0;
    if (peg$r2.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e7);
      }
    }
    return s0;
  }
  function peg$parsews() {
    var s0, s1;
    peg$silentFails++;
    s0 = [];
    if (peg$r3.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e9);
      }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$r3.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e9);
        }
      }
    }
    peg$silentFails--;
    s1 = peg$FAILED;
    if (peg$silentFails === 0) {
      peg$fail(peg$e8);
    }
    return s0;
  }
  function peg$parsecomma() {
    var s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parsews();
    if (input.charCodeAt(peg$currPos) === 44) {
      s2 = peg$c4;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e10);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parsews();
      s1 = [s1, s2, s3];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsepipe() {
    var s0, s1, s2, s3;
    s0 = peg$currPos;
    s1 = peg$parsews();
    if (input.charCodeAt(peg$currPos) === 124) {
      s2 = peg$c5;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e11);
      }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parsews();
      s1 = [s1, s2, s3];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsequote() {
    var s0;
    if (input.charCodeAt(peg$currPos) === 34) {
      s0 = peg$c6;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e12);
      }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 39) {
        s0 = peg$c7;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e13);
        }
      }
    }
    return s0;
  }
  function peg$parsestep_char() {
    var s0;
    if (peg$r4.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e14);
      }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c1;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 35) {
          s0 = peg$c8;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e15);
          }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s0 = peg$c0;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e1);
            }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 94) {
              s0 = peg$c9;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e16);
              }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 95) {
                s0 = peg$c10;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e17);
                }
              }
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 58) {
                  s0 = peg$c11;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e18);
                  }
                }
              }
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parsestep() {
    var s0, s2, s3;
    s0 = peg$currPos;
    peg$parsews();
    s2 = [];
    s3 = peg$parsestep_char();
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parsestep_char();
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parsews();
      peg$savedPos = s0;
      s0 = peg$f1(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsesub_cycle() {
    var s0, s2, s4, s6;
    s0 = peg$currPos;
    peg$parsews();
    if (input.charCodeAt(peg$currPos) === 91) {
      s2 = peg$c12;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e19);
      }
    }
    if (s2 !== peg$FAILED) {
      peg$parsews();
      s4 = peg$parsestack_or_choose();
      if (s4 !== peg$FAILED) {
        peg$parsews();
        if (input.charCodeAt(peg$currPos) === 93) {
          s6 = peg$c13;
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e20);
          }
        }
        if (s6 !== peg$FAILED) {
          peg$parsews();
          peg$savedPos = s0;
          s0 = peg$f2(s4);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsepolymeter() {
    var s0, s2, s4, s6, s7;
    s0 = peg$currPos;
    peg$parsews();
    if (input.charCodeAt(peg$currPos) === 123) {
      s2 = peg$c14;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e21);
      }
    }
    if (s2 !== peg$FAILED) {
      peg$parsews();
      s4 = peg$parsepolymeter_stack();
      if (s4 !== peg$FAILED) {
        peg$parsews();
        if (input.charCodeAt(peg$currPos) === 125) {
          s6 = peg$c15;
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e22);
          }
        }
        if (s6 !== peg$FAILED) {
          s7 = peg$parsepolymeter_steps();
          if (s7 === peg$FAILED) {
            s7 = null;
          }
          peg$parsews();
          peg$savedPos = s0;
          s0 = peg$f3(s4, s7);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsepolymeter_steps() {
    var s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 37) {
      s1 = peg$c16;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e23);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseslice();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f4(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslow_sequence() {
    var s0, s2, s4, s6;
    s0 = peg$currPos;
    peg$parsews();
    if (input.charCodeAt(peg$currPos) === 60) {
      s2 = peg$c17;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e24);
      }
    }
    if (s2 !== peg$FAILED) {
      peg$parsews();
      s4 = peg$parsesequence();
      if (s4 !== peg$FAILED) {
        peg$parsews();
        if (input.charCodeAt(peg$currPos) === 62) {
          s6 = peg$c18;
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e25);
          }
        }
        if (s6 !== peg$FAILED) {
          peg$parsews();
          peg$savedPos = s0;
          s0 = peg$f5(s4);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice() {
    var s0;
    s0 = peg$parsestep();
    if (s0 === peg$FAILED) {
      s0 = peg$parsesub_cycle();
      if (s0 === peg$FAILED) {
        s0 = peg$parsepolymeter();
        if (s0 === peg$FAILED) {
          s0 = peg$parseslow_sequence();
        }
      }
    }
    return s0;
  }
  function peg$parseslice_modifier() {
    var s0;
    s0 = peg$parseslice_weight();
    if (s0 === peg$FAILED) {
      s0 = peg$parseslice_bjorklund();
      if (s0 === peg$FAILED) {
        s0 = peg$parseslice_slow();
        if (s0 === peg$FAILED) {
          s0 = peg$parseslice_fast();
          if (s0 === peg$FAILED) {
            s0 = peg$parseslice_replicate();
            if (s0 === peg$FAILED) {
              s0 = peg$parseslice_degrade();
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parseslice_weight() {
    var s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 64) {
      s1 = peg$c19;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e26);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsenumber();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f6(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice_replicate() {
    var s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 33) {
      s1 = peg$c20;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e27);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsenumber();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f7(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice_bjorklund() {
    var s0, s1, s3, s5, s7, s11, s13;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c21;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e28);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parseslice_with_modifier();
      if (s3 !== peg$FAILED) {
        peg$parsews();
        s5 = peg$parsecomma();
        if (s5 !== peg$FAILED) {
          peg$parsews();
          s7 = peg$parseslice_with_modifier();
          if (s7 !== peg$FAILED) {
            peg$parsews();
            peg$parsecomma();
            peg$parsews();
            s11 = peg$parseslice_with_modifier();
            if (s11 === peg$FAILED) {
              s11 = null;
            }
            peg$parsews();
            if (input.charCodeAt(peg$currPos) === 41) {
              s13 = peg$c22;
              peg$currPos++;
            } else {
              s13 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e29);
              }
            }
            if (s13 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f8(s3, s7, s11);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice_slow() {
    var s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 47) {
      s1 = peg$c23;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e30);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseslice();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f9(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice_fast() {
    var s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 42) {
      s1 = peg$c24;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e31);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseslice();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f10(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice_degrade() {
    var s0, s1, s2;
    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 63) {
      s1 = peg$c25;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e32);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsenumber();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f11(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslice_with_modifier() {
    var s0, s1, s2;
    s0 = peg$currPos;
    s1 = peg$parseslice();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseslice_modifier();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f12(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsesequence() {
    var s0, s1, s2;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseslice_with_modifier();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseslice_with_modifier();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f13(s1);
    }
    s0 = s1;
    return s0;
  }
  function peg$parsestack_tail() {
    var s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parsecomma();
    if (s3 !== peg$FAILED) {
      s4 = peg$parsesequence();
      if (s4 !== peg$FAILED) {
        s2 = s4;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parsecomma();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesequence();
          if (s4 !== peg$FAILED) {
            s2 = s4;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f14(s1);
    }
    s0 = s1;
    return s0;
  }
  function peg$parsechoose_tail() {
    var s0, s1, s2, s3, s4;
    s0 = peg$currPos;
    s1 = [];
    s2 = peg$currPos;
    s3 = peg$parsepipe();
    if (s3 !== peg$FAILED) {
      s4 = peg$parsesequence();
      if (s4 !== peg$FAILED) {
        s2 = s4;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
    } else {
      peg$currPos = s2;
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parsepipe();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesequence();
          if (s4 !== peg$FAILED) {
            s2 = s4;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f15(s1);
    }
    s0 = s1;
    return s0;
  }
  function peg$parsestack_or_choose() {
    var s0, s1, s2;
    s0 = peg$currPos;
    s1 = peg$parsesequence();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsestack_tail();
      if (s2 === peg$FAILED) {
        s2 = peg$parsechoose_tail();
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f16(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsepolymeter_stack() {
    var s0, s1, s2;
    s0 = peg$currPos;
    s1 = peg$parsesequence();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsestack_tail();
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f17(s1, s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsemini() {
    var s0, s2, s3, s4;
    s0 = peg$currPos;
    peg$parsews();
    s2 = peg$parsequote();
    if (s2 !== peg$FAILED) {
      s3 = peg$parsestack_or_choose();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsequote();
        if (s4 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f18(s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseoperator() {
    var s0;
    s0 = peg$parsescale();
    if (s0 === peg$FAILED) {
      s0 = peg$parseslow();
      if (s0 === peg$FAILED) {
        s0 = peg$parsefast();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetarget();
          if (s0 === peg$FAILED) {
            s0 = peg$parsebjorklund();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestruct();
              if (s0 === peg$FAILED) {
                s0 = peg$parserotR();
                if (s0 === peg$FAILED) {
                  s0 = peg$parserotL();
                }
              }
            }
          }
        }
      }
    }
    return s0;
  }
  function peg$parsestruct() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c26) {
      s1 = peg$c26;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e33);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsemini_or_operator();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f19(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsetarget() {
    var s0, s1, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c27) {
      s1 = peg$c27;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e34);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsequote();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsestep();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsequote();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f20(s4);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsebjorklund() {
    var s0, s1, s3, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c28) {
      s1 = peg$c28;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e35);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parseint();
      if (s3 !== peg$FAILED) {
        peg$parsews();
        s5 = peg$parseint();
        if (s5 !== peg$FAILED) {
          peg$parsews();
          peg$parseint();
          peg$savedPos = s0;
          s0 = peg$f21(s3, s5);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parseslow() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c29) {
      s1 = peg$c29;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e36);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsenumber();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f22(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parserotL() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c30) {
      s1 = peg$c30;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e37);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsenumber();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f23(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parserotR() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c31) {
      s1 = peg$c31;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e38);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsenumber();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f24(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsefast() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c32) {
      s1 = peg$c32;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e39);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsenumber();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f25(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsescale() {
    var s0, s1, s3, s4, s5;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 5) === peg$c33) {
      s1 = peg$c33;
      peg$currPos += 5;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e40);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsequote();
      if (s3 !== peg$FAILED) {
        s4 = [];
        s5 = peg$parsestep_char();
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parsestep_char();
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsequote();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f26(s4);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsecomment() {
    var s0, s1, s2, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 2) === peg$c34) {
      s1 = peg$c34;
      peg$currPos += 2;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e41);
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$r5.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e42);
        }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$r5.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e42);
          }
        }
      }
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsecat() {
    var s0, s1, s3, s5, s6, s7, s8, s9;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c35) {
      s1 = peg$c35;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e43);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      if (input.charCodeAt(peg$currPos) === 91) {
        s3 = peg$c12;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e19);
        }
      }
      if (s3 !== peg$FAILED) {
        peg$parsews();
        s5 = peg$parsemini_or_operator();
        if (s5 !== peg$FAILED) {
          s6 = [];
          s7 = peg$currPos;
          s8 = peg$parsecomma();
          if (s8 !== peg$FAILED) {
            s9 = peg$parsemini_or_operator();
            if (s9 !== peg$FAILED) {
              peg$savedPos = s7;
              s7 = peg$f27(s5, s9);
            } else {
              peg$currPos = s7;
              s7 = peg$FAILED;
            }
          } else {
            peg$currPos = s7;
            s7 = peg$FAILED;
          }
          while (s7 !== peg$FAILED) {
            s6.push(s7);
            s7 = peg$currPos;
            s8 = peg$parsecomma();
            if (s8 !== peg$FAILED) {
              s9 = peg$parsemini_or_operator();
              if (s9 !== peg$FAILED) {
                peg$savedPos = s7;
                s7 = peg$f27(s5, s9);
              } else {
                peg$currPos = s7;
                s7 = peg$FAILED;
              }
            } else {
              peg$currPos = s7;
              s7 = peg$FAILED;
            }
          }
          s7 = peg$parsews();
          if (input.charCodeAt(peg$currPos) === 93) {
            s8 = peg$c13;
            peg$currPos++;
          } else {
            s8 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e20);
            }
          }
          if (s8 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f28(s5, s6);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsemini_or_group() {
    var s0;
    s0 = peg$parsecat();
    if (s0 === peg$FAILED) {
      s0 = peg$parsemini();
    }
    return s0;
  }
  function peg$parsemini_or_operator() {
    var s0, s1, s3, s4, s5;
    s0 = peg$currPos;
    s1 = peg$parsemini_or_group();
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = [];
      s4 = peg$parsecomment();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsecomment();
      }
      peg$savedPos = s0;
      s0 = peg$f29(s1);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseoperator();
      if (s1 !== peg$FAILED) {
        peg$parsews();
        if (input.charCodeAt(peg$currPos) === 36) {
          s3 = peg$c36;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e44);
          }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsews();
          s5 = peg$parsemini_or_operator();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f30(s1, s5);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    return s0;
  }
  function peg$parsesequ_or_operator_or_comment() {
    var s0, s1;
    s0 = peg$currPos;
    s1 = peg$parsemini_or_operator();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f31(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$parsecomment();
    }
    return s0;
  }
  function peg$parsemini_definition() {
    var s0;
    s0 = peg$parsesequ_or_operator_or_comment();
    return s0;
  }
  function peg$parsecommand() {
    var s0, s2;
    s0 = peg$currPos;
    peg$parsews();
    s2 = peg$parsesetcps();
    if (s2 === peg$FAILED) {
      s2 = peg$parsesetbpm();
      if (s2 === peg$FAILED) {
        s2 = peg$parsehush();
      }
    }
    if (s2 !== peg$FAILED) {
      peg$parsews();
      peg$savedPos = s0;
      s0 = peg$f32(s2);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsesetcps() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c37) {
      s1 = peg$c37;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e45);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsenumber();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f33(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsesetbpm() {
    var s0, s1, s3;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c38) {
      s1 = peg$c38;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e46);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$parsews();
      s3 = peg$parsenumber();
      if (s3 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f34(s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    return s0;
  }
  function peg$parsehush() {
    var s0, s1;
    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c39) {
      s1 = peg$c39;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e47);
      }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f35();
    }
    s0 = s1;
    return s0;
  }
  function peg$parsestatement() {
    var s0;
    s0 = peg$parsemini_definition();
    if (s0 === peg$FAILED) {
      s0 = peg$parsecommand();
    }
    return s0;
  }
  var AtomStub = function(source) {
    this.type_ = "atom";
    this.source_ = source;
    this.location_ = location();
  };
  var PatternStub = function(source, alignment) {
    this.type_ = "pattern";
    this.arguments_ = { alignment };
    this.source_ = source;
  };
  var OperatorStub = function(name, args, source) {
    this.type_ = name;
    this.arguments_ = args;
    this.source_ = source;
  };
  var ElementStub = function(source, options2) {
    this.type_ = "element";
    this.source_ = source;
    this.options_ = options2;
    this.location_ = location();
  };
  var CommandStub = function(name, options2) {
    this.type_ = "command";
    this.name_ = name;
    this.options_ = options2;
  };
  peg$result = peg$startRuleFunction();
  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }
    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var fraction$1 = { exports: {} };
/**
 * @license Fraction.js v4.2.0 05/03/2022
 * https://www.xarg.org/2014/03/rational-numbers-in-javascript/
 *
 * Copyright (c) 2021, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/
(function(module2, exports2) {
  (function(root) {
    var MAX_CYCLE_LEN = 2e3;
    var P = {
      "s": 1,
      "n": 0,
      "d": 1
    };
    function assign(n, s) {
      if (isNaN(n = parseInt(n, 10))) {
        throw Fraction2["InvalidParameter"];
      }
      return n * s;
    }
    function newFraction(n, d) {
      if (d === 0) {
        throw Fraction2["DivisionByZero"];
      }
      var f = Object.create(Fraction2.prototype);
      f["s"] = n < 0 ? -1 : 1;
      n = n < 0 ? -n : n;
      var a2 = gcd2(n, d);
      f["n"] = n / a2;
      f["d"] = d / a2;
      return f;
    }
    function factorize(num) {
      var factors = {};
      var n = num;
      var i = 2;
      var s = 4;
      while (s <= n) {
        while (n % i === 0) {
          n /= i;
          factors[i] = (factors[i] || 0) + 1;
        }
        s += 1 + 2 * i++;
      }
      if (n !== num) {
        if (n > 1)
          factors[n] = (factors[n] || 0) + 1;
      } else {
        factors[num] = (factors[num] || 0) + 1;
      }
      return factors;
    }
    var parse = function(p1, p2) {
      var n = 0, d = 1, s = 1;
      var v = 0, w2 = 0, x2 = 0, y2 = 1, z = 1;
      var A = 0, B = 1;
      var C = 1, D = 1;
      var N = 1e7;
      var M;
      if (p1 === void 0 || p1 === null)
        ;
      else if (p2 !== void 0) {
        n = p1;
        d = p2;
        s = n * d;
        if (n % 1 !== 0 || d % 1 !== 0) {
          throw Fraction2["NonIntegerParameter"];
        }
      } else
        switch (typeof p1) {
          case "object": {
            if ("d" in p1 && "n" in p1) {
              n = p1["n"];
              d = p1["d"];
              if ("s" in p1)
                n *= p1["s"];
            } else if (0 in p1) {
              n = p1[0];
              if (1 in p1)
                d = p1[1];
            } else {
              throw Fraction2["InvalidParameter"];
            }
            s = n * d;
            break;
          }
          case "number": {
            if (p1 < 0) {
              s = p1;
              p1 = -p1;
            }
            if (p1 % 1 === 0) {
              n = p1;
            } else if (p1 > 0) {
              if (p1 >= 1) {
                z = Math.pow(10, Math.floor(1 + Math.log(p1) / Math.LN10));
                p1 /= z;
              }
              while (B <= N && D <= N) {
                M = (A + C) / (B + D);
                if (p1 === M) {
                  if (B + D <= N) {
                    n = A + C;
                    d = B + D;
                  } else if (D > B) {
                    n = C;
                    d = D;
                  } else {
                    n = A;
                    d = B;
                  }
                  break;
                } else {
                  if (p1 > M) {
                    A += C;
                    B += D;
                  } else {
                    C += A;
                    D += B;
                  }
                  if (B > N) {
                    n = C;
                    d = D;
                  } else {
                    n = A;
                    d = B;
                  }
                }
              }
              n *= z;
            } else if (isNaN(p1) || isNaN(p2)) {
              d = n = NaN;
            }
            break;
          }
          case "string": {
            B = p1.match(/\d+|./g);
            if (B === null)
              throw Fraction2["InvalidParameter"];
            if (B[A] === "-") {
              s = -1;
              A++;
            } else if (B[A] === "+") {
              A++;
            }
            if (B.length === A + 1) {
              w2 = assign(B[A++], s);
            } else if (B[A + 1] === "." || B[A] === ".") {
              if (B[A] !== ".") {
                v = assign(B[A++], s);
              }
              A++;
              if (A + 1 === B.length || B[A + 1] === "(" && B[A + 3] === ")" || B[A + 1] === "'" && B[A + 3] === "'") {
                w2 = assign(B[A], s);
                y2 = Math.pow(10, B[A].length);
                A++;
              }
              if (B[A] === "(" && B[A + 2] === ")" || B[A] === "'" && B[A + 2] === "'") {
                x2 = assign(B[A + 1], s);
                z = Math.pow(10, B[A + 1].length) - 1;
                A += 3;
              }
            } else if (B[A + 1] === "/" || B[A + 1] === ":") {
              w2 = assign(B[A], s);
              y2 = assign(B[A + 2], 1);
              A += 3;
            } else if (B[A + 3] === "/" && B[A + 1] === " ") {
              v = assign(B[A], s);
              w2 = assign(B[A + 2], s);
              y2 = assign(B[A + 4], 1);
              A += 5;
            }
            if (B.length <= A) {
              d = y2 * z;
              s = n = x2 + d * v + z * w2;
              break;
            }
          }
          default:
            throw Fraction2["InvalidParameter"];
        }
      if (d === 0) {
        throw Fraction2["DivisionByZero"];
      }
      P["s"] = s < 0 ? -1 : 1;
      P["n"] = Math.abs(n);
      P["d"] = Math.abs(d);
    };
    function modpow(b, e, m) {
      var r2 = 1;
      for (; e > 0; b = b * b % m, e >>= 1) {
        if (e & 1) {
          r2 = r2 * b % m;
        }
      }
      return r2;
    }
    function cycleLen(n, d) {
      for (; d % 2 === 0; d /= 2) {
      }
      for (; d % 5 === 0; d /= 5) {
      }
      if (d === 1)
        return 0;
      var rem = 10 % d;
      var t = 1;
      for (; rem !== 1; t++) {
        rem = rem * 10 % d;
        if (t > MAX_CYCLE_LEN)
          return 0;
      }
      return t;
    }
    function cycleStart(n, d, len) {
      var rem1 = 1;
      var rem2 = modpow(10, len, d);
      for (var t = 0; t < 300; t++) {
        if (rem1 === rem2)
          return t;
        rem1 = rem1 * 10 % d;
        rem2 = rem2 * 10 % d;
      }
      return 0;
    }
    function gcd2(a2, b) {
      if (!a2)
        return b;
      if (!b)
        return a2;
      while (1) {
        a2 %= b;
        if (!a2)
          return b;
        b %= a2;
        if (!b)
          return a2;
      }
    }
    function Fraction2(a2, b) {
      parse(a2, b);
      if (this instanceof Fraction2) {
        a2 = gcd2(P["d"], P["n"]);
        this["s"] = P["s"];
        this["n"] = P["n"] / a2;
        this["d"] = P["d"] / a2;
      } else {
        return newFraction(P["s"] * P["n"], P["d"]);
      }
    }
    Fraction2["DivisionByZero"] = new Error("Division by Zero");
    Fraction2["InvalidParameter"] = new Error("Invalid argument");
    Fraction2["NonIntegerParameter"] = new Error("Parameters must be integer");
    Fraction2.prototype = {
      "s": 1,
      "n": 0,
      "d": 1,
      "abs": function() {
        return newFraction(this["n"], this["d"]);
      },
      "neg": function() {
        return newFraction(-this["s"] * this["n"], this["d"]);
      },
      "add": function(a2, b) {
        parse(a2, b);
        return newFraction(
          this["s"] * this["n"] * P["d"] + P["s"] * this["d"] * P["n"],
          this["d"] * P["d"]
        );
      },
      "sub": function(a2, b) {
        parse(a2, b);
        return newFraction(
          this["s"] * this["n"] * P["d"] - P["s"] * this["d"] * P["n"],
          this["d"] * P["d"]
        );
      },
      "mul": function(a2, b) {
        parse(a2, b);
        return newFraction(
          this["s"] * P["s"] * this["n"] * P["n"],
          this["d"] * P["d"]
        );
      },
      "div": function(a2, b) {
        parse(a2, b);
        return newFraction(
          this["s"] * P["s"] * this["n"] * P["d"],
          this["d"] * P["n"]
        );
      },
      "clone": function() {
        return newFraction(this["s"] * this["n"], this["d"]);
      },
      "mod": function(a2, b) {
        if (isNaN(this["n"]) || isNaN(this["d"])) {
          return new Fraction2(NaN);
        }
        if (a2 === void 0) {
          return newFraction(this["s"] * this["n"] % this["d"], 1);
        }
        parse(a2, b);
        if (0 === P["n"] && 0 === this["d"]) {
          throw Fraction2["DivisionByZero"];
        }
        return newFraction(
          this["s"] * (P["d"] * this["n"]) % (P["n"] * this["d"]),
          P["d"] * this["d"]
        );
      },
      "gcd": function(a2, b) {
        parse(a2, b);
        return newFraction(gcd2(P["n"], this["n"]) * gcd2(P["d"], this["d"]), P["d"] * this["d"]);
      },
      "lcm": function(a2, b) {
        parse(a2, b);
        if (P["n"] === 0 && this["n"] === 0) {
          return newFraction(0, 1);
        }
        return newFraction(P["n"] * this["n"], gcd2(P["n"], this["n"]) * gcd2(P["d"], this["d"]));
      },
      "ceil": function(places) {
        places = Math.pow(10, places || 0);
        if (isNaN(this["n"]) || isNaN(this["d"])) {
          return new Fraction2(NaN);
        }
        return newFraction(Math.ceil(places * this["s"] * this["n"] / this["d"]), places);
      },
      "floor": function(places) {
        places = Math.pow(10, places || 0);
        if (isNaN(this["n"]) || isNaN(this["d"])) {
          return new Fraction2(NaN);
        }
        return newFraction(Math.floor(places * this["s"] * this["n"] / this["d"]), places);
      },
      "round": function(places) {
        places = Math.pow(10, places || 0);
        if (isNaN(this["n"]) || isNaN(this["d"])) {
          return new Fraction2(NaN);
        }
        return newFraction(Math.round(places * this["s"] * this["n"] / this["d"]), places);
      },
      "inverse": function() {
        return newFraction(this["s"] * this["d"], this["n"]);
      },
      "pow": function(a2, b) {
        parse(a2, b);
        if (P["d"] === 1) {
          if (P["s"] < 0) {
            return newFraction(Math.pow(this["s"] * this["d"], P["n"]), Math.pow(this["n"], P["n"]));
          } else {
            return newFraction(Math.pow(this["s"] * this["n"], P["n"]), Math.pow(this["d"], P["n"]));
          }
        }
        if (this["s"] < 0)
          return null;
        var N = factorize(this["n"]);
        var D = factorize(this["d"]);
        var n = 1;
        var d = 1;
        for (var k in N) {
          if (k === "1")
            continue;
          if (k === "0") {
            n = 0;
            break;
          }
          N[k] *= P["n"];
          if (N[k] % P["d"] === 0) {
            N[k] /= P["d"];
          } else
            return null;
          n *= Math.pow(k, N[k]);
        }
        for (var k in D) {
          if (k === "1")
            continue;
          D[k] *= P["n"];
          if (D[k] % P["d"] === 0) {
            D[k] /= P["d"];
          } else
            return null;
          d *= Math.pow(k, D[k]);
        }
        if (P["s"] < 0) {
          return newFraction(d, n);
        }
        return newFraction(n, d);
      },
      "equals": function(a2, b) {
        parse(a2, b);
        return this["s"] * this["n"] * P["d"] === P["s"] * P["n"] * this["d"];
      },
      "compare": function(a2, b) {
        parse(a2, b);
        var t = this["s"] * this["n"] * P["d"] - P["s"] * P["n"] * this["d"];
        return (0 < t) - (t < 0);
      },
      "simplify": function(eps) {
        if (isNaN(this["n"]) || isNaN(this["d"])) {
          return this;
        }
        eps = eps || 1e-3;
        var thisABS = this["abs"]();
        var cont = thisABS["toContinued"]();
        for (var i = 1; i < cont.length; i++) {
          var s = newFraction(cont[i - 1], 1);
          for (var k = i - 2; k >= 0; k--) {
            s = s["inverse"]()["add"](cont[k]);
          }
          if (s["sub"](thisABS)["abs"]().valueOf() < eps) {
            return s["mul"](this["s"]);
          }
        }
        return this;
      },
      "divisible": function(a2, b) {
        parse(a2, b);
        return !(!(P["n"] * this["d"]) || this["n"] * P["d"] % (P["n"] * this["d"]));
      },
      "valueOf": function() {
        return this["s"] * this["n"] / this["d"];
      },
      "toFraction": function(excludeWhole) {
        var whole, str = "";
        var n = this["n"];
        var d = this["d"];
        if (this["s"] < 0) {
          str += "-";
        }
        if (d === 1) {
          str += n;
        } else {
          if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
            str += whole;
            str += " ";
            n %= d;
          }
          str += n;
          str += "/";
          str += d;
        }
        return str;
      },
      "toLatex": function(excludeWhole) {
        var whole, str = "";
        var n = this["n"];
        var d = this["d"];
        if (this["s"] < 0) {
          str += "-";
        }
        if (d === 1) {
          str += n;
        } else {
          if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
            str += whole;
            n %= d;
          }
          str += "\\frac{";
          str += n;
          str += "}{";
          str += d;
          str += "}";
        }
        return str;
      },
      "toContinued": function() {
        var t;
        var a2 = this["n"];
        var b = this["d"];
        var res = [];
        if (isNaN(a2) || isNaN(b)) {
          return res;
        }
        do {
          res.push(Math.floor(a2 / b));
          t = a2 % b;
          a2 = b;
          b = t;
        } while (a2 !== 1);
        return res;
      },
      "toString": function(dec) {
        var N = this["n"];
        var D = this["d"];
        if (isNaN(N) || isNaN(D)) {
          return "NaN";
        }
        dec = dec || 15;
        var cycLen = cycleLen(N, D);
        var cycOff = cycleStart(N, D, cycLen);
        var str = this["s"] < 0 ? "-" : "";
        str += N / D | 0;
        N %= D;
        N *= 10;
        if (N)
          str += ".";
        if (cycLen) {
          for (var i = cycOff; i--; ) {
            str += N / D | 0;
            N %= D;
            N *= 10;
          }
          str += "(";
          for (var i = cycLen; i--; ) {
            str += N / D | 0;
            N %= D;
            N *= 10;
          }
          str += ")";
        } else {
          for (var i = dec; N && i--; ) {
            str += N / D | 0;
            N %= D;
            N *= 10;
          }
        }
        return str;
      }
    };
    {
      Object.defineProperty(Fraction2, "__esModule", { "value": true });
      Fraction2["default"] = Fraction2;
      Fraction2["Fraction"] = Fraction2;
      module2["exports"] = Fraction2;
    }
  })();
})(fraction$1);
const Fraction = /* @__PURE__ */ getDefaultExportFromCjs(fraction$1.exports);
Fraction.prototype.sam = function() {
  return this.floor();
};
Fraction.prototype.nextSam = function() {
  return this.sam().add(1);
};
Fraction.prototype.wholeCycle = function() {
  return new TimeSpan(this.sam(), this.nextSam());
};
Fraction.prototype.cyclePos = function() {
  return this.sub(this.sam());
};
Fraction.prototype.lt = function(other) {
  return this.compare(other) < 0;
};
Fraction.prototype.gt = function(other) {
  return this.compare(other) > 0;
};
Fraction.prototype.lte = function(other) {
  return this.compare(other) <= 0;
};
Fraction.prototype.gte = function(other) {
  return this.compare(other) >= 0;
};
Fraction.prototype.eq = function(other) {
  return this.compare(other) == 0;
};
Fraction.prototype.max = function(other) {
  return this.gt(other) ? this : other;
};
Fraction.prototype.min = function(other) {
  return this.lt(other) ? this : other;
};
Fraction.prototype.show = function() {
  return this.s * this.n + "/" + this.d;
};
Fraction.prototype.or = function(other) {
  return this.eq(0) ? other : this;
};
const fraction = (n) => {
  return Fraction(n);
};
const gcd = (...fractions) => {
  return fractions.reduce((gcd2, fraction2) => gcd2.gcd(fraction2), fraction(1));
};
fraction._original = Fraction;
class TimeSpan {
  constructor(begin, end) {
    this.begin = fraction(begin);
    this.end = fraction(end);
  }
  get spanCycles() {
    const spans = [];
    var begin = this.begin;
    const end = this.end;
    const end_sam = end.sam();
    if (begin.equals(end)) {
      return [new TimeSpan(begin, end)];
    }
    while (end.gt(begin)) {
      if (begin.sam().equals(end_sam)) {
        spans.push(new TimeSpan(begin, this.end));
        break;
      }
      const next_begin = begin.nextSam();
      spans.push(new TimeSpan(begin, next_begin));
      begin = next_begin;
    }
    return spans;
  }
  get duration() {
    return this.end.sub(this.begin);
  }
  cycleArc() {
    const b = this.begin.cyclePos();
    const e = b.add(this.duration);
    return new TimeSpan(b, e);
  }
  withTime(func_time) {
    return new TimeSpan(func_time(this.begin), func_time(this.end));
  }
  withEnd(func_time) {
    return new TimeSpan(this.begin, func_time(this.end));
  }
  withCycle(func_time) {
    const sam = this.begin.sam();
    const b = sam.add(func_time(this.begin.sub(sam)));
    const e = sam.add(func_time(this.end.sub(sam)));
    return new TimeSpan(b, e);
  }
  intersection(other) {
    const intersect_begin = this.begin.max(other.begin);
    const intersect_end = this.end.min(other.end);
    if (intersect_begin.gt(intersect_end)) {
      return void 0;
    }
    if (intersect_begin.equals(intersect_end)) {
      if (intersect_begin.equals(this.end) && this.begin.lt(this.end)) {
        return void 0;
      }
      if (intersect_begin.equals(other.end) && other.begin.lt(other.end)) {
        return void 0;
      }
    }
    return new TimeSpan(intersect_begin, intersect_end);
  }
  intersection_e(other) {
    const result = this.intersection(other);
    if (result == void 0) {
      throw "TimeSpans do not intersect";
    }
    return result;
  }
  midpoint() {
    return this.begin.add(this.duration.div(fraction(2)));
  }
  equals(other) {
    return this.begin.equals(other.begin) && this.end.equals(other.end);
  }
  show() {
    return this.begin.show() + " \u2192 " + this.end.show();
  }
}
class Hap {
  constructor(whole, part, value, context = {}, stateful = false) {
    this.whole = whole;
    this.part = part;
    this.value = value;
    this.context = context;
    this.stateful = stateful;
    if (stateful) {
      console.assert(typeof this.value === "function", "Stateful values must be functions");
    }
  }
  get duration() {
    return this.whole.end.sub(this.whole.begin);
  }
  wholeOrPart() {
    return this.whole ? this.whole : this.part;
  }
  withSpan(func) {
    const whole = this.whole ? func(this.whole) : void 0;
    return new Hap(whole, func(this.part), this.value, this.context);
  }
  withValue(func) {
    return new Hap(this.whole, this.part, func(this.value), this.context);
  }
  hasOnset() {
    return this.whole != void 0 && this.whole.begin.equals(this.part.begin);
  }
  resolveState(state) {
    if (this.stateful && this.hasOnset()) {
      console.log("stateful");
      const func = this.value;
      const [newState, newValue] = func(state);
      return [newState, new Hap(this.whole, this.part, newValue, this.context, false)];
    }
    return [state, this];
  }
  spanEquals(other) {
    return this.whole == void 0 && other.whole == void 0 || this.whole.equals(other.whole);
  }
  equals(other) {
    return this.spanEquals(other) && this.part.equals(other.part) && this.value === other.value;
  }
  show(compact = false) {
    const value = typeof this.value === "object" ? compact ? JSON.stringify(this.value).slice(1, -1).replaceAll('"', "").replaceAll(",", " ") : JSON.stringify(this.value) : this.value;
    var spans = "";
    if (this.whole == void 0) {
      spans = "~" + this.part.show;
    } else {
      var is_whole = this.whole.begin.equals(this.part.begin) && this.whole.end.equals(this.part.end);
      if (!this.whole.begin.equals(this.part.begin)) {
        spans = this.whole.begin.show() + " \u21DC ";
      }
      if (!is_whole) {
        spans += "(";
      }
      spans += this.part.show();
      if (!is_whole) {
        spans += ")";
      }
      if (!this.whole.end.equals(this.part.end)) {
        spans += " \u21DD " + this.whole.end.show();
      }
    }
    return "[ " + spans + " | " + value + " ]";
  }
  showWhole(compact = false) {
    return `${this.whole == void 0 ? "~" : this.whole.show()}: ${typeof this.value === "object" ? compact ? JSON.stringify(this.value).slice(1, -1).replaceAll('"', "").replaceAll(",", " ") : JSON.stringify(this.value) : this.value}`;
  }
  combineContext(b) {
    const a2 = this;
    return { ...a2.context, ...b.context, locations: (a2.context.locations || []).concat(b.context.locations || []) };
  }
  setContext(context) {
    return new Hap(this.whole, this.part, this.value, context);
  }
}
class State {
  constructor(span, controls2 = {}) {
    this.span = span;
    this.controls = controls2;
  }
  setSpan(span) {
    return new State(span, this.controls);
  }
  withSpan(func) {
    return this.setSpan(func(this.span));
  }
  setControls(controls2) {
    return new State(this.span, controls2);
  }
}
const isNote = (name) => /^[a-gA-G][#bs]*[0-9]?$/.test(name);
const tokenizeNote = (note) => {
  var _a;
  if (typeof note !== "string") {
    return [];
  }
  const [pc, acc = "", oct] = ((_a = note.match(/^([a-gA-G])([#bs]*)([0-9])?$/)) == null ? void 0 : _a.slice(1)) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : void 0];
};
const toMidi = (note) => {
  const [pc, acc, oct = 3] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[pc.toLowerCase()];
  const offset = (acc == null ? void 0 : acc.split("").reduce((o, char) => o + { "#": 1, b: -1, s: 1 }[char], 0)) || 0;
  return (Number(oct) + 1) * 12 + chroma + offset;
};
const freqToMidi = (freq) => {
  return 12 * Math.log(freq / 440) / Math.LN2 + 69;
};
const _mod = (n, m) => (n % m + m) % m;
const rotate = (arr, n) => arr.slice(n).concat(arr.slice(0, n));
const removeUndefineds = (xs) => xs.filter((x2) => x2 != void 0);
const flatten = (arr) => [].concat(...arr);
const id = (a2) => a2;
const listRange = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => i + min);
function curry(func, overload, arity = func.length) {
  const fn = function curried(...args) {
    if (args.length >= arity) {
      return func.apply(this, args);
    } else {
      const partial = function(...args2) {
        return curried.apply(this, args.concat(args2));
      };
      if (overload) {
        overload(partial, args);
      }
      return partial;
    }
  };
  if (overload) {
    overload(fn, []);
  }
  return fn;
}
function parseNumeral(numOrString) {
  const asNumber = Number(numOrString);
  if (!isNaN(asNumber)) {
    return asNumber;
  }
  if (isNote(numOrString)) {
    return toMidi(numOrString);
  }
  throw new Error(`cannot parse as numeral: "${numOrString}"`);
}
function mapArgs(fn, mapFn) {
  return (...args) => fn(...args.map(mapFn));
}
function numeralArgs(fn) {
  return mapArgs(fn, parseNumeral);
}
function unionWithObj(a2, b, func) {
  if (typeof (b == null ? void 0 : b.value) === "number") {
    const numKeys = Object.keys(a2).filter((k) => typeof a2[k] === "number");
    const numerals = Object.fromEntries(numKeys.map((k) => [k, b.value]));
    b = Object.assign(b, numerals);
    delete b.value;
  }
  const common = Object.keys(a2).filter((k) => Object.keys(b).includes(k));
  return Object.assign({}, a2, b, Object.fromEntries(common.map((k) => [k, func(a2[k], b[k])])));
}
curry((a2, b) => a2 * b);
curry((f, anyFunctor) => anyFunctor.map(f));
function drawLine(pat, chars = 60) {
  let cycle = 0;
  let pos = fraction(0);
  let lines = [""];
  let emptyLine = "";
  while (lines[0].length < chars) {
    const haps = pat.queryArc(cycle, cycle + 1);
    const durations = haps.filter((hap) => hap.hasOnset()).map((hap) => hap.duration);
    const charFraction = gcd(...durations);
    const totalSlots = charFraction.inverse();
    lines = lines.map((line) => line + "|");
    emptyLine += "|";
    for (let i = 0; i < totalSlots; i++) {
      const [begin, end] = [pos, pos.add(charFraction)];
      const matches = haps.filter((hap) => hap.whole.begin.lte(begin) && hap.whole.end.gte(end));
      const missingLines = matches.length - lines.length;
      if (missingLines > 0) {
        lines = lines.concat(Array(missingLines).fill(emptyLine));
      }
      lines = lines.map((line, i2) => {
        const hap = matches[i2];
        if (hap) {
          const isOnset = hap.whole.begin.eq(begin);
          const char = isOnset ? "" + hap.value : "-";
          return line + char;
        }
        return line + ".";
      });
      emptyLine += ".";
      pos = pos.add(charFraction);
    }
    cycle++;
  }
  return lines.join("\n");
}
const logKey = "strudel.log";
function logger(message, type, data = {}) {
  console.log(`%c${message}`, "background-color: black;color:white;border-radius:15px");
  if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
    document.dispatchEvent(
      new CustomEvent(logKey, {
        detail: {
          message,
          type,
          data
        }
      })
    );
  }
}
logger.key = logKey;
class Pattern {
  constructor(query) {
    __publicField(this, "_Pattern", true);
    this.query = query;
  }
  withValue(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withValue(func)));
  }
  fmap(func) {
    return this.withValue(func);
  }
  appWhole(whole_func, pat_val) {
    const pat_func = this;
    const query = function(state) {
      const hap_funcs = pat_func.query(state);
      const hap_vals = pat_val.query(state);
      const apply = function(hap_func, hap_val) {
        const s = hap_func.part.intersection(hap_val.part);
        if (s == void 0) {
          return void 0;
        }
        return new Hap(
          whole_func(hap_func.whole, hap_val.whole),
          s,
          hap_func.value(hap_val.value),
          hap_val.combineContext(hap_func)
        );
      };
      return flatten(
        hap_funcs.map((hap_func) => removeUndefineds(hap_vals.map((hap_val) => apply(hap_func, hap_val))))
      );
    };
    return new Pattern(query);
  }
  appBoth(pat_val) {
    const whole_func = function(span_a, span_b) {
      if (span_a == void 0 || span_b == void 0) {
        return void 0;
      }
      return span_a.intersection_e(span_b);
    };
    return this.appWhole(whole_func, pat_val);
  }
  appLeft(pat_val) {
    const pat_func = this;
    const query = function(state) {
      const haps = [];
      for (const hap_func of pat_func.query(state)) {
        const hap_vals = pat_val.query(state.setSpan(hap_func.wholeOrPart()));
        for (const hap_val of hap_vals) {
          const new_whole = hap_func.whole;
          const new_part = hap_func.part.intersection(hap_val.part);
          if (new_part) {
            const new_value = hap_func.value(hap_val.value);
            const new_context = hap_val.combineContext(hap_func);
            const hap = new Hap(new_whole, new_part, new_value, new_context);
            haps.push(hap);
          }
        }
      }
      return haps;
    };
    return new Pattern(query);
  }
  appRight(pat_val) {
    const pat_func = this;
    const query = function(state) {
      const haps = [];
      for (const hap_val of pat_val.query(state)) {
        const hap_funcs = pat_func.query(state.setSpan(hap_val.wholeOrPart()));
        for (const hap_func of hap_funcs) {
          const new_whole = hap_val.whole;
          const new_part = hap_func.part.intersection(hap_val.part);
          if (new_part) {
            const new_value = hap_func.value(hap_val.value);
            const new_context = hap_val.combineContext(hap_func);
            const hap = new Hap(new_whole, new_part, new_value, new_context);
            haps.push(hap);
          }
        }
      }
      return haps;
    };
    return new Pattern(query);
  }
  bindWhole(choose_whole, func) {
    const pat_val = this;
    const query = function(state) {
      const withWhole = function(a2, b) {
        return new Hap(
          choose_whole(a2.whole, b.whole),
          b.part,
          b.value,
          Object.assign({}, a2.context, b.context, {
            locations: (a2.context.locations || []).concat(b.context.locations || [])
          })
        );
      };
      const match = function(a2) {
        return func(a2.value).query(state.setSpan(a2.part)).map((b) => withWhole(a2, b));
      };
      return flatten(pat_val.query(state).map((a2) => match(a2)));
    };
    return new Pattern(query);
  }
  bind(func) {
    const whole_func = function(a2, b) {
      if (a2 == void 0 || b == void 0) {
        return void 0;
      }
      return a2.intersection_e(b);
    };
    return this.bindWhole(whole_func, func);
  }
  join() {
    return this.bind(id);
  }
  outerBind(func) {
    return this.bindWhole((a2) => a2, func);
  }
  outerJoin() {
    return this.outerBind(id);
  }
  innerBind(func) {
    return this.bindWhole((_, b) => b, func);
  }
  innerJoin() {
    return this.innerBind(id);
  }
  trigJoin(cycleZero = false) {
    const pat_of_pats = this;
    return new Pattern((state) => {
      return pat_of_pats.discreteOnly().query(state).map((outer_hap) => {
        return outer_hap.value.late(cycleZero ? outer_hap.whole.begin : outer_hap.whole.begin.cyclePos()).query(state).map(
          (inner_hap) => new Hap(
            inner_hap.whole ? inner_hap.whole.intersection(outer_hap.whole) : void 0,
            inner_hap.part.intersection(outer_hap.part),
            inner_hap.value
          ).setContext(outer_hap.combineContext(inner_hap))
        ).filter((hap) => hap.part);
      }).flat();
    });
  }
  trigzeroJoin() {
    return this.trigJoin(true);
  }
  squeezeJoin() {
    const pat_of_pats = this;
    function query(state) {
      const haps = pat_of_pats.discreteOnly().query(state);
      function flatHap(outerHap) {
        const inner_pat = outerHap.value._focusSpan(outerHap.wholeOrPart());
        const innerHaps = inner_pat.query(state.setSpan(outerHap.part));
        function munge(outer, inner) {
          let whole = void 0;
          if (inner.whole && outer.whole) {
            whole = inner.whole.intersection(outer.whole);
            if (!whole) {
              return void 0;
            }
          }
          const part = inner.part.intersection(outer.part);
          if (!part) {
            return void 0;
          }
          const context = inner.combineContext(outer);
          return new Hap(whole, part, inner.value, context);
        }
        return innerHaps.map((innerHap) => munge(outerHap, innerHap));
      }
      const result = flatten(haps.map(flatHap));
      return result.filter((x2) => x2);
    }
    return new Pattern(query);
  }
  squeezeBind(func) {
    return this.fmap(func).squeezeJoin();
  }
  queryArc(begin, end) {
    return this.query(new State(new TimeSpan(begin, end)));
  }
  splitQueries() {
    const pat = this;
    const q = (state) => {
      return flatten(state.span.spanCycles.map((subspan) => pat.query(state.setSpan(subspan))));
    };
    return new Pattern(q);
  }
  withQuerySpan(func) {
    return new Pattern((state) => this.query(state.withSpan(func)));
  }
  withQuerySpanMaybe(func) {
    const pat = this;
    return new Pattern((state) => {
      const newState = state.withSpan(func);
      if (!newState.span) {
        return [];
      }
      return pat.query(newState);
    });
  }
  withQueryTime(func) {
    return new Pattern((state) => this.query(state.withSpan((span) => span.withTime(func))));
  }
  withHapSpan(func) {
    return new Pattern((state) => this.query(state).map((hap) => hap.withSpan(func)));
  }
  withHapTime(func) {
    return this.withHapSpan((span) => span.withTime(func));
  }
  withHaps(func) {
    return new Pattern((state) => func(this.query(state)));
  }
  withHap(func) {
    return this.withHaps((haps) => haps.map(func));
  }
  setContext(context) {
    return this.withHap((hap) => hap.setContext(context));
  }
  withContext(func) {
    return this.withHap((hap) => hap.setContext(func(hap.context)));
  }
  stripContext() {
    return this.withHap((hap) => hap.setContext({}));
  }
  withLocation(start, end) {
    const location = {
      start: { line: start[0], column: start[1], offset: start[2] },
      end: { line: end[0], column: end[1], offset: end[2] }
    };
    return this.withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return { ...context, locations };
    });
  }
  withMiniLocation(start, end) {
    const offset = {
      start: { line: start[0], column: start[1], offset: start[2] },
      end: { line: end[0], column: end[1], offset: end[2] }
    };
    return this.withContext((context) => {
      let locations = context.locations || [];
      locations = locations.map(({ start: start2, end: end2 }) => {
        const colOffset = start2.line === 1 ? offset.start.column : 0;
        return {
          start: {
            ...start2,
            line: start2.line - 1 + (offset.start.line - 1) + 1,
            column: start2.column - 1 + colOffset
          },
          end: {
            ...end2,
            line: end2.line - 1 + (offset.start.line - 1) + 1,
            column: end2.column - 1 + colOffset
          }
        };
      });
      return { ...context, locations };
    });
  }
  filterHaps(hap_test) {
    return new Pattern((state) => this.query(state).filter(hap_test));
  }
  filterValues(value_test) {
    return new Pattern((state) => this.query(state).filter((hap) => value_test(hap.value)));
  }
  removeUndefineds() {
    return this.filterValues((val) => val != void 0);
  }
  onsetsOnly() {
    return this.filterHaps((hap) => hap.hasOnset());
  }
  discreteOnly() {
    return this.filterHaps((hap) => hap.whole);
  }
  defragmentHaps() {
    const pat = this.discreteOnly();
    return pat.withHaps((haps) => {
      const result = [];
      for (var i = 0; i < haps.length; ++i) {
        var searching = true;
        var a2 = haps[i];
        while (searching) {
          const a_value = JSON.stringify(haps[i].value);
          var found = false;
          for (var j = i + 1; j < haps.length; j++) {
            const b = haps[j];
            if (a2.whole.equals(b.whole)) {
              if (a2.part.begin.eq(b.part.end)) {
                if (a_value === JSON.stringify(b.value)) {
                  a2 = new Hap(a2.whole, new TimeSpan(b.part.begin, a2.part.end), a2.value);
                  haps.splice(j, 1);
                  found = true;
                  break;
                }
              } else if (b.part.begin.eq(a2.part.end)) {
                if (a_value == JSON.stringify(b.value)) {
                  a2 = new Hap(a2.whole, new TimeSpan(a2.part.begin, b.part.end), a2.value);
                  haps.splice(j, 1);
                  found = true;
                  break;
                }
              }
            }
          }
          searching = found;
        }
        result.push(a2);
      }
      return result;
    });
  }
  firstCycle(with_context = false) {
    var self = this;
    if (!with_context) {
      self = self.stripContext();
    }
    return self.query(new State(new TimeSpan(fraction(0), fraction(1))));
  }
  get firstCycleValues() {
    return this.firstCycle().map((hap) => hap.value);
  }
  get showFirstCycle() {
    return this.firstCycle().map(
      (hap) => `${hap.value}: ${hap.whole.begin.toFraction()} - ${hap.whole.end.toFraction()}`
    );
  }
  sortHapsByPart() {
    return this.withHaps(
      (haps) => haps.sort(
        (a2, b) => a2.part.begin.sub(b.part.begin).or(a2.part.end.sub(b.part.end)).or(a2.whole.begin.sub(b.whole.begin).or(a2.whole.end.sub(b.whole.end)))
      )
    );
  }
  asNumber() {
    return this.fmap(parseNumeral);
  }
  _opIn(other, func) {
    return this.fmap(func).appLeft(reify(other));
  }
  _opOut(other, func) {
    return this.fmap(func).appRight(reify(other));
  }
  _opMix(other, func) {
    return this.fmap(func).appBoth(reify(other));
  }
  _opSqueeze(other, func) {
    const otherPat = reify(other);
    return this.fmap((a2) => otherPat.fmap((b) => func(a2)(b))).squeezeJoin();
  }
  _opSqueezeOut(other, func) {
    const thisPat = this;
    const otherPat = reify(other);
    return otherPat.fmap((a2) => thisPat.fmap((b) => func(b)(a2))).squeezeJoin();
  }
  _opTrig(other, func) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a2) => func(a2)(b))).trigJoin();
  }
  _opTrigzero(other, func) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a2) => func(a2)(b))).trigzeroJoin();
  }
  layer(...funcs) {
    return stack(...funcs.map((func) => func(this)));
  }
  superimpose(...funcs) {
    return this.stack(...funcs.map((func) => func(this)));
  }
  stack(...pats) {
    return stack(this, ...pats);
  }
  sequence(...pats) {
    return sequence(this, ...pats);
  }
  seq(...pats) {
    return sequence(this, ...pats);
  }
  cat(...pats) {
    return cat(this, ...pats);
  }
  fastcat(...pats) {
    return fastcat(this, ...pats);
  }
  slowcat(...pats) {
    return slowcat(this, ...pats);
  }
  onTrigger(onTrigger, dominant = true) {
    return this.withHap(
      (hap) => hap.setContext({
        ...hap.context,
        onTrigger: (...args) => {
          if (!dominant && hap.context.onTrigger) {
            hap.context.onTrigger(...args);
          }
          onTrigger(...args);
        },
        dominantTrigger: dominant
      })
    );
  }
  log(func = (_, hap) => `[hap] ${hap.showWhole(true)}`) {
    return this.onTrigger((...args) => logger(func(...args)), false);
  }
  logValues(func = id) {
    return this.log((_, hap) => func(hap.value));
  }
  drawLine() {
    console.log(drawLine(this));
    return this;
  }
}
function groupHapsBy(eq, haps) {
  let groups = [];
  haps.forEach((hap) => {
    const match = groups.findIndex(([other]) => eq(hap, other));
    if (match === -1) {
      groups.push([hap]);
    } else {
      groups[match].push(hap);
    }
  });
  return groups;
}
const congruent = (a2, b) => a2.spanEquals(b);
Pattern.prototype.collect = function() {
  return this.withHaps(
    (haps) => groupHapsBy(congruent, haps).map((_haps) => new Hap(_haps[0].whole, _haps[0].part, _haps, {}))
  );
};
Pattern.prototype.arpWith = function(func) {
  return this.collect().fmap((v) => reify(func(v))).squeezeJoin().withHap((h2) => new Hap(h2.whole, h2.part, h2.value.value, h2.combineContext(h2.value)));
};
Pattern.prototype.arp = function(pat) {
  return this.arpWith((haps) => pat.fmap((i) => haps[i % haps.length]));
};
function _composeOp(a2, b, func) {
  function _nonFunctionObject(x2) {
    return x2 instanceof Object && !(x2 instanceof Function);
  }
  if (_nonFunctionObject(a2) || _nonFunctionObject(b)) {
    if (!_nonFunctionObject(a2)) {
      a2 = { value: a2 };
    }
    if (!_nonFunctionObject(b)) {
      b = { value: b };
    }
    return unionWithObj(a2, b, func);
  }
  return func(a2, b);
}
(function() {
  const composers = {
    set: [(a2, b) => b],
    keep: [(a2) => a2],
    keepif: [(a2, b) => b ? a2 : void 0],
    add: [numeralArgs((a2, b) => a2 + b)],
    sub: [numeralArgs((a2, b) => a2 - b)],
    mul: [numeralArgs((a2, b) => a2 * b)],
    div: [numeralArgs((a2, b) => a2 / b)],
    mod: [numeralArgs(_mod)],
    pow: [numeralArgs(Math.pow)],
    band: [numeralArgs((a2, b) => a2 & b)],
    bor: [numeralArgs((a2, b) => a2 | b)],
    bxor: [numeralArgs((a2, b) => a2 ^ b)],
    blshift: [numeralArgs((a2, b) => a2 << b)],
    brshift: [numeralArgs((a2, b) => a2 >> b)],
    lt: [(a2, b) => a2 < b],
    gt: [(a2, b) => a2 > b],
    lte: [(a2, b) => a2 <= b],
    gte: [(a2, b) => a2 >= b],
    eq: [(a2, b) => a2 == b],
    eqt: [(a2, b) => a2 === b],
    ne: [(a2, b) => a2 != b],
    net: [(a2, b) => a2 !== b],
    and: [(a2, b) => a2 && b],
    or: [(a2, b) => a2 || b],
    func: [(a2, b) => b(a2)]
  };
  const hows = ["In", "Out", "Mix", "Squeeze", "SqueezeOut", "Trig", "Trigzero"];
  for (const [what, [op, preprocess]] of Object.entries(composers)) {
    Pattern.prototype["_" + what] = function(value) {
      return this.fmap((x2) => op(x2, value));
    };
    Object.defineProperty(Pattern.prototype, what, {
      get: function() {
        const pat = this;
        const wrapper = (...other) => pat[what]["in"](...other);
        for (const how of hows) {
          wrapper[how.toLowerCase()] = function(...other) {
            var howpat = pat;
            other = sequence(other);
            if (preprocess) {
              howpat = preprocess(howpat);
              other = preprocess(other);
            }
            var result;
            if (what === "keepif") {
              result = howpat["_op" + how](other, (a2) => (b) => op(a2, b));
              result = result.removeUndefineds();
            } else {
              result = howpat["_op" + how](other, (a2) => (b) => _composeOp(a2, b, op));
            }
            return result;
          };
        }
        wrapper.squeezein = wrapper.squeeze;
        return wrapper;
      }
    });
    for (const how of hows) {
      Pattern.prototype[how.toLowerCase()] = function(...args) {
        return this.set[how.toLowerCase()](args);
      };
    }
  }
  Pattern.prototype.struct = function(...args) {
    return this.keepif.out(...args);
  };
  Pattern.prototype.structAll = function(...args) {
    return this.keep.out(...args);
  };
  Pattern.prototype.mask = function(...args) {
    return this.keepif.in(...args);
  };
  Pattern.prototype.maskAll = function(...args) {
    return this.keep.in(...args);
  };
  Pattern.prototype.reset = function(...args) {
    return this.keepif.trig(...args);
  };
  Pattern.prototype.resetAll = function(...args) {
    return this.keep.trig(...args);
  };
  Pattern.prototype.restart = function(...args) {
    return this.keepif.trigzero(...args);
  };
  Pattern.prototype.restartAll = function(...args) {
    return this.keep.trigzero(...args);
  };
})();
const polyrhythm = stack;
const pr = stack;
Pattern.prototype.factories = {
  pure,
  stack,
  slowcat,
  fastcat,
  cat,
  timeCat,
  sequence,
  seq,
  polymeter,
  pm,
  polyrhythm,
  pr
};
const silence = new Pattern(() => []);
function pure(value) {
  function query(state) {
    return state.span.spanCycles.map((subspan) => new Hap(fraction(subspan.begin).wholeCycle(), subspan, value));
  }
  return new Pattern(query);
}
function isPattern(thing) {
  const is = thing instanceof Pattern || (thing == null ? void 0 : thing._Pattern);
  return is;
}
function reify(thing) {
  if (isPattern(thing)) {
    return thing;
  }
  return pure(thing);
}
function stack(...pats) {
  pats = pats.map((pat) => Array.isArray(pat) ? sequence(...pat) : reify(pat));
  const query = (state) => flatten(pats.map((pat) => pat.query(state)));
  return new Pattern(query);
}
function slowcat(...pats) {
  pats = pats.map((pat) => Array.isArray(pat) ? sequence(...pat) : reify(pat));
  const query = function(state) {
    const span = state.span;
    const pat_n = _mod(span.begin.sam(), pats.length);
    const pat = pats[pat_n];
    if (!pat) {
      return [];
    }
    const offset = span.begin.floor().sub(span.begin.div(pats.length).floor());
    return pat.withHapTime((t) => t.add(offset)).query(state.setSpan(span.withTime((t) => t.sub(offset))));
  };
  return new Pattern(query).splitQueries();
}
function slowcatPrime(...pats) {
  pats = pats.map(reify);
  const query = function(state) {
    const pat_n = Math.floor(state.span.begin) % pats.length;
    const pat = pats[pat_n];
    return (pat == null ? void 0 : pat.query(state)) || [];
  };
  return new Pattern(query).splitQueries();
}
function fastcat(...pats) {
  return slowcat(...pats)._fast(pats.length);
}
function cat(...pats) {
  return slowcat(...pats);
}
function timeCat(...timepats) {
  const total = timepats.map((a2) => a2[0]).reduce((a2, b) => a2.add(b), fraction(0));
  let begin = fraction(0);
  const pats = [];
  for (const [time2, pat] of timepats) {
    const end = begin.add(time2);
    pats.push(reify(pat)._compress(begin.div(total), end.div(total)));
    begin = end;
  }
  return stack(...pats);
}
function sequence(...pats) {
  return fastcat(...pats);
}
function seq(...pats) {
  return fastcat(...pats);
}
function _sequenceCount(x2) {
  if (Array.isArray(x2)) {
    if (x2.length == 0) {
      return [silence, 0];
    }
    if (x2.length == 1) {
      return _sequenceCount(x2[0]);
    }
    return [fastcat(...x2.map((a2) => _sequenceCount(a2)[0])), x2.length];
  }
  return [reify(x2), 1];
}
function polymeterSteps(steps, ...args) {
  const seqs = args.map((a2) => _sequenceCount(a2));
  if (seqs.length == 0) {
    return silence;
  }
  if (steps == 0) {
    steps = seqs[0][1];
  }
  const pats = [];
  for (const seq2 of seqs) {
    if (seq2[1] == 0) {
      continue;
    }
    if (steps == seq2[1]) {
      pats.push(seq2[0]);
    } else {
      pats.push(seq2[0]._fast(fraction(steps).div(fraction(seq2[1]))));
    }
  }
  return stack(...pats);
}
function polymeter(...args) {
  return polymeterSteps(0, ...args);
}
function pm(...args) {
  polymeter(...args);
}
curry((a2, b) => reify(b).mask(a2));
curry((a2, b) => reify(b).struct(a2));
curry((a2, b) => reify(b).superimpose(...a2));
curry((a2, b) => reify(b).set(a2));
curry((a2, b) => reify(b).keep(a2));
curry((a2, b) => reify(b).keepif(a2));
curry((a2, b) => reify(b).add(a2));
curry((a2, b) => reify(b).sub(a2));
curry((a2, b) => reify(b).mul(a2));
curry((a2, b) => reify(b).div(a2));
curry((a2, b) => reify(b).mod(a2));
curry((a2, b) => reify(b).pow(a2));
curry((a2, b) => reify(b).band(a2));
curry((a2, b) => reify(b).bor(a2));
curry((a2, b) => reify(b).bxor(a2));
curry((a2, b) => reify(b).blshift(a2));
curry((a2, b) => reify(b).brshift(a2));
curry((a2, b) => reify(b).lt(a2));
curry((a2, b) => reify(b).gt(a2));
curry((a2, b) => reify(b).lte(a2));
curry((a2, b) => reify(b).gte(a2));
curry((a2, b) => reify(b).eq(a2));
curry((a2, b) => reify(b).eqt(a2));
curry((a2, b) => reify(b).ne(a2));
curry((a2, b) => reify(b).net(a2));
curry((a2, b) => reify(b).and(a2));
curry((a2, b) => reify(b).or(a2));
curry((a2, b) => reify(b).func(a2));
function register(name, func) {
  if (Array.isArray(name)) {
    const result = {};
    for (const name_item of name) {
      result[name_item] = register(name_item, func);
    }
    return result;
  }
  const arity = func.length;
  var pfunc;
  pfunc = function(...args) {
    args = args.map(reify);
    const pat = args[args.length - 1];
    if (arity === 1) {
      return func(pat);
    }
    const [left, ...right] = args.slice(0, -1);
    let mapFn = (...args2) => {
      Array(arity - 1).fill().map((_, i) => {
        var _a;
        return (_a = args2[i]) != null ? _a : void 0;
      });
      return func(...args2, pat);
    };
    mapFn = curry(mapFn, null, arity - 1);
    return right.reduce((acc, p) => acc.appLeft(p), left.fmap(mapFn)).innerJoin();
  };
  Pattern.prototype[name] = function(...args) {
    args = args.map(reify);
    if (arity === 2 && args.length !== 1) {
      args = [sequence(...args)];
    } else if (arity !== args.length + 1) {
      throw new Error(`.${name}() expects ${arity - 1} inputs but got ${args.length}.`);
    }
    return pfunc(...args, this);
  };
  if (arity > 1) {
    Pattern.prototype["_" + name] = function(...args) {
      return func(...args, this);
    };
  }
  return curry(pfunc, null, arity);
}
register("round", function(pat) {
  return pat.asNumber().fmap((v) => Math.round(v));
});
register("floor", function(pat) {
  return pat.asNumber().fmap((v) => Math.floor(v));
});
register("ceil", function(pat) {
  return pat.asNumber().fmap((v) => Math.ceil(v));
});
register("toBipolar", function(pat) {
  return pat.fmap((x2) => x2 * 2 - 1);
});
register("fromBipolar", function(pat) {
  return pat.fmap((x2) => (x2 + 1) / 2);
});
register("range", function(min, max, pat) {
  return pat.mul(max - min).add(min);
});
register("rangex", function(min, max, pat) {
  return pat._range(Math.log(min), Math.log(max)).fmap(Math.exp);
});
register("range2", function(min, max, pat) {
  return pat.fromBipolar()._range(min, max);
});
register("compress", function(b, e, pat) {
  if (b.gt(e) || b.gt(1) || e.gt(1) || b.lt(0) || e.lt(0)) {
    return silence;
  }
  return pat._fastGap(fraction(1).div(e.sub(b)))._late(b);
});
register(["compressSpan", "compressspan"], function(span, pat) {
  return pat._compress(span.begin, span.end);
});
register(["fastGap", "fastgap"], function(factor, pat) {
  const qf = function(span) {
    const cycle = span.begin.sam();
    const bpos = span.begin.sub(cycle).mul(factor).min(1);
    const epos = span.end.sub(cycle).mul(factor).min(1);
    if (bpos >= 1) {
      return void 0;
    }
    return new TimeSpan(cycle.add(bpos), cycle.add(epos));
  };
  const ef = function(hap) {
    const begin = hap.part.begin;
    const end = hap.part.end;
    const cycle = begin.sam();
    const beginPos = begin.sub(cycle).div(factor).min(1);
    const endPos = end.sub(cycle).div(factor).min(1);
    const newPart = new TimeSpan(cycle.add(beginPos), cycle.add(endPos));
    const newWhole = !hap.whole ? void 0 : new TimeSpan(
      newPart.begin.sub(begin.sub(hap.whole.begin).div(factor)),
      newPart.end.add(hap.whole.end.sub(end).div(factor))
    );
    return new Hap(newWhole, newPart, hap.value, hap.context);
  };
  return pat.withQuerySpanMaybe(qf).withHap(ef).splitQueries();
});
register("focus", function(b, e, pat) {
  return pat._fast(fraction(1).div(e.sub(b))).late(b.cyclePos());
});
register(["focusSpan", "focusspan"], function(span, pat) {
  return pat._focus(span.begin, span.end);
});
register("ply", function(factor, pat) {
  return pat.fmap((x2) => pure(x2)._fast(factor)).squeezeJoin();
});
register(["fast", "density"], function(factor, pat) {
  factor = fraction(factor);
  const fastQuery = pat.withQueryTime((t) => t.mul(factor));
  return fastQuery.withHapTime((t) => t.div(factor));
});
register(["slow", "sparsity"], function(factor, pat) {
  return pat._fast(fraction(1).div(factor));
});
register("inside", function(factor, f, pat) {
  return f(pat._slow(factor))._fast(factor);
});
register("outside", function(factor, f, pat) {
  return f(pat._fast(factor))._slow(factor);
});
register("lastOf", function(n, func, pat) {
  const pats = Array(n - 1).fill(pat);
  pats.push(func(pat));
  return slowcatPrime(...pats);
});
register(["firstOf", "every"], function(n, func, pat) {
  const pats = Array(n - 1).fill(pat);
  pats.unshift(func(pat));
  return slowcatPrime(...pats);
});
register("apply", function(func, pat) {
  return func(pat);
});
register("cpm", function(cpm, pat) {
  return pat._fast(cpm / 60);
});
register("early", function(offset, pat) {
  offset = fraction(offset);
  return pat.withQueryTime((t) => t.add(offset)).withHapTime((t) => t.sub(offset));
});
register("late", function(offset, pat) {
  offset = fraction(offset);
  return pat._early(fraction(0).sub(offset));
});
register("zoom", function(s, e, pat) {
  e = fraction(e);
  s = fraction(s);
  const d = e.sub(s);
  return pat.withQuerySpan((span) => span.withCycle((t) => t.mul(d).add(s))).withHapSpan((span) => span.withCycle((t) => t.sub(s).div(d))).splitQueries();
});
register(["zoomArc", "zoomarc"], function(a2, pat) {
  return pat.zoom(a2.begin, a2.end);
});
register("linger", function(t, pat) {
  if (t == 0) {
    return silence;
  } else if (t < 0) {
    return pat._zoom(t.add(1), 1)._slow(t);
  }
  return pat._zoom(0, t)._slow(t);
});
register("segment", function(rate, pat) {
  return pat.struct(pure(true)._fast(rate));
});
register(["invert", "inv"], function(pat) {
  return pat.fmap((x2) => !x2);
});
register("when", function(on, func, pat) {
  return on ? func(pat) : pat;
});
register("off", function(time_pat, func, pat) {
  return stack(pat, func(pat.late(time_pat)));
});
register("brak", function(pat) {
  return pat.when(slowcat(false, true), (x2) => fastcat(x2, silence)._late(0.25));
});
const rev = register("rev", function(pat) {
  const query = function(state) {
    const span = state.span;
    const cycle = span.begin.sam();
    const next_cycle = span.begin.nextSam();
    const reflect = function(to_reflect) {
      const reflected = to_reflect.withTime((time2) => cycle.add(next_cycle.sub(time2)));
      const tmp = reflected.begin;
      reflected.begin = reflected.end;
      reflected.end = tmp;
      return reflected;
    };
    const haps = pat.query(state.setSpan(reflect(span)));
    return haps.map((hap) => hap.withSpan(reflect));
  };
  return new Pattern(query).splitQueries();
});
register("hush", function(pat) {
  return silence;
});
register("palindrome", function(pat) {
  return pat.every(2, rev);
});
register(["juxBy", "juxby"], function(by, func, pat) {
  by /= 2;
  const elem_or = function(dict, key, dflt) {
    if (key in dict) {
      return dict[key];
    }
    return dflt;
  };
  const left = pat.withValue((val) => Object.assign({}, val, { pan: elem_or(val, "pan", 0.5) - by }));
  const right = pat.withValue((val) => Object.assign({}, val, { pan: elem_or(val, "pan", 0.5) + by }));
  return stack(left, func(right));
});
register("jux", function(func, pat) {
  return pat._juxBy(1, func, pat);
});
register(["stutWith", "stutwith"], function(times, time2, func, pat) {
  return stack(...listRange(0, times - 1).map((i) => func(pat.late(fraction(time2).mul(i)), i)));
});
register("stut", function(times, feedback, time2, pat) {
  return pat._stutWith(times, time2, (pat2, i) => pat2.velocity(Math.pow(feedback, i)));
});
register(["echoWith", "echowith"], function(times, time2, func, pat) {
  return stack(...listRange(0, times - 1).map((i) => func(pat.late(fraction(time2).mul(i)), i)));
});
register("echo", function(times, time2, feedback, pat) {
  return pat._echoWith(times, time2, (pat2, i) => pat2.velocity(Math.pow(feedback, i)));
});
const _iter = function(times, pat, back = false) {
  times = fraction(times);
  return slowcat(
    ...listRange(0, times.sub(1)).map(
      (i) => back ? pat.late(fraction(i).div(times)) : pat.early(fraction(i).div(times))
    )
  );
};
register("iter", function(times, pat) {
  return _iter(times, pat, false);
});
register(["iterBack", "iterback"], function(times, pat) {
  return _iter(times, pat, true);
});
const _chunk = function(n, func, pat, back = false) {
  const binary = Array(n - 1).fill(false);
  binary.unshift(true);
  const binary_pat = _iter(n, sequence(...binary), back);
  return pat.when(binary_pat, func);
};
register("chunk", function(n, func, pat) {
  return _chunk(n, func, pat, false);
});
register(["chunkBack", "chunkback"], function(n, func, pat) {
  return _chunk(n, func, pat, true);
});
register("bypass", function(on, pat) {
  on = Boolean(parseInt(on));
  return on ? silence : this;
});
register("duration", function(value, pat) {
  return pat.withHapSpan((span) => new TimeSpan(span.begin, span.begin.add(value)));
});
register(["color", "colour"], function(color, pat) {
  return pat.withContext((context) => ({ ...context, color }));
});
register("velocity", function(velocity, pat) {
  return pat.withContext((context) => ({ ...context, velocity: (context.velocity || 1) * velocity }));
});
register("legato", function(value, pat) {
  return pat.withHapSpan((span) => new TimeSpan(span.begin, span.begin.add(span.end.sub(span.begin).mul(value))));
});
register("chop", function(n, pat) {
  const slices = Array.from({ length: n }, (x2, i) => i);
  const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
  const func = function(o) {
    return sequence(slice_objects.map((slice_o) => Object.assign({}, o, slice_o)));
  };
  return pat.squeezeBind(func);
});
register("striate", function(n, pat) {
  const slices = Array.from({ length: n }, (x2, i) => i);
  const slice_objects = slices.map((i) => ({ begin: i / n, end: (i + 1) / n }));
  const slicePat = slowcat(...slice_objects);
  return pat.set(slicePat)._fast(n);
});
const _loopAt = function(factor, pat, cps = 1) {
  return pat.speed(1 / factor * cps).unit("c").slow(factor);
};
register(["loopAt", "loopat"], function(factor, pat) {
  return _loopAt(factor, pat, 1);
});
register(["loopAtCps", "loopatcps"], function(factor, cps, pat) {
  return _loopAt(factor, pat, cps);
});
const controls = {};
const generic_params = [
  ["s", "s", "sound"],
  ["f", "n", "The note or sample number to choose for a synth or sampleset"],
  ["f", "note", "The note or pitch to play a sound or synth with"],
  ["f", "accelerate", "a pattern of numbers that speed up (or slow down) samples while they play."],
  [
    "f",
    "gain",
    "a pattern of numbers that specify volume. Values less than 1 make the sound quieter. Values greater than 1 make the sound louder. For the linear equivalent, see @amp@."
  ],
  ["f", "amp", "like @gain@, but linear."],
  [
    "f",
    "attack",
    "a pattern of numbers to specify the attack time (in seconds) of an envelope applied to each sample."
  ],
  ["f", "bank", "selects sound bank to use"],
  ["f", "decay", ""],
  ["f", "sustain", ""],
  [
    "f",
    "release",
    "a pattern of numbers to specify the release time (in seconds) of an envelope applied to each sample."
  ],
  [
    "f",
    "hold",
    "a pattern of numbers to specify the hold time (in seconds) of an envelope applied to each sample. Only takes effect if `attack` and `release` are also specified."
  ],
  ["f", "bandf", "A pattern of numbers from 0 to 1. Sets the center frequency of the band-pass filter."],
  ["f", "bandq", "a pattern of anumbers from 0 to 1. Sets the q-factor of the band-pass filter."],
  [
    "f",
    "begin",
    "a pattern of numbers from 0 to 1. Skips the beginning of each sample, e.g. `0.25` to cut off the first quarter from each sample."
  ],
  [
    "f",
    "end",
    "the same as `begin`, but cuts the end off samples, shortening them; e.g. `0.75` to cut off the last quarter of each sample."
  ],
  ["f", "loop", "loops the sample (from `begin` to `end`) the specified number of times."],
  [
    "f",
    "crush",
    "bit crushing, a pattern of numbers from 1 (for drastic reduction in bit-depth) to 16 (for barely no reduction)."
  ],
  [
    "f",
    "coarse",
    "fake-resampling, a pattern of numbers for lowering the sample rate, i.e. 1 for original 2 for half, 3 for a third and so on."
  ],
  ["i", "channel", "choose the channel the pattern is sent to in superdirt"],
  [
    "i",
    "cut",
    "In the style of classic drum-machines, `cut` will stop a playing sample as soon as another samples with in same cutgroup is to be played. An example would be an open hi-hat followed by a closed one, essentially muting the open."
  ],
  ["f", "cutoff", "a pattern of numbers from 0 to 1. Applies the cutoff frequency of the low-pass filter."],
  [
    "f",
    "hcutoff",
    "a pattern of numbers from 0 to 1. Applies the cutoff frequency of the high-pass filter. Also has alias @hpf@"
  ],
  [
    "f",
    "hresonance",
    "a pattern of numbers from 0 to 1. Applies the resonance of the high-pass filter. Has alias @hpq@"
  ],
  ["f", "resonance", "a pattern of numbers from 0 to 1. Specifies the resonance of the low-pass filter."],
  ["f", "djf", "DJ filter, below 0.5 is low pass filter, above is high pass filter."],
  ["f", "delay", "a pattern of numbers from 0 to 1. Sets the level of the delay signal."],
  ["f", "delayfeedback", "a pattern of numbers from 0 to 1. Sets the amount of delay feedback."],
  ["f", "delaytime", "a pattern of numbers from 0 to 1. Sets the length of the delay."],
  [
    "f",
    "lock",
    "A pattern of numbers. Specifies whether delaytime is calculated relative to cps. When set to 1, delaytime is a direct multiple of a cycle."
  ],
  ["f", "detune", ""],
  [
    "f",
    "dry",
    "when set to `1` will disable all reverb for this pattern. See `room` and `size` for more information about reverb."
  ],
  [
    "f",
    "fadeTime",
    "Used when using begin/end or chop/striate and friends, to change the fade out time of the 'grain' envelope."
  ],
  [
    "f",
    "fadeInTime",
    "As with fadeTime, but controls the fade in time of the grain envelope. Not used if the grain begins at position 0 in the sample."
  ],
  ["f", "freq", ""],
  ["f", "gate", ""],
  ["f", "leslie", ""],
  ["f", "lrate", ""],
  ["f", "lsize", ""],
  ["f", "degree", ""],
  ["f", "mtranspose", ""],
  ["f", "ctranspose", ""],
  ["f", "harmonic", ""],
  ["f", "stepsPerOctave", ""],
  ["f", "octaveR", ""],
  [
    "f",
    "nudge",
    "Nudges events into the future by the specified number of seconds. Negative numbers work up to a point as well (due to internal latency)"
  ],
  ["i", "octave", ""],
  ["f", "offset", ""],
  [
    "i",
    "orbit",
    "a pattern of numbers. An `orbit` is a global parameter context for patterns. Patterns with the same orbit will share hardware output bus offset and global effects, e.g. reverb and delay. The maximum number of orbits is specified in the superdirt startup, numbers higher than maximum will wrap around."
  ],
  ["f", "overgain", ""],
  ["f", "overshape", ""],
  [
    "f",
    "pan",
    "a pattern of numbers between 0 and 1, from left to right (assuming stereo), once round a circle (assuming multichannel)"
  ],
  [
    "f",
    "panspan",
    "a pattern of numbers between -inf and inf, which controls how much multichannel output is fanned out (negative is backwards ordering)"
  ],
  [
    "f",
    "pansplay",
    "a pattern of numbers between 0.0 and 1.0, which controls the multichannel spread range (multichannel only)"
  ],
  [
    "f",
    "panwidth",
    "a pattern of numbers between 0.0 and inf, which controls how much each channel is distributed over neighbours (multichannel only)"
  ],
  [
    "f",
    "panorient",
    "a pattern of numbers between -1.0 and 1.0, which controls the relative position of the centre pan in a pair of adjacent speakers (multichannel only)"
  ],
  ["f", "rate", "used in SuperDirt softsynths as a control rate or 'speed'"],
  ["f", "slide", ""],
  ["f", "semitone", ""],
  ["f", "voice", ""],
  ["f", "room", "a pattern of numbers from 0 to 1. Sets the level of reverb."],
  [
    "f",
    "size",
    "a pattern of numbers from 0 to 1. Sets the perceptual size (reverb time) of the `room` to be used in reverb."
  ],
  [
    "f",
    "roomsize",
    "a pattern of numbers from 0 to 1. Sets the perceptual size (reverb time) of the `room` to be used in reverb."
  ],
  [
    "f",
    "shape",
    "wave shaping distortion, a pattern of numbers from 0 for no distortion up to 1 for loads of distortion."
  ],
  [
    "f",
    "speed",
    "a pattern of numbers which changes the speed of sample playback, i.e. a cheap way of changing pitch. Negative values will play the sample backwards!"
  ],
  [
    "s",
    "unit",
    'used in conjunction with `speed`, accepts values of "r" (rate, default behavior), "c" (cycles), or "s" (seconds). Using `unit "c"` means `speed` will be interpreted in units of cycles, e.g. `speed "1"` means samples will be stretched to fill a cycle. Using `unit "s"` means the playback speed will be adjusted so that the duration is the number of seconds specified by `speed`.'
  ],
  ["f", "squiz", ""],
  ["f", "stutterdepth", ""],
  ["f", "stuttertime", ""],
  ["f", "timescale", ""],
  ["f", "timescalewin", ""],
  [
    "s",
    "vowel",
    "formant filter to make things sound like vowels, a pattern of either `a`, `e`, `i`, `o` or `u`. Use a rest (`~`) for no effect."
  ],
  ["f", "waveloss", ""],
  ["f", "dur", ""],
  ["f", "expression", ""],
  ["f", "sustainpedal", ""],
  ["f", "tremolodepth", "Tremolo Audio DSP effect | params are 'tremolorate' and 'tremolodepth'"],
  ["f", "tremolorate", "Tremolo Audio DSP effect | params are 'tremolorate' and 'tremolodepth'"],
  ["f", "phaserdepth", "Phaser Audio DSP effect | params are 'phaserrate' and 'phaserdepth'"],
  ["f", "phaserrate", "Phaser Audio DSP effect | params are 'phaserrate' and 'phaserdepth'"],
  ["f", "fshift", "frequency shifter"],
  ["f", "fshiftnote", "frequency shifter"],
  ["f", "fshiftphase", "frequency shifter"],
  ["f", "triode", "tube distortion"],
  ["f", "krush", "shape/bass enhancer"],
  ["f", "kcutoff", ""],
  ["f", "octer", "octaver effect"],
  ["f", "octersub", "octaver effect"],
  ["f", "octersubsub", "octaver effect"],
  ["f", "ring", "ring modulation"],
  ["f", "ringf", "ring modulation"],
  ["f", "ringdf", "ring modulation"],
  ["f", "distort", "noisy fuzzy distortion"],
  ["f", "freeze", "Spectral freeze"],
  ["f", "xsdelay", ""],
  ["f", "tsdelay", ""],
  ["f", "real", "Spectral conform"],
  ["f", "imag", ""],
  ["f", "enhance", "Spectral enhance"],
  ["f", "partials", ""],
  ["f", "comb", "Spectral comb"],
  ["f", "smear", "Spectral smear"],
  ["f", "scram", "Spectral scramble"],
  ["f", "binshift", "Spectral binshift"],
  ["f", "hbrick", "High pass sort of spectral filter"],
  ["f", "lbrick", "Low pass sort of spectral filter"],
  ["f", "midichan", ""],
  ["f", "control", ""],
  ["f", "ccn", ""],
  ["f", "ccv", ""],
  ["f", "polyTouch", ""],
  ["f", "midibend", ""],
  ["f", "miditouch", ""],
  ["f", "ctlNum", ""],
  ["f", "frameRate", ""],
  ["f", "frames", ""],
  ["f", "hours", ""],
  ["s", "midicmd", ""],
  ["f", "minutes", ""],
  ["f", "progNum", ""],
  ["f", "seconds", ""],
  ["f", "songPtr", ""],
  ["f", "uid", ""],
  ["f", "val", ""],
  ["f", "cps", ""],
  ["f", "clip", ""]
];
const _name = (name, ...pats) => sequence(...pats).withValue((x2) => ({ [name]: x2 }));
const _setter = (func, name) => function(...pats) {
  if (!pats.length) {
    return this.fmap((value) => ({ [name]: value }));
  }
  return this.set(func(...pats));
};
generic_params.forEach(([type, name, description]) => {
  controls[name] = (...pats) => _name(name, ...pats);
  Pattern.prototype[name] = _setter(controls[name], name);
});
controls.createParam = (name) => {
  const func = (...pats) => _name(name, ...pats);
  Pattern.prototype[name] = _setter(func, name);
  return (...pats) => _name(name, ...pats);
};
controls.createParams = (...names) => names.reduce((acc, name) => Object.assign(acc, { [name]: controls.createParam(name) }), {});
function bjorklund(slots, pulses) {
  var pattern = [], count = [], remainder = [pulses], divisor = slots - pulses, level = 0, build_pattern = function(lv) {
    if (lv == -1) {
      pattern.push(0);
    } else if (lv == -2) {
      pattern.push(1);
    } else {
      for (var x2 = 0; x2 < count[lv]; x2++) {
        build_pattern(lv - 1);
      }
      if (remainder[lv]) {
        build_pattern(lv - 2);
      }
    }
  };
  while (remainder[level] > 1) {
    count.push(Math.floor(divisor / remainder[level]));
    remainder.push(divisor % remainder[level]);
    divisor = remainder[level];
    level++;
  }
  count.push(divisor);
  build_pattern(level);
  return pattern.reverse();
}
var bjork = function(m, k) {
  if (m > k)
    return bjorklund(m, k);
  else
    return bjorklund(k, m);
};
const _euclidRot = function(pulses, steps, rotation) {
  const b = bjork(steps, pulses);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};
register("euclid", function(pulses, steps, pat) {
  return pat.struct(_euclidRot(steps, pulses, 0));
});
register(["euclidrot", "euclidRot"], function(pulses, steps, rotation, pat) {
  return pat.struct(_euclidRot(steps, pulses, rotation));
});
const _euclidLegato = function(pulses, steps, rotation, pat) {
  const bin_pat = _euclidRot(pulses, steps, rotation);
  const firstOne = bin_pat.indexOf(1);
  const gapless = rotate(bin_pat, firstOne).join("").split("1").slice(1).map((s) => [s.length + 1, true]);
  return pat.struct(timeCat(...gapless)).late(fraction(firstOne).div(steps));
};
register(["euclidLegato"], function(pulses, steps, pat) {
  return _euclidLegato(pulses, steps, 0, pat);
});
register(["euclidLegatoRot"], function(pulses, steps, rotation, pat) {
  return _euclidLegato(pulses, steps, rotation, pat);
});
const signal = (func) => {
  const query = (state) => [new Hap(void 0, state.span, func(state.span.midpoint()))];
  return new Pattern(query);
};
const isaw = signal((t) => 1 - t % 1);
const isaw2 = isaw.toBipolar();
const saw = signal((t) => t % 1);
const saw2 = saw.toBipolar();
const sine2 = signal((t) => Math.sin(Math.PI * 2 * t));
const sine = sine2.fromBipolar();
sine._early(fraction(1).div(4));
sine2._early(fraction(1).div(4));
const square = signal((t) => Math.floor(t * 2 % 2));
square.toBipolar();
fastcat(isaw, saw);
fastcat(isaw2, saw2);
const time = signal(id);
const xorwise = (x2) => {
  const a2 = x2 << 13 ^ x2;
  const b = a2 >> 17 ^ a2;
  return b << 5 ^ b;
};
const _frac = (x2) => x2 - Math.trunc(x2);
const timeToIntSeed = (x2) => xorwise(Math.trunc(_frac(x2 / 300) * 536870912));
const intSeedToRand = (x2) => x2 % 536870912 / 536870912;
const timeToRand = (x2) => Math.abs(intSeedToRand(timeToIntSeed(x2)));
const rand = signal(timeToRand);
rand.toBipolar();
const _brandBy = (p) => rand.fmap((x2) => x2 < p);
_brandBy(0.5);
const __chooseWith = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }
  return pat.range(0, xs.length).fmap((i) => xs[Math.floor(i)]);
};
const chooseWith = (pat, xs) => {
  return __chooseWith(pat, xs).outerJoin();
};
const chooseInWith = (pat, xs) => {
  return __chooseWith(pat, xs).innerJoin();
};
Pattern.prototype.choose = function(...xs) {
  return chooseWith(this, xs);
};
Pattern.prototype.choose2 = function(...xs) {
  return chooseWith(this.fromBipolar(), xs);
};
const chooseCycles = (...xs) => chooseInWith(rand.segment(1), xs);
const perlinWith = (pat) => {
  const pata = pat.fmap(Math.floor);
  const patb = pat.fmap((t) => Math.floor(t) + 1);
  const smootherStep = (x2) => 6 * x2 ** 5 - 15 * x2 ** 4 + 10 * x2 ** 3;
  const interp = (x2) => (a2) => (b) => a2 + smootherStep(x2) * (b - a2);
  return pat.sub(pata).fmap(interp).appBoth(pata.fmap(timeToRand)).appBoth(patb.fmap(timeToRand));
};
perlinWith(time.fmap((v) => Number(v)));
register(
  "degradeByWith",
  (withPat, x2, pat) => pat.fmap((a2) => (_) => a2).appLeft(withPat.filterValues((v) => v > x2))
);
register("degradeBy", function(x2, pat) {
  return pat._degradeByWith(rand, x2);
});
register("degrade", (pat) => pat._degradeBy(0.5));
register("undegradeBy", function(x2, pat) {
  return pat._degradeByWith(
    rand.fmap((r2) => 1 - r2),
    x2
  );
});
register("undegrade", (pat) => pat._undegradeBy(0.5));
register("sometimesBy", function(patx, func, pat) {
  return reify(patx).fmap((x2) => stack(pat._degradeBy(x2), func(pat._undegradeBy(1 - x2)))).innerJoin();
});
register("sometimes", function(func, pat) {
  return pat._sometimesBy(0.5, func);
});
register("someCyclesBy", function(patx, func, pat) {
  return reify(patx).fmap(
    (x2) => stack(
      pat._degradeByWith(rand._segment(1), x2),
      func(pat._degradeByWith(rand.fmap((r2) => 1 - r2)._segment(1), 1 - x2))
    )
  ).innerJoin();
});
register("someCycles", function(func, pat) {
  return pat._someCyclesBy(0.5, func);
});
register("often", function(func, pat) {
  return pat.sometimesBy(0.75, func);
});
register("rarely", function(func, pat) {
  return pat.sometimesBy(0.25, func);
});
register("almostNever", function(func, pat) {
  return pat.sometimesBy(0.1, func);
});
register("almostAlways", function(func, pat) {
  return pat.sometimesBy(0.9, func);
});
register("never", function(_, pat) {
  return pat;
});
register("always", function(func, pat) {
  return func(pat);
});
let synth;
try {
  synth = window == null ? void 0 : window.speechSynthesis;
} catch (err) {
  console.warn("cannot use window: not in browser?");
}
let allVoices = synth == null ? void 0 : synth.getVoices();
function triggerSpeech(words, lang, voice) {
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.lang = lang;
  allVoices = synth.getVoices();
  const voices = allVoices.filter((v) => v.lang.includes(lang));
  if (typeof voice === "number") {
    utterance.voice = voices[voice % voices.length];
  } else if (typeof voice === "string") {
    utterance.voice = voices.find((voice2) => voice2.name === voice2);
  }
  speechSynthesis.speak(utterance);
}
register("speak", function(lang, voice, pat) {
  return pat.onTrigger((_, hap) => {
    triggerSpeech(hap.value, lang, voice);
  });
});
function getTime() {
  {
    throw new Error("no time set! use setTime to define a time source");
  }
}
const getDrawContext = (id2 = "test-canvas") => {
  let canvas = document.querySelector("#" + id2);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = id2;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style = "pointer-events:none;width:100%;height:100%;position:fixed;top:0;left:0;z-index:5";
    document.body.prepend(canvas);
  }
  return canvas.getContext("2d");
};
Pattern.prototype.draw = function(callback, { from, to, onQuery }) {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const ctx = getDrawContext();
  let cycle, events = [];
  const animate = (time2) => {
    const t = getTime();
    if (from !== void 0 && to !== void 0) {
      const currentCycle = Math.floor(t);
      if (cycle !== currentCycle) {
        cycle = currentCycle;
        const begin = currentCycle + from;
        const end = currentCycle + to;
        setTimeout(() => {
          events = this.query(new State(new TimeSpan(begin, end))).filter(Boolean).filter((event) => event.part.begin.equals(event.whole.begin));
          onQuery == null ? void 0 : onQuery(events);
        }, 0);
      }
    }
    callback(ctx, events, t, time2);
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  return this;
};
const { createParams } = controls;
let clearColor = "#22222210";
Pattern.prototype.animate = function({ callback, sync = false, smear: smear2 = 0.5 } = {}) {
  window.frame && cancelAnimationFrame(window.frame);
  const ctx = getDrawContext();
  const { clientWidth: ww, clientHeight: wh } = ctx.canvas;
  let smearPart = smear2 === 0 ? "99" : Number((1 - smear2) * 100).toFixed(0);
  smearPart = smearPart.length === 1 ? `0${smearPart}` : smearPart;
  clearColor = `#200010${smearPart}`;
  const render = (t) => {
    let frame;
    t = Math.round(t);
    frame = this.slow(1e3).queryArc(t, t);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, ww, wh);
    frame.forEach((f) => {
      let { x: x2, y: y2, w: w2, h: h2, s, r: r2, a: a2 = 0, fill: fill2 = "darkseagreen" } = f.value;
      w2 *= ww;
      h2 *= wh;
      if (r2 !== void 0 && a2 !== void 0) {
        const radians = a2 * 2 * Math.PI;
        const [cx, cy] = [(ww - w2) / 2, (wh - h2) / 2];
        x2 = cx + Math.cos(radians) * r2 * cx;
        y2 = cy + Math.sin(radians) * r2 * cy;
      } else {
        x2 *= ww - w2;
        y2 *= wh - h2;
      }
      const val = { ...f.value, x: x2, y: y2, w: w2, h: h2 };
      ctx.fillStyle = fill2;
      if (s === "rect") {
        ctx.fillRect(x2, y2, w2, h2);
      } else if (s === "ellipse") {
        ctx.beginPath();
        ctx.ellipse(x2 + w2 / 2, y2 + h2 / 2, w2 / 2, h2 / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
      callback && callback(ctx, val, f);
    });
    window.frame = requestAnimationFrame(render);
  };
  window.frame = requestAnimationFrame(render);
  return silence;
};
const { x, y, w, h: h$1, a, r, fill, smear } = createParams("x", "y", "w", "h", "a", "r", "fill", "smear");
register("rescale", function(f, pat) {
  return pat.mul(x(f).w(f).y(f).h(f));
});
register("moveXY", function(dx, dy, pat) {
  return pat.add(x(dx).y(dy));
});
register("zoomIn", function(f, pat) {
  const d = pure(1).sub(f).div(2);
  return pat.rescale(f).move(d, d);
});
const scale = (normalized, min, max) => normalized * (max - min) + min;
const getValue = (e) => {
  let { value } = e;
  if (typeof e.value !== "object") {
    value = { value };
  }
  let { note, n, freq, s } = value;
  if (freq) {
    return freqToMidi(freq);
  }
  note = note != null ? note : n;
  if (typeof note === "string") {
    return toMidi(note);
  }
  if (typeof note === "number") {
    return note;
  }
  if (s) {
    return "_" + s;
  }
  return value;
};
Pattern.prototype.pianoroll = function({
  cycles = 4,
  playhead = 0.5,
  overscan = 1,
  flipTime = 0,
  flipValues = 0,
  hideNegative = false,
  inactive = "#7491D2",
  active = "#FFCA28",
  background = "transparent",
  smear: smear2 = 0,
  playheadColor = "white",
  minMidi = 10,
  maxMidi = 90,
  autorange = 0,
  timeframe: timeframeProp,
  fold = 0,
  vertical = 0
} = {}) {
  const ctx = getDrawContext();
  const w2 = ctx.canvas.width;
  const h2 = ctx.canvas.height;
  let from = -cycles * playhead;
  let to = cycles * (1 - playhead);
  if (timeframeProp) {
    console.warn("timeframe is deprecated! use from/to instead");
    from = 0;
    to = timeframeProp;
  }
  const timeAxis = vertical ? h2 : w2;
  const valueAxis = vertical ? w2 : h2;
  let timeRange = vertical ? [timeAxis, 0] : [0, timeAxis];
  const timeExtent = to - from;
  const valueRange = vertical ? [0, valueAxis] : [valueAxis, 0];
  let valueExtent = maxMidi - minMidi + 1;
  let barThickness = valueAxis / valueExtent;
  let foldValues = [];
  flipTime && timeRange.reverse();
  flipValues && valueRange.reverse();
  this.draw(
    (ctx2, events, t) => {
      ctx2.fillStyle = background;
      ctx2.globalAlpha = 1;
      if (!smear2) {
        ctx2.clearRect(0, 0, w2, h2);
        ctx2.fillRect(0, 0, w2, h2);
      }
      const inFrame = (event) => (!hideNegative || event.whole.begin >= 0) && event.whole.begin <= t + to && event.whole.end >= t + from;
      events.filter(inFrame).forEach((event) => {
        var _a, _b, _c;
        const isActive = event.whole.begin <= t && event.whole.end > t;
        ctx2.fillStyle = ((_a = event.context) == null ? void 0 : _a.color) || inactive;
        ctx2.strokeStyle = ((_b = event.context) == null ? void 0 : _b.color) || active;
        ctx2.globalAlpha = (_c = event.context.velocity) != null ? _c : 1;
        const timePx = scale((event.whole.begin - (flipTime ? to : from)) / timeExtent, ...timeRange);
        let durationPx = scale(event.duration / timeExtent, 0, timeAxis);
        const value = getValue(event);
        const valuePx = scale(
          fold ? foldValues.indexOf(value) / foldValues.length : (Number(value) - minMidi) / valueExtent,
          ...valueRange
        );
        let margin = 0;
        const offset = scale(t / timeExtent, ...timeRange);
        let coords;
        if (vertical) {
          coords = [
            valuePx + 1 - (flipValues ? barThickness : 0),
            timeAxis - offset + timePx + margin + 1 - (flipTime ? 0 : durationPx),
            barThickness - 2,
            durationPx - 2
          ];
        } else {
          coords = [
            timePx - offset + margin + 1 - (flipTime ? durationPx : 0),
            valuePx + 1 - (flipValues ? 0 : barThickness),
            durationPx - 2,
            barThickness - 2
          ];
        }
        isActive ? ctx2.strokeRect(...coords) : ctx2.fillRect(...coords);
      });
      ctx2.globalAlpha = 1;
      const playheadPosition = scale(-from / timeExtent, ...timeRange);
      ctx2.strokeStyle = playheadColor;
      ctx2.beginPath();
      if (vertical) {
        ctx2.moveTo(0, playheadPosition);
        ctx2.lineTo(valueAxis, playheadPosition);
      } else {
        ctx2.moveTo(playheadPosition, 0);
        ctx2.lineTo(playheadPosition, valueAxis);
      }
      ctx2.stroke();
    },
    {
      from: from - overscan,
      to: to + overscan,
      onQuery: (events) => {
        const { min, max, values } = events.reduce(
          ({ min: min2, max: max2, values: values2 }, e) => {
            const v = getValue(e);
            return {
              min: v < min2 ? v : min2,
              max: v > max2 ? v : max2,
              values: values2.includes(v) ? values2 : [...values2, v]
            };
          },
          { min: Infinity, max: -Infinity, values: [] }
        );
        if (autorange) {
          minMidi = min;
          maxMidi = max;
          valueExtent = maxMidi - minMidi + 1;
        }
        foldValues = values.sort((a2, b) => String(a2).localeCompare(String(b)));
        barThickness = fold ? valueAxis / foldValues.length : valueAxis / valueExtent;
      }
    }
  );
  return this;
};
logger("\u{1F300} @strudel.cycles/core loaded \u{1F300}");
if (globalThis._strudelLoaded) {
  console.warn(
    `@strudel.cycles/core was loaded more than once...
This might happen when you have multiple versions of strudel installed. 
Please check with "npm ls @strudel.cycles/core".`
  );
}
globalThis._strudelLoaded = true;
const applyOptions = (parent, code) => (pat, i) => {
  const ast = parent.source_[i];
  const options = ast.options_;
  const operator = options == null ? void 0 : options.operator;
  if (operator) {
    switch (operator.type_) {
      case "stretch": {
        const legalTypes = ["fast", "slow"];
        const { type, amount } = operator.arguments_;
        if (!legalTypes.includes(type)) {
          throw new Error(`mini: stretch: type must be one of ${legalTypes.join("|")} but got ${type}`);
        }
        return reify(pat)[type](patternifyAST(amount, code));
      }
      case "bjorklund":
        if (operator.arguments_.rotation) {
          const p1 = patternifyAST(operator.arguments_.pulse, code), p2 = patternifyAST(operator.arguments_.step, code), p3 = patternifyAST(operator.arguments_.rotation, code);
          p1.ast = operator.arguments_.pulse;
          p2.ast = operator.arguments_.step;
          p3.ast = operator.arguments_.rotation;
          return pat.euclidRot(p1, p2, p3);
        } else {
          const p1 = patternifyAST(operator.arguments_.pulse, code), p2 = patternifyAST(operator.arguments_.step, code);
          p1.ast = operator.arguments_.pulse;
          p2.ast = operator.arguments_.step;
          return pat.euclid(p1, p2);
        }
      case "degradeBy":
        return reify(pat).degradeBy(operator.arguments_.amount === null ? 0.5 : operator.arguments_.amount);
    }
    console.warn(`operator "${operator.type_}" not implemented`);
  }
  if (options == null ? void 0 : options.weight) {
    return pat;
  }
  const unimplemented = Object.keys(options || {}).filter((key) => key !== "operator");
  if (unimplemented.length) {
    console.warn(
      `option${unimplemented.length > 1 ? "s" : ""} ${unimplemented.map((o) => `"${o}"`).join(", ")} not implemented`
    );
  }
  return pat;
};
function resolveReplications(ast) {
  ast.source_ = flatten(
    ast.source_.map((child) => {
      const { replicate, ...options } = child.options_ || {};
      if (!replicate) {
        return [child];
      }
      delete child.options_.replicate;
      return Array(replicate).fill(child);
    })
  );
}
function patternifyAST(ast, code) {
  switch (ast.type_) {
    case "pattern": {
      resolveReplications(ast);
      const children = ast.source_.map((child) => patternifyAST(child, code)).map(applyOptions(ast, code));
      const alignment = ast.arguments_.alignment;
      if (alignment === "stack") {
        return stack(...children);
      }
      if (alignment === "polymeter") {
        const stepsPerCycle = ast.arguments_.stepsPerCycle ? patternifyAST(ast.arguments_.stepsPerCycle, code).fmap((x2) => fraction(x2)) : pure(fraction(children.length > 0 ? children[0].__weight : 1));
        const aligned = children.map((child) => child.fast(stepsPerCycle.fmap((x2) => x2.div(child.__weight || 1))));
        return stack(...aligned);
      }
      if (alignment === "rand") {
        return chooseCycles(...children);
      }
      const weightedChildren = ast.source_.some((child) => {
        var _a;
        return !!((_a = child.options_) == null ? void 0 : _a.weight);
      });
      if (!weightedChildren && alignment === "slowcat") {
        return slowcat(...children);
      }
      if (weightedChildren) {
        const weightSum = ast.source_.reduce((sum, child) => {
          var _a;
          return sum + (((_a = child.options_) == null ? void 0 : _a.weight) || 1);
        }, 0);
        const pat2 = timeCat(...ast.source_.map((child, i) => {
          var _a;
          return [((_a = child.options_) == null ? void 0 : _a.weight) || 1, children[i]];
        }));
        if (alignment === "slowcat") {
          return pat2._slow(weightSum);
        }
        pat2.__weight = weightSum;
        return pat2;
      }
      const pat = sequence(...children);
      pat.ast = ast;
      pat.__weight = children.length;
      return pat;
    }
    case "element": {
      const pat = patternifyAST(ast.source_, code);
      pat.ast = ast;
      return pat;
    }
    case "atom": {
      if (ast.source_ === "~") {
        return silence;
      }
      if (!ast.location_) {
        console.warn("no location for", ast);
        return ast.source_;
      }
      const { start, end } = ast.location_;
      const value = !isNaN(Number(ast.source_)) ? Number(ast.source_) : ast.source_;
      const actual = code == null ? void 0 : code.split("").slice(start.offset, end.offset).join("");
      const [offsetStart = 0, offsetEnd = 0] = actual ? actual.split(ast.source_).map((p) => p.split("").filter((c) => c === " ").length) : [];
      return pure(value).withLocation(
        [start.line, start.column + offsetStart, start.offset + offsetStart],
        [start.line, end.column - offsetEnd, end.offset - offsetEnd]
      );
    }
    case "stretch":
      return patternifyAST(ast.source_, code).slow(patternifyAST(ast.arguments_.amount, code));
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return silence;
  }
}
const mini = (...strings) => {
  const pats = strings.map((str) => {
    const code = `"${str}"`;
    const ast = peg$parse(code);
    const pat = patternifyAST(ast, code);
    pat.ast = ast;
    return pat;
  });
  const s = sequence(...pats);
  s.ast = pats.map((_pat) => _pat.ast);
  return s;
};
const h = (string) => {
  const ast = peg$parse(string);
  const pat = patternifyAST(ast, string);
  pat.ast = ast;
  return pat;
};
function minify(thing) {
  if (typeof thing === "string") {
    return mini(thing);
  }
  return reify(thing);
}
exports.SyntaxError = peg$SyntaxError;
exports.h = h;
exports.mini = mini;
exports.minify = minify;
exports.parse = peg$parse;
exports.patternifyAST = patternifyAST;

},{}],145:[function(require,module,exports){

/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

module.exports = function Realm (scope, parentElement) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:absolute;left:0;top:-999px;width:1px;height:1px;';
  parentElement.appendChild(frame);
  const win = frame.contentWindow;
  const doc = win.document;
  let vars = 'var window,$hook';
  for (const i in win) {
    if (!(i in scope) && i !== 'eval') {
      vars += ',';
      vars += i;
    }
  }
  for (const i in scope) {
    vars += ',';
    vars += i;
    vars += '=self.';
    vars += i;
  }
  const script = doc.createElement('script');
  script.appendChild(doc.createTextNode(
    `function $hook(self,console) {"use strict";
        ${vars};return function() {return eval(arguments[0])}}`
  ));
  doc.body.appendChild(script);
  this.exec = win.$hook.call(scope, scope, console);
}

},{}],146:[function(require,module,exports){
const __proxy = require( './workletProxy.js' )
const effectProto = require( './fx/effect.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )
  
  const factory = function( ugen, graph, __name, values, cb=null, shouldProxy = true ) {
    if( Gibberish.mode === 'processor' ) {
      ugen.callback = cb === null 
        ? Gibberish.genish.gen.createCallback( graph, Gibberish.memory, false, true ) 
        : cb
    }else{
      ugen.callback = { out:[] }
    }

    let name = Array.isArray( __name ) ? __name[ __name.length - 1 ] : __name

    Object.assign( ugen, {
      //type: 'ugen',
      id: values.id || Gibberish.utilities.getUID(), 
      ugenName: name + '_',
      graph: graph,
      inputNames: ugen.inputNames || new Set( Gibberish.genish.gen.parameters ),
      isStereo: Array.isArray( graph ),
      dirty: true,
      __properties__:values,
      __addresses__:{}
    })

    ugen.ugenName += ugen.id
    if( Gibberish.mode === 'processor' ) {
      ugen.callback.ugenName = ugen.ugenName // XXX hacky
      ugen.callback.id = ugen.id
    }

    //console.log( 'ugen name/id:', ugen.ugenName, ugen.id )
    //console.log( 'callback name/id:', ugen.callback.ugenName, ugen.callback.id )

    for( let param of ugen.inputNames ) {
      if( param === 'memory' ) continue

      let value = values[ param ],
          isNumber = typeof value === 'object' || isNaN( value ) ? false : true,
          idx

      if( isNumber ) { 
        idx = Gibberish.memory.alloc( 1 )
        Gibberish.memory.heap[ idx ] = value
        ugen.__addresses__[ param ] = idx
      }

      // TODO: do we need to check for a setter?
      let desc = Object.getOwnPropertyDescriptor( ugen, param ),
          setter

      if( desc !== undefined ) {
        setter = desc.set
      }

      Object.defineProperty( ugen, param, {
        configurable:true,
        get() { 
          if( isNumber ) {
            return Gibberish.memory.heap[ idx ]
          }else{
            return value 
          }
        },
        set( v ) {
          //if( param === 'input' ) console.log( 'INPUT:', v, isNumber )
          if( value !== v ) {
            if( setter !== undefined ) setter( v )
            if( typeof v === 'number' ) {
              Gibberish.memory.heap[ idx ] = value = v
              if( isNumber === false ) Gibberish.dirty( ugen )
              isNumber = true
            }else{
              value = v
              /*if( isNumber === true )*/ Gibberish.dirty( ugen )
              //console.log( 'switching from number:', param, value )
              isNumber = false
            }
          }
        }
      })
    }

    // add bypass 
    if( effectProto.isPrototypeOf( ugen ) ) {
      let value = ugen.bypass
      Object.defineProperty( ugen, 'bypass', {
        configurable:true,
        get() { return value },
        set( v ) {
          if( value !== v ) {
            Gibberish.dirty( ugen )
            value = v
          }
        }
      })

    }

    if( ugen.__requiresRecompilation !== undefined ) {
      ugen.__requiresRecompilation.forEach( prop => {
        let value = values[ prop ]
        let isNumber = !isNaN( value )

        Object.defineProperty( ugen, prop, {
          configurable:true,
          get() { 
            if( isNumber ) {
              let idx = ugen.__addresses__[ prop ]
              return Gibberish.memory.heap[ idx ]
            }else{
              //console.log( 'returning:', prop, value, Gibberish.mode )
              return value 
            }
          },
          set( v ) {
            if( value !== v ) {
              if( typeof v === 'number' ) {
                let idx = ugen.__addresses__[ prop ]
                if( idx === undefined ){
                  idx = Gibberish.memory.alloc( 1 )
                  ugen.__addresses__[ prop ] = idx
                }
                value = values[ prop ] = Gibberish.memory.heap[ idx ] = v
                isNumber = true
              }else{
                value = values[ prop ] = v
                isNumber = false
                //console.log( 'setting ugen', value, Gibberish.mode )
                Gibberish.dirty( ugen )
              }

              //console.log( 'SETTING REDO GRAPH', prop, Gibberish.mode )
              
              // needed for filterType at the very least, becauae the props
              // are reused when re-creating the graph. This seems like a cheaper
              // way to solve this problem.
              //values[ prop ] = v

              this.__redoGraph()
            }
          }
        })
      })
    }

    // will only create proxy if worklets are being used
    // otherwise will return unaltered ugen

    if( values.shouldAddToUgen === true ) Object.assign( ugen, values )

    return shouldProxy ? proxy( __name, values, ugen ) : ugen
  }

  factory.getUID = () => { return Gibberish.utilities.getUID() }

  return factory
}

},{"./fx/effect.js":161,"./workletProxy.js":210}],147:[function(require,module,exports){
let g = require( 'genish.js' )
 
// constructor for schroeder allpass filters
let allPass = function( _input, length=500, feedback=.5 ) {
  let index  = g.counter( 1,0,length ),
      buffer = g.data( length ),
      bufferSample = g.peek( buffer, index, { interp:'none', mode:'samples' }),
      out = g.memo( g.add( g.mul( -1, _input), bufferSample ) )
                
  g.poke( buffer, g.add( _input, g.mul( bufferSample, feedback ) ), index )
 
  return out
}

module.exports = allPass

},{"genish.js":40}],148:[function(require,module,exports){
let g = require( 'genish.js' ),
    filter = require( './filter.js' )

module.exports = function( Gibberish ) {

  const genish = g
  Gibberish.genish.biquad = ( input, __cutoff, __Q, mode, isStereo ) => {
    'use jsdsp'
    let in1a0,x0a1,x1a2,y0b0,y1b1,
        in1a0_r,x0a1_r,x1a2_r,y0b0_r,y1b1_r,
        c

    let returnValue
    
    const x = genish.data([ 0,0 ], 1, { meta:true })
    const y = genish.data([ 0,0 ], 1, { meta:true })
    const a = genish.data([ 0,0,0 ], 1, { meta:true })
    const b = genish.data([ 0,0 ], 1, { meta:true })
    
    const Q = g.min( .5 + __Q * 22, 22.5 ) 
    const cutoff = g.max( .005, g.min( __cutoff,.995 ) ) * g.gen.samplerate / 4 
    //let w0 = g.memo( g.mul( 2 * Math.PI, g.div( g.max(.005, g.min(cutoff,.995)),  g.gen.samplerate ) ) ),
    let w0 =  (2 * Math.PI) * (cutoff / g.gen.samplerate),
        sinw0 = g.sin( w0 ),
        cosw0 = g.cos( w0 ),
        alpha = sinw0 / ( 2 * Q )

    //let w0 = g.memo( g.mul( 2 * Math.PI, g.div( cutoff,  g.gen.samplerate ) ) ),
      
    let oneMinusCosW = 1 - cosw0

    /******** process coefficients ********/
    switch( mode ) {
      case 1:
        a[0] = (1 + cosw0) / 2
        a[1] = (1 + cosw0) * -1
        a[2] = a[0]
        c    = 1 + alpha
        b[0] = -2 * cosw0
        b[1] = 1 - alpha
        break;
      case 2:
        a[0] = Q * alpha
        a[1] = 0
        a[2] = a[0] * -1
        c    = 1 + alpha
        b[0] = -2 * cosw0
        b[1] = 1 - alpha
        break;
      default: // LP
        a[0] = oneMinusCosW / 2
        a[1] = oneMinusCosW
        a[2] = a[0]
        c    = 1 + alpha
        b[0] = -2 * cosw0
        b[1] = 1 - alpha
    }

    a[0] = a[0] / c; a[1] = a[1] / c; a[2] = a[2] / c
    b[0] = b[0] / c; b[1] = b[1] / c

    /******** end coefficients ********/

    /****** left / mono output ********/

    let l = isStereo === true ? input[0] : input
    in1a0 = l * a[0]
    x0a1  = x[0] * a[1]
    x1a2  = x[1] * a[2]

    x[1] = x[0] 
    x[0] = l

    let sumLeft = in1a0 + x0a1 + x1a2

    y0b0 = y[0] * b[0]
    y1b1 = y[1] * b[1]
    y[1] = y[0] 

    let sumRight = y0b0 + y1b1

    let diff = sumLeft - sumRight

    y[0] = diff
    
    /******** end left/mono **********/

    if( isStereo ) {
      const xr = genish.data([ 0,0 ], 1, { meta:true })
      const yr = genish.data([ 0,0 ], 1, { meta:true })
      //let x1_1 = g.history(), x2_1 = g.history(), y1_1 = g.history(), y2_1 = g.history()

      const r = input[1] 
      in1a0_r = r * a[0] //g.mul( x1_1.in( input[1] ), a0 )
      x0a1_r  = xr[0] * a[1]//g.mul( x2_1.in( x1_1.out ), a1 )
      x1a2_r  = xr[1] * a[2]//g.mul( x2_1.out,            a2 )

      xr[1]   = xr[0]
      xr[0] = r

      const sumLeft_r = in1a0_r + x0a1_r + x1a2_r

      y0b0_r = yr[0] * b[0]//g.mul( y2_1.in( y1_1.out ), b1 )
      y1b1_r = yr[1] * b[1]//g.mul( y2_1.out, b2 )
      yr[1] = yr[0]

      const sumRight_r = y0b0_r + y1b1_r

      const diff_r = sumLeft_r - sumRight_r

      yr[0] = diff_r
      
      returnValue = [ diff, diff_r ]
    }else{
      returnValue = diff
    }

    return returnValue
  }

  let Biquad = inputProps => {
    const biquad = Object.create( filter )
    const props = Object.assign( {}, Biquad.defaults, inputProps ) 
    let __out

    Object.assign( biquad, props )

    biquad.__createGraph = function() {
      let isStereo = false
      if( __out === undefined ) {
        isStereo = props.input !== undefined && props.input.isStereo !== undefined ? props.input.isStereo : false 
      }else{
        isStereo = __out.input.isStereo
        __out.isStereo = isStereo
      }
      biquad.graph = Gibberish.genish.biquad( g.in('input'), g.in('cutoff'),  g.in('Q'), biquad.mode, isStereo )
    }

    biquad.__createGraph()
    biquad.__requiresRecompilation = [ 'mode', 'input' ]

    __out = Gibberish.factory(
      biquad,
      biquad.graph,
      ['filters','Filter12Biquad'], 
      props
    )

    return __out
  }

  Biquad.defaults = {
    input:0,
    Q: .15,
    cutoff:.05,
    mode:0
  }

  return Biquad

}


},{"./filter.js":151,"genish.js":40}],149:[function(require,module,exports){
let g = require( 'genish.js' )

let combFilter = function( _input, combLength, damping=.5*.4, feedbackCoeff=.84 ) {
  let lastSample   = g.history(),
  	  readWriteIdx = g.counter( 1,0,combLength ),
      combBuffer   = g.data( combLength ),
	    out          = g.peek( combBuffer, readWriteIdx, { interp:'none', mode:'samples' }),
      storeInput   = g.memo( g.add( g.mul( out, g.sub( 1, damping)), g.mul( lastSample.out, damping ) ) )
      
  lastSample.in( storeInput )
 
  g.poke( combBuffer, g.add( _input, g.mul( storeInput, feedbackCoeff ) ), readWriteIdx )
 
  return out
}

module.exports = combFilter

},{"genish.js":40}],150:[function(require,module,exports){
const g = require( 'genish.js' ),
      filter = require( './filter.js' )

const genish = g
module.exports = function( Gibberish ) {
  Gibberish.genish.diodeZDF = ( input, __Q, __freq, saturation, isStereo=false ) => {
    const iT = 1 / g.gen.samplerate,
          kz1 = g.history(0),
          kz2 = g.history(0),
          kz3 = g.history(0),
          kz4 = g.history(0)

    let   ka1 = 1.0,
          ka2 = 0.5,
          ka3 = 0.5,
          ka4 = 0.5,
          kindx = 0   

    const freq = g.mul( g.max(.005, g.min( __freq, .995)),  genish.gen.samplerate / 2 )
    //const freq = g.max(.005, g.min( __freq, .995))

    // XXX this is where the magic number hapens for Q...
    const Q = g.memo( g.add( .5, g.mul( __Q, g.add( 5, g.sub( 5, g.mul( g.div( freq, 20000  ), 5 ) ) ) ) ) )
    // kwd = 2 * $M_PI * acf[kindx]
    const kwd = g.memo( g.mul( Math.PI * 2, freq ) )

    // kwa = (2/iT) * tan(kwd * iT/2) 
    const kwa =g.memo( g.mul( 2/iT, g.tan( g.mul( kwd, iT/2 ) ) ) )

    // kG  = kwa * iT/2 
    const kg = g.memo( g.mul( kwa, iT/2 ) )
    
    const kG4 = g.memo( g.mul( .5, g.div( kg, g.add( 1, kg ) ) ) )
    const kG3 = g.memo( g.mul( .5, g.div( kg, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG4 ) ) ) ) )
    const kG2 = g.memo( g.mul( .5, g.div( kg, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG3 ) ) ) ) )
    const kG1 = g.memo( g.div( kg, g.sub( g.add( 1, kg ), g.mul( kg, kG2 ) ) ) )

    const kGAMMA = g.memo( g.mul( g.mul( kG4, kG3 ) , g.mul( kG2, kG1 ) ) )

    const kSG1 = g.memo( g.mul( g.mul( kG4, kG3 ), kG2 ) ) 

    const kSG2 = g.memo( g.mul( kG4, kG3) )  
    const kSG3 = kG4 
    let kSG4 = 1.0 
    // kk = 4.0*(kQ - 0.5)/(25.0 - 0.5)
    const kalpha = g.memo( g.div( kg, g.add(1.0, kg) ) )

    const kbeta1 = g.memo( g.div( 1.0, g.sub( g.add( 1, kg ), g.mul( kg, kG2 ) ) ) )
    const kbeta2 = g.memo( g.div( 1.0, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG3 ) ) ) )
    const kbeta3 = g.memo( g.div( 1.0, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG4 ) ) ) )
    const kbeta4 = g.memo( g.div( 1.0, g.add( 1, kg ) ) ) 

    const kgamma1 = g.memo( g.add( 1, g.mul( kG1, kG2 ) ) )
    const kgamma2 = g.memo( g.add( 1, g.mul( kG2, kG3 ) ) )
    const kgamma3 = g.memo( g.add( 1, g.mul( kG3, kG4 ) ) )

    const kdelta1 = kg
    const kdelta2 = g.memo( g.mul( 0.5, kg ) )
    const kdelta3 = g.memo( g.mul( 0.5, kg ) )

    const kepsilon1 = kG2
    const kepsilon2 = kG3
    const kepsilon3 = kG4

    const klastcut = freq

    //;; feedback inputs 
    const kfb4 = g.memo( g.mul( kbeta4 , kz4.out ) ) 
    const kfb3 = g.memo( g.mul( kbeta3, g.add( kz3.out, g.mul( kfb4, kdelta3 ) ) ) )
    const kfb2 = g.memo( g.mul( kbeta2, g.add( kz2.out, g.mul( kfb3, kdelta2 ) ) ) )

    //;; feedback process

    const kfbo1 = g.memo( g.mul( kbeta1, g.add( kz1.out, g.mul( kfb2, kdelta1 ) ) ) ) 
    const kfbo2 = g.memo( g.mul( kbeta2, g.add( kz2.out, g.mul( kfb3, kdelta2 ) ) ) ) 
    const kfbo3 = g.memo( g.mul( kbeta3, g.add( kz3.out, g.mul( kfb4, kdelta3 ) ) ) ) 
    const kfbo4 = kfb4

    const kSIGMA = g.memo( 
      g.add( 
        g.add( 
          g.mul( kSG1, kfbo1 ), 
          g.mul( kSG2, kfbo2 )
        ), 
        g.add(
          g.mul( kSG3, kfbo3 ), 
          g.mul( kSG4, kfbo4 )
        ) 
      ) 
    )

    //const kSIGMA = 1
    //;; non-linear processing
    //if (knlp == 1) then
    //  kin = (1.0 / tanh(ksaturation)) * tanh(ksaturation * kin)
    //elseif (knlp == 2) then
    //  kin = tanh(ksaturation * kin) 
    //endif
    //
    //const kin = input 
    let kin = isStereo === true ? g.add( input[0], input[1] ) : input//g.memo( g.mul( g.div( 1, g.tanh( saturation ) ), g.tanh( g.mul( saturation, input ) ) ) )
    kin = g.tanh( g.mul( saturation, kin ) )

    const kun = g.div( g.sub( kin, g.mul( Q, kSIGMA ) ), g.add( 1, g.mul( Q, kGAMMA ) ) )
    //const kun = g.div( 1, g.add( 1, g.mul( Q, kGAMMA ) ) )
        //(kin - kk * kSIGMA) / (1.0 + kk * kGAMMA)

    //;; 1st stage
    let kxin = g.memo( g.add( g.add( g.mul( kun, kgamma1 ), kfb2), g.mul( kepsilon1, kfbo1 ) ) )
    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    let kv = g.memo( g.mul( g.sub( g.mul( ka1, kxin ), kz1.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    let klp = g.add( kv, kz1.out )
    //klp = kv + kz1
    kz1.in( g.add( klp, kv ) ) 
    //kz1 = klp + kv

        //;; 2nd stage
    //kxin = (klp * kgamma2 + kfb3 + kepsilon2 * kfbo2)
    //kv = (ka2 * kxin - kz2) * kalpha 
    //klp = kv + kz2
    //kz2 = klp + kv

    kxin = g.memo( g.add( g.add( g.mul( klp, kgamma2 ), kfb3), g.mul( kepsilon2, kfbo2 ) ) )
    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    kv = g.memo( g.mul( g.sub( g.mul( ka2, kxin ), kz2.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    klp = g.add( kv, kz2.out ) 
    //klp = kv + kz1
    kz2.in( g.add( klp, kv ) ) 
    //kz1 = klp + kv

    //;; 3rd stage
    //kxin = (klp * kgamma3 + kfb4 + kepsilon3 * kfbo3)
    //kv = (ka3 * kxin - kz3) * kalpha 
    //klp = kv + kz3
    //kz3 = klp + kv

    kxin = g.memo( g.add( g.add( g.mul( klp, kgamma3 ), kfb4), g.mul( kepsilon3, kfbo3 ) ) )
    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    kv = g.memo( g.mul( g.sub( g.mul( ka3, kxin ), kz3.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    klp = g.add( kv, kz3.out )
    //klp = kv + kz1
    kz3.in( g.add( klp, kv ) )
    //kz1 = klp + kv

    //;; 4th stage
    //kv = (ka4 * klp - kz4) * kalpha 
    //klp = kv + kz4
    //kz4 = klp + kv

    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    kv = g.memo( g.mul( g.sub( g.mul( ka4, kxin ), kz4.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    klp = g.add( kv, kz4.out )
    //klp = kv + kz1
    kz4.in( g.add( klp, kv ) )

    //kz1 = klp + kv
    if( isStereo ) {
      //let polesR = g.data([ 0,0,0,0 ], 1, { meta:true }),
      //    rezzR = g.clamp( g.mul( polesR[3], rez ) ),
      //    outputR = g.sub( input[1], rezzR )         

      //polesR[0] = g.add( polesR[0], g.mul( g.add( g.mul(-1, polesR[0] ), outputR   ), cutoff ))
      //polesR[1] = g.add( polesR[1], g.mul( g.add( g.mul(-1, polesR[1] ), polesR[0] ), cutoff ))
      //polesR[2] = g.add( polesR[2], g.mul( g.add( g.mul(-1, polesR[2] ), polesR[1] ), cutoff ))
      //polesR[3] = g.add( polesR[3], g.mul( g.add( g.mul(-1, polesR[3] ), polesR[2] ), cutoff ))

      //let right = g.switch( isLowPass, polesR[3], g.sub( outputR, polesR[3] ) )

      //returnValue = [left, right]
    }else{
     // returnValue = klp
    }
    //returnValue = klp
    
    return klp
 }

  const DiodeZDF = inputProps => {
    const zdf      = Object.create( filter )
    const props    = Object.assign( {}, DiodeZDF.defaults, filter.defaults, inputProps )
    const isStereo = props.input.isStereo 

    Object.assign( zdf, props )

    const __out = Gibberish.factory(
      zdf, 
      Gibberish.genish.diodeZDF( g.in('input'), g.in('Q'), g.in('cutoff'), g.in('saturation'), isStereo ), 
      ['filters','Filter24TB303'],
      props
    )

    return __out 
  }

  DiodeZDF.defaults = {
    input:0,
    Q: .65,
    saturation: 1,
    cutoff:.5 
  }

  return DiodeZDF

}

},{"./filter.js":151,"genish.js":40}],151:[function(require,module,exports){
let ugen = require( '../ugen.js' )()

let filter = Object.create( ugen )

Object.assign( filter, {
  defaults: { bypass:false } 
})

module.exports = filter

},{"../ugen.js":208}],152:[function(require,module,exports){
let g = require( 'genish.js' ),
    filter = require( './filter.js' )

module.exports = function( Gibberish ) {

  Gibberish.genish.filter24 = ( input, _rez, _cutoff, isLowPass, isStereo=false ) => {
    let returnValue,
        polesL = g.data([ 0,0,0,0 ], 1, { meta:true }),
        peekProps = { interp:'none', mode:'simple' },
        rez = g.memo( g.mul( _rez, 5 ) ),
        cutoff = g.memo( g.div( _cutoff, 11025 ) ),
        rezzL = g.clamp( g.mul( polesL[3], rez ) ),
        outputL = g.sub( isStereo ? input[0] : input, rezzL ) 

    polesL[0] = g.add( polesL[0], g.mul( g.add( g.mul(-1, polesL[0] ), outputL   ), cutoff ))
    polesL[1] = g.add( polesL[1], g.mul( g.add( g.mul(-1, polesL[1] ), polesL[0] ), cutoff ))
    polesL[2] = g.add( polesL[2], g.mul( g.add( g.mul(-1, polesL[2] ), polesL[1] ), cutoff ))
    polesL[3] = g.add( polesL[3], g.mul( g.add( g.mul(-1, polesL[3] ), polesL[2] ), cutoff ))
    
    let left = g.switch( isLowPass, polesL[3], g.sub( outputL, polesL[3] ) )

    if( isStereo ) {
      let polesR = g.data([ 0,0,0,0 ], 1, { meta:true }),
          rezzR = g.clamp( g.mul( polesR[3], rez ) ),
          outputR = g.sub( input[1], rezzR )         

      polesR[0] = g.add( polesR[0], g.mul( g.add( g.mul(-1, polesR[0] ), outputR   ), cutoff ))
      polesR[1] = g.add( polesR[1], g.mul( g.add( g.mul(-1, polesR[1] ), polesR[0] ), cutoff ))
      polesR[2] = g.add( polesR[2], g.mul( g.add( g.mul(-1, polesR[2] ), polesR[1] ), cutoff ))
      polesR[3] = g.add( polesR[3], g.mul( g.add( g.mul(-1, polesR[3] ), polesR[2] ), cutoff ))

      let right = g.switch( isLowPass, polesR[3], g.sub( outputR, polesR[3] ) )

      returnValue = [left, right]
    }else{
      returnValue = left
    }

    return returnValue
  }

  let Filter24 = inputProps => {
    let filter24   = Object.create( filter )
    let props    = Object.assign( {}, Filter24.defaults, filter.defaults, inputProps )
    let isStereo = props.input.isStereo 

    const __out = Gibberish.factory(
      filter24, 
      Gibberish.genish.filter24( g.in('input'), g.in('Q'), g.in('cutoff'), g.in('isLowPass'), isStereo ), 
      ['filters','Filter24Classic'],
      props
    )

    return __out
  }


  Filter24.defaults = {
    input:0,
    Q: .25,
    cutoff: 880,
    isLowPass:1
  }

  return Filter24

}


},{"./filter.js":151,"genish.js":40}],153:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const g = Gibberish.genish

  const filters = {
    Filter24Classic : require( './filter24.js'  )( Gibberish ),
    Filter24Moog    : require( './ladder.dsp.js' )( Gibberish ),
    Filter24TB303   : require( './diodeFilterZDF.js' )( Gibberish ),
    Filter12Biquad  : require( './biquad.dsp.js'    )( Gibberish ),
    Filter12SVF     : require( './svf.js'       )( Gibberish ),
    
    // not for use by end-users
    genish: {
      Comb        : require( './combfilter.js' ),
      AllPass     : require( './allpass.js' )
    },

    factory( input, cutoff, saturation, _props, isStereo = false ) {
      let filteredOsc 

      let props = Object.assign({}, filters.defaults, _props )

      switch( props.filterModel ) {
        case 1:
          filteredOsc = g.zd24( input, g.in('Q'), cutoff, 0 ) // g.max(.005, g.min( cutoff, 1 ) ) )
          break;
        case 2:
          filteredOsc = g.diodeZDF( input, g.min( g.in('Q'), .9999 ), cutoff, saturation, isStereo ) 
          break;
        case 3:
          filteredOsc = g.svf( input, cutoff, g.sub( 1, g.in('Q')), props.filterMode, isStereo, true ) 
          break; 
        case 4:
          filteredOsc = g.biquad( input, cutoff,  g.in('Q'), props.filterMode, isStereo ) 
          break; 
        case 5:
          //isLowPass = g.param( 'lowPass', 1 ),
          filteredOsc = g.filter24( input, g.in('Q'), cutoff, props.filterMode, isStereo )
          break;
        default:
          // return unfiltered signal
          filteredOsc = input //g.filter24( oscWithGain, g.in('resonance'), cutoff, isLowPass )
          break;
      }

      return filteredOsc
    },

    defaults: { filterMode: 0, filterModel:0 }
  }

  filters.export = target => {
    for( let key in filters ) {
      if( key !== 'export' && key !== 'genish' ) {
        target[ key ] = filters[ key ]
      }
    }
  }

return filters

}

},{"./allpass.js":147,"./biquad.dsp.js":148,"./combfilter.js":149,"./diodeFilterZDF.js":150,"./filter24.js":152,"./ladder.dsp.js":154,"./svf.js":155}],154:[function(require,module,exports){
const genish = require( 'genish.js' ),
      filterProto = require( './filter.js' )

module.exports = function( Gibberish ) {

  const makeChannel = function( input, _Q, _freq ) {
    'use jsdsp'
    const iT = 1 / genish.gen.samplerate,
          z  = genish.data([ 0,0,0,0 ], 1, { meta:true })

    const freq = genish.max(.005, genish.min( _freq, 1 ) ) 
    const Q = .5 + _Q * 23
    // kwd = 2 * $M_PI * acf[kindx]
    const kwd = ( Math.PI * 2 ) * freq * genish.gen.samplerate / 2

    // kwa = (2/iT) * tan(kwd * iT/2) 
    const kwa = 2/iT * genish.tan( kwd * iT/2 )

    // kG  = kwa * iT/2 
    const kg = kwa * iT/2

    // kk = 4.0*(kQ - 0.5)/(25.0 - 0.5)
    const kk = 4 * (Q - .5) / 24.5

    // kg_plus_1 = (1.0 + kg)
    const kg_plus_1 = 1 + kg

    // kG = kg / kg_plus_1 
    const kG     = kg / kg_plus_1,
          kG_2   = kG * kG,
          kG_3   = kG_2 * kG,
          kGAMMA = kG_2 * kG_2

    const kS1 = z[0] / kg_plus_1,
          kS2 = z[1] / kg_plus_1,
          kS3 = z[2] / kg_plus_1,
          kS4 = z[3] / kg_plus_1

    //kS = kG_3 * kS1  + kG_2 * kS2 + kG * kS3 + kS4 
    const kS = kG_3 * kS1 + kG_2 * kS2 + kG * kS3 + kS4

    //ku = (kin - kk *  kS) / (1 + kk * kGAMMA)
    const ku  = (input - kk * kS) / (1 + kk * kGAMMA)

    let kv =  ( ku - z[0] ) * kG
    let klp = kv + z[0]
    z[0] = klp + kv

    kv  = ( klp - z[1] ) * kG
    klp = kv + z[1]
    z[1] = klp + kv

    kv  = (klp - z[2] ) * kG
    klp = kv + z[2]
    z[2] = klp + kv

    kv  = (klp - z[3] ) * kG
    klp = kv + z[3]
    z[3] = klp + kv

    return klp
  }

  Gibberish.genish.zd24 = ( input, _Q, freq, isStereo=false ) => {
    const leftInput = isStereo === true ? input[0] : input
    const left = makeChannel( leftInput, _Q, freq )

    let out
    if( isStereo === true ) {
      const right = makeChannel( input[1], _Q, freq )
      out = [ left, right ]
    }else{
      out = left
    }

    return out
  }

  const Zd24 = inputProps => {
    const filter   = Object.create( filterProto )
    const props    = Object.assign( {}, Zd24.defaults, filter.defaults, inputProps )
    let out

    filter.__requiresRecompilation = [ 'input' ]
    filter.__createGraph = function() {
      let isStereo = false
      if( out === undefined ) {
        isStereo = props.input !== undefined && props.input.isStereo !== undefined ? props.input.isStereo : false 
      }else{
        isStereo = out.input.isStereo
        out.isStereo = isStereo
      }

      // cutoff frequency limit handled near top of makeChannel function
      filter.graph = Gibberish.genish.zd24( genish.in('input'), genish.min( 1, genish.in('Q') ), genish.in('cutoff'), isStereo ) 
    } 

    filter.__createGraph()

    out = Gibberish.factory(
      filter, 
      filter.graph, 
      ['filters','Filter24Moog'],
      props
    )

    return out
  }

  Zd24.defaults = {
    input:0,
    Q: .75,
    cutoff: .25,
  }

  return Zd24

}


},{"./filter.js":151,"genish.js":40}],155:[function(require,module,exports){
const g = require( 'genish.js' ),
      filter = require( './filter.js' )

module.exports = function( Gibberish ) {
  Gibberish.genish.svf = ( input, cutoff, Q, mode, isStereo=false, shouldConvertFreqQ=false ) => {
    let d1 = g.data([0,0], 1, { meta:true }), d2 = g.data([0,0], 1, { meta:true }),
        peekProps = { mode:'simple', interp:'none' }

    if( shouldConvertFreqQ === true ) {
      //Q = g.min( g.add(.01 , __Q), 1 ) 
      cutoff = g.mul( g.max( .005, g.min( cutoff,.995 ) ), g.div( g.gen.samplerate, 4 ) )
    }

    let f1 = g.memo( g.mul( 2 * Math.PI, g.div( cutoff, g.gen.samplerate ) ) )
    let oneOverQ = g.memo( g.div( 1, Q ) )
    let l = g.memo( g.add( d2[0], g.mul( f1, d1[0] ) ) ),
        h = g.memo( g.sub( g.sub( isStereo ? input[0] : input, l ), g.mul( Q, d1[0] ) ) ),
        b = g.memo( g.add( g.mul( f1, h ), d1[0] ) ),
        n = g.memo( g.add( h, l ) )

    d1[0] = b
    d2[0] = l

    let out = g.selector( mode, l, h, b, n )

    let returnValue
    if( isStereo ) {
      let d12 = g.data([0,0], 1, { meta:true }), d22 = g.data([0,0], 1, { meta:true })
      let l2 = g.memo( g.add( d22[0], g.mul( f1, d12[0] ) ) ),
          h2 = g.memo( g.sub( g.sub( input[1], l2 ), g.mul( Q, d12[0] ) ) ),
          b2 = g.memo( g.add( g.mul( f1, h2 ), d12[0] ) ),
          n2 = g.memo( g.add( h2, l2 ) )

      d12[0] = b2
      d22[0] = l2

      let out2 = g.selector( mode, l2, h2, b2, n2 )

      returnValue = [ out, out2 ]
    }else{
      returnValue = out
    }

    return returnValue
  }

  let SVF = inputProps => {
    const svf = Object.create( filter )
    const props = Object.assign( {}, SVF.defaults, filter.defaults, inputProps ) 

    const isStereo = props.input.isStereo
    
    // XXX NEEDS REFACTORING
    const __out = Gibberish.factory( 
      svf,
      //Gibberish.genish.svf( g.in('input'), g.mul( g.in('cutoff'), g.gen.samplerate / 5 ), g.sub( 1, g.in('Q') ), g.in('mode'), isStereo ), 
      Gibberish.genish.svf( g.in('input'), g.mul( g.in('cutoff'), g.gen.samplerate / 5 ), g.sub( 1, g.in('Q') ), g.in('mode'), isStereo, true ), 
      ['filters','Filter12SVF'], 
      props
    )

    return __out
  }


  SVF.defaults = {
    input:0,
    Q: .65,
    cutoff:.25,
    mode:0
  }

  return SVF

}


},{"./filter.js":151,"genish.js":40}],156:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let BitCrusher = inputProps => {
  const  props = Object.assign( { bitCrusherLength: 44100 }, BitCrusher.defaults, effect.defaults, inputProps ),
         bitCrusher = Object.create( effect )

  let out

  bitCrusher.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }

    let input = g.in( 'input' ),
        inputGain = g.in( 'inputGain' ),
        bitDepth = g.in( 'bitDepth' ),
        sampleRate = g.in( 'sampleRate' ),
        leftInput = isStereo ? input[ 0 ] : input,
        rightInput = isStereo ? input[ 1 ] : null
    
    let storeL = g.history(0)
    let sampleReduxCounter = g.counter( sampleRate, 0, 1 )

    let bitMult = g.pow( g.mul( bitDepth, 16 ), 2 )
    let crushedL = g.div( g.floor( g.mul( g.mul( leftInput, inputGain ), bitMult ) ), bitMult )

    let outL = g.switch(
      sampleReduxCounter.wrap,
      crushedL,
      storeL.out
    )

    if( isStereo ) {
      let storeR = g.history(0)
      let crushedR = g.div( g.floor( g.mul( g.mul( rightInput, inputGain ), bitMult ) ), bitMult )

      let outR = g.switch( 
        sampleReduxCounter.wrap,
        crushedR,
        storeL.out
      )

      bitCrusher.graph = [ outL, outR ]
    }else{
      bitCrusher.graph = outL
    }
  }

  bitCrusher.__createGraph()
  bitCrusher.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    bitCrusher,
    bitCrusher.graph,
    ['fx','bitCrusher'], 
    props 
  )
  return out 
}

BitCrusher.defaults = {
  input:0,
  bitDepth:.5,
  sampleRate: .5
}

return BitCrusher

}

},{"./effect.js":161,"genish.js":40}],157:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
  let proto = Object.create( effect )

  let Shuffler = inputProps => {
    let bufferShuffler = Object.create( proto ),
        bufferSize = 88200

    const props = Object.assign( {}, Shuffler.defaults, effect.defaults, inputProps )
    
    let out
    bufferShuffler.__createGraph = function() {
      let isStereo = false
      if( out === undefined ) {
        isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : true 
      }else{
        isStereo = out.input.isStereo
        //out.isStereo = isStereo
      }      
      
      const phase = g.accum( 1,0,{ shouldWrap: false })

      const input = g.in( 'input' ),
            inputGain = g.in( 'inputGain' ),
            __leftInput = isStereo ? input[ 0 ] : input,
            __rightInput = isStereo ? input[ 1 ] : null,
            leftInput = g.mul( __leftInput, inputGain ),
            rightInput = g.mul( __rightInput, inputGain ),
            rateOfShuffling = g.in( 'rate' ),
            chanceOfShuffling = g.in( 'chance' ),
            reverseChance = g.in( 'reverseChance' ),
            repitchChance = g.in( 'repitchChance' ),
            repitchMin = g.in( 'repitchMin' ),
            repitchMax = g.in( 'repitchMax' )

      let pitchMemory = g.history(1)

      let shouldShuffleCheck = g.eq( g.mod( phase, rateOfShuffling ), 0 )
      let isShuffling = g.memo( g.sah( g.lt( g.noise(), chanceOfShuffling ), shouldShuffleCheck, 0 ) ) 

      // if we are shuffling and on a repeat boundary...
      let shuffleChanged = g.memo( g.and( shouldShuffleCheck, isShuffling ) )
      let shouldReverse = g.lt( g.noise(), reverseChance ),
          reverseMod = g.switch( shouldReverse, -1, 1 )

      let pitch = g.ifelse( 
        g.and( shuffleChanged, g.lt( g.noise(), repitchChance ) ),
        g.memo( g.mul( g.add( repitchMin, g.mul( g.sub( repitchMax, repitchMin ), g.noise() ) ), reverseMod ) ),
        reverseMod
      )
      
      // only switch pitches on repeat boundaries
      pitchMemory.in( g.switch( shuffleChanged, pitch, pitchMemory.out ) )

      let fadeLength = g.memo( g.div( rateOfShuffling, 100 ) ),
          fadeIncr = g.memo( g.div( 1, fadeLength ) )

      const bufferL = g.data( bufferSize )
      const bufferR = isStereo ? g.data( bufferSize ) : null
      let readPhase = g.accum( pitchMemory.out, 0, { shouldWrap:false }) 
      let stutter = g.wrap( g.sub( g.mod( readPhase, bufferSize ), 22050 ), 0, bufferSize )

      let normalSample = g.peek( bufferL, g.accum( 1, 0, { max:88200 }), { mode:'simple' })

      let stutterSamplePhase = g.switch( isShuffling, stutter, g.mod( readPhase, bufferSize ) )
      let stutterSample = g.memo( g.peek( 
        bufferL, 
        stutterSamplePhase,
        { mode:'samples' }
      ) )
      
      let stutterShouldFadeIn = g.and( shuffleChanged, isShuffling )
      let stutterPhase = g.accum( 1, shuffleChanged, { shouldWrap: false })

      let fadeInAmount = g.memo( g.div( stutterPhase, fadeLength ) )
      let fadeOutAmount = g.div( g.sub( rateOfShuffling, stutterPhase ), g.sub( rateOfShuffling, fadeLength ) )
      
      let fadedStutter = g.ifelse(
        g.lt( stutterPhase, fadeLength ),
        g.memo( g.mul( g.switch( g.lt( fadeInAmount, 1 ), fadeInAmount, 1 ), stutterSample ) ),
        g.gt( stutterPhase, g.sub( rateOfShuffling, fadeLength ) ),
        g.memo( g.mul( g.gtp( fadeOutAmount, 0 ), stutterSample ) ),
        stutterSample
      )
      
      let outputL = g.mix( normalSample, fadedStutter, isShuffling ) 

      let pokeL = g.poke( bufferL, leftInput, g.mod( g.add( phase, 44100 ), 88200 ) )

      let panner = g.pan( outputL, outputL, g.in( 'pan' ) )
      
      bufferShuffler.graph = [ panner.left, panner.right ]
    }

    bufferShuffler.__createGraph()
    bufferShuffler.__requiresRecompilation = [ 'input' ]
    
    out = Gibberish.factory( 
      bufferShuffler,
      bufferShuffler.graph,
      ['fx','shuffler'], 
      props 
    )

    return out 
  }
  
  Shuffler.defaults = {
    input:0,
    rate:22050,
    chance:.25,
    reverseChance:.5,
    repitchChance:.5,
    repitchMin:.5,
    repitchMax:2,
    pan:.5,
    mix:.5
  }

  return Shuffler 
}

},{"./effect.js":161,"genish.js":40}],158:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )
  
module.exports = function( Gibberish ) {
 
let __Chorus = inputProps => {
  const props = Object.assign({}, __Chorus.defaults, effect.defaults, inputProps )
  let out
  
  const chorus = Object.create( effect )

  chorus.__createGraph = function() {
    const input = g.in('input'),
          inputGain = g.in( 'inputGain' ),
          freq1 = g.in('slowFrequency'),
          freq2 = g.in('fastFrequency'),
          amp1  = g.in('slowGain'),
          amp2  = g.in('fastGain')

    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }

    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )

    const win0   = g.env( 'inversewelch', 1024 ),
          win120 = g.env( 'inversewelch', 1024, 0, .333 ),
          win240 = g.env( 'inversewelch', 1024, 0, .666 )
    
    const slowPhasor = g.phasor( freq1, 0, { min:0 }),
          slowPeek1  = g.mul( g.peek( win0,   slowPhasor ), amp1 ),
          slowPeek2  = g.mul( g.peek( win120, slowPhasor ), amp1 ),
          slowPeek3  = g.mul( g.peek( win240, slowPhasor ), amp1 )
    
    const fastPhasor = g.phasor( freq2, 0, { min:0 }),
          fastPeek1  = g.mul( g.peek( win0,   fastPhasor ), amp2 ),
          fastPeek2  = g.mul( g.peek( win120, fastPhasor ), amp2 ),
          fastPeek3  = g.mul( g.peek( win240, fastPhasor ), amp2 )


    let sampleRate = Gibberish.ctx.sampleRate
     
    const ms = sampleRate / 1000 
    const maxDelayTime = 1000 * ms

    //console.log( 'sr:', sampleRate, 'ms:', ms, 'maxDelayTime:', maxDelayTime )

    const time1 =  g.mul( g.add( slowPeek1, fastPeek1, 5 ), ms ),
          time2 =  g.mul( g.add( slowPeek2, fastPeek2, 5 ), ms ),
          time3 =  g.mul( g.add( slowPeek3, fastPeek3, 5 ), ms )

    const delay1L = g.delay( leftInput, time1, { size:maxDelayTime }),
          delay2L = g.delay( leftInput, time2, { size:maxDelayTime }),
          delay3L = g.delay( leftInput, time3, { size:maxDelayTime })

    
    const leftOutput = g.add( delay1L, delay2L, delay3L )
    if( isStereo ) {
      const rightInput = g.mul( input[1], inputGain )
      const delay1R = g.delay(rightInput, time1, { size:maxDelayTime }),
            delay2R = g.delay(rightInput, time2, { size:maxDelayTime }),
            delay3R = g.delay(rightInput, time3, { size:maxDelayTime })

      // flip a couple delay lines for stereo effect?
      const rightOutput = g.add( delay1R, delay2L, delay3R )
      chorus.graph = [ g.add( delay1L, delay2R, delay3L), rightOutput ]
    }else{
      chorus.graph = leftOutput
    }
  }

  chorus.__createGraph()
  chorus.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( chorus, chorus.graph, ['fx','chorus'], props )

  return out 
}

__Chorus.defaults = {
  input:0,
  slowFrequency: .18,
  slowGain:3,
  fastFrequency:6,
  fastGain:1,
  inputGain:1
}

return __Chorus

}

},{"./effect.js":161,"genish.js":40}],159:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let Delay = inputProps => {
  let props = Object.assign( { delayLength: 88200 }, effect.defaults, Delay.defaults, inputProps ),
      delay = Object.create( effect )

  let out
  delay.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input      = g.in( 'input' ),
          inputGain  = g.in( 'inputGain' ),
          delayTime  = g.in( 'time' ),
          wetdry     = g.in( 'wetdry' ),
          leftInput  = isStereo ? g.mul( input[ 0 ], inputGain ) : g.mul( input, inputGain ),
          rightInput = isStereo ? g.mul( input[ 1 ], inputGain ) : null
      
    const feedback = g.in( 'feedback' )

    // left channel
    const feedbackHistoryL = g.history()
    const echoL = g.delay( g.add( leftInput, g.mul( feedbackHistoryL.out, feedback ) ), delayTime, { size:props.delayLength })
    feedbackHistoryL.in( echoL )
    const left = g.mix( leftInput, echoL, wetdry )

    if( isStereo ) {
      // right channel
      const feedbackHistoryR = g.history()
      const echoR = g.delay( g.add( rightInput, g.mul( feedbackHistoryR.out, feedback ) ), delayTime, { size:props.delayLength })
      feedbackHistoryR.in( echoR )
      const right = g.mix( rightInput, echoR, wetdry )

      delay.graph = [ left, right ]
    }else{
      delay.graph = left 
    }
  }

  delay.__createGraph()
  delay.__requiresRecompilation = [ 'input' ]
  
  out = Gibberish.factory( 
    delay,
    delay.graph, 
    ['fx','delay'], 
    props 
  )

  return out
}

Delay.defaults = {
  input:0,
  feedback:.5,
  time: 11025,
  wetdry: .5
}

return Delay

}

},{"./effect.js":161,"genish.js":40}],160:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

const genish = g

// taken from csound: http://manual.freeshell.org/csound5/distort1.html
/*

         exp(asig * (shape1 + pregain)) - exp(asig * (shape2 - pregain))
  aout = ---------------------------------------------------------------
         exp(asig * pregain)            + exp(-asig * pregain)

*/

module.exports = function( Gibberish ) {

  let Distortion = inputProps => {
    let props = Object.assign( {}, effect.defaults, Distortion.defaults, inputProps ),
        distortion= Object.create( effect ),
        out

    distortion.__createGraph = function() {
      let isStereo = false
      if( out === undefined ) {
        isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
      }else{
        isStereo = out.input.isStereo
        out.isStereo = isStereo
      }

      const input = g.in( 'input' ),
            inputGain = g.in( 'inputGain' ),
            shape1 = g.in( 'shape1' ),
            shape2 = g.in( 'shape2' ),
            pregain = g.in( 'pregain' ),
            postgain = g.in( 'postgain' )

      let lout
      {
        'use jsdsp'
        const linput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )
        const ltop = g.exp( linput * (shape1 + pregain) ) - g.exp( linput * (shape2 - pregain) )
        const lbottom = g.exp( linput * pregain ) + g.exp( -1 * linput * pregain )
        lout = ( ltop / lbottom ) * postgain
      }

      if( isStereo ) {
        let rout
        {
          'use jsdsp'
          const rinput = isStereo ? g.mul( input[1], inputGain ) : g.mul( input, inputGain )
          const rtop = g.exp( rinput * (shape1 + pregain) ) - g.exp( rinput * (shape2 - pregain) )
          const rbottom = g.exp( rinput * pregain ) + g.exp( -1 * rinput * pregain )
          rout = ( rtop / rbottom ) * postgain
        }

        distortion.graph = [ lout, rout ]
      }else{
        distortion.graph = lout 
      }
    }

    distortion.__createGraph()
    distortion.__requiresRecompilation = [ 'input' ]

    out = Gibberish.factory( 
      distortion,
      distortion.graph, 
      [ 'fx','distortion' ], 
      props 
    )
    return out 
  }

  Distortion.defaults = {
    input:0,
    shape1:.1,
    shape2:.1,
    pregain:5,
    postgain:.5,
  }

  return Distortion

}

},{"./effect.js":161,"genish.js":40}],161:[function(require,module,exports){
let ugen = require( '../ugen.js' )()

let effect = Object.create( ugen )

Object.assign( effect, {
  defaults: { bypass:false, inputGain:1 },
  type:'effect'
})

module.exports = effect

},{"../ugen.js":208}],162:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const effects = {
    Freeverb    : require( './freeverb.js'  )( Gibberish ),
    //Plate       : require( './dattorro.dsp.js' )( Gibberish ),
    Flanger     : require( './flanger.js'   )( Gibberish ),
    Vibrato     : require( './vibrato.js'   )( Gibberish ),
    Delay       : require( './delay.js'     )( Gibberish ),
    BitCrusher  : require( './bitCrusher.js')( Gibberish ),
    Distortion  : require( './distortion.dsp.js')( Gibberish ),
    RingMod     : require( './ringMod.js'   )( Gibberish ),
    Tremolo     : require( './tremolo.js'   )( Gibberish ),
    Chorus      : require( './chorus.js'    )( Gibberish ),
    Wavefolder  : require( './wavefolder.dsp.js')( Gibberish )[0],
    Shuffler    : require( './bufferShuffler.js'  )( Gibberish ),
    //Gate        : require( './gate.js'      )( Gibberish ),
  }

  effects.export = target => {
    for( let key in effects ) {
      if( key !== 'export' ) {
        target[ key ] = effects[ key ]
      }
    }
  }

return effects

}

},{"./bitCrusher.js":156,"./bufferShuffler.js":157,"./chorus.js":158,"./delay.js":159,"./distortion.dsp.js":160,"./flanger.js":163,"./freeverb.js":164,"./ringMod.js":165,"./tremolo.js":166,"./vibrato.js":167,"./wavefolder.dsp.js":168}],163:[function(require,module,exports){
let g = require( 'genish.js' ),
    proto = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let Flanger = inputProps => {
  let props   = Object.assign( { delayLength:44100 }, Flanger.defaults, proto.defaults, inputProps ),
      flanger = Object.create( proto ),
      out

  flanger.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          delayLength = props.delayLength,
          feedbackCoeff = g.in( 'feedback' ),
          modAmount = g.in( 'offset' ),
          frequency = g.in( 'frequency' ),
          delayBufferL = g.data( delayLength )

    const writeIdx = g.accum( 1,0, { min:0, max:delayLength, interp:'none', mode:'samples' })
    
    const offset = g.mul( modAmount, 500 )

    const mod = props.mod === undefined ? g.cycle( frequency ) : props.mod
    
    const readIdx = g.wrap( 
      g.add( 
        g.sub( writeIdx, offset ), 
        mod//g.mul( mod, g.sub( offset, 1 ) ) 
      ), 
      0, 
      delayLength
    )

    const leftInput = isStereo ? input[0] : input

    const delayedOutL = g.peek( delayBufferL, readIdx, { interp:'linear', mode:'samples' })
    
    g.poke( delayBufferL, g.add( leftInput, g.mul( delayedOutL, feedbackCoeff ) ), writeIdx )

    const left = g.add( leftInput, delayedOutL )

    if( isStereo === true ) {
      const rightInput = input[1]
      const delayBufferR = g.data( delayLength )
      
      let delayedOutR = g.peek( delayBufferR, readIdx, { interp:'linear', mode:'samples' })

      g.poke( delayBufferR, g.add( rightInput, g.mul( delayedOutR, feedbackCoeff ) ), writeIdx )
      const right = g.add( rightInput, delayedOutR )

      flanger.graph = [ left, right ]

    }else{
      flanger.graph = left
    }
  }

  flanger.__createGraph()
  flanger.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    flanger,
    flanger.graph, 
    ['fx','flanger'], 
    props 
  ) 

  return out 
}

Flanger.defaults = {
  input:0,
  feedback:.81,
  offset:.125,
  frequency:1
}

return Flanger

}

},{"./effect.js":161,"genish.js":40}],164:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

module.exports = function( Gibberish ) {
  
const allPass = Gibberish.filters.genish.AllPass
const combFilter = Gibberish.filters.genish.Comb

const tuning = {
  combCount:	  	8,
  combTuning: 		[ 1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617 ],                    
  allPassCount: 	4,
  allPassTuning:	[ 225, 556, 441, 341 ],
  allPassFeedback:0.5,
  fixedGain: 		  0.015,
  scaleDamping: 	0.4,
  scaleRoom: 		  0.28,
  offsetRoom: 	  0.7,
  stereoSpread:   23
}

const Freeverb = inputProps => {
  const props = Object.assign( {}, effect.defaults, Freeverb.defaults, inputProps ),
        reverb = Object.create( effect ) 

  let out 
  reverb.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
    }    

    const combsL = [], combsR = []

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          wet1 = g.in( 'wet1'),
          wet2 = g.in( 'wet2' ),  
          dry = g.in( 'dry' ), 
          roomSize = g.in( 'roomSize' ), 
          damping = g.in( 'damping' )
    
    const __summedInput = isStereo === true ? g.add( input[0], input[1] ) : input,
          summedInput = g.mul( __summedInput, inputGain ),
          attenuatedInput = g.memo( g.mul( summedInput, tuning.fixedGain ) )
    
    // create comb filters in parallel...
    for( let i = 0; i < 8; i++ ) { 
      combsL.push( 
        combFilter( 
          attenuatedInput, 
          tuning.combTuning[i], 
          g.mul(damping,.4),
          g.mul( tuning.scaleRoom + tuning.offsetRoom, roomSize ) 
        ) 
      )
      combsR.push( 
        combFilter( 
          attenuatedInput, 
          tuning.combTuning[i] + tuning.stereoSpread, 
          g.mul(damping,.4), 
          g.mul( tuning.scaleRoom + tuning.offsetRoom, roomSize ) 
        ) 
      )
    }
    
    // ... and sum them with attenuated input, use of let is deliberate here
    let outL = g.add( attenuatedInput, ...combsL )
    let outR = g.add( attenuatedInput, ...combsR )
    
    // run through allpass filters in series
    for( let i = 0; i < 4; i++ ) { 
      outL = allPass( outL, tuning.allPassTuning[ i ] + tuning.stereoSpread )
      outR = allPass( outR, tuning.allPassTuning[ i ] + tuning.stereoSpread )
    }
    
    const outputL = g.add( g.mul( outL, wet1 ), g.mul( outR, wet2 ), g.mul( isStereo === true ? input[0] : input, dry ) ),
          outputR = g.add( g.mul( outR, wet1 ), g.mul( outL, wet2 ), g.mul( isStereo === true ? input[1] : input, dry ) )

    reverb.graph = [ outputL, outputR ]
  }

  reverb.__createGraph()
  reverb.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( reverb, reverb.graph, ['fx','freeverb'], props )

  return out
}


Freeverb.defaults = {
  input: 0,
  wet1: 1,
  wet2: 0,
  dry: .5,
  roomSize: .925,
  damping:  .5,
}

return Freeverb 

}


},{"./effect.js":161,"genish.js":40}],165:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let RingMod = inputProps => {
  let props   = Object.assign( {}, RingMod.defaults, effect.defaults, inputProps ),
      ringMod = Object.create( effect ),
      out

  ringMod.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          frequency = g.in( 'frequency' ),
          gain = g.in( 'gain' ),
          mix = g.in( 'mix' )
    
    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain ),
          sine = g.mul( g.cycle( frequency ), gain )
   
    const left = g.add( g.mul( leftInput, g.sub( 1, mix )), g.mul( g.mul( leftInput, sine ), mix ) ) 
        
    if( isStereo === true ) {
      const rightInput = g.mul( input[1], inputGain ),
            right = g.add( g.mul( rightInput, g.sub( 1, mix )), g.mul( g.mul( rightInput, sine ), mix ) ) 
      
      ringMod.graph = [ left, right ]
    }else{
      ringMod.graph = left
    }
  }

  ringMod.__createGraph() 
  ringMod.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    ringMod,
    ringMod.graph, 
    [ 'fx','ringMod'], 
    props 
  )
  
  return out 
}

RingMod.defaults = {
  input:0,
  frequency:220,
  gain: 1, 
  mix:1
}

return RingMod

}

},{"./effect.js":161,"genish.js":40}],166:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
const Tremolo = inputProps => {
  const props   = Object.assign( {}, Tremolo.defaults, effect.defaults, inputProps ),
        tremolo = Object.create( effect )
  
  let out
  tremolo.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          frequency = g.in( 'frequency' ),
          amount = g.in( 'amount' )
    
    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )

    let osc
    if( props.shape === 'square' ) {
      osc = g.gt( g.phasor( frequency ), 0 )
    }else if( props.shape === 'saw' ) {
      osc = g.gtp( g.phasor( frequency ), 0 )
    }else{
      osc = g.cycle( frequency )
    }

    const mod = g.mul( osc, amount )
   
    const left = g.sub( leftInput, g.mul( leftInput, mod ) )

    if( isStereo === true ) {
      const rightInput = g.mul( input[1], inputGain ),
            right = g.mul( rightInput, mod )

      tremolo.graph = [ left, right ]
    }else{
      tremolo.graph = left
    }
  }
  
  tremolo.__createGraph()
  tremolo.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    tremolo,
    tremolo.graph,
    ['fx','tremolo'], 
    props 
  ) 
  return out 
}

Tremolo.defaults = {
  input:0,
  frequency:2,
  amount: 1, 
  shape:'sine'
}

return Tremolo

}

},{"./effect.js":161,"genish.js":40}],167:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
const Vibrato = inputProps => {
  const props   = Object.assign( {}, Vibrato.defaults, effect.defaults, inputProps ),
        vibrato = Object.create( effect )

  let out
  vibrato.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          delayLength = 44100,
          feedbackCoeff = g.in( 'feedback' ),
          modAmount = g.in( 'amount' ),
          frequency = g.in( 'frequency' ),
          delayBufferL = g.data( delayLength )

    const writeIdx = g.accum( 1,0, { min:0, max:delayLength, interp:'none', mode:'samples' })
    
    const offset = g.mul( modAmount, 500 )
    
    const readIdx = g.wrap( 
      g.add( 
        g.sub( writeIdx, offset ), 
        g.mul( g.cycle( frequency ), g.sub( offset, 1 ) ) 
      ), 
      0, 
      delayLength
    )

    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )

    const delayedOutL = g.peek( delayBufferL, readIdx, { interp:'linear', mode:'samples' })
    
    g.poke( delayBufferL, g.add( leftInput, g.mul( delayedOutL, feedbackCoeff ) ), writeIdx )

    const left = delayedOutL

    if( isStereo === true ) {
      const rightInput = g.mul( input[1], inputGain )
      const delayBufferR = g.data( delayLength )
      
      const delayedOutR = g.peek( delayBufferR, readIdx, { interp:'linear', mode:'samples' })

      g.poke( delayBufferR, g.add( rightInput, mul( delayedOutR, feedbackCoeff ) ), writeIdx )
      const right = delayedOutR

      vibrato.graph = [ left, right ]
    }else{
      vibrato.graph = left 
    }
  }

  vibrato.__createGraph()
  vibrato.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    vibrato,
    vibrato.graph,    
    [ 'fx', 'vibrato' ], 
    props 
  ) 
  return out 
}

Vibrato.defaults = {
  input:0,
  feedback:.01,
  amount:.5,
  frequency:4
}

return Vibrato

}

},{"./effect.js":161,"genish.js":40}],168:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

const genish = g

const RL = 7.5e3,
       R = 15e3, 
      VT = 26e-3,
      Is = 10e-16,
       a = 2*RL/R,
       b = (R+2*RL)/(VT*R),
       d = (RL*Is)/VT

// Antialiasing error threshold
const thresh = 10e-10;

const wavestage = in1 => {
  const body = `  const thresh = 10e-10;

  let w = Ln1;
  let expw, p, r, s;

  const e = Math.E
  const pow = Math.pow
  const abs = Math.abs
  for(let i=0; i<1000; i++) {
    expw = pow(e,w);

    p = w*expw - x;
    r = (w+1)*expw;
    s = (w+2)/(2*(w+1));        
    err = (p/(r-(p*s)));

    if (abs(err)<thresh) {
      break;
    }

    w = w - err;
  }

  return w;`

  const Lambert_W = g.process( 'x','Ln1', body )

  const Ln1 = g.history(0),
        Fn1 = g.history(0),
        xn1 = g.history(0)

  {
    'use jsdsp'
    // Compute Antiderivative
    const l = g.sign(in1); 
    let u = d * g.pow( Math.E, l * b * in1 )
    let Ln = Lambert_W.call(u,Ln1.out)
    const Fn = (0.5 * VT/b ) * (Ln * (Ln + 2)) - 0.5*a*in1*in1

    let xn = 0.5 * ( in1 + xn1.out )
    u = d * g.pow( Math.E, l * b * xn )
    Ln = Lambert_W.call( u, Ln1.out )

    //out1 = ;
    // Check for ill-conditioning
    const out1 = g.ifelse(
      g.lt( g.abs( in1 - xn1.out ), thresh), 
      (l * VT * Ln) - ( a * xn ),
      (Fn - Fn1.out) / (in1 - xn1.out)
    )

    // Update States
    Ln1.in( Ln )
    Fn1.in( Fn )
    xn1.in( in1 )

    return out1
  }
}

module.exports = function( Gibberish ) {

  const Wavefolder = inputProps => {

    let props = Object.assign( {}, effect.defaults, Wavefolder.defaults, inputProps ),
        wavefolder = Object.create( effect ),
        out

    wavefolder.__createGraph = function() {
      let isStereo = false
      if( out === undefined ) {
        isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
      }else{
        isStereo = out.input.isStereo
        out.isStereo = isStereo
      }

      const input = g.in( 'input' ),
            gain  = g.in( 'gain' ),
            postgain = g.in( 'postgain' ),
            bias  = g.in( 'bias' )

      let lout
      {
        'use jsdsp'

        const linput = isStereo ? input[0] * gain : input * gain
        lout = linput * .333
        lout = wavestage( wavestage( wavestage( wavestage( bias + lout ) ) ) )
        lout = lout * .6
        lout = g.dcblock( g.tanh( lout ) * postgain )
      }

      wavefolder.graph = lout

      if( isStereo ) {
        let rout
        {
          'use jsdsp'
          const rinput = isStereo ? input[1] * gain : input * gain
          rout = rinput * .333
          rout = wavestage( wavestage( wavestage( wavestage( bias + rout ) ) ) )
          rout = rout * .6
          rout = g.dcblock( g.tanh( rout ) * postgain )
        }

        wavefolder.graph = [ lout, rout ]
      }
    }

    wavefolder.__createGraph()
    wavefolder.__requiresRecompilation = [ 'input' ]

    out = Gibberish.factory( 
      wavefolder,
      wavefolder.graph, 
      [ 'fx','wavefolder' ], 
      props 
    )

    return out 
  }

  Wavefolder.defaults = {
    input:0,
    gain:2,
    postgain:1,
    bias:0
  }

  return [ Wavefolder, wavestage ]

}

},{"./effect.js":161,"genish.js":40}],169:[function(require,module,exports){
let MemoryHelper = require( 'memory-helper' ),
    genish       = require( 'genish.js' )
    
let Gibberish = {
  blockCallbacks: [], // called every block
  dirtyUgens: [],
  callbackUgens: [],
  callbackNames: [],
  analyzers: [],
  graphIsDirty: false,
  ugens: {},
  debug: false,
  id: -1,
  preventProxy:false,
  proxyEnabled: true,

  output: null,

  memory : null, // 20 minutes by default?
  factory: null, 
  genish,
  scheduler: require( './scheduling/scheduler.js' ),
  //workletProcessorLoader: require( './workletProcessor.js' ),
  workletProcessor: null,

  memoed: {},
  mode:'scriptProcessor',

  prototypes: {
    ugen: null,//require('./ugen.js'),
    instrument: require( './instruments/instrument.js' ),
    effect: require( './fx/effect.js' ),
    analyzer: require( './analysis/analyzer.js' )
  },

  mixins: {
    polyinstrument: require( './instruments/polyMixin.js' )
  },

  workletPath: './gibberish_worklet.js',

  init( memAmount, ctx, mode='worklet', ctxOptions ) {
    let numBytes = isNaN( memAmount ) ? 20 * 60 * 44100 : memAmount

    // regardless of whether or not gibberish is using worklets,
    // we still want genish to output vanilla js functions instead
    // of audio worklet classes; these functions will be called
    // from within the gibberish audioworklet processor node.
    this.genish.gen.mode = 'scriptProcessor'

    this.memory = MemoryHelper.create( numBytes, Float64Array )

    this.mode = mode

    const startup = this.utilities.createWorklet

    this.scheduler.init( this )
    
    this.analyzers.dirty = false

    if( this.mode === 'worklet' ) {

      const p = new Promise( (resolve, reject ) => {

        const pp = new Promise( (__resolve, __reject ) => {
          this.utilities.createContext( ctx, startup.bind( this.utilities ), __resolve, ctxOptions )
        }).then( ()=> {
          Gibberish.preventProxy = true
          Gibberish.load()
          Gibberish.preventProxy = false
          Gibberish.output = this.Bus2()

          // Gibberish.output needs to be assign so that ugens can
          // connect to it by default. There's no other way to assign it
          // outside of evaling code at this point.
          Gibberish.worklet.port.postMessage({ 
            address:'eval', 
            code:`Gibberish.output = this.ugens.get(${Gibberish.output.id});` 
          })

          resolve()
        })

      })
      
      return p

    }else if( this.mode === 'processor' ) {
      Gibberish.load()
    }
  },

  load() {
    this.factory      = require( './factory.js' )( this )
    
    this.Panner       = require( './misc/panner.js' )( this )
    this.PolyTemplate = require( './instruments/polytemplate.js' )( this )
    this.oscillators  = require( './oscillators/oscillators.js' )( this )
    this.filters      = require( './filters/filters.js' )( this )
    this.binops       = require( './misc/binops.js' )( this )
    this.monops       = require( './misc/monops.js' )( this )
    this.Bus          = require( './misc/bus.js' )( this )
    this.Bus2         = require( './misc/bus2.js' )( this )
    this.instruments  = require( './instruments/instruments.js' )( this )
    this.fx           = require( './fx/effects.js' )( this )
    this.Sequencer    = require( './scheduling/sequencer.js' )( this )
    this.Sequencer2   = require( './scheduling/seq2.js' )( this )
    this.Tidal        = require( './scheduling/tidal.js' )( this )
    this.envelopes    = require( './envelopes/envelopes.js' )( this )
    this.analysis     = require( './analysis/analyzers.js' )( this )
    this.time         = require( './misc/time.js' )( this )
    this.Proxy        = require( './workletProxy.js' )( this )
  },

  export( target, shouldExportGenish=false ) {
    if( target === undefined ) throw Error('You must define a target object for Gibberish to export variables to.')

    if( shouldExportGenish ) this.genish.export( target )

    this.instruments.export( target )
    this.fx.export( target )
    this.filters.export( target )
    this.oscillators.export( target )
    this.binops.export( target )
    this.monops.export( target )
    this.envelopes.export( target )
    this.analysis.export( target )
    target.Sequencer = this.Sequencer
    target.Sequencer2 = this.Sequencer2
    target.Bus = this.Bus
    target.Bus2 = this.Bus2
    target.Scheduler = this.scheduler
    target.Tidal = this.Tidal
    this.time.export( target )
    this.utilities.export( target )
  },

  printcb() { 
    Gibberish.worklet.port.postMessage({ address:'callback' }) 
  },
  printobj( obj ) {
    Gibberish.worklet.port.postMessage({ address:'print', object:obj.id }) 
  },
  send( msg ){
    Gibberish.worklet.port.postMessage( msg )
  },

  dirty( ugen ) {
    if( ugen === this.analyzers ) {
      this.graphIsDirty = true
      this.analyzers.dirty = true
    } else {
      this.dirtyUgens.push( ugen )
      this.graphIsDirty = true
      if( this.memoed[ ugen.ugenName ] ) {
        delete this.memoed[ ugen.ugenName ]
      }
    } 
  },

  clear() {
    // do not delete the gain and the pan of the master bus 
    this.output.inputs.splice( 0, this.output.inputs.length - 2 )
    //this.output.inputNames.length = 0
    this.analyzers.length = 0
    this.scheduler.clear()
    this.dirty( this.output )
    if( this.mode === 'worklet' ) {
      this.worklet.port.postMessage({ 
        address:'method', 
        object:this.id,
        name:'clear',
        args:[]
      })
    }
    // clear memory... XXX should this be a MemoryHelper function?
    //this.memory.heap.fill(0)
    //this.memory.list = {}

    Gibberish.genish.gen.removeAllListeners('memory init')
    Gibberish.genish.gen.histories.clear()

    //Gibberish.output = this.Bus2()
    
  },

  // used to sort analysis ugens by priority.
  // higher priorities mean lower ordering in the array,
  // which means they will run first in the callback function.
  // by defult, analysis ugens are assigned a priority of 0 in the
  // analysis prototype.
  analysisCompare( a,b ) {
    return (isNaN(b.priority) ? 0 : b.priority) - (isNaN(a.priority) ? 0: a.priority )
  },

  generateCallback() {
    if( this.mode === 'worklet' ) {
      Gibberish.callback = function() { return 0 }
      Gibberish.callback.out = []
      return Gibberish.callback
    }
    let uid = 0,
        callbackBody, lastLine, analysis=''

    this.memoed = {}

    callbackBody = this.processGraph( this.output )
    lastLine = callbackBody[ callbackBody.length - 1]
    callbackBody.unshift( "\t'use strict'" )

    this.analyzers
      .sort( this.analysisCompare )
      .forEach( v=> {
        const analysisBlock = Gibberish.processUgen( v )
        //if( Gibberish.mode === 'processor' ) {
        //  console.log( 'analysis:', analysisBlock, v  )
        //}
        let analysisLine

        if( typeof analysisBlock === 'object' ) {
          analysisLine = analysisBlock.pop()

          analysisBlock.forEach( v => {
            callbackBody.splice( callbackBody.length - 1, 0, v )
          })
        }else{
          analysisLine = analysisBlock
        }

        callbackBody.push( analysisLine )
      })

    this.analyzers.forEach( v => {
      if( this.callbackUgens.indexOf( v.callback ) === -1 )
        this.callbackUgens.push( v.callback )
    })


    callbackBody.push( '\n\treturn ' + lastLine.split( '=' )[0].split( ' ' )[1] )

    if( this.debug === true ) console.log( 'callback:\n', callbackBody.join('\n') )
    
    // XXX added unshift 'input' here
    this.callbackNames = this.callbackUgens.map( v => v.ugenName )
    this.callbackNames.push( 'mem' )
    this.callbackNames.push( 'input' )
    
    // ... and here
    this.callbackUgens.push( this.memory.heap )
    // XXX added 0 to represent mic input
    this.callbackUgens.push( 0 )

    this.callback = Function( ...this.callbackNames, callbackBody.join( '\n' ) )
    this.callback.out = []

    if( this.oncallback ) this.oncallback( this.callback )

    return this.callback 
  },

  processGraph( output ) {
    this.callbackUgens.length = 0
    this.callbackNames.length = 0

    this.callbackUgens.push( output.callback )

    let body = this.processUgen( output )
    

    this.dirtyUgens.length = 0
    this.graphIsDirty = false

    return body
  },
  proxyReplace( obj ) {
    if( typeof obj === 'object' && obj !== null ) {
      if( obj.id !== undefined ) {
        const __obj = Gibberish.processor.ugens.get( obj.id )
        //console.log( 'retrieved:', __obj.name )

        //if( obj.prop !== undefined ) console.log( 'got a ssd.out', obj )
        return obj.prop !== undefined ? __obj[ obj.prop ] : __obj
      }else if( obj.isFunc === true ) {
        let func =  eval( '(' + obj.value + ')' )

        //console.log( 'replacing function:', func )

        return func
      }
    }

    return obj
  },

  processUgen( ugen, block ) {
    if( block === undefined ) block = []
    if( ugen === undefined ) return block

    let dirtyIdx = Gibberish.dirtyUgens.indexOf( ugen )

    let memo = Gibberish.memoed[ ugen.ugenName ]

    if( memo !== undefined ) {
      return memo
    } else if( ugen === true || ugen === false ) {
      throw "Why is ugen a boolean? [true] or [false]";
    } else if( ugen.block === undefined || dirtyIndex !== -1 ) {
      // weird edge case with analysis (follow) ugen
      if( ugen.id === undefined ) {
        ugen.id = ugen.__properties__.overrideid
      }

      let line = `\tconst v_${ugen.id} = ` 

      // ugens can have custom callback strings so that they
      // bypass codegen. currently Input is the only one that does this,
      // it simply accepts the worklet input as its argument.
      if( ugen.callbackString !== undefined ) {
        line += ugen.callbackString
      }else{
        if( !ugen.isop ) line += `${ugen.ugenName}( `

        // must get array so we can keep track of length for comma insertion
        const keys = ugen.isop === true || ugen.type === 'bus'  
          ? Object.keys( ugen.inputs ) 
          : [...ugen.inputNames ] 

        line = ugen.isop === true 
          ? Gibberish.__processBinop( ugen, line, block, keys ) 
          : Gibberish.__processNonBinop( ugen, line, block, keys )

        line = Gibberish.__addLineEnding( line, ugen, keys )
      }

      block.push( line )
      
      Gibberish.memoed[ ugen.ugenName ] = `v_${ugen.id}`

      if( dirtyIdx !== -1 ) {
        Gibberish.dirtyUgens.splice( dirtyIdx, 1 )
      }

    }else if( ugen.block ) {
      return ugen.block
    }

    return block
  }, 

  __processBinop( ugen, line, block, keys ) {
    //__getInputString( line, input, block, key, ugen ) {
    const isLeftStereo = Gibberish.__isStereo( ugen.inputs[0] ), 
          isRightStereo = Gibberish.__isStereo( ugen.inputs[1] ),
          left = Gibberish.__getInputString( line, ugen.inputs[0], block, '0', keys ),
          right= Gibberish.__getInputString( line, ugen.inputs[1], block, '1', keys ),
          op = ugen.op
        
    let graph, out

    if( isLeftStereo === true && isRightStereo === false ) {
      line += `[ ${left}[0] ${op} ${right}, ${left}[1] ${op} ${right} ]`
      //graph = [ g.add( args[0].graph[0], args[1] ), g.add( args[0].graph[1], args[1] )]
    }else if( isLeftStereo === false && isRightStereo === true ) {
      //graph = [ g.add( args[0], args[1].graph[0] ), g.add( args[0], args[1].graph[1] )]
      line += `[ ${left} ${op} ${right}[0], ${left} ${op} ${right}[1] ]`
    }else if( isLeftStereo === true && isRightStereo === true ) {
      //graph = [ g.add( args[0].graph[0], args[1].graph[0] ), g.add( args[0].graph[1], args[1].graph[1] )]
      line += `[ ${left}[0] ${op} ${right}[0], ${left}[1] ${op} ${right}[1] ]`
    }else{
      // XXX important, must re-assign when calling processNonBinop
      line = Gibberish.__processNonBinop( ugen, line, block, keys )
    }
    
    return line
  },

  __processNonBinop( ugen, line, block, keys ) {
    for( let i = 0; i < keys.length; i++ ) {
      let key = keys[ i ]
      // binop.inputs is actual values, not just property names
      let input 
      if( ugen.isop || ugen.type ==='bus' ) {
        input = ugen.inputs[ key ]
      }else{
        input = ugen[ key ] 
      }

      if( input !== undefined ) { 
        input = Gibberish.__getBypassedInput( input )
        line += Gibberish.__getInputString( line, input, block, key, ugen )
        line  = Gibberish.__addSeparator( line, input, ugen, i < keys.length - 1 )
      }
    }

    return line
  },

  // determine if a ugen is stereo
  __isStereo( ugen ) {
    let isStereo = false

    if( ugen === undefined || ugen === null ) return false

    if( ugen.isStereo === true ) return true

    if( ugen.isop === true ) {
      return Gibberish.__isStereo( ugen.inputs[0] ) || Gibberish.__isStereo( ugen.inputs[1] )
    }
    
    return isStereo
  },

  // if an effect is bypassed, get next one in chain (or output destination)
  __getBypassedInput( input ) {
    if( input.bypass === true ) {
      // loop through inputs of chain until one is found
      // that is not being bypassed

      let found = false

      while( input.input !== 'undefined' && found === false ) {
        if( typeof input.input.bypass !== 'undefined' ) {
          input = input.input
          if( input.bypass === false ) found = true
        }else{
          input = input.input
          found = true
        }
      }
    }

    return input
  },

  // get a string representing a ugen for insertion into callback.
  // if a ugen contains other ugens, trigger codegen for those ugens as well.
  __getInputString( line, input, block, key, ugen ) {
    let value = ''
    if( typeof input === 'number' ) {
      if( isNaN(key) ) {
        value += `mem[${ugen.__addresses__[ key ]}]`//input
      }else{
        value += input
      }
    } else if( typeof input === 'boolean' ) {
      value += '' + input
    }else{
      //console.log( 'key:', key, 'input:', ugen.inputs, ugen.inputs[ key ] ) 
      // XXX not sure why this has to be here, but somehow non-processed objects
      // that only contain id numbers are being passed here...

      if( input !== undefined ) {
        if( Gibberish.mode === 'processor' ) {
          if( input.ugenName === undefined && input.id !== undefined  ) {
            if( ugen === undefined  ) {
              input = Gibberish.processor.ugens.get( input.id )
            }else{
              if( ugen.type !== 'seq' ) {
                input = Gibberish.processor.ugens.get( input.id )
              }
            }
          }
        }

        Gibberish.processUgen( input, block )

        if( !input.isop ) {
          // check is needed so that graphs with ssds that refer to themselves
          // don't add the ssd in more than once
          if( Gibberish.callbackUgens.indexOf( input.callback ) === -1 ) {
            Gibberish.callbackUgens.push( input.callback )
          }
        }

        value += `v_${input.id}`
        input.__varname = value
      }
    }

    return value
  },

  // add separators for function calls and handle binops (mono only)
  __addSeparator( line, input, ugen, isNotEndOfLine ) {
    if( isNotEndOfLine === true ) {
      if( ugen.isop === true ) {
        if( ugen.op === '*' || ugen.op === '/' ) {
          if( input !== 1 ) {
            line += ' ' + ugen.op + ' '
          }else{
            line = line.slice( 0, -1 * (''+input).length )
          }
        }else{
          line += ' ' + ugen.op + ' '
        }
      }else{
        line += ', '
      }
    }

    return line
  },

  // add memory to end of function calls and close parenthesis 
  __addLineEnding( line, ugen, keys ) {
    if( (ugen.type === 'bus' && keys.length > 0) ) line += ', '
    if( !ugen.isop && ugen.type !== 'seq' ) line += 'mem'
    line += ugen.isop ? '' : ' )'

    return line
  },

}

Gibberish.prototypes.Ugen = Gibberish.prototypes.ugen = require( './ugen.js' )( Gibberish )
Gibberish.utilities = require( './utilities.js' )( Gibberish )

module.exports = Gibberish

},{"./analysis/analyzer.js":135,"./analysis/analyzers.js":136,"./envelopes/envelopes.js":141,"./factory.js":146,"./filters/filters.js":153,"./fx/effect.js":161,"./fx/effects.js":162,"./instruments/instrument.js":179,"./instruments/instruments.js":180,"./instruments/polyMixin.js":185,"./instruments/polytemplate.js":186,"./misc/binops.js":192,"./misc/bus.js":193,"./misc/bus2.js":194,"./misc/monops.js":195,"./misc/panner.js":196,"./misc/time.js":197,"./oscillators/oscillators.js":200,"./scheduling/scheduler.js":204,"./scheduling/seq2.js":205,"./scheduling/sequencer.js":206,"./scheduling/tidal.js":207,"./ugen.js":208,"./utilities.js":209,"./workletProxy.js":210,"genish.js":40,"memory-helper":212}],170:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g
  
module.exports = function( Gibberish ) {

  const Clap = argumentProps => {
    'use jsdsp' 

    const clap = Object.create( instrument ),
          decay = g.in( 'decay' ), // 0-1 input value
          scaledDecay = decay * (g.gen.samplerate * 2 ),
          gain  = g.in( 'gain' ),
          spacing = g.in( 'spacing' ), // spacing between clap, in Hzs
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          cutoff = g.in('cutoff'),
          Q      = g.in('Q')

    const props = Object.assign( {}, Clap.defaults, argumentProps )

    const eg = g.decay( scaledDecay, { initValue:0 } ), 
          check = g.gt( eg, .0005 ),
          noise = -1 + g.noise() * 2,
          rnd = noise,//g.gtp( noise, 0 ),// * eg,
          b   = g.bang(),
          saw = g.phasor( spacing, b, { min:0 }),
          rsaw = 1 - saw,
          saw_env = g.ad( 0, .035 * g.gen.samplerate, { shape:'linear' }), 
          b2 = g.bang(),
          count = g.accum( 1,b2,{ max:Infinity, min:0, initialValue:0 }),
          delayedNoise = g.switch( g.gte( count, g.gen.samplerate * .035 ), rnd, 0 ),
          bpf1 = g.svf( delayedNoise, 1000, .5, 2, false ),

          scaledOut = ( bpf1 * eg + ( rnd * rsaw * saw_env ) ) * gain * loudness * triggerLoudness,
          out = g.svf( scaledOut, cutoff, Q, 1, false )
    
    // XXX TODO : make this work with ifelse. the problem is that poke ugens put their
    // code at the bottom of the callback function, instead of at the end of the
    // associated if/else block.
    const ife = g.switch( check, out, 0 )
    
    clap.env = {
      trigger( vol ) {
        b.trigger()
        eg.trigger( vol )
        b2.trigger()
        saw_env.trigger()
      }
    } 
    
    return Gibberish.factory( clap, ife, ['instruments','clap'], props  )
  }
  
  Clap.defaults = {
    gain: 1,
    spacing:100,
    decay:.2,
    loudness:1,
    __triggerLoudness:1,
    cutoff:900,
    Q:.85
  }

  return Clap

}

},{"./instrument.js":179,"genish.js":40}],171:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' ),
      __wavefold   = require( '../fx/wavefolder.dsp.js' )

const genish = g

module.exports = function( Gibberish ) {
  const wavefold = __wavefold( Gibberish )[1]

  const Complex = inputProps => {
    const syn = Object.create( instrument )

    const frequency = g.in( 'frequency' ),
          loudness  = g.in( 'loudness' ), 
          triggerLoudness = g.in( '__triggerLoudness' ),
          glide   = g.max( 1, g.in( 'glide' ) ),
          slidingFreq = g.slide( frequency, glide, glide ),
          attack  = g.in( 'attack' ), 
          decay   = g.in( 'decay' ),
          sustain = g.in( 'sustain' ), 
          sustainLevel = g.in( 'sustainLevel' ),
          release = g.in( 'release' ),
          pregain = g.in( 'pregain' ),
          postgain= g.in( 'postgain' ),
          bias    = g.in( 'bias' )

    const props = Object.assign( {}, Complex.defaults, inputProps )
    Object.assign( syn, props )

    syn.__createGraph = function() {
      const osc = Gibberish.oscillators.factory( syn.waveform, slidingFreq, syn.antialias )

      const env = Gibberish.envelopes.factory( 
        props.useADSR, 
        props.shape, 
        attack, decay, 
        sustain, sustainLevel, 
        release, 
        props.triggerRelease
      )

      const saturation = g.in('saturation')

      // below doesn't work as it attempts to assign to release property triggering codegen...
      // syn.release = ()=> { syn.env.release() }

      {
        'use jsdsp'
        let oscWithEnv = osc * env * loudness * triggerLoudness,
            panner

        let foldedOsc = wavefold( wavefold( wavefold( wavefold( bias + oscWithEnv * (pregain * env) * .333 ) ) ) )
        foldedOsc = g.tanh( foldedOsc * .6 ) * postgain
 
        // 16 is an unfortunate empirically derived magic number...
        const baseCutoffFreq = g.in('cutoff') * ( frequency /  ( g.gen.samplerate / 16 ) ) 
        const cutoff = g.min( baseCutoffFreq * g.pow( 2, g.in('filterMult') * loudness * triggerLoudness ) * env, .995 ) 
        const filteredOsc = Gibberish.filters.factory( foldedOsc, cutoff, saturation, props )

        let complexWithGain = filteredOsc * g.in( 'gain' )
        // XXX ugly, ugly hack
        if(  props.filterModel !== 2 ) complexWithGain = complexWithGain * saturation
    
        complexWithGain = g.dcblock( complexWithGain )

        if( syn.panVoices === true ) { 
          panner = g.pan( complexWithGain, complexWithGain, g.in( 'pan' ) ) 
          syn.graph = [ panner.left, panner.right ]
        }else{
          syn.graph = complexWithGain
        }

        syn.env = env
        syn.osc = osc
        syn.filter = filteredOsc
      }

    }
    
    syn.__requiresRecompilation = [ 'waveform', 'antialias', 'filterModel','filterMode', 'useADSR', 'shape' ]
    syn.__createGraph()

    const out = Gibberish.factory( syn, syn.graph, ['instruments', 'complex'], props  )

    return out
  }
  
  Complex.defaults = {
    waveform:'triangle',
    attack: 44,
    decay: 22050,
    sustain:44100,
    sustainLevel:.6,
    release:22050,
    useADSR:false,
    shape:'exponential',
    triggerRelease:false,
    gain: .5,
    pulsewidth:.25,
    frequency:220,
    pan: .5,
    antialias:true,
    panVoices:false,
    loudness:1,
    __triggerLoudness:1,
    glide:1,
    saturation:1,
    filterMult:2,
    Q:.25,
    cutoff:.5,
    //filterType:1,
    filterModel:1,
    filterMode:0,
    isStereo:false,
    pregain:4,
    postgain:1,
    bias:0
  }

  // do not include velocity, which shoudl always be per voice
  let PolyComplex = Gibberish.PolyTemplate( Complex, ['frequency','attack','decay','pulsewidth','pan','gain','glide', 'saturation', 'filterMult', 'Q', 'cutoff', 'resonance', 'antialias', 'filterModel', 'waveform', 'filterMode', '__triggerLoudness', 'loudness', 'pregain', 'postgain', 'bias'] ) 
  PolyComplex.defaults = Complex.defaults

  return [ Complex, PolyComplex ]

}

},{"../fx/wavefolder.dsp.js":168,"./instrument.js":179,"genish.js":40}],172:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Conga = argumentProps => {
    const conga = Object.create( instrument ),
          frequency = g.in( 'frequency' ),
          decay = g.in( 'decay' ),
          gain  = g.in( 'gain' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' )

    const props = Object.assign( {}, Conga.defaults, argumentProps )

    const trigger = g.bang(),
          Loudness = g.mul( triggerLoudness,loudness ),
          impulse = g.mul( trigger, 60 ),
          _decay =  g.sub( .101, g.div( g.min( decay, 1), 10 ) ), // create range of .001 - .099
          bpf = g.svf( impulse, frequency, _decay, 2, false ),
          out = g.mul( bpf, g.mul( Loudness, gain ) )
    
    conga.env = trigger

    if( props.panVoices === true ) {  
      const panner = g.pan( bpf, bpf, g.in( 'pan' ) )
      conga.graph = [ 
        g.mul( panner.left, gain, Loudness ), 
        g.mul( panner.right, gain, Loudness ) 
      ]
      conga.isStereo = true
    }else{
      conga.graph = out//g.mul( filteredOsc, g.in('gain'), Loudness )
      conga.isStereo = false
    }

    return Gibberish.factory( conga, conga.graph, ['instruments','conga'], props  )
  }
  
  Conga.defaults = {
    gain: .125,
    frequency:190,
    decay: .85,
    loudness: 1,
    pan:.5,
    __triggerLoudness:1,
    panVoices:false
  }

  const PolyConga = Gibberish.PolyTemplate( Conga, ['gain','frequency','decay','loudness','__triggerLoudness', 'pan' ] ) 
  PolyConga.defaults = Conga.defaults

  return [ Conga, PolyConga ]
}

},{"./instrument.js":179,"genish.js":40}],173:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Cowbell = argumentProps => {
    let cowbell = Object.create( instrument )
    
    const decay   = g.in( 'decay' ),
          gain    = g.in( 'gain' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' )

    const props = Object.assign( {}, Cowbell.defaults, argumentProps )

    const bpfCutoff = g.param( 'bpfc', 1000 ),
          s1 = Gibberish.oscillators.factory( 'square', 560 ),
          s2 = Gibberish.oscillators.factory( 'square', 845 ),
          eg = g.decay( g.mul( decay, g.gen.samplerate * 2 ), { initValue:0 }), 
          bpf = g.svf( g.add( s1,s2 ), bpfCutoff, 3, 2, false ),
          envBpf = g.mul( bpf, eg ),
          out = g.mul( envBpf, g.mul( gain, loudness, triggerLoudness ) )

    cowbell.env = eg 

    cowbell.isStereo = false

    cowbell = Gibberish.factory( cowbell, out, ['instruments', 'cowbell'], props  )
    
    return cowbell
  }
  
  Cowbell.defaults = {
    gain: 1,
    decay:.5,
    loudness:1,
    __triggerLoudness:1
  }

  return Cowbell

}

},{"./instrument.js":179,"genish.js":40}],174:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g

module.exports = function( Gibberish ) {
  const proto = Object.create( instrument )
  const memo = {}
  
  Object.assign( proto, {
    pickFile( sample ) {
      this.currentSample = sample
    },
    pick( __idx ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
    },
    pickplay( __idx, rate=null, length=null, start=null ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
      return this.trigger( null, rate, length, start )
    },
    note( rate ) {
      //this.rate = rate
      return this.trigger( null, rate )
    },
    setpan( num=0, value=.5 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.pan.memory.values.idx )
        voice.pan = value
      }
    },
    setrate( num=0, value=1 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.rate.memory.values.idx )
        voice.rate = value
        voice.envrate = 1024 / g.gen.memory.heap[ voice.bufferLength.memory.values.idx ]
        
        const samplerRate = typeof this.rate === 'object' ? 1 : this.rate
        const dir = Math.sign( voice.rate ) === Math.sign( samplerRate ) ? 1 : 0

        if( dir === 1 ) {
          // trigger the bang assigned to the reset property of the 
          // counter object representing phase for the voice
          voice.trigger()
        }else{
          // reset the value of the phase counter to the 
          // end of the sample for reverse playback
          voice.phase.value = sampler.dataLength - 1
        }
        
      }
    },
    trigger( volume=null, rate=null, length=null, start = null ) {
      'no jsdsp'
      if( volume !== null ) this.__triggerLoudness = volume

      let voice = null
      if( Gibberish.mode === 'processor' ) {
        const sampler = this.samplers[ this.currentSample ]

        // if sample isn't loaded...
        if( sampler === undefined ) return

        voice = this.__getVoice__()

        // set voice buffer length
        g.gen.memory.heap[ voice.bufferLength.memory.values.idx ] = sampler.dataLength

        // set voice data index
        g.gen.memory.heap[ voice.bufferLoc.memory.values.idx ] = sampler.dataIdx

        
        // assume voice plays forward if no rate is provided
        // global rate for sampler can still be used to reverse
        voice.rate   = rate   !== null ? rate   : 1
        voice.length = length !== null ? length : 1
        voice.start  = start  !== null ? start  : 0

        // determine direction voice will play at by checking sign
        // of voice.rate and sampler.rate. If both are the same,
        // then the direction will be forward, as they are multiplied
        // ... two positives or two negatives will both create a 
        // positive value

        // assume positive value if a modulation is applied to rate
        //const samplerRate = typeof this.rate === 'object' ? 1 : this.rate
        const dir = Math.sign( voice.rate )// === Math.sign( samplerRate ) ? 1 : 0

        if( dir === 1 ) {
          // trigger the bang assigned to the reset property of the 
          // counter object representing phase for the voice, and
          // it's also attached to each voice's envelope.
          voice.trigger()
        }else{
          // must set phase values of both 
          // grain reader and envelope
          voice.envphase.value = 0
          voice.phase.value = (start+length)*sampler.dataLength 
        }
      }

      return voice
    },
    __getVoiceStatic__() {
      return this.voices[ this.voiceCount % this.voices.length ]
    },
    __getVoice__() {
      const v = this.voices[ this.voiceCount % this.voices.length ]
      this.voiceCount++
      return v
    },
  })

  const Sampler = inputProps => {
    const syn = Object.create( proto )
    const props = Object.assign( { onload:null, voiceCount:0, files:[] }, Sampler.defaults, inputProps )
    const env = g.env({ length:1024, type:props.env, alpha:props.envalpha })

    syn.isStereo = props.isStereo !== undefined ? props.isStereo : false

    const start = g.in( 'start' ), length = g.in( 'length' ),
          rate = g.in( 'rate' ), shouldLoop = g.in( 'loops' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          // rate storage is used to determine whether we're playing
          // the sample forward or in reverse, for use in the 'trigger' method.
          rateStorage = g.data([0], 1, { meta:true })

    Object.assign( syn, props )

    if( Gibberish.mode === 'worklet' ) {
      syn.__meta__ = {
        address:'add',
        name: ['instruments', 'Grains'],
        properties: JSON.stringify(props), 
        id: syn.id
      }

      Gibberish.worklet.ugens.set( syn.id, syn )

      Gibberish.worklet.port.postMessage( syn.__meta__ )
    }

    const voices = []
    for( let i = 0; i < syn.maxVoices; i++ ) {

      const voice = {
        bufferLength: g.data( [1], 1, { meta:true }),
        bufferLoc:    g.data( [1], 1, { meta:true }),
        bang: g.bang(),
        // XXX how do I change this from main thread?
        __pan: g.data( [.5], 1, { meta:true }),
        __rate: g.data( [1], 1, { meta:true }),
        __envrate:g.data([1],1, { meta:true }),
        __start: g.data( [0], 1, { meta:true }),
        __length: g.data( [1], 1, { meta:true }),
        __shouldLoop: g.data( [1], 1, { meta:true }),
        __loudness:  g.data( [1], 1, { meta:true }),
        __cutoff:  g.data( [.5], 1, { meta:true }),
        __Q:  g.data( [.25], 1, { meta:true }),

        get Q() { 
          return g.gen.memory.heap[ this.__Q.memory.values.idx   ]
        },
        set Q( v ) {
          g.gen.memory.heap[ this.__Q.memory.values.idx ] = v
        },
        get loudness() { 
          return g.gen.memory.heap[ this.__loudness.memory.values.idx   ]
        },
        set loudness( v ) {
          g.gen.memory.heap[ this.__loudness.memory.values.idx ] = v
        },
        get cutoff() { 
          return g.gen.memory.heap[ this.__cutoff.memory.values.idx   ]
        },
        set cutoff( v ) {
          g.gen.memory.heap[ this.__cutoff.memory.values.idx ] = v
        },
        set pan(v) {
          g.gen.memory.heap[ this.__pan.memory.values.idx ] = v
        },
        set rate(v) {
          g.gen.memory.heap[ this.__rate.memory.values.idx ] = v
        },
        get rate() {
          return g.gen.memory.heap[ this.__rate.memory.values.idx ]
        },
        set envrate(v) {
          g.gen.memory.heap[ this.__envrate.memory.values.idx ] = v
        },
        get envrate() {
          return g.gen.memory.heap[ this.__envrate.memory.values.idx ]
        },

        set start(v) {
          g.gen.memory.heap[ this.__start.memory.values.idx ] = v
        },
        get start() {
          return g.gen.memory.heap[ this.__start.memory.values.idx ]
        },
        set length(v) {
          'no jsdsp'
          g.gen.memory.heap[ this.__length.memory.values.idx ] = v

          // *** must also set rate for indexing of envelope ***
          // get length of sample being played
          const len = g.gen.memory.heap[ this.bufferLength.memory.values.idx ]
          // all envelopes are 1024 samples long
          const envrate = 1024 / (len * v)

          //console.log( 'envrate:', envrate, len, v )
          // rate is accounted for in the increment for the envphase counter
          g.gen.memory.heap[ this.__envrate.memory.values.idx ] = envrate
        },
        get length() {
          return g.gen.memory.heap[ this.__length.memory.values.idx ]
        },
      }
      'use jsdsp'

      voice.envphase = g.counter( 
        //.0005,
        //voice.__envrate[0] * 2,
        g.abs(rate * voice.__rate[0] * voice.__envrate[0]),  
        0,
        1023, 
        voice.bang,
        0, // was shouldLoop 
        { shouldWrap:false, initialValue:9999999 }
      )

      voice.envpeek = g.peek( env, voice.envphase, { mode:'samples' })
      voice.end = (voice.__start[0]+start+voice.__length[0]) * voice.bufferLength[0]

      voice.phase = g.counter( 
        rate * voice.__rate[0], 
        (voice.__start[0]+start) * voice.bufferLength[0],
        voice.end,
        voice.bang,
        0, // was shouldLoop 
        { shouldWrap:true, initialValue:9999999 }
      )

      voice.trigger = voice.bang.trigger

      // XXX the start values must be added together, because if multiplying 
      // and one is zero then their product will always be zero. obvi not obvi.
      const grainstart = (voice.__start[0]+start) * voice.bufferLength[0]
      const grainend   = (voice.__start[0]+start+voice.__length[0]) * voice.bufferLength[0]
      const grainread  = g.peekDyn( 
          voice.bufferLoc[0], 
          voice.bufferLength[0],
          voice.phase,
          { mode:'samples' }
        )
 
      voice.graph = g.ifelse(
        // if phase is greater than start and less than end... 
        g.and( 
          g.gte( voice.phase, grainstart ), 
          g.lte( voice.phase, grainend )
        ),
        // ...read data and mul by envelope
        grainread * voice.envpeek, 
        // ...else return 0
        0
      ) 
      * loudness 
      * voice.__loudness[0] 

      voice.graph = Gibberish.genish.biquad( voice.graph, voice.__cutoff[0], voice.__Q[0], 2, false )
      const pan = g.pan( voice.graph, voice.graph, voice.__pan[0] )
      voice.graph = [ pan.left, pan.right ]

      voices.push( voice )
    }

    // load in sample data
    const samplers = {}

    // bound to individual sampler objects in loadSample function
    syn.loadBuffer = function( buffer, onload ) {
      // main thread: when sample is loaded, copy it over message port
      // processor thread: onload is called via messageport handler, and
      // passed in the new buffer to be copied.
      if( Gibberish.mode === 'worklet' ) {
        const memIdx = Gibberish.memory.alloc( this.data.buffer.length, true )

        Gibberish.worklet.port.postMessage({
          address:'copy_multi',
          id:     syn.id,
          buffer: this.data.buffer,
          filename: this.filename
        })

        if( typeof onload === 'function' ) onload( this, buffer )

      }else if( Gibberish.mode === 'processor' ) {
        this.data.buffer = buffer 

        // set data memory spec before issuing memory request
        this.dataLength = this.data.memory.values.length = this.data.dim = this.data.buffer.length

        // request memory to copy the bufer over
        g.gen.requestMemory( this.data.memory, false )
        g.gen.memory.heap.set( this.data.buffer, this.data.memory.values.idx )

        // set location of buffer (does not work)
        this.dataIdx = this.data.memory.values.idx

        syn.currentSample = this.filename
      }
    }

    syn.loadSample = function( filename, __onload, buffer=null ) {
      'use jsdsp'

      const sampler = samplers[ filename ] = {
        dataLength: null,
        dataIdx: null,
        buffer: null,
        filename
      }

      const onload = syn.loadBuffer.bind( sampler ) 
      // passing a filename to data will cause it to be loaded in the main thread
      // onload will then be called to pass the buffer over the messageport. In the
      // processor thread, make a placeholder until data is available.
      if( Gibberish.mode === 'worklet' ) {
        sampler.data = g.data( buffer !== null ? buffer : filename, 1, { onload })

        // check to see if a promise is returned; a valid
        // data object is only return if the file has been
        // previously loaded and the corresponding buffer has
        // been cached.
        if( sampler.data instanceof Promise ) {
          sampler.data.then( d => {
            sampler.data = d
            memo[ filename ] = sampler.data 
            onload( sampler, __onload )
          })
        }else{
          // using a cached data buffer, no need
          // for asynchronous loading.
          memo[ filename ] = sampler
          onload( sampler, __onload )
        }     
      }else{
        sampler.data = g.data( new Float32Array(), 1, { onload, filename })
        sampler.data.onload = onload
      } 
    }

    props.files.forEach( filename => syn.loadSample( filename ) )

    syn.__createGraph = function() {
      'use jsdsp'
      
      const graphs = voices.map( voice => voice.graph )
      const left = g.add( ...voices.map( voice => voice.graph[0] ) )
      const right = g.add( ...voices.map( voice => voice.graph[1] ) )
      const gain = g.in( 'gain' )
      syn.graph = [ left * gain, right * gain ]

      if( syn.panVoices === true ) { 
        const panner = g.pan( syn.graph[0], syn.graph[1], g.in( 'pan' ) ) 
        syn.graph = [ panner.left, panner.right ]
      }
    }

    syn.__createGraph()

    const out = Gibberish.factory( 
      syn,
      syn.graph,
      ['instruments','filtergrains'], 
      props 
    ) 

    Gibberish.preventProxy = true
    Gibberish.proxyEnabled = false

    out.voices = voices
    out.samplers = samplers

    Gibberish.proxyEnabled = true
    Gibberish.preventProxy = false

    return out
  }

  Sampler.defaults = {
    gain: 1,
    pan: .5,
    rate: 1,
    panVoices:false,
    shouldLoop:false,
    loops: 0,
    start:0,
    end:1,
    bufferLength:-999999999,
    loudness:1,
    maxVoices:5,
    env:'triangular',
    envalpha:5,
    __triggerLoudness:1
  }

  return Sampler
}

},{"./instrument.js":179,"genish.js":40}],175:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g

module.exports = function( Gibberish ) {

  const FM = inputProps => {
    let syn = Object.create( instrument )

    let frequency = g.in( 'frequency' ),
        glide = g.max( 1, g.in( 'glide' ) ),
        slidingFreq = g.slide( frequency, glide, glide ),
        cmRatio = g.in( 'cmRatio' ),
        index = g.in( 'index' ),
        feedback = g.in( 'feedback' ),
        attack = g.in( 'attack' ), decay = g.in( 'decay' ),
        sustain = g.in( 'sustain' ), sustainLevel = g.in( 'sustainLevel' ),
        release = g.in( 'release' ),
        loudness = g.in( 'loudness' ),
        triggerLoudness = g.in( '__triggerLoudness' ),
        saturation = g.in( 'saturation' )

    const props = Object.assign( {}, FM.defaults, inputProps )
    Object.assign( syn, props )

    syn.__createGraph = function() {
      const env = Gibberish.envelopes.factory( 
        props.useADSR, 
        props.shape, 
        attack, decay, 
        sustain, sustainLevel, 
        release, 
        props.triggerRelease
      )

      syn.advance = ()=> { env.release() }

      const feedbackssd = g.history( 0 )

      const modOsc = Gibberish.oscillators.factory( 
        syn.modulatorWaveform, 
        g.add( g.mul( slidingFreq, cmRatio ), g.mul( feedbackssd.out, feedback, index ) ), 
        syn.antialias 
      )

      {
        'use jsdsp'
        const Loudness = loudness * triggerLoudness
        const modOscWithIndex = modOsc * slidingFreq * index * Loudness
        const modOscWithEnv   = modOscWithIndex * env
        
        const modOscWithEnvAvg =  .5 * ( modOscWithEnv + feedbackssd.out )

        feedbackssd.in( modOscWithEnvAvg )

        const carrierOsc = Gibberish.oscillators.factory( syn.carrierWaveform, g.add( slidingFreq, modOscWithEnvAvg ), syn.antialias )

        // XXX horrible hack below to "use" saturation even when not using a diode filter 
        const carrierOscWithEnv = props.filterModel === 2 ? carrierOsc * env : g.mul(carrierOsc, g.mul(env,saturation) )

        const baseCutoffFreq = g.in( 'cutoff' ) * ( frequency /  ( g.gen.samplerate / 16 ) ) 
        const cutoff = g.min( baseCutoffFreq * g.pow( 2, g.in('filterMult') * Loudness ) * env, .995 ) 
        const filteredOsc = Gibberish.filters.factory( carrierOscWithEnv, cutoff, saturation, syn )
        const synthWithGain = filteredOsc * g.in( 'gain' ) * Loudness
        
        let panner
        if( props.panVoices === true ) { 
          panner = g.pan( synthWithGain, synthWithGain, g.in( 'pan' ) ) 
          syn.graph = [panner.left, panner.right ]
          syn.isStereo = true
        }else{
          syn.graph = synthWithGain
          syn.isStereo = false
        }
      }

      syn.env = env

      return env
    }
    
    syn.__requiresRecompilation = [ 'carrierWaveform', 'modulatorWaveform', 'antialias', 'filterModel', 'filterMode' ]
    const env = syn.__createGraph()

    const out = Gibberish.factory( syn, syn.graph , ['instruments','FM'], props )

    out.env.advance = out.advance 
    return out
  }

  FM.defaults = {
    carrierWaveform:'sine',
    modulatorWaveform:'sine',
    attack: 44,
    feedback: 0,
    decay: 22050,
    sustain:44100,
    sustainLevel:.6,
    release:22050,
    useADSR:false,
    shape:'linear',
    triggerRelease:false,
    gain: .25,
    cmRatio:2,
    index:5,
    pulsewidth:.25,
    frequency:220,
    pan: .5,
    antialias:false,
    panVoices:false,
    glide:1,
    saturation:1,
    filterMult:1.5,
    Q:.25,
    cutoff:.35,
    filterModel:0,
    filterMode:0,
    loudness: 1,
    __triggerLoudness:1

  }

  const PolyFM = Gibberish.PolyTemplate( FM, ['glide','frequency','attack','decay','pulsewidth','pan','gain','cmRatio','index', 'saturation', 'filterMult', 'Q', 'cutoff', 'antialias', 'filterModel', 'carrierWaveform', 'modulatorWaveform','filterMode', 'feedback', 'useADSR', 'sustain', 'release', 'sustainLevel', '__triggerLoudness','loudness' ] ) 
  PolyFM.defaults = FM.defaults

  return [ FM, PolyFM ]

}

},{"./instrument.js":179,"genish.js":40}],176:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g

module.exports = function( Gibberish ) {
  const proto = Object.create( instrument )
  const memo = {}
  
  Object.assign( proto, {
    pickFile( sample ) {
      this.currentSample = sample
    },
    pick( __idx ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
    },
    pickplay( __idx, rate=null, length=null, start=null ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
      return this.trigger( null, rate, length, start )
    },
    note( rate ) {
      //this.rate = rate
      return this.trigger( null, rate )
    },
    setpan( num=0, value=.5 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.pan.memory.values.idx )
        voice.pan = value
      }
    },
    setrate( num=0, value=1 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.rate.memory.values.idx )
        voice.rate = value
        voice.envrate = 1024 / g.gen.memory.heap[ voice.bufferLength.memory.values.idx ]
        
        const samplerRate = typeof this.rate === 'object' ? 1 : this.rate
        const dir = Math.sign( voice.rate ) === Math.sign( samplerRate ) ? 1 : 0

        if( dir === 1 ) {
          // trigger the bang assigned to the reset property of the 
          // counter object representing phase for the voice
          voice.trigger()
        }else{
          // reset the value of the phase counter to the 
          // end of the sample for reverse playback
          voice.phase.value = sampler.dataLength - 1
        }
        
      }
    },
    trigger( volume=null, rate=null, length=null, start = null ) {
      'no jsdsp'
      if( volume !== null ) this.__triggerLoudness = volume

      let voice = null
      if( Gibberish.mode === 'processor' ) {
        const sampler = this.samplers[ this.currentSample ]

        // if sample isn't loaded...
        if( sampler === undefined ) return

        voice = this.__getVoice__()

        // set voice buffer length
        g.gen.memory.heap[ voice.bufferLength.memory.values.idx ] = sampler.dataLength

        // set voice data index
        g.gen.memory.heap[ voice.bufferLoc.memory.values.idx ] = sampler.dataIdx

        
        // assume voice plays forward if no rate is provided
        // global rate for sampler can still be used to reverse
        voice.rate   = rate   !== null ? rate   : 1
        voice.length = length !== null ? length : 1
        voice.start  = start  !== null ? start  : 0

        // determine direction voice will play at by checking sign
        // of voice.rate and sampler.rate. If both are the same,
        // then the direction will be forward, as they are multiplied
        // ... two positives or two negatives will both create a 
        // positive value

        // assume positive value if a modulation is applied to rate
        //const samplerRate = typeof this.rate === 'object' ? 1 : this.rate
        const dir = Math.sign( voice.rate )// === Math.sign( samplerRate ) ? 1 : 0

        if( dir === 1 ) {
          // trigger the bang assigned to the reset property of the 
          // counter object representing phase for the voice, and
          // it's also attached to each voice's envelope.
          voice.trigger()
        }else{
          // must set phase values of both 
          // grain reader and envelope
          voice.envphase.value = 0
          voice.phase.value = (start+length)*sampler.dataLength 
        }
      }

      return voice
    },
    __getVoiceStatic__() {
      return this.voices[ this.voiceCount % this.voices.length ]
    },
    __getVoice__() {
      const v = this.voices[ this.voiceCount % this.voices.length ]
      this.voiceCount++
      return v
    },
  })

  const Sampler = inputProps => {
    const syn = Object.create( proto )
    const props = Object.assign( { onload:null, voiceCount:0, files:[] }, Sampler.defaults, inputProps )
    const env = g.env({ length:1024, type:props.env, alpha:props.envalpha })

    syn.isStereo = props.isStereo !== undefined ? props.isStereo : false

    const start = g.in( 'start' ), length = g.in( 'length' ),
          rate = g.in( 'rate' ), shouldLoop = g.in( 'loops' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          // rate storage is used to determine whether we're playing
          // the sample forward or in reverse, for use in the 'trigger' method.
          rateStorage = g.data([0], 1, { meta:true })

    Object.assign( syn, props )

    if( Gibberish.mode === 'worklet' ) {
      syn.__meta__ = {
        address:'add',
        name: ['instruments', 'Grains'],
        properties: JSON.stringify(props), 
        id: syn.id
      }

      Gibberish.worklet.ugens.set( syn.id, syn )

      Gibberish.worklet.port.postMessage( syn.__meta__ )
    }

    const voices = []
    for( let i = 0; i < syn.maxVoices; i++ ) {

      const voice = {
        bufferLength: g.data( [1], 1, { meta:true }),
        bufferLoc:    g.data( [1], 1, { meta:true }),
        bang: g.bang(),
        // XXX how do I change this from main thread?
        __pan: g.data( [.5], 1, { meta:true }),
        __rate: g.data( [1], 1, { meta:true }),
        __envrate:g.data([1],1, { meta:true }),
        __start: g.data( [0], 1, { meta:true }),
        __length: g.data( [1], 1, { meta:true }),
        __shouldLoop: g.data( [1], 1, { meta:true }),
        __loudness:  g.data( [1], 1, { meta:true }),

        get loudness() { 
          return g.gen.memory.heap[ this.__loudness.memory.values.idx   ]
        },
        set loudness( v ) {
          g.gen.memory.heap[ this.__loudness.memory.values.idx ] = v
        },
        set pan(v) {
          g.gen.memory.heap[ this.__pan.memory.values.idx ] = v
        },
        set rate(v) {
          g.gen.memory.heap[ this.__rate.memory.values.idx ] = v
        },
        get rate() {
          return g.gen.memory.heap[ this.__rate.memory.values.idx ]
        },
        set envrate(v) {
          g.gen.memory.heap[ this.__envrate.memory.values.idx ] = v
        },
        get envrate() {
          return g.gen.memory.heap[ this.__envrate.memory.values.idx ]
        },

        set start(v) {
          g.gen.memory.heap[ this.__start.memory.values.idx ] = v
        },
        get start() {
          return g.gen.memory.heap[ this.__start.memory.values.idx ]
        },
        set length(v) {
          'no jsdsp'
          g.gen.memory.heap[ this.__length.memory.values.idx ] = v

          // *** must also set rate for indexing of envelope ***
          // get length of sample being played
          const len = g.gen.memory.heap[ this.bufferLength.memory.values.idx ]
          // all envelopes are 1024 samples long
          const envrate = 1024 / (len * v)

          //console.log( 'envrate:', envrate, len, v )
          // rate is accounted for in the increment for the envphase counter
          g.gen.memory.heap[ this.__envrate.memory.values.idx ] = envrate
        },
        get length() {
          return g.gen.memory.heap[ this.__length.memory.values.idx ]
        },
      }
      'use jsdsp'

      voice.envphase = g.counter( 
        //.0005,
        //voice.__envrate[0] * 2,
        g.abs(rate * voice.__rate[0] * voice.__envrate[0]),  
        0,
        1023, 
        voice.bang,
        0, // was shouldLoop 
        { shouldWrap:false, initialValue:9999999 }
      )

      voice.envpeek = g.peek( env, voice.envphase, { mode:'samples' })
      voice.end = (voice.__start[0]+start+voice.__length[0]) * voice.bufferLength[0]

      voice.phase = g.counter( 
        rate * voice.__rate[0], 
        (voice.__start[0]+start) * voice.bufferLength[0],
        voice.end,
        voice.bang,
        0, // was shouldLoop 
        { shouldWrap:true, initialValue:9999999 }
      )

      voice.trigger = voice.bang.trigger

      // XXX the start values must be added together, because if multiplying 
      // and one is zero then their product will always be zero. obvi not obvi.
      const grainstart = (voice.__start[0]+start) * voice.bufferLength[0]
      const grainend   = (voice.__start[0]+start+voice.__length[0]) * voice.bufferLength[0]
      const grainread  = g.peekDyn( 
          voice.bufferLoc[0], 
          voice.bufferLength[0],
          voice.phase,
          { mode:'samples' }
        )
 
      voice.graph = g.ifelse(
        // if phase is greater than start and less than end... 
        g.and( 
          g.gte( voice.phase, grainstart ), 
          g.lte( voice.phase, grainend )
        ),
        // ...read data and mul by envelope
        grainread * voice.envpeek, 
        // ...else return 0
        0
      ) 
      * loudness 
      * voice.__loudness[0] 

      const pan = g.pan( voice.graph, voice.graph, voice.__pan[0] )
      voice.graph = [ pan.left, pan.right ]

      voices.push( voice )
    }

    // load in sample data
    const samplers = {}

    // bound to individual sampler objects in loadSample function
    syn.loadBuffer = function( buffer, onload ) {
      // main thread: when sample is loaded, copy it over message port
      // processor thread: onload is called via messageport handler, and
      // passed in the new buffer to be copied.
      if( Gibberish.mode === 'worklet' ) {
        const memIdx = Gibberish.memory.alloc( this.data.buffer.length, true )

        Gibberish.worklet.port.postMessage({
          address:'copy_multi',
          id:     syn.id,
          buffer: this.data.buffer,
          filename: this.filename
        })

        if( typeof onload === 'function' ) onload( this, buffer )

      }else if( Gibberish.mode === 'processor' ) {
        this.data.buffer = buffer 

        // set data memory spec before issuing memory request
        this.dataLength = this.data.memory.values.length = this.data.dim = this.data.buffer.length

        // request memory to copy the bufer over
        g.gen.requestMemory( this.data.memory, false )
        g.gen.memory.heap.set( this.data.buffer, this.data.memory.values.idx )

        // set location of buffer (does not work)
        this.dataIdx = this.data.memory.values.idx

        syn.currentSample = this.filename
      }
    }

    syn.loadSample = function( filename, __onload, buffer=null ) {
      'use jsdsp'

      const sampler = samplers[ filename ] = {
        dataLength: null,
        dataIdx: null,
        buffer: null,
        filename
      }

      const onload = syn.loadBuffer.bind( sampler ) 
      // passing a filename to data will cause it to be loaded in the main thread
      // onload will then be called to pass the buffer over the messageport. In the
      // processor thread, make a placeholder until data is available.
      if( Gibberish.mode === 'worklet' ) {
        sampler.data = g.data( buffer !== null ? buffer : filename, 1, { onload })

        // check to see if a promise is returned; a valid
        // data object is only return if the file has been
        // previously loaded and the corresponding buffer has
        // been cached.
        if( sampler.data instanceof Promise ) {
          sampler.data.then( d => {
            sampler.data = d
            memo[ filename ] = sampler.data 
            onload( sampler, __onload )
          })
        }else{
          // using a cached data buffer, no need
          // for asynchronous loading.
          memo[ filename ] = sampler
          onload( sampler, __onload )
        }     
      }else{
        sampler.data = g.data( new Float32Array(), 1, { onload, filename })
        sampler.data.onload = onload
      } 
    }

    props.files.forEach( filename => syn.loadSample( filename ) )

    syn.__createGraph = function() {
      'use jsdsp'
      
      const graphs = voices.map( voice => voice.graph )
      const left = g.add( ...voices.map( voice => voice.graph[0] ) )
      const right = g.add( ...voices.map( voice => voice.graph[1] ) )
      const gain = g.in( 'gain' )
      syn.graph = [ left * gain, right * gain ]

      if( syn.panVoices === true ) { 
        const panner = g.pan( syn.graph[0], syn.graph[1], g.in( 'pan' ) ) 
        syn.graph = [ panner.left, panner.right ]
      }
    }

    syn.__createGraph()

    const out = Gibberish.factory( 
      syn,
      syn.graph,
      ['instruments','grains'], 
      props 
    ) 

    Gibberish.preventProxy = true
    Gibberish.proxyEnabled = false

    out.voices = voices
    out.samplers = samplers

    Gibberish.proxyEnabled = true
    Gibberish.preventProxy = false

    return out
  }

  Sampler.defaults = {
    gain: 1,
    pan: .5,
    rate: 1,
    panVoices:false,
    shouldLoop:false,
    loops: 0,
    start:0,
    end:1,
    bufferLength:-999999999,
    loudness:1,
    maxVoices:5,
    env:'triangular',
    envalpha:5,
    __triggerLoudness:1
  }

  return Sampler
}

},{"./instrument.js":179,"genish.js":40}],177:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  let Hat = argumentProps => {
    let hat = Object.create( instrument ),
        tune  = g.in( 'tune' ),
        scaledTune = g.memo( g.add( .4, tune ) ),
        decay  = g.in( 'decay' ),
        gain  = g.in( 'gain' ),
        loudness = g.in( 'loudness' ),
        triggerLoudness = g.in( '__triggerLoudness' )

    let props = Object.assign( {}, Hat.defaults, argumentProps )

    let baseFreq = g.mul( 325, scaledTune ), // range of 162.5 - 487.5
        bpfCutoff = g.mul( g.param( 'bpfc', 7000 ), scaledTune ),
        hpfCutoff = g.mul( g.param( 'hpfc', 11000 ), scaledTune ),  
        s1 = Gibberish.oscillators.factory( 'square', baseFreq, false ),
        s2 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,1.4471 ) ),
        s3 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,1.6170 ) ),
        s4 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,1.9265 ) ),
        s5 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,2.5028 ) ),
        s6 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,2.6637 ) ),
        sum = g.add( s1,s2,s3,s4,s5,s6 ),
        eg = g.decay( g.mul( g.max(.005,decay), g.gen.samplerate * 2 ), { initValue:0 }), 
        bpf = g.svf( sum, bpfCutoff, .5, 2, false ),
        envBpf = g.mul( bpf, eg ),
        hpf = g.filter24( envBpf, 0, hpfCutoff, 0 ),
        out = g.mul( hpf, g.mul( gain, g.mul( loudness, triggerLoudness ) ) )

    hat.env = eg 
    hat.isStereo = false

    const __hat = Gibberish.factory( hat, out, ['instruments','hat'], props  )
    

    return __hat
  }
  
  Hat.defaults = {
    gain:  .5,
    tune: .6,
    decay:.1,
    loudness:1,
    __triggerLoudness:1
  }

  return Hat

}

},{"./instrument.js":179,"genish.js":40}],178:[function(require,module,exports){
const ugen    = require( '../ugen.js' )(),
      __proxy = require( '../workletProxy.js' )

/* we need to:
 * 1. create the mediastream node and connect it as an input to our worklet
 * 2. change the callback to (optionally?) include an input
 * 3. use custom codegen in instrument to access input stream in callback
 *
 * look at misc/bus2 for example of how to create custom callback that
 * doesn't use genish
 *
 * could we also use ugen.block to just insert a static line of code?
 * maybe we could add getter/setter so that it can't be overridden?
 *
 * concern: we could just add 'input' as input to our callback function
 */

const Audio = {
  __hasInput: false,
  input:      null,
  ctx:        null,

  start( Gibberish ) {
    console.log( 'connecting audio input...' )

    const p = new Promise( resolve => {
      if( Audio.input === null ) {
        console.log( 'start?' )
        navigator.mediaDevices.getUserMedia({ audio:true, video:false })
          .then( stream => {
            console.log( 'audio input connected' )
            Audio.input = Gibberish.ctx.createMediaStreamSource( stream )
            Audio.__hasInput = true

            resolve( Audio.input )
          })
          .catch( err => { 
            console.log( 'error opening audio input:', err )
          })
      }else{
        resolve( Audio.input )
      }
    })
    return p
  }
}
  
module.exports = function( Gibberish ) {

  const Input = __props => {
    const input = Object.create( ugen )
    const proxy = __proxy( Gibberish )
    const output = new Float64Array( 1 )
    const props = Object.assign({}, Input.defaults, __props )

    let phase = 0

    if( Audio.input === null ) Audio.start( Gibberish )

    Object.assign( input, {
      callback( buffer ) {
        output[0] = buffer[ phase++ % buffer.length ]
        return output
      },

      id : Gibberish.factory.getUID(),
      dirty : false,
      type : 'ugen',
      isStereo: false,
      __properties__:props
    })

    input.ugenName = input.callback.ugenName = 'input_' + input.id
    input.callbackString = input.ugenName + '( input );'

    const out = input.__useProxy__ === true ? proxy( ['Input'], props, input ) : input

    /*
    let gain = 1
    Object.defineProperty( out, 'gain', {
      get() { return gain },
      set(v){ 
        gain = v
        out.inputs[ out.inputs.length - 1 ] = gain
        Gibberish.dirty( out )
      }
    })
    */

    return out
  }

  Input.defaults = { gain:1, __useProxy__:true }

  return Input 
}

},{"../ugen.js":208,"../workletProxy.js":210}],179:[function(require,module,exports){
const ugen = require('../ugen.js')();

const instrument = Object.create(ugen);

Object.assign(instrument, {
  type: 'instrument',

  note(freq, loudness = null) {
    // if binop is should be used...
    if (isNaN(this.frequency)) {
      // and if we are assigning binop for the first time...
      let obj = Gibberish.processor.ugens.get(this.frequency.id);
      if (obj === undefined) {
        throw Error(`Incorrect note ${this.frequency} assigned to ${this.ugenName}; this value will be ignored.`);
        return;
      }
      if (obj.isop !== true) {
        obj.inputs[0] = freq;
      } else {
        obj.inputs[1] = freq;
        Gibberish.dirty(this);
      }
      this.frequency = obj;
    } else {
      this.frequency = freq;
    }

    if (loudness !== null) {
      this.__triggerLoudness = loudness >= 0 ? loudness : 0;
    }

    this.env.trigger();

    return this
  },

  trigger(loudness = 1) {
    if (isNaN(loudness)) {
      throw Error(`A non-number was passed to trigger() on ${this.ugenName}; this value will be ignored and the envelope will not be triggered.`);
    } else {
      this.__triggerLoudness = loudness >= 0 ? loudness : 0;
      this.env.trigger();
    }

    return this
  }

});

module.exports = instrument

},{"../ugen.js":208}],180:[function(require,module,exports){
module.exports = function( Gibberish ) {

const instruments = {
  Clave       : require( './conga.js' )( Gibberish )[0], // clave is same as conga with different defaults, see below
  Hat         : require( './hat.js' )( Gibberish ),
  Snare       : require( './snare.js' )( Gibberish ),
  Cowbell     : require( './cowbell.js' )( Gibberish ),
  Tom         : require( './tom.js' )( Gibberish ),
  Clap        : require( './clap.dsp.js' )( Gibberish ),
  Multisampler: require( './multisampler.dsp.js' )( Gibberish ),
  Grains      : require( './grains.dsp.js' )( Gibberish ),
  //Grains      : require( './grains.new.dsp.js' )( Gibberish ),
  Filtergrains: require( './filtergrains.dsp.js' )( Gibberish ),
  Soundfont   : require( './soundfont.js' )( Gibberish ),
  Input       : require( './input.js' )( Gibberish )
}

instruments.Clave.defaults.frequency = 2500
instruments.Clave.defaults.decay = .5;

// browserify needs semi-colons for this
[ instruments.Synth, instruments.PolySynth ]     = require( './synth.dsp.js' )( Gibberish );
[ instruments.Complex, instruments.PolyComplex]  = require( './complex.dsp.js' )( Gibberish );
[ instruments.Monosynth, instruments.PolyMono ]  = require( './monosynth.dsp.js' )( Gibberish );
[ instruments.FM, instruments.PolyFM ]           = require( './fm.dsp.js' )( Gibberish );
[ instruments.Sampler, instruments.PolySampler ] = require( './sampler.js' )( Gibberish );
[ instruments.Karplus, instruments.PolyKarplus ] = require( './karplusstrong.js' )( Gibberish );
[ instruments.Kick, instruments.PolyKick ]       = require( './kick.js' )( Gibberish );
[ instruments.Conga, instruments.PolyConga ]     = require( './conga.js' )( Gibberish );

instruments.export = target => {
  for( let key in instruments ) {
    if( key !== 'export' ) {
      target[ key ] = instruments[ key ]
    }
  }
}

return instruments

}

},{"./clap.dsp.js":170,"./complex.dsp.js":171,"./conga.js":172,"./cowbell.js":173,"./filtergrains.dsp.js":174,"./fm.dsp.js":175,"./grains.dsp.js":176,"./hat.js":177,"./input.js":178,"./karplusstrong.js":181,"./kick.js":182,"./monosynth.dsp.js":183,"./multisampler.dsp.js":184,"./sampler.js":187,"./snare.js":188,"./soundfont.js":189,"./synth.dsp.js":190,"./tom.js":191}],181:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Karplus = inputProps => {

    const props = Object.assign( {}, Karplus.defaults, inputProps )
    let syn = Object.create( instrument )
    
    let sampleRate = Gibberish.ctx.sampleRate 

    const trigger = g.bang(),
          // high initialValue stops triggering on initialization
          phase = g.accum( 1, trigger, { shouldWrapMax:false, initialValue:1000000 } ),
          env = g.gtp( g.sub( 1, g.div( phase, 200 ) ), 0 ),
          impulse = g.mul( g.noise(), env ),
          feedback = g.history(),
          frequency = g.in('frequency'),
          glide = g.max( 1, g.in( 'glide' ) ),
          // ensures lookup index is within size of table (2048)
          // but only at 48 kHz and lower!!! e.g. 48000 / 25 = 1920
          slidingFrequency = g.max( 25, g.slide( frequency, glide, glide )),
          // interpolation creates better pitch but adds lowpass filtering effect
          // https://stackoverflow.com/questions/6675445
          delay = g.delay( 
            g.add( impulse, feedback.out ), 
            // subtract one for delay compensation, otherwise pitches
            // get sketchy in higher registers
            g.sub( g.div( sampleRate, slidingFrequency ), 1 ),
            { size:2048, interp:'linear' }
          ),
          decayed = g.mul( delay, g.t60( g.mul( g.in('decay'), slidingFrequency ) ) ),
          damped =  g.mix( decayed, feedback.out, g.in('damping') ),
          n = g.noise(),
          blendValue = g.switch( g.gt( n, g.in('blend') ), -1, 1 ), 
          withGain = g.mul( g.mul( blendValue, damped ), g.mul( g.mul( g.in('loudness'), g.in('__triggerLoudness') ), g .in('gain') ) ),
          withBlock = g.dcblock( withGain )

    feedback.in( damped )

    const properties = Object.assign( {}, Karplus.defaults, props )

    Object.assign( syn, {
      properties : props,

      env : trigger,
      phase,

      getPhase() {
        return Gibberish.memory.heap[ phase.memory.value.idx ]
      },
    })

    if( properties.panVoices ) {  
      const panner = g.pan( withBlock, withBlock, g.in( 'pan' ) )
      syn = Gibberish.factory( syn, [panner.left, panner.right], ['instruments','karplus'], props  )
      syn.isStereo = true
    }else{
      syn = Gibberish.factory( syn, withBlock, ['instruments','karplus'], props )
      syn.isStereo = false 
    }

    return syn
  }
  
  Karplus.defaults = {
    decay: .97,
    damping:.2,
    gain: 1,
    frequency:220,
    pan: .5,
    glide:1,
    panVoices:false,
    loudness:1,
    __triggerLoudness:1,
    blend:1
  }

  let envCheckFactory = ( syn,synth ) => {
    let envCheck = ()=> {
      let phase = syn.getPhase(),
          endTime = synth.decay * sampleRate

      if( phase > endTime ) {
        synth.disconnectUgen( syn )
        syn.isConnected = false
        Gibberish.memory.heap[ syn.phase.memory.value.idx ] = 0 // trigger doesn't seem to reset for some reason
      }else{
        Gibberish.blockCallbacks.push( envCheck )
      }
    }
    return envCheck
  }

  const PolyKarplus = Gibberish.PolyTemplate( Karplus, ['frequency','decay','damping','pan','gain', 'glide','loudness', '__triggerLoudness'], envCheckFactory ) 
  PolyKarplus.defaults = Karplus.defaults

  return [ Karplus, PolyKarplus ]

}

},{"./instrument.js":179,"genish.js":40}],182:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Kick = inputProps => {
    // establish prototype chain
    const kick = Object.create( instrument )

    // define inputs
    const frequency = g.in( 'frequency' ),
          decay = g.in( 'decay' ),
          tone  = g.in( 'tone' ),
          gain  = g.in( 'gain' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          Loudness = g.mul( loudness, triggerLoudness )
    
    // create initial property set
    const props = Object.assign( {}, Kick.defaults, inputProps )

    // create DSP graph
    const trigger = g.bang(),
          impulse = g.mul( trigger, 60 ),
          scaledDecay = g.sub( 1.005, g.min( decay, .99999) ), // -> range { .005, 1.005 }
          scaledTone = g.add( 50, g.mul( tone, g.mul(4000, Loudness ) ) ), // -> range { 50, 4050 }
          bpf = g.svf( impulse, frequency, scaledDecay, 2, false ),
          lpf = g.svf( bpf, scaledTone, .5, 0, false )
          //kick = g.mul( lpf, g.mul( gain, Loudness ) )


    if( props.panVoices === true ) {  
      const panner = g.pan( lpf, lpf, g.in( 'pan' ) )
      kick.graph = [ 
        g.mul( panner.left, gain, Loudness ), 
        g.mul( panner.right, gain, Loudness ) 
      ]
      kick.isStereo = true
    }else{
      kick.graph = g.mul( lpf, g.mul( gain, Loudness ) )
      kick.isStereo = false
    }

    kick.env = trigger
    const out = Gibberish.factory( kick, kick.graph, ['instruments','kick'], props  )

    return out
  }
  
  Kick.defaults = {
    gain: 1,
    frequency:85,
    tone: .25,
    decay:.9,
    loudness:1,
    __triggerLoudness:1,
    pan:.5,
    panVoices:false
  }

  const PolyKick = Gibberish.PolyTemplate( 
    Kick, 
    [ 'gain','frequency','tone','decay','loudness','__triggerLoudness', 'pan']
  ) 

  PolyKick.defaults = Kick.defaults

  return [ Kick, PolyKick ]
}

},{"./instrument.js":179,"genish.js":40}],183:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' ),
      feedbackOsc = require( '../oscillators/fmfeedbackosc.js' )

module.exports = function( Gibberish ) {

  const Mono = argumentProps => {
    const syn = Object.create( instrument ),
          oscs = [], 
          frequency = g.in( 'frequency' ),
          glide = g.max( 1, g.in( 'glide' ) ),
          slidingFreq = g.memo( g.slide( frequency, glide, glide ) ),
          attack = g.in( 'attack' ), decay = g.in( 'decay' ),
          sustain = g.in( 'sustain' ), sustainLevel = g.in( 'sustainLevel' ),
          release = g.in( 'release' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          Loudness = g.mul( loudness, triggerLoudness ),
          saturation = g.in( 'saturation' )

    const props = Object.assign( {}, Mono.defaults, argumentProps )
    Object.assign( syn, props )

    syn.__createGraph = function() {
      const env = Gibberish.envelopes.factory( 
        props.useADSR, 
        props.shape, 
        attack, decay, 
        sustain, sustainLevel, 
        release, 
        props.triggerRelease
      )

      for( let i = 0; i < 3; i++ ) {
        let osc, freq

        switch( i ) {
          case 1:
            freq = g.add( slidingFreq, g.mul( slidingFreq, g.in('detune2') ) )
            break;
          case 2:
            freq = g.add( slidingFreq, g.mul( slidingFreq, g.in('detune3') ) )
            break;
          default:
            freq = slidingFreq
        }

        osc = Gibberish.oscillators.factory( syn.waveform, freq, syn.antialias )
        
        oscs[ i ] = osc
      }


      //const baseCutoffFreq = g.in('cutoff') * (frequency /  (g.gen.samplerate / 16 ))
      //const cutoff = baseCutoffFreq * g.pow( 2, g.in('filterMult') * loudness ) * env 
      const oscSum = g.add( ...oscs ),
            // XXX horrible hack below to "use" saturation even when not using a diode filter 
            oscWithEnv = props.filterModel=== 2 ? g.mul( oscSum, env ) : g.sub( g.add( g.mul( oscSum, env), saturation ), saturation ),
            baseCutoffFreq = g.mul( g.in('cutoff'), g.div( frequency, g.gen.samplerate / 16 ) ),
            cutoff = g.mul( g.mul( baseCutoffFreq, g.pow( 2, g.mul( g.in('filterMult'), Loudness ) )), env ),
            filteredOsc = Gibberish.filters.factory( oscWithEnv, cutoff, g.in('saturation'), syn )
        
      if( props.panVoices ) {  
        const panner = g.pan( filteredOsc,filteredOsc, g.in( 'pan' ) )
        syn.graph = [ g.mul( panner.left, g.in('gain'), Loudness ), g.mul( panner.right, g.in('gain'), Loudness ) ]
        syn.isStereo = true
      }else{
        syn.graph = g.mul( filteredOsc, g.in('gain'), Loudness )
        syn.isStereo = false
      }

      syn.env = env
    }

    syn.__requiresRecompilation = [ 'waveform', 'antialias', 'filterModel', 'filterMode' ]
    syn.__createGraph()

    const out = Gibberish.factory( syn, syn.graph, ['instruments','Monosynth'], props )

    return out
  } 
  
  Mono.defaults = {
    waveform: 'saw',
    attack: 44,
    decay: 22050,
    sustain:44100,
    sustainLevel:.6,
    release:22050,
    useADSR:false,
    shape:'linear',
    triggerRelease:false,
    gain: .25,
    pulsewidth:.25,
    frequency:220,
    pan: .5,
    detune2:.005,
    detune3:-.005,
    cutoff: .5,
    Q: .25,
    panVoices:false,
    glide: 1,
    antialias:false,
    //filterType: 1,
    filterModel: 1,
    filterMode: 0, // 0 = LP, 1 = HP, 2 = BP, 3 = Notch
    saturation:.5,
    filterMult: 2,
    loudness:1,
    __triggerLoudness:1
  }

  let PolyMono = Gibberish.PolyTemplate( Mono, 
    [ 'frequency','attack','decay','cutoff','Q',
      'detune2','detune3','pulsewidth','pan','gain', 
      'glide', 'saturation', 'filterMult',  'antialias', 
      'filterModel', 'waveform', 'filterMode', 'loudness', '__triggerLoudness' ]
  ) 
  PolyMono.defaults = Mono.defaults

  return [ Mono, PolyMono ]
}

},{"../oscillators/fmfeedbackosc.js":199,"./instrument.js":179,"genish.js":40}],184:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g

module.exports = function( Gibberish ) {
  const proto = Object.create( instrument )
  const memo = {}
  
  Object.assign( proto, {
    pickFile( sample ) {
      this.currentSample = sample
    },
    pick( __idx ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
    },
    pickplay( __idx ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
      return this.trigger()
    },
    note( rate ) {
      //this.rate = rate
      return this.trigger( null, rate )
    },
    setpan( num=0, value=.5 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.pan.memory.values.idx )
        voice.pan = value
      }
    },
    setrate( num=0, value=1 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.rate.memory.values.idx )
        voice.rate = value
      }
    },
    trigger( volume=null, rate=null ) {
      'no jsdsp'
      if( volume !== null ) this.__triggerLoudness = volume

      let voice = null
      if( Gibberish.mode === 'processor' ) {
        const sampler = this.samplers[ this.currentSample ]

        voice = this.__getVoice__()

        // if sample isn't loaded...
        if( sampler === undefined ) return voice

        // set voice buffer length
        g.gen.memory.heap[ voice.bufferLength.memory.values.idx ] = sampler.dataLength

        // set voice data index
        g.gen.memory.heap[ voice.bufferLoc.memory.values.idx ] = sampler.dataIdx
        
        // assume voice plays forward if no rate is provided
        // global rate for sampler can still be used to reverse
        voice.rate = rate !== null ? rate : 1

        // determine direction voice will play at by checking sign
        // of voice.rate and sampler.rate. If both are the same,
        // then the direction will be forward, as they are multiplied
        // ... two positives or two negatives will both create a 
        // positive value

        // assume positive value if a modulation is applied to rate
        const samplerRate = typeof this.rate === 'object' ? 1 : this.rate
        const dir = Math.sign( voice.rate ) === Math.sign( samplerRate ) ? 1 : 0

        if( dir === 1 ) {
          // trigger the bang assigned to the reset property of the 
          // counter object representing phase for the voice
          voice.trigger()
        }else{
          // reset the value of the phase counter to the 
          // end of the sample for reverse playback
          voice.phase.value = sampler.dataLength - 1
        }
      }

      return voice
    },
    __getVoice__() {
      const v =  this.voices[ this.voiceCount++ % this.voices.length ]
      return v
    },
  })

  const Sampler = inputProps => {
    const syn = Object.create( proto )

    const props = Object.assign( { onload:null, voiceCount:0, files:[] }, Sampler.defaults, inputProps )

    syn.isStereo = props.isStereo !== undefined ? props.isStereo : false

    const start = g.in( 'start' ), end = g.in( 'end' ), 
          rate = g.in( 'rate' ), shouldLoop = g.in( 'loops' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          // rate storage is used to determine whether we're playing
          // the sample forward or in reverse, for use in the 'trigger' method.
          rateStorage = g.data([0], 1, { meta:true })

    Object.assign( syn, props )

    if( Gibberish.mode === 'worklet' ) {
      syn.__meta__ = {
        address:'add',
        name: ['instruments', 'Multisampler'],
        properties: JSON.stringify(props), 
        id: syn.id
      }

      Gibberish.worklet.ugens.set( syn.id, syn )

      Gibberish.worklet.port.postMessage( syn.__meta__ )
    }

    const voices = []
    for( let i = 0; i < syn.maxVoices; i++ ) {
      'use jsdsp'

      const voice = {
        bufferLength: g.data( [1], 1, { meta:true }),
        bufferLoc:    g.data( [1], 1, { meta:true }),
        bang: g.bang(),
        // XXX how do I change this from main thread?
        __pan: g.data( [.5], 1, { meta:true }),
        __rate: g.data( [1], 1, { meta:true }),
        __start: g.data( [0], 1, { meta:true }),
        __end: g.data( [1], 1, { meta:true }),
        __shouldLoop: g.data( [1], 1, { meta:true }),
        __loudness:  g.data( [1], 1, { meta:true }),
        get loudness() { 
          return g.gen.memory.heap[ this.__loudness.memory.values.idx   ]
        },
        set loudness( v ) {
          g.gen.memory.heap[ this.__loudness.memory.values.idx ] = v
        },
        set pan(v) {
          g.gen.memory.heap[ this.__pan.memory.values.idx ] = v
        },
        set rate(v) {
          g.gen.memory.heap[ this.__rate.memory.values.idx ] = v
        },
        get rate() {
          return g.gen.memory.heap[ this.__rate.memory.values.idx ]
        },
        set start(v) {
          g.gen.memory.heap[ this.__start.memory.values.idx ] = v
        },
        get start() {
          return g.gen.memory.heap[ this.__start.memory.values.idx ]
        },
        set end(v) {
          g.gen.memory.heap[ this.__end.memory.values.idx ] = v
        },
        get end() {
          return g.gen.memory.heap[ this.__end.memory.values.idx ]
        },
      }

      voice.phase = g.counter( 
        rate * voice.__rate[0], 
        (voice.__start[0]+start) * voice.bufferLength[0],
        (voice.__end[0]*end) * voice.bufferLength[0], 
        voice.bang,
        shouldLoop, 
        { shouldWrap:false, initialValue:9999999 }
      )

      voice.trigger = voice.bang.trigger

      voice.graph = g.ifelse(
        // if phase is greater than start and less than end... 
        g.and( 
          g.gte( voice.phase, (voice.__start[0]*start) * voice.bufferLength[0] ), 
          g.lt(  voice.phase, (voice.__end[0]*end)     * voice.bufferLength[0] ) 
        ),
        // ...read data
        voice.peek = g.peekDyn( 
          voice.bufferLoc[0], 
          voice.bufferLength[0],
          voice.phase,
          { mode:'samples' }
        ),
        // ...else return 0
        0
      ) 
      * loudness 
      * voice.__loudness[0] 

      const pan = g.pan( voice.graph, voice.graph, voice.__pan[0] )
      voice.graph = [ pan.left, pan.right ]

      voices.push( voice )
    }

    // load in sample data
    const samplers = {}

    // bound to individual sampler objects in loadSample function
    syn.loadBuffer = function( buffer, onload ) {
      // main thread: when sample is loaded, copy it over message port
      // processor thread: onload is called via messageport handler, and
      // passed in the new buffer to be copied.
      if( Gibberish.mode === 'worklet' ) {
        const memIdx = Gibberish.memory.alloc( this.data.buffer.length, true )

        Gibberish.worklet.port.postMessage({
          address:'copy_multi',
          id:     syn.id,
          buffer: this.data.buffer,
          filename: this.filename
        })

        if( typeof onload === 'function' ) onload( this, buffer )

      }else if( Gibberish.mode === 'processor' ) {
        this.data.buffer = buffer 

        // set data memory spec before issuing memory request
        this.dataLength = this.data.memory.values.length = this.data.dim = this.data.buffer.length

        // request memory to copy the bufer over
        g.gen.requestMemory( this.data.memory, false )
        g.gen.memory.heap.set( this.data.buffer, this.data.memory.values.idx )

        // set location of buffer (does not work)
        this.dataIdx = this.data.memory.values.idx

        syn.currentSample = this.filename
      }
    }

    syn.loadSample = function( filename, __onload, buffer=null ) {
      'use jsdsp'

      const sampler = samplers[ filename ] = {
        dataLength: null,
        dataIdx: null,
        buffer: null,
        filename
      }

      const onload = syn.loadBuffer.bind( sampler ) 
      // passing a filename to data will cause it to be loaded in the main thread
      // onload will then be called to pass the buffer over the messageport. In the
      // processor thread, make a placeholder until data is available.
      if( Gibberish.mode === 'worklet' ) {
        sampler.data = g.data( buffer !== null ? buffer : filename, 1, { onload })

        // check to see if a promise is returned; a valid
        // data object is only return if the file has been
        // previously loaded and the corresponding buffer has
        // been cached.
        if( sampler.data instanceof Promise ) {
          sampler.data.then( d => {
            sampler.data = d
            memo[ filename ] = sampler.data 
            onload( sampler, __onload )
          })
        }else{
          // using a cached data buffer, no need
          // for asynchronous loading.
          memo[ filename ] = sampler
          onload( sampler, __onload )
        }     
      }else{
        sampler.data = g.data( new Float32Array(), 1, { onload, filename })
        sampler.data.onload = onload
      } 
    }

    props.files.forEach( filename => syn.loadSample( filename ) )

    syn.__createGraph = function() {
      'use jsdsp'
      
      const graphs = voices.map( voice => voice.graph )
      const left = g.add( ...voices.map( voice => voice.graph[0] ) )
      const right = g.add( ...voices.map( voice => voice.graph[1] ) )
      const gain = g.in( 'gain' )
      syn.graph = [ left * gain, right * gain ]

      if( syn.panVoices === true ) { 
        const panner = g.pan( syn.graph[0], syn.graph[1], g.in( 'pan' ) ) 
        syn.graph = [ panner.left, panner.right ]
      }
    }

    syn.__createGraph()

    const out = Gibberish.factory( 
      syn,
      syn.graph,
      ['instruments','multisampler'], 
      props 
    ) 

    Gibberish.preventProxy = true
    Gibberish.proxyEnabled = false

    out.voices = voices
    out.samplers = samplers

    Gibberish.proxyEnabled = true
    Gibberish.preventProxy = false

    return out
  }

  Sampler.defaults = {
    gain: 1,
    pan: .5,
    rate: 1,
    panVoices:false,
    shouldLoop:false,
    loops: 0,
    start:0,
    end:1,
    bufferLength:-999999999,
    loudness:1,
    maxVoices:5, 
    __triggerLoudness:1
  }

  return Sampler
}

},{"./instrument.js":179,"genish.js":40}],185:[function(require,module,exports){
// XXX TOO MANY GLOBAL GIBBERISH VALUES

const Gibberish = require( '../index.js' )

module.exports = {
  note( freq ) {
    let voice = this.__getVoice__()
    // will be sent to processor node via proxy method...
    if( Gibberish.mode !== 'worklet' ) {
      //Object.assign( voice, this.properties )
      //if( gain === undefined ) gain = this.gain
      //voice.gain = gain
      voice.__triggerLoudness = this.__triggerLoudness
      voice.note( freq, this.__triggerLoudness )
      this.__runVoice__( voice, this )
      this.triggerNote = freq
    }
    return voice
  },

  // XXX this is not particularly satisfying...
  // must check for both notes and chords
  trigger( loudness ) {
    if( loudness < 0 ) loudness = 0

    if( this.triggerChord !== null ) {
      this.triggerChord.forEach( v => {
        let voice = this.__getVoice__()
        voice.note( v, loudness )
        this.__runVoice__( voice, this )
      })
    }else if( this.triggerNote !== null ) {
      let voice = this.__getVoice__()
      voice.note( this.triggerNote, loudness )
      this.__runVoice__( voice, this )
      return voice
    }else{
      let voice = this.__getVoice__()
      voice.trigger( loudness )
      this.__runVoice__( voice, this )
      return voice
    }
  },

  __runVoice__( voice, _poly ) {
    if( !voice.isConnected ) {
      voice.connect( _poly )
      voice.isConnected = true
    }

    //let envCheck
    //if( _poly.envCheck === undefined ) {
    //  envCheck = function() {
    //    if( voice.env.isComplete() ) {
    //      _poly.disconnectUgen( voice )
    //      voice.isConnected = false
    //    }else{
    //      Gibberish.blockCallbacks.push( envCheck )
    //    }
    //  }
    //}else{
    //  envCheck = _poly.envCheck( voice, _poly )
    //}

    // XXX uncomment this line to turn on dynamically connecting
    // disconnecting individual voices from graph
    //Gibberish.blockCallbacks.push( envCheck )
  },

  // get the next voice that will be used, in order to 
  // set property values before it is triggered. voiceCount
  // isn't incremented.
  __getVoiceStatic__() {
    return this.voices[ this.voiceCount % this.voices.length ]
  },

  __getVoice__() {
    return this.voices[ this.voiceCount++ % this.voices.length ]
  },

  chord( frequencies ) {
    // will be sent to processor node via proxy method...
    if( Gibberish !== undefined && Gibberish.mode !== 'worklet' ) {
      frequencies.forEach( v => this.note( v ) )
      this.triggerChord = frequencies
    }
  },

  free() {
    for( let child of this.voices ) child.free()
  },

  triggerChord:null,
  triggerNote:null
}

},{"../index.js":169}],186:[function(require,module,exports){
/*
 * This files creates a factory generating polysynth constructors.
 */

const g = require( 'genish.js' )
const __proxy = require( '../workletProxy.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )

  const TemplateFactory = ( ugen, propertyList, _envCheck ) => {

    const Template = props => {
      const properties = Object.assign( {}, { isStereo:true, maxVoices:4 }, props )

      //const synth = properties.isStereo === true ? Object.create( stereoProto ) : Object.create( monoProto )
      const synth = properties.isStereo === true ? Gibberish.Bus2({ __useProxy__:false }) : Gibberish.Bus({ __useProxy__:false }) 

      Object.assign( 
        synth, 

        {
          maxVoices: properties.maxVoices, 
          voiceCount: 0,
          envCheck: _envCheck,
          dirty: true,
          ugenName: 'poly' + ugen.name + '_' + synth.id + '_' + ( properties.isStereo ? 2 : 1 ),
          properties
        },

        Gibberish.mixins.polyinstrument
      )

      properties.panVoices = true//false//properties.isStereo
      synth.callback.ugenName = synth.ugenName

      const storedId = properties.id
      if( properties.id !== undefined ) delete properties.id 

      const voices = []
      for( let i = 0; i < synth.maxVoices; i++ ) {
        properties.id = synth.id +'_'+i
        voices[i] = ugen( properties )
        if( Gibberish.mode === 'processor' )
          voices[i].callback.ugenName = voices[i].ugenName

        voices[i].isConnected = false
        //synth.__voices[i] = proxy( ['instruments', ugen.name], properties, synth.voices[i] )
      }

      let _propertyList 
      if( properties.isStereo === false ) {
        _propertyList = propertyList.slice( 0 )
        const idx =  _propertyList.indexOf( 'pan' )
        if( idx  > -1 ) _propertyList.splice( idx, 1 )
      }

      properties.id = storedId

      TemplateFactory.setupProperties( synth, ugen, properties.isStereo ? propertyList : _propertyList )
      
      const p = proxy( ['instruments', 'Poly'+ugen.name], properties, synth ) 

      // proxy workaround nightmare... if we include the voices when we create
      // the proxy, they wind up being strangely unaddressable. perhaps they
      // are being overwritting in the Processor.ugens map object?
      // manually adding each one seems to work around the problem
      if( Gibberish.mode === 'worklet' ) {
        p.voices = []
        let count = 0
        for( let v of voices ) {
          Gibberish.worklet.port.postMessage({
            address: 'addObjectToProperty',
            object: synth.id,
            name:'voices',
            key:count,
            value:v.id
          })

          p.voices[ count ] = v
          count++
        }
      }

      return p 
    }

    return Template
  }

  TemplateFactory.setupProperties = function( synth, ugen, props ) {
    for( let property of props ) {
      if( property === 'pan' || property === 'id' ) continue
      Object.defineProperty( synth, property, {
        configurable:true,
        get() {
          return synth.properties[ property ] || ugen.defaults[ property ]
        },
        set( v ) {
          synth.properties[ property ] = v
          for( let child of synth.voices ) {
            child[ property ] = v
          }
        }
      })
    }
  }

  return TemplateFactory

}

},{"../workletProxy.js":210,"genish.js":40}],187:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {
  const proto = Object.create( instrument )
  const memo = {}

  Object.assign( proto, {
    note( rate ) {
      this.rate = rate
      if( rate > 0 ) {
        this.__trigger()
      }else{
        this.__phase__.value = this.end * (this.data.buffer.length - 1)
      }
    },
    trigger( volume ) {
      if( volume !== undefined ) this.gain = volume

      if( Gibberish.mode === 'processor' ) {
        // if we're playing the sample forwards...
        if( Gibberish.memory.heap[ this.__rateStorage__.memory.values.idx ] > 0 ) {
          this.__trigger()
        }else{
          this.__phase__.value = this.end * (this.data.buffer.length - 1)
        }
      }
    },
  })

  const Sampler = inputProps => {
    const syn = Object.create( proto )

    const props = Object.assign( { onload:null }, Sampler.defaults, inputProps )

    syn.isStereo = props.isStereo !== undefined ? props.isStereo : false

    const start = g.in( 'start' ), end = g.in( 'end' ), 
          bufferLength = g.in( 'bufferLength' ), 
          rate = g.in( 'rate' ), shouldLoop = g.in( 'loops' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          // rate storage is used to determine whether we're playing
          // the sample forward or in reverse, for use in the 'trigger' method.
          rateStorage = g.data([0], 1, { meta:true })

    Object.assign( syn, props )

    if( Gibberish.mode === 'worklet' ) {
      syn.__meta__ = {
        address:'add',
        name: ['instruments', 'Sampler'],
        properties: JSON.stringify(props), 
        id: syn.id
      }

      Gibberish.worklet.ugens.set( syn.id, syn )

      Gibberish.worklet.port.postMessage( syn.__meta__ )
    }

    syn.__createGraph = function() {
      syn.__bang__ = g.bang()
      syn.__trigger = syn.__bang__.trigger

      syn.__phase__ = g.counter( 
        rate, 
        g.mul(start,bufferLength), 
        g.mul( end, bufferLength ), 
        syn.__bang__, 
        shouldLoop, 
        { shouldWrap:false, initialValue:9999999 }
      )
      
      syn.__rateStorage__ = rateStorage
      rateStorage[0] = rate

      // XXX we added our recorded 'rate' param and then effectively subtract it,
      // so that its presence in the graph will force genish to actually record the 
      // rate as the input. this is extremely hacky... there should be a way to record
      // value without having to include it in the graph!
      syn.graph = g.add( g.mul( 
        g.ifelse( 
          g.and( g.gte( syn.__phase__, g.mul(start,bufferLength) ), g.lt( syn.__phase__, g.mul(end,bufferLength) ) ),
          g.peek( 
            syn.data, 
            syn.__phase__,
            { mode:'samples' }
          ),
          0
        ), 
        g.mul( g.mul( loudness, triggerLoudness ), g.in('gain') )
      ), rateStorage[0], g.mul( rateStorage[0], -1 ) )
      
      if( syn.panVoices === true ) { 
        const panner = g.pan( syn.graph, syn.graph, g.in( 'pan' ) ) 
        syn.graph = [ panner.left, panner.right ]
      }
    }

    const onload = (buffer,filename) => {
      if( buffer === undefined ) return
      if( Gibberish.mode === 'worklet' ) {
        //const memIdx = memo[ filename ].idx !== undefined ? memo[ filename ].idx : Gibberish.memory.alloc( syn.data.memory.values.length, true )

        const memIdx = Gibberish.memory.alloc( buffer.length, true )
        //memo[ filename ].idx = memIdx

        Gibberish.worklet.port.postMessage({
          address:'copy',
          id:     syn.id,
          idx:    memIdx,
          buffer
        })

      }else if ( Gibberish.mode === 'processor' ) {
        syn.data.buffer = buffer
        syn.data.memory.values.length = syn.data.dim = buffer.length
        syn.__redoGraph() 
      }

      if( typeof syn.onload === 'function' ){  
        syn.onload( buffer || syn.data.buffer )
      }
      if( syn.bufferLength === -999999999 && syn.data.buffer !== undefined ) syn.bufferLength = syn.data.buffer.length - 1
    }

    //if( props.filename ) {
    syn.loadFile = function( filename ) {
      //if( memo[ filename ] === undefined ) {
        if( Gibberish.mode !== 'processor' ) {
          syn.data = g.data( filename, 1, { onload })


          // check to see if a promise is returned; a valid
          // data object is only return if the file has been
          // previously loaded and the corresponding buffer has
          // been cached.
          if( syn.data instanceof Promise ) {
            syn.data.then( d => {
              syn.data = d
              memo[ filename ] = syn.data
              onload( d.buffer, filename )
            })
          }else{
            // using a cached data buffer, no need
            // for asynchronous loading.
            memo[ filename ] = syn.data
            onload( syn.data.buffer, filename )
          }     
        }else{
          syn.data = g.data( new Float32Array(), 1, { onload, filename })
          //memo[ filename ] = syn.data
        }
      //}else{
      //  syn.data = memo[ filename ]
      //  console.log( 'memo data:', syn.data )
      //  onload( syn.data.buffer, filename )
      //}
    }

    syn.loadBuffer = function( buffer ) {
      if( Gibberish.mode === 'processor' ) {
        syn.data.buffer = buffer
        syn.data.memory.values.length = syn.data.dim = buffer.length
        syn.__redoGraph() 
      }
    }

    if( props.filename !== undefined ) {
      syn.loadFile( props.filename )
    }else{
      syn.data = g.data( new Float32Array() )
    }

    if( syn.data !== undefined ) {
      syn.data.onload = onload

      syn.__createGraph()
    }

    const out = Gibberish.factory( 
      syn,
      syn.graph,
      ['instruments','sampler'], 
      props 
    ) 

    return out
  }

  Sampler.defaults = {
    gain: 1,
    pan: .5,
    rate: 1,
    panVoices:false,
    loops: 0,
    start:0,
    end:1,
    bufferLength:-999999999,
    loudness:1,
    __triggerLoudness:1
  }

  const envCheckFactory = function( voice, _poly ) {
    const envCheck = () => {
      const phase = Gibberish.memory.heap[ voice.__phase__.memory.value.idx ]
      if( ( voice.rate > 0 && phase > voice.end ) || ( voice.rate < 0 && phase < 0 ) ) {
        _poly.disconnectUgen.call( _poly, voice )
        voice.isConnected = false
      }else{
        Gibberish.blockCallbacks.push( envCheck )
      }
    }

    return envCheck
  }

  const PolySampler = Gibberish.PolyTemplate( Sampler, ['rate','pan','gain','start','end','loops','bufferLength','__triggerLoudness','loudness'], envCheckFactory ) 

  return [ Sampler, PolySampler ]
}


},{"./instrument.js":179,"genish.js":40}],188:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )
  
module.exports = function( Gibberish ) {

  const Snare = argumentProps => {
    const snare = Object.create( instrument ),
          decay = g.in( 'decay' ),
          scaledDecay = g.mul( decay, g.gen.samplerate * 2 ),
          snappy= g.in( 'snappy' ),
          tune  = g.in( 'tune' ),
          gain  = g.in( 'gain' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in('__triggerLoudness'),
          Loudness = g.mul( loudness, triggerLoudness ),
          eg = g.decay( scaledDecay, { initValue:0 } ), 
          check = g.memo( g.gt( eg, .0005 ) ),
          rnd = g.mul( g.noise(), eg ),
          hpf = g.svf( rnd, g.add( 1000, g.mul( g.add( 1, tune), 1000 ) ), .5, 1, false ),
          snap = g.mul( g.gtp( g.mul( hpf, snappy ), 0 ), Loudness ), // rectify
          bpf1 = g.svf( eg, g.mul( 180, g.add( tune, 1 ) ), .05, 2, false ),
          bpf2 = g.svf( eg, g.mul( 330, g.add( tune, 1 ) ), .05, 2, false ),
          out  = g.memo( g.add( snap, bpf1, g.mul( bpf2, .8 ) ) ), //XXX why is memo needed?
          scaledOut = g.mul( out, g.mul( gain, Loudness ) ),
          ife = g.switch( check, scaledOut, 0 ),
          props = Object.assign( {}, Snare.defaults, argumentProps )

    // XXX TODO : make above switch work with ifelse. the problem is that poke ugens put their
    // code at the bottom of the callback function, instead of at the end of the
    // associated if/else block.
    
    snare.env = eg 
    const __snare = Gibberish.factory( snare, ife, ['instruments','snare'], props  )
    
    return __snare
  }
  
  Snare.defaults = {
    gain: .5,
    tune:0,
    snappy: 1,
    decay:.1,
    loudness:1,
    __triggerLoudness:1
  }

  return Snare

}

},{"./instrument.js":179,"genish.js":40}],189:[function(require,module,exports){
/*fetch( '0000_Aspirin_sf2_file.json' )
.then( res => res.json() )
.then( json => {
  window.zones = json.zones
  console.log( window.zones )
})

ab = Gibberish.utilities..decodeArrayBuffer( zones[0].file )
genish.utilities.ctx.decodeAudioData( ab, buffer => {
  __ab = buffer
  console.log( 'buffer made' )
})


_d = data( __ab )
play( peek( _d, phasor(1,0,{min:0}) ) )
*/

const SHOULD_SUSTAIN = false

const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g

const soundfonts = {}

const banks = [
  'Aspirin',
  'Chaos',
  'FluidR3',
  'GeneralUserGS',
  'JCLive'
]

module.exports = function( Gibberish ) {
  const proto = Object.create( instrument )
  const memo = {}
  
  Object.assign( proto, {
    pickFile( sample ) {
      this.currentSample = sample
    },
    pick( __idx ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
    },
    pickplay( __idx ) {
      const idx = Math.floor( __idx )
      const keys = Object.keys( this.samplers )
      const key = keys[ idx ]
      this.currentSample = key
      return this.trigger()
    },
    __note( rate, loudness=null, decay=null ) {
      // soundfont measures pitch in cents
      // originalPitch = findMidiForHz( hz ) * 100 // (100 cents per midi index)
      // rate = Math.pow(2, (100.0 * pitch - originalPitch) / 1200.0) // 1200 cents per octave
      return this.trigger( loudness, rate, decay )
    },
    note( freq, loudness=null, decay=null ) {
      'no jsdsp'
      const midinote = 69 + 12 * Math.log2( freq/440 )
      return this.midinote( midinote, loudness, decay )
    },
    midipick( midinote, loudness ) {
      if( this.zones === undefined ) return
      // loop through zones to find correct sample #
      let idx = 0, pitch = 0 

      for( let zone of this.zones ) {
        const inzone  = midinote >= zone.keyRangeLow && midinote <= zone.keyRangeHigh 

        // in case floating-point "midinote" falls between two zones, which are integers
        const rounded = midinote - zone.keyRangeHigh < 1
        
        if( inzone || rounded ) { 
          pitch = zone.originalPitch
          break
        }

        idx++
      }

      this.pick( idx )
      return pitch
    },
    midinote( midinote, loudness=null, decay=null ) {
      'no jsdsp'
      const samplePitch = this.midipick( midinote )
      const pitch = Math.pow( 2, (100 * midinote - samplePitch ) / 1200 ) 
      //const pitch = 1//Math.pow( 2, (samplePitch ) ) 
      return this.__note( pitch, loudness, decay )
    }, 
    midichord( frequencies ) {
      if( Gibberish !== undefined && Gibberish.mode !== 'worklet' ) {
        frequencies.forEach( v => this.midinote( v ) )
        this.triggerChord = frequencies
      }
    },
    chord( frequencies, loudnesses=null, durations=null ) {
      if( Gibberish !== undefined && Gibberish.mode !== 'worklet' ) {
        if( loudnesses === null && durations === null ) {
          frequencies.forEach( v => this.note( v ) )
        }else if( durations === null ) {
          frequencies.forEach( (v,i) => 
            this.note( 
              v, 
              typeof loudnesses === 'object' ? loudnesses[i] : loudnesses 
            )
          )
        }else{
          frequencies.forEach( (v,i) => 
            this.note( 
              v, 
              typeof loudnesses === 'object' ? loudnesses[i] : loudnesses, 
              typeof durations  === 'object' ? durations[i]  : durations
            ) 
          )
        }
        this.triggerChord = frequencies
      }
    },

    setpan( num=0, value=.5 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.pan.memory.values.idx )
        voice.pan = value
      }
    },
    setrate( num=0, value=1 ) {
      if( Gibberish.mode === 'processor' ) {
        const voice = this.voices[ num ]
        // set voice buffer length
        //g.gen.memory.heap.set( [ value ], voice.rate.memory.values.idx )
        voice.rate = value
      }
    },
    trigger( volume=null, rate=null, decay=null ) {
      'no jsdsp'
      //if( volume !== null ) this.__triggerLoudness = volume

      let voice = null
      if( Gibberish.mode === 'processor' ) {
        const sampler = this.samplers[ this.currentSample ]

        // if sample isn't loaded...
        if( sampler === undefined ) {
          console.warn( 'no sampler found...', sampler, this.currentSample, this.samplers )
          return {}
        }

        voice = this.__getVoice__()

        const sampleRateRatio = Gibberish.ctx.sampleRate / sampler.zone.sampleRate
        const loopStart = sampler.zone.loopStart * sampleRateRatio
        const loopEnd   = sampler.zone.loopEnd   * sampleRateRatio

        if( rate !== null ) {
          voice.rate = rate
        }
        voice.decay = decay !== null ? decay : 1

        // set voice buffer length
        g.gen.memory.heap[ voice.bufferLength.memory.values.idx ] = sampler.dataLength 

        // set voice data index
        g.gen.memory.heap[ voice.bufferLoc.memory.values.idx ] = sampler.dataIdx

        g.gen.memory.heap[ voice.__playing.memory.values.idx   ] = 1
        g.gen.memory.heap[ voice.__loopStart.memory.values.idx ] = loopStart
        g.gen.memory.heap[ voice.__loopEnd.memory.values.idx   ] = loopEnd

        if( volume !== null )
          g.gen.memory.heap[ voice.__loudness.memory.values.idx ] = volume

        if( voice.cb !== null ) 
          Gibberish.scheduler.remove( voice.cb )

        // don't trigger this immediately if sustain
        // is being attempted
        if( !SHOULD_SUSTAIN ) voice.__decay.trigger()

        // XXX re-enable callback for sustain
        // have to also set it up in envelope later in code

        if( SHOULD_SUSTAIN ) {
          voice.cb = ()=> {
            voice.__decay.trigger() 
          }
          
          Gibberish.scheduler.add( 
            this.sustain, 
            voice.cb,
            0
          )
        }
        
        voice.trigger()
      }

      return voice
    },
    __getVoice__() {
      return this.voices[ this.voiceCount++ % this.voices.length ]
    },
  })

  const Soundfont = inputProps => {
    const syn = Object.create( proto )

    const props = Object.assign( { onload:null, voiceCount:0, files:[] }, Soundfont.defaults, inputProps )

    syn.isStereo = props.isStereo !== undefined ? props.isStereo : false

    const start = g.in( 'start' ), end = g.in( 'end' ), 
          rate = g.in( 'rate' ), shouldLoop = g.in( 'loops' ),
          loudness = g.in( 'loudness' ),
          sustain  = g.in( 'sustain' ),
          decay    = g.in( 'decay' ),
          triggerLoudness = g.in( '__triggerLoudness' ),
          // rate storage is used to determine whether we're playing
          // the sample forward or in reverse, for use in the 'trigger' method.
          rateStorage = g.data([0], 1, { meta:true })

    Object.assign( syn, props )

    if( Gibberish.mode === 'worklet' ) {
      syn.__meta__ = {
        address:'add',
        name: ['instruments', 'Soundfont'],
        properties: JSON.stringify(props), 
        id: syn.id
      }

      Gibberish.worklet.ugens.set( syn.id, syn )

      Gibberish.worklet.port.postMessage( syn.__meta__ )
    }

    // create all our vocecs
    const voices = []
    for( let i = 0; i < syn.maxVoices; i++ ) {
      'use jsdsp'

      const voice = {
        bang:         g.bang(),
        bufferLength: g.data( [1], 1, { meta:true }),
        bufferLoc:    g.data( [1], 1, { meta:true }),
        __pan:        g.data( [.5], 1, { meta:true }),
        __playing:    g.data( [0],  1, { meta:true }),
        __decaying:   g.data( [0],  1, { meta:true }),
        __rate:       g.data( [1],  1, { meta:true }),
        __decayV:     g.data( [1],  1, { meta:true }),
        __shouldLoop: g.data( [1],  1, { meta:true }),
        __loopStart:  g.data( [1],  1, { meta:true }),
        __loopEnd:    g.data( [1],  1, { meta:true }),
        __loudness:   g.data( [1],  1, { meta:true }),

        cb: null,

        get loudness() { 
          return g.gen.memory.heap[ this.__loudness.memory.values.idx ]
        },
        set loudness( v ) {
          g.gen.memory.heap[ this.__loudness.memory.values.idx ] = v
        },
        set pan(v) {
          g.gen.memory.heap[ this.__pan.memory.values.idx ] = v
        },
        set rate(v) {
          g.gen.memory.heap[ this.__rate.memory.values.idx ] = v
        },
        set decay(v) {
          g.gen.memory.heap[ this.__decayV.memory.values.idx ] = v
        },
      }

      voice.__decay = g.decay( decay * voice.__decayV[0] )

      voice.phase = g.counter( 
        rate * voice.__rate[0], 
        0,
        Infinity,
        voice.bang,
        0, 
        { shouldWrap:false, initialValue:9999999 }
      )

      const phaseOffset = voice.phase - voice.__loopStart[0]
      const loopLength  = 1 + voice.__loopEnd[0] - voice.__loopStart[0]
      const loopPos     = phaseOffset % loopLength
      const loopPhase   = voice.__loopStart[0] + loopPos 

      const phase = g.ifelse( 
        g.and( 
          voice.__playing[0], 
          g.lt( voice.phase, voice.__loopStart[0] ) 
        ), 

        voice.phase,

        loopPhase
        //g.ifelse( 
        //  voice.__decaying[0],
        //  loopPhase,//voice.phase,
        //  loopPhase
        //)
      )

      voice.trigger = voice.bang.trigger

      const state = g.peekDyn( 
        voice.bufferLoc[0],  
        voice.bufferLength[0],
        phase,

        { mode:'samples' }
      )

      // XXX giving up on sustain for now
      // it works for some samples but causes glitches/clicks in others
      // when the decay is triggered and i have no idea why
        
      const env = SHOULD_SUSTAIN 
        ? g.ifelse(
          // if voice is playing and phase is less than sustain 
            g.lt( voice.phase, sustain ),
            1,
            voice.__decay
          )
        : voice.__decay
      
      
      voice.graph = state 
        * env
        * voice.__playing[0]
        * loudness 
        * voice.__loudness[0]
      
      const pan = g.pan( voice.graph, voice.graph, voice.__pan[0] )
      voice.graph = [ pan.left, pan.right ]

      voices.push( voice )
    }

    // load in sample data
    const samplers = {}

    // bound to individual sampler objects in loadSample function
    syn.loadBuffer = function( buffer, onload ) {
      // main thread: when sample is loaded, copy it over message port
      // processor thread: onload is called via messageport handler, and
      // passed in the new buffer to be copied.
      if( Gibberish.mode === 'worklet' ) {
        const memIdx = Gibberish.memory.alloc( this.data.buffer.length, true )

        Gibberish.worklet.port.postMessage({
          address:'copy_multi',
          id:     syn.id,
          buffer: this.data.buffer,
          filename: this.filename
        })

        if( typeof onload === 'function' ) onload( this, buffer )

      }else if( Gibberish.mode === 'processor' ) {
        this.data.buffer = buffer 

        // set data memory spec before issuing memory request
        this.dataLength = this.data.memory.values.length = this.data.dim = this.data.buffer.length
        this.zone = syn.zones[ this.filename ]

        // request memory to copy the bufer over
        g.gen.requestMemory( this.data.memory, false )
        g.gen.memory.heap.set( this.data.buffer, this.data.memory.values.idx )

        // set location of buffer (does not work)
        this.dataIdx = this.data.memory.values.idx

        syn.currentSample = this.filename
      }
    }

    syn.loadSample = function( filename, __onload, buffer=null ) {
      'use jsdsp'

      const sampler = samplers[ filename ] = {
        dataLength: null,
        dataIdx: null,
        buffer: null,
        filename
      }

      const onload = syn.loadBuffer.bind( sampler ) 
      // passing a filename to data will cause it to be loaded in the main thread
      // onload will then be called to pass the buffer over the messageport. In the
      // processor thread, make a placeholder until data is available.
      if( Gibberish.mode === 'worklet' ) {
        sampler.data = g.data( buffer !== null ? buffer : filename, 1, { onload })

        // check to see if a promise is returned; a valid
        // data object is only return if the file has been
        // previously loaded and the corresponding buffer has
        // been cached.
        if( sampler.data instanceof Promise ) {
          sampler.data.then( d => {
            sampler.data = d
            memo[ filename ] = sampler.data 
            onload( sampler, __onload )
          })
        }else{
          // using a cached data buffer, no need
          // for asynchronous loading.
          memo[ filename ] = sampler
          sampler.dataLength = buffer.length
          onload( sampler, __onload )
        }     
      }else{
        // not sure if first case will happen with soundfonts (it does with regular multisampler)
        if( buffer === null ) {
          sampler.data = g.data( new Float32Array(), 1, { onload, filename })
          sampler.data.onload = onload
        }else{
          sampler.data = g.data( buffer, 1, { onload, filename })
          //sampler.data.onload = onload
          onload( buffer, __onload )
        }
      }

      return sampler
    }

    syn.load = function( soundNumber=0, bankIndex=0 ) {
      'no jsdsp'

      // need to memoize... already storing in soundfonts
      if( Gibberish.mode === 'processor' ) return

      // in case users pass name of soundfont instead of number
      if( typeof soundNumber === 'string' ) {
        let __soundNumber = Soundfont.names.indexOf( soundNumber )
        if( __soundNumber === -1 ) {
          __soundNumber = 0
          console.warn( `The ${soundNumber} Soundfont can't be found. Using Piano instead.` )
        }
        soundNumber = __soundNumber   
      }

      let num = (soundNumber) + '0'
      if( soundNumber < 100 ) num = '0'+num
      if( soundNumber < 10 )  num = '0'+num

      fetch( `${Soundfont.resourcePath}${num}_${banks[bankIndex]}.sf2.json` )
        .then( res => res.json() )
        .then( json => {
          const zones = soundfonts[ soundNumber ] = json.zones
          this.zones = zones
          for( let i = 0; i < zones.length; i++) {
            const zone = zones[i]
            const ab = Gibberish.utilities.base64.decodeArrayBuffer( zone.file )
            g.utilities.ctx.decodeAudioData( ab, buffer => {
              zone.sampler = syn.loadSample( i, null, buffer )
            })
          }
        })
    }

    //props.files.forEach( filename => syn.loadSample( filename ) )

    syn.__createGraph = function() {
      'use jsdsp'
      
      const graphs = voices.map( voice => voice.graph )
      const left = g.add( ...voices.map( voice => voice.graph[0] ) )
      const right = g.add( ...voices.map( voice => voice.graph[1] ) )
      const gain = g.in( 'gain' )
      syn.graph = [ left * gain, right * gain ]

      if( syn.panVoices === true ) { 
        const panner = g.pan( syn.graph[0], syn.graph[1], g.in( 'pan' ) ) 
        syn.graph = [ panner.left, panner.right ]
      }
    }

    syn.__createGraph()

    const out = Gibberish.factory( 
      syn,
      syn.graph,
      ['instruments','soundfont'], 
      props 
    ) 

    Gibberish.preventProxy = true
    Gibberish.proxyEnabled = false

    out.voices = voices
    out.samplers = samplers

    Gibberish.proxyEnabled = true
    Gibberish.preventProxy = false

    return out
  }

  Soundfont.defaults = {
    gain: 1,
    pan: .5,
    rate: 1,
    panVoices:true,
    shouldLoop:false,
    loops: 0,
    start:0,
    end:1,
    bufferLength:-999999999,
    loudness:1,
    sustain: 44100,
    decay: 44100,
    maxVoices:5, 
    __triggerLoudness:1
  }

  Soundfont.resourcePath = 'resources/soundfonts/'
  Soundfont.names = [
    "Acoustic Grand Piano",
    "Bright Acoustic Piano",
    "Electric Grand Piano",
    "Honky-tonk Piano",
    "Electric Piano 1",
    "Electric Piano 2",
    "Harpsichord",
    "Clavi",
    "Celesta",
    "Glockenspiel",
    "Music Box",
    "Vibraphone",
    "Marimba",
    "Xylophone",
    "Tubular Bells",
    "Dulcimer",
    "Drawbar Organ",
    "Percussive Organ",
    "Rock Organ",
    "Church Organ",
    "Reed Organ",
    "Accordion",
    "Harmonica",
    "Tango Accordion",
    "Acoustic Guitar (nylon)",
    "Acoustic Guitar (steel)",
    "Electric Guitar (jazz)",
    "Electric Guitar (clean)",
    "Electric Guitar (muted)",
    "Overdriven Guitar",
    "Distortion Guitar",
    "Guitar harmonics",
    "Acoustic Bass",
    "Electric Bass (finger)",
    "Electric Bass (pick)",
    "Fretless Bass",
    "Slap Bass 1",
    "Slap Bass 2",
    "Synth Bass 1",
    "Synth Bass 2",
    "Violin",
    "Viola",
    "Cello",
    "Contrabass",
    "Tremolo Strings",
    "Pizzicato Strings",
    "Orchestral Harp",
    "Timpani",
    "String Ensemble 1",
    "String Ensemble 2",
    "SynthStrings 1",
    "SynthStrings 2",
    "Choir Aahs",
    "Voice Oohs",
    "Synth Voice",
    "Orchestra Hit",
    "Trumpet",
    "Trombone",
    "Tuba",
    "Muted Trumpet",
    "French Horn",
    "Brass Section",
    "SynthBrass 1",
    "SynthBrass 2",
    "Soprano Sax",
    "Alto Sax",
    "Tenor Sax",
    "Baritone Sax",
    "Oboe",
    "English Horn",
    "Bassoon",
    "Clarinet",
    "Piccolo",
    "Flute",
    "Recorder",
    "Pan Flute",
    "Blown Bottle",
    "Shakuhachi",
    "Whistle",
    "Ocarina",
    "Lead 1 (square)",
    "Lead 2 (sawtooth)",
    "Lead 3 (calliope)",
    "Lead 4 (chiff)",
    "Lead 5 (charang)",
    "Lead 6 (voice)",
    "Lead 7 (fifths)",
    "Lead 8 (bass + lead)",
    "Pad 1 (new age)",
    "Pad 2 (warm)",
    "Pad 3 (polysynth)",
    "Pad 4 (choir)",
    "Pad 5 (bowed)",
    "Pad 6 (metallic)",
    "Pad 7 (halo)",
    "Pad 8 (sweep)",
    "FX 1 (rain)",
    "FX 2 (soundtrack)",
    "FX 3 (crystal)",
    "FX 4 (atmosphere)",
    "FX 5 (brightness)",
    "FX 6 (goblins)",
    "FX 7 (echoes)",
    "FX 8 (sci-fi)",
    "Sitar",
    "Banjo",
    "Shamisen",
    "Koto",
    "Kalimba",
    "Bag pipe",
    "Fiddle",
    "Shanai",
    "Tinkle Bell",
    "Agogo",
    "Steel Drums",
    "Woodblock",
    "Taiko Drum",
    "Melodic Tom",
    "Synth Drum",
    "Reverse Cymbal",
    "Guitar Fret Noise",
    "Breath Noise",
    "Seashore",
    "Bird Tweet",
    "Telephone Ring",
    "Helicopter",
    "Applause",
    "Gunshot"
  ]

  Soundfont.inspect = function() {
    console.table( Soundfont.names )
  }

  return Soundfont
}

},{"./instrument.js":179,"genish.js":40}],190:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

const genish = g

module.exports = function( Gibberish ) {

  const Synth = inputProps => {
    const syn = Object.create( instrument )

    const frequency = g.in( 'frequency' ),
          loudness  = g.in( 'loudness' ), 
          triggerLoudness = g.in( '__triggerLoudness' ),
          glide = g.max( 1, g.in( 'glide' ) ),
          slidingFreq = g.slide( frequency, glide, glide ),
          attack = g.in( 'attack' ), decay = g.in( 'decay' ),
          sustain = g.in( 'sustain' ), sustainLevel = g.in( 'sustainLevel' ),
          release = g.in( 'release' )

    const props = Object.assign( {}, Synth.defaults, inputProps )
    Object.assign( syn, props )

    syn.__createGraph = function() {
      const osc = Gibberish.oscillators.factory( syn.waveform, slidingFreq, syn.antialias )

      const env = Gibberish.envelopes.factory( 
        props.useADSR, 
        props.shape, 
        attack, decay, 
        sustain, sustainLevel, 
        release, 
        props.triggerRelease
      )


      // syn.env = env
      // below doesn't work as it attempts to assign to release property triggering codegen...
      syn.advance = ()=> { env.release() }

      {
        'use jsdsp'
        let oscWithEnv = osc * env * loudness * triggerLoudness,
            saturation = g.in('saturation'),
            panner

        // 16 is an unfortunate empirically derived magic number...
        const baseCutoffFreq = g.in('cutoff') * ( frequency /  ( g.gen.samplerate / 16 ) ) 
        const cutoff = g.min( baseCutoffFreq * g.pow( 2, g.in('filterMult') * loudness * triggerLoudness ) * env, .995 ) 
        const filteredOsc = Gibberish.filters.factory( oscWithEnv, cutoff, saturation, props )

        let synthWithGain = filteredOsc * g.in( 'gain' )
        
        // XXX This line has to be here for correct code generation to work when
        // saturation is not being used... obviously this should cancel out. 
        if( syn.filterModel !== 2 ) synthWithGain = synthWithGain + saturation - saturation
    
        if( syn.panVoices === true ) { 
          panner = g.pan( synthWithGain, synthWithGain, g.in( 'pan' ) ) 
          syn.graph = [ panner.left, panner.right ]
          syn.isStereo = true
        }else{
          syn.graph = synthWithGain
          syn.isStereo = false
        }

        syn.env = env
        syn.osc = osc
        syn.filter = filteredOsc
      }

      return env

    }
    
    syn.__requiresRecompilation = [ 'waveform', 'antialias', 'filterModel','filterMode', 'useADSR', 'shape' ]
    const env = syn.__createGraph()

    const out = Gibberish.factory( syn, syn.graph, ['instruments', 'synth'], props, null, true, ['saturation']  )

    out.env.advance = out.advance 

    return out
  }
  
  Synth.defaults = {
    waveform:'saw',
    attack: 44,
    decay: 22050,
    sustain:44100,
    sustainLevel:.6,
    release:22050,
    useADSR:false,
    shape:'linear',
    triggerRelease:false,
    gain: .5,
    pulsewidth:.25,
    frequency:220,
    pan: .5,
    antialias:false,
    panVoices:false,
    loudness:1,
    __triggerLoudness:1,
    glide:1,
    saturation:1,
    filterMult:2,
    Q:.25,
    cutoff:.5,
    filterModel:1,
    filterMode:0
  }

  // do not include velocity, which shoudl always be per voice
  let PolySynth = Gibberish.PolyTemplate( Synth, ['frequency','attack','decay','pulsewidth','pan','gain','glide', 'saturation', 'filterMult', 'Q', 'cutoff', 'resonance', 'antialias', 'filterModel', 'waveform', 'filterMode', '__triggerLoudness', 'loudness'] ) 
  PolySynth.defaults = Synth.defaults

  return [ Synth, PolySynth ]

}

},{"./instrument.js":179,"genish.js":40}],191:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Tom = argumentProps => {
    let tom = Object.create( instrument )
    
    const decay   = g.in( 'decay' ),
          pitch   = g.in( 'frequency' ),
          gain    = g.in( 'gain' ),
          loudness = g.in( 'loudness' ),
          triggerLoudness = g.in( '__triggerLoudness' )

    const props = Object.assign( {}, Tom.defaults, argumentProps )

    const trigger = g.bang(),
          impulse = g.mul( trigger, 1 ),
          eg = g.decay( g.mul( decay, g.gen.samplerate * 2 ), { initValue:0 } ), 
          bpf = g.mul( g.svf( impulse, pitch, .0175, 2, false ), 10 ),
          noise = g.gtp( g.noise(), 0 ), // rectify noise
          envelopedNoise = g.mul( noise, eg ),
          lpf = g.mul( g.svf( envelopedNoise, 120, .5, 0, false ), 2.5 ),
          out = g.mul( g.add( bpf, lpf ), g.mul( gain, g.mul( loudness, triggerLoudness ) ) )

    tom.env = {
      trigger: function() {
        eg.trigger()
        trigger.trigger()
      }
    }

    tom.isStereo = false

    tom = Gibberish.factory( tom, out, ['instruments', 'tom'], props  )
    
    return tom
  }
  
  Tom.defaults = {
    gain: 1,
    decay:.7,
    frequency:120,
    loudness:1,
    __triggerLoudness:1
  }

  return Tom
}

},{"./instrument.js":179,"genish.js":40}],192:[function(require,module,exports){
const ugenproto = require( '../ugen.js' )(),
     __proxy     = require( '../workletProxy.js' ),
     g = require( 'genish.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )

  const createProperties = function( p, id ) {
    for( let i = 0; i < 2; i++ ) {
      Object.defineProperty( p, i, {
        configurable:true,
        get() { return p.inputs[ i ] },
        set(v) {
          p.inputs[ i ] = v
          if( Gibberish.mode === 'worklet' ) {
            if( typeof v === 'number' ) {
              Gibberish.worklet.port.postMessage({ 
                address:'addToProperty', 
                object:id,
                name:'inputs',
                key:i,
                value:v
              })
            }else{
              Gibberish.worklet.port.postMessage({ 
                address:'addObjectToProperty', 
                object:id,
                name:'inputs',
                key:i,
                value:v.id
              })
            }
            Gibberish.worklet.port.postMessage({
              address:'dirty',
              id
            })
          }
        }
      })
    }
  }

  const Binops = {
    export( obj ) {
      for( let key in Binops ) {
        if( key !== 'export' ) {
          obj[ key ] = Binops[ key ]
        }
      }
    },
    
    Add( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      const isStereo = Gibberish.__isStereo( args[0] ) || Gibberish.__isStereo( args[1] )
      Object.assign( ugen, { isop:true, op:'+', inputs:args, ugenName:'add' + id, id, isStereo } )
      
      const p = proxy( ['binops','Add'], { isop:true, inputs:args }, ugen )
      createProperties( p, id )

      return p
    },

    Sub( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      const isStereo = Gibberish.__isStereo( args[0] ) || Gibberish.__isStereo( args[1] )
      Object.assign( ugen, { isop:true, op:'-', inputs:args, ugenName:'sub' + id, id, isStereo } )

      return proxy( ['binops','Sub'], { isop:true, inputs:args }, ugen )
    },

    Mul( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      const isStereo = Gibberish.__isStereo( args[0] ) || Gibberish.__isStereo( args[1] )
      Object.assign( ugen, { isop:true, op:'*', inputs:args, ugenName:'mul' + id, id, isStereo } )

      const p = proxy( ['binops','Mul'], { isop:true, inputs:args }, ugen )
      createProperties( p, id )
      return p
    },

    Div( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      const isStereo = Gibberish.__isStereo( args[0] ) || Gibberish.__isStereo( args[1] )
      Object.assign( ugen, { isop:true, op:'/', inputs:args, ugenName:'div' + id, id, isStereo} )
    
      const p = proxy( ['binops','Div'], { isop:true, inputs:args }, ugen )
      createProperties( p, id )

      return p
    },

    Mod( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      const isStereo = Gibberish.__isStereo( args[0] ) || Gibberish.__isStereo( args[1] )
      Object.assign( ugen, { isop:true, op:'%', inputs:args, ugenName:'mod' + id, id, isStereo} )

      const p = proxy( ['binops','Mod'], { isop:true, inputs:args }, ugen )
      createProperties( p, id )

      return p
    },   
  }

  for( let key in Binops ) {
    Binops[ key ].defaults = { 0:0, 1:0 }
  }

  return Binops
}

},{"../ugen.js":208,"../workletProxy.js":210,"genish.js":40}],193:[function(require,module,exports){
let g = require( 'genish.js' ),
    ugen = require( '../ugen.js' )(),
    __proxy= require( '../workletProxy.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )
  const Bus = Object.create( ugen )

  Object.assign( Bus, {
    gain: {
      set( v ) {
        this.mul.inputs[ 1 ] = v
        Gibberish.dirty( this )
      },
      get() {
        return this.mul[ 1 ]
      }
    },

    __addInput( input ) {
      this.sum.inputs.push( input )
      Gibberish.dirty( this )
    },

    create( _props ) {
      const props = Object.assign({}, Bus.defaults, { inputs:[0] }, _props )

      // MUST PREVENT PROXY
      // Othherwise these binops are created in the worklet and sent
      // across the thread to be instantiated, and then instantiated again
      // when the bus is created in the processor thread, messing up the various
      // uids involved. By preventing proxying the binops are only created
      // a single time when the bus is sent across the thread.
      Gibberish.preventProxy = true
      const sum = Gibberish.binops.Add( ...props.inputs )
      const mul = Gibberish.binops.Mul( sum, props.gain )
      Gibberish.preventProxy = false

      const graph = Gibberish.Panner({ input:mul, pan: props.pan })

      graph.sum = sum
      graph.mul = mul
      graph.disconnectUgen = Bus.disconnectUgen

      graph.__properties__ = props

      const out = props.__useProxy__ === true ? proxy( ['Bus'], props, graph ) : graph

      Object.defineProperty( out, 'gain', Bus.gain )

      if( false && Gibberish.preventProxy === false && Gibberish.mode === 'worklet' ) {
        const meta = {
          address:'add',
          name:['Bus'],
          props, 
          id:graph.id
        }
        Gibberish.worklet.port.postMessage( meta )
        Gibberish.worklet.port.postMessage({ 
          address:'method', 
          object:graph.id,
          name:'connect',
          args:[]
        })
      }

      return out 
    },

    disconnectUgen( ugen ) {
      let removeIdx = this.sum.inputs.indexOf( ugen )

      if( removeIdx !== -1 ) {
        this.sum.inputs.splice( removeIdx, 1 )
        Gibberish.dirty( this )
      }
    },

    // can't include inputs here as it will be sucked up by Gibber,
    // instead pass during Object.assign() after defaults.
    defaults: { gain:1, pan:.5, __useProxy__:true }
  })

  const constructor = Bus.create.bind( Bus )
  constructor.defaults = Bus.defaults

  return constructor
}


},{"../ugen.js":208,"../workletProxy.js":210,"genish.js":40}],194:[function(require,module,exports){
const g = require( 'genish.js' ),
      ugen = require( '../ugen.js' )(),
      __proxy = require( '../workletProxy.js' )


module.exports = function( Gibberish ) {
  const Bus2 = Object.create( ugen )
  const proxy = __proxy( Gibberish )

  let bufferL, bufferR
  
  Object.assign( Bus2, { 
    create( __props ) {

      if( bufferL === undefined ) {
        // XXX I guess this is to setup wavetables if they're not created?
        const p = g.pan()
        
        // copy memory... otherwise the wavetables don't have memory indices.
        bufferL = Gibberish.memory.alloc(1024)
        Gibberish.memory.heap.set( Gibberish.genish.gen.globals.panL.buffer, bufferL )

        bufferR = Gibberish.memory.alloc(1024)
        Gibberish.memory.heap.set( Gibberish.genish.gen.globals.panR.buffer, bufferR )
      }

      // XXX must be same type as what is returned by genish for type checks to work correctly
      const output = new Float64Array( 2 ) 

      const bus = Object.create( Bus2 )

      let init = false

      const props = Object.assign({}, Bus2.defaults, __props )

      Object.assign( 
        bus,

        {
          callback() {
            output[ 0 ] = output[ 1 ] = 0
            const lastIdx = arguments.length - 1
            const memory  = arguments[ lastIdx ]
            let pan  = arguments[ lastIdx - 1 ]
            const gain = arguments[ lastIdx - 2 ]

            for( let i = 0; i < lastIdx - 2; i+= 3 ) {
              const input = arguments[ i ],
                    level = arguments[ i + 1 ],
                    isStereo = arguments[ i + 2 ]

              output[ 0 ] += isStereo === true ? input[ 0 ] * level : input * level

              output[ 1 ] += isStereo === true ? input[ 1 ] * level : input * level
            }

            if( pan < 0 ) {
              pan = 0
            }else if( pan > 1 ){
              pan = 1
            }

            const panRawIndex  = pan * 1023,
                  panBaseIndex = panRawIndex | 0,
                  panNextIndex = (panBaseIndex + 1) & 1023,
                  interpAmount = panRawIndex - panBaseIndex,
                  panL = memory[ bufferL + panBaseIndex ] 
                    + ( interpAmount * ( memory[ bufferL + panNextIndex ] - memory[ bufferL + panBaseIndex ] ) ),
                  panR = memory[ bufferR + panBaseIndex ] 
                    + ( interpAmount * ( memory[ bufferR + panNextIndex ] - memory[ bufferR + panBaseIndex ] ) )
            
            output[0] *= gain * panL
            output[1] *= gain * panR

            return output
          },
          id : Gibberish.factory.getUID(),
          dirty : false,
          type : 'bus',
          inputs:[ 1, .5 ],
          isStereo: true,
          __properties__:props
        },

        Bus2.defaults,

        props
      )

      bus.ugenName = bus.callback.ugenName = 'bus2_' + bus.id

      const out = bus.__useProxy__ === true ? proxy( ['Bus2'], props, bus ) : bus


      // we have to include custom properties for these as the argument list for
      // the compiled output function is variable
      // so codegen can't know the correct argument order for the function
      let pan = .5
      Object.defineProperty( out, 'pan', {
        get() { return pan },
        set(v){ 
          pan = v
          out.inputs[ out.inputs.length - 1 ] = pan
          Gibberish.dirty( out )
        }
      })

      let gain = 1
      Object.defineProperty( out, 'gain', {
        get() { return gain },
        set(v){ 
          gain = v
          out.inputs[ out.inputs.length - 2 ] = gain
          Gibberish.dirty( out )
        }
      })

      return out
    },
    
    disconnectUgen( ugen ) {
      let removeIdx = this.inputs.indexOf( ugen )

      if( removeIdx !== -1 ) {
        this.inputs.splice( removeIdx, 3 )
        Gibberish.dirty( this )
      }
    },

    defaults: { gain:1, pan:.5, __useProxy__:true }
  })

  const constructor = Bus2.create.bind( Bus2 )
  constructor.defaults = Bus2.defaults

  return constructor

}

},{"../ugen.js":208,"../workletProxy.js":210,"genish.js":40}],195:[function(require,module,exports){
const  g    = require( 'genish.js'  ),
       ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {

  const Monops = {
    export( obj ) {
      for( let key in Monops ) {
        if( key !== 'export' ) {
          obj[ key ] = Monops[ key ]
        }
      }
    },
    
    Abs( input ) {
      const abs = Object.create( ugen )
      const graph = g.abs( g.in('input') )
      
      const __out = Gibberish.factory( abs, graph, ['monops','abs'], Object.assign({}, Monops.defaults, { inputs:[input], isop:true }) )

      __out.isop = true

      console.log( __out )

      return __out
    },

    Pow( input, exponent ) {
      const pow = Object.create( ugen )
      const graph = g.pow( g.in('input'), g.in('exponent') )
      
      const __out =  Gibberish.factory( pow, graph, ['monops','pow'], Object.assign({}, Monops.defaults, { inputs:[input], exponent, isop:true }) )

      __out.isop = true

      return __out
    },
    Clamp( input, min, max ) {
      const clamp = Object.create( ugen )
      const graph = g.clamp( g.in('input'), g.in('min'), g.in('max') )
      
      const __out = Gibberish.factory( clamp, graph, ['monops','clamp'], Object.assign({}, Monops.defaults, { inputs:[input], isop:true, min, max }) )

      __out.isop = true

      return __out
    },

    Merge( input ) {
      const merger = Object.create( ugen )
      const cb = function( _input ) {
        return _input[0] + _input[1]
      }

      Gibberish.factory( merger, g.in( 'input' ), ['monops','merge'], { inputs:[input], isop:true }, cb )
      merger.type = 'analysis'
      merger.inputNames = [ 'input' ]
      merger.inputs = [ input ]
      merger.input = input
      
      return merger
    },
  }

  Monops.defaults = { input:0 }

  return Monops
}

},{"../ugen.js":208,"genish.js":40}],196:[function(require,module,exports){
const g = require( 'genish.js' )

const ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {
 
let Panner = inputProps => {
  const props  = Object.assign( {}, Panner.defaults, inputProps ),
        panner = Object.create( ugen )

  const isStereo = props.input.isStereo !== undefined ? props.input.isStereo : Array.isArray( props.input ) 
  
  const input = g.in( 'input' ),
        pan   = g.in( 'pan' )

  let graph 
  if( isStereo ) {
    graph = g.pan( input[0], input[1], pan )  
  }else{
    graph = g.pan( input, input, pan )
  }

  Gibberish.factory( panner, [ graph.left, graph.right], ['panner'], props )
  
  return panner
}

Panner.defaults = {
  input:0,
  pan:.5
}

return Panner 

}

},{"../ugen.js":208,"genish.js":40}],197:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const Time = {
    bpm: 120,

    export: function(target) {
      Object.assign( target, Time )
    },

    ms : function(val) {
      return val * Gibberish.ctx.sampleRate / 1000;
    },

    seconds : function(val) {
      return val * Gibberish.ctx.sampleRate;
    },

    beats : function(val) {
      return function() { 
        var samplesPerBeat = Gibberish.ctx.sampleRate / ( Gibberish.Time.bpm / 60 ) ;
        return samplesPerBeat * val ;
      }
    }
  }

  return Time
}

},{}],198:[function(require,module,exports){
const genish = require( 'genish.js' ),
      ssd = genish.history,
      noise = genish.noise

module.exports = function() {
  "use jsdsp"

  const last = ssd( 0 )

  const white = ( noise() * 2 ) - 1

  let out = (last.out + (.02 * white)) / 1.02

  last.in( out )

  out *= 3.5
   
  return out
}

},{"genish.js":40}],199:[function(require,module,exports){
let g = require( 'genish.js' )

let feedbackOsc = function( frequency, filter, pulsewidth=.5, argumentProps ) {
  if( argumentProps === undefined ) argumentProps = { type: 0 }

  let lastSample = g.history(),
      // determine phase increment and memoize result
      w = g.memo( g.div( frequency, g.gen.samplerate ) ),
      // create scaling factor
      n = g.sub( -.5, w ),
      scaling = g.mul( g.mul( 13, filter ), g.pow( n, 5 ) ),
      // calculate dc offset and normalization factors
      DC = g.sub( .376, g.mul( w, .752 ) ),
      norm = g.sub( 1, g.mul( 2, w ) ),
      // determine phase
      osc1Phase = g.accum( w, 0, { min:-1 }),
      osc1, out

  // create current sample... from the paper:
  // osc = (osc + sin(2*pi*(phase + osc*scaling)))*0.5f;
  osc1 = g.memo( 
    g.mul(
      g.add(
        lastSample.out,
        g.sin(
          g.mul(
            Math.PI * 2,
            g.memo( g.add( osc1Phase, g.mul( lastSample.out, scaling ) ) )
          )
        )
      ),
      .5
    )
  )

  // store sample to use as modulation
  lastSample.in( osc1 )

  // if pwm / square waveform instead of sawtooth...
  if( argumentProps.type === 1 ) { 
    const lastSample2 = g.history() // for osc 2
    const lastSampleMaster = g.history() // for sum of osc1,osc2

    const osc2 = g.mul(
      g.add(
        lastSample2.out,
        g.sin(
          g.mul(
            Math.PI * 2,
            g.memo( g.add( osc1Phase, g.mul( lastSample2.out, scaling ), pulsewidth ) )
          )
        )
      ),
      .5
    )

    lastSample2.in( osc2 )
    out = g.memo( g.sub( lastSample.out, lastSample2.out ) )
    out = g.memo( g.add( g.mul( 2.5, out ), g.mul( -1.5, lastSampleMaster.out ) ) )
    
    lastSampleMaster.in( g.sub( osc1, osc2 ) )

  }else{
     // offset and normalize
    osc1 = g.add( g.mul( 2.5, osc1 ), g.mul( -1.5, lastSample.out ) )
    osc1 = g.add( osc1, DC )
 
    out = osc1
  }

  return g.mul( out, norm )
}

module.exports = feedbackOsc

},{"genish.js":40}],200:[function(require,module,exports){
const g = require( 'genish.js' ),
      ugen = require( '../ugen.js' )(),
      feedbackOsc = require( './fmfeedbackosc.js' ),
      polyBlep = require( './polyblep.dsp.js' )

//  __makeOscillator__( type, frequency, antialias ) {
    
module.exports = function( Gibberish ) {
  let Oscillators = {
    export( obj ) {
      for( let key in Oscillators ) {
        if( key !== 'export' ) {
          obj[ key ] = Oscillators[ key ]
        }
      }
    },

    genish: {
      Brown: require( './brownnoise.dsp.js' ),
      Pink:  require( './pinknoise.dsp.js'  )
    },

    Wavetable: require( './wavetable.js' )( Gibberish ),
    
    Square( inputProps ) {
      const sqr   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'square', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( sqr, graph, ['oscillators','square'], props )

      return out
    },

    Triangle( inputProps ) {
      const tri= Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'triangle', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( tri, graph, ['oscillators','triangle'], props )

      return out
    },

    PWM( inputProps ) {
      const pwm   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false, pulsewidth:.25 }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'pwm', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( pwm, graph, ['oscillators','PWM'], props )

      return out
    },

    Sine( inputProps ) {
      const sine  = Object.create( ugen )
      const props = Object.assign({}, Oscillators.defaults, inputProps )
      const graph = g.mul( g.cycle( g.in('frequency') ), g.in('gain') )

      const out = Gibberish.factory( sine, graph, ['oscillators','sine'], props )
      
      return out
    },

    Noise( inputProps ) {
      const noise = Object.create( ugen )
      const props = Object.assign( {}, { gain: 1, color:'white' }, inputProps )
      let graph 

      switch( props.color ) {
        case 'brown':
          graph = g.mul( Oscillators.genish.Brown(), g.in('gain') )
          break;
        case 'pink':
          graph = g.mul( Oscillators.genish.Pink(), g.in('gain') )
          break;
        default:
          graph = g.mul( g.noise(), g.in('gain') )
          break;
      }

      const out = Gibberish.factory( noise, graph, ['oscillators','noise'], props )

      return out
    },

    Saw( inputProps ) {
      const saw   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'saw', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( saw, graph, ['oscillators','saw'], props )

      return out
    },

    ReverseSaw( inputProps ) {
      const saw   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = g.sub( 1, Oscillators.factory( 'saw', g.in( 'frequency' ), props.antialias ) )
      const graph = g.mul( osc, g.in( 'gain' ) )

      const out = Gibberish.factory( saw, graph, ['oscillators','ReverseSaw'], props )
      
      return out
    },

    factory( type, frequency, antialias=false ) {
      let osc

      switch( type ) {
        case 'pwm':
          let pulsewidth = g.in('pulsewidth')
          if( antialias == true ) {
            osc = feedbackOsc( frequency, 1, pulsewidth, { type:1 })
          }else{
            let phase = g.phasor( frequency, 0, { min:0 } )
            osc = g.lt( phase, pulsewidth )
          }
          break;
        case 'saw':
          if( antialias == false ) {
            osc = g.phasor( frequency )
          }else{
            osc = polyBlep( frequency, { type })
          }
          break;
        case 'sine':
          osc = g.cycle( frequency )
          break;
        case 'square':
          if( antialias == true ) {
            //osc = feedbackOsc( frequency, 1, .5, { type:1 })
            osc = polyBlep( frequency, { type })
          }else{
            osc = g.wavetable( frequency, { buffer:Oscillators.Square.buffer, name:'square' } )
          }
          break;
        case 'triangle':
          if( antialias == true ) {
            osc = polyBlep( frequency, { type })
          }else{
            osc = g.wavetable( frequency, { buffer:Oscillators.Triangle.buffer, name:'triangle' } )
          }
          break;
        case 'noise':
          osc = g.noise()
          break;
      }

      return osc
    }
  }

  Oscillators.Square.buffer = new Float32Array( 1024 )

  for( let i = 1023; i >= 0; i-- ) { 
    Oscillators.Square.buffer [ i ] = i / 1024 > .5 ? 1 : -1
  }

  Oscillators.Triangle.buffer = new Float32Array( 1024 )

  
  for( let i = 1024; i--; i = i ) { Oscillators.Triangle.buffer[i] = 1 - 4 * Math.abs(( (i / 1024) + 0.25) % 1 - 0.5); }

  Oscillators.defaults = {
    frequency: 440,
    gain: 1
  }

  return Oscillators

}

},{"../ugen.js":208,"./brownnoise.dsp.js":198,"./fmfeedbackosc.js":199,"./pinknoise.dsp.js":201,"./polyblep.dsp.js":202,"./wavetable.js":203,"genish.js":40}],201:[function(require,module,exports){
const genish = require( 'genish.js' ),
      ssd = genish.history,
      data = genish.data,
      noise = genish.noise

module.exports = function() {
  "use jsdsp"

  const b = data( 8, 1, { meta: true })
  const white = noise() * 2 - 1

  b[0] = ( .99886 * b[0] ) + ( white * .0555179 )
  b[1] = ( .99332 * b[1] ) + ( white * .0750579 )
  b[2] = ( .96900 * b[2] ) + ( white * .1538520 )
  b[3] = ( .88650 * b[3] ) + ( white * .3104856 )
  b[4] = ( .55000 * b[4] ) + ( white * .5329522 )
  b[5] = ( -.7616 * b[5] ) - ( white * .0168980 )
 
  const out = ( b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * .5362 ) * .11

  b[6] = white * .115926

  return out

}

},{"genish.js":40}],202:[function(require,module,exports){
const genish = require( 'genish.js' )
const g = genish

// based on http://www.martin-finke.de/blog/articles/audio-plugins-018-polyblep-oscillator/
const polyBlep = function( __frequency, argumentProps ) {
  'use jsdsp'
  if( argumentProps === undefined ) argumentProps = { type: 'saw' }
  
  const mem = g.history(0)
  const type = argumentProps.type
  const frequency = __frequency === undefined ? 220 : __frequency
  const dt = frequency / g.gen.samplerate
  
  const t = g.accum( dt, 0, { min:0 })
  let osc

  // triangle waves are integrated square waves, so the below case accomodates both types
  if( type === 'triangle' || type === 'square' ) {
    // lt NOT gt to get correct phase
    osc = (2 * g.lt(t,.5) ) - 1
  }else{
    osc = 2 * t - 1
  }
  const case1 = g.lt(t,dt)
  const case2 = g.gt(t,1-dt)
  const adjustedT = g.switch( case1, t/dt, g.switch( case2, (t-1)/dt, t ) )
  
  // if/elseif/else with nested ternary operators
  const blep = g.switch(
    case1,
    adjustedT + adjustedT - adjustedT * adjustedT - 1,
    g.switch(
      case2,
      adjustedT * adjustedT + adjustedT + adjustedT + 1,
      // final else case is 0
      0
    )
  )
  
  // triangle waves are integrated square waves, so the below case accomodates both types
  if( type !== 'saw' ) {
    osc = osc + blep
    const t_2 = g.memo( g.mod( t + .5, 1 ) )
    const case1_2 = g.lt(t_2,dt)
    const case2_2 = g.gt(t_2,1-dt)
    const adjustedT_2 = g.switch( case1_2, t_2/dt, g.switch( case2_2, (t_2-1)/dt, t_2 ) )
 
    const blep2 = g.switch(
      case1_2,
      adjustedT_2 + adjustedT_2 - adjustedT_2 * adjustedT_2 - 1,
      g.switch(
        case2_2,
        adjustedT_2 * adjustedT_2 + adjustedT_2 + adjustedT_2 + 1,
        0
      )
    )
    osc = osc - blep2
    
    // leaky integrator to create triangle from square wave
    if( type === 'triangle' ) {
      osc = dt * osc + (1 - dt ) * mem.out
      mem.in( osc )
    }
  }else{
    osc = osc - blep
  }
  
  return osc
}

module.exports = polyBlep 

},{"genish.js":40}],203:[function(require,module,exports){
let g = require( 'genish.js' ),
    ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {

  const Wavetable = function( inputProps ) {
    const wavetable = Object.create( ugen )
    const props  = Object.assign({}, Gibberish.oscillators.defaults, inputProps )
    const osc = g.wavetable( g.in('frequency'), props )
    const graph = g.mul( 
      osc, 
      g.in( 'gain' )
    )

    Gibberish.factory( wavetable, graph, 'wavetable', props )

    return wavetable
  }

  g.wavetable = function( frequency, props ) {
    let dataProps = { immutable:true }

    // use global references if applicable
    if( props.name !== undefined ) dataProps.global = props.name

    const buffer = g.data( props.buffer, 1, dataProps )

    return g.peek( buffer, g.phasor( frequency, 0, { min:0 } ) )
  }

  return Wavetable
}

},{"../ugen.js":208,"genish.js":40}],204:[function(require,module,exports){
//const Queue = require( '../external/priorityqueue.js' )
const HeapQueue = function() {
  const obj = {
    cmp( a,b ) { return a.time - b.time },
    data: [],
    push( o ) {
      obj.data.push( o )
      obj.data.sort( obj.cmp )
    },
    peek() { return obj.data[0] },
    pop() { 
      obj.data.shift()
      obj.data.sort( obj.cmp )
    }
  }

  return obj
}

let Gibberish = null

const Scheduler = {
  phase: 0,

  queue: HeapQueue( ( a, b ) => {
    if( a.time === b.time ) { 
      return a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : 0;
    }else{
      return a.time - b.time
    }
  }),

  init( __Gibberish ) {
    Gibberish = __Gibberish
  },

  clear() {
    this.queue.data.length = 0
    this.queue.length = 0
    this.phase = 0
  },

  add( time, func, priority = 0 ) {
    time += this.phase

    this.queue.push({ time, func, priority })

    return this.phase
  },

  remove( __func ) {
    for( let i = 0; i < this.queue.data.length; i++ ) {
      const func = this.queue.data[i].func
      if( func === __func ) {
        this.queue.data.splice( i, 1 )
        break
      }
    }
  },

  tick( usingSync = false ) {
    if( this.shouldSync === usingSync ) {
      if( this.queue.data.length ) {
        let next = this.queue.peek()

        if( isNaN( next.time ) ) {
          console.log( 'invalid time:', next )
          this.queue.pop()
        }
        
        while( this.phase >= next.time ) {
          next.func( next.priority )
          this.queue.pop()
          next = this.queue.peek()

          // XXX this happens when calling sequencer.stop()... why?
          if( next === undefined ) {
            console.log( 'undefined next', this.queue )
            break
          }
        }
      }

      this.phase++
    }

    return this.phase
  },

  advance( amt ) {
    this.phase += amt
    this.tick( true )
  }
}

let shouldSync = false
Object.defineProperty( Scheduler, 'shouldSync', {
  get() { return shouldSync },
  set(v){ 
    shouldSync = v
    if( Gibberish.mode === 'worklet' ) {
      Gibberish.worklet.port.postMessage({
        address:'eval',
        code:'Gibberish.scheduler.shouldSync = ' + v
      })
    }
  }
})

module.exports = Scheduler

},{}],205:[function(require,module,exports){
const g = require( 'genish.js' ),
      __proxy = require( '../workletProxy.js' ),
      ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {
  const __proto__ = Object.create( ugen )

  const proxy = __proxy( Gibberish )

  Object.assign( __proto__, {
    start( delay=0 ) {
      if( delay !== 0 ) {
        Gibberish.scheduler.add( delay, ()=> {
          Gibberish.analyzers.push( this )
          Gibberish.dirty( Gibberish.analyzers )
        })
      }else{
        Gibberish.analyzers.push( this )
        Gibberish.dirty( Gibberish.analyzers )
      }
      return this
    },
    stop( delay=0 ) {
      const idx = Gibberish.analyzers.indexOf( this )
      if( delay === 0 ) {
        if( idx > -1 ) {
          Gibberish.analyzers.splice( idx, 1 )
          Gibberish.dirty( Gibberish.analyzers )
        }
        this.phase = 0
        this.nextTime = 0
      }else{
        Gibberish.scheduler.add( delay, ()=> {
          if( idx > -1 ) {
            Gibberish.analyzers.splice( idx, 1 )
            Gibberish.dirty( Gibberish.analyzers )
          }
          this.phase = 0
          this.nextTime = 0
        })
      }

      return this
    },
    fire(){
      let value  = typeof this.values  === 'function' ? this.values  : this.values[ this.__valuesPhase++  % this.values.length  ]
      if( typeof value === 'function' && this.target === undefined ) {
        value()
      }else if( typeof this.target[ this.key ] === 'function' ) {
        if( typeof value === 'function' ) {
          value = value()
        }
        if( value !== this.DNR ) {
          this.target[ this.key ]( value )
        }
      }else{
        if( typeof value === 'function' ) value = value()
        if( value !== this.DNR )
          this.target[ this.key ] = value
      }
    }
  })

  // XXX we need to implement priority, which will in turn determine the order
  // that the sequencers are added to the callback function.
  const Seq2 = { 
    create( inputProps ) {
      const seq = Object.create( __proto__ ),
            properties = Object.assign({}, Seq2.defaults, inputProps )

      seq.phase = 0
      seq.inputNames = [ 'rate', 'density' ]
      seq.inputs = [ 1, 1 ]
      seq.nextTime = 0
      seq.__valuesPhase = 0
      seq.__timingsPhase = 0
      seq.id = Gibberish.factory.getUID()
      seq.dirty = true
      seq.type = 'seq'
      seq.__addresses__ = {}
      seq.DNR = -987654321

      properties.id = Gibberish.factory.getUID()

      Object.assign( seq, properties ) 
      seq.__properties__ = properties

      // support for sequences that are triggered via other means,
      // in Gibber this is when you provide timing to one sequence
      // on an object and want to use that one pattern to trigger
      // multiple sequences.
      if( seq.timings === null ) { seq.nextTime = Infinity } 

      // XXX this needs to be optimized as much as humanly possible, since it's running at audio rate...
      seq.callback = function( rate, density ) {
        while( seq.phase >= seq.nextTime ) {
          let value  = typeof seq.values  === 'function' ? seq.values  : seq.values[ seq.__valuesPhase++  % seq.values.length  ],
              shouldRun = true
          
          let timing = null
          if( seq.timings !== null && seq.timings !== undefined ) { 
            timing = typeof seq.timings === 'function' ? seq.timings : seq.timings[ seq.__timingsPhase++ % seq.timings.length ]
            if( typeof timing === 'function' ) timing = timing()
          }
          
          let shouldIncreaseSpeed = density <= 1 ? false : true

          // XXX this supports an edge case in Gibber, where patterns like Euclid / Hex return
          // objects indicating both whether or not they should should trigger values as well
          // as the next time they should run. perhaps this could be made more generalizable?
          if( timing !== null && typeof timing === 'object' ) {
            if( timing.shouldExecute === 1 ) {
              shouldRun = true
            }else{
              shouldRun = false
            }
            timing = timing.time 
          }else if( timing !== null ) {
            if( Math.random() >= density ) shouldRun = false
          }

          if( shouldRun ) {
            if( seq.mainthreadonly !== undefined ) {
              if( typeof value === 'function' ) {
                value = value()
              }
              Gibberish.processor.messages.push( seq.mainthreadonly, seq.key, value )
            }else if( typeof value === 'function' && seq.target === undefined ) {
              value()
            }else if( typeof seq.target[ seq.key ] === 'function' ) {
              if( typeof value === 'function' ) {
                value = value()
              }
              if( value !== seq.DNR ) {
                seq.target[ seq.key ]( value )
              }
            }else{
              if( typeof value === 'function' ) value = value()
              if( value !== seq.DNR )
                seq.target[ seq.key ] = value
            }
          }

          if( timing === null ) return

          seq.phase -= seq.nextTime

          if( shouldIncreaseSpeed ) {
            timing = Math.random() > (2 - density) ? timing / 2 : timing
          }
          seq.nextTime = timing
        }

        seq.phase += rate

        return 0
      }

      seq.ugenName = seq.callback.ugenName = 'seq_' + seq.id

      // since we're not passing our sequencer through the ugen template, we need
      // to grab a memory address for its rate so it can be sequenced and define
      // a property that manipulates that memory address.
      const idx = Gibberish.memory.alloc( 1 )
      Gibberish.memory.heap[ idx ] = seq.rate
      seq.__addresses__.rate = idx

      let value = seq.rate
      Object.defineProperty( seq, 'rate', {
        get() { return value },
        set( v ) {
          if( value !== v ) {
            if( typeof v === 'number' ) Gibberish.memory.heap[ idx ] = v

            Gibberish.dirty( Gibberish.analyzers )
            value = v
          }
        }
      })

      const didx = Gibberish.memory.alloc( 1 )
      Gibberish.memory.heap[ didx ] = seq.density
      seq.__addresses__.density = didx

      let dvalue = seq.density
      Object.defineProperty( seq, 'density', {
        get() { return dvalue },
        set( v ) {
          if( dvalue !== v ) {
            if( typeof v === 'number' ) Gibberish.memory.heap[ didx ] = v

            Gibberish.dirty( Gibberish.analyzers )
            dvalue = v
          }
        }
      })

      if( Gibberish.mode === 'worklet' ) {
        Gibberish.utilities.createPubSub( seq )
      }

      return proxy( ['Sequencer2'], properties, seq ) 
    }
  }

  Seq2.defaults = { rate: 1, density:1, priority:0, phase:0 }
  Seq2.create.DO_NOT_OUTPUT = -987654321

  return Seq2.create

}


},{"../ugen.js":208,"../workletProxy.js":210,"genish.js":40}],206:[function(require,module,exports){
(function (global){
const __proxy = require( '../workletProxy.js' )

module.exports = function( Gibberish ) {

const renderFnc = function( pattern ) {
  const keys = Object.keys( pattern.dict )
  const objs = Object.values( pattern.dict )
    .map( v => typeof v === 'object' && !Array.isArray( v )
    ? Gibberish.processor.ugens.get(v.id) 
    : v 
    )

  // we create a new inner function using the function constructor,
  // where every argument is codegen'd as an upvalue to the
  // returned function. after codegen we call the functon
  // to get the inner function with the upvalues andd
  // return that. Store references to globals as upvalues as well.
  let code = 'let Gibberish = __Gibberish, global = __global;\n'
  keys.forEach( k => {
    let line = `let ${k} = `
    const value = pattern.dict[ k ]
    const getter = typeof value === 'object' 
      ? Array.isArray( value )
      ? `[${value.toString()}]`
      : `Gibberish.processor.ugens.get(${ value.id })`
      : value
    line += getter 
    code += line + '\n'

  })  
  code +=`return function() { ${ pattern.fncstr } }` 

  // pass in globals to be used as upvalues in final function
  const fnc = new Function( '__Gibberish', '__global', code )( Gibberish, global )

  return fnc 
}

const proxy = __proxy( Gibberish )

const Sequencer = props => {
  let __seq
  let floatError = 0

  const seq = {
    type:'seq',
    __isRunning:false,
    __valuesPhase:  0,
    __timingsPhase: 0,
    __onlyRunsOnce: false,
    __repeatCount: null,
    DNR : -987654321,

    tick( priority ) {
      let value  = typeof seq.values  === 'function' 
          ? seq.values  
          : seq.values[  seq.__valuesPhase++  % seq.values.length  ],

        timing = typeof seq.timings === 'function' 
          ? seq.timings 
          : seq.timings !== null
            ? seq.timings[ seq.__timingsPhase++ % seq.timings.length ]
            : null,

        shouldRun = true
      
      if( seq.__onlyRunsOnce === true ) {
        if( seq.__valuesPhase === seq.values.length ) {
          seq.stop()
        }
      }else if( seq.__repeatCount !== null ) {
        if( seq.__valuesPhase % seq.values.length === 0 ) {
          seq.__repeatCount--
          if( seq.__repeatCount === 0 ) {
            seq.stop()
            seq.__repeatCount = null
          }
        }
      }

      if( typeof timing === 'function' ) timing = timing()

      // XXX this supports an edge case in Gibber, where patterns like Euclid / Hex return
      // objects indicating both whether or not they should should trigger values as well
      // as the next time they should run. perhaps this could be made more generalizable?
      if( timing !== null ) {
        if( typeof timing === 'object' ) {
          if( timing.shouldExecute === 1 ) {
            shouldRun = true
          }else{
            shouldRun = false
          }
          timing = timing.time 
        }

        timing *= seq.rate
      }else{
        shouldRun = false 
      }

      if( value === Sequencer.DO_NOT_OUTPUT ) shouldRun = false

      if( shouldRun ) {
        try{
          if( seq.mainthreadonly !== undefined ) {
            if( typeof value === 'function' ) {
              value = value()
            }
            //console.log( 'main thread only' )
            Gibberish.processor.messages.push( seq.mainthreadonly, seq.key, value )
          }else if( typeof value === 'function' && seq.target === undefined ) {
            value()
          }else if( typeof seq.target[ seq.key ] === 'function' ) {
            //console.log( seq.key, seq.target )
            if( typeof value === 'function' ) value = value()
            if( value !== seq.DNR )
              seq.target[ seq.key ]( value )
          }else{
            if( typeof value === 'function' ) value = value()
            if( value !== seq.DNR )
              seq.target[ seq.key ] = value
          }

          if( seq.reportOutput === true ) {
            Gibberish.processor.port.postMessage({
              address:'__sequencer',
              id: seq.id,
              name:'output',
              value,
              phase: seq.__valuesPhase,
              length: seq.values.length
            })
          }
        } catch(e) {
          console.error( `A sequence targeting ${seq.target.ugenName}.${seq.key} contains an improper value and will be stopped.` )
          return
        }
      }
      
      if( Gibberish.mode === 'processor' ) {
        if( seq.__isRunning === true && !isNaN( timing ) && seq.autotrig === false ) {
          timing += floatError
          //while( floatError > 1 ) {
          //  timing += 1
          //  floatError -= 1
          //}
          Gibberish.scheduler.add( timing, seq.tick, seq.priority )
          floatError = timing - Math.floor( timing )
        }
      }
    },
    fire(){
      let value  = typeof this.values  === 'function' ? this.values  : this.values[ this.__valuesPhase++  % this.values.length  ]
      if( typeof value === 'function' && this.target === undefined ) {
        value()
      }else if( typeof this.target[ this.key ] === 'function' ) {
        if( typeof value === 'function' ) {
          value = value()
        }
        if( value !== this.DNR ) {
          this.target[ this.key ]( value )
        }
      }else{
        if( typeof value === 'function' ) value = value()
        if( value !== this.DNR )
          this.target[ this.key ] = value
      }
    },

    start( delay = 0 ) {
      if( Gibberish.mode === 'processor' && seq.__isRunning === false ) {
        Gibberish.scheduler.add( 
          delay, 
          priority => {
            seq.tick( priority )
            Gibberish.processor.port.postMessage({
              address:'__sequencer',
              id: seq.id,
              name:'start'
            })
          }, 
          seq.priority 
        )
      }
      seq.__isRunning = true
      seq.__delay = delay
      return __seq
    },

    stop( delay = null ) {
      if( delay === null ) {
        seq.__isRunning = false

        if( Gibberish.mode === 'processor' ) {
          Gibberish.processor.port.postMessage({
            address:'__sequencer',
            id: seq.id,
            name:'stop'
          })
        }
      
      }else{
        Gibberish.scheduler.add( delay, seq.stop )
      }
      return __seq
    },

    once() {
      seq.__onlyRunsOnce = true
      return __seq
    },

    repeat( repeatCount = 2 ) {
      seq.__repeatCount = repeatCount
      return __seq
    }
  }

  props.id = Gibberish.factory.getUID()

  if( Gibberish.mode === 'worklet' ) {
    Gibberish.utilities.createPubSub( seq )
  }else{
    // need a separate reference to the properties for worklet meta-programming
    if( typeof props.values === 'object' && props.values.requiresRender === true ) {
      props.values = renderFnc( props.values )
    }
    if( props.timings !== null && typeof props.timings === 'object' && props.timings.requiresRender === true ) {
      props.timings = renderFnc( props.timings )
    }
  }

  const properties = Object.assign( {}, Sequencer.defaults, props )
  Object.assign( seq, properties ) 
  seq.__properties__ = properties

  __seq =  proxy( ['Sequencer'], properties, seq )

  return __seq
}

Sequencer.defaults = { priority:100, rate:1, reportOutput:false, autotrig:false }

Sequencer.make = function( values, timings, target, key, priority, reportOutput ) {
  return Sequencer({ values, timings, target, key, priority, reportOutput })
}

Sequencer.DO_NOT_OUTPUT = -987654321

return Sequencer

}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../workletProxy.js":210}],207:[function(require,module,exports){
const __proxy = require( '../workletProxy.js' ),
      mini    = require( '../external/mini.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )

  const Sequencer = props => {
    let __seq, i = 0
 
    const seq = {
      __isRunning: false,
      __phase: 0,
      __type: 'seq',
      __pattern: mini.mini( props.pattern ),
      //Pattern( props.pattern, { addLocations:true, addUID:true, enclose:true }),
      __events: null,

      addFilter( filter ) {
        seq.filters.push( filter )
      },

      tick(priority) {
        let startTime
        // running for first time, perform a query
        if (seq.__events === null || seq.__events.length === 0) {
          startTime = seq.__phase
          seq.__events = seq.__pattern.queryArc(seq.__phase++, 1)
          seq.__events.sort( (a,b) => a.whole.begin.valueOf() > b.whole.begin.valueOf() )
        }else{
          startTime = seq.__events[0].whole.begin
        }

        if (seq.__events.length <= 0) {
          if (Gibberish.mode === 'processor') {
            if (seq.__isRunning === true) {
              Gibberish.scheduler.add(Gibberish.ctx.sampleRate / Sequencer.clock.cps, seq.tick, seq.priority)
            }
          }

          return;
        }

        if (seq.key !== 'chord') {
          while (seq.__events.length > 0 && startTime.valueOf() >= seq.__events[0].whole.begin.valueOf()) {
            let event = seq.__events.shift()
            
            // make sure we should trigger sound
            if( !event.hasOnset() ) continue

            const idx = event.context.locations.length - 1

            let value = event.value,
                uid   = event.context.locations[ idx ].start.column 

            //console.log( 'evt', uid, event.context.locations )

            if ( typeof value === 'object' ) value = value.value;
            if ( seq.filters !== null ) 
              value = seq.filters.reduce( (currentValue, filter) => filter(currentValue, seq, uid), value)

            if ( seq.mainthreadonly !== undefined ) {
              if ( typeof value === 'function' ) {
                value = value()
              }
              
              Gibberish.processor.messages.push( seq.mainthreadonly, seq.key, value )
            } else if ( typeof seq.target[seq.key] === 'function' ) {
              seq.target [seq.key ]( value )
            } else {
              seq.target[ seq.key ] = value
            }
          }
        } else {
          let value = seq.__events.filter(evt => startTime.valueOf() === evt.whole.begin.valueOf()).map(evt => evt.value);

          let uid = seq.__events[0].context.locations[0].start.column

          const events = seq.__events.splice(0, value.length);

          if( seq.filters !== null ) {
            if( value.length === 1 ) {
              value = seq.filters.reduce( (currentValue, filter) => filter( currentValue, seq, uid ), value )
            } else {
              value.forEach((v, i) => { 
                return seq.filters.reduce( (currentValue, filter) => filter( currentValue, seq, events[i].uid ), v )
              })
            }
          }

          if (typeof seq.target[seq.key] === 'function') {
            seq.target[ seq.key ]( value )
          } else {
            seq.target[ seq.key ] = value
          }
        }

        if (Gibberish.mode === 'processor') {
          let timing

          if(seq.__events.length <= 0) {
            let time = 0

            while (seq.__events.length <= 0) {
              seq.__events = seq.__pattern.queryArc(seq.__phase, ++seq.__phase  )
            } 

            seq.__events.sort( (a,b) => a.whole.begin.valueOf() > b.whole.begin.valueOf() )
          } 

          timing = seq.__events[0].whole.begin.sub( startTime ).valueOf()
          if( timing.valueOf() < 0 ) timing += 1

          //if( timing <= 0 ) timing = Math.abs( timing )

          //console.log( seq.__events[0].whole.begin.toString(), startTime.toString(), timing  )

          //console.log( 'timings:', timing, startTime.valueOf(), seq.__events[0].whole.begin.valueOf() )
          timing *= Math.ceil( Gibberish.ctx.sampleRate / Sequencer.clock.cps )
          //console.log( 'timing:', timing, startTime.valueOf(), seq.__events[0].whole.begin.valueOf() )
          if( seq.__isRunning === true && !isNaN( timing ) ) {
            Gibberish.scheduler.add( timing, seq.tick, seq.priority )
          }
        }
      },

      rotate(amt) {
        seq.__phase += amt;
        return __seq;
      },

      start(delay = 0) {
        seq.__isRunning = true;
        Gibberish.scheduler.add(delay, seq.tick, seq.priority);
        return __seq;
      },

      stop() {
        seq.__isRunning = false;
        return __seq;
      },

      set(patternString) {
        seq.__pattern = Sequencer.Pattern(patternString);
      }

    };
    props.id = Gibberish.factory.getUID(); // need a separate reference to the properties for worklet meta-programming

    const properties = Object.assign({}, Sequencer.defaults, props);
    Object.assign(seq, properties);
    seq.__properties__ = properties;
    __seq = proxy(['Tidal'], properties, seq);
    return __seq;
  };

  Sequencer.defaults = {
    priority: 100000,
    pattern: '',
    rate: 1,
    filters: null
  };

  Sequencer.make = function (values, timings, target, key, priority) {
    return Sequencer({
      values,
      timings,
      target,
      key,
      priority
    });
  };

  let __uid = 0;

  Sequencer.getUID = () => {
    return __uid++;
  };

  Sequencer.Pattern = mini.mini;
  Sequencer.clock = {
    cps: 1
  };
  Sequencer.id = Gibberish.utilities.getUID();
  Sequencer.mini = mini.mini

  if (Gibberish.mode === 'worklet') {
    Gibberish.worklet.port.postMessage({
      address: 'eval',
      code: `Gibberish.Tidal.clock.id = ${Sequencer.id}; Gibberish.ugens.set( ${Sequencer.id}, Gibberish.Tidal.clock )`
    });
    let cps = 1;
    Object.defineProperty(Sequencer, 'cps', {
      get() {
        return cps;
      },

      set(v) {
        cps = v;

        if (Gibberish.mode === 'worklet') {
          Gibberish.worklet.port.postMessage({
            address: 'set',
            object: Sequencer.id,
            name: 'cps',
            value: cps
          });
        }
      }

    });
  }

  return Sequencer;
};


},{"../external/mini.js":144,"../workletProxy.js":210}],208:[function(require,module,exports){
let Gibberish = null

const __ugen = function( __Gibberish ) {
  if( __Gibberish !== undefined && Gibberish == null ) Gibberish = __Gibberish
 
  const replace = obj => {
    if( typeof obj === 'object' ) {
      if( obj.id !== undefined ) {
        return processor.ugens.get( obj.id )
      } 
    }

    return obj
  }

  const ugen = {
    __Gibberish:Gibberish,

    free:function() {
      Gibberish.genish.gen.free( this.graph )
    },

    print:function() {
      console.log( this.callback.toString() )
    },

    connect:function( target, level=1 ) {
      if( this.connected === undefined ) this.connected = []

      //let input = level === 1 ? this : Gibberish.binops.Mul( this, level )
      let input = this

      if( target === undefined || target === null ) target = Gibberish.output 


      // XXX I forgot, where is __addInput found? Can we control the
      // level of the input?
      if( typeof target.__addInput == 'function' ) {
        target.__addInput( input )
      } else if( target.sum && target.sum.inputs ) {
        target.sum.inputs.push( input )
      } else if( target.inputs ) {
        const idx = target.inputs.indexOf( input )

        // if no connection exists...
        if( idx === -1 ) {
          target.inputs.unshift( input, level, input.isStereo )
        }else{
          // ... otherwise update the connection's level, which is stored
          // one index higher in the input list.
          target.inputs[ idx + 1 ] = level
        }
      } else {
        target.input = input
        target.inputGain = level
      }

      Gibberish.dirty( target )

      this.connected.push([ target, input, level ])
      
      return this
    },

    disconnect:function( target ) {
      if( target === undefined ){
        if( Array.isArray( this.connected ) ) {
          for( let connection of this.connected ) {
            if( connection[0].disconnectUgen !== undefined ) {
              connection[0].disconnectUgen( connection[1] )
            }else if( connection[0].input === this ) {
              connection[0].input = 0
            }
          }
          this.connected.length = 0
        }
      }else{
        const connection = this.connected.find( v => v[0] === target )
        // if target is a bus...
        if( target.disconnectUgen !== undefined ) {
          if( connection !== undefined ) {
            target.disconnectUgen( connection[1] )
          }
        }else{
          // must be an effect, set input to 0
          target.input = 0
        }

        const targetIdx = this.connected.indexOf( connection )

        if( targetIdx !== -1 ) {
          this.connected.splice( targetIdx, 1 )
        }
      }
    },

    chain:function( target, level=1 ) {
      this.connect( target,level )

      return target
    },

    __redoGraph:function() {
      let isStereo = this.isStereo
      this.__createGraph()
      this.callback = Gibberish.genish.gen.createCallback( this.graph, Gibberish.memory, false, true )
      this.inputNames = new Set( Gibberish.genish.gen.parameters ) 
      this.callback.ugenName = this.ugenName
      Gibberish.dirty( this )

      // if channel count has changed after recompiling graph...
      if( isStereo !== this.isStereo ) {

        // check for any connections before iterating...
        if( this.connected === undefined ) return
        // loop through all busses the ugen is connected to
        for( let connection of this.connected ) {
          // set the dirty flag of the bus
          Gibberish.dirty( connection[ 0 ] )

          // check for inputs array, which indicates connection is to a bus
          if( connection[0].inputs !== undefined ) {
            // find the input in the busses 'inputs' array
            const inputIdx = connection[ 0 ].inputs.indexOf( connection[ 1 ] )

            // assumiing it is found...
            if( inputIdx !== -1 ) {
              // change stereo field
              connection[ 0 ].inputs[ inputIdx + 2 ] = this.isStereo
            }
          }else if( connection[0].input !== undefined ) {
            if( connection[0].__redoGraph !== undefined ) {
              connection[0].__redoGraph()
            }
          }
        }
      }
    },
  }

  return ugen

}

module.exports = __ugen

},{}],209:[function(require,module,exports){
const genish = require( 'genish.js' ),
      AWPF = require( './external/audioworklet-polyfill.js' )

module.exports = function( Gibberish ) {

let uid = 0
const utilities = {
  Make: function( props ){
    const name = props.name || 'Ugen' + (Math.floor( Math.random()*10000 ) )
    const type = props.type || 'Ugen'
    const properties = props.properties || {}
    const block = `
    const ugen = Object.create( Gibberish.prototypes[ '${type}' ] )
    const graphfnc = ${props.constructor.toString()}

    const proxy = Gibberish.factory( ugen, graphfnc(), '${name}', ${JSON.stringify(properties)} )
    if( typeof props === 'object' ) Object.assign( proxy, props )

    return proxy`

    Gibberish[ name ] = new Function( 'props', block )

    Gibberish.worklet.port.postMessage({
      name,
      address:'addConstructor',
      constructorString:`function( Gibberish ) {
      const fnc = ${Gibberish[ name ].toString()}

      return fnc
    }`
    })

    return Gibberish[ name ]
  },

  createContext( ctx=null, cb, resolve, options ) {
    let AC = typeof AudioContext === 'undefined' ? webkitAudioContext : AudioContext

    if( options === undefined ) options = { latencyHint:.025 }
    if( options.bufferSize === undefined ) options.bufferSize = 2048
    AWPF( window, options.bufferSize )
    
    const start = () => {
      if( typeof AC !== 'undefined' ) {
        this.ctx = Gibberish.ctx = ctx === null ? new AC({ latencyHint:options.latencyHint }) : ctx

        genish.gen.samplerate = this.ctx.sampleRate
        genish.utilities.ctx = this.ctx

        if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
          window.removeEventListener( 'touchstart', start )
        }else{
          window.removeEventListener( 'mousedown', start )
          window.removeEventListener( 'keydown', start )
        }

        const mySource = utilities.ctx.createBufferSource()
        mySource.connect( utilities.ctx.destination )
        mySource.start()
      }

      if( typeof cb === 'function' ) cb( resolve )
    }

    if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
      window.addEventListener( 'touchstart', start )
    }else{
      window.addEventListener( 'mousedown', start )
      window.addEventListener( 'keydown', start )
    }

    return Gibberish.ctx
  },
  
  createWorklet( resolve ) {
    Gibberish.ctx.audioWorklet.addModule( Gibberish.workletPath ).then( () => {
      Gibberish.worklet = new AudioWorkletNode( Gibberish.ctx, 'gibberish', { outputChannelCount:[2] } )

      Gibberish.worklet.connect( Gibberish.ctx.destination )
      Gibberish.worklet.port.onmessage = event => {
        const callback = Gibberish.utilities.workletHandlers[ event.data.address ]
        if( typeof callback === 'function' ) callback( event )     
      }
      Gibberish.worklet.ugens = new Map()

      resolve()
    })
  },

  future( fnc, time, dict ) {
    const keys = Object.keys( dict )
    const code = `
      const fnc = ${fnc.toString()}
      const args = [${keys.map( key => typeof dict[key] === 'object' ? dict[ key ].id : `'${dict[ key]}'` ).join(',')}]
      const objs = args.map( v => typeof v === 'number' ? Gibberish.processor.ugens.get(v) : v )
      Gibberish.scheduler.add( ${time}, ()=> fnc( ...objs ), 1 )
    ` 
    Gibberish.worklet.port.postMessage({ 
      address:'eval', 
      code
    })
  },

  workletHandlers: {
    phase( event ) {
      Gibberish.phase = event.data.value
      if( typeof Gibberish.onphaseupdate === 'function' ) {
        Gibberish.onphaseupdate( Gibberish.phase )
      }
    },
    __sequencer( event ) {
      const message = event.data
      const id = message.id
      const eventName = message.name
      const obj = Gibberish.worklet.ugens.get( id )
      if( obj !== undefined && obj.publish !== undefined )
        obj.publish( eventName, message )
    },
    callback( event ) {
      if( typeof Gibberish.oncallback === 'function' ) {
        Gibberish.oncallback( event.data.code )
      }
    },
    get( event ) {
      let name = event.data.name
      let value
      if( name[0] === 'Gibberish' ) {
        value = Gibberish
        name.shift()
      }
      for( let segment of name ) {
        value = value[ segment ]
      }

      Gibberish.worklet.port.postMessage({
        address:'set',
        name:'Gibberish.' + name.join('.'),
        value
      })
    },
    state( event ){
      const messages = event.data.messages
      if( messages.length === 0 ) return

      // XXX is preventProxy actually used?
      Gibberish.preventProxy = true
      Gibberish.proxyEnabled = false

      let i = 0
      while( i < messages.length ) {
        const id = messages[ i ] 
        const propName = messages[ i + 1 ]
        const valueL = messages[ i + 2 ]
        const valueR = messages[ i + 3 ]
        const value = valueL
        const obj = Gibberish.worklet.ugens.get( id )

        if( Gibberish.worklet.debug === true ) {
          if( propName !== 'output' ) console.log( propName, value, id )
        }

        if( typeof propName !== 'string' ) continue
        
        if( obj !== undefined && propName.indexOf('.') === -1 && propName !== 'id' ) { 
          if( obj[ propName ] !== undefined ) {
            if( typeof obj[ propName ] !== 'function' ) {
              if( propName === 'output' ) {
                obj[ propName ] = [ valueL, valueR ]
              }else{
                obj[ propName ] = value
              }
            }else{
              obj[ propName ]( value )
            }
          }else{
            obj[ propName ] = value
          }
        }else if( obj !== undefined ) {
          const propSplit = propName.split('.')
          if( obj[ propSplit[ 0 ] ] !== undefined ) {
            if( propSplit[1] !== undefined ) {
              //console.log( obj, propSplit[0], propSplit[1], value )
              if( typeof obj[ propSplit[ 0 ] ][ propSplit[ 1 ] ] !== 'function' ) {
                obj[ propSplit[ 0 ] ][ propSplit[ 1 ] ] = value
              }else{
                obj[ propSplit[ 0 ] ][ propSplit[ 1 ] ]( value )
              }
            }
          }else{
            //console.log( 'undefined split property!', id, propSplit[0], propSplit[1], value, obj )
          }
        }
        // XXX double check and make sure this isn't getting sent back to processornode...
        // console.log( propName, value, obj )
        i += propName === 'output' ? 4 : 3
      }
      Gibberish.preventProxy = false
      Gibberish.proxyEnabled = true
    }
  },

  createPubSub( obj ) {
    const events = {}
    obj.on = function( key, fcn ) {
      if( typeof events[ key ] === 'undefined' ) {
        events[ key ] = []
      }
      events[ key ].push( fcn )
      return obj
    }

    obj.off = function( key, fcn ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.splice( arr.indexOf( fcn ), 1 )
      }
      return obj
    }

    obj.publish = function( key, data ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.forEach( v => v( data ) )
      }
      return obj
    }
  },

  wrap( func, ...args ) {
    const out = {
      action:'wrap',
      value:func,
      // must return objects containing only the id number to avoid
      // creating circular JSON references that would result from passing actual ugens
      args: args.map( v => { return { id:v.id } })
    }
    return out
  },

  // for wrapping upvalues in a dictionary and passing function across thread
  // to be reconstructed.
  // ex; wrapped = fn( ()=> { return Math.random() * test }, { test:20 })
  // syn.note.seq( wrapped, 1/4 )
  fn( fnc, dict={}) {
    const fncstr = fnc.toString()
    const firstBracketIdx = fncstr.indexOf('{')
    const code = fncstr.slice(firstBracketIdx+1, -1 )
    const s = { requiresRender:true, filters:[], fncstr:code, args:[], dict, addFilter( f ) { this.filters.push(f) } }  
    return s
  },

  run( fnc ) { 
    const str = fnc.tostring()
    const idx = str.indexof('=>') + 2
    const code = str.slice( idx ).trim()
    Gibberish.worklet.port.postMessage({ 
      address:'eval',
      code
    })
  },

  export( obj ) {
    obj.wrap = this.wrap
    obj.future = this.future
    obj.Make = this.Make
  },

  getUID() { return uid++ },

  base64 : {
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    // will return a  Uint8Array type
    decodeArrayBuffer: function(input) {
        var bytes = (input.length/4) * 3;
        var ab = new ArrayBuffer(bytes);
        this.decode(input, ab);

        return ab;
    },
    decode: function(input, arrayBuffer) {
      //get last chars to see if are valid
      var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));		 
      var lkey2 = this._keyStr.indexOf(input.charAt(input.length-2));		 
      var bytes = (input.length/4) * 3;
      if (lkey1 == 64) bytes--; //padding chars, so skip
      if (lkey2 == 64) bytes--; //padding chars, so skip
      var uarray;
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      var j = 0;
      if (arrayBuffer)
          uarray = new Uint8Array(arrayBuffer);
      else
          uarray = new Uint8Array(bytes);
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      for (i=0; i<bytes; i+=3) {	
          //get the 3 octects in 4 ascii chars
          enc1 = this._keyStr.indexOf(input.charAt(j++));
          enc2 = this._keyStr.indexOf(input.charAt(j++));
          enc3 = this._keyStr.indexOf(input.charAt(j++));
          enc4 = this._keyStr.indexOf(input.charAt(j++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          uarray[i] = chr1;			
          if (enc3 != 64) uarray[i+1] = chr2;
          if (enc4 != 64) uarray[i+2] = chr3;
      }
      return uarray;	
    }
  }
}

return utilities

}

},{"./external/audioworklet-polyfill.js":143,"genish.js":40}],210:[function(require,module,exports){
const serialize = require('serialize-javascript')

module.exports = function( Gibberish ) {

const replaceObj = function( obj, shouldSerializeFunctions = true ) {
  if( typeof obj === 'object' && obj !== null && obj.id !== undefined ) {
    if( obj.__type !== 'seq' ) { // XXX why?
      return { id:obj.id, prop:obj.prop }
    }else{
      // shouldn't I be serializing most objects, not just seqs?
      return serialize( obj )
    }
  }else if( typeof obj === 'function' && shouldSerializeFunctions === true ) {
    return { isFunc:true, value:serialize( obj ) }
  }
  return obj
}

const makeAndSendObject = function( __name, values, obj ) {
  const properties = {}

  // object has already been sent through messageport...

  for( let key in values ) {
    const alreadyProcessed = (typeof values[ key ] === 'object' && values[ key ] !== null && values[ key ].__meta__ !== undefined) ||
      (typeof values[key] === 'function' && values[ key ].__meta__ !== undefined )

    if( alreadyProcessed ) { 
      properties[ key ] = { id:values[ key ].__meta__.id }
    }else if( Array.isArray( values[ key ] ) ) {
      const arr = []
      for( let i = 0; i < values[ key ].length; i++ ) {
        arr[ i ] = replaceObj( values[ key ][i], false  )
      }
      properties[ key ] = arr
    }else if( typeof values[key] === 'object' && values[key] !== null ){
      properties[ key ] = replaceObj( values[ key ], false )
    }else{
      properties[ key ] = values[ key ]
    }
  }

  let serializedProperties = serialize( properties )

  if( Array.isArray( __name ) ) {
    const oldName = __name[ __name.length - 1 ]
    __name[ __name.length - 1 ] = oldName[0].toUpperCase() + oldName.substring(1)
  }else{
    __name = [ __name[0].toUpperCase() + __name.substring(1) ]
  }

  obj.__meta__ = {
    address:'add',
    name:__name,
    properties:serializedProperties, 
    id:obj.id
  }

  Gibberish.worklet.ugens.set( obj.id, obj )

  Gibberish.worklet.port.postMessage( obj.__meta__ )
}

const doNotProxy = [ 'connected', 'input', 'wrap', 'callback', 'inputNames', 'on', 'off','publish' ]
   
const __proxy = function( __name, values, obj ) {

  if( Gibberish.mode === 'worklet' && Gibberish.preventProxy === false ) {
    makeAndSendObject( __name, values, obj )

    // proxy for all method calls to send to worklet
    const proxy = new Proxy( obj, {
      get( target, prop, receiver ) {
        if( typeof target[ prop ] === 'function' && prop.indexOf('__') === -1 && doNotProxy.indexOf( prop ) === -1 ) {
          const proxy = new Proxy( target[ prop ], {
            apply( __target, thisArg, args ) {

              if( Gibberish.proxyEnabled === true ) {
                const __args = args.map( __value => replaceObj( __value, true ) )

                Gibberish.worklet.port.postMessage({ 
                  address:'method', 
                  object:obj.id,
                  name:prop,
                  args:__args
                })
              }

              const temp = Gibberish.proxyEnabled
              Gibberish.proxyEnabled = false
              const out =  __target.apply( thisArg, args )
              Gibberish.proxyEnabled = temp
              return out
            }
          })
          
          return proxy
        }

        return target[ prop ]
      },
      set( target, prop, value, receiver ) {
        if( doNotProxy.indexOf( prop ) === -1 ) { 
          if( Gibberish.proxyEnabled === true ) {
            const __value = replaceObj( value )

            if( __value !== undefined ) {
              Gibberish.worklet.port.postMessage({ 
                address:'set', 
                object:obj.id,
                name:prop,
                value:__value
              })
            }
          }
        }

        target[ prop ] = value

        // must return true for any ES6 proxy setter
        return true
      }
    })

    // XXX XXX XXX XXX XXX XXX
    // REMEMBER THAT YOU MUST ASSIGN THE RETURNED VALUE TO YOUR UGEN,
    // YOU CANNOT USE THIS FUNCTION TO MODIFY A UGEN IN PLACE.
    // XXX XXX XXX XXX XXX XXX

    return proxy
  }else if( Gibberish.mode === 'processor' && Gibberish.preventProxy === false ) {

    const proxy = new Proxy( obj, {
      //get( target, prop, receiver ) { return target[ prop ] },
      set( target, prop, value, receiver ) {
        let valueType = typeof value
        if( prop.indexOf('__') === -1 && valueType !== 'function' && valueType !== 'object' ) {
          if( Gibberish.processor !== undefined ) { 
            Gibberish.processor.messages.push( obj.id, prop, value )
          }
        }
        target[ prop ] = value

        // must return true for any ES6 proxy setter
        return true
      }
    })

    return proxy
  }

  return obj
}

return __proxy

}

},{"serialize-javascript":211}],211:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],212:[function(require,module,exports){
'use strict'

let MemoryHelper = {
  
  create( sizeOrBuffer=4096, memtype=Float32Array ) {
    let helper = Object.create( this )

    // conveniently, buffer constructors accept either a size or an array buffer to use...
    // so, no matter which is passed to sizeOrBuffer it should work.
    Object.assign( helper, {
      heap: new memtype( sizeOrBuffer ),
      list: {},
      freeList: {},

      // if useTail is true, will force MemoryHelper to allocate at end of the
      // heap and skip any freed memory blocks. Useful to force a contiguous
      // block of memory
      useTail:false,
    })

    return helper
  },

  alloc( size, immutable ) {
    let idx = -1

    if( size > this.heap.length ) {
      throw Error( 'Allocation request is larger than heap size of ' + this.heap.length )
    }

    if( this.useTail === false ) {
      for( let key in this.freeList ) {
        let candidate = this.freeList[ key ]

        if( candidate.size >= size ) {
          idx = key

          this.list[ idx ] = { size, immutable, references:1 }

          if( candidate.size !== size ) {
            let newIndex = idx + size,
                newFreeSize

            for( let key in this.list ) {
              if( key > newIndex ) {
                newFreeSize = key - newIndex
                this.freeList[ newIndex ] = newFreeSize
              }
            }
          }

          break
        }
      }
    }

    if( idx !== -1 ) delete this.freeList[ idx ]

    if( idx === -1 ) {
      let keys = Object.keys( this.list ),
          lastIndex

      if( keys.length ) { // if not first allocation...
        lastIndex = parseInt( keys[ keys.length - 1 ] )

        idx = lastIndex + this.list[ lastIndex ].size
      }else{
        idx = 0
      }

      this.list[ idx ] = { size, immutable, references:1 }
    }

    if( idx + size >= this.heap.length ) {
      throw Error( 'No available blocks remain sufficient for allocation request.' )
    }

    return idx
  },

  // this returns the next index that will be use by 
  // memory helper, unless there are freed blcoks available.  
  // if the useTail property is set to true this will return
  // the next block index regardless of any freed blocks.
  getLastUsedIndex() {
    let keys = Object.keys( this.list ),
        idx = 0,
        lastIndex

    if( keys.length ) { // if not first allocation...
      lastIndex = parseInt( keys[ keys.length - 1 ] )

      idx = lastIndex + this.list[ lastIndex ].size
    }

    return idx
  },

  addReference( index ) {
    if( this.list[ index ] !== undefined ) { 
      this.list[ index ].references++
    }
  },

  free( index ) {
    if( this.list[ index ] === undefined ) {
      throw Error( 'Calling free() on non-existing block.' )
    }

    let slot = this.list[ index ]
    if( slot === 0 ) return
    slot.references--

    if( slot.references === 0 && slot.immutable !== true ) {    
      this.list[ index ] = 0

      let freeBlockSize = 0
      for( let key in this.list ) {
        if( key > index ) {
          freeBlockSize = key - index
          break
        }
      }

      this.freeList[ index ] = freeBlockSize
    }
  },
}

module.exports = MemoryHelper

},{}]},{},[96])(96)
});
