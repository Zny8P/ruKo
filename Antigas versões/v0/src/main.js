import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js";
import { CONFIG } from "./config.js";
import { NetworkClient } from "./network.js";

const root = document.querySelector("#game");
const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc0bf);
scene.fog = new THREE.Fog(0x9bc0bf, 28, 76);

const camera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.1, 120);
camera.rotation.order = "YXZ";
camera.position.set(0, CONFIG.playerHeight, 7);

const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !isTouch;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdff6ff, 0x4a5546, 2.1));
const sun = new THREE.DirectionalLight(0xfff0cf, 2.6);
sun.position.set(-12, 24, 8);
sun.castShadow = !isTouch;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28; sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28;
scene.add(sun);

const mats = {
  ground: new THREE.MeshStandardMaterial({ color: 0x637d56, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x9a9e94, roughness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x38454a, roughness: 1 }),
  crate: new THREE.MeshStandardMaterial({ color: 0x916a43, roughness: 1 }),
  crateLight: new THREE.MeshStandardMaterial({ color: 0xb88951, roughness: 1 }),
  target: new THREE.MeshStandardMaterial({ color: 0xd9ed76, roughness: .8 }),
  targetDark: new THREE.MeshStandardMaterial({ color: 0x3e5b42, roughness: .9 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf1e9d4, roughness: .9 }),
  weapon: new THREE.MeshStandardMaterial({ color: 0x28343a, roughness: .65, metalness: .35 }),
};

const colliders = [];
function addBox(x, y, z, sx, sy, sz, material, collide = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = !isTouch;
  mesh.receiveShadow = !isTouch;
  scene.add(mesh);
  if (collide) colliders.push({ minX: x-sx/2, maxX: x+sx/2, minZ: z-sz/2, maxZ: z+sz/2, minY: y-sy/2, maxY: y+sy/2, mesh });
  return mesh;
}

// Arena
addBox(0, -0.35, 0, 50, 0.7, 50, mats.ground, false);
addBox(0, 1.5, -25, 50, 3, 1, mats.concrete);
addBox(0, 1.5, 25, 50, 3, 1, mats.concrete);
addBox(-25, 1.5, 0, 1, 3, 50, mats.concrete);
addBox(25, 1.5, 0, 1, 3, 50, mats.concrete);

// Boundary stripes and low-poly cover.
for (let i = -22; i <= 22; i += 4) {
  addBox(i, 0.015, -23.9, 2, .03, .08, mats.targetDark, false);
  addBox(i, 0.015, 23.9, 2, .03, .08, mats.targetDark, false);
}
const cover = [
  [-8, -7, 2.8, 2.4], [7, -8, 3.5, 2], [-11, 4, 2.4, 3.2],
  [10, 5, 3.2, 2.5], [0, -12, 4, 2], [-1, 8, 2.2, 3],
  [15, -1, 2.5, 3], [-16, -9, 2.5, 2.5], [15, 14, 3, 2.5],
  [-14, 15, 3.4, 2.3]
];
for (const [x,z,sx,sz] of cover) {
  addBox(x, .85, z, sx, 1.7, sz, mats.crate);
  addBox(x, 1.72, z, sx + .06, .12, sz + .06, mats.crateLight, false);
  // Decorative crate slats
  addBox(x, .85, z - sz/2 - .012, sx*.82, .08, .035, mats.crateLight, false);
}
for (let i=0; i<22; i++) {
  const x = (Math.random()-.5)*44, z = (Math.random()-.5)*44;
  if (Math.abs(x)<5 && z>0 && z<10) continue;
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.15+Math.random()*.25,0), new THREE.MeshStandardMaterial({color: i%2 ? 0x76856b:0x8b967c, roughness:1}));
  rock.position.set(x,.02,z); rock.rotation.set(Math.random(),Math.random(),Math.random()); rock.scale.y=.45; scene.add(rock);
}

