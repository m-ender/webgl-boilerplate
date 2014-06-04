// Set up vertices for a unit circle
var segments = 50;

var circleCoords = [ 0, 0 ];

for (var i = 0; i <= segments; ++i)
{
    var angle = i*2*pi/segments;
    circleCoords.push(cos(angle));
    circleCoords.push(sin(angle));
}

var circleVertices = {};

// Make sure to call this before trying to render a circle
function prepareCircles()
{
    circleVertices = {};
    circleVertices.data = new Float32Array(circleCoords);

    circleVertices.bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertices.bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices.data, gl.STATIC_DRAW);
}

// The first two parameters are the coordinates of the circle's center.
// The color is optional (default black).
// The scale is optional, the default is 1.
function Circle(x, y, color, scale)
{
    this.hidden = false;

    this.x = x;
    this.y = y;

    this.color = color || 'black';

    if (!(this.color instanceof jQuery.Color))
        this.color = jQuery.Color(this.color);

    this.scale = (scale === undefined) ? 1 : scale;
    this.baseScale = this.scale;
}

// Convenient setters
Circle.prototype.move = function(x, y) {
    this.x = x;
    this.y = y;
};

// scale should be relative to the this.baseScale (i.e., pass
// in 1 to resize to base scale; 1 is also the default).
Circle.prototype.resize = function(scale) {
    if (scale === undefined) scale = 1;
    this.scale = this.baseScale * scale;
};

Circle.prototype.hide = function() { this.hidden = true; };
Circle.prototype.show = function() { this.hidden = false; };

// Outline can optionally be set to true to render ... well ...
// only an outline.
Circle.prototype.render = function(outline) {
    if (this.hidden) return;

    gl.useProgram(shaderProgram.program);

    gl.uniform2f(shaderProgram.uCenter, this.x, this.y);
    gl.uniform1f(shaderProgram.uScale, this.scale);
    gl.uniform1f(shaderProgram.uAngle, 0);

    gl.enableVertexAttribArray(shaderProgram.aPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertices.bufferId);
    gl.vertexAttribPointer(shaderProgram.aPos, 2, gl.FLOAT, false, 0, 0);

    if (outline)
    {
        gl.uniform4f(shaderProgram.uColor,
                     0,
                     0,
                     0,
                     1);

        gl.drawArrays(gl.LINE_LOOP, 1, segments);
    }
    else
    {
        gl.uniform4f(shaderProgram.uColor,
                     this.color.red()/255,
                     this.color.green()/255,
                     this.color.blue()/255,
                     1);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
    }

    gl.disableVertexAttribArray(shaderProgram.aPos);
};