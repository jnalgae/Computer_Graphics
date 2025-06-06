"use strict";

let canvas, gl, program;
let modelViewMatrix, projectionMatrix, modelViewMatrixLoc, projectionMatrixLoc;
let pointsArray = [],
  normalsArray = [],
  cylinderArray = [],
  innerCylinderArray = [],
  clawArray = [],
  pupilArray = [],
  treadArray = [];

let torsoId = 0,
  neckId = 1,
  headId = 2;
let eyeLeftOuterId = 3,
  eyeLeftInnerId = 4,
  eyeLeftPupilId = 5;
let eyeRightOuterId = 6,
  eyeRightInnerId = 7,
  eyeRightPupilId = 8;
let leftTreadId = 9,
  rightThreadId = 10;
let shoulder1Id = 11,
  arm1Id = 12,
  wrist1Id = 13,
  hand1Id = 14,
  claw1_1Id = 15,
  claw1_2Id = 16;
let shoulder2Id = 17,
  arm2Id = 18,
  wrist2Id = 19,
  hand2Id = 20,
  claw2_1Id = 21,
  claw2_2Id = 22;
let numNodes = 23;

let figure = new Array(numNodes);
let theta = new Array(numNodes).fill(0);
let stack = [];

let _eye = [0, 0, 20],
  at = [0, 0, 0],
  up = [0, 1, 0];
let fovy = 45,
  aspect = 1,
  near = 0.1,
  far = 1000;

let colorLoc;

let batteryLowColor = false;

let trashPosition = vec3(7.0, 4.0, 0.0); // the first position of trash
let trashCanPosition = vec3(6.2, -5.0, 0.0); // the first position of trash can
let chargingPos = vec3(-6.3, -4.6, 0.0);
let isDragging = false;
let dragOffset = vec2(0, 0);

function rgbToVec4(r, g, b, a = 1.0) {
  return vec4(r / 255, g / 255, b / 255, a);
}

// ** Coloring Part ** //
// color reference: https://keiwando.com/color-picker/
let colors = {
  torso: rgbToVec4(248, 175, 58),
  neck: rgbToVec4(128, 77, 26),
  head: rgbToVec4(117, 117, 116),
  eye: rgbToVec4(89, 83, 73),
  eyeInner: rgbToVec4(255, 255, 255),
  shoulder: rgbToVec4(117, 117, 116),
  arm: rgbToVec4(248, 175, 58),
  wrist: rgbToVec4(153, 153, 153),
  hand: rgbToVec4(117, 117, 116),
  claw: rgbToVec4(102, 102, 102),
  tread: rgbToVec4(102, 102, 102),
};

// ** Geometry Generation Part ** //
/**
 * Define cube vertices
 * - it will be used to construct neck, shouler, arm, wrist, torso
 */
let vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0),
];

function quad(a, b, c, d) {
  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = normalize(cross(t1, t2));

  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  pointsArray.push(vertices[b]);
  normalsArray.push(normal);
  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  pointsArray.push(vertices[d]);
  normalsArray.push(normal);
}

