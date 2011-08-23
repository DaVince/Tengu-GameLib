/** Tengu HTML5 Gamelib
 * By Tengu Dev
 * http://tengudev.com/
 *
 * Coding: Vincent Beers (DaVince) <VincentBeers@gmail.com>
 * 
 * Licensed under the New BSD License (see LICENSE).
 * 
 **/

var Gamelib = [];

/** Globals **/
Gamelib.canvas = undefined;
Gamelib.STATE = undefined;//Current state
Gamelib.STATES = [];     //Contains all states.
Gamelib.RES = [];        //Contains all loaded resources.
  //Gamelib.RES["filename"].tagName: get the tag name so we know the type of resource.
Gamelib.FPS = 30;
Gamelib.ARGS = "";
Gamelib.SW = undefined;  //Screen width
Gamelib.SH = undefined;  //Screen height

Gamelib.LOADBAR = false; //Show loading bar
Gamelib.DEBUG = false;

Gamelib.INPUT = undefined;
Gamelib.KEYSPRESSED = []; //An array of all keycodes that currently have "keydown" on them.
Gamelib.MOUSEPRESSED = [];

/** Log anything. **/
Gamelib.log = function(msg) {
  if (Gamelib.DEBUG)
    $('#messages').append(msg + "<br>");
    $("#messages").scrollTop($("#messages").scrollTop() + 100);
}

/** Initialize your game **/
Gamelib.init = function(width, height, args) {
  if (args) {
    Gamelib.ARGS = args.split(" ");
    if (args.search("debug") != -1) Gamelib.DEBUG = true; 
    if (args.search("progressbar") != -1) Gamelib.LOADBAR = true;
  }
  
  //Create debug panel.
  if (Gamelib.DEBUG) {
    var msg = document.createElement("div");
    msg.id = "messages";
    msg.innerHTML = '<h1 style="font-size: large; padding: 0;">Message log</h1>';
    msg.setAttribute("style", "position: fixed; width: 30%; height: 100%; top: 0; right: 0; \
      border: 1px dotted black; background: rgba(255,255,255,0.7); overflow: auto; \
      font-family: monospace; font-size: small;");
    document.body.appendChild(msg);
    msg.style.position = "fixed";
    
    if (args) Gamelib.log("Arguments passed: " + args);
  }
  
  //Create and add the canvas.
  Gamelib.canvaselem = document.createElement("canvas");
  Gamelib.canvaselem.id = "gamecanvas";
  Gamelib.canvaselem.width = width ? width : 640;
  Gamelib.canvaselem.height = height ? height : 360;
  $("body").append(Gamelib.canvaselem);
  Gamelib.log("Created canvas and added to page");
  
  try { Gamelib.canvas = Gamelib.canvaselem.getContext('2d'); }
  catch (e) { Gamelib.log("Couldn't get canvas context: " + e); }
  
  $('body').append('<div id="resources" style="display: none;"></div>');
  if (Gamelib.LOADBAR) $('body').append('<div id="progressbar"><span class="loadstatus">\
      Loading progress</span> <progress id="progress" value="0" max="100"></progress></div>');
  
  Gamelib.log("Framerate is " + Gamelib.FPS + " Gamelib.FPS.");
  Gamelib.SW = Gamelib.canvaselem.width;
  Gamelib.SH = Gamelib.canvaselem.height;
  Gamelib.log("Game resolution is " + Gamelib.SW + "x" + Gamelib.SH + " pixels.");
  
  Gamelib.INPUT = new Gamelib.Input();
  
  Gamelib.log('<br><span style="color: green"><b>Game start!</b></span>');
}


