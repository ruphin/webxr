// Returns a global xrCompatible webgl2 context
export const getWebGLContext = () => {
  const canvas = document.createElement("canvas");
  return canvas.getContext("webgl2", { xrCompatible: true });
};