function generatecube() {
  pointsArray = [];
  normalsArray = [];
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

var texCoordsArray = [];
var colorsArray = [];

var texCoord = [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)];
var vertexColors = [
  vec4(1.0, 0.0, 0.0, 1.0),
  vec4(0.0, 1.0, 0.0, 1.0),
  vec4(0.0, 0.0, 1.0, 1.0),
  vec4(1.0, 1.0, 0.0, 1.0),
  vec4(1.0, 0.0, 1.0, 1.0),
  vec4(0.0, 1.0, 1.0, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(1.0, 1.0, 1.0, 1.0),
];

function texQuad(a, b, c, d) {
  pointsArray.push(vertices[a]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[b]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[1]);

  pointsArray.push(vertices[c]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[a]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[c]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[d]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[3]);
}

let texturedCubePoints = [],
  texturedCubeTexCoords = [];

let texturedCubeNormalsArray = [];

function generateTexturedCube() {
  texturedCubePoints = [];
  texturedCubeTexCoords = [];
  texturedCubeNormalsArray = [];

  function texQuad(a, b, c, d) {
    let t1 = subtract(vertices[b], vertices[a]);
    let t2 = subtract(vertices[c], vertices[b]);
    let normal = normalize(cross(t1, t2));

    for (let i = 0; i < 6; i++) {
      texturedCubeNormalsArray.push(normal);
    }

    texturedCubePoints.push(vertices[a]);
    texturedCubeTexCoords.push(texCoord[0]);
    texturedCubePoints.push(vertices[b]);
    texturedCubeTexCoords.push(texCoord[1]);
    texturedCubePoints.push(vertices[c]);
    texturedCubeTexCoords.push(texCoord[2]);
    texturedCubePoints.push(vertices[a]);
    texturedCubeTexCoords.push(texCoord[0]);
    texturedCubePoints.push(vertices[c]);
    texturedCubeTexCoords.push(texCoord[2]);
    texturedCubePoints.push(vertices[d]);
    texturedCubeTexCoords.push(texCoord[3]);
  }

  texQuad(1, 0, 3, 2);
  texQuad(2, 3, 7, 6);
  texQuad(3, 0, 4, 7);
  texQuad(6, 5, 1, 2);
  texQuad(4, 5, 6, 7);
  texQuad(5, 4, 0, 1);
}

/**
 * Define a cylinder
 * it will be used to construct outer eyes, inner eyes, treads
 * - Top face: a triangle fan centered at (0, +height/2, 0)
 * - Botton face: another triangle fan centered at (0, -height/2, 0)
 * - Side surface: consecutive triangles
 * - theta: (i / segments) * 2 * Math.PI
 *      (if i = 1, segments = 20: theta = 1/20 * 2 * PI = 18 degrees)
 */
let cylinderNormals = [],
  cylinderTexCoords = [];
let innerCylinderNormals = [],
  innerCylinderTexCoords = [];
let treadNormals = [],
  treadTexCoords = [];

function generateCylinder(
  targetArray,
  normalArray,
  texCoordArray,
  radius = 0.5,
  height = 1.0,
  segments = 20
) {
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const nextTheta = ((i + 1) / segments) * 2 * Math.PI;

    const x1 = radius * Math.cos(theta);
    const z1 = radius * Math.sin(theta);
    const x2 = radius * Math.cos(nextTheta);
    const z2 = radius * Math.sin(nextTheta);

    // Top face
    const topNormal = vec3(0, 1, 0);
    targetArray.push(vec4(0, height / 2, 0, 1.0));
    texCoordArray.push(vec2(0.5, 0.5));
    normalArray.push(topNormal);

    targetArray.push(vec4(x1, height / 2, z1, 1.0));
    texCoordArray.push(vec2(0.5 + x1 / radius / 2, 0.5 + z1 / radius / 2));
    normalArray.push(topNormal);

    targetArray.push(vec4(x2, height / 2, z2, 1.0));
    texCoordArray.push(vec2(0.5 + x2 / radius / 2, 0.5 + z2 / radius / 2));
    normalArray.push(topNormal);

    // Bottom face
    const bottomNormal = vec3(0, -1, 0);
    targetArray.push(vec4(0, -height / 2, 0, 1.0));
    texCoordArray.push(vec2(0.5, 0.5));
    normalArray.push(bottomNormal);

    targetArray.push(vec4(x2, -height / 2, z2, 1.0));
    texCoordArray.push(vec2(0.5 + x2 / radius / 2, 0.5 + z2 / radius / 2));
    normalArray.push(bottomNormal);

    targetArray.push(vec4(x1, -height / 2, z1, 1.0));
    texCoordArray.push(vec2(0.5 + x1 / radius / 2, 0.5 + z1 / radius / 2));
    normalArray.push(bottomNormal);

    // Side face - triangle 1
    const n1 = normalize(vec3(x1, 0, z1));
    const n2 = normalize(vec3(x2, 0, z2));

    targetArray.push(vec4(x1, height / 2, z1, 1.0));
    texCoordArray.push(vec2(i / segments, 1.0));
    normalArray.push(n1);

    targetArray.push(vec4(x1, -height / 2, z1, 1.0));
    texCoordArray.push(vec2(i / segments, 0.0));
    normalArray.push(n1);

    targetArray.push(vec4(x2, -height / 2, z2, 1.0));
    texCoordArray.push(vec2((i + 1) / segments, 0.0));
    normalArray.push(n2);

    // Side face - triangle 2
    targetArray.push(vec4(x1, height / 2, z1, 1.0));
    texCoordArray.push(vec2(i / segments, 1.0));
    normalArray.push(n1);

    targetArray.push(vec4(x2, -height / 2, z2, 1.0));
    texCoordArray.push(vec2((i + 1) / segments, 0.0));
    normalArray.push(n2);

    targetArray.push(vec4(x2, height / 2, z2, 1.0));
    texCoordArray.push(vec2((i + 1) / segments, 1.0));
    normalArray.push(n2);
  }
}

/**
 * Define a crescent shape
 * it will be used to construct claws
 * - similar to generateCylinder, but instead of a full 360° sweep,
 *   it uses a 180° range of theta to create a crescent shape
 */
function generateSemicircle(radius = 0.5, segments = 20, height = 0.1) {
  for (let i = 0; i < segments; i++) {
    let theta = (i / segments) * Math.PI; // 0 to π
    let nextTheta = ((i + 1) / segments) * Math.PI;

    let x1 = radius * Math.cos(theta);
    let y1 = radius * Math.sin(theta);
    let x2 = radius * Math.cos(nextTheta);
    let y2 = radius * Math.sin(nextTheta);

    // Top face
    clawArray.push(vec4(0, 0, height / 2, 1.0));
    clawArray.push(vec4(x1, y1, height / 2, 1.0));
    clawArray.push(vec4(x2, y2, height / 2, 1.0));

    // Bottom face
    clawArray.push(vec4(0, 0, -height / 2, 1.0));
    clawArray.push(vec4(x2, y2, -height / 2, 1.0));
    clawArray.push(vec4(x1, y1, -height / 2, 1.0));

    // Side face 1
    clawArray.push(vec4(x1, y1, height / 2, 1.0));
    clawArray.push(vec4(x1, y1, -height / 2, 1.0));
    clawArray.push(vec4(x2, y2, -height / 2, 1.0));

    // Side face 2
    clawArray.push(vec4(x1, y1, height / 2, 1.0));
    clawArray.push(vec4(x2, y2, -height / 2, 1.0));
    clawArray.push(vec4(x2, y2, height / 2, 1.0));
  }
}

/**
 * Define a circle
 * it will be used to construct pupils
 * - similar to generateCylinder, but only doesn't generate sides
 */
function generateCircle(radius = 0.5, segments = 20) {
  for (let i = 0; i < segments; i++) {
    let theta = (i / segments) * 2 * Math.PI;
    let nextTheta = ((i + 1) / segments) * 2 * Math.PI;

    let x1 = radius * Math.cos(theta);
    let y1 = radius * Math.sin(theta);
    let x2 = radius * Math.cos(nextTheta);
    let y2 = radius * Math.sin(nextTheta);

    pupilArray.push(vec4(0, 0, 0, 1.0));
    pupilArray.push(vec4(x1, y1, 0, 1.0));
    pupilArray.push(vec4(x2, y2, 0, 1.0));
  }
}

// ** Geometry Generation Part ** //
// define the rendering logic for each individual body part
// modify this to change the size of each body part

