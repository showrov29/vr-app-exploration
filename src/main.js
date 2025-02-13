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
let backTurnedStartTime = null;
let totalBackTurnedDuration = 0;
let isBackTurned = false;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create text sprite
function createTextSprite(text, options = {}) {
    // Default options
    const {
        position = { x: 0, y: 0, z: 0 },
        scale = { x: 2, y: 1, z: 1 },
        fontSize = 40,
        fontFamily = 'Arial',
        fontWeight = 'bold',
        color = 'white',
        backgroundColor = 'transparent',
        canvasWidth = 256,
        canvasHeight = 128
    } = options;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear background if specified
    if (backgroundColor !== 'transparent') {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Set font style
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    
    // Add text to canvas
    context.fillText(text, canvas.width/2, canvas.height/2);
    
    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Set position and scale
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(scale.x, scale.y, scale.z);
    
    return sprite;
}

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

// Add ambient light for better text visibility
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

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

// Objects to check for gaze detection
const objects = [npcKid];

// Function to calculate height difference
function calculateHeightDifference(playerHeight, npcHeight) {
  const heightDifference = playerHeight - npcHeight;
  console.log(
    `Player Y: ${playerHeight}, NPC Y: ${npcHeight}, Difference: ${heightDifference}`
  );

  let sentiment;
  // Determine sentiment based on height difference
  if (heightDifference > 0.5) {
    sentiment = "Player is looking down at the NPC.";
  } else if (heightDifference < -0.5) {
    sentiment = "Player is looking up at the NPC.";
  } else {
    sentiment = "Player is at eye level with the NPC.";
  }

  return {
    difference: heightDifference,
    sentiment: sentiment
  };
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

function isLookingAtKid() {
  // Get the camera's forward direction
  const cameraForward = new THREE.Vector3(0, 0, -1);
  cameraForward.applyQuaternion(camera.quaternion);

  // Get the direction from the camera to the kid's head (adjust for height)
  const kidHeadPosition = npcKid.position
    .clone()
    .add(new THREE.Vector3(0, 0.9, 0)); // Adjust for the kid's head
  const kidDirection = new THREE.Vector3();
  kidDirection.subVectors(kidHeadPosition, camera.position).normalize();

  // Calculate the dot product to get the cosine of the angle
  const dot = cameraForward.dot(kidDirection);

  // Convert the dot product to an angle in degrees
  const angle = Math.acos(dot) * (180 / Math.PI);

  // Define a threshold angle (e.g., 15 degrees instead of 10)
  const threshold = 15;

  // Check if the angle is within the threshold and the kid is in front of the camera
  if (angle <= threshold && dot > 0) {
    // Ensure the kid is in front of the camera
    return true;
  }

  return false;
}

// Function to check which object the camera is looking at
function getObjectCameraIsLookingAt() {
  const cameraForward = new THREE.Vector3(0, 0, -1);
  cameraForward.applyQuaternion(camera.quaternion);

  let closestObject = null;
  let smallestAngle = Infinity;
  const threshold = 10; // Angle threshold in degrees

  for (const object of objects) {
    const objectDirection = new THREE.Vector3();
    objectDirection.subVectors(object.position, camera.position).normalize();

    const dot = cameraForward.dot(objectDirection);
    const angle = Math.acos(dot) * (180 / Math.PI);

    if (angle < threshold && angle < smallestAngle) {
      smallestAngle = angle;
      closestObject = object;
    }
  }

  return closestObject;
}

let prevPlayerPosition = null;
let prevNpcPosition = null;
let prevTimestamp = null;
let speedOfApproach = 0;
let leftControllerSpeed = 0;
let rightControllerSpeed = 0;

// VR Controller Setup
let leftController, rightController;
let leftPreviousPosition = null,
  rightPreviousPosition = null;
let controllerPrevTimestamp = null;

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
function updateControllers(time) {
  const session = renderer.xr.getSession();
  if (session) {
    // Calculate speed for left controller
    if (leftController && leftController.position) {
      const leftPosition = leftController.position;

      if (leftPreviousPosition) {
        const deltaX = leftPosition.x - leftPreviousPosition.x;
        const deltaY = leftPosition.y - leftPreviousPosition.y;
        const deltaZ = leftPosition.z - leftPreviousPosition.z;
        const distanceMoved = Math.sqrt(
          deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
        );

        if (distanceMoved > 0) {
          const deltaTime = (time - controllerPrevTimestamp) / 1000; // Convert to seconds
          const speed = distanceMoved / deltaTime;
          console.log(`Left controller speed: ${speed.toFixed(2)} m/s`);
        }
      }

      leftPreviousPosition = leftPosition.clone();
    }

    // Calculate speed for right controller
    if (rightController && rightController.position) {
      const rightPosition = rightController.position;

      if (rightPreviousPosition) {
        const deltaX = rightPosition.x - rightPreviousPosition.x;
        const deltaY = rightPosition.y - rightPreviousPosition.y;
        const deltaZ = rightPosition.z - rightPreviousPosition.z;
        const distanceMoved = Math.sqrt(
          deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
        );

        if (distanceMoved > 0) {
          const deltaTime = (time - controllerPrevTimestamp) / 1000; // Convert to seconds
          const speed = distanceMoved / deltaTime;
          console.log(`Right controller speed: ${speed.toFixed(2)} m/s`);
        }
      }

      rightPreviousPosition = rightPosition.clone();
    }

    controllerPrevTimestamp = time;
  }
}

// Variable to track the previous state
let isLookingAtNPC = false;

// Create status text sprites
const statusSprites = [];
const statusLabels = [
    'Height Difference:',
    'Proximity:',
    'Speed of Approach:',
    'Eye Contact:',
    'Right Controller Speed:',
    'Left Controller Speed:',
    'Back Turned Duration:'
];

// Create and position sprites
statusLabels.forEach((label, index) => {
    const sprite = createTextSprite(label + ' ---', {
        position: { x: -2, y: 2 - (index * 0.3), z: -3 }, // Vertical spacing
        scale: { x: 4, y: 0.4, z: 1 },
        fontSize: 24,
        color: 'white',
        canvasWidth: 512,
        canvasHeight: 48,
        backgroundColor: 'rgba(0,0,0,0.3)' // Semi-transparent background
    });
    statusSprites.push(sprite);
    scene.add(sprite);
});

// Function to update status text
function updateStatusText(index, value) {
    if (statusSprites[index]) {
        scene.remove(statusSprites[index]);
        statusSprites[index] = createTextSprite(statusLabels[index] + ' ' + value, {
            position: { x: -2, y: 2 - (index * 0.3), z: -3 },
            scale: { x: 4, y: 0.4, z: 1 },
            fontSize: 24,
            color: 'white',
            canvasWidth: 912,
            canvasHeight: 78,
            backgroundColor: 'rgba(0,0,0,0.3)'
        });
        scene.add(statusSprites[index]);
    }
}

// Animation loop
function animate() {
  renderer.setAnimationLoop((timestamp) => {
    // Update playerHead position to match the camera (player's head)
    playerHead.position.copy(camera.position);

    // Eye contact detection using raycasting
    const lookedAtObject = getObjectCameraIsLookingAt();
    const isCurrentlyLookingAtNPC = lookedAtObject === npcKid;

    // Check if the state has changed
    if (isCurrentlyLookingAtNPC !== isLookingAtNPC) {
      if (isCurrentlyLookingAtNPC) {
        console.log("Looking at the NPC.");
        npcKid.children[0].material.color.set(0x00ff00); // Highlight NPC's head
      } else {
        console.log("Not looking at the NPC.");
        npcKid.children[0].material.color.set(0xff0000); // Reset NPC's head color
      }
      isLookingAtNPC = isCurrentlyLookingAtNPC; // Update the previous state
    }

    // Back-turn timer logic
    if (isLookingAtNPC) {
      console.log("Looking at the kid!");
      if (isBackTurned) {
        totalBackTurnedDuration =
          (performance.now() - backTurnedStartTime) / 1000; // Convert to seconds
        console.log(
          `Back was turned for: ${totalBackTurnedDuration.toFixed(2)} seconds`
        );
        backTurnedStartTime = null;
        isBackTurned = false;
      }
    } else {
      console.log("Not looking at the kid");
      if (!isBackTurned) {
        backTurnedStartTime = performance.now();
        isBackTurned = true;
      }
    }

    if (renderer.xr.isPresenting) {
      const playerPosition = playerHead.position.clone();
      const npcPosition = npcKid.position.clone();

      // Calculate speeds and values only if we have previous positions
      if (prevPlayerPosition && prevNpcPosition && prevTimestamp) {
        const timeDelta = (timestamp - prevTimestamp) / 1000; // Convert to seconds

        // Calculate speed of approach
        const prevDistance = prevPlayerPosition.distanceTo(prevNpcPosition);
        const currentDistance = playerPosition.distanceTo(npcPosition);
        speedOfApproach = (prevDistance - currentDistance) / timeDelta;

        // Update controller speeds here if needed
        if (leftController && leftController.position) {
          const leftDelta = leftController.position.distanceTo(leftPreviousPosition);
          leftControllerSpeed = leftDelta / timeDelta;
        }
        if (rightController && rightController.position) {
          const rightDelta = rightController.position.distanceTo(rightPreviousPosition);
          rightControllerSpeed = rightDelta / timeDelta;
        }
      }

      // Store current positions for next frame
      prevPlayerPosition = playerPosition;
      prevNpcPosition = npcPosition;
      prevTimestamp = timestamp;

      // Update status values
      const heightDiffResult = calculateHeightDifference(playerHead.position.y, npcKid.position.y);
      const proximity = calculateProximity(playerHead.position, npcKid.position);
      const gazeDirection = isLookingAtNPC ? "Looking at NPC" : "Not Looking at NPC";
      
      updateStatusText(0, heightDiffResult.difference.toFixed(2) + ' units (' + heightDiffResult.sentiment + ')');
      updateStatusText(1, proximity.distance.toFixed(2) + ' units');
      updateStatusText(2, speedOfApproach.toFixed(2) + ' units/s');
      updateStatusText(3, gazeDirection);
      updateStatusText(4, leftControllerSpeed.toFixed(2) + ' units/s');
      updateStatusText(5, rightControllerSpeed.toFixed(2) + ' units/s');
      updateStatusText(6, totalBackTurnedDuration.toFixed(2) + ' seconds');
    }

    // Update controllers
    updateControllers(timestamp);

    // Render the scene
    renderer.render(scene, camera);
  });
}

animate();