// Simple low-poly target dummy meshes.
const targets = [];
const targetGroup = new THREE.Group();
scene.add(targetGroup);
function createTarget(x,z,index) {
  const group = new THREE.Group();
  group.position.set(x,0,z);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.34,.7,3,5), mats.target);
  body.position.y=1.02; body.castShadow=!isTouch; group.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(.27,1), mats.white);
  head.position.y=1.72; head.castShadow=!isTouch; group.add(head);
  const eyeMat = new THREE.MeshBasicMaterial({color:0x1d2a2c});
  for (const ex of [-.09,.09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.035,6,5),eyeMat);
    eye.position.set(ex,1.75,-.235); group.add(eye);
  }
  const marker = new THREE.Mesh(new THREE.BoxGeometry(.72,.08,.08), mats.targetDark);
  marker.position.y=2.05; group.add(marker);
  group.userData = { index, alive:true, baseX:x, baseZ:z, phase:Math.random()*Math.PI*2, body, head };
  targetGroup.add(group); targets.push(group);
}
const spawnPoints = [[-17,-17],[-8,-18],[4,-18],[17,-15],[-18,0],[18,0],[-17,18],[17,18]];
spawnPoints.slice(0,CONFIG.targetCount).forEach(([x,z],i)=>createTarget(x,z,i));

// Decorative low-poly trees beyond the walls (visible over the boundary in the skybox area).
const treeMat = new THREE.MeshStandardMaterial({color:0x315f4a, roughness:1});
const trunkMat = new THREE.MeshStandardMaterial({color:0x6c5036, roughness:1});
for (let i=0;i<28;i++) {
  const a=i/28*Math.PI*2, r=31+Math.random()*5, x=Math.cos(a)*r,z=Math.sin(a)*r;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,1.2,5),trunkMat);trunk.position.set(x,.6,z);scene.add(trunk);
  const crown=new THREE.Mesh(new THREE.ConeGeometry(1.1+Math.random()*.5,2.8,5),treeMat);crown.position.set(x,2.25,z);crown.rotation.y=Math.random();scene.add(crown);
}

// Placeholder first-person weapon, attached to the camera.
const weapon = new THREE.Group();
const gunBody = new THREE.Mesh(new THREE.BoxGeometry(.19,.17,.55), mats.weapon); weapon.add(gunBody);
const gunTop = new THREE.Mesh(new THREE.BoxGeometry(.13,.075,.28), mats.dark); gunTop.position.set(0,.105,-.04); weapon.add(gunTop);
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.035,.04,.23,7), mats.weapon); barrel.rotation.x=Math.PI/2; barrel.position.set(0,.02,-.36); weapon.add(barrel);
const grip = new THREE.Mesh(new THREE.BoxGeometry(.105,.22,.14), mats.dark); grip.position.set(0,-.16,.08); grip.rotation.x=-.18; weapon.add(grip);
weapon.position.set(.32,-.28,-.56);
camera.add(weapon); scene.add(camera);

// Local player state. Movement is client-side in this prototype; later the server becomes authoritative.
const player = { x:0, z:7, yaw:0, pitch:0, speed:CONFIG.moveSpeed, health:100, score:0, grounded:true, vy:0 };
const keys = new Set();
const input = { moveX:0, moveY:0, firing:false, jumping:false };
let started = false, lastShot = 0, recoil = 0, hitFlash = 0;
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0,0);
const network = new NetworkClient(CONFIG.websocketUrl);
const connectionLabel = document.querySelector("#connection-label");
network.on("connected",()=>{connectionLabel.textContent="CONECTADO";});
network.on("disconnected",()=>{connectionLabel.textContent="DESCONECTADO";});
network.on("offline",()=>{connectionLabel.textContent="MODO DE TESTE";});

