export const fullscreen = (canvas, hiDPI = false) => {
  document.body.style.display = "flex";
  document.body.style.margin = 0;
  canvas.style.height = "100vh";
  canvas.style.width = "100vw";
  const pixelRatio = (hiDPI && window.devicePixelRatio) || 1;
  const fullscreenSize = () => {
    const width = Math.floor(window.innerWidth * pixelRatio);
    const height = Math.floor(window.innerHeight * pixelRatio);
    resize(canvas, height, width);
  };
  window.addEventListener("resize", fullscreenSize);
  fullscreenSize();
};

export const resize = (canvas, height, width) => {
  canvas.height = height;
  canvas.width = width;
};

export const createVertexShader = (gl, source) =>
  createShader(gl, gl.VERTEX_SHADER, source);

export const createFragmentShader = (gl, source) =>
  createShader(gl, gl.FRAGMENT_SHADER, source);

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw Error("Shader failed to compile");
  }
  return shader;
};

export const createProgram = (gl, vertexShaderSource, fragmentShaderSource) => {
  const program = gl.createProgram();
  gl.attachShader(program, createVertexShader(gl, vertexShaderSource));
  gl.attachShader(program, createFragmentShader(gl, fragmentShaderSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw Error("Program failed to link");
  }
  return program;
};

export const glsl = (statics, ...dynamics) =>
  dynamics
    .map((dynamic, index) => `${statics[index]}${String(dynamic)}`)
    .join("") + statics[dynamics.length];

export const glVertexAttributePointer = ({
  gl,
  attributeLocation,
  size,
  type,
  normalize,
  stride,
  offset,
}) => {
  gl.vertexAttribPointer(
    attributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );
};

let logContainer;
export const log = (messages) => {
  if (!logContainer) {
    logContainer = document.createElement("div");
    Object.assign(logContainer.style, {
      position: "absolute",
      top: 0,
      left: 0,
    });
    document.body.appendChild(logContainer);
  }
  while (logContainer.childNodes.length < messages.length) {
    logContainer.appendChild(document.createElement("div"));
  }
  messages.forEach((message, i) => {
    logContainer.childNodes[i].innerText = message;
  });
};
