const optional = true,
      required = true

module.exports = [
  {
    name: "Vec2",
    doc: "A two-item vector.",
    properties: {
      x: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The x mmember of the vector."
      },
      y: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The y mmember of the vector."
      },
    }
  },
  {
    name: "Vec3",
    doc: "A three-item vector.",
    properties: {
      x: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The x mmember of the vector."
      },
      y: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The y mmember of the vector."
      },
      z: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The z mmember of the vector."
      },
    }
  },
  {
    name: "Vec4",
    doc: "A four-item vector.",
    properties: {
      x: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The x mmember of the vector."
      },
      y: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The y mmember of the vector."
      },
      z: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The z member of the vector."
      },
      w: {
        isa: "number(sequencable)",
        type: "float",          
        default: 0,
        doc: "The w member of the vector."
      },
    }
  },
  {
    name: "Material",
    doc: "This determines aspects of a geometry such as color and reflectance.",
    properties: {
      mode: {
        type: "string",          
        default: 'global',
        doc: "The lighting model employed by the material. Possible options include 'global', 'phong', 'orenn', and 'normal'."
      },
      ambient: {
        type: "vec3",          
        default: '(.1,.1,.1)',
        doc: "This color is applied to every pixel in the geometry equally, regardless of how light strikes the geometry."
      },
      diffuse: {
        type: "vec3",          
        default: '(0,0,1)',
        doc: "This color is applied to every pixel in proportion to how much light is striking each pixel."
      },
      specular: {
        type: "vec3",          
        default: '(1,1,1)',
        doc: "This color is applied to the geometry in spots where light reflects directly off the geometry into the camera, creating a glare."
      },
      shininess: {
        type: "float",          
        default: 0,
        doc: "This determines how soft or hard the edges of specular highlights are. More 'shiny' surfaces will have harder edges and are indicated by higher values."
      },
      fresnel: {
        type: "vec3",          
        default: '(0,1,2)',
        doc: "he Fresnel effect changes the color of a geometry based upon the angle it is viewed at. This vector contains three values: x is bias, or an offset for the effect; y is scale, or a multiplier for the effect; z an coefficient that exponentially controls the effect of reflectance."
      },
    }
  },
  {
    name: "Texture",
    doc: "A texture can be applied to a geometry in order to pattern its surface; it can also be used as a lookup table for bump mapping. Unlike materials, every texture has a relatively unique set of properties depending on the algorithm used for the texture. However, the majority of texture will have a 'scale' property which determines the resolution of the texture; many will also have a 'strength' property that scales the effect of the texture on the final color of the geometry (lighting and material also affect this).",
    properties: {
      scale: {
        isa: "number(sequencable)",
        type: "float",          
        default: 1,
        doc: "The scale property determines the size, or resolution, of the texture. For example, when 'dots' texture is assigned to a cube with a scale of 10 there will be 10x10 dots on each side of the cube. A scale value of 1 will yiled a single dot centered on each side."
      }
    }
  },
]