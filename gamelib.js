/** Tengu HTML5 GameLib
 * By Tengu Dev
 * http://tengudev.com/
 *
 * Coding: Vincent Beers (DaVince) <VincentBeers@gmail.com>
 * 
 * Licensed under the New BSD License (see gamelib-license.txt).
 * 
 **/

/** Globals **/
var canvas = undefined;
var STATE = undefined;//Current state
var STATES = [];     //Contains all states.
var RES = [];        //Contains all loaded resources.
  //RES["filename"].tagName: get the tag name so we know the type of resource.
var FPS = 30;
var ARGS = "";
var SW = undefined;  //Screen width
var SH = undefined;  //Screen height

var LOADBAR = false; //Show loading bar
var DEBUG = false;

var INPUT = undefined;
var KEYSPRESSED = []; //An array of all keycodes that currently have "keydown" on them.
var MOUSEPRESSED = [];


/** It Begins **/
function Main(args) {
  if (args) {
    ARGS = args;
    if (args.search("debug") != -1) DEBUG = true; 
    if (args.search("progressbar") != -1) LOADBAR = true;
  }
  
  canvas = document.getElementById('gamecanvas').getContext('2d');
  $('body').append('<div id="resources" style="display: none;"></div>');
  if (LOADBAR) $('body').append('<span class="loadstatus">Loading progress</span> <progress id="progress" value="0" max="100"></progress>');
  
  if (DEBUG) {
    $('body').append('<div id="messages"><h1>Message log</h1></div>');
    $('#messages').css("height", "200px");
    $('#messages').css("border", "1px dotted black");
    $('#messages').css("display", "block");
    $('#messages').css("margin-top", "1em");
    $('#messages h1').css("font-size", "large");
    $('h1').css("padding", "0");
    $('#messages').css("overflow", "auto");
    if (args) Log("Arguments passed: " + args);
  }
  
  Log("Framerate is " + FPS + " FPS.");
  SW = document.getElementById('gamecanvas').width;
  SH = document.getElementById('gamecanvas').height;
  Log("Game resolution is " + SW + "x" + SH + " pixels.");
  
  INPUT = new Input();
  
  Log('<br><span style="color: green"><b>Game start!</b></span>');
  Game();
}


/** Game state fuction */
function State(name) {
  //TODO: state reset
  //TODO: find an easy way to juggle and maintain events throughout the game.
  this.name = name;
  STATES[this.name] = this;
  var startedloading = false;
  this.loaded = false;
  this.paused = false;
  this.time = 0;
  this.vars = [];  //Some free place to go crazy with internal variables

  this.requiredResources = [];
  this.optionalResources = [];
  this.loadscreenRendered = false;  //Loading screen already rendered.


  /** Constantly verify if all resources have been loaded **/
  this.verifyResources = function() {
    var res = this.requiredResources ? this.requiredResources : [];

    //First, actually load the resources if they aren't yet. Do this just once.
    if (!startedloading) {
      for (var i = 0; i < res.length; i++) {
        new Resource(res[i]);
        startedloading = true;
      }
    }
    //Now get detecting whether all resources are loaded yet.
    for (var i = 0; i < res.length; i++) {
      //If the loop isn't passed, retest it next loop until it is.
      if (RES[this.requiredResources[i]] == undefined)
        return false;
    }
    Log(this + ": All requested resources loaded.");
    canvas.fillStyle = "white";
    canvas.fillRect(0, 0, SW, SH);
    return true;
  }


  /** State loop **/
  this.loop = function() {
    if (this.loaded && !this.paused) {
      this.update();
      this.render();
      this.time++;
    }

    //State didn't report it was loaded, so resources have to load first
    else if (!this.loaded) {
      this.loaded = this.verifyResources();
      if (!this.loadscreenRendered) {  //Draw the "Loading..." screen just once.
        DrawLoadingScreen();
        this.loadscreenRendered = true;
      }
    }
    //setTimeout('STATES["' + this.name + '"].loop();', 1000/FPS);
    
  }

  //Start looping this state.
  this.start = function() {
    Log("<b>State switch: from " + STATE + " to " + this + "</b>");
    if (STATE) STATE.paused = true;
    STATE = this;
    setInterval('STATES["' + this.name + '"].loop();', 1000/FPS);
  }

  /** State requires new resources to load. **/
  //NOTE: make absolutely sure that your resource is loaded at least one update before you use it
  //or the resource will not be loaded yet!
  this.loadResources = function(res) {
    if (LOADBAR) $('#progress').attr("max", res.length);
    startedloading = false;
    this.requiredResources = res;
    this.loaded = false;
  }

  this.update = function() {
    Log('<span class="red"><b>Game halted.</b> Please override the STATES["' + this
      + '"].update() and .render() functions to use this state.</span>');
    this.paused = true;
  }
  this.render = function() { }
  
  this.toString = function() { return this.name; }
}


