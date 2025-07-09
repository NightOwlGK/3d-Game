import * as THREE from "three";
import { GLTFLoader, RGBELoader } from "three/examples/jsm/Addons.js";
import CANNON from "cannon";
import gsap from "gsap";

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

const cubeMaterial = new CANNON.Material("cubeMaterial");
const groundMaterial = new CANNON.Material("groundMaterial");



const world = new CANNON.World();
world.gravity.set(0, -9.8, 0);

const contactMaterial = new CANNON.ContactMaterial(
  cubeMaterial,
  groundMaterial,
  {
    friction: 0,
    restitution: 0.0
  }
);


world.addContactMaterial(contactMaterial);


const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});


const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 1.5, 5);
scene.add(camera);


const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 7),
  new THREE.MeshBasicMaterial({ color: "#D3E671" })
);
ground.rotation.x = - Math.PI / 2;
scene.add(ground);

const groundPhyBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
  material: groundMaterial,
});
groundPhyBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundPhyBody);


const rgbeLoader = new RGBELoader();
rgbeLoader.load("assets/images/sky.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
});


const textureLoader = new THREE.TextureLoader();
textureLoader.load("assets/images/wall.jpg", (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = 7;
  const leftEndWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 3.5, 1, 1, 1), new THREE.MeshBasicMaterial({ map: texture }));
  leftEndWall.position.x = -3.5 + 0.05;
  leftEndWall.position.y = 0.3;
  leftEndWall.position.z = 1.75;
  scene.add(leftEndWall);
  const leftEndWallPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.1 / 2, 0.6 / 2, 3.5 / 2)),
    mass: 0,
  });
  leftEndWallPhysic.position.set(
    leftEndWall.position.x,
    leftEndWall.position.y,
    leftEndWall.position.z
  );
  world.addBody(leftEndWallPhysic);

  const middleWall = new THREE.Mesh(new THREE.BoxGeometry((7 - (0.1001 * 2)), 0.6, 0.1, 1, 1, 1), new THREE.MeshBasicMaterial({ map: texture }));
  middleWall.position.set(0, 0.3, (3.5 - 0.05));
  scene.add(middleWall);
  const middleWallPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3((7 - (0.1001 * 2)) / 2, 0.6 / 2, 0.1 / 2)),
    mass: 0,
  });
  middleWallPhysic.position.set(
    middleWall.position.x,
    middleWall.position.y,
    middleWall.position.z,
  );
  world.addBody(middleWallPhysic);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 3.5, 1, 1, 1), new THREE.MeshBasicMaterial({ map: texture }));
  rightWall.position.x = 3.5 - 0.05;
  rightWall.position.y = 0.3;
  rightWall.position.z = 1.75;
  scene.add(rightWall);
  const rightWallPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.1 / 2, 0.6 / 2, 3.5 / 2)),
    mass: 0,
  });
  rightWallPhysic.position.set(
    rightWall.position.x,
    rightWall.position.y,
    rightWall.position.z,
  );
  world.addBody(rightWallPhysic);
});



createAllHouse();


const [cherryTree1, box1] = cherryBlossomTree();
cherryTree1.position.set(-2, 0, -2.5);
box1.position.copy(cherryTree1.position);
world.addBody(box1);
scene.add(cherryTree1);

const [cherryTree2, box2] = cherryBlossomTree();
cherryTree2.position.set(2, 0, -2.5);
box2.position.copy(cherryTree2.position);
world.addBody(box2);
scene.add(cherryTree2);

const [cherryTree3, box3] = cherryBlossomTree();
cherryTree3.position.set(-2, 0, -1);
box3.position.copy(cherryTree3.position);
world.addBody(box3);
scene.add(cherryTree3);

const [cherryTree4, box4] = cherryBlossomTree();
cherryTree4.position.set(2, 0, -1);
box4.position.copy(cherryTree4.position);
world.addBody(box4);
scene.add(cherryTree4);

createAllTress();


