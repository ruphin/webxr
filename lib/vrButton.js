// A button to start an immersive VR session
export const vrButton = document.createElement("button");
vrButton.disabled = true;

// Hide the button once it is activated
vrButton.addEventListener("click", () => {
  vrButton.style.display = "none";
});

// A container to hold the button
const container = document.createElement("div");
container.appendChild(vrButton);
container.style.position = "absolute";
document.body.appendChild(container);

let xrSupport;
const xrSystem = navigator.xr;

// If an XR device is attached, check for immersive VR support
const deviceChanged = async () => {
  if (xrSupport === undefined) {
    xrSupport = await xrSystem.isSessionSupported("immersive-vr");
    if (xrSupport) {
      vrButton.innerText = "Start immersive session";
    } else {
      vrButton.innerText = "Device does not support immersive VR";
    }
    vrButton.disabled = !xrSupport;
  }
};

if (xrSystem) {
  vrButton.innerText = "Waiting for device";
  xrSystem.addEventListener("devicechange", deviceChanged);
} else {
  vrButton.innerText = "No WebXR support";
}
