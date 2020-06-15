module.exports = {
  glide: {
    type: "number(sequencable)",
    default:1, min:1, max:4000,
    doc: "The glide property controls a single-pole lowpass filter on the frequency, causing notes to slide from one to the next (portamento). The filter equation is: y (n) = y (n-1) + ((x (n) - y (n-1))/glide). A value of 1 generates no glide, a value of 1500 generates a substantial glide."
  }
}