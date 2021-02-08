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


function heightAt(location) {
  let corners = window.viewer.corners;
  let centerOffset = window.viewer.centerOffset;
  let x = (location[0] - centerOffset[0]) / 128;
  let y = (location[1] - centerOffset[1]) / 128;

  let minY = Math.floor(y),
    maxY = Math.ceil(y),
    minX = Math.floor(x),
    maxX = Math.ceil(x);

  // See if this coordinate is in the map
  if (maxY > 0 && minY < corners.length - 1 && maxX > 0 && minX < corners[0].length - 1) {
    // See http://gamedev.stackexchange.com/a/24574
    let triZ0 = corners[minY][minX].groundHeight,
      triZ1 = corners[minY][maxX].groundHeight,
      triZ2 = corners[maxY][minX].groundHeight,
      triZ3 = corners[maxY][maxX].groundHeight,
      sqX = x - minX,
      sqZ = y - minY,
      height;

    if ((sqX + sqZ) < 1) {
      height = triZ0 + (triZ1 - triZ0) * sqX + (triZ2 - triZ0) * sqZ;
    } else {
      height = triZ3 + (triZ1 - triZ3) * (1 - sqZ) + (triZ2 - triZ3) * (1 - sqX);
    }

    return height * 128;
  }
  return 0;
}
// heightAt([0,0,0])

async function createCylinderViewModel(r, h, texture, pos = [0, 0, 0]) {
  const cylinderPrimitive = ModelViewer.utils.mdx.primitives.createCylinder(r, h, 1);
  const cylinderModel =  await ModelViewer.utils.mdx.createPrimitive(viewer, cylinderPrimitive, { texture });
  const cylinderInstance = cylinderModel.addInstance();
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.units.push(new Unit(viewer, cylinderModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(cylinderInstance);
  return cylinderInstance;
}
async function createSphereViewModel(r, texture, pos = [0, 0, 0]) {
  const sherePrimitive = ModelViewer.utils.mdx.primitives.createSphere(r);
  const sphereModel = await ModelViewer.utils.mdx.createPrimitive(viewer, sherePrimitive, { texture });
  const sphereInstance = sphereModel.addInstance();
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.units.push(new Unit(viewer, sphereModel, undefined, mockUnitInfo));
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

async function addGruntUnit(pos = [0, 0, 0]) {
  const model = window.gruntModel || await getGruntModel(false, false);
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1], "angle":[0,0,0,1], "player":0,"scale":[1,1,1] };
  viewer.units.push(new Unit(viewer, model, {'comment(s)': 'Grunt'}, mockUnitInfo));
  let instance = model.addInstance();
  scene.addInstance(instance);
  instance.setLocation(pos);
  return instance
}



async function setThingsUp() {
  const pos = [0,0,0]
  const zCoord = heightAt(pos.slice(0,2));
  pos[2] = zCoord;
  // window.texture = viewer.load('textures/shockwave_ice1.blp');
  window.u = await addGruntUnit(pos);
}