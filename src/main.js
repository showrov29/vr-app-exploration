import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable WebXR
renderer.xr.enabled = true;

// Add a button to enter VR mode
document.body.appendChild(VRButton.createButton(renderer));

// Create a simple ground plane
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10).normalize();
scene.add(light);

// Player head (tracked via WebXR)
const playerHead = new THREE.Object3D();
scene.add(playerHead);

// NPC head (static or animated)
const npcHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
npcHead.position.set(0, 1.5, -3); // Place NPC at a fixed position
scene.add(npcHead);

// Function to calculate height difference
function calculateHeightDifference(playerHeight, npcHeight) {
    const heightDifference = playerHeight - npcHeight;

    console.log(`Player Y: ${playerHeight}, NPC Y: ${npcHeight}, Difference: ${heightDifference}`);

    // Determine sentiment based on height difference
    if (heightDifference > 0.5) {
        console.log("Player is looking down at the NPC.");
    } else if (heightDifference < -0.5) {
        console.log("Player is looking up at the NPC.");
    } else {
        console.log("Player is at eye level with the NPC.");
    }

    return heightDifference;
}

// Function to adjust NPC behavior based on sentiment
function adjustNPCBehavior(heightDifference) {
    if (heightDifference > 0.5) {
        console.log("NPC feels intimidated.");
        // Decrease NPC's health meter
    } else if (heightDifference < -0.5) {
        console.log("NPC feels dominant.");
        // Increase NPC's confidence meter
    } else {
        console.log("NPC feels neutral.");
        // Maintain NPC's current state
    }
}

let prevPlayerY = null;

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        // Update playerHead position to match the camera (player's head)
        playerHead.position.copy(camera.position);

        const playerHeight = playerHead.position.y;
        const npcHeight = npcHead.position.y;

        // Check if the player's y position has changed
        if (prevPlayerY === null || Math.abs(playerHeight - prevPlayerY) > 0.01) {
            // Calculate height difference and log sentiment
            const heightDifference = calculateHeightDifference(playerHeight, npcHeight);
            adjustNPCBehavior(heightDifference);

            // Update previous player y position
            prevPlayerY = playerHeight;
        }

        renderer.render(scene, camera);
    });
}
animate();