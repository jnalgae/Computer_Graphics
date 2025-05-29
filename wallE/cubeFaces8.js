// from https://imagine.inrialpes.fr/people/Francois.Faure/htmlCourses/WebGL/IntroMeshes.html
/// Cube with one color per vertex

function CubeFaces8() {
  // Vertex positions
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  var vertices = [
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0,
    -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  this.vertexBuffer.itemSize = 3;
  this.vertexBuffer.numItems = 8;

  // Vertex colors
  this.colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
  var colors = [
    0.0,
    0.0,
    0.0,
    1.0, // black
    1.0,
    0.0,
    0.0,
    1.0, // red
    1.0,
    1.0,
    0.0,
    1.0, // yellow
    0.0,
    1.0,
    0.0,
    1.0, // green
    0.0,
    0.0,
    1.0,
    1.0, // blue
    1.0,
    0.0,
    1.0,
    1.0, // magenta
    1.0,
    1.0,
    1.0,
    1.0, // white
    0.0,
    1.0,
    1.0,
    1.0, // cyan
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  this.colorBuffer.itemSize = 4;
  this.colorBuffer.numItems = 8;

  // Triangles
  this.triangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
  var tri = [
    0,
    2,
    1,
    0,
    3,
    2, // Z-
    0,
    1,
    5,
    0,
    5,
    4, // Y-
    1,
    2,
    6,
    1,
    6,
    5, // X+
    2,
    7,
    6,
    2,
    3,
    7, // Y+
    3,
    4,
    7,
    3,
    0,
    4, // X-
    4,
    5,
    6,
    4,
    6,
    7, // Z+
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tri), gl.STATIC_DRAW);
  this.triangles.numItems = 36;
}

CubeFaces8.prototype.draw = function (shaderPgm) {
  console.log("cube8 drawn");

  // Vertex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.vertexAttribPointer(
    shaderPgm.vertexPositionAttribute,
    this.vertexBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // Vertex colors
  gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
  gl.vertexAttribPointer(
    shaderPgm.vertexColorAttribute,
    this.colorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  // Draw elements
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
  gl.drawElements(gl.TRIANGLES, this.triangles.numItems, gl.UNSIGNED_SHORT, 0);
};
