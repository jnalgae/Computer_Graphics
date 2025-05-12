"use strict";

let canvas, gl, program;
let modelViewMatrix, projectionMatrix, modelViewMatrixLoc, projectionMatrixLoc;
let pointsArray = [], normalsArray = [], cylinderArray = [], innerCylinderArray = [], clawArray = [], pupilArray = [], treadArray = [];

let torsoId = 0, neckId = 1, headId = 2;
let eyeLeftOuterId = 3, eyeLeftInnerId = 4, eyeLeftPupilId = 5;
let eyeRightOuterId = 6, eyeRightInnerId = 7, eyeRightPupilId = 8;
let leftTreadId = 9, rightThreadId = 10;
let shoulder1Id = 11, arm1Id = 12, wrist1Id = 13, hand1Id = 14, claw1_1Id = 15, claw1_2Id = 16;
let shoulder2Id = 17, arm2Id = 18, wrist2Id = 19, hand2Id = 20, claw2_1Id = 21, claw2_2Id = 22;
let numNodes = 23;

let figure = new Array(numNodes);
let theta = new Array(numNodes).fill(0)
let stack = []

let _eye = [5, 2, 20], at = [0, 0, 0], up = [0, 1, 0]; 
let fovy = 45, aspect = 1, near = 0.1, far = 1000;

let colorLoc;

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
    tread: rgbToVec4(102, 102, 102)
};

// ** Geometry Generation Part ** // 
/**
 * Define cube vertices
 * - it will be used to construct neck, shouler, arm, wrist, torso
 */
let vertices = [
    vec4(-0.5, -0.5,  0.5, 1.0), vec4(-0.5,  0.5,  0.5, 1.0),
    vec4( 0.5,  0.5,  0.5, 1.0), vec4( 0.5, -0.5,  0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5,  0.5, -0.5, 1.0),
    vec4( 0.5,  0.5, -0.5, 1.0), vec4( 0.5, -0.5, -0.5, 1.0),
];

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    
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

function cube() {
    quad(1, 0, 3, 2); quad(2, 3, 7, 6);
    quad(3, 0, 4, 7); quad(6, 5, 1, 2);
    quad(4, 5, 6, 7); quad(5, 4, 0, 1);
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
function generateCylinder(array, radius = 0.5, height = 1.0, segments = 20) {
    for (let i = 0; i < segments; i++) {
        let theta = (i / segments) * 2 * Math.PI;
        let nextTheta = ((i + 1) / segments) * 2 * Math.PI;

        let x1 = radius * Math.cos(theta);
        let y1 = radius * Math.sin(theta);
        let x2 = radius * Math.cos(nextTheta);
        let y2 = radius * Math.sin(nextTheta);

        // Top face
        array.push(vec4(0, height / 2, 0, 1.0));
        array.push(vec4(x1, height / 2, y1, 1.0));
        array.push(vec4(x2, height / 2, y2, 1.0));

        // Bottom face
        array.push(vec4(0, -height / 2, 0, 1.0));
        array.push(vec4(x2, -height / 2, y2, 1.0));
        array.push(vec4(x1, -height / 2, y1, 1.0));

        // Side face 1
        array.push(vec4(x1, height / 2, y1, 1.0));
        array.push(vec4(x1, -height / 2, y1, 1.0));
        array.push(vec4(x2, -height / 2, y2, 1.0));

        // Side face 2
        array.push(vec4(x1, height / 2, y1, 1.0))
        array.push(vec4(x2, -height / 2, y2, 1.0))
        array.push(vec4(x2, height / 2, y2, 1.0))
    }
}

/**
 * Define a crescent shape
 * it will be used to construct claws
 * - similar to generateCylinder, but instead of a full 360° sweep, 
 *   it uses a 180° range of theta to create a crescent shape
 */
function generateClaw(radius = 0.5, segments = 20, height = 0.1) {
    for (let i = 0; i < segments; i++) {
        let theta = (i / segments) * Math.PI;          // 0 to π
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
    gl.uniform4fv(colorLoc, flatten(colors.torso));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(3, 3, 2));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function neck() {
    gl.uniform4fv(colorLoc, flatten(colors.neck));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(0.5, 0.9, 0.3));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function head() {
    gl.uniform4fv(colorLoc, flatten(colors.head));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(1.0, 0.4, 1.0));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function eyeOuter() {
    gl.uniform4fv(colorLoc, flatten(colors.eye));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cylinderArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(1.2, 1.2, 4.01));
    m = mult(m, rotateX(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, cylinderArray.length);
}

function eyeInner() {
    gl.uniform4fv(colorLoc, flatten(colors.eyeInner));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(innerCylinderArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(1.1, 1.1, 4.0));
    m = mult(m, rotateX(90));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, innerCylinderArray.length);
}

function pupil() {
    gl.uniform4fv(colorLoc, flatten(colors.eye));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pupilArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(0.3, 0.3, 0.1));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pupilArray.length);
}