function torso() {
  gl.uniform1i(textureTypeLoc, 1);
  let instanceMatrix = mult(translate(0.0, 0.0, 0.0), scale4(3, 3, 2));
  let mvMatrix = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texturedCubePoints), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  if (batteryLowColor) {
    gl.uniform1i(textureTypeLoc, 0);
    gl.uniform1i(useTextureLoc, false);
    gl.disableVertexAttribArray(vTexCoord);
    gl.uniform4fv(colorLoc, flatten(vec4(0.3, 0.3, 0.3, 1.0)));
  } else {
    gl.uniform1i(textureTypeLoc, 1);
    gl.uniform1i(useTextureLoc, true);
    gl.uniform4fv(colorLoc, flatten(colors.torso));

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      flatten(texturedCubeTexCoords),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    flatten(texturedCubeNormalsArray),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  gl.drawArrays(gl.TRIANGLES, 0, texturedCubePoints.length);
}

function neck() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, true);
  gl.uniform4fv(colorLoc, flatten(colors.neck));
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texturedCubePoints), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  if (batteryLowColor) {
    gl.uniform1i(useTextureLoc, false);
    gl.disableVertexAttribArray(vTexCoord);
    gl.uniform4fv(colorLoc, flatten(vec4(0.3, 0.3, 0.3, 1.0)));
  } else {
    gl.uniform1i(useTextureLoc, true);
    gl.uniform4fv(colorLoc, flatten(colors.torso));

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      flatten(texturedCubeTexCoords),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    flatten(texturedCubeTexCoords),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);
  let m = mult(modelViewMatrix, scale4(0.5, 1.3, 0.3));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, texturedCubePoints.length);
}

function head() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(useTextureLoc, false);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.head));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(1.0, 0.4, 1.0));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function eyeOuter() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(useTextureLoc, false);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.eye));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cylinderArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(1.2, 1.2, 4.01));
  m = mult(m, rotateX(90));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, cylinderArray.length);
}

function eyeInner() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.eyeInner));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(innerCylinderArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(1.1, 1.1, 4.0));
  m = mult(m, rotateX(90));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, innerCylinderArray.length);
}

function pupil() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.eye));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pupilArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(0.3, 0.3, 0.1));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pupilArray.length);
}

function shoulder() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.shoulder));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(0.5, 0.3, 0.3));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function arm() {
  gl.uniform1i(textureTypeLoc, 1);
  gl.uniform1i(useTextureLoc, true);
  gl.uniform4fv(colorLoc, flatten(colors.arm));
  const mvMatrix = mult(modelViewMatrix, scale4(0.6, 1.9, 0.3));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texturedCubePoints), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  if (batteryLowColor) {
    gl.uniform1i(textureTypeLoc, 0);
    gl.uniform1i(useTextureLoc, false);
    gl.disableVertexAttribArray(vTexCoord);
    gl.uniform4fv(colorLoc, flatten(vec4(0.3, 0.3, 0.3, 1.0)));
  } else {
    gl.uniform1i(textureTypeLoc, 1);
    gl.uniform1i(useTextureLoc, true);
    gl.uniform4fv(colorLoc, flatten(colors.torso));

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      flatten(texturedCubeTexCoords),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    flatten(texturedCubeTexCoords),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    flatten(texturedCubeNormalsArray),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);
  gl.drawArrays(gl.TRIANGLES, 0, texturedCubePoints.length);
}

function wrist() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.wrist));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(0.4, 1.2, 0.2));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function hand() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.hand));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  let m = mult(modelViewMatrix, scale4(0.3, 0.6, 0.1));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function claw() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform1i(gl.getUniformLocation(program, "useTexture"), false);
  gl.uniform4fv(colorLoc, flatten(colors.claw));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(clawArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.drawArrays(gl.TRIANGLES, 0, clawArray.length);
}

function tread() {
  gl.uniform1i(textureTypeLoc, 0);
  gl.uniform1i(useTextureLoc, false);
  gl.disableVertexAttribArray(vTexCoord);
  gl.uniform4fv(colorLoc, flatten(colors.tread));
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(treadArray), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(treadNormals), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);
  let m = mult(modelViewMatrix, scale4(1.3, 1.3, 1.0));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, treadArray.length);
}

function createNode(transform, render, sibling, child) {
  var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
  };
  return node;
}

