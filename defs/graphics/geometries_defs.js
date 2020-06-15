const optional = true,
      required = true

module.exports = [
  {
    name: "Box",
    prototype: "geometry",
    doc: "A box.",
    properties: {
      size: {
        type: "vec3",          
        default: '(1,1,1)',
        doc: "The size of the box in three dimensions."
      }
    }
  },
  {
    name: "Capsule",
    prototype: "geometry",
    doc: "A capsule, which is cylinder with a half sphere on each end (like a pill).",
    properties: {
      start: {
        type: "vec3",          
        default: '(0,0,0)',
        doc: "The posititon of one end of the capsule."
      },
      end: {
        type: "vec3",          
        default: '(1,1,1)',
        doc: "The posititon of one end of the capsule."
      },
      radius: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:.01,
        max:5,
        doc: "The radius of the capsule."
      }
    }
  },
  {
    name: "Cone",
    prototype: "geometry",
    doc: "A cone.",
    properties: {
      size: {
        type: "vec3",          
        default: '(1,1,1)',
        doc: "The size of the box in three dimensions... kinda. Play with the values to get a sense for how they work."
      }
    }
  },
  {
    name: "Cylinder",
    prototype: "geometry",
    doc: "A cylinder.",
    properties: {
      dimensions: {
        type: "vec2",          
        default: '(1,1)',
        doc: "The radius and height of the cylinder."
      }
    }
  },
  {
    name: "HexPrism",
    prototype: "geometry",
    doc: "A six-sided prism.",
    properties: {
      dimensions: {
        type: "vec2",          
        default: '(1,1)',
        doc: "The radius and height of the prism."
      }
    }
  },
  {
    name: "Julia",
    prototype: "geometry",
    doc: "A three-dimensional rendering of the Julia set of a quaternion function.",
    properties: {
      fold: {
        isa: "number(sequencable)",
        type: "float",          
        default: 2,
        min:.01,
        max:5,
        doc: "Controls a coefficient in the equation for the Julia set."
      }
    }
  },
  {
    name: "Mandelbulb",
    prototype: "geometry",
    properties: {
      c0: {
        isa: "number(sequencable)",
        type: "float",          
        default: 8,
        min:.5,
        max:20,
        doc: "A coefficient that affects variouus exponents in the Mandulbulb equation. Higher values yield the appearance of greater recursion / complexity."
      }
    }
  },
  {
    name: "Mandelbox",
    prototype: "geometry",
    properties: {
      fold: {
        isa: "number(sequencable)",
        type: "float",          
        default: .1,
        min:2,
        max:.01,
        doc: "A coefficient that controls the amount of spherical folding in the mandelbox."
      },
      scale: {
        isa: "number(sequencable)",
        type: "float",          
        default: 3,
        min:1,
        max:20,
        doc: "A coefficient that controls the scaling in the mandelbox."
      },
      iterations: {
        isa: "number(sequencable)",
        type: "int",          
        default: 5,
        min:1,
        max:.10,
        doc: "The number of times the mandelbox equation is run per frame. This number greatly influences the complexity of the final output, but higher values are computationally expensive."
      }
    }
  },
  {
    name: "Plane",
    prototype: "geometry",
    doc: "A flat rectangle, facing any direction.",
    properties: {
      normal: {
        type: "vec3",          
        default: '(0,1,0)',
        doc: "The direction the plane is facing. By default it faces upward along the y axis."
      },
      distance: {
        type: "vec3",          
        default: '(1,1,1)',
        doc: "The distance of the plane from the origin."
      }
    }
  }, 
  {
    name: "Sphere",
    prototype: "geometry",
    doc: "A sphere. All outer points are equidistant from the center.",
    properties: {
      radius: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        min:.01,
        max:5,
        doc: "The radius of the sphere."
      }
    }
  },
  {
    name: "Torus",
    prototype: "geometry",
    doc: "A 3D ring.",
    properties: {
      radii: {
        type: "vec2",          
        default: '(.5,.1)',
        doc: "This vector determines the outer and inner radius of the ring."
      }
    }
  },
  {
    name: "Torus82",
    prototype: "geometry",
    doc: "A 3D ring that is flat on one axis.",
    properties: {
      radii: {
        type: "vec2",          
        default: '(.5,.1)',
        doc: "This vector determines the outer and inner radius of the ring."
      }
    }
  },
  {
    name: "Torus88",
    prototype: "geometry",
    doc: "A 3D ring that is squared and flattened on one axis.",
    properties: {
      radii: {
        type: "vec2",          
        default: '(.5,.1)',
        doc: "This vector determines the outer and inner radius of the ring."
      }
    }
  },
]