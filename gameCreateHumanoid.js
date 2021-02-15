const TeamColors = [
  "Red",
  "Blue",
  "Teal",
  "Purple",
  "Yellow",
  "Orange",
  "Green",
  "Pink",
  "Gray",
  "Light Blue",
  "Dark Green",
  "Brown",
  "Maroon",
  "Navy",
  "Turquoise",
  "Violet",
  "Wheat",
  "Peach",
  "Mint",
  "Lavender",
  "Coal",
  "Snow",
  "Emerald",
  "Peanut",
  "Black",
];


async function createCylinderViewModel(r, h, texture, pos = [0, 0, 0]) {
  const cacheIndex = `cylinder-${r},${h}`;
  let cylinderPrimitive;
  if (!window._cache_primitives[cacheIndex]) {
    cylinderPrimitive = ModelViewer.utils.mdlx.primitives.createCylinder(r, h, 2);
    window._cache_primitives[cacheIndex] = cylinderPrimitive;
  } else {
    cylinderPrimitive = window._cache_primitives[cacheIndex];
  }
  let cylinderModel;
  if (!window._cache_models[cacheIndex]) {
    cylinderModel = await ModelViewer.utils.mdlx.createPrimitive(viewer, cylinderPrimitive, { texture });
    window._cache_models[cacheIndex] = cylinderModel;
  } else {
    cylinderModel = window._cache_models[cacheIndex];
  } 
  const cylinderInstance = cylinderModel.addInstance();
  const mockUnitInfo = { "location": [0,0,-1000],"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, cylinderModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(cylinderInstance);
  cylinderInstance.setLocation(pos);
  return cylinderInstance;
}
async function createSphereViewModel(r, texture, pos = [0, 0, 0]) {
  const cacheIndex = `sphere-${r}`;
  let spherePrimitive;
  if (!window._cache_primitives[cacheIndex]) {
    spherePrimitive = ModelViewer.utils.mdlx.primitives.createSphere(r,r,r);
    window._cache_primitives[cacheIndex] = spherePrimitive;
  } else {
    spherePrimitive = window._cache_primitives[cacheIndex];
  }
  let sphereModel;
  if (!window._cache_models[cacheIndex]) {
    sphereModel = await ModelViewer.utils.mdlx.createPrimitive(viewer, spherePrimitive, { texture });
    window._cache_models[cacheIndex] = sphereModel;
  } else {
    sphereModel = window._cache_models[cacheIndex];
  }
  const sphereInstance = sphereModel.addInstance();
  const mockUnitInfo = { "location": [0,0,-1000],"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, sphereModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(sphereInstance);
  sphereInstance.setLocation(pos)
  return sphereInstance;
}
// ammo.js 
function setUpRigidBody(opts = { 
  friction: 1,
  rollingFriction: 5,
  pos: { x: 0, y: 0, z: 0 },
  quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
  mass: 1,
  inertia: [0, 0, 0],
  getShapeFunc: null, // required
}) {
  const { pos, quat, mass, inertia, getShapeFunc, friction, rollingFriction } = opts
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );

  // let colShape = new Ammo.btSphereShape( radius );
  let colShape = getShapeFunc();
  colShape.setMargin( 0.05 );

  localInertia = new Ammo.btVector3(...inertia);
  colShape.calculateLocalInertia( mass, localInertia );

  let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
  let body = new Ammo.btRigidBody( rbInfo );
  body.setFriction(friction);
  body.setRollingFriction(rollingFriction);
  return body;
}
function createPhysicsCylinder(radius, height, userOpts = {}) {
  const opts = {
    kinematic: false,
    friction: 1,
    rollingFriction: 1,
    pos: { x: 0, y: 0, z: 0 },
    quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
    mass: 1,
    inertia: [0, 0, 0],
    mdxM3Obj: { 
      setLocation: () => {return;},
      setRotation: () =>{return;},
      physicsBody: null,
    },
    ...userOpts,
  };
  const { mdxM3Obj } = opts;
  opts.getShapeFunc = () => new Ammo.btCylinderShape(
    new Ammo.btVector3( radius, height * 0.5, radius )
  )
  const body = setUpRigidBody(opts);
  if (opts.kinematic) {
    body.setActivationState( 4 );
    body.setCollisionFlags( 2 );
    mdxM3Obj.physicsTmpPos = new Ammo.btVector3();
    mdxM3Obj.kinematic = true;
  }  else {
    mdxM3Obj.kinematic = false;
  }
  mdxM3Obj.physicsBody = body;
  physicsWorld.addRigidBody(body);
  window.rigidBodies.push(mdxM3Obj);
  return body;
}

function createPhysicsSphere(radius, userOpts = {}) {
  const opts = {
    kinematic: false,
    friction: 1,
    rollingFriction: 1,
    pos: { x: 0, y: 0, z: 0 },
    quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
    mass: 1,
    inertia: [0, 0, 0],
    mdxM3Obj: { 
      setLocation: () => {return;},
      setRotation: () =>{return;},
      physicsBody: null,
    },
    ...userOpts,
  };
  const { mdxM3Obj } = opts;
  opts.getShapeFunc = () => new Ammo.btSphereShape(radius)
  const body = setUpRigidBody(opts);
  mdxM3Obj.physicsBody = body;
  physicsWorld.addRigidBody(body);
  window.rigidBodies.push(mdxM3Obj);
  return body;
}

async function addSphere(radius, texture, pos = [0,0,0], userOpts = {}) {
  userOpts.mdxM3Obj = await createSphereViewModel(radius, texture, pos)
  // sets physics body on mdxM3Obj
  userOpts.pos = { x: pos[0], y: pos[1], z: pos[2] };
  createPhysicsSphere(radius, userOpts);
  return userOpts.mdxM3Obj;
}

async function addCylinder(radius, height, texutre, pos = [0,0,0], userOpts = {}) {
  userOpts.pos = { x: pos[0], y: pos[1], z: pos[2] };
  userOpts.mdxM3Obj = await createCylinderViewModel(radius, height, texture, pos);
  // sets physics body on mdxM3Obj
  createPhysicsCylinder(radius, height, userOpts);
  return userOpts.mdxM3Obj;
}

async function getGruntModel(reforged = false, hd = false) {
  const usedSolver = reforged ? reforgedPathSolver : classicPathSolver
  try {
    window.gruntModel = await (viewer.load('units/orc/grunt/grunt.mdx', usedSolver, { reforged, hd }))
  } catch (err) {
    console.error(err)
    throw err
  }
  console.log('succeeded, reforged: ', reforged, ' hd: ', hd)
  return window.gruntModel
}

async function addGruntUnit(pos = [0, 0, 0], rotation = [0,0,0,1]) {
  console.log('adding grunt unit')
  const model = window.gruntModel || await getGruntModel(false, false);
  const mockUnitInfo = { "location": [0,0,-1000],"rotation":rotation, "angle":rotation, "player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, model, {'comment(s)': 'Grunt'}, mockUnitInfo));
  let instance = model.addInstance();
  viewer.worldScene.addInstance(instance);
  instance.setLocation(pos);
  console.log('about to add physics cylinder')
  createPhysicsCylinder(25, 110, { kinematic: true, mdxM3Obj: instance });
  return instance
}


// Wait for map to load (user must chose a map first)
const prom = new Promise((resolve) => {
  const intervalTimer = setInterval(() => {
    if (window.mapLoaded === true) {
      clearInterval(intervalTimer);
      window.mapWidth = viewer.worldScene.grid.width;
      window.mapDepth = viewer.worldScene.grid.depth;
      resolve();
    }
  }, 50);
});
prom.then(() => {
// Ammojs Initialization
  async function setup() {
    window._cache_primitives = {};
    window._cache_models = {};
    setupCamera(viewer.worldScene, 3000);

    window.stopUsingStep = true;
    tmpTrans = new Ammo.btTransform();
    setupPhysicsWorld();
    // createBlock();
    createPhysicsTerrainShape(...window.viewer.map.mapSize);
    // window.texture = viewer.load('textures/shockwave_ice1.blp');
    window.texture = viewer.load('textures/soccer.blp');
    const pos = [100,0,0];
    const zCoord = heightAt(pos);
    pos[2] = zCoord;
    window.cam = viewer.worldScene.camera;
    var rot = [0,0,0,1];
    // quat.rotateZ(rot, rot, Math.PI);
    window.u = await addGruntUnit(pos, rot);
    window.u.__user_id = 'test';
    // await addSphere(20, window.texture, pos);
    window.b = await createBall();
    renderFrame();
    // getFirstUnit();
    setArrowKeyListener({ unitInstance: window.u });
    quat.rotateZ(rot, rot, Math.PI);
    window.u.setRotation(rot);
  }
  if (!Ammo.ready) {
    Ammo().then(setup);
  } else {
    setup();
  }
});

// extras
function testSpheres(orig = [0,0,0]) {
  for (let i = 0; i < 5; i++) {
    for (let j= 0; j < 5; j++) {
      addSphere(20, texture, [i * 5 + orig[0], j * 5 + orig[1], 50 + orig[2]]);
    }
  }
}