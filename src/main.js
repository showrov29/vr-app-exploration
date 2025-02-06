import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

let scene, camera, renderer;
let leftController, rightController;
let leftPreviousPosition = null, rightPreviousPosition = null;
let previousTimestamp = null;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; // Enable WebXR
  document.body.appendChild(renderer.domElement);

  // Add VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Create a cube
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 1.5, -1);
  scene.add(cube);

  // Add XR controllers
  leftController = renderer.xr.getController(0); // Left controller
  rightController = renderer.xr.getController(1); // Right controller

  // Add visual representation for controllers
  const controllerModel = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  leftController.add(controllerModel.clone());
  rightController.add(controllerModel.clone());

  scene.add(leftController);
  scene.add(rightController);

  // Event listeners for controller interaction
  leftController.addEventListener('selectstart', () => console.log('Left controller select start'));
  leftController.addEventListener('selectend', () => console.log('Left controller select end'));
  rightController.addEventListener('selectstart', () => console.log('Right controller select start'));
  rightController.addEventListener('selectend', () => console.log('Right controller select end'));
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(time) {
  const session = renderer.xr.getSession();
  if (session) {
    // Calculate speed for left controller
    if (leftController && leftController.position) {
      const leftPosition = leftController.position;

      // Check if the controller has moved
      if (leftPreviousPosition) {
        const deltaX = leftPosition.x - leftPreviousPosition.x;
        const deltaY = leftPosition.y - leftPreviousPosition.y;
        const deltaZ = leftPosition.z - leftPreviousPosition.z;
        const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        if (distanceMoved > 0) { // Only log if the controller has moved
          const deltaTime = (time - previousTimestamp) / 1000; // Convert to seconds
          const speed = distanceMoved / deltaTime;
          console.log(`Left controller speed: ${speed.toFixed(2)} m/s`);
        }
      }

      // Update previous position
      leftPreviousPosition = leftPosition.clone();
    }

    // Calculate speed for right controller
    if (rightController && rightController.position) {
      const rightPosition = rightController.position;

      // Check if the controller has moved
      if (rightPreviousPosition) {
        const deltaX = rightPosition.x - rightPreviousPosition.x;
        const deltaY = rightPosition.y - rightPreviousPosition.y;
        const deltaZ = rightPosition.z - rightPreviousPosition.z;
        const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        if (distanceMoved > 0) { // Only log if the controller has moved
          const deltaTime = (time - previousTimestamp) / 1000; // Convert to seconds
          const speed = distanceMoved / deltaTime;
          console.log(`Right controller speed: ${speed.toFixed(2)} m/s`);
        }
      }

      // Update previous position
      rightPreviousPosition = rightPosition.clone();
    }

    // Update timestamp
    previousTimestamp = time;
  }

  // Render the scene
  renderer.render(scene, camera);
}