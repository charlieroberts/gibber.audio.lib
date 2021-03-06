const optional = true,
      required = true,
      overloaded = '?'

module.exports = [
  {
    name: "number(sequencable)",
    ternName: "number__sequencable",
    methods:{
      seq:{
        args:[
          {
            name:"values",
            type:overloaded,
            default:"none",
            required
          },
          {
            name:"timings",
            type:overloaded,
            default:"none",
            optional
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
            required
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
            required
          },
          {
            name:"timings",
            type:overloaded,
            default:"none",
            optional
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
            required
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