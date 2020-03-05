const COLORS = {
  FILL:'rgba(46,50,53,1)',
  STROKE:'#aaa',
  DOT:'rgba(89, 151, 198, 1)'//'rgba(0,0,255,1)'
}

let Gibber = null

const findByName = name => {
  let targetWidget = null
  for( let key in Waveform.widgets ) {
    if( key === 'dirty' || key === 'findByObj' ) continue
    const widget = Waveform.widgets[ key ]
    if( widget === undefined ) continue
    if( widget.target === name ) {
      targetWidget = widget
      break
    }
  }
  return targetWidget
}

const Waveform = {
  widgets: { 
    dirty:false,
    findByName
  },

  // we use this flag to start the animation clock if needed.
  initialized: false,
  
  // we pass in the state from the AST walk because that's the simplest place to store 
  // a reference to the genish object that should be tied to the widge we are
  // creating.

  // XXX there's a bunch of arguments  that could probably be removed from this function. 
  // Definitely closeParenStart, probably also isAssignment, maybe track & patternObject.
  createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject=null, track, isSeq=true, walkState ) {
    let widget = document.createElement( 'canvas' )
    widget.padding = 40
    widget.waveWidth = 60
    widget.ctx = widget.getContext('2d')
    widget.style.display = 'inline-block'
    widget.style.verticalAlign = 'middle'
    widget.style.height = '1.1em'
    widget.style.width = ((widget.padding * 2 + widget.waveWidth) * window.devicePixelRation ) + 'px'
    widget.style.backgroundColor = 'transparent'
    widget.style.margin = '0 1em'
    widget.style.borderLeft = '1px solid #666'
    widget.style.borderRight = '1px solid #666'
    widget.setAttribute( 'width', widget.padding * 2 + widget.waveWidth )
    widget.setAttribute( 'height', 13 )
    widget.ctx.fillStyle = COLORS.FILL 
    widget.ctx.strokeStyle = COLORS.STROKE
    widget.ctx.font = '10px monospace'
    widget.ctx.lineWidth = 1
    widget.gen = patternObject !== null ? patternObject.value : walkState.gen.value//Gibber.Gen.lastConnected.shift()
    widget.values = []
    widget.storage = []
    widget.min = 10000
    widget.max = -10000
    widget.windowSize = 240

    let isFade = false

    // special case for fades on graphics objects, which don't use an underlying genish object
    if( Array.isArray( walkState ) && walkState.indexOf('fade') > -1 && patternObject.type === 'graphics' ) { 
      widget.gen = patternObject.__fadeObj 
    }
    // is it a fade?
    if( widget.gen !== undefined && widget.gen.from !== undefined ) {
      widget.min = widget.gen.from.value
      widget.max = widget.gen.to.value
      widget.isFade = isFade = true
      widget.gen = widget.gen.__wrapped__ !== undefined ? widget.gen.__wrapped__ : widget.gen
      widget.values = widget.gen.values
    }else{
      // XXX what? so hacky...
      widget.gen = patternObject
    }

    if( widget.gen === null || widget.gen === undefined ) {
      if( node.expression !== undefined && node.expression.type === 'AssignmentExpression' ) {
        isAssignment = true
        
        widget.gen = window[ node.expression.left.name ]

        if( widget.gen.widget !== undefined ) {
          widget.gen.widget.parentNode.removeChild( widget.gen.widget )
        }
        widget.gen.widget = widget
      }else if( node.type === 'CallExpression' ) {
        const state = cm.__state
        
        if( node.callee.name !== 'Lookup' && node.callee.property.name !== 'fade' ) {
          const objName = `${state[0]}`
          const track  = window.signals[0]//window[ objName ][ state[1] ]
          let wave
          if( state.length > 2 ) {
            wave = track[ node.callee.object.property.value][ node.arguments[2].value ] 
          }else{
            wave = track() 
          }

          if( wave !== undefined && wave.values.type === 'WavePattern' ) {
            widget.gen = wave.values
            widget.gen.paramID += '_' + node.arguments[2].value
          }
          isAssignment = true
        }else{
          widget.gen = patternObject
        }
      } 
    }else{
      if( widget.gen.widget !== undefined && widget.gen.widget !== widget ) {
        isAssignment = true
        //widget.gen = window[ node.expression.left.name ]
      }else{
        //widget.gen.widget = widget
      }
    }

    //if( widget.gen.id === undefined ) widget.gen.id = Gibber.Gibberish.utilities.getUID()

    widget.mark = cm.markText({ line, ch:ch }, { line, ch:ch+1 }, { replacedWith:widget })
    widget.mark.__clear = widget.mark.clear

    widget.mark.clear = function() { 
      const pos = widget.mark.find()
      if( pos === undefined ) return
      widget.mark.__clear()

      if( isSeq === true ) { // only replace for waveforms inside of a .seq() call
        cm.replaceRange( '', { line:pos.from.line, ch:pos.from.ch }, { line:pos.from.line, ch:pos.to.ch } ) 
      }
    }

    widget.clear = ()=> {
      delete Waveform.widgets[ widget.gen.id ]
      widget.mark.clear() 
    }

    if( widget.gen !== null && widget.gen !== undefined ) {
      //console.log( 'paramID = ', widget.gen.paramID ) 
      if( widget.gen.id === undefined ) widget.gen.id = patternObject.id 

      Waveform.widgets[ widget.gen.id ] = widget
      widget.gen.widget = widget
      widget.gen.__onclear = ()=> widget.mark.clear()
    }
    
    if( patternObject !== null ) {
      patternObject.mark = widget.mark
      if( patternObject === Gibber.Gen.lastConnected[0] ) Gibber.Gen.lastConnected.shift()
    }

    if( !isFade ) {
      widget.onclick = evt => {
        if( evt.shiftKey === false ) {
          widget.min = Infinity
          widget.max = -Infinity
          widget.storage.length = 0
        }else{
          // increase size of window
          widget.windowSize *= 2
          console.log( 'windowsize:', widget.windowSize )

        }
      }
    }
    

    if( this.initialized === false ) {
      this.startAnimationClock()
      this.initialized = true
    }

    widget.isFade = isFade

    return widget
  },

  clear() {
    for( let key in Waveform.widgets ) {
      let widget = Waveform.widgets[ key ]
      if( typeof widget === 'object' ) {
        widget.mark.clear()
        //widget.parentNode.removeChild( widget )
      }
    }

    Waveform.widgets = { dirty:false, findByName }
  },

  startAnimationClock() {
    const clock = function(t) {
      Waveform.drawWidgets()
      window.requestAnimationFrame( clock )
    }

    clock()
  },

  // currently called when a network snapshot message is received providing ugen state..
  // needs to also be called for wavepatterns.
  updateWidget( id, __value, isFromMax = true ) {
    const widget = typeof id !== 'object' ? Waveform.widgets[ id ] : id
    if( widget === undefined ) { 
      return 
    }

    let value = parseFloat( __value )

    // XXX why does beats generate a downward ramp?
    if( isFromMax ) value = 1 - value

    if( typeof widget.values[60] !== 'object' ) {
      widget.values[ 60 ] = value
      widget.storage.push( value )
    }

    if( widget.isFade !== true ) {
      if( widget.storage.length > widget.windowSize ) {
        widget.max = Math.max.apply( null, widget.storage )
        widget.min = Math.min.apply( null, widget.storage )
        widget.storage.length = 0
      } else if( value > widget.max ) {
        widget.max = value
      }else if( value < widget.min ) {
        widget.min = value
      } 
    }

    widget.values.shift()

    Waveform.widgets.dirty = true

  },

  // called by animation scheduler if Waveform.widgets.dirty === true
  drawWidgets() {
    Waveform.widgets.dirty = false

    const drawn = []

    for( let key in Waveform.widgets ) {
      if( key === 'dirty' || key === 'findByObj' ) continue

      const widget = Waveform.widgets[ key ]

      if( widget === undefined || widget === null ) continue

      // ensure that a widget does not get drawn more
      // than once per frame
      if( drawn.indexOf( widget ) !== -1 ) continue

      if( typeof widget === 'object' && widget.ctx !== undefined ) {

        widget.ctx.fillStyle = COLORS.FILL
        widget.ctx.clearRect( 0,0, widget.width, widget.height )

        // draw left border
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding + .5, 0.5 )
        widget.ctx.lineTo( widget.padding + .5, widget.height + .5 )
        widget.ctx.stroke()

        // draw right border
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding + widget.waveWidth + .5, .5 )
        widget.ctx.lineTo( widget.padding + widget.waveWidth + .5, widget.height + .5 )
        widget.ctx.stroke()

        // draw waveform
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding,  widget.height / 2 + 1 )

        const wHeight = (widget.height * .85 + .45) - 1

        // needed for fades
        let isReversed = false

        if( widget.isFade !== true ) {

          const range = widget.max - widget.min
          for( let i = 0, len = widget.waveWidth; i < len; i++ ) {
            const data = widget.values[ i ]
            const shouldDrawDot = typeof data === 'object'
            const value = shouldDrawDot ? data.value : data
            const scaledValue = ( value - widget.min ) / range

            const yValue = scaledValue * (wHeight) - 1.5 
            
            if( shouldDrawDot === true ) {
              widget.ctx.fillStyle = COLORS.DOT
              widget.ctx.lineTo( i + widget.padding + .5, wHeight - yValue )
              widget.ctx.fillRect( i + widget.padding - 1, wHeight - yValue - 1.5, 3, 3)
            }else{
              widget.ctx.lineTo( i + widget.padding + .5, wHeight - yValue )
            }
          }
        }else{
          const range = Math.abs( widget.gen.to - widget.gen.from )
          isReversed = ( widget.gen.from > widget.gen.to )

          if( !isReversed ) {
            widget.ctx.moveTo( widget.padding, widget.height )
            widget.ctx.lineTo( widget.padding + widget.waveWidth, 0 )
          }else{
            widget.ctx.moveTo( widget.padding, 0 )
            widget.ctx.lineTo( widget.padding + widget.waveWidth, widget.height )
          }

          const value = widget.gen.values[0]
          if( !isNaN( value ) ) {
            let percent = isReversed === true ? Math.abs( (value-widget.gen.to) / range ) : Math.abs( (value-widget.gen.from) / range ) 

            if( !isReversed ) {
              widget.ctx.moveTo( widget.padding + ( Math.abs( percent ) * widget.waveWidth ), widget.height )
              widget.ctx.lineTo( widget.padding + ( Math.abs( percent ) * widget.waveWidth ), 0 )
            }else{
              widget.ctx.moveTo( widget.padding + ( (1-percent) * widget.waveWidth ), widget.height )
              widget.ctx.lineTo( widget.padding + ( (1-percent) * widget.waveWidth ), 0 )
            }

            // XXX we need to also check if the next value would loop the fade
            // in which case finalizing wouldn't actually happen... then we
            // can get rid of magic numbers here.
            if( isReversed === true ) {
              //console.log( 'reverse finalized', percent, widget.gen.from, widget.gen.to )
              if( percent <= 0.01) widget.gen.finalize()
            }else{
              //console.log( 'finalized', percent, value, range, widget.gen.from, widget.gen.to )
              if( percent >= .99 ) widget.gen.finalize()
            }
          }

        }
        widget.ctx.stroke()

        //const __min = isReversed === false ? widget.min.toFixed(2) : widget.max.toFixed(2)
        //const __max = isReversed === false ? widget.max.toFixed(2) : widget.min.toFixed(2)

        let __min, __max
        if( widget.isFade !== true ) {
          __min = isReversed === false ? widget.min.toFixed(2) : widget.max.toFixed(2)
          __max = isReversed === false ? widget.max.toFixed(2) : widget.min.toFixed(2)
          }else{
          __min = widget.gen.from.toFixed(2)//isReversed === false ? widget.gen.to.toFixed(2) : widget.gen.to.toFixed(2)
          __max = widget.gen.to.toFixed(2)  //isReversed === false ? widget.gen.from.toFixed(2) : widget.gen.from.toFixed(2)
        }


        const reverseHeight = widget.isFade === true && __min > __max 

        // draw min/max
        widget.ctx.fillStyle = COLORS.STROKE
        widget.ctx.textAlign = 'right'
        widget.ctx.fillText( __min, widget.padding - 2, reverseHeight === false ? widget.height : widget.height / 2 )
        widget.ctx.textAlign = 'left'
        widget.ctx.fillText( __max, widget.waveWidth + widget.padding + 2, reverseHeight === false ? widget.height / 2 : widget.height )

        // draw corners
        widget.ctx.beginPath()
        widget.ctx.moveTo( .5, 3.5 )
        widget.ctx.lineTo( .5, .5 )
        widget.ctx.lineTo( 3.5, .5)

        widget.ctx.moveTo( .5, widget.height - 3.5 )
        widget.ctx.lineTo( .5, widget.height - .5 )
        widget.ctx.lineTo( 3.5, widget.height - .5 )

        const right = widget.padding * 2 + widget.waveWidth - .5
        widget.ctx.moveTo( right, 3.5 )
        widget.ctx.lineTo( right, .5 ) 
        widget.ctx.lineTo( right - 3, .5 )

        widget.ctx.moveTo( right, widget.height - 3.5 )
        widget.ctx.lineTo( right, widget.height - .5 ) 
        widget.ctx.lineTo( right - 3, widget.height - .5 )

        widget.ctx.stroke()

        drawn.push( widget )
      }
    }
  }
}


module.exports = function( __Gibber ) {
  Gibber = __Gibber
  return Waveform
}
