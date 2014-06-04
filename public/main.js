var debug = true;

var canvas;
var messageBox;
var optionsBox;
var debugBox;

var gl;

// Object holding data for the main shader program.
// Add further objects if you need multiple shaders.
var shaderProgram = {};

var viewPort = {};

// Timing
// We need these to fix the framerate
var fps = 60;
var interval = 1000/fps;
var lastTime;

// Change this angle to rotate the entire viewport
var angle = 0;

// A few global lists for graphics primitives to quickly
// dump some debug output in.
var circles = [];
var polygons = [];
var lines = [];

window.onload = init;

function init()
{
    canvas = document.getElementById("gl-canvas");

    // This is the size we are rendering to
    viewPort.width = resolution;
    viewPort.height = resolution;
    // This is the actual extent of the canvas on the page
    canvas.style.width = viewPort.width;
    canvas.style.height = viewPort.height;
    // This is the resolution of the canvas (which will be scaled to the extent, using some rather primitive anti-aliasing techniques)
    canvas.width = viewPort.width;
    canvas.height = viewPort.height;

    // By attaching the event to document we can control the cursor from
    // anywhere on the page and can even drag off the browser window.
    document.addEventListener('mousedown', handleMouseDown, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('keypress', handleCharacterInput, false);

    messageBox = $('#message');
    optionsBox = $('#options');
    debugBox = $('#debug');

    if (!debug)
        renderInstructions();

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        messageBox.html("WebGL is not available!");
    } else {
        messageBox.html("WebGL up and running!");
    }

    renderMenu();

    gl.clearColor(1, 1, 1, 1);

    // Load shaders and get uniform locations
    shaderProgram.program = InitShaders(gl, "2d-vertex-shader", "minimal-fragment-shader");
    // add uniform locations
    shaderProgram.uRenderScale = gl.getUniformLocation(shaderProgram.program, "uRenderScale");
    shaderProgram.uViewPortAngle = gl.getUniformLocation(shaderProgram.program, "uViewPortAngle");
    shaderProgram.uCenter = gl.getUniformLocation(shaderProgram.program, "uCenter");
    shaderProgram.uColor = gl.getUniformLocation(shaderProgram.program, "uColor");
    shaderProgram.uScale = gl.getUniformLocation(shaderProgram.program, "uScale");
    shaderProgram.uAngle = gl.getUniformLocation(shaderProgram.program, "uAngle");
    // add attribute locations
    shaderProgram.aPos = gl.getAttribLocation(shaderProgram.program, "aPos");

    // fill uniforms that are already known
    gl.useProgram(shaderProgram.program);
    gl.uniform1f(shaderProgram.uRenderScale, renderScale);
    gl.uniform1f(shaderProgram.uViewPortAngle, angle);

    gl.useProgram(null);

    prepareCircles();

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    CheckError();

    // Set up a bit of geometry to render

    var i;
    for (i = 0; i < 11; ++i)
        circles.push(new Circle(-0.5 + 0.1*i, 0, colorGenerator.next(true), markerRadius));

    var points = [];
    for (i = 0; i < 5; ++i)
        points.push({
            x: 0.7*cos(2*pi/5*i),
            y: 0.7*sin(2*pi/5*i),
        });
    polygons.push(new ConvexPolygon(points));

    polygons.push(ConvexPolygon.CreateArrow(0.1, 0.05, {x:-0.7, y:0}, {x:1,y:0}));
    polygons.push(ConvexPolygon.CreateArrow(0.1, 0.05, {x:0.73, y:0}, {x:1,y:0}));

    lines.push(new Line({x: -0.5, y: 0.15}, {x: 0.5, y: 0.15}, 'white', lineThickness));
    lines.push(new Line({x: -0.5, y: -0.15}, {x: 0.5, y: -0.15}, 'white', lineThickness));

    drawScreen();
    lastTime = Date.now();
    update();
}

// This will be added to the right sidebar, if the debug flag is not set.
// (i.e. it will replace the debug output of cursor coordinates.)
function renderInstructions()
{
    debugBox.html('How to play:<br><br>' +
                  'Add your instructions here');
}

// This is always rendered in the left sidebar.
function renderMenu()
{
    // Add your menu's HTML here.
    optionsBox.html('Add <a>your menu</a> here');

    // Then set up some 'change' or 'click' or 'blur' handlers with
    // jQuery here.
}

