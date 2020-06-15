gibber.audio.lib
==========

Gibber is an audiovisual programming library and live coding environment for the browser.

[Try the playground](./playground/index.html)

## Building (for development)

You can simply download the repo and skip straight to the **Usage** section if you don't need to modify the library. If you want to modify gibber.audio.lib, here's how to build it:

1. If you don't have it, install `npm` (the Node.js package manager) from [npmjs.org][].
2. Inside the top level of the repo, run `npm install` in a terminal.
3. Run `gulp` (`gulp` is the build system, it is installed in step 2).

The build outputs a UMD file, `gibber.audio.js`, to the dist folder.

## Usage
The library can be used with plain script tags, or CommonJS-/ AMD- style includes. Below is an example HTML file which plays a simple drum beat, bass line, and random melody.

`Gibber.init()` returns a promise; all code should be placed in a function that will execute when the promise resolves (shown below).
```html
<html lang='en'>

<head>
  <script src='./dist/gibber.audio.js'></script>
</head>

<body><p>click window to begin.</p></body>

<script>

  window.onclick = function() {
    Gibber.init().then( () => {

      const syn = Synth()
      syn.note.seq( [0,1], 1/4 )

      window.onclick = null
    })
  }

</script>

</html>
```
