webgl-boilerplate
=================

Some useful baseline code to get new WebGL projects quickly up-and-running.

## How to...

You'll need **node.js** and **npm** to test the site locally.

 1. Install dependencies:

        npm install

 2. Start the node.js server

        node server

 3. Open `localhost:1620` in your browser. You can change the port in `server.js` if you want to use a different one.

## What's already there?

Here is a quick breakdown of the JavaScript files (found in `public/`):

- A few external libraries, namely `webgl-utils.js`, `jquery-2.1.0.js` and `jquery.color-2.1.2.js`.
- A `math.js` which just defines shorthands for some members of the global `Math` as well as some other convenient functions and constants. Leave this out if you don't want to pollute your global "namespace" more than you have to.
- A `Configuration.js` which I tend to use for all sorts of static global configuration.
- A class in `ColorGenerator.js` (together with a global instance of that class), which ... generates colours. The idea is that no two colours are exactly the same and consecutive colours are maximally distinguishable. I use this mostly for debug output, so I can distinguish object identities by colour. If you pass the `next` method a truthy argument, the hues of the colours will be slightly corrected to enhance distinguishability even more.
- A bunch of classes to render some geometry primitives, namely `Line`, `Circle`, `ConvexPolygon`. Their constructors should be sufficient documentation. `ConvexPolygon` also comes with a convenience method `ConvexPolygon.CreateArrow` to create simple arrows for debug output (or maybe your application needs arrows, too, what do I know).
- The `main.js` which contains all the setup code for WebGL, the render loop and input handling.

The canvas has a size and resolution of 1024x1024 pixels. If that doesn't fit in your browser window try full-screen or zooming out. Alternatively, you'll have to change some CSS, as well as the `resolution` global in `Configuration.js`.

Have fun!
