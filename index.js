import { fullscreen } from "./webgl/webgl.js";
import { getWebGLContext } from "./lib/context.js";
import { vrButton } from "./lib/vrButton.js";

import { bufferGeometry, bufferColors } from "./models/F.js";
import { glsl, createProgram, glVertexAttributePointer } from "./lib/webgl.js";
import { mat4 as m4, glMatrix } from "./node_modules/gl-matrix/esm/index.js";

const xrSystem = navigator.xr;

// CONSTANTS
const fGridSize = 50;
const fGridDistance = 200;
const UP = [0, 1, 0];

// SHADERS
const vertexShaderSource = glsl`#version 300 es

  // an attribute is an input (in) to a vertex shader.
  // It will receive data from a buffer
  in vec4 a_position;
  in vec4 a_color;

  // A matrix to transform the positions by
  uniform mat4 u_matrix;

  // a varying the color to the fragment shader
  out vec4 v_color;

// all shaders have a main function
  void main() {
    // Multiply the position by the matrix.
    gl_Position = u_matrix * a_position;

    // Pass the color to the fragment shader.
    v_color = a_color;
  }
`;

const fragmentShaderSource = glsl`#version 300 es

  precision mediump float;

  // the varied color passed from the vertex shader
  in vec4 v_color;

  // we need to declare an output for the fragment shader
  out vec4 outColor;

  void main() {
    outColor = v_color;
  }
`;

let matrixLocation;

const init = (gl) => {
  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Enable directional culling
  gl.enable(gl.CULL_FACE);

  // Depth culling
  gl.enable(gl.DEPTH_TEST);

  // The matrix uniform passed to the vertex shader
  matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Create the vertex array (?)
  const vao = gl.createVertexArray();
  // Make it the current vertex array
  gl.bindVertexArray(vao);

  ///////////////////
  // POSITION STUFF
  ///////////////////

  // The position attribute passed to the vertex shader
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // Turn it on
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Make a buffer for the geometry
  const positionBuffer = gl.createBuffer();

  // Use this buffer as the current ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Load the geometry into ARRAY_BUFFER
  bufferGeometry(gl);

  // Tell the attribute how to read data from the buffer
  glVertexAttributePointer({
    gl,
    attributeLocation: positionAttributeLocation,
    size: 3,
    type: gl.FLOAT,
    normalize: false,
    stride: 0,
    offset: 0,
  });

  ///////////////////
  // COLOR STUFF
  ///////////////////

  // The color attribute passed to the vertex shader
  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  // Turn it on
  gl.enableVertexAttribArray(colorAttributeLocation);

  // Make a buffer for the colors
  const colorBuffer = gl.createBuffer();

  // Use this buffer as the current ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  // Load the geometry into ARRAY_BUFFER
  bufferColors(gl);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  glVertexAttributePointer({
    gl,
    attributeLocation: colorAttributeLocation,
    size: 3,
    type: gl.UNSIGNED_BYTE,
    normalize: true,
    stride: 0,
    offset: 0,
  });
};

// Called every time a XRSession requests that a new frame be drawn.
const onXRFrame = (time, frame) => {
  console.log("FRAME", frame);
  const session = frame.session;
  console.log("SESSION", session);

  const gl = getWebGLContext();

  const refSpace = session.refSpace;
  console.log("REFSPACE", refSpace);

  // Account for the click-and-drag mouse movement or touch movement when
  // calculating the viewer pose for inline sessions.
  // if (!session.isImmersive) {
  //   refSpace = getAdjustedRefSpace(refSpace);
  // }

  const pose = frame.getViewerPose(refSpace);
  console.log("POSE", pose);

  // scene.startFrame();

  // session.requestAnimationFrame(onXRFrame);

  // The pose may be undefined during the initial frames, or when tracking breaks
  if (pose) {
    const glLayer = session.renderState.baseLayer;

    // if (session.isImmersive) {
    //   ({ x, y, z } = pose.transform.orientation);
    // }

    const { baseLayer } = session.renderState;
    gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (const view of pose.views) {
      const viewport = glLayer.getViewport(view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

      const cameraPosition = [
        view.transform.position.x,
        view.transform.position.y,
        view.transform.position.z,
      ];
      const viewProjectionMatrix = view.projectionMatrix;

      // RENDER SCENE

      // Create a point to draw an F that other Fs will look at
      const focusAngle = glMatrix.toRadian(time / 10);
      const focusDistance = 1000;
      // It rotates around the Y axis
      const focusPoint = [
        Math.sin(focusAngle) * focusDistance,
        -cameraPosition[1] / 2,
        Math.cos(focusAngle) * focusDistance,
      ];

      // Create a NxN grid of Fs
      [...Array(fGridSize)].forEach((_, xIndex) => {
        [...Array(fGridSize)].forEach((_, zIndex) => {
          // Compute the x and z position from the angle
          const x = (xIndex - fGridSize / 2) * fGridDistance;
          const z = (zIndex - fGridSize / 2) * fGridDistance;

          const matrix = viewProjectionMatrix.slice();
          // Orient the Fs properly
          m4.rotateZ(matrix, matrix, glMatrix.toRadian(180));
          if ((xIndex + zIndex) % 2) {
            const focusMatrix = [];
            m4.targetTo(focusMatrix, [x - 25, -38, z - 8], focusPoint, UP);
            m4.multiply(matrix, matrix, focusMatrix);
            m4.translate(matrix, matrix, [-25, -37, -7]);
          } else {
            m4.translate(matrix, matrix, [x - 50, -75, z - 15]);
          }
          // Set the matrix to our uniform location for the vertex shader to use
          gl.uniformMatrix4fv(matrixLocation, false, matrix);

          // Draw the loaded triangles from the buffer
          const offset = 0;
          const count = 16 * 6;
          gl.drawArrays(gl.TRIANGLES, offset, count);
        });
      });

      // END RENDER SCENE
    }
    // return;
  }
  // scene.endFrame();
  session.requestAnimationFrame(onXRFrame);
};

const startInlineSession = async () => {
  const session = await xrSystem.requestSession("inline");
  session.refSpace = await session.requestReferenceSpace("viewer");

  console.log("INLINE SESSION", session);
  session.addEventListener("end", console.log);

  const webGlContext = getWebGLContext();
  const glLayer = new XRWebGLLayer(session, webGlContext);
  session.updateRenderState({
    baseLayer: glLayer,
  });

  // Inline sessions require that we manually set the FoV
  const fieldOfView = (90 * Math.PI) / 180;
  session.updateRenderState({
    inlineVerticalFieldOfView: fieldOfView,
  });

  // Draw the canvas on the screen for inline sessions
  const canvas = webGlContext.canvas;
  document.body.appendChild(canvas);
  fullscreen(canvas);

  init(webGlContext);
  session.requestAnimationFrame(onXRFrame);
};

const startImmersiveSession = async () => {
  const session = await xrSystem.requestSession("immersive-vr");
  session.refSpace = await session.requestReferenceSpace("local");
  session.isImmersive = true;
  console.log("IMMERSIVE SESSION", session);
  session.addEventListener("end", console.log);

  const webGlContext = getWebGLContext();
  const glLayer = new XRWebGLLayer(session, webGlContext);
  session.updateRenderState({
    baseLayer: glLayer,
  });

  session.requestAnimationFrame(onXRFrame);
};

// Start an immersive VR session if the VR button is clicked
vrButton.addEventListener("click", startImmersiveSession);

// Always start an inline session on boot
// if (xrSystem) {
//   startInlineSession();
// }
