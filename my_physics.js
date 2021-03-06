window.getEulerAngles = function getEulerAngles(q) {
  function rad2Deg(rad) { return rad * (180 / Math.PI); }
  q = q || viewer.worldScene.camera.rotation;
  const [q0, q1, q2, q3] = q;
  const phi = Math.atan2(2*(q0*q1 + q2*q3), 1 - 2*(q1**2 + q2**2));
  const theta = Math.asin(2*(q0*q2 - q3*q1));
  const psi = Math.atan2(2*(q0*q3 + q1*q2), 1 - 2*(q2**2 + q3**2));
  console.log({ phi: rad2Deg(phi), theta: rad2Deg(theta), psi: rad2Deg(psi) });
  return [phi, theta, psi];
};
window.getQuat = function getQuat(eulerAngles) {
  const [phi, theta, psi] = eulerAngles;
  const { cos, sin } = Math;
  return [
      cos(phi/2)*cos(theta/2)*cos(psi/2) + sin(phi/2)*sin(theta/2)*sin(psi/2),
      sin(phi/2)*cos(theta/2)*cos(psi/2) - cos(phi/2)*sin(theta/2)*sin(psi/2),
      cos(phi/2)*sin(theta/2)*cos(psi/2) + sin(phi/2)*cos(theta/2)*sin(psi/2),
      cos(phi/2)*cos(theta/2)*sin(psi/2) - sin(phi/2)*sin(theta/2)*cos(psi/2)
  ];
};
window.quatMul = function quatMul(q1, q2) {a
  const [w1, x1, y1, z1] = q1;
  const [w2, x2, y2, z2] = q2;
  return [
      (-x1*x2) - (y1*y2) - (z1*z2) + (w1*w2),
      (x1*w2)  + (y1*z2) - (z1*y2) + (w1*x2),
      (-x1*z2) + (y1*w2) + (z1*x2) + (w1*y2),
      (x1*y2)  - (y1*x2) + (z1*w2) + (w1*z2),
  ];
};

class Unit {
  constructor(map, model, row, unit) {
    let instance = model.addInstance();
    instance.move(unit.location);
    // instance.rotateLocal(glMatrix.quat.setAxisAngle(glMatrix.quat.create(), ModelViewer.common.glMatrixAddon.VEC3_UNIT_Z, unit.angle));
    instance.setRotation(unit.rotation);
    instance.scale(unit.scale);
    instance.setTeamColor(unit.player);
    instance.setScene(map.worldScene);
    if (row && row.moveHeight) {
      const heapZ = vec3.create();
      heapZ[2] = row.moveHeight;
      instance.move(heapZ);
      instance.setVertexColor([row.red / 255, row.green / 255, row.blue / 255, 1]);
      instance.uniformScale(row.modelScale);
    }
    this.instance = instance;
    this.row = row;
  }
}

class Clock {
  /** autoStart: boolean;
	 * If set, starts the clock automatically when the first update is called.
	 * @default true
	 */
	constructor( autoStart ) {
    this.autoStart = ( autoStart !== undefined ) ? autoStart : true;
    /** startTime: number;
     * When the clock is running, It holds the starttime of the clock.
     * This counted from the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.
     * @default 0
    */
    this.startTime = 0;
    /** oldTime: number
	  * When the clock is running, It holds the previous time from a update.
	  * This counted from the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.
	  * @default 0
	  */
    this.oldTime = 0;
    /** elapsedTime: number;
     * When the clock is running, It holds the time elapsed between the start of the clock to the previous update.
     * This parameter is in seconds of three decimal places.
     * @default 0
    */
		this.elapsedTime = 0;
		this.running = false;
	}

	start() {
    this.startTime = ( typeof performance === 'undefined' ? Date : performance ).now(); // see #10732
		this.oldTime = this.startTime;
		this.elapsedTime = 0;
		this.running = true;
	}

	stop() {
		this.getElapsedTime();
		this.running = false;
		this.autoStart = false;
	}
	/**
	 * Get the seconds passed since the clock started.
	*/
	getElapsedTime() {
		this.getDelta();
		return this.elapsedTime;
	}