const percentage = document.getElementById("percentage-loader");
const widthLoader = document.getElementById("loading-bar");
let modelLoaded = false;
let hero = null;
let IDLE = null;
let WALK = null;
let RUN = null;
let mixer = null;
let heroCube = null;
let heroCubePhysicBody = null;
const gltfLoader = new GLTFLoader();
gltfLoader.load("assets/model/hero.glb", (gltf) => {
  hero = gltf.scene;
  scene.add(hero);
  modelLoaded = true;
  hero.scale.set(0.009, 0.009, 0.009);
  hero.position.set(1.5, 0, 2);
  hero.rotation.y = Math.PI;
  mixer = new THREE.AnimationMixer(hero);
  IDLE = mixer.clipAction(gltf.animations[0]);
  WALK = mixer.clipAction(gltf.animations[3]);
  RUN = mixer.clipAction(gltf.animations[2]);
  IDLE.play();
  heroCube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2, 1, 1, 1), new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0 }));
  scene.add(heroCube);
  heroCube.position.copy(hero.position);
  heroCube.position.y = 0.1;
  heroCubePhysicBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.2 / 2, 0.2 / 2, 0.2 / 2)),
    mass: 1,
    material: cubeMaterial,
  });
  heroCubePhysicBody.position.copy(heroCube.position);
  world.addBody(heroCubePhysicBody);
  heroCubePhysicBody.linearDamping = 0.1;

}, (xhr) => {
  const progress = (xhr.loaded / xhr.total) * 100;
  percentage.innerText = `Loading...  ${progress.toFixed(0)}%`;
  widthLoader.style.width = `${progress.toFixed(0)}%`;

  if (progress > 99) {
    gsap.to("#loading-section", {
      left: "100%",
      duration: 1,
    });
  }

}, (err) => {
  console.log("Something went wrong : " + err);
});



let birds = null;
let birdAnimation = null;
gltfLoader.load("assets/model/birds.glb", (gltf) => {
  console.log(gltf);
  birds = gltf.scene;
  scene.add(birds);
  birds.scale.set(0.2, 0.2, 0.2);
  birdAnimation = new THREE.AnimationMixer(birds);
  const fly = birdAnimation.clipAction(gltf.animations[0]);
  fly.play();
},
);

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});


createInvisibleWall();



const W_KEY = document.getElementById("w-key");
W_KEY.addEventListener('touchstart', () => {
  keyPressed["w"] = true;
});
W_KEY.addEventListener('touchend', () => {
  keyPressed["w"] = false;
});

const A_KEY = document.getElementById("a-key");
A_KEY.addEventListener('touchstart', () => {
  keyPressed["a"] = true;
});
A_KEY.addEventListener('touchend', () => {
  keyPressed["a"] = false;
});

const S_KEY = document.getElementById("s-key");
S_KEY.addEventListener('touchstart', () => {
  keyPressed["s"] = true;
});
S_KEY.addEventListener('touchend', () => {
  keyPressed["s"] = false;
});

const D_KEY = document.getElementById("d-key");
D_KEY.addEventListener('touchstart', () => {
  keyPressed["d"] = true;
});
D_KEY.addEventListener('touchend', () => {
  keyPressed["d"] = false;
});

const SHIFT_KEY = document.getElementById("shift-key");
SHIFT_KEY.addEventListener('touchstart', () => {
  keyPressed["shift"] = true;
});
SHIFT_KEY.addEventListener('touchend', () => {
  keyPressed["shift"] = false;
});



const keyPressed = {};
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keyPressed[key] = true;
});
window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keyPressed[key] = false;
});



let currentAction = null;
function changeAnimation(newAction) {
  if (currentAction !== newAction) {
    if (currentAction) {
      currentAction.fadeOut(0.2);
    }
    newAction.reset().fadeIn(0.2).play();
    currentAction = newAction;
  }
}



const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));



const clock = new THREE.Clock();
let oldTime = 0;
let birdAngle = 0;
let birdHeight = 1;
let birdRadius = 3;
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const delta = elapsedTime - oldTime;
  oldTime = elapsedTime;
  world.step(1 / 60, delta, 3);


  if (birdAnimation) {
    birdAnimation.update(delta);
  }

  if (birds !== null) {
    birdAngle += 0.01;

    const x = birdRadius * Math.sin(birdAngle);
    const z = birdRadius * Math.cos(birdAngle);

    birds.position.set(x, birdHeight, z);
    const dx = -birdRadius * Math.cos(birdAngle);
    const dz = birdRadius * Math.sin(birdAngle);
    const yaw = Math.atan2(dx, dz);
    birds.rotation.y = yaw;
  }


  if (modelLoaded) {
    if (mixer !== null) { mixer.update(delta); }

    heroCube.position.set(
      heroCubePhysicBody.position.x,
      heroCubePhysicBody.position.y,
      heroCubePhysicBody.position.z
    );
    hero.position.set(heroCube.position.x, heroCube.position.y - 0.1, heroCube.position.z);
    updateCamera();
    updateCharacterMovement();

  }


  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();



