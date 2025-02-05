import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';


let scene, camera, renderer, cube, controls;

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
        cube.rotation.y += 0.01;
        cube.rotation.x += 0.005;
        
        renderer.render(scene, camera);
        renderer.xr.enabled = true;
        // controls.update();
    });

}