/** Game state object */
Gamelib.State = function(name) {
  //TODO: state reset
  this.name = name;
  Gamelib.STATES[this.name] = this;
  var startedloading = false;
  this.loaded = false;
  this.paused = false;
  this.time = 0;
  this.vars = [];  //Some free place to go crazy with internal variables

  this.requiredResources = [];
  this.optionalResources = [];
  this.loadscreen = Gamelib.drawLoadingScreen;  //Define loading screen function
  this.loadscreenRendered = false;  //Loading screen already rendered.
  
  this.reset = function() {
    //TODO: make state resetter (but how...?)
  }
  
  /** Verify if all required resources have been loaded **/
  this.verifyResources = function() {
    var res = this.requiredResources;

    //First, actually load the resources if they aren't yet. Do this just once.
    if (!startedloading) {
      for (var i = 0; i < res.length; i++) {
        new Gamelib.Resource(res[i]);
        startedloading = true;
        Gamelib.log("Started loading resource: " + res[i]);
      }
    }
    //Now get detecting whether all resources are loaded yet.
    for (var i = 0; i < res.length; i++) {
      if (Gamelib.RES[this.requiredResources[i]] == undefined) {
        //Gamelib.log("Resource amount: " + Gamelib.RES.length);
        return false;
      }
    }
    Gamelib.log(this + ": All requested resources loaded.");
    Gamelib.canvas.fillStyle = "white";
    Gamelib.canvas.fillRect(0, 0, Gamelib.SW, Gamelib.SH);
    return true;
  }

  /** State loop & resources loaded check **/
  this.loop = function() {
    if (this.loaded && !this.paused) {
      this.update();
      this.render();
      this.time++;
    }

    //State didn't report it was loaded, so resources have to load first
    else if (!this.loaded) {
      this.loaded = this.verifyResources();
      //this.paused = this.loaded;
      //Gamelib.log(this.loaded);
      
      if (!this.loadscreenRendered) {  //Draw the "Loading..." screen just once.
        this.loadscreen();
        this.loadscreenRendered = true;
      }
    }
  }

  //Start looping this state.
  this.start = function() {
    Gamelib.log("<b>State switch: from " + Gamelib.STATE + " to " + this + "</b>");
    if (Gamelib.STATE) Gamelib.STATE.paused = true;
    Gamelib.STATE = this;
    if (this.time == 0) this.onstart();
    setInterval('Gamelib.STATES["' + this.name + '"].loop();', 1000/Gamelib.FPS);
  }

  /** Queues the resources to load that this state requires. **/
  //NOTE: make absolutely sure that your resource is loaded at least one update before you
  //use it or the resource will not be loaded yet!
  this.loadResources = function(res) {
    if (Gamelib.LOADBAR) $('#progress').attr("max", res.length);
    startedloading = false;
    for (var i = 0; i < res.length; i++) this.requiredResources.push(res[i]);
    this.loaded = false;
  }

  this.onstart = function() { } //Ran once when the state starts.
  this.update = function() { }
  this.render = function() { }
  
  this.toString = function() { return this.name; }
}


/** Game resource, like sound, an image, etcetera. Type should be auto-determined. **/
Gamelib.Resource = function(filename) {
  var ready = false;  //Will turn true when loaded.
  this.ready = ready;
  this.data = undefined;  //Will contain the actual data (like an Image or Audio instance).
  this.type = 'none';
  this.filename = filename;
  this.defaultpath = "res/";
  
  this.setDefaultPath = function(str) {
    if (str[str.length-1] != "/") {
      str += "/";
    }
    this.defaultpath = str;
    Gamelib.log("Default resource path changed to " + str + ".");
  }
  
  switch (filename.slice(-3)) {
    case "ogg": case "mp3":
      var a = document.createElement('audio');
      a.src = this.defaultpath + filename;
      a.id = filename;
      $('#resources').append(a);
      a.addEventListener("loadeddata", function() {
        ready = true;
        Gamelib.RES[filename] = this;
        if (Gamelib.LOADBAR) {
          $('#progress').attr("value", $('#progress').attr("value")+1);
        }
        Gamelib.log("file: loaded sound " + filename);
      }, true);
      
      a.onerror = function(e) {
        Gamelib.log('<span class="red">WARNING: failed loading ' + this.defaultpath +
                filename + '. Replacing with placeholder.</span>');
        a.src = this.defaultpath + "placeholder.ogg";
        ready = true;
        Gamelib.RES[filename] = this;
        if (Gamelib.LOADBAR) {
          $('#progress').attr("value", $('#progress').attr("value")+1);
        }
      }
    break;
    
    case "png": case "jpg":
      var a = new Image();
      a.src = this.defaultpath + filename;
      Gamelib.log("File path: " + a.src);
      $(a).load(function() {
        ready = true;
        Gamelib.RES[filename] = this;
        if (Gamelib.LOADBAR) {
          $('#progress').attr("value", $('#progress').attr("value")+1);
        }
        Gamelib.log("file: loaded image " + filename);
      });
    break;
      

    //Other file types
    default:
      //TODO: default file type resource loading?
      //TODO: load videos
    break;
  }
}