  /**
	 * Get the seconds passed since the last call to this method.
	*/
	getDelta() {
		let diff = 0;
		if ( this.autoStart && ! this.running ) {
			this.start();
			return 0;
		}
		if ( this.running ) {
			const newTime = ( typeof performance === 'undefined' ? Date : performance ).now();
			diff = ( newTime - this.oldTime ) / 1000;
			this.oldTime = newTime;
			this.elapsedTime += diff;
		}
		return diff;
	}
}

// variable delcaration
let physicsWorld;
let clock;
// the rigidBodies array will serve as a collection for all 3d rendered objects that have an associated physics object and that should be updated at each render loop.
let rigidBodies = [];
window.rigidBodies = rigidBodies;
// tmpTrans is for temporary ammo.js transform object that we will be reusing.
let tmpTrans;
// this defines the collision groups we’ll be using
let colGroupPlane = 1, colGroupBlackBall = 2, colGroupGreenBall = 4;
const DISABLE_DEACTIVATION = 4;
function setupPhysicsWorld() {
  let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
  dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
  overlappingPairCache    = new Ammo.btDbvtBroadphase(),
  solver                  = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  physicsWorld.setGravity(new Ammo.btVector3(0, 0, -20));

  // I moved clock initialization to here
  clock = new Clock();
}

/* combining code from client/map/index.js and ammojs tutorial */
function renderFrame() {
  //* client/map/index.js
  meter.tick();
  cellsElement.textContent = `Cells: ${viewer.worldScene.visibleCells}`;
  instancesElement.textContent = `Instances: ${viewer.worldScene.visibleInstances}`;
  particlesElement.textContent = `Particles: ${viewer.worldScene.updatedParticles}`;
  // *

  let deltaTime = clock.getDelta();
  //new line of code
  updatePhysics( deltaTime );
  viewer.updateAndRender();
  requestAnimationFrame( renderFrame );
}


function createBlock() {
  let pos = { x: 0, y: 0, z: 0 };
  // let scale = { x: window.mapWidth, y: window.mapDepth, z: 10 };
  // need to invert y and z axis
  let scale = { x: window.mapWidth, y: window.mapDepth, z: 1 };
  console.log('map/block scale: ', scale)
  console.log('created at origin: ', pos)
  let quat = { x: 0, y: 0, z: 0, w: 1 };
  let mass = 0;

  //mdx-m3-viewer section
  /* dont need to do anything, wc3 map is already loaded */


  //Ammojs Section
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );

  let colShape = new Ammo.btBoxShape(new Ammo.btVector3( scale.x , scale.y , scale.z  ) );
  colShape.setMargin( 0.05 );

  let localInertia = new Ammo.btVector3( 0, 0, 0 );
  colShape.calculateLocalInertia( mass, localInertia );

  let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
  let body = new Ammo.btRigidBody( rbInfo );
  const friction = 1;
  body.setFriction(friction);

  // body belongs to group 'colGroupPlane' and collides with 'colGroupBlackBall'
  // physicsWorld.addRigidBody( body, colGroupPlane, colGroupBlackBall );
  physicsWorld.addRigidBody( body );
  // body.setActivationState(DISABLE_DEACTIVATION); // freezes object
}


