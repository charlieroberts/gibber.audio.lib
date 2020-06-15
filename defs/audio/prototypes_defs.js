const optional = true,
      required = true,
      overloaded = '?'

module.exports = [{
  name: "ugen",
  type: "ugen",
  doc: "The ugen prototype contains the base behavior for connecting / disconnecting audio processes from each other.",
  methods: {
    connect: {
      args: [{
        name: "target",
        type: "ugen",
        doc: "The target ugen to connect to. If this argument is undefined, a connection will be made to Gibber's main bus.",
        optional
      }, ],
      doc: "The connect function connects synthesis object to another synthesis object. If no object is passed as an argument, connect will connect to Gibber's main bus."
    },
    "disconnect": {
      args: [{
        name: "target",
        type: "ugen",
        doc: "The target ugen to disconnect from. If this argument is undefined, all connections will be disconnected.",
        optional
      }, ],
      returns: "this",
      doc: "The disconnect function disconnects a synthesis object from other synthesis objects. If no object is passed as an argument, disconnect will break all current connections."
    }
  }
}, 
{
  name: "instrument",
  prototype: 'ugen',
  type: "instrument",
  methods: {
    note: {
      isa: "method(sequencable)",
      args: [{
        name: "scaleIndex",
        type: "int",
        doc: "The arguent scale index is converted to Hz according to the currently selected tuning and mode.",
        required
      }, ],
      returns: "this",
      doc: "The note function triggers a new note using an argument scale index, which is converted into Hz and stored in the instrument's .frequency property."
    },
    trigger: {
      isa: "method(sequencable)",
      args: [{
        name: "loudness",
        type: "float",
        doc: "This sets the loudness for a single triggering of the instrument. You can also directly set the overall loudness of the instrument using the `.loudness` property, or scale the overall signal using `.gain`.",
        required
      }, ],
      returns: "this",
      doc: "The trigger function triggers a new note using the argument loudness and, if appropriate, the current value of the instrument's .frequency property."
    }
  },
}, 
{
  name: "effect",
  type: "effect",
  prototype: "ugen",
  properties: {
    input: {
      type: "ugen",
      doc: "The input property provides the signal to be processed. This is automatically set when adding the effect to an effect chain on an instrument, or when calling instrument.connect( effect ).",
      default: 0
    }
  }
}] 