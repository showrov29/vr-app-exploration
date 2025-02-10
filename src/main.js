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

// Function to create a kid structure for the NPC
function createKidStructure() {
    const npcGroup = new THREE.Group();

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    head.position.set(0, 0.9, 0);
    npcGroup.add(head);

    // Body
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.8, 32),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    body.position.set(0, 0.4, 0);
    npcGroup.add(body);

    // Arms
    const armLength = 0.5;
    const armRadius = 0.05;

    const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(armRadius, armRadius, armLength, 32),
        new THREE.MeshBasicMaterial({ color: 0xffa500 })
    );
    leftArm.position.set(-0.3, 0.4, 0);
    leftArm.rotation.z = Math.PI / 2;
    npcGroup.add(leftArm);

    const rightArm = new THREE.Mesh(
        new THREE.CylinderGeometry(armRadius, armRadius, armLength, 32),
        new THREE.MeshBasicMaterial({ color: 0xffa500 })
    );
    rightArm.position.set(0.3, 0.4, 0);
    rightArm.rotation.z = Math.PI / 2;
    npcGroup.add(rightArm);

    // Legs
    const legLength = 0.4;
    const legRadius = 0.05;

    const leftLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius, legLength, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    leftLeg.position.set(-0.1, -0.2, 0);
    leftLeg.rotation.z = Math.PI / 2;
    npcGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius, legLength, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    rightLeg.position.set(0.1, -0.2, 0);
    rightLeg.rotation.z = Math.PI / 2;
    npcGroup.add(rightLeg);

    return npcGroup;
}

// Create the NPC kid structure
const npcKid = createKidStructure();
npcKid.position.set(0, 0, -3); // Place NPC at a fixed position
scene.add(npcKid);

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

let prevPlayerY = null;

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        // Update playerHead position to match the camera (player's head)
        playerHead.position.copy(camera.position);

        const playerHeight = playerHead.position.y;
        const npcHeight = npcKid.position.y + 0.9; // Adjust for the head position

        // Check if the player's y position has changed
        if (prevPlayerY === null || Math.abs(playerHeight - prevPlayerY) > 0.01) {
            // Calculate height difference and log sentiment
            const heightDifference = calculateHeightDifference(playerHeight, npcHeight);

            // Update previous player y position
            prevPlayerY = playerHeight;
        }

        renderer.render(scene, camera);
    });
}
animate();