function showToast(message, duration=2600) {
  const el=document.querySelector("#toast"); el.textContent=message; el.style.opacity="1";
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.style.opacity=".25",duration);
}
function updateHUD() {
  document.querySelector("#health-number").textContent=Math.max(0,Math.round(player.health));
  document.querySelector("#health-fill").style.width=Math.max(0,player.health)+"%";
  document.querySelector("#score-number").textContent=String(player.score).padStart(2,"0");
}
function collides(x,z,r=.34) {
  if (Math.abs(x)>CONFIG.arenaHalfSize-r-1 || Math.abs(z)>CONFIG.arenaHalfSize-r-1) return true;
  return colliders.some(c => x+r>c.minX && x-r<c.maxX && z+r>c.minZ && z-r<c.maxZ);
}
function movePlayer(dx,dz) {
  // Axis-separated collision response keeps movement sliding along walls.
  if (!collides(player.x+dx,player.z)) player.x+=dx;
  if (!collides(player.x,player.z+dz)) player.z+=dz;
}
function shoot() {
  const now=performance.now();
  if (now-lastShot<210) return;
  lastShot=now; recoil=.075;
  weapon.position.z=-.49;
  raycaster.setFromCamera(center,camera);
  const alive=targets.filter(t=>t.userData.alive);
  const intersections=raycaster.intersectObjects(alive.flatMap(t=>t.children),true);
  if (intersections.length) {
    let object=intersections[0].object;
    let group=object;
    while(group && !group.userData?.alive) group=group.parent;
    if(group?.userData?.alive) {
      group.userData.alive=false;
      group.visible=false;
      player.score++;
      updateHUD();
      document.querySelector(".crosshair").classList.add("hit");
      setTimeout(()=>document.querySelector(".crosshair").classList.remove("hit"),100);
      showToast("ALVO ELIMINADO  +100",1000);
      if(targets.every(t=>!t.userData.alive)) {
        document.querySelector("#mission-subtitle").textContent="Todos os alvos eliminados. Protótipo concluído!";
        showToast("ARENA LIMPA — RECARREGUE A PÁGINA PARA REINICIAR",4000);
      }
    } else showToast("DISPARO REGISTRADO",500);
  } else showToast("ALVO NÃO ATINGIDO",500);
}
function jump() {
  if(player.grounded) { player.vy=5.2; player.grounded=false; }
}

function setLook(dx,dy) {
  player.yaw -= dx*CONFIG.lookSensitivity;
  player.pitch -= dy*CONFIG.lookSensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch,-1.25,1.25);
}
function updateCamera(dt) {
  camera.position.set(player.x, CONFIG.playerHeight, player.z);
  camera.rotation.set(player.pitch,player.yaw,0,"YXZ");
  recoil=Math.max(0,recoil-dt*.4);
  weapon.position.z=THREE.MathUtils.lerp(weapon.position.z,-.56,Math.min(1,dt*18));
  weapon.position.y=-.28+Math.sin(performance.now()*.008)*.008;
}

let joyPointer=null, joyOrigin=null;
const joyZone=document.querySelector("#joystick-zone");
const joyBase=document.querySelector("#joystick-base");
const joyThumb=document.querySelector("#joystick-thumb");
function updateJoystick(e) {
  if(joyPointer!==e.pointerId)return;
  const rect=joyBase.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;
  const max=37, length=Math.hypot(dx,dy);
  if(length>max){dx=dx/length*max;dy=dy/length*max;}
  joyThumb.style.transform=`translate(${dx}px,${dy}px)`;
  input.moveX=dx/max;
  input.moveY=dy/max;
}
joyZone.addEventListener("pointerdown",e=>{
  e.preventDefault();joyPointer=e.pointerId;joyZone.setPointerCapture(e.pointerId);updateJoystick(e);
});
joyZone.addEventListener("pointermove",updateJoystick);
function releaseJoystick(e){
  if(joyPointer!==e.pointerId)return;joyPointer=null;input.moveX=0;input.moveY=0;joyThumb.style.transform="translate(0,0)";
}
joyZone.addEventListener("pointerup",releaseJoystick);joyZone.addEventListener("pointercancel",releaseJoystick);