// ** Node Creation and Positioning **
// create each node and assign its transformation (position, scale)
// modify this to translate a each body part
function initNodes(id) {
  let m = mat4();

  switch (id) {
    case torsoId:
      m = translate(0, -3, 0);
      m = mult(m, scale4(0.7, 1.0, 1.0));
      figure[torsoId] = createNode(m, torso, null, neckId);
      break;

    case neckId:
      m = translate(0, 2.0, 0);
      figure[neckId] = createNode(m, neck, leftTreadId, headId);
      break;

    case headId:
      m = translate(0, 0.6, 0);
      m = mult(m, rotateX(headYaw));
      figure[headId] = createNode(m, head, null, eyeLeftOuterId);
      break;

    case eyeLeftOuterId:
      m = translate(-0.7, 0.15, 0.6);
      figure[eyeLeftOuterId] = createNode(
        m,
        eyeOuter,
        eyeRightOuterId,
        eyeLeftInnerId
      );
      break;

    case eyeLeftInnerId:
      m = translate(0, -0.01, 0.1);
      figure[eyeLeftInnerId] = createNode(m, eyeInner, null, eyeLeftPupilId);
      break;

    case eyeLeftPupilId:
      m = translate(0, 0, 1.1);
      figure[eyeLeftPupilId] = createNode(m, pupil, null, null);
      break;

    case eyeRightOuterId:
      m = translate(0.7, 0.15, 0.6);
      figure[eyeRightOuterId] = createNode(m, eyeOuter, null, eyeRightInnerId);
      break;

    case eyeRightInnerId:
      m = translate(0, -0.01, 0.1);
      figure[eyeRightInnerId] = createNode(m, eyeInner, null, eyeRightPupilId);
      break;

    case eyeRightPupilId:
      m = translate(0, 0, 1.1);
      figure[eyeRightPupilId] = createNode(m, pupil, null, null);
      break;

    case leftTreadId:
      m = translate(-1.8, -1.5, 0);
      m = mult(m, rotateZ(90));
      figure[leftTreadId] = createNode(m, tread, rightThreadId, null);
      break;

    case rightThreadId:
      m = translate(1.8, -1.5, 0);
      m = mult(m, rotateZ(90));
      figure[rightThreadId] = createNode(m, tread, shoulder1Id, null);
      break;

    case shoulder1Id:
      m = translate(-1.8, 0.9, 0);
      m = mult(m, rotateX(shoulder1Yaw));
      figure[shoulder1Id] = createNode(m, shoulder, shoulder2Id, arm1Id);
      break;

    case arm1Id:
      m = translate(0.0, -1.1, 0.0);
      figure[arm1Id] = createNode(m, arm, null, wrist1Id);
      break;

    case wrist1Id:
      m = translate(0.0, wrist1Yaw, 0);
      figure[wrist1Id] = createNode(m, wrist, null, hand1Id);
      break;

    case hand1Id:
      m = translate(0.0, 0.05, 0);
      figure[hand1Id] = createNode(m, hand, null, claw1_1Id);
      break;

    case claw1_1Id:
      m = translate(-0.4, -0.85, 0);
      m = mult(m, rotateZ(45));
      figure[claw1_1Id] = createNode(m, claw, claw1_2Id, null);
      break;

    case claw1_2Id:
      m = translate(0.4, -0.85, 0);
      m = mult(m, rotateZ(-45));
      figure[claw1_2Id] = createNode(m, claw, null, null);
      break;

    case shoulder2Id:
      m = translate(1.8, 0.9, 0);
      m = mult(m, rotateX(shoulder2Yaw));
      figure[shoulder2Id] = createNode(m, shoulder, null, arm2Id);
      break;

    case arm2Id:
      m = translate(0.0, -1.1, 0);
      figure[arm2Id] = createNode(m, arm, null, wrist2Id);
      break;

    case wrist2Id:
      m = translate(0.0, wrist2Yaw, 0);
      figure[wrist2Id] = createNode(m, wrist, null, hand2Id);
      break;

    case hand2Id:
      m = translate(0.0, 0.05, 0);
      figure[hand2Id] = createNode(m, hand, null, claw2_1Id);
      break;

    case claw2_1Id:
      m = translate(-0.4, -0.85, 0);
      m = mult(m, rotateZ(45));
      figure[claw2_1Id] = createNode(m, claw, claw2_2Id, null);
      break;

    case claw2_2Id:
      m = translate(0.4, -0.85, 0);
      m = mult(m, rotateZ(-45));
      figure[claw2_2Id] = createNode(m, claw, null, null);
      break;
  }
}

// ** Traversing and Rendering Part ** //
/**
 * Applies the current node's transformation to the modelViewMatrix.
 * Renders the current node.
 * Recursively traverses the child node (if any), preserving the current matrix using a stack.
 * Restores the matrix after child traversal.
 * Continues with the sibling node (if any).
 */
function traverse(Id) {
  if (Id == null) return;

  stack.push(modelViewMatrix);
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);

  figure[Id].render();

  if (figure[Id].child != null) traverse(figure[Id].child);

  modelViewMatrix = stack.pop();

  if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function scale4(a, b, c) {
  let result = mat4();
  result[0][0] = a;
  result[1][1] = b;
  result[2][2] = c;
  return result;
}

function scale(s, v) {
  return vec3(s * v[0], s * v[1], s * v[2]);
}

function updateCamera() {
  _eye[0] = parseFloat(document.getElementById("eyeX").value);
  _eye[1] = parseFloat(document.getElementById("eyeY").value);
  _eye[2] = parseFloat(document.getElementById("eyeZ").value);
  at[0] = parseFloat(document.getElementById("atX").value);
  at[1] = parseFloat(document.getElementById("atY").value);
  at[2] = parseFloat(document.getElementById("atZ").value);
  up[0] = parseFloat(document.getElementById("upX").value);
  up[1] = parseFloat(document.getElementById("upY").value);
  up[2] = parseFloat(document.getElementById("upZ").value);
}

// ** Regarding Trash and Trash Can Part ** //
colors.trash = rgbToVec4(88, 49, 6);
colors.trashCan = rgbToVec4(40, 40, 40, 0.6);

function renderTrash(position) {
  gl.uniform4fv(colorLoc, flatten(colors.trash));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  let m = mult(
    modelViewMatrix,
    translate(position[0], position[1], position[2])
  );
  m = mult(m, scale4(0.5, 0.6, 0.4));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function renderTrashCan(position) {
  gl.uniform4fv(colorLoc, flatten(colors.trashCan));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cylinderArray), gl.STATIC_DRAW);
  let m = mult(
    modelViewMatrix,
    translate(position[0], position[1], position[2])
  );
  m = mult(m, scale4(1.2, 1.0, 0.4));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, cylinderArray.length);
}

// ** Charging Station Part ** //
colors.chargingStation = rgbToVec4(76, 216, 21, 0.7);

function renderChargingStation(position) {
  gl.uniform4fv(colorLoc, flatten(colors.chargingStation));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cylinderArray), gl.STATIC_DRAW);
  let m = mult(
    modelViewMatrix,
    translate(position[0], position[1], position[2])
  );
  m = mult(m, scale4(2.0, 2.6, 0.4));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, cylinderArray.length);
}

// ** Dragging and Dropping the Trash ** //
/**
 * getWorldCoordsFromMouse: Computes the world-space ray direction from the mouse position.
 * onMouseDown: Triggered when the mouse is pressed. Checks if the mouse is close enough to the trash to start dragging.
 * onMouseMove: Updates the trash position to follow the mouse while dragging.
 * onMouseUp: Handles the logic when the mouse is released, ending the drag and starting the drop animation.
 */
let isDraggingTrash = false;
let dragStartWorld = null;
let dragOffsetVec = vec3(0, 0, 0);
let dragDepth = null;

