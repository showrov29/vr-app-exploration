import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';


let scene, camera, renderer, cube, controls;
let lookStatusDiv;
let objects = [];
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
  
  document.body.appendChild( VRButton.createButton( renderer ) );

  const controls = new OrbitControls( camera, renderer.domElement );
controls.update();
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Cube
      // Create multiple objects
      const geometry = new THREE.BoxGeometry();
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
      for (let i = 0; i < 5; i++) {
          const material = new THREE.MeshStandardMaterial({ color: colors[i] });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set((i - 2) * 2, 1.6, -5); // Spread objects along the X-axis
          scene.add(cube);
          objects.push(cube); // Add object to the array
      }
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Window resize handler
    window.addEventListener('resize', onWindowResize, false);

    // WebXR session start
    // document.getElementById('vr-button').addEventListener('click', async () => {
    //     if (navigator.xr) {
    //         try {
    //             await renderer.xr.setSession(navigator.xr.requestSession('immersive-vr'));
    //         } catch (e) {
    //             console.error('Failed to start VR session:', e);
    //         }
    //     }
    // });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(function() {
        // Cube animation
        // cube.rotation.y += 0.01;
        // cube.rotation.x += 0.005;
        
        renderer.render(scene, camera);
        renderer.xr.enabled = true;
        // controls.update();

                      // Check which object the camera is looking at
                      const lookedAtObject = getObjectCameraIsLookingAt();

                      // Update status and object colors
                      if (lookedAtObject) {
                        console.log(`Looking at object with color: ${lookedAtObject.material.color.getHexString()}`);
                        
                          // lookStatusDiv.textContent = `Looking at object with color: ${lookedAtObject.material.color.getHexString()}`;
                          objects.forEach(obj => obj.material.color.set(obj === lookedAtObject ? 0xffffff : obj.material.color)); // Highlight the looked-at object
                      } else {
                        console.log("Not looking at any object");
                        
                          // lookStatusDiv.textContent = "Not looking at any object";
                          objects.forEach(obj => obj.material.color.set(obj.material.color)); // Reset colors
                      }
    });

}

function getObjectCameraIsLookingAt() {
  const cameraForward = new THREE.Vector3(0, 0, -1);
  cameraForward.applyQuaternion(camera.quaternion);

  let closestObject = null;
  let smallestAngle = Infinity;
  const threshold = 10; // Angle threshold in degrees

  // Iterate through all objects
  for (const object of objects) {
      const objectDirection = new THREE.Vector3();
      objectDirection.subVectors(object.position, camera.position).normalize();

      // Calculate the angle between the camera's forward direction and the object's direction
      const dot = cameraForward.dot(objectDirection);
      const angle = Math.acos(dot) * (180 / Math.PI);

      // Check if this object is the closest to the camera's forward direction
      if (angle < threshold && angle < smallestAngle) {
          smallestAngle = angle;
          closestObject = object;
      }
  }

  return closestObject;
}