function shoulder() {
    gl.uniform4fv(colorLoc, flatten(colors.shoulder));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(0.5, 0.3, 0.3));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function arm() {
    gl.uniform4fv(colorLoc, flatten(colors.arm));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(0.6, 1.9, 0.3));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function wrist() {
    gl.uniform4fv(colorLoc, flatten(colors.wrist));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(0.4, 0.2, 0.2));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function hand() {
    gl.uniform4fv(colorLoc, flatten(colors.hand));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(0.3, 0.1, 0.1));  
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
}

function claw() {
    gl.uniform4fv(colorLoc, flatten(colors.claw));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(clawArray), gl.STATIC_DRAW);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, clawArray.length);
}

function tread() {
    gl.uniform4fv(colorLoc, flatten(colors.tread));
    gl.bufferData(gl.ARRAY_BUFFER, flatten(treadArray), gl.STATIC_DRAW);
    let m = mult(modelViewMatrix, scale4(1.3, 1.3, 1.0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(m));
    gl.drawArrays(gl.TRIANGLES, 0, treadArray.length);
}

function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child
    }
    return node;
}

// ** Node Creation and Positioning **
// create each node and assign its transformation (position, scale)
// modify this to translate a each body part
function initNodes(id) {
    let m = mat4();

    switch(id) {
        case torsoId:
            m = translate(0, 0, 0);
            figure[torsoId] = createNode(m, torso, null, neckId);
            break;

        case neckId:
            m = translate(0, 2.0, 0);
            figure[neckId] = createNode(m, neck, leftTreadId, headId);
            break;

        case headId:
            m = translate(0, 0.7, 0);
            figure[headId] = createNode(m, head, null, eyeLeftOuterId);
            break;

        case eyeLeftOuterId:
            m = translate(-0.7, 0.15, 0.6);
            figure[eyeLeftOuterId] = createNode(m, eyeOuter, eyeRightOuterId, eyeLeftInnerId);
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
            m = mult(m, rotateX(-90));
            figure[shoulder1Id] = createNode(m, shoulder, shoulder2Id, arm1Id);
            break;

        case arm1Id:
            m = translate(0.0, -1.2, 0.0);
            figure[arm1Id] = createNode(m, arm, null, wrist1Id);
            break;

        case wrist1Id:
            m = translate(0.0, -1.0, 0);
            figure[wrist1Id] = createNode(m, wrist, null, hand1Id);
            break;

        case hand1Id:
            m = translate(0.0, -0.2, 0);
            figure[hand1Id] = createNode(m, hand, null, claw1_1Id);
            break;

        case claw1_1Id:
            m = mult(m, rotateZ(45));
            m = mult(m, translate(-0.45, 0.06, 0.02));
            figure[claw1_1Id] = createNode(m, claw, claw1_2Id, null);
            break;

        case claw1_2Id:
            m = mult(m, rotateZ(-45));
            m = mult(m, translate(0.45, 0.06, 0.02));
            figure[claw1_2Id] = createNode(m, claw, null, null);
            break;

        case shoulder2Id:
            m = translate(1.8, 0.9, 0);
            m = mult(m, rotateX(-90));
            figure[shoulder2Id] = createNode(m, shoulder, null, arm2Id);
            break;

        case arm2Id:
            m = translate(0.0, -1.2, 0);
            figure[arm2Id] = createNode(m, arm, null, wrist2Id);
            break;

        case wrist2Id:
            m = translate(0.0, -1.0, 0);
            figure[wrist2Id] = createNode(m, wrist, null, hand2Id);
            break;

        case hand2Id:
            m = translate(0.0, -0.2, 0);
            figure[hand2Id] = createNode(m, hand, null, claw2_1Id);
            break;

        case claw2_1Id:
            m = mult(m, rotateZ(45));
            m = mult(m, translate(-0.45, 0.06, 0.02));
            figure[claw2_1Id] = createNode(m, claw, claw2_2Id, null);
            break;

        case claw2_2Id:
            m = mult(m, rotateZ(-45));
            m = mult(m, translate(0.45, 0.06, 0.02));
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
    if (Id == null) 
        return;

    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);

    figure[Id].render();

    if (figure[Id].child != null) 
        traverse(figure[Id].child);

    modelViewMatrix = stack.pop();

    if (figure[Id].sibling != null)
        traverse(figure[Id].sibling);
}

function scale4(a, b, c) {
    let result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
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

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {alert("WebGL isn't available");}
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrix = mat4();
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    projectionMatrix = perspective(fovy, aspect, near, far);
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    colorLoc = gl.getUniformLocation(program, "uColor");

    cube();
    generateCylinder(cylinderArray, 0.6, 0.5, 20);
    generateCylinder(innerCylinderArray, 0.6, 0.5, 20);
    generateCylinder(treadArray, 0.6, 0.5, 20);    
    generateClaw(0.3, 20, 0.1);
    generateCircle(1.0, 20);

    for (let i = 0; i < numNodes; i++) initNodes(i);
    
    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    updateCamera();
    let forward = normalize(subtract(at, _eye)); 
    let right = cross(forward, up); 
    if (length(right) < 0.0001) up = vec3(0, 1, 0); 
    modelViewMatrix = lookAt(_eye, at, up);
    traverse(torsoId);
    requestAnimFrame(render);
}