Gamelib.drawLoadingScreen = function() {
  Gamelib.canvas.fillStyle = "rgba(0,0,0,0.5)";
  Gamelib.canvas.fillRect(0,0,Gamelib.SW,Gamelib.SH);

  Gamelib.canvas.font = '30px sans-serif';
  Gamelib.canvas.fillStyle = "black";
  var textsize = Gamelib.canvas.measureText("Loading...");
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2, Gamelib.SH/2-11);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2, Gamelib.SH/2-9);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2-1, Gamelib.SH/2-10);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2+1, Gamelib.SH/2-10);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2-1, Gamelib.SH/2-11);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2-1, Gamelib.SH/2-9);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2+1, Gamelib.SH/2-11);
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2+1, Gamelib.SH/2-9);

  Gamelib.canvas.fillStyle = "white";
  var textsize = Gamelib.canvas.measureText("Loading...");
  Gamelib.canvas.fillText("Loading...", (Gamelib.SW-textsize.width)/2, Gamelib.SH/2-10);
  Gamelib.canvas.font = '12px sans-serif';
}



/** Input handler. DO NOT USE THIS DIRECTLY! Use the Gamelib.INPUT instance instead. **/
Gamelib.Input = function() {
  var mouseX = 0;
  var mouseY = 0;
  
  //Bind input to events
  /** Keyboard **/
  $(document).keydown(function(e) {
    if (!Gamelib.KEYSPRESSED[e.which]) {
      Gamelib.KEYSPRESSED[e.which] = true;
      Gamelib.log("input: key " + e.which + " pressed.");
      
      //Prevent *some* default keys like tab
      switch (e.which) {
        case 9:
          e.preventDefault();
      }
    }
  });
  
  $(document).keyup(function(e) {
    Gamelib.log("input: key " + e.which + " released.");
    Gamelib.KEYSPRESSED[e.which] = false;
  });
  
  
  /** Mouse **/
  $("#gamecanvas").bind("contextmenu",function(e){
    return false;
  });
  
  $("#gamecanvas").mousemove(function(e) {
    mouseX = e.pageX - this.offsetLeft;
    mouseY = e.pageY - this.offsetTop;
  });
  
  $("#gamecanvas").mousedown(function(e) {
    $("#gamecanvas").focus();
    Gamelib.log("input: clicked mouse btn " + e.which + " on point " + mouseX + "," + mouseY + " on canvas.");
    Gamelib.MOUSEPRESSED[e.which] = true; //1 = left button; 2 =  middle; 3 = right
  });
  
  $("#gamecanvas").mouseup(function(e) {
    Gamelib.log("input: released mouse btn " + e.which + " on point " + mouseX + "," + mouseY + " on canvas.");
    Gamelib.MOUSEPRESSED[e.which] = false; //1 = left button; 2 =  middle; 3 = right
  });
  
  Gamelib.log("input: bound keyboard and mouse events.");
  
  
  this.getMouseX = function() {
    return mouseX;
  }
  
  this.getMouseY = function() {
    return mouseY;
  }
  
  this.isMouseButtonPressed = function(btn) {
    return Gamelib.MOUSEPRESSED[btn];
  }
  
  /** Convenience function for the most common keys. **/
  this.isKeyPressed = function(key) {
    switch(key) {
      case "left": return Gamelib.KEYSPRESSED[37]; break;
      case "right": return Gamelib.KEYSPRESSED[39]; break;
      case "up": return Gamelib.KEYSPRESSED[38]; break;
      case "down": return Gamelib.KEYSPRESSED[40]; break;
      case "space": return Gamelib.KEYSPRESSED[32]; break;
      case "enter": return Gamelib.KEYSPRESSED[13]; break;
      case "shift": return Gamelib.KEYSPRESSED[16]; break;
      case "ctrl": case "control": return Gamelib.KEYSPRESSED[17]; break;
      case "W": return Gamelib.KEYSPRESSED[87]; break;
      case "A": return Gamelib.KEYSPRESSED[65]; break;
      case "S": return Gamelib.KEYSPRESSED[83]; break;
      case "D": return Gamelib.KEYSPRESSED[68]; break;
      default: return Gamelib.KEYSPRESSED[key];  //Just use the keycode otherwise
    }
  }
}
