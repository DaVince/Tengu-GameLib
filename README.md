Tengu GameLib
=============

This project is no longer being worked on and was never in a remotely finished state of development.

Copyright (c) Tengu Dev.
Coding by Vincent Beers <VincentBeers@gmail.com> or <davince@tengudev.com>

Tengu GameLib is a small HTML5 game library used in Tengu's HTML5 games that
allows you to easily create and manage game states.

Further documentation can be found in the directory doc.


FEATURES
========
* Easy to use - import the library using a script tag, and then just do
  Gamelib.init() somewhere on the page!
* Creates a canvas for you on init, with dimensions you can set.
* Takes arguments on startup (like "debug" or anything you like).
* Simple state handler with overridable render(), update() and onstart() methods.
* Switching states is hassle-free. Just start() a different state and the
  previous state will pause on the spot.
* Simple input handler. Key and mouse events can be obtained through
  Gamelib.INPUT, rather than with DOM events. Of course, DOM events are still
  possible if you prefer them.
* Simple debug logger.
* Simplified resource loading. When creating a state, you tell it what resources
  it needs, and it will load these and show a "Loading..." screen until they are
  loaded.
* Relies on canvas for its rendering (Gamelib.canvas is the Canvas 2D context).
