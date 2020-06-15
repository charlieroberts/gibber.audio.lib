const optional = true,
      required = true,
      overloaded = '?'

module.exports = [
{
  name: "operation",
  type: "operation",
  doc: "The majority of 3D objects in gibber include methods found in this prototype.",
  methods: {
    translate: {
      args: [{
        name: "x",
        type: "float",
        doc: "Translation on the X axis. If the x argument is the only one provided, it will also be applied to the Y and Z axes.",
        required
      }, {
        name: "y",
        type: "float",
        doc: "Translation on the Y axis.",
        optional
      }, {
        name: "z",
        type: "float",
        doc: "Translation on the Z axis.",
        optional
      }, ],
      returns: "this",
      doc: "Change the center point of an operation by passing x,y, and z offsets."
    },
    rotate: {
      args: [{
        name: "angle",
        type: "float",
        doc: "The ammount of rotation to be applied along the argument axis, measured in degrees.",
        required
      }, {
        name: "x",
        type: "float",
        doc: "X component of rotation axis. If no axis is passed to this function the operation will rotate around the last defined axis.",
        optional
      }, {
        name: "y",
        type: "float",
        doc: "Y component of rotation axis. If no axis is passed to this function the operation will rotate around the last defined axis.",
        optional
      }, {
        name: "z",
        type: "float",
        doc: "Z component of rotation axis. If no axis is passed to this function the operation will rotate around the last defined axis.",
        optional
      }, ],
      returns: "this",
      doc: "Rotate an operation by passing an angle and defining an axis for the rotation. If no axis is passed to this function the operation will rotate around the last defined axis."
    },
    scale: {
      args: [{
        name: "x",
        type: "float",
        doc: "Scale on the X axis. If the x argument is the only one provided, it will also be applied to the Y and Z axes.",
        required
      }, {
        name: "y",
        type: "float",
        doc: "Scale on the Y axis.",
        optional
      }, {
        name: "z",
        type: "float",
        doc: "Scale on the Z axis.",
        optional
      }, ],
      returns: "this",
      doc: "Change the size of an operation by passing x,y, and z scalars."
    },
    render: {
      returns: 'this',
      doc: "Renders the associated geometry, with arguments for static rendering and quality.",
      args: [{
        name: "quality",
        type: "int",
        default: 2,
        doc: "The quality of the rendering performed, measured from 1–10. Numbers above 2 or 3 should only be used with simple scenes and/or high-powered graphics cards (GPUs).",
        optional
      }, {
        name: "shouldAnimate",
        type: "boolean",
        default: true,
        doc: "Controls whether or not the geometry is rendered on a per-frame basis (true) or is only rendered a single time (false).",
        optional
      }]
    }
  }
}, 
{
  name: "geometry",
  type: "operation",
  prototype: "operation",
  doc: "Any 3D geometry in gibber includes methods from this prototype.",
  methods: {
    material: {
      returns: 'this',
      doc: "Set the material used by the object. A string can be passed as the first argument in order to select a material preset, otherwise a material instance should be passed. The optional properties object modifies whatever is passed as the first argument, either the preset or the material instance.",
      args: [{
        name: "initializer",
        type: "presetName|material",
        doc: "This is an overloaded argument that can either be an existing material object or the name of a material preset",
        required
      }, {
        name: "modifiers",
        type: "object",
        doc: "This optzonal object contains key/value pairs that modify the preset/material passed as the first argument.",
        optional
      }]
    },
    texture: {
      returns: 'this',
      doc: "Set the texture used by the object. A string can be passed as the first argument in order to select a matexture preset, otherwise a texture instance should be passed. The optional properties object modifies whatever is passed as the first argument, either the preset or the texture instance.",
      args: [{
        name: "initializer",
        type: "presetName|texture",
        doc: "This is an overloaded argument that can either be an existing texture object or the name of a texture preset",
        required
      }, {
        name: "modifiers",
        type: "object",
        doc: "This optional object contains key/value pairs that modify the preset/texture passed as the first argument.",
        optional
      }]
    }
  }
}]