/** Game resource, like sound, an image, etcetera. Type should be auto-determined. **/
function Resource(filename) {
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
    Log("Default resource path changed to " + str + ".");
  }
  
  switch (filename.slice(filename.length-3)) {
    case "ogg": case "mp3":
      var a = document.createElement('audio');
      a.src = this.defaultpath + filename;
      a.id = filename;
      $('#resources').append(a);
      a.addEventListener("loadeddata", function() {
        ready = true;
        RES[filename] = this;
        if (LOADBAR) {
          $('#progress').attr("value", $('#progress').attr("value")+1);
        }
        Log("file: loaded sound " + filename);
      }, true);
      
      a.onerror = function(e) {
        Log('<span class="red">WARNING: failed loading ' + filename + '. Replacing with placeholder.</span>');
        a.src = this.defaultpath + "placeholder.ogg";
        ready = true;
        RES[filename] = this;
        if (LOADBAR) {
          $('#progress').attr("value", $('#progress').attr("value")+1);
        }
      }
    break;
    
    case "png": case "jpg":
      var a = new Image();
      a.src = this.defaultpath + filename;
      $(a).load(function() {
        ready = true;
        RES[filename] = this;
        if (LOADBAR) {
          $('#progress').attr("value", $('#progress').attr("value")+1);
        }
        Log("file: loaded image " + filename);
      });
    break;
      

    //Other file types
    default:
      //TODO: default file type resource loading?
      //TODO: load videos
    break;
  }
}


function DrawLoadingScreen() {
  canvas.fillStyle = "rgba(0,0,0,0.5)";
  canvas.fillRect(0,0,SW,SH);

  canvas.font = '30px sans-serif';
  canvas.fillStyle = "black";
  var textsize = canvas.measureText("Loading...");
  canvas.fillText("Loading...", (SW-textsize.width)/2, SH/2-11);
  canvas.fillText("Loading...", (SW-textsize.width)/2, SH/2-9);
  canvas.fillText("Loading...", (SW-textsize.width)/2-1, SH/2-10);
  canvas.fillText("Loading...", (SW-textsize.width)/2+1, SH/2-10);
  canvas.fillText("Loading...", (SW-textsize.width)/2-1, SH/2-11);
  canvas.fillText("Loading...", (SW-textsize.width)/2-1, SH/2-9);
  canvas.fillText("Loading...", (SW-textsize.width)/2+1, SH/2-11);
  canvas.fillText("Loading...", (SW-textsize.width)/2+1, SH/2-9);

  canvas.fillStyle = "white";
  var textsize = canvas.measureText("Loading...");
  canvas.fillText("Loading...", (SW-textsize.width)/2, SH/2-10);
  canvas.font = '12px sans-serif';
}


function Log(msg) {
  if (DEBUG)
    $('#messages').append(msg + "<br>");
    $("#messages").scrollTop($("#messages").scrollTop() + 100);
}



function Input() {
  var mouseX = 0;
  var mouseY = 0;
  
  //Bind input to events
  /** Keyboard **/
  $(document).keydown(function(e) {
    if (!KEYSPRESSED[e.which]) {
      KEYSPRESSED[e.which] = true;
      Log("input: key " + e.which + " pressed.");
      
      //Prevent *some* default keys like tab
      switch (e.which) {
        case 9:
          e.preventDefault();
      }
    }
  });
  
  $(document).keyup(function(e) {
    Log("input: key " + e.which + " released.");
    KEYSPRESSED[e.which] = false;
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
    Log("input: clicked mouse btn " + e.which + " on point " + mouseX + "," + mouseY + " on canvas.");
    MOUSEPRESSED[e.which] = true; //1 = left button; 2 =  middle; 3 = right
  });
  
  $("#gamecanvas").mouseup(function(e) {
    Log("input: released mouse btn " + e.which + " on point " + mouseX + "," + mouseY + " on canvas.");
    MOUSEPRESSED[e.which] = false; //1 = left button; 2 =  middle; 3 = right
  });
  
  Log("input: bound keyboard and mouse events.");
  
  
  this.getMouseX = function() {
    return mouseX;
  }
  
  this.getMouseY = function() {
    return mouseY;
  }
  
  this.isMouseButtonPressed = function(btn) {
    return MOUSEPRESSED[btn];
  }
  
  /** Convenience function for the most common keys. **/
  this.isKeyPressed = function(key) {
    switch(key) {
      case "left": return KEYSPRESSED[37]; break;
      case "right": return KEYSPRESSED[39]; break;
      case "up": return KEYSPRESSED[38]; break;
      case "down": return KEYSPRESSED[40]; break;
      case "space": return KEYSPRESSED[32]; break;
      case "enter": return KEYSPRESSED[13]; break;
      case "shift": return KEYSPRESSED[16]; break;
      case "ctrl": case "control": return KEYSPRESSED[17]; break;
      case "W": return KEYSPRESSED[87]; break;
      case "A": return KEYSPRESSED[65]; break;
      case "S": return KEYSPRESSED[83]; break;
      case "D": return KEYSPRESSED[68]; break;
      default: return KEYSPRESSED[key];  //Just use the keycode otherwise
    }
  }
}