function updateCamera() {
  const heroPosition = heroCube.position.clone();
  const direction = new THREE.Vector3(0, 0, 1).applyEuler(heroCube.rotation);

  const desiredPosition = heroPosition.clone()
    .add(direction.clone().multiplyScalar(-0.5))
    .add(new THREE.Vector3(0, 0.25, 0));

  camera.position.lerp(desiredPosition, 0.1);

  const lookAtTarget = heroPosition.clone().add(cameraLookAtOffset);
  camera.lookAt(lookAtTarget);
}




const baseSpeed = 0.35;
const shiftSpeedMultiplier = 2;
const cameraLookAtOffset = new THREE.Vector3(0, 0.3, 0);

let walk = false;
let run = false;

function updateCharacterMovement() {
  let moveX = 0;
  let moveZ = 0;

  if (keyPressed["w"]) moveZ -= 1;
  if (keyPressed["s"]) moveZ += 1;
  if (keyPressed["a"]) moveX -= 1;
  if (keyPressed["d"]) moveX += 1;

  const length = Math.hypot(moveX, moveZ);
  if (length > 0) {
    moveX /= length;
    moveZ /= length;
  }

  walk = moveX !== 0 || moveZ !== 0;
  run = walk && keyPressed["shift"];

  const currentSpeed = run ? baseSpeed * shiftSpeedMultiplier : baseSpeed;

  heroCubePhysicBody.velocity.x = moveX * currentSpeed;
  heroCubePhysicBody.velocity.z = moveZ * currentSpeed;

  if (length > 0) {
    const angle = Math.atan2(moveX, moveZ);
    heroCube.rotation.y = angle;
    hero.rotation.y = angle;
  }

  if (run) {
    changeAnimation(RUN);
  } else if (walk) {
    changeAnimation(WALK);
  } else {
    changeAnimation(IDLE);
  }

  heroCube.position.copy(heroCubePhysicBody.position);
}




function gardenBrick() {
  const width = 0.3;
  const height = 0.2;
  const radius = 0.05;
  const offsetX = -width / 2;
  const offsetY = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(offsetX + radius, offsetY);
  shape.lineTo(offsetX + width - radius, offsetY);
  shape.quadraticCurveTo(offsetX + width, offsetY, offsetX + width, offsetY + radius);
  shape.lineTo(offsetX + width, offsetY + height - radius);
  shape.quadraticCurveTo(offsetX + width, offsetY + height, offsetX + width - radius, offsetY + height);
  shape.lineTo(offsetX + radius, offsetY + height);
  shape.quadraticCurveTo(offsetX, offsetY + height, offsetX, offsetY + height - radius);
  shape.lineTo(offsetX, offsetY + radius);
  shape.quadraticCurveTo(offsetX, offsetY, offsetX + radius, offsetY);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({ color: 0xff7FA1C3 });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}


function gardenBrickLine(line) {
  const arr1 = [];
  const arr2 = [];
  const group = new THREE.Group();
  for (let i = 0; i < line; i++) {
    arr1.push(gardenBrick());
  }

  for (let i = 0; i < line; i++) {
    arr2.push(gardenBrick());
  }
  let k = 0.1;
  arr1.forEach((element) => {

    element.position.set(0.17, 0.001, -k);
    k += 0.3;
    group.add(element);
  });
  let z = 0.1;
  arr2.forEach((element) => {

    element.position.set(-0.17, 0.001, -z);
    z += 0.3;
    group.add(element);
  });
  return group;

}

const line1 = new gardenBrickLine(12);
scene.add(line1);
const line2 = new gardenBrickLine(10);
line2.position.set(-0.4, 0, -1.75);
line2.rotation.y = Math.PI / 2;
scene.add(line2);
const line3 = new gardenBrickLine(10);
line3.position.set(3.3, 0, -1.75);
line3.rotation.y = Math.PI / 2;
scene.add(line3);




