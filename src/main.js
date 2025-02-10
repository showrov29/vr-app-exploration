import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

let scene, camera, renderer;
let leftController, rightController;
let leftPreviousPosition = null;
let rightPreviousPosition = null;
let previousTimestamp = null;
let cube;
let leftStartTime = null,
  rightStartTime = null;
let leftStartPosition = null,
  rightStartPosition = null;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 3);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Add VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Create a cube (target object)
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 1.5, -1);
  scene.add(cube);

  // Add XR controllers
  leftController = renderer.xr.getController(0);
  rightController = renderer.xr.getController(1);

  // Add visual representation for controllers
  const controllerModel = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  leftController.add(controllerModel.clone());
  rightController.add(controllerModel.clone());

  scene.add(leftController);
  scene.add(rightController);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(time) {
  const session = renderer.xr.getSession();
  if (session) {
    trackController(leftController, "Left", time);
    trackController(rightController, "Right", time);
  }

  renderer.render(scene, camera);
}

function trackController(controller, hand, time) {
  if (!controller || !controller.position) return;

  const position = controller.position.clone();
  const cubePosition = cube.position.clone();
  const distanceToCube = position.distanceTo(cubePosition);

  // Define proximity threshold (adjust as needed)
  const reachThreshold = 0.2;

  if (distanceToCube > reachThreshold) {
    // If hand moves & tracking hasn't started, start tracking
    if (hand === "Left") {
      if (!leftStartTime) {
        leftStartTime = time;
        leftStartPosition = position.clone();
      }
    } else {
      if (!rightStartTime) {
        rightStartTime = time;
        rightStartPosition = position.clone();
      }
    }
  } else {
    // Hand reached the object, calculate speed
    if (hand === "Left" && leftStartTime) {
      const elapsedTime = (time - leftStartTime) / 1000; // Convert to seconds
      const distanceMoved = leftStartPosition.distanceTo(position);
      const speed = distanceMoved / elapsedTime;
      console.log(`Left hand speed to reach cube: ${speed.toFixed(2)} m/s`);
      leftStartTime = null; // Reset for next attempt
    }

    if (hand === "Right" && rightStartTime) {
      const elapsedTime = (time - rightStartTime) / 1000;
      const distanceMoved = rightStartPosition.distanceTo(position);
      const speed = distanceMoved / elapsedTime;
      console.log(`Right hand speed to reach cube: ${speed.toFixed(2)} m/s`);
      rightStartTime = null;
    }
  }
}
