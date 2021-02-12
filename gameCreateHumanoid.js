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
  const cylinderPrimitive = ModelViewer.utils.mdlx.primitives.createCylinder(r, h, 1);
  const cylinderModel =  await ModelViewer.utils.mdlx.createPrimitive(viewer, cylinderPrimitive, { texture });
  const cylinderInstance = cylinderModel.addInstance();
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, cylinderModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(cylinderInstance);
  return cylinderInstance;
}
async function createSphereViewModel(r, texture, pos = [0, 0, 0]) {
  const sherePrimitive = ModelViewer.utils.mdlx.primitives.createSphere(r);
  const sphereModel = await ModelViewer.utils.mdlx.createPrimitive(viewer, sherePrimitive, { texture });
  const sphereInstance = sphereModel.addInstance();
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, sphereModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(sphereInstance);
  sphereInstance.setLocation(pos)
  return sphereInstance;
}
// ammo.js 
function setUpRigidBody(opts = { 
  friction: 1,
  rollingFriction: 1,
  pos: { x: 0, y: 0, z: 0 },
  quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
  mass: 1,
  inertia: [0, 0, 0],
  getShapeFunc: null, // required
}) {
  const { pos, quat, mass, inertia, getShapeFunc, friction, rollingFriction } = opts
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.z, pos.y ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.z, quat.y, quat.w ) );
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
function createPhysicsCylinder(radius, height, opts = {
  friction: 1,
  rollingFriction: 1,
  pos: { x: 0, y: 0, z: 0 },
  quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
  mass: 1,
  initia: [0, 0, 0],
  mdxM3Obj: { 
    setLocation: () => {return;},
    setRotation: () =>{return;},
    physicsBody: null,
  },
}) {
  const { mdxM3Obj } = opts;
  opts.getShapeFunc = () => new Ammo.btCylinderShape(
    new Ammo.btVector3( radius, height * 0.5, radius )
  )
  const body = setUpRigidBody(opts);
  mdxM3Obj.physicsBody = body;
  physicsWorld.addRigidBody(body);
  window.rigidBodies.push(mdxM3Obj);
  return body;
}
function createPhysicsSphere(radius, opts = {
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
}) {
  const { mdxM3Obj } = opts;
  opts.getShapeFunc = () => new Ammo.btSphereShape(radius)
  const body = setUpRigidBody(opts);
  mdxM3Obj.physicsBody = body;
  physicsWorld.addRigidBody(body);
  window.rigidBodies.push(mdxM3Obj);
  return body;
}

async function addSphere(radius, texture, pos = [0,0,0], opts = {
  friction: 1,
  rollingFriction: 1,
  pos: { x: pos[0], y: pos[1], z: pos[2] },
  quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
  mass: 1,
  inertia: [0, 0, 0],
}) {
  opts.mdxM3Obj = await createSphereViewModel(radius, texture, pos)
  // sets physics body on mdxM3Obj
  createPhysicsSphere(radius, opts);
  return opts.mdxM3Obj;
}

async function addCylinder(radius, height, texutre, pos = [0,0,0], opts = {
  friction: 1,
  rollingFriction: 1,
  pos: { x: pos[0], y: pos[1], z: pos[2] },
  quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
  mass: 1,
  inertia: [0, 0, 0],
}) {
  opts.mdxM3Obj = await createCylinderViewModel(radius, height, texture, pos);
  // sets physics body on mdxM3Obj
  createPhysicsCylinder(radius, height, opts);
  return opts.mdxM3Obj;

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
  const mockUnitInfo = { "location": pos,"rotation":rotation, "angle":[0,0,0,1], "player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, model, {'comment(s)': 'Grunt'}, mockUnitInfo));
  let instance = model.addInstance();
  viewer.worldScene.addInstance(instance);
  instance.setLocation(pos);
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
    setupCamera(viewer.worldScene, 3000);

    window.stopUsingStep = true;
    tmpTrans = new Ammo.btTransform();
    setupPhysicsWorld();
    // createBlock();
    createPhysicsTerrainShape(...window.viewer.map.mapSize);
    window.texture = viewer.load('textures/shockwave_ice1.blp');
    const pos = [100,0,0];
    const zCoord = heightAt(pos);
    pos[2] = zCoord;
    window.cam = viewer.worldScene.camera;
    const rot = [0,0,0,1];
    quat.rotateZ(rot, rot, Math.PI);
    window.u = await addGruntUnit(pos, rot);
    // await addSphere(20, window.texture, pos);
    await createBall();
    renderFrame();
    getFirstUnit();
    setArrowKeyListener();

  }
  if (!Ammo.ready) {
    Ammo().then(setup);
  } else {
    setup();
  }
  
});