function getWorldCoordsFromMouse(event) {
  // change 2D mouse coord -> 3d coord (screen -> clip → eye → world)
  // need to compute world coord because trash, wall E, trash can are on the world cord
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
  const y =
    ((canvas.height - (event.clientY - rect.top)) / canvas.height) * 2 - 1;

  const clipCoords = vec4(x, y, -1.0, 1.0);

  let invProj = inverse(projectionMatrix);
  let invView = inverse(lookAt(_eye, at, up));
  let eyeCoords = mult(invProj, clipCoords);
  eyeCoords = vec4(eyeCoords[0], eyeCoords[1], -1.0, 0.0);

  let worldCoords = mult(invView, eyeCoords);
  return normalize(vec3(worldCoords)); // a world-space ray direction based on the mouse click
}

function onMouseDown(event) {
  const rayDir = getWorldCoordsFromMouse(event); // a vector from camera to mouse
  const eyePos = vec3(_eye); // the position of camera
  const toTrash = subtract(trashPosition, eyePos); // a vector from camera to trash
  const projLength = dot(rayDir, toTrash); // projects toTrash vector to rayDir vector

  if (projLength < 0) return; // trash is behind the camera -> ignorew

  const closestPoint = add(eyePos, scale(projLength, rayDir));
  const distance = length(subtract(trashPosition, closestPoint));

  if (distance < 1.0) {
    isDraggingTrash = true;
    dragStartWorld = closestPoint;
    dragDepth = projLength;
  }
}

function onMouseMove(event) {
  if (!isDraggingTrash || dragDepth == null) return;

  const rayDir = getWorldCoordsFromMouse(event);
  const eyePos = vec3(_eye);
  const currentPoint = add(eyePos, scale(dragDepth, rayDir));

  trashPosition = vec3(currentPoint[0], currentPoint[1], 0);
}

function onMouseUp(event) {
  if (isDraggingTrash) {
    isDraggingTrash = false;
    dragDepth = null;
    trashPosition[2] = 1.3;
    isFallingToGround = true;
  }
}

let vBuffer, vPosition, tBuffer, vTexCoord;
let nBuffer, vNormal;

let useTextureLoc, textureTypeLoc;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  textureTypeLoc = gl.getUniformLocation(program, "textureType");

  const bgImage = document.getElementById("bgTextureImage");
  const bgTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, bgTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImage);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const bgTextureLoc = gl.getUniformLocation(program, "uBgTexture");
  gl.uniform1i(bgTextureLoc, 1);

  let lightPosition = vec4(0.0, 10.0, 10.0, 1.0);
  let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
  let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
  let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

  let materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
  let materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
  let materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
  let materialShininess = 50.0;

  let ambientProduct = mult(lightAmbient, materialAmbient);
  let diffuseProduct = mult(lightDiffuse, materialDiffuse);
  let specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  useTextureLoc = gl.getUniformLocation(program, "useTexture");

  const texSize = 64;
  const image2 = new Uint8Array(4 * texSize * texSize);

  for (let i = 0; i < texSize; i++) {
    for (let j = 0; j < texSize; j++) {
      const index = 4 * (i * texSize + j);

      const noise = Math.random();
      const r = 220 + Math.floor(noise * 20);
      const g = 180 + Math.floor(noise * 30);
      const b = 20 + Math.floor(Math.random() * 10);

      image2[index + 0] = r;
      image2[index + 1] = g;
      image2[index + 2] = b;
      image2[index + 3] = 255;
    }
  }

  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image2
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  let textureLoc = gl.getUniformLocation(program, "uTexture");
  gl.uniform1i(textureLoc, 0);

  tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
  vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  generatecube();

  nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  modelViewMatrix = mat4();
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  projectionMatrix = perspective(fovy, aspect, near, far);
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  colorLoc = gl.getUniformLocation(program, "uColor");

  generateTexturedCube();
  generateCylinder(
    cylinderArray,
    cylinderNormals,
    cylinderTexCoords,
    0.6,
    0.5,
    20
  );
  generateCylinder(
    innerCylinderArray,
    innerCylinderNormals,
    innerCylinderTexCoords,
    0.6,
    0.5,
    20
  );
  generateCylinder(treadArray, treadNormals, treadTexCoords, 0.6, 0.5, 20);

  generateSemicircle(0.3, 20, 0.1);
  generateCircle(1.0, 20);

  for (let i = 0; i < numNodes; i++) initNodes(i);

  render();
};

let isFallingToGround = false,
  isMovingToTrash = false,
  isPickingUp = false,
  isHoldingTrash = false,
  isGrabbingTrash = false,
  isLiftingTrash = false,
  isPickingDone = false,
  hasReturnedToOriginalPose = false,
  hasRotatedToTrash = false,
  isLiftingArm = false,
  isRotating = false,
  isReturningWrist = false,
  isReturningRotation = false,
  isReturningToOrigin = false,
  isFinalRotation = false,
  isDroppingInTrashCan = false,
  isReturningToOriginCS = false,
  isFinalRotationCS = false;

let wallEPosition = vec3(-3.0, 0, 0),
  wallERotation = 0,
  targetRotation = 0;

let headYaw = 0,
  headYawTarget = 20,
  shoulderTarget = -44,
  shoulder1Yaw = -90,
  shoulder2Yaw = -90,
  wristTarget = -1.5,
  wrist1Yaw = -0.5,
  wrist2Yaw = -0.5,
  wrist1ExtensionY = -1.2,
  targetWristYaw = -0.5,
  targetShoulderYaw = -90;

let trashGrabOffset = vec3(0, 0, 0),
  trashList = [],
  fallTargetY = -5.0;

let translationCount = 0;
let isBatteryLow = false,
  hasRotatedToCS = false,
  hasRotatedToFront = false,
  hasTranslatedCS = false;