let lookPointer=null,lastLookX=0,lastLookY=0;
renderer.domElement.addEventListener("pointerdown",e=>{
  if(!started)return;
  if(isTouch){
    if(e.clientX<innerWidth*.36 && e.clientY>innerHeight*.55)return;
    lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  } else if(e.button===0 && document.pointerLockElement===renderer.domElement) shoot();
});
renderer.domElement.addEventListener("pointermove",e=>{
  if(isTouch && lookPointer===e.pointerId){
    setLook(e.clientX-lastLookX,e.clientY-lastLookY);
    lastLookX=e.clientX;lastLookY=e.clientY;
  }
});
function releaseLook(e){if(lookPointer===e.pointerId)lookPointer=null;}
renderer.domElement.addEventListener("pointerup",releaseLook);
renderer.domElement.addEventListener("pointercancel",releaseLook);

const fireButton=document.querySelector("#fire-button");
fireButton.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();input.firing=true;shoot();});
for(const ev of ["pointerup","pointercancel","pointerleave"])fireButton.addEventListener(ev,e=>{input.firing=false;});
document.querySelector("#jump-button").addEventListener("pointerdown",e=>{e.preventDefault();jump();});
window.addEventListener("keydown",e=>{
  keys.add(e.code);
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
  if(e.code==="Space")jump();
});
window.addEventListener("keyup",e=>keys.delete(e.code));
window.addEventListener("blur",()=>{keys.clear();input.moveX=0;input.moveY=0;input.firing=false;});
document.addEventListener("mousemove",e=>{
  if(!isTouch && document.pointerLockElement===renderer.domElement && started)setLook(e.movementX,e.movementY);
});
document.addEventListener("contextmenu",e=>e.preventDefault());

document.querySelector("#start-button").addEventListener("click",async()=>{
  started=true;
  document.querySelector("#start-screen").classList.add("hidden");
  if(!isTouch && renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
  // No backend configured yet. The network layer is ready to connect once URL is added in config.js.
  if(CONFIG.networkEnabled && CONFIG.websocketUrl) await network.connect();
  showToast(isTouch?"Use o joystick e deslize à direita para mirar":"WASD para mover · clique para disparar",3500);
});
document.addEventListener("pointerlockchange",()=>{
  if(!isTouch && started && document.pointerLockElement!==renderer.domElement)showToast("Clique na arena para voltar a mirar",1800);
});

let lastTime=performance.now(), networkTimer=0;
function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;
  if(started) {
    let mx=input.moveX,my=input.moveY;
    if(keys.has("KeyA")||keys.has("ArrowLeft"))mx-=1;
    if(keys.has("KeyD")||keys.has("ArrowRight"))mx+=1;
    if(keys.has("KeyW")||keys.has("ArrowUp"))my-=1;
    if(keys.has("KeyS")||keys.has("ArrowDown"))my+=1;
    const mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;}
    const forwardX=-Math.sin(player.yaw),forwardZ=-Math.cos(player.yaw);
    const rightX=Math.cos(player.yaw),rightZ=-Math.sin(player.yaw);
    movePlayer((rightX*mx+forwardX*(-my))*player.speed*dt,(rightZ*mx+forwardZ*(-my))*player.speed*dt);
    if(!player.grounded){player.vy-=14*dt;camera.position.y+=player.vy*dt;if(camera.position.y<=CONFIG.playerHeight){camera.position.y=CONFIG.playerHeight;player.vy=0;player.grounded=true;}}
    if(input.firing && isTouch && now-lastShot>210)shoot();
    networkTimer+=dt;
    if(network.connected && networkTimer>.05){
      networkTimer=0;
      network.emit("input",{moveX:mx,moveY:my,yaw:player.yaw,pitch:player.pitch,fire:input.firing,jump:input.jumping});
    }
  }
  // Idle target bob makes the test targets easier to read.
  for(const t of targets) if(t.userData.alive) {
    t.position.y=.035*Math.sin(now*.002+t.userData.phase);
    t.rotation.y=.12*Math.sin(now*.001+t.userData.phase);
  }
  updateCamera(dt);
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

function resize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.35:1.8));
  renderer.setSize(innerWidth,innerHeight);
}
addEventListener("resize",resize);
updateHUD();

// Tiny debug API for future development, not used by normal gameplay.
window.ZombieRoyale = { scene, camera, player, network, targets, config:CONFIG };
