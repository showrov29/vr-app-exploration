import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
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
  console.log(
    `Player Y: ${playerHeight}, NPC Y: ${npcHeight}, Difference: ${heightDifference}`
  );
  // Determine sentiment based on height difference
  if (heightDifference > 0.5) {
    return "Player is looking down at the NPC.";
  } else if (heightDifference < -0.5) {
    return "Player is looking up at the NPC.";
  } else {
    return "Player is at eye level with the NPC.";
  }
}

// Function to calculate proximity
function calculateProximity(playerPosition, npcPosition) {
  const distance = playerPosition.distanceTo(npcPosition);
  // Determine sentiment based on proximity
  let sentiment;
  if (distance < 1.0) {
    sentiment = "Player is very close to the NPC.";
  } else if (distance < 3.0) {
    sentiment = "Player is close to the NPC.";
  } else {
    sentiment = "Player is far from the NPC.";
  }
  return { sentiment, distance };
}

let prevPlayerPosition = null;
let prevNpcPosition = null;
let prevTimestamp = null;

// Animation loop
function animate() {
  renderer.setAnimationLoop((timestamp) => {
    // Update playerHead position to match the camera (player's head)
    playerHead.position.copy(camera.position);
    const playerPosition = playerHead.position;
    const npcPosition = npcKid.position
      .clone()
      .add(new THREE.Vector3(0, 0.9, 0)); // Adjust for the head position

    // Check if the player's position has changed significantly
    if (
      prevPlayerPosition === null ||
      playerPosition.distanceTo(prevPlayerPosition) > 0.01 ||
      npcPosition.distanceTo(prevNpcPosition) > 0.01
    ) {
      const playerHeight = playerPosition.y;
      const npcHeight = npcPosition.y;
      // Calculate height difference and log sentiment
      const heightSentiment = calculateHeightDifference(
        playerHeight,
        npcHeight
      );
      console.log(heightSentiment);
      // Calculate proximity and log sentiment with numeric value
      const { sentiment, distance } = calculateProximity(
        playerPosition,
        npcPosition
      );
      console.log(
        "Proximity :",
        sentiment,
        `Distance: ${distance.toFixed(2)} units`
      );
      // Calculate speed of approach
      if (prevPlayerPosition && prevTimestamp) {
        const deltaTime = (timestamp - prevTimestamp) / 1000; // Convert milliseconds to seconds
        const velocity = new THREE.Vector3()
          .subVectors(playerPosition, prevPlayerPosition)
          .divideScalar(deltaTime); // Velocity vector
        const directionToNPC = new THREE.Vector3()
          .subVectors(npcPosition, playerPosition)
          .normalize(); // Direction from player to NPC
        const speedOfApproach = velocity.dot(directionToNPC); // Project velocity onto directionToNPC
        console.log(
          `Speed of approach: ${speedOfApproach.toFixed(2)} units/second`
        );
      }
      // Update previous positions and timestamp
      prevPlayerPosition = playerPosition.clone();
      prevNpcPosition = npcPosition.clone();
      prevTimestamp = timestamp;
    }

    // Call the render function to calculate controller speeds
    render(timestamp);

    renderer.render(scene, camera);
  });
}

// VR Controller Setup
let leftController, rightController;
let leftPreviousPosition = null,
  rightPreviousPosition = null;

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
leftController.addEventListener("selectstart", () =>
  console.log("Left controller select start")
);
leftController.addEventListener("selectend", () =>
  console.log("Left controller select end")
);
rightController.addEventListener("selectstart", () =>
  console.log("Right controller select start")
);
rightController.addEventListener("selectend", () =>
  console.log("Right controller select end")
);

// Render loop for VR controllers
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
        const distanceMoved = Math.sqrt(
          deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
        );
        if (distanceMoved > 0) {
          // Only log if the controller has moved
          const deltaTime = (time - prevTimestamp) / 1000; // Convert to seconds
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
        const distanceMoved = Math.sqrt(
          deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
        );
        if (distanceMoved > 0) {
          // Only log if the controller has moved
          const deltaTime = (time - prevTimestamp) / 1000; // Convert to seconds
          const speed = distanceMoved / deltaTime;
          console.log(`Right controller speed: ${speed.toFixed(2)} m/s`);
        }
      }
      // Update previous position
      rightPreviousPosition = rightPosition.clone();
    }

    // Update timestamp
    prevTimestamp = time;
  }
}

animate();