// I'm pretty sure I ripped this code off someone else initially, but I
// can't remember the source. Sorry.
function InitShaders(gl, vertexShaderId, fragmentShaderId)
{
    var vertexShader;
    var fragmentShader;

    var vertexElement = document.getElementById(vertexShaderId);
    if(!vertexElement)
    {
        messageBox.html("Unable to load vertex shader '" + vertexShaderId + "'");
        return -1;
    }
    else
    {
        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexElement.text);
        gl.compileShader(vertexShader);
        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        {
            messageBox.html("Vertex shader '" + vertexShaderId + "' failed to compile. The error log is:</br>" + gl.getShaderInfoLog(vertexShader));
            return -1;
        }
    }

    var fragmentElement = document.getElementById(fragmentShaderId);
    if(!fragmentElement)
    {
        messageBox.html("Unable to load fragment shader '" + fragmentShaderId + "'");
        return -1;
    }
    else
    {
        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentElement.text);
        gl.compileShader(fragmentShader);
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        {
            messageBox.html("Fragment shader '" + fragmentShaderId + "' failed to compile. The error log is:</br>" + gl.getShaderInfoLog(fragmentShader));
            return -1;
        }
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        messageBox.html("Shader program failed to link. The error log is:</br>" + gl.getProgramInfoLog(program));
        return -1;
    }

    return program;
}

// This is a fixed-framerate game loop. dT is not constant, though. (It may be
// any integer multiple of the target frame duration.)
function update()
{
    window.requestAnimFrame(update, canvas);

    currentTime = Date.now();
    var dTime = currentTime - lastTime;

    if (dTime > interval)
    {
        // The modulo is to take care of the case that we skipped a frame
        lastTime = currentTime - (dTime % interval);

        var steps = floor(dTime / interval);

        dTime = steps * interval / 1000; // Now dTime is in seconds

        /* Update state using dTime */

        drawScreen();
    }
}

function drawScreen()
{
    var i;

    gl.enable(gl.BLEND);

    gl.viewport(0, 0, viewPort.width, viewPort.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram.program);
    gl.uniform1f(shaderProgram.uViewPortAngle, angle);

    // add rendering of your game objects/scene graph here

    for (i = 0; i < polygons.length; ++i)
    {
        polygons[i].render();
        polygons[i].render(true);
    }

    for (i = 0; i < lines.length; ++i)
        lines[i].render();

    for (i = 0; i < circles.length; ++i)
        circles[i].render();

    gl.useProgram(null);

    gl.disable(gl.BLEND);
}

function handleMouseMove(event) {
    var rect = canvas.getBoundingClientRect();
    var coords = normaliseCursorCoordinates(event, rect);

    if (debug)
    {
        debugBox.find('#xcoord').html(coords.x);
        debugBox.find('#ycoord').html(coords.y);
    }
}

function handleMouseDown(event) {
    var rect = canvas.getBoundingClientRect();
    var coords = normaliseCursorCoordinates(event, rect);

    if (coords.x < -maxCoord || coords.x > maxCoord || coords.y < -maxCoord || coords.y > maxCoord)
        return;

    if (debug)
    {
        debugBox.find('#xdown').html(coords.x);
        debugBox.find('#ydown').html(coords.y);
    }

    mouseDown = true;
}

function handleMouseUp(event) {
    var rect = canvas.getBoundingClientRect();
    var coords = normaliseCursorCoordinates(event, rect);

    if (debug)
    {
        debugBox.find('#xup').html(coords.x);
        debugBox.find('#yup').html(coords.y);
    }

    mouseDown = false;
}

function handleCharacterInput(event) {
    var character = String.fromCharCode(event.charCode);

    switch (character)
    {
    /* do stuff */
    }
}

// Takes the mouse event and the rectangle to normalise for
// Outputs object with x, y coordinates in [-maxCoord,maxCoord] with positive
// y pointing upwards.
// It also accounts for the rotation of the grid.
function normaliseCursorCoordinates(event, rect)
{
    var x = (2*(event.clientX - rect.left) / resolution - 1) / renderScale;
    var y = (1 - 2*(event.clientY - rect.top) / resolution) / renderScale; // invert, to make positive y point upwards
    return {
        x:  x*cos(angle) + y*sin(angle),
        y: -x*sin(angle) + y*cos(angle)
    };
}

function CheckError(msg)
{
    var error = gl.getError();
    if (error !== 0)
    {
        var errMsg = "OpenGL error: " + error.toString(16);
        if (msg) { errMsg = msg + "</br>" + errMsg; }
        messageBox.html(errMsg);
    }
}

