import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

let scene, camera, renderer, cube, controls;
let xrSession = null;
let referenceSpace = null;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x444444);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // VR Button
  document.body.appendChild(VRButton.createButton(renderer));

  // Controls setup
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Cube
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 1.6, -2);
  scene.add(cube);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Window resize handler
  window.addEventListener('resize', onWindowResize, false);

  // Request a reference space for WebXR
  renderer.xr.addEventListener('sessionstart', (event) => {
    xrSession = renderer.xr.getSession();
    xrSession.requestReferenceSpace('local').then((refSpace) => {
      referenceSpace = refSpace;
    });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop((time, frame) => {
    // Cube animation
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;

    // Check if WebXR frame and reference space are available
    if (frame && referenceSpace) {
      // Get the viewer's pose
      const pose = frame.getViewerPose(referenceSpace);
      if (pose) {
        const view = pose.views[0]; // Assuming single view for simplicity (e.g., AR)
        const position = view.transform.position;
        const orientation = view.transform.orientation;

        console.log("Viewer Pose:");
        console.log(`Position - x: ${position.x}, y: ${position.y}, z: ${position.z}`);
        console.log(`Orientation - x: ${orientation.x}, y: ${orientation.y}, z: ${orientation.z}, w: ${orientation.w}`);
      }
    }

    // Check if the camera is looking at the cube
    if (isLookingAtCube()) {
      console.log("Looking at the cube!");
      cube.material.color.set(0xff0000); // Change cube color to red
    } else {
      console.log("Not looking at the cube");
      cube.material.color.set(0x00ff00); // Reset cube color to green
    }

    renderer.render(scene, camera);
  });
}

function isLookingAtCube() {
  // Get the camera's forward direction
  const cameraForward = new THREE.Vector3(0, 0, -1);
  cameraForward.applyQuaternion(camera.quaternion);

  // Get the direction from the camera to the cube
  const cubeDirection = new THREE.Vector3();
  cubeDirection.subVectors(cube.position, camera.position).normalize();

  // Calculate the dot product to get the cosine of the angle
  const dot = cameraForward.dot(cubeDirection);

  // Convert the dot product to an angle in degrees
  const angle = Math.acos(dot) * (180 / Math.PI);

  // Define a threshold angle (e.g., 10 degrees)
  const threshold = 10;

  // Check if the angle is within the threshold
  return angle <= threshold;
}
