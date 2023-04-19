//import "./styles.css";
import * as THREE from "/libs/three.module.js";

// Setup
let camera, scene, renderer;
let clock;

// Sprite
let spriteSpark;

// Cloud System
let geoCloud, matCloud, cloud, overlayCloud;
let uniformsCloud;

const NUMBER_CLOUD = 2500;
const RADIUS_CLOUD = 400;
const POSITIONS_CLOUD = [];
const SIZES_CLOUD = [];

// Particle System
let geoParticles, matParticles, geoSegments, matSegments, particles, segments;

const NUMBER_PARTICLES = 600;
const RADIUS_PARTICLES = 600;
const SEGMENTS_PARTICLES = NUMBER_PARTICLES * NUMBER_PARTICLES;
const PARTICLES_DATA = []; // Holds characteristics

const POSITIONS_PARTICLES = new Float32Array(NUMBER_PARTICLES * 3);
const POSTITIONS_PARTICLES_PREV = new Float32Array(SEGMENTS_PARTICLES * 3);
const COLOURS_PARTICLES = new Float32Array(SEGMENTS_PARTICLES * 3);

// Multicoloured
let geoMulti, matMulti, multiParticles, uniformsMulti;

const NUMBER_MULTI = 400;
const RADIUS_MULTI = 300;
const POSITIONS_MULTI = [];
const SIZES_MULTI = [];
const COLOURS_MULTI = [];

// Animation

let mixerParticles, clipActionParticles, clipParticles;
let mixerCloud, clipActionCloud, clipCloud;
let mixerOverlayCloud, clipActionOverlayCloud, clipOverlayCloud;
let mixerMulti, clipActionMulti, clipMulti;

/* 
  speed up - done
  red section - done
  createmulticoloured - done
  flashes - done
  opacity - done
  movement - done
  Second cloud layering - try it see what happens
  Try to make the segments curved - might be overlooking something
*/

const ANIMATION_GROUP = new THREE.AnimationObjectGroup();

const LINE_CONTROLLER = {
  showLines: true,
  minDistance: 65,
  limitConnections: false,
  maxConnections: 20,
  particleCount: 600
};

init();
update();

function init() {
  /*------CLOCK------*/
  clock = new THREE.Clock();

  /*-----CAMERA-----*/
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    4000
  );
  camera.position.z = 400;

  /*-----SCENES-----*/
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0001);

  /*-----SPRITE-----*/
  spriteSpark = new THREE.TextureLoader().load("assets/spark1.png");

  /*-----CLOUD-----*/
  addCloudSystem();

  /*-----PARTICLE GROUP-----*/

  addConnections();

  /*-----MULTI COLOURED-----*/

  addMultiColoured();

  /*------ANIMATE-------*/
  animate();

  /*-----RENDERER-----*/

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  /*-----RENDERER-----*/

  window.addEventListener("resize", onWindowResize);
}

function addCloudSystem() {
  geoCloud = new THREE.BufferGeometry();

  uniformsCloud = {
    pointTexture: {
      value: spriteSpark
    }
  };
  matCloud = new THREE.ShaderMaterial({
    uniforms: uniformsCloud,
    vertexShader: document.getElementById("vertexCloud").textContent,
    fragmentShader: document.getElementById("fragmentCloud").textContent,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  });

  for (let i = 0; i < NUMBER_CLOUD; i++) {
    POSITIONS_CLOUD.push((Math.random() * 2 - 1) * RADIUS_CLOUD);
    POSITIONS_CLOUD.push((Math.random() * 2 - 1) * RADIUS_CLOUD);
    POSITIONS_CLOUD.push((Math.random() * 2 - 1) * RADIUS_CLOUD);

    SIZES_CLOUD.push(600);
  }

  geoCloud.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(POSITIONS_CLOUD, 3)
  );
  geoCloud.setAttribute(
    "size",
    new THREE.Float32BufferAttribute(SIZES_CLOUD, 1).setUsage(
      THREE.DynamicDrawUsage
    )
  );

  cloud = new THREE.Points(geoCloud, matCloud);

  scene.add(cloud);
}