function createAllHouse() {
  const [house1, house1Block] = createHouseType1();
  house1.position.set(-2.5, 0, 1);
  house1Block.position.set(-2.5, 0, 1);
  scene.add(house1);
  world.addBody(house1Block);
  const [house2, house2Block] = createHouseType1();
  house2.position.set(0, 0, 1);
  house2Block.position.set(0, 0, 1);
  scene.add(house2);
  world.addBody(house2Block);
  const [house3, house3Block] = createHouseType1();
  house3.position.set(2.5, 0, 1);
  house3Block.position.set(2.5, 0, 1);
  scene.add(house3);
  world.addBody(house3Block);
  const [house4, house4Block] = createHouseType1();
  house4.position.set(-2.5, 0, 2.9);
  house4Block.position.set(-2.5, 0, 2.9);
  scene.add(house4);
  world.addBody(house4Block);
  const [house5, house5Block] = createHouseType1();
  house5.position.set(0, 0, 2.9);
  house5Block.position.set(0, 0, 2.9);
  scene.add(house5);
  world.addBody(house5Block);
  const [house6, house6Block] = createHouseType1();
  house6.position.set(2.5, 0, 2.9);
  house6Block.position.set(2.5, 0, 2.9);
  scene.add(house6);
  world.addBody(house6Block);
  house4.rotation.y = Math.PI;
  house5.rotation.y = Math.PI;
  house6.rotation.y = Math.PI;
}



function simpleTreeGroup() {
  const simpleTreeGroup = new THREE.Group();
  const tree = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.05, 0.6, 32), new THREE.MeshBasicMaterial({ color: "brown" }));
  const treeCone1 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.25, 10, 1), new THREE.MeshBasicMaterial({ color: "green" }));
  simpleTreeGroup.add(treeCone1);
  const treeCone2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.25, 10, 1), new THREE.MeshBasicMaterial({ color: "green" }));
  simpleTreeGroup.add(treeCone2);
  simpleTreeGroup.add(tree);
  tree.position.y = 0.3;
  treeCone1.position.y = 0.6;
  treeCone2.position.y = 0.4;
  return simpleTreeGroup;
}


function cherryBlossomTree() {
  const cherryBlossomTreeGroup = new THREE.Group();
  const treeBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 32), new THREE.MeshBasicMaterial({ color: "brown" }));
  treeBranch.position.y = 0.35;
  const treeLeaves1 = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshBasicMaterial({ color: "green" }));
  treeLeaves1.position.y = 0.7 + 0.2;
  const treeLeaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: "green" }));
  treeLeaves2.position.set(0.3, 0.7, 0);
  const treeLeaves3 = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: "green" }));
  treeLeaves3.position.set(-0.3, 0.7, 0);
  const treeLeaves4 = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: "green" }));
  treeLeaves4.position.set(0, 0.7, 0.3);
  const treeLeaves5 = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: "green" }));
  treeLeaves5.position.set(0, 0.7, -0.3);
  cherryBlossomTreeGroup.add(treeBranch);
  cherryBlossomTreeGroup.add(treeLeaves1);
  cherryBlossomTreeGroup.add(treeLeaves2);
  cherryBlossomTreeGroup.add(treeLeaves3);
  cherryBlossomTreeGroup.add(treeLeaves4);
  cherryBlossomTreeGroup.add(treeLeaves5);
  const boxTreeBranchPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.15 / 2, 0.7 / 2, 0.15 / 2)),
    mass: 0,
  });
  return [cherryBlossomTreeGroup, boxTreeBranchPhysic];
}