const arm1Length = 1.9,
  arm2Length = 1.9,
  wrist1Length = 1.0,
  wrist2Length = 1.0,
  TRASH_HEIGHT = 0.6;

let chargingTimer = 0;
const maxChargingTime = 360;
let hasRecoveredColor = false;

function getWorldPositionOfClaw() {
  let m = mat4();
  m = mult(m, translate(wallEPosition[0], wallEPosition[1], wallEPosition[2]));
  m = mult(m, rotateY(wallERotation));
  m = mult(m, figure[shoulder1Id].transform);
  m = mult(m, figure[arm1Id].transform);
  m = mult(m, figure[wrist1Id].transform);
  m = mult(m, figure[hand1Id].transform);
  m = mult(m, figure[claw1_1Id].transform);

  const localClawTip = vec4(0.0, -0.65, 0.4, 1.0);
  const worldPos = mult(m, localClawTip);
  return vec3(worldPos[0], worldPos[1], worldPos[2]);
}

function renderChargingGaugeBars() {
  if (chargingTimer >= maxChargingTime) return;
  const barCount = Math.ceil((chargingTimer / maxChargingTime) * 6);
  const basePos = vec3(-7.5, wallEPosition[1] + 1, wallEPosition[2]);
  const spacing = 0.3;

  for (let i = 0; i < barCount; i++) {
    const offsetX = (i + 1) * spacing;
    const position = vec3(basePos[0] + offsetX, basePos[1], basePos[2]);
    renderChargingBar(position);
  }
}