async function createBall() {
  let pos = {x: 0, y: 0, z: 150};
  let radius = 20;
  // let radius = 2;
  let quat = {x: 0, y: 0, z: 0, w: 1};
  let mass = 5;

  //mdx-m3-viewer Section
  // window.texture = viewer.load('textures/shockwave_ice1.blp');
  window.texture = viewer.load('textures/soccer.blp');
  window.spherePrimitive = ModelViewer.utils.mdlx.primitives.createSphere(20,20,20);
  window.sphereModel = await ModelViewer.utils.mdlx.createPrimitive(viewer, spherePrimitive , { texture });
  window.sphereInstance = sphereModel.addInstance();
  // window.Unit = Object.getPrototypeOf(viewer.map.units[0]).constructor;
  window.testUnitInfo = { "location":[0,0,-1000],"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
  viewer.map.units.push(new Unit(viewer, sphereModel , undefined, testUnitInfo ));
  viewer.worldScene.addInstance(sphereInstance);
  sphereInstance.move([pos.x, pos.y, pos.z]);

  //Ammojs Section
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
  transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
  let motionState = new Ammo.btDefaultMotionState( transform );

  let colShape = new Ammo.btSphereShape(20);
  colShape.setMargin( 0.05 );

  let localInertia = new Ammo.btVector3( 0, 0, 0 );
  colShape.calculateLocalInertia( mass, localInertia );

  let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
  let body = new Ammo.btRigidBody( rbInfo );
  body.setFriction(4);
  body.setRollingFriction(10);
  window.ball = window.sphereInstance;
  // body belongs to group 'colGroupBlackBall' and collides with 'colGroupPlane'
  // physicsWorld.addRigidBody( body, colGroupBlackBall, colGroupPlane );
  physicsWorld.addRigidBody( body );
  // body.setActivationState(DISABLE_DEACTIVATION); //freezes object
  ball.physicsBody = body;
  rigidBodies.push(ball);
  return sphereInstance;
}

function createTerrainShape(terrainWidth, terrainDepth) {
  // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
  var heightScale = 1;

  // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
  var upAxis = 2;

  // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
  var hdt = "PHY_FLOAT";

  // Set this to your needs (inverts the triangles)
  var flipQuadEdges = false;

  // Creates height data buffer in Ammo heap
  var ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );
  // var p = 0;
  var p2 = 0;
  const corners = window.viewer.map.corners;
  let terrainMinHeight = corners[0][0].groundHeight;
  let terrainMaxHeight = corners[0][0].groundHeight;
  let h;
  let corner;
  // const centerOffset = window.viewer.map.centerOffset;
  for (let y = 0; y < terrainDepth; y++) {
  // for (let y = terrainDepth - 1; y > -1; y--) {
    for (let x = 0; x < terrainWidth; x++) {
    // for (let x = terrainWidth - 1; x > -1; x--) {
      // write 32-bit float data to memory
      // Ammo.HEAPF32[ammoHeightData + p2 >> 2] = corners[y][x].groundHeight * 128;
      // if (terrainMaxHeight < corners[y][x].groundHeight * 128) {
      //   terrainMaxHeight = corners[y][x].groundHeight * 128
      // }
      // if (terrainMinHeight > corners[y][x].groundHeight * 128) {
      //   terrainMinHeight = corners[y][x].groundHeight * 128
      // }
      Ammo.HEAPF32[ammoHeightData + p2 >> 2] = corners[y][x].groundHeight;
      if (terrainMaxHeight < corners[y][x].groundHeight) {
        terrainMaxHeight = corners[y][x].groundHeight
      }
      if (terrainMinHeight > corners[y][x].groundHeight) {
        terrainMinHeight = corners[y][x].groundHeight
      }
      // corner = corners[y][x]
      // h = heightAt([x * 128 + centerOffset[0], y * 128 + centerOffset[1]])
      // Ammo.HEAPF32[ammoHeightData + p2 >> 2] = h /// 128;
      // console.log(h, h/8)
      // Ammo.HEAPF32[ammoHeightData + p2 >> 2] = corners[y][x].groundHeight;
      // if (terrainMaxHeight < h) {
      //   terrainMaxHeight = h
      // }
      // if (terrainMinHeight > h) {
      //   terrainMinHeight = h
      // }
      // p ++;

      // 4 bytes/float
      p2 += 4;
    }
  }
  // Creates the heightfield physics shape
  var heightFieldShape = new Ammo.btHeightfieldTerrainShape(

    terrainWidth,
    terrainDepth,
    // terrainDepth,
    // terrainWidth,

    ammoHeightData,

    heightScale,
    terrainMinHeight,
    terrainMaxHeight,

    upAxis,
    hdt,
    flipQuadEdges
  );
  const scaleX = window.mapWidth / (terrainWidth);
  const scaleY = window.mapDepth / (terrainDepth);
  // heightFieldShape.setLocalScaling( new Ammo.btVector3( 128, 128, 128 ) );
  heightFieldShape.setLocalScaling( new Ammo.btVector3(scaleX, scaleY, 128 ) );
  heightFieldShape.setMargin( 0.05 );
  heightFieldShape._terrainMaxHeight = terrainMaxHeight * 128
  heightFieldShape._terrainMinHeight = terrainMinHeight * 128
  window.t = heightFieldShape
  return heightFieldShape;
}

