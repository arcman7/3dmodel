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
  const cylinderPrimitive = ModelViewer.utils.mdx.primitives.createCylinder(r, h, 3);
  const cylinderModel =  await ModelViewer.utils.mdx.createPrimitive(viewer, cylinderPrimitive, { texture });
  const cylinderInstance = cylinderModel.addInstance();
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.units.push(new Unit(viewer, cylinderModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(cylinderInstance);
  return cylinderInstance;
}
async function createSphereViewModel(r, texture, pos = [0, 0, 0]) {
  const sherePrimitive = ModelViewer.utils.mdx.primitives.createsphere(r);
  const sphereModel = await ModelViewer.utils.mdx.createPrimitive(viewer, sherePrimitive, { texture });
  const sphereInstance = sphereModel.addInstance();
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.units.push(new Unit(viewer, sphereModel, undefined, mockUnitInfo));
  viewer.worldScene.addInstance(sphereInstance);
  return sphereInstance;
}
// ammo.js 
function setUpRigidBody(opts = { 
  friction: 1,
  rollingFriction: 1,
  pos: { x: 0, y: 0, z: 0 },
  quat: { x: 0, y: 0, z: 0, w: 1}, // rotation
  mass: 1,
  localInertia: [0, 0, 0],
  getShapeFunc: null, // required
}) {
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.z, pos.y ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.z, quat.y, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );

  // let colShape = new Ammo.btSphereShape( radius );
  let colShape = getShapeFunc();
  colShape.setMargin( 0.05 );

  let localInertia = new Ammo.btVector3(...localInertia);
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
  localInertia: [0, 0, 0],
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
  localInertia: [0, 0, 0],
  mdxM3Obj: { 
    setLocation: () => {return;},
    setRotation: () =>{return;},
    physicsBody: null,
  },
}) {
  const { mdxM3Obj } = opts;
  opts.getShapeFunc = () => new Ammo.btShereShape(radius)
  const body = setUpRigidBody(opts);
  mdxM3Obj.physicsBody = body;
  physicsWorld.addRigidBody(body);
  window.rigidBodies.push(mdxM3Obj);
  return body;
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
  const zCoord = heightAt(pos);
  pos[2] = zCoord;
  const model = window.gruntModel || await getGruntModel(false, false);
  const mockUnitInfo = { "location": pos,"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.units.push(new Unit(viewer, model, undefined, mockUnitInfo));
  let instance = model.addInstance();
  scene.addInstance(instance);
  instance.setLocation(pos);
  return instance
}

function heightAt(location) {
  let corners = viewer.corners;
  let centerOffset = viewer.centerOffset;
  let x = (location[0] - centerOffset[0]) / 128;
  let y = (location[1] - centerOffset[1]) / 128;

  let minY = Math.floor(y),
    maxY = Math.ceil(y),
    minX = Math.floor(x),
    maxX = Math.ceil(x);

  // See if this coordinate is in the map
  if (maxY > 0 && minY < heightMap.length - 1 && maxX > 0 && minX < heightMap[0].length - 1) {
    // See http://gamedev.stackexchange.com/a/24574
    let triZ0 = heightMap[minY][minX].groundHeight,
      triZ1 = heightMap[minY][maxX].groundHeight,
      triZ2 = heightMap[maxY][minX].groundHeight,
      triZ3 = heightMap[maxY][maxX].groundHeight,
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
  console.log('else')
  return 0;
}

(aysnc function setThingsUp() {
  const zCoord = heightAt([0,0]);

})()