import { fullscreen, glsl, createProgram } from "./webgl.js";

const vertexShaderSource = glsl`#version 300 es


  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec2 a_position;

  // Used to pass in the resolution of the canvas
  uniform vec2 u_resolution;

  // translation to add to position
  uniform vec2 u_translation;

  // rotation values
  uniform vec2 u_rotation;

  // all shaders have a main function
  void main() {
    // Rotate the position
    vec2 rotatedPosition = vec2(
      a_position.x * u_rotation.y + a_position.y * u_rotation.x,
      a_position.y * u_rotation.y - a_position.x * u_rotation.x);

    // Add in the translation
    vec2 position = rotatedPosition + u_translation;

    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSource = glsl`#version 300 es

  precision mediump float;

  uniform vec4 u_color;

  // we need to declare an output for the fragment shader
  out vec4 outColor;

  void main() {
    outColor = u_color;
  }
`;

const canvas = document.body.appendChild(document.createElement("canvas"));
fullscreen(canvas, true);
const gl = canvas.getContext("webgl2");

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// look up uniform locations
const resolutionUniformLocation = gl.getUniformLocation(
  program,
  "u_resolution"
);

const translationLocation = gl.getUniformLocation(program, "u_translation");
const rotationLocation = gl.getUniformLocation(program, "u_rotation");
const colorLocation = gl.getUniformLocation(program, "u_color");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positions = [-0.5, -0.5, 0.5, 0.5, 0.5, -0.5];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionAttributeLocation);

const size = 2; // 2 components per iteration
const type = gl.FLOAT; // the data is 32bit floats
const normalize = false; // don't normalize the data
const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
const offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(
  positionAttributeLocation,
  size,
  type,
  normalize,
  stride,
  offset
);

////////////////////////////////

// Fill the buffer with the values that define a rectangle.
const setRectangle = () => {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // Top Left Triangle
      0,
      0,
      150,
      0,
      0,
      150,

      // Bottom Right Triangle
      0,
      150,
      150,
      150,
      150,
      0,
    ]),
    gl.STATIC_DRAW
  );
};

// Tell it to use our program (pair of shaders)
gl.useProgram(program);

// Bind the attribute/buffer set we want.
gl.bindVertexArray(vao);

// Pass in the canvas resolution so we can convert from
// pixels to clipspace in the shader
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

const width = 150;
const height = 150;
let translation = [0, 0];
const rotation = [0, 1];
const color = [Math.random(), Math.random(), Math.random(), 1];

const drawScene = () => {
  // Clear the canvas
  // gl.clearColor(0, 0, 0, 0);
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.uniform2f(
    resolutionUniformLocation,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight
  );

  setRectangle();

  // Set the color
  gl.uniform4fv(colorLocation, color);

  gl.uniform2fv(translationLocation, translation);
  // Set the rotation.
  gl.uniform2fv(rotationLocation, rotation);
  // Draw the shape
  const primitiveType = gl.TRIANGLES;
  const offset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, offset, count);
};

let count = 0;

const step = () => {
  window.requestAnimationFrame(() => {
    count += 3;
    const moveWidth = gl.canvas.width - width;
    const moveHeight = gl.canvas.height - height;
    translation = [
      Math.abs((count % (2 * moveWidth)) - moveWidth),
      Math.abs((count % (2 * moveHeight)) - moveHeight),
    ];

    drawScene();
    step();
  });
};
step();
