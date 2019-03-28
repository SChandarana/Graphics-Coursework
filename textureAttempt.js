// Vertex shader program
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;
  attribute vec2 a_TexCoords;        
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 v_TexCoords;
  uniform bool u_isLighting;
  void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Color = a_Color;
    v_TexCoords = a_TexCoords;
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
  varying vec2 v_TexCoords;
  void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LightPosition - v_Position);
    float nDotL = max(dot(lightDirection, normal), 0.0);;
    vec3 diffuse;
    vec4 TexColor = texture2D(u_Sampler,v_TexCoords);
    diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;
    vec3 ambient = u_AmbientLight * v_Color.rgb;
    gl_FragColor = vec4(diffuse + ambient, v_Color.a);
  }`;

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var g_xMove = 0;
var g_zMove = 20;
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

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
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
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix, u_Sampler);
  };

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix, u_Sampler);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix, u_Sampler) {
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
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_ProjMatrix, u_Sampler);
}
function initVertexBuffersData(gl,modelData,color){
  var vertices = new Float32Array(modelData[0].vertices);

  var normals = new Float32Array(modelData[0].normals);
 
  var indices =new Uint8Array([].concat.apply([],modelData[0].faces));
  var texCoords = new Float32Array([].concat.apply([],modelData[0].texturecoords));
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
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords,2)) return -1;
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

function initVertexBuffersCube(gl) {
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
    0,0,1,   0,0,1,   0,0,1,  0,0,1,     // v0-v1-v2-v3 front
    0,0,1,   0,0,1,   0,0,1,  0,0,1,     // v0-v3-v4-v5 right
    0,0,1,   0,0,1,   0,0,1,  0,0,1,     // v0-v5-v6-v1 up
    0,0,1,   0,0,1,   0,0,1,  0,0,1,     // v1-v6-v7-v2 left
    0,0,1,   0,0,1,   0,0,1,  0,0,1,     // v7-v4-v3-v2 down
    0,0,1,   0,0,1,   0,0,1,  0,0,1　    // v4-v7-v6-v5 back
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
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix, u_Sampler) {
  viewMatrix.setLookAt(g_xMove, 10, g_zMove, g_xMove, 0, g_zMove-20, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, true); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)


  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.uniform1i(u_isLighting, false); // Will apply lighting

  // Set the vertex coordinates and color (for the cube)
  // var n = initVertexBuffersData(gl,bridgeSectionData,[169/255,169/255,169/255]);
  // if (n < 0) {
  //   console.log('Failed to set the vertex information');
  //   return;
  // }

  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 0,0,1); // Rotate along x axis
  
  // for (var i = 0; i < 5; i++) {
  //   pushMatrix(modelMatrix);
  //   modelMatrix.translate(0.95*i*2, 0, 0);  // Translation
  //   modelMatrix.scale(2,2,2);
  //     drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  //   modelMatrix = popMatrix();

  // }

// //BOAT  
//   var n = initVertexBuffersData(gl,boatData,[165/255,42/255,42/255]);
//   if (n < 0){
//     console.log('Failed to se the vertex information');
//     return;
//   }
//   for (var i = 0; i < 7; i++) {
//     pushMatrix(modelMatrix);
//       modelMatrix.translate(5 - 0.25*i,0,4+0.4*i);
//       modelMatrix.rotate(75,0,1,0);
//       modelMatrix.scale(0.5,0.5,0.5);
//       drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
//     modelMatrix = popMatrix();
//   }

//   var n = initVertexBuffersCube(gl);
//   if (n < 0){
//     console.log('Failed to se the vertex information');
//     return;
//   }

//   pushMatrix(modelMatrix);
//    modelMatrix.translate(5,0,0)
//     modelMatrix.scale(5,0,10);
//     drawbox(gl,u_ModelMatrix,u_NormalMatrix,n);
//   modelMatrix = popMatrix();
  var n = initVertexBuffersData(gl, cubeData, [0,1,0]);
  texture = loadTexture(gl, './Models/cube.png');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.uniform1i(u_Sampler, 0);
  pushMatrix(modelMatrix);
    drawbox(gl, u_ModelMatrix,u_NormalMatrix,n);
  modelMatrix = popMatrix();
}

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

function loadTexture(gl,url){
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  //code to make the texture usable even if the image hasn't loaded
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function(){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D (gl.TEXTURE_2D, level, internalFormat, srcFormat,srcType,image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  return texture;
}

function isPowerOf2(value){
  return (value & (value - 1)) == 0;
}