function createPhysicsTerrainShape(terrainWidth, terrainDepth) {
  // Create the terrain body
  groundShape = createTerrainShape(terrainWidth, terrainDepth);
  const terrainMaxHeight = groundShape._terrainMaxHeight;
  const terrainMinHeight = groundShape._terrainMinHeight;
  var groundTransform = new Ammo.btTransform();
  groundTransform.setIdentity();
  const centerOffset = window.viewer.map.centerOffset;
  // Shifts the terrain, since bullet re-centers it on its bounding box.
  // groundTransform.setOrigin( new Ammo.btVector3( 0, ( terrainMaxHeight + terrainMinHeight ) / 2, 0 ) );
  // groundTransform.setOrigin( new Ammo.btVector3( -1*centerOffset[0], -1*centerOffset[1], ( terrainMaxHeight + terrainMinHeight ) / 2 ) );
  // groundTransform.setOrigin( new Ammo.btVector3( 0, 0, ( terrainMaxHeight + terrainMinHeight ) / 2 ) );
  groundTransform.setOrigin( new Ammo.btVector3( -500, 0, ( terrainMaxHeight + terrainMinHeight ) / 2 ) );


  // console.log('using: ',  , ( terrainMaxHeight + terrainMinHeight ) / 2, 0)
  // groundTransform.setOrigin( new Ammo.btVector3( terrainWidth / 2, 0, terrainDepth / 2 ) );
  // groundTransform.setOrigin( new Ammo.btVector3( 0, 0, 0 ) );
  var groundMass = 0;
  var groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
  var groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
  var groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
  groundBody.setFriction(1);
  physicsWorld.addRigidBody( groundBody );
}

function updatePhysics( deltaTime ) {
  // Step world
  physicsWorld.stepSimulation( deltaTime, 10 );
  // Update rigid bodies
  for ( let i = 0; i < rigidBodies.length; i++ ) {
      let mdxM3Obj = rigidBodies[ i ];
      let objAmmo = mdxM3Obj.physicsBody;
      let ms = objAmmo.getMotionState();
      if ( ms ) {
        // strictly controlled by user or other mechanics (not physics)
        if (mdxM3Obj.kinematic) { 
          mdxM3Obj.physicsTmpPos.setValue(...mdxM3Obj.localLocation);
          tmpTrans.setIdentity();
          tmpTrans.setOrigin( mdxM3Obj.physicsTmpPos );
          ms.setWorldTransform(tmpTrans);
        } else {
          ms.getWorldTransform( tmpTrans );
          let p = tmpTrans.getOrigin();
          let q = tmpTrans.getRotation();
          // console.log(Math.round(p.x()), Math.round(p.z()), Math.round(p.y()))
          mdxM3Obj.setLocation([ p.x(), p.y(), p.z() ]);
          mdxM3Obj.setRotation([ q.x(), q.y(), q.z(), q.w() ]);
        }
      }
  }
}

window.rotateZWithMouseCursor = function rotateZWithMouseCursor(unit, angle) {
  const rotationQuat = quat.rotateZ([0,0,0,0], unit.localRotation, angle);
  unit.setRotation(rotationQuat);
};

/*
//http-server -p 3000 --cors
//getFirstUnit(); setArrowKeyListener(); u = unitInstance;
*/
