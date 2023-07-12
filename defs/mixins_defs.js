const optional = true,
      required = true,
      overloaded = '?'

module.exports = [
  {
    name: "number(sequencable)",
    ternName: "number__sequencable",
    methods:{
      fade: {
        name:"function",
        args:[
          {
            name:"start",
            type:'number',
            default:0,
            doc:"The starting value for the fade. If a value of null is passed, the current value of the property will be the fade starting point.",
            required
          },
          {
            name:"end",
            type:'number',
            default:1,
            required,
            doc:"The end value for the fade. If a value of null is passed, the current value of the property will be the end of the fade."
          },
          {
            name:"time",
            type:"number",
            default:4,
            required,
            doc:"The duration of the fade, in measures."
          }
        ],
        returns:"this",
        doc: "The fade method fades a property between two values over a given timespan (measured in meeasures). If you pass null for either the start or end argument, the fade will substitute the current value of the property. For example, to fade an instrument in from 0 to its current gain over 8 measures, use syn.gain.fade( 0, null, 8)",
      },
     
      seq:{
        args:[
          {
            name:"values",
            type:overloaded,
            default:"none",
            doc:"This determines the output of the sequencer. A single value will be outputted repeatedly. Arrays will be converted to gibber Pattern objects. gen expressions creating signals can also be used here; this signals will be sampled whenever the sequencer is triggered (as determined by the timings argument).",
            required
          },
          {
            name:"timings",
            type:overloaded,
            default:"none",
            optional,
            doc:"This argument determines when the sequencer fires. If no value is passed, the sequencer will fire whenever another sequencer on the same object fires... this enables you to only specify a single timings pattern and control all sequencers on an object with it. Arrays passed as an argument will be automatically converted to gibber pattern objects."
          },
          {
            name:"seq_id",
            type:"number",
            default:0,
            min:0,
            max:Infinity,
            optional,
            doc:"This argument is used to identify individual sequencers, as multiple sequencers can be assigned to control a single method/property."
          }
        ],
        returns:"this",
        doc: "The seq method enables you to easily sequence any method or property. You can pass a single value or a pattern/array of values for both the 'values' and 'timings' arguments. The timings argument will determine when the sequencer fires and the values argument will determine output."
      },
      start: {
        name:"function",
        args:[],
        returns:"this",
        doc: "Starts all seq and tidal schedulers controlling this property/method."
      },
      stop: {
        name:"function",
        args:[],
        returns:"this",
        doc: "Stops all seq and tidal schedulers controlling this property/method."
      },
      tidal: {
        name:"function",
        args:[
          {
            name:"pattern",
            type:"string",
            default:"none",
            required,
            doc:"A string using the TidalCycles mini-notation. See the TidalCycles tutorial for more information."
          },
          {
            name:"tidal_id",
            type:"number",
            default:0,
            min:0,
            max:Infinity,
            optional
          }
        ],
        returns:"this",
        doc: "The tidal method enables you to easily sequence any method or property using the TidalCycles mini-notation. ",
      },
    },
    properties:{
      sequencers: {
        type: "array",
        doc: "Stores all scheduler instances created by calling .seq on this property/method."
      },
      tidals: {
        type: "array",
        doc: "Stores all scheduler instances created by calling .tidal on this property/method."
      }
    }
  },
  {
    name: "method(sequencable)",
    ternName: "method__sequencable",
    methods:{
      seq:{
        args:[
          {
            name:"values",
            type:overloaded,
            default:"none",
            required,
            doc:"This determines the output of the sequencer. A single value will be outputted repeatedly. Arrays will be converted to gibber Pattern objects. gen expressions creating signals can also be used here; this signals will be sampled whenever the sequencer is triggered (as determined by the timings argument).",

          },
          {
            name:"timings",
            type:overloaded,
            default:"none",
            optional,
            doc:"This argument determines when the sequencer fires. If no value is passed, the sequencer will fire whenever another sequencer on the same object fires... this enables you to only specify a single timings pattern and control all sequencers on an object with it. Arrays passed as an argument will be automatically converted to gibber pattern objects."

          },
          {
            name:"seq_id",
            type:"number",
            default:0,
            min:0,
            max:Infinity,
            optional
          }
        ],
        returns:"this",
        doc: "The seq method enables you to easily sequence any method or property. You can pass a single value or an array of values for both the 'values' and 'timings' arguments. The timings argument will determine when the sequencer fires and the values argument will determine output."
      },
      start: {
        name:"function",
        args:[],
        returns:"this",
        doc: "Starts all seq and tidal schedulers controlling this property/method."
      },
      stop: {
        name:"function",
        args:[],
        returns:"this",
        doc: "Stops all seq and tidal schedulers controlling this property/method."
      },
      tidal: {
        name:"function",
        args:[
          {
            name:"pattern",
            type:"string",
            default:"none",
            required,
            doc:"A string using the TidalCycles mini-notation. See the TidalCycles tutorial for more information."
          },
          {
            name:"tidal_id",
            type:"number",
            default:0,
            min:0,
            max:Infinity,
            optional
          }
        ],
        returns:"this",
        doc: "The tidal method enables you to easily sequence any method or property using the TidalCycles mini-notation. "
      },
    },
    properties:{
      sequencers: {
        type: "array",
        doc: "Stores all scheduler instances created by calling .seq on this property/method."
      },
      tidals: {
        type: "array",
        doc: "Stores all scheduler instances created by calling .tidal on this property/method."
      }
    }
  }
]