function addConnections() {
  matParticles = new THREE.PointsMaterial({
    color: 0x170504,
    size: 40,
    map: spriteSpark,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: false,
    sizeAttenuation: false
  });
  matParticles.color.setHex(0x170504);

  geoParticles = new THREE.BufferGeometry();

  for (let i = 0; i < NUMBER_PARTICLES; i++) {
    const x = Math.random() * RADIUS_PARTICLES - RADIUS_PARTICLES / 2;
    const y = Math.random() * RADIUS_PARTICLES - RADIUS_PARTICLES / 2;
    const z = Math.random() * RADIUS_PARTICLES - RADIUS_PARTICLES / 4;

    POSITIONS_PARTICLES[i * 3] = x;
    POSITIONS_PARTICLES[i * 3 + 1] = y;
    POSITIONS_PARTICLES[i * 3 + 2] = z;

    // add it to the geometry
    PARTICLES_DATA.push({
      velocity: new THREE.Vector3(
        -1 + Math.random() * 8,
        -1 + Math.random() * 8,
        -1 + Math.random() * 8.5
      ),
      numConnections: 0
    });
  }

  geoParticles.setDrawRange(0, NUMBER_PARTICLES);
  geoParticles.setAttribute(
    "position",
    new THREE.BufferAttribute(POSITIONS_PARTICLES, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  );

  // create the particle system
  particles = new THREE.Points(geoParticles, matParticles);
  scene.add(particles);

  ANIMATION_GROUP.add(particles);

  geoSegments = new THREE.BufferGeometry();

  geoSegments.setAttribute(
    "position",
    new THREE.BufferAttribute(POSTITIONS_PARTICLES_PREV, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  );
  geoSegments.setAttribute(
    "color",
    new THREE.BufferAttribute(COLOURS_PARTICLES, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  );

  geoSegments.computeBoundingSphere();

  matSegments = new THREE.LineDashedMaterial({
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    linewidth: 1,
    scale: 1,
    dashSize: 3,
    gapSize: 10
  });

  segments = new THREE.LineSegments(geoSegments, matSegments);

  scene.add(segments);
  ANIMATION_GROUP.add(segments);
}

function addMultiColoured() {
  uniformsMulti = {
    pointTexture: {
      value: spriteSpark
    }
  };

  matMulti = new THREE.ShaderMaterial({
    uniforms: uniformsMulti,
    vertexShader: document.getElementById("vertexMulti").textContent,
    fragmentShader: document.getElementById("fragmentMulti").textContent,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
  });

  geoMulti = new THREE.BufferGeometry();

  const color = new THREE.Color();

  for (let i = 0; i < NUMBER_MULTI; i++) {
    POSITIONS_MULTI.push(Math.random() * RADIUS_MULTI - RADIUS_MULTI / 2);
    POSITIONS_MULTI.push(Math.random() * RADIUS_MULTI - RADIUS_MULTI / 2);
    POSITIONS_MULTI.push(Math.random() * RADIUS_MULTI - RADIUS_MULTI / 2);

    color.setHSL(i / NUMBER_MULTI, 1.0, 0.5);

    COLOURS_MULTI.push(color.r, color.g, color.b);

    SIZES_MULTI.push(80);
  }

  geoMulti.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(POSITIONS_MULTI, 3)
  );
  geoMulti.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(COLOURS_MULTI, 3)
  );
  geoMulti.setAttribute(
    "size",
    new THREE.Float32BufferAttribute(SIZES_MULTI, 1).setUsage(
      THREE.DynamicDrawUsage
    )
  );

  multiParticles = new THREE.Points(geoMulti, matMulti);

  scene.add(multiParticles);
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  // Multicoloured particles
  // SCALE - 8
  const scaleMultiKF = new THREE.VectorKeyframeTrack(
    ".scale",
    [0, 60, 65, 90, 120, 140, 150, 180],
    [
      10,
      10,
      10,
      10,
      10,
      10,
      3.5,
      3.5,
      3.5,
      10,
      10,
      10,
      10,
      10,
      10,
      3.5,
      3.5,
      3.5,
      10,
      10,
      10,
      10,
      10,
      10
    ],
    THREE.InterpolateSmooth
  );

  const positionMultiKF = new THREE.VectorKeyframeTrack(
    ".position",
    [0, 30, 60, 90, 120, 150, 180],
    [
      0,
      0,
      4000,
      0,
      0,
      4000,
      0,
      0,
      4000,
      0,
      0,
      2000,
      0,
      0,
      100,
      0,
      0,
      3000,
      0,
      0,
      4000
    ],
    THREE.InterpolateSmooth
  );

  clipMulti = new THREE.AnimationClip("Action", 180, [
    scaleMultiKF,
    positionMultiKF
  ]);
  mixerMulti = new THREE.AnimationMixer(multiParticles);
  clipActionMulti = mixerMulti.clipAction(clipMulti);

  // Cloud
  // POSITION - 7
  const positionCloudKF = new THREE.VectorKeyframeTrack(
    ".position",
    [0, 30, 60, 90, 120, 150, 180],
    [80, 0, 0, -80, 0, 0, 80, 0, 0, -80, 0, 0, 80, 0, 0, -80, 0, 0, 80, 0, 0],
    THREE.InterpolateSmooth
  );
  // SCALE - 12
  const scaleCloudKF = new THREE.VectorKeyframeTrack(
    ".scale",
    [0, 10, 20, 30, 40, 50, 60, 80, 90, 120, 150, 160, 180],
    [
      4,
      4,
      4,
      4,
      4,
      4,
      0.8,
      0.8,
      0.8,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0.5,
      0.5,
      0.5,
      0.6,
      0.5,
      0.6,
      0.6,
      0.5,
      0.6,
      1,
      1,
      1,
      2,
      2,
      2,
      4,
      4,
      4
    ],
    THREE.InterpolateSmooth
  );

  clipCloud = new THREE.AnimationClip("Action", 180, [
    scaleCloudKF,
    positionCloudKF
  ]);
  mixerCloud = new THREE.AnimationMixer(cloud);
  clipActionCloud = mixerCloud.clipAction(clipCloud);

  // Particles
  // COLOURS - 10
  const colorParticlesKF = new THREE.ColorKeyframeTrack(
    ".material.color",
    [0, 20, 40, 50, 60, 100, 110, 120, 140, 180],
    [
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      0.1,
      1,
      0,
      0
    ],
    THREE.InterpolateSmooth
  );

  // POSITION - 9
  const positionParticlesKF = new THREE.VectorKeyframeTrack(
    ".position",
    [0, 30, 55, 80, 100, 120, 140, 160, 180],
    [
      0,
      0,
      -200,
      0,
      0,
      500,
      0,
      0,
      500,
      0,
      0,
      500,
      0,
      0,
      900,
      0,
      0,
      700,
      0,
      0,
      -200,
      0,
      0,
      -200,
      0,
      0,
      -200
    ],
    THREE.InterpolateSmooth
  );
  // SCALE - 10
  const scaleParticlesKF = new THREE.VectorKeyframeTrack(
    ".scale",
    [0, 30, 65, 70, 100, 110, 120, 140, 160, 180],
    [
      0.75,
      0.7,
      0.75,
      0.75,
      0.7,
      0.1,
      0.75,
      0.7,
      0.1,
      0.75,
      0.7,
      0.1,
      0.75,
      0.7,
      0.1,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      2,
      1,
      1,
      1,
      0.75,
      0.7,
      0.75
    ]
  );

  // OPACITY -  12 - good
  const opacityParticleKF = new THREE.NumberKeyframeTrack(
    ".material.opacity",
    [0, 15, 30, 40, 50, 60, 80, 100, 120, 140, 160, 180],
    [
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ]
  );

  clipParticles = new THREE.AnimationClip("Action", 180, [
    colorParticlesKF,
    positionParticlesKF,
    scaleParticlesKF,
    opacityParticleKF
  ]);
  mixerParticles = new THREE.AnimationMixer(ANIMATION_GROUP);
  clipActionParticles = mixerParticles.clipAction(clipParticles);

  clipActionCloud.play();
  clipActionParticles.play();
  clipActionMulti.play();
}

function update() {
  requestAnimationFrame(update);

  const time = Date.now() * 0.001;
  const delta = clock.getDelta();
  const SIZES_MULTI = geoMulti.attributes.size.array;

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  if (mixerParticles) {
    mixerParticles.update(delta);
  }

  if (mixerCloud) {
    mixerCloud.update(delta);
  }

  if (mixerMulti) {
    mixerMulti.update(delta);
  }

  for (let i = 0; i < NUMBER_MULTI; i++) {
    SIZES_MULTI[i] = 40 * (1 + Math.sin(0.1 * i + time));
  }

  cloud.rotation.x = time * 0.09;
  multiParticles.rotation.x = time * 2.1;

  for (let i = 0; i < NUMBER_PARTICLES; i++) {
    PARTICLES_DATA[i].numConnections = 0;
  }

  for (let i = 0; i < NUMBER_PARTICLES; i++) {
    // get the particle
    const particleData = PARTICLES_DATA[i];

    // Movement
    POSITIONS_PARTICLES[i * 3] += particleData.velocity.x;
    POSITIONS_PARTICLES[i * 3 + 1] += particleData.velocity.y;
    POSITIONS_PARTICLES[i * 3 + 2] += particleData.velocity.z;

    if (
      POSITIONS_PARTICLES[i * 3 + 1] < -(NUMBER_PARTICLES / 2) ||
      POSITIONS_PARTICLES[i * 3 + 1] > NUMBER_PARTICLES / 2
    )
      particleData.velocity.y = -particleData.velocity.y;

    if (
      POSITIONS_PARTICLES[i * 3] < -(NUMBER_PARTICLES / 2) ||
      POSITIONS_PARTICLES[i * 3] > NUMBER_PARTICLES / 2
    )
      particleData.velocity.x = -particleData.velocity.x;

    if (
      POSITIONS_PARTICLES[i * 3 + 2] < -(NUMBER_PARTICLES / 2) ||
      POSITIONS_PARTICLES[i * 3 + 2] > NUMBER_PARTICLES / 2
    )
      particleData.velocity.z = -particleData.velocity.z;

    if (
      LINE_CONTROLLER.limitConnections &&
      particleData.numConnections >= LINE_CONTROLLER.maxConnections
    )
      continue;

    // Check collision
    for (let j = i + 1; j < NUMBER_PARTICLES; j++) {
      const particleDataB = PARTICLES_DATA[j];
      if (
        LINE_CONTROLLER.limitConnections &&
        particleDataB.numConnections >= LINE_CONTROLLER.maxConnections
      )
        continue;

      const dx = POSITIONS_PARTICLES[i * 3] - POSITIONS_PARTICLES[j * 3];
      const dy =
        POSITIONS_PARTICLES[i * 3 + 1] - POSITIONS_PARTICLES[j * 3 + 1];
      const dz =
        POSITIONS_PARTICLES[i * 3 + 2] - POSITIONS_PARTICLES[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < LINE_CONTROLLER.minDistance) {
        particleData.numConnections++;
        particleDataB.numConnections++;

        const alpha = 1.0 - dist / LINE_CONTROLLER.minDistance;

        POSTITIONS_PARTICLES_PREV[vertexpos++] = POSITIONS_PARTICLES[i * 3];
        POSTITIONS_PARTICLES_PREV[vertexpos++] = POSITIONS_PARTICLES[i * 3 + 1];
        POSTITIONS_PARTICLES_PREV[vertexpos++] = POSITIONS_PARTICLES[i * 3 + 2];

        POSTITIONS_PARTICLES_PREV[vertexpos++] = POSITIONS_PARTICLES[j * 3];
        POSTITIONS_PARTICLES_PREV[vertexpos++] = POSITIONS_PARTICLES[j * 3 + 1];
        POSTITIONS_PARTICLES_PREV[vertexpos++] = POSITIONS_PARTICLES[j * 3 + 2];

        COLOURS_PARTICLES[colorpos++] = alpha;
        COLOURS_PARTICLES[colorpos++] = alpha;
        COLOURS_PARTICLES[colorpos++] = alpha;

        COLOURS_PARTICLES[colorpos++] = alpha;
        COLOURS_PARTICLES[colorpos++] = alpha;
        COLOURS_PARTICLES[colorpos++] = alpha;

        numConnected++;
      }
    }
  }

  segments.geometry.setDrawRange(0, numConnected * 2);
  segments.geometry.attributes.position.needsUpdate = true;
  segments.geometry.attributes.color.needsUpdate = true;
  geoMulti.attributes.size.needsUpdate = true;
  particles.geometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