function renderChargingBar(position) {
  gl.uniform4fv(colorLoc, flatten(rgbToVec4(76, 216, 21)));
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  let m = mult(
    modelViewMatrix,
    translate(position[0], position[1], position[2])
  );
  m = mult(m, scale4(0.3, 0.5, 0.1));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
  gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function renderBackground() {
  const bgVertices = [
    vec4(-1, -1, -2.4, 1),
    vec4(1, -1, -2.4, 1),
    vec4(1, 1, -2.4, 1),
    vec4(-1, -1, -2.4, 1),
    vec4(1, 1, -2.4, 1),
    vec4(-1, 1, -2.4, 1),
  ];

  const texCoords = [
    vec2(0, 0.0),
    vec2(1, 0.0),
    vec2(1, 0.7),
    vec2(0, 0.0),
    vec2(1, 0.7),
    vec2(0, 0.7),
  ];

  gl.uniform1i(textureTypeLoc, 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(bgVertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  gl.disableVertexAttribArray(vNormal);
  gl.uniform1i(useTextureLoc, true);

  const viewMatrix = mat4();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(viewMatrix));

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawQuadBackground(x1, y1, x2, y2) {
  const bgVertices = [
    vec4(x1, y1, -0.99, 1),
    vec4(x2, y1, -0.99, 1),
    vec4(x2, y2, -0.99, 1),
    vec4(x1, y1, -0.99, 1),
    vec4(x2, y2, -0.99, 1),
    vec4(x1, y2, -0.99, 1),
  ];

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(bgVertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  gl.uniform1i(useTextureLoc, false);
  const viewMatrix = lookAt(_eye, at, up);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(viewMatrix));

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  updateCamera();

  gl.disable(gl.DEPTH_TEST);
  gl.disableVertexAttribArray(vNormal);
  gl.uniform1i(useTextureLoc, false);
  gl.uniform4fv(colorLoc, flatten(vec4(0.5, 0.6, 0.8, 1.0)));

  renderBackground();

  gl.enableVertexAttribArray(vNormal);
  gl.uniform1i(useTextureLoc, true);
  gl.enable(gl.DEPTH_TEST);

  const viewMatrix = lookAt(_eye, at, up);
  const baseTransform = mult(
    translate(wallEPosition[0], wallEPosition[1], wallEPosition[2]),
    rotateY(wallERotation)
  );
  modelViewMatrix = mult(viewMatrix, baseTransform);

  for (let i = 0; i < numNodes; i++) initNodes(i);
  traverse(torsoId);

  // if wall E is grabbing or holding trash, make the trash follow the claw position
  if (isGrabbingTrash || isHoldingTrash) {
    const clawPos = getWorldPositionOfClaw();
    trashPosition = add(clawPos, trashGrabOffset);
  }

  if (isFallingToGround) {
    const speed = 0.1;
    // targetY == fallTragetY, when trash was dropped into the can
    // targetY == -5.0, when trash was dropped into the ground
    const targetY = isDroppingInTrashCan ? fallTargetY : -5.0;

    trashPosition[1] += (targetY - trashPosition[1]) * speed;

    if (Math.abs(trashPosition[1] - targetY) < 0.01) {
      trashPosition[1] = targetY;
      isFallingToGround = false;
      console.log("Trash has landed on the ground.");

      // if trash was dropped into the can, add it to the list of collected trash
      if (isDroppingInTrashCan) {
        trashList.push(vec3(trashPosition));
      }

      isDroppingInTrashCan = false;
    }
  }

  // resets modelViewMatrix to the camera's view matrix before rendering trash and the trash can
  // ensures they are drawn in world space without inheriting Wall E's transformation
  modelViewMatrix = viewMatrix;
  for (let t of trashList) {
    renderTrash(t);
  }
  renderTrash(trashPosition);
  renderTrashCan(trashCanPosition);
  renderChargingStation(chargingPos);

  const trashLanded =
    !isDraggingTrash &&
    !isFallingToGround &&
    !isPickingUp &&
    !isHoldingTrash &&
    trashPosition[1] <= fallTargetY + 0.05;

  // rotate wall-e toward the trash before moving to pick it up
  if (trashLanded && !isMovingToTrash && !hasRotatedToTrash) {
    const targetRotation = 90;
    const diff = targetRotation - wallERotation;

    if (Math.abs(diff) > 1) {
      wallERotation += Math.sign(diff) * 1.5;
    } else {
      wallERotation = targetRotation;
      isMovingToTrash = true;
      hasRotatedToTrash = true;
    }
  }

  if (isMovingToTrash) {
    const moveDir = vec3(
      Math.sin((wallERotation * Math.PI) / 180),
      0,
      Math.cos((wallERotation * Math.PI) / 180)
    );
    const flatTrash = vec2(trashPosition[0], trashPosition[2]);
    const flatWalle = vec2(wallEPosition[0], wallEPosition[2]);
    const dist = length(subtract(flatTrash, flatWalle)); // the distance between trash and Wall-E

    if (dist <= 3.0) {
      isMovingToTrash = false;
      isPickingUp = true;
      console.log("Wall-E reached the trash.");
    } else {
      wallEPosition = add(wallEPosition, scale(0.02, moveDir)); // wall e moves to trash
    }
  }

  if (isPickingUp) {
    headYaw += (headYawTarget - headYaw) * 0.02;
    initNodes(headId); // wall e tilts his head downward
    const headAligned = Math.abs(headYaw - headYawTarget) < 1.0;

    if (headAligned) {
      shoulder1Yaw += (shoulderTarget - shoulder1Yaw) * 0.02;
      shoulder2Yaw += (shoulderTarget - shoulder2Yaw) * 0.02;
      initNodes(shoulder1Id); // his shoulders too
      initNodes(shoulder2Id);
    }
    const shouldersAligned =
      Math.abs(shoulder1Yaw - shoulderTarget) < 1.0 &&
      Math.abs(shoulder2Yaw - shoulderTarget) < 1.0;

    // after lowering his head and shoulders, he stretchs his wrist
    if (headAligned && shouldersAligned && !isGrabbingTrash) {
      wrist1Yaw += (wristTarget - wrist1Yaw) * 0.02;
      initNodes(wrist1Id);

      const wristAligned = Math.abs(wrist1Yaw - wristTarget) < 0.05;
      if (wristAligned && !isGrabbingTrash) {
        isGrabbingTrash = true;
        isLiftingArm = true;
        const clawPos = getWorldPositionOfClaw();
        trashGrabOffset = subtract(trashPosition, clawPos);
        headYawTarget = 0;
        shoulderTarget = -90;
      }
    }
    const clawPos = getWorldPositionOfClaw();
    console.log("Claw Position:", clawPos, "Trash Position:", trashPosition);

    // raise his head and shoulders
    if (isGrabbingTrash && isLiftingArm) {
      headYaw += (headYawTarget - headYaw) * 0.02;
      shoulder1Yaw += (shoulderTarget - shoulder1Yaw) * 0.02;
      shoulder2Yaw += (shoulderTarget - shoulder2Yaw) * 0.02;

      initNodes(headId);
      initNodes(shoulder1Id);
      initNodes(shoulder2Id);

      const fullyLifted =
        Math.abs(headYaw - headYawTarget) < 1.0 &&
        Math.abs(shoulder1Yaw - shoulderTarget) < 1.0 &&
        Math.abs(shoulder2Yaw - shoulderTarget) < 1.0;

      if (fullyLifted) {
        isPickingUp = false;
        isHoldingTrash = true;
        isLiftingArm = false;
        console.log("Arm and head lifted after grab.");
      }
    }
  }

  // prepare rotating wall-e back to the center
  if (isHoldingTrash && !isRotating && Math.abs(wallERotation + 90) < 1.0) {
    targetRotation = 90;
    isRotating = true;

    console.log("Started rotating back to center.");
  }

  if (isHoldingTrash) {
    const moveDir = vec3(
      Math.sin((wallERotation * Math.PI) / 180),
      0,
      Math.cos((wallERotation * Math.PI) / 180)
    );
    wallEPosition = add(wallEPosition, scale(0.01, moveDir));

    const flatWalle = vec2(wallEPosition[0], wallEPosition[2]);
    const flatCan = vec2(trashCanPosition[0], trashCanPosition[2]);
    const distToCan = length(subtract(flatWalle, flatCan));

    // when near the trash can, initiate trash drop and reset Wall-E's arm and rotation states
    if (distToCan < 4.19) {
      isHoldingTrash = false;
      isGrabbingTrash = false;
      isFallingToGround = true;
      headYawTarget = 0;
      shoulderTarget = -90;
      wristTarget = -0.5;
      targetWristYaw = -0.5;
      targetShoulderYaw = -90;
      wallERotation = 90;
      targetRotation = -90;
      isDroppingInTrashCan = true;
      fallTargetY = -4.1 + trashList.length * TRASH_HEIGHT;
      isReturningWrist = true;
      isReturningRotation = false;
      isReturningToOrigin = false;
      isFinalRotation = false;
      hasReturnedToOriginalPose = false;
      console.log("Dropped → shrink wrist, rotate, move, then restore.");
    }
  }

  // he returns to his original position after dropping the trash
  if (
    !isHoldingTrash &&
    !isGrabbingTrash &&
    !hasReturnedToOriginalPose &&
    !isPickingUp &&
    !isFallingToGround
  ) {
    const targetPos = vec3(-3.5, 0, 0);

    // shorten his wrist
    if (isReturningWrist) {
      wrist1Yaw += (targetWristYaw - wrist1Yaw) * 0.05;
      initNodes(wrist1Id);

      const wristAligned = Math.abs(wrist1Yaw - targetWristYaw) < 0.05;
      if (wristAligned) {
        isReturningWrist = false;
        isReturningRotation = true;
        console.log("Wrist done → rotate next");
      }
    } else if (isReturningRotation) {
      // rotate to original position
      const diff = targetRotation - wallERotation;

      if (Math.abs(diff) < 1.0) {
        wallERotation = targetRotation;
        isReturningRotation = false;
        isReturningToOrigin = true;
        console.log("Rotated → now walk to origin");
      } else {
        wallERotation += Math.sign(diff) * 1.5;
      }
    } else if (isReturningToOrigin) {
      // wall-E moves to original position
      const moveDir = normalize(subtract(targetPos, wallEPosition));
      wallEPosition = add(wallEPosition, scale(0.02, moveDir));
      const closeEnough = length(subtract(wallEPosition, targetPos)) < 0.2;

      if (closeEnough) {
        isReturningToOrigin = false;
        isFinalRotation = true;
        console.log("Arrived at origin → rotate to front");
      }
    } else if (isFinalRotation) {
      // wall-E turns to face forward
      wallERotation += (0 - wallERotation) * 0.02;

      if (Math.abs(wallERotation) < 1.5) {
        wallERotation = 0;
        isFinalRotation = false;
        hasReturnedToOriginalPose = true;
        console.log("Final rotation done → fully reset.");
      }
    }

    // reset all variables to their initial state
    if (hasReturnedToOriginalPose) {
      trashPosition = vec3(7.0, 4.0, 0.0);
      hasReturnedToOriginalPose = false;
      isDraggingTrash = false;
      dragDepth = null;
      isMovingToTrash = false;
      isPickingUp = false;
      isGrabbingTrash = false;
      isHoldingTrash = false;
      hasRotatedToTrash = false;
      isRotating = false;
      isLiftingArm = false;
      headYaw = 0;
      headYawTarget = 20;
      shoulder1Yaw = -90;
      shoulder2Yaw = -90;
      shoulderTarget = -44;
      wrist1Yaw = -0.5;
      wrist2Yaw = -0.5;
      wristTarget = -1.5;
      if (translationCount < 2) {
        translationCount += 1;
      } else {
        translationCount = 0;
        isBatteryLow = true;
      }
    }
  }

  // when wall E has completed three trash drops
  if (isBatteryLow) {
    if (!hasRotatedToCS) {
      if (!batteryLowColor) {
        gl.uniform1i(useTextureLoc, false);
        gl.uniform4fv(colorLoc, flatten(vec4(0.1, 0.1, 0.1, 1.0)));
        batteryLowColor = true;
      }

      // it rotates to the charging station
      let targetRotation = -90;
      wallERotation += Math.sign(targetRotation - wallERotation) * 1.5;

      if (Math.abs(targetRotation - wallERotation) <= 1.0) {
        wallERotation = targetRotation;
        hasRotatedToCS = true;
        hasTranslatedCS = false;
        console.log("Finished rotating to charging station.");
      }
    }

    // it translates to the charging station
    if (hasRotatedToCS && !hasTranslatedCS) {
      const moveDir = vec3(
        Math.sin((wallERotation * Math.PI) / 180),
        0,
        Math.cos((wallERotation * Math.PI) / 180)
      );
      const flatCS = vec2(chargingPos[0], chargingPos[2]);
      const flatWalle = vec2(wallEPosition[0], wallEPosition[2]);
      const dist = length(subtract(flatCS, flatWalle));

      if (dist <= 0.15) {
        hasTranslatedCS = true;
      } else {
        wallEPosition = add(wallEPosition, scale(0.02, moveDir));
      }
    }

    // it rotates to the front
    if (hasTranslatedCS && !hasRotatedToFront) {
      let targetRotation = 0;
      wallERotation += Math.sign(targetRotation - wallERotation) * 1.0;

      if (Math.abs(wallERotation) < 0.01) {
        wallERotation = 0;
        hasRotatedToFront = true;
      }
    }

    if (hasRotatedToFront) {
      const chargingDist = length(
        subtract(
          vec2(wallEPosition[0], wallEPosition[2]),
          vec2(chargingPos[0], chargingPos[2])
        )
      );
      const isCharging = chargingDist < 0.8 && isBatteryLow;

      // gauge bar filling interval
      if (isCharging) {
        chargingTimer = Math.min(chargingTimer + 1, maxChargingTime);
        renderChargingGaugeBars();
        hasRecoveredColor = false;
      } else {
        chargingTimer = 0;
        hasRecoveredColor = false;
      }

      // it finishes charging
      if (chargingTimer >= maxChargingTime && !hasRecoveredColor) {
        colors.torso = rgbToVec4(248, 175, 58);
        colors.arm = rgbToVec4(248, 175, 58);
        colors.neck = rgbToVec4(128, 77, 26);

        batteryLowColor = false;
        hasRecoveredColor = true;
        fallTargetY = -4.7;
        trashList = [];
      }
    }

    // it rotates to the origin
    if (hasRecoveredColor && !isReturningToOriginCS && !isFinalRotationCS) {
      const targetRotation = 90;
      wallERotation += Math.sign(targetRotation - wallERotation) * 1.0;

      if (Math.abs(targetRotation - wallERotation) < 1.0) {
        wallERotation = targetRotation;
        isReturningToOriginCS = true;
        console.log("rotate to origin");
      }
    }

    // it translates to the origin
    if (isReturningToOriginCS) {
      let targetPos = vec3(-3.0, 0, 0);
      const moveDir = normalize(subtract(targetPos, wallEPosition));
      wallEPosition = add(wallEPosition, scale(0.02, moveDir));
      const closeEnough = length(subtract(wallEPosition, targetPos)) < 0.05;

      if (closeEnough) {
        isReturningToOriginCS = false;
        isFinalRotationCS = true;
        console.log("CS Arrived at origin");
      }
    }

    // it rotates to the front
    if (isFinalRotationCS) {
      let targetRotation = -90;
      wallERotation += Math.sign(targetRotation - wallERotation) * 1.0;

      if (Math.abs(wallERotation) < 1.0) {
        wallERotation = 0;
        hasRotatedToFront = false;
        hasTranslatedCS = false;
        hasRotatedToCS = false;
        isBatteryLow = false;
        hasRecoveredColor = false;
        console.log("CS Final rotation done → fully reset.");
        isFinalRotationCS = false;
      }
    }
  } else {
    gl.uniform4fv(colorLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
  }

  requestAnimFrame(render);
}
