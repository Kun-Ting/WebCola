WebCola [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
=======

JavaScript constraint based layout for high-quality graph visualization and exploration 
using D3.js and other web-based graphics libraries.

<p align="center">
  <a href="https://ialab.it.monash.edu/~kche0088/WebCola/examples/torusgraphexample.html">
    <img width="400" alt="Torus with pan" src="WebCola/examples/torusgraphexample.gif" />
  </a>
  <a href="https://ialab.it.monash.edu/~kche0088/WebCola/examples/torusgraphexample.html">
    <img width="400" alt="Torus wrapping" src="WebCola/examples/torusgraphexample2.png" />
  </a>
</p>

[Homepage with code and more examples](https://ialab.it.monash.edu/~kche0088/WebCola/index.html)

Note: While D3 adaptor supports both D3 v3 and D3 v4, WebCoLa's interface is styled like D3 v3. Follow the setup in our homepage for more details.

Installation
------------

#### Browser:

    <!-- Minified version -->
    <script src="http://marvl.infotech.monash.edu/webcola/cola.min.js"></script>
    <!-- Full version -->
    <script src="http://marvl.infotech.monash.edu/webcola/cola.js"></script>

These files can also be accessed from [GitHub](WebCola/cola.js) ([minified](WebCola/cola.min.js)).

#### Npm:
	
	npm install webcola --save

You can also install it through npm by first adding it to `package.json`:

    "dependencies": {
      "webcola": "latest"
    }
Then by running `npm install`.

#### Bower:

	bower install webcola --save

If you use TypeScript, you can get complete TypeScript definitions by installing [tsd 0.6](https://github.com/DefinitelyTyped/tsd) and running `tsd link`.

Building
--------

*Linux/Mac/Windows Command Line:*

 - install [node.js](http://nodejs.org)
 - install grunt from the command line using npm (comes with node.js):

        npm install -g grunt-cli

 - from the WebCola directory:

        npm install

 - build, minify and test:

        grunt

This creates the `cola.js` and `cola.min.js` files in the `WebCola` directory, generates `index.js` for npm, and runs tests.

*Visual Studio:*

 - get the [typescript plugin](http://www.typescriptlang.org/#Download)
 - open webcola.sln

Running
-------

*Linux/Mac/Windows Command Line:*

Install the Node.js http-server module:

    npm install -g http-server

After installing http-server, we can serve out the example content in the WebCola directory.

    http-server WebCola

The default configuration of http-server will serve the exampes on [http://localhost:8080](http://localhost:8080).
