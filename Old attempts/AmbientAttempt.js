// Vertex shader program
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;        
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  uniform bool u_isLighting;
  void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Color = a_Color;
  }`;

// Fragment shader program
var FSHADER_SOURCE =
  `#ifdef GL_ES
  precision mediump float;
  #endif
  uniform vec3 u_LightColor;    
  uniform vec3 u_LightPosition; 
  uniform vec3 u_AmbientLight;
  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  uniform sampler2D u_Sampler;
  void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LightPosition - v_Position);
    float nDotL = max(dot(lightDirection, normal), 0.0);;
    vec3 diffuse;
    diffuse = u_LightColor * v_Color.rgb * nDotL;
    vec3 ambient = u_AmbientLight * v_Color.rgb;
    gl_FragColor = vec4(diffuse + ambient, v_Color.a);
  }`;

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 72.0;    // The rotation y angle (degrees)
var g_zAngle = 0.0; // Rotation z angle (degrees)
var g_xMove = -3; //movement of the camera in the x direction
var g_yMove = 10; // movement of the camera in the y direction
var g_zMove = 17; // movement of the camera in the z direction
var g_boat = 0; // movement for the boat
var g_car = 0; //movement for the car
var g_wheel = 0; //rotation of the wheels (degrees)
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color to cyan and enable hidden surface removal
  gl.clearColor(0.0, 0.7, 1, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightPosition || !u_AmbientLight) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)    // Normalize
  gl.uniform3f(u_LightPosition,0,10,20);
  gl.uniform3f(u_AmbientLight, 0.5,0.5,0.5);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(0, 10, 20, 0, 0, 0, 0, 1, 0);
  projMatrix.setPerspective(50, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix);
  };

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    case 73: // 'i' key rotate around z
      g_zAngle = (g_zAngle + ANGLE_STEP) % 360;
      break;
    case 75: // 'k' key rotate around z
      g_zAngle = (g_zAngle - ANGLE_STEP) % 360;
      break;
    case 87: // 'w'key -> camera movement
      g_zMove -= 1;
      break;
    case 83: // 's'key -> camera movement
      g_zMove += 1;
      break;
    case 68: // 'd'key -> camera movement
      g_xMove += 1;
      break;
    case 65: // 'a'key -> camera movement 
      g_xMove -= 1;
      break;
    case 85: // 'u' key -> camera movement
      g_yMove += 1;
      break;
    case 74: //'j' key -> camera movement
      g_yMove -= 1;
    case 66: // 'b' key -> boat movement forwards
      if(g_boat <= 13){
        g_boat += 0.1;
      } else {
        g_boat = -1;
      }
      break;
    case 78:// 'n' key -> boat movement backwards
      if(g_boat >= -1){
        g_boat -= 0.1;
      } else {
        g_boat = 13;
      }
      break;
    case 67:// 'c' key -> car movement forwards
      if(g_car <= 8 ){
        g_wheel = (g_wheel - 10) % 360 ;
        g_car += 0.1;
      } else {
        g_car = -1;
      }
      break;
    case 86:// 'v' key -> car movement backwards
      if(g_car >= -1){
        g_wheel = (g_wheel + 10) % 360;
        g_car -= 0.1;
      } else {
        g_car = 8;
      }
      break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix);
}
function initVertexBuffersData(gl,modelData,color){ //reading and using data from variables stored in external js
  var vertices = new Float32Array(modelData[0].vertices);

  var normals = new Float32Array(modelData[0].normals);
 
  var indices =new Uint8Array(modelData[0].faces.flat());
  
  var temp = []
  for(var i = 0; i < vertices.length/3; i++){
    temp.push(color[0]);
    temp.push(color[1]);
    temp.push(color[2]);
  };
  var colors = new Float32Array(temp);
  
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initVertexBuffersCube(gl, colorData) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],  colorData[0], colorData[1], colorData[2],     // v0-v1-v2-v3 front
    colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],  colorData[0], colorData[1], colorData[2],     // v0-v3-v4-v5 right
    colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],  colorData[0], colorData[1], colorData[2],     // v0-v5-v6-v1 up
    colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],  colorData[0], colorData[1], colorData[2],     // v1-v6-v7-v2 left
    colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],  colorData[0], colorData[1], colorData[2],     // v7-v4-v3-v2 down
    colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],   colorData[0], colorData[1], colorData[2],  colorData[0], colorData[1], colorData[2]　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  var FSIZE = data.BYTES_PER_ELEMENT;
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, FSIZE * num, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}
var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix) {
  viewMatrix.setLookAt(g_xMove, g_yMove, g_zMove, g_xMove+3, g_yMove-10, g_zMove-17, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // Set the vertex coordinates and color (for the x, y axes)


  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);


  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersData(gl,bridgeSectionData,[169/255,169/255,169/255]);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Rotating the model
  modelMatrix.setTranslate(1, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  modelMatrix.rotate(g_zAngle, 0, 0, 1); // Rotate along z axis
  //Drawing the bridge in sections
  for (var i = 0; i < 10; i++) {
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.95*i*2, 0, 0);  // Translation
    modelMatrix.scale(2,2,2);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

  }

// Drawing the set of static boats
  var n = initVertexBuffersData(gl,boatData,[165/255,42/255,42/255]);
  if (n < 0){
    console.log('Failed to se the vertex information');
    return;
  }
  for (var i = 0; i < 7; i++) {
    pushMatrix(modelMatrix);
      modelMatrix.translate(5 - 0.25*i,0,4+0.4*i);
      modelMatrix.rotate(75,0,1,0);
      modelMatrix.scale(0.5,0.5,0.5);
      drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }
// Drawing the moving boat
  pushMatrix(modelMatrix);
    modelMatrix.translate(2.5,0,8 - g_boat);
    modelMatrix.scale(0.5,0.5,0.5);
    drawbox(gl, u_ModelMatrix,u_NormalMatrix,n);
  modelMatrix = popMatrix();

  //Drawing the water
  var n = initVertexBuffersCube(gl,[0,0.5,1]);
  if (n < 0){
    console.log('Failed to se the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
    modelMatrix.translate(5,0,0)
    modelMatrix.scale(5,0,10);
    drawbox(gl,u_ModelMatrix,u_NormalMatrix,n);
  modelMatrix = popMatrix();
  //Drawing the floor parts 
  var n = initVertexBuffersCube(gl,[140/255,140/255,140/255]);
    if (n < 0){
      console.log('Failed to se the vertex information');
      return;
    }

  pushMatrix(modelMatrix);
    modelMatrix.translate(12,0,5);
    modelMatrix.rotate(-30,0,1,0);
    modelMatrix.scale(5,0.2,7);

    drawbox(gl,u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
    modelMatrix.translate(15,0,-4.5);
    
    modelMatrix.scale(5,0.2,6);

    drawbox(gl,u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //Drawing the grass
  var n = initVertexBuffersCube(gl,[0.2,1,0.3]);
  if (n < 0){
    console.log('Failed to se the vertex information');
    return;
  }
  pushMatrix(modelMatrix)
    modelMatrix.translate(1,0,0);
    modelMatrix.scale(1,0.1,10);
    drawbox(gl,u_ModelMatrix,u_NormalMatrix,n);
  modelMatrix = popMatrix();
//Drawing the building
  var n = initVertexBuffersData(gl,boatClubData, [0.5,0.5,0.5]);
  pushMatrix(modelMatrix);
    modelMatrix.translate(12,0.2,5);
    modelMatrix.rotate(145,0,1,0);
    drawbox(gl,u_ModelMatrix,u_NormalMatrix,n);
  modelMatrix = popMatrix();
//Drawing the car  
  var n = initVertexBuffersData(gl,carFrameData, [1,0,0]);
  pushMatrix(modelMatrix);
    modelMatrix.translate(1.5 + g_car,1.5,-0.75);
    drawbox(gl,u_ModelMatrix,u_NormalMatrix,n);
  modelMatrix = popMatrix();
// Drawing the 4 wheels
  var n = initVertexBuffersData(gl,wheelData,[0.1,0.1,0.1]);
  var x = 0;
  var y = 1.6;
  var z = 0;
  for (var i = 0; i < 4; i++) {
    
    switch(i){
      case 0:
        x = 1.845;
        z = -0.8;
        break;
      case 1:
        x = 1.845;
        z = -1.25;
        break;
      case 2:
        x = 2.245;
        z = -0.8;
        break;
      case 3:
        x = 2.245;
        z = -1.25;
        break;
      default: return;

    }
    pushMatrix(modelMatrix);
      modelMatrix.translate(x+g_car,y,z);
      modelMatrix.rotate(g_wheel,0,0,1);
      drawbox(gl,u_ModelMatrix,u_NormalMatrix,n);
    modelMatrix = popMatrix();
  }
}

//function to draw an object
function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}