function createHouseType1() {
  const houseGoup1 = new THREE.Group();
  const houseWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2, 1, 1, 1), new THREE.MeshBasicMaterial({ color: "#FAEDCA" }));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.1, 4, 1), new THREE.MeshBasicMaterial({ color: "brown" }));
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.25, 1, 1, 1), new THREE.MeshBasicMaterial({ color: "brown" }));
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 0.1, 1, 1, 1), new THREE.MeshBasicMaterial({ color: "brown" }));
  const window1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, 0.06, 1, 1, 1), new THREE.MeshBasicMaterial({ color: "#BBFBFF" }));
  const window2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, 0.06, 1, 1, 1), new THREE.MeshBasicMaterial({ color: "#BBFBFF" }));
  window1.rotation.z = Math.PI / 2;
  window1.position.x = -0.1;
  window1.position.y = 0.23;
  window2.rotation.z = Math.PI / 2;
  window2.position.x = 0.1;
  window2.position.y = 0.23;
  door.rotation.x = Math.PI / 2;
  door.position.z = 0.1;
  door.position.y = 0.05;
  floor.position.y = 0.15
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.3 + 0.05;
  houseWall.position.y = 0.15 + 0.00001;
  houseGoup1.add(houseWall);
  houseGoup1.add(roof);
  houseGoup1.add(floor);
  houseGoup1.add(door);
  houseGoup1.add(window1);
  houseGoup1.add(window2);
  houseGoup1.scale.set(1.7, 1.7, 1.7);
  const houseBlock = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.5 / 2, 0.5 / 2, 0.5 / 2)),
    mass: 0,
  });
  return [houseGoup1, houseBlock];
}



function createInvisibleWall() {

  const leftEndWallPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.1 / 2, 0.6 / 2, 3.5 / 2)),
    mass: 0,
  });
  leftEndWallPhysic.position.set(-3.5 + 0.05, 0.3, -1.75);
  world.addBody(leftEndWallPhysic);

  const rightEndWallPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(0.1 / 2, 0.6 / 2, 3.5 / 2)),
    mass: 0,
  });
  rightEndWallPhysic.position.set(3.5 - 0.05, 0.3, -1.75);
  world.addBody(rightEndWallPhysic);

  const middleEndWallPhysic = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3((7 - (0.1001 * 2)) / 2, 0.6 / 2, 0.1 / 2)),
    mass: 0,
  });
  middleEndWallPhysic.position.set(0, 0.3, -(3.5 - 0.05));
  world.addBody(middleEndWallPhysic);

}




function createAllTress() {
  const simpleTreeArray1 = [];
  const simpleTreeArray2 = [];
  const simpleTreeArray3 = [];
  const simpleTreeArray4 = [];
  for (let i = 0; i < 18; i++) {
    simpleTreeArray1.push(simpleTreeGroup());
  }
  for (let i = 0; i < 18; i++) {
    simpleTreeArray2.push(simpleTreeGroup());
  }
  for (let i = 0; i < 8; i++) {
    simpleTreeArray3.push(simpleTreeGroup());
  }
  for (let i = 0; i < 8; i++) {
    simpleTreeArray4.push(simpleTreeGroup());
  }
  let spacing1 = 0.1;
  simpleTreeArray1.forEach((element) => {
    element.position.x = (spacing1) - 3.5;
    scene.add(element);
    spacing1 = spacing1 + 0.4;
  });

  createMiddleLineInvisibleTrees(simpleTreeArray1);

  let spacing2 = 0.1;
  simpleTreeArray2.forEach((element) => {
    element.position.x = (spacing2) - 3.5;
    element.position.z = -3.5;
    scene.add(element);
    spacing2 = spacing2 + 0.4;
  });

  let spacing3 = 0.1;
  simpleTreeArray3.forEach((element) => {
    element.position.x = 3.5;
    element.position.z = (spacing3) - 3.25;
    scene.add(element);
    spacing3 = spacing3 + 0.4;
  });

  let spacing4 = 0.1;
  simpleTreeArray4.forEach((element) => {
    element.position.x = -3.5;
    element.position.z = (spacing4) - 3.25;
    scene.add(element);
    spacing4 = spacing4 + 0.4;
  });
}



function createMiddleLineInvisibleTrees(treeArrays) {
  treeArrays.forEach((element) => {
    const treePhysic = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(0.1 / 2, 0.5 / 2, 0.1 / 2)),
      mass: 0,
    })
    treePhysic.position.set(element.position.x, element.position.y + 0.25, element.position.z);
    world.addBody(treePhysic);
  });
}



let aimControl = false;
window.addEventListener("dblclick", () => {
  const fullScreenElement = document.fullscreenElement;
  if (fullScreenElement === null) {
    canvas.requestFullscreen();
    aimControl = true;
  } else {
    document.exitFullscreen();
    aimControl = false;
  }
});

