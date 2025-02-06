import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'; // Correct import path

let scene, camera, renderer;
let previousPosition = null;
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

  // Create a virtual "hand" object
  const geometry = new THREE.SphereGeometry(0.1, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const hand = new THREE.Mesh(geometry, material);
  hand.position.set(0, 1.5, -1); // Initial position
  scene.add(hand);

  // Simulate hand movement
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') hand.position.z -= 0.1; // Move forward
    if (event.key === 'ArrowDown') hand.position.z += 0.1; // Move backward
    if (event.key === 'ArrowLeft') hand.position.x -= 0.1; // Move left
    if (event.key === 'ArrowRight') hand.position.x += 0.1; // Move right
  });
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(time) {
  const session = renderer.xr.getSession();
  if (session) {
    // Simulate hand movement using the virtual "hand" object
    const hand = scene.children.find(obj => obj.material && obj.material.color.equals(new THREE.Color(0xff0000)));
    if (hand) {
      const currentPosition = hand.position;
      const currentTimestamp = time;

      if (previousPosition && previousTimestamp) {
        // Calculate distance moved
        const deltaX = currentPosition.x - previousPosition.x;
        const deltaY = currentPosition.y - previousPosition.y;
        const deltaZ = currentPosition.z - previousPosition.z;

        const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        // Calculate time difference
        const deltaTime = (currentTimestamp - previousTimestamp) / 1000; // Convert to seconds

        // Calculate speed
        const speed = distanceMoved / deltaTime;

        console.log(`Hand movement speed: ${speed.toFixed(2)} m/s`);
      }

      // Update previous values
      previousPosition = { ...currentPosition };
      previousTimestamp = currentTimestamp;
    }
  }

  // Render the scene
  renderer.render(scene, camera);
}