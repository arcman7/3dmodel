/**
 * MDX Library Mods
 *  A number of modications need to made to the mdx code in order to be
 *  used in the context of gaming. They are listed here in the following format:
 *  <file-path>:<line number>:<reason>
 *  For example:
 *  C:\Users\Ryan\projects\3dmodel\mdx-m3-viewer\src\viewer\handlers\w3x\ 85: prevent sequence (animation) override
 */




// window.viewer = viewer;
let unitType = 'Grunt';
function getFirstUnit(opts = { 'comment(s)': unitType ? unitType : 'bandit' }) {
    window.viewer = viewer;
    window.cam = viewer.scenes[0].camera;
    const usedKey = Object.keys(opts)[0];
    const n = window.viewer.units.length;
    for (let i = 0; i < n; i++) {
        const unit = window.viewer.units[i]
        if (unit.row && unit.row[usedKey] === opts[usedKey]) {
            window.unitInstance = unit.instance;
            return;
        }
    }
}
// getFirstUnit();

function vec3Diff(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec4Diff(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
}

function vec3Add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec4Add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

function vec3Mul(a, b) {
    return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
}

function vec4Mul(a, b) {
    return [a[0] * b[0], a[1] * b[1], a[2] * b[2], a[3] * b[3]];
}

function setLocation(cam, unitInstance) {
    const dL = [-288.5068359375, 59.1123046875, 650.3361206054688];
    cam.setLocation(vec3Add(unitInstance.worldLocation, dL));
}
// setLocation();

// function setRotation(cam, unitInstance) {
//     const dr =  [0.29586392641067505, -0.28571242094039917, -0.729546494781971, -0.4804251044988632];
//     cam.setRotation(vec4Add(dr, unitInstance.worldRotation))
// }
// setRotation();
let usedArrowListener;
function setArrowKeyListener(cam = window.cam, unitInstance = window.unitInstance, walkSpeed = 20) {
    console.log('setting up walking listeners');
    getFirstUnit();

    let isWalking = false;
    let seqWalk;
    let seqStand;
    unitInstance.userSetSequence = true;
    unitInstance.model.sequences.forEach((seq, i) => {
        if (seq.name.match(/walk/i)) {
            seqWalk = i;
        }
        if (seq.name.match(/stand/i) && seqStand === undefined) {
            seqStand = i;
        }
    });
    // get euler angles - https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles

    // window.getEulerAngles = function getEulerAngles(q) {
    //     function rad2Deg(rad) { return rad * (180 / Math.PI); }
    //     q = q || viewer.worldScene.camera.rotation;
    //     const [q0, q1, q2, q3] = q;
    //     const phi = Math.atan2(2*(q0*q1 + q2*q3), 1 - 2*(q1**2 + q2**2));
    //     const theta = Math.asin(2*(q0*q2 - q3*q1));
    //     const psi = Math.atan2(2*(q0*q3 + q1*q2), 1 - 2*(q2**2 + q3**2));
    //     console.log({ phi: rad2Deg(phi), theta: rad2Deg(theta), psi: rad2Deg(psi) });
    //     return [phi, theta, psi];
    // };
    // window.getQuat = function getQuat(eulerAngles) {
    //     const [phi, theta, psi] = eulerAngles;
    //     const { cos, sin } = Math;
    //     return [
    //         cos(phi/2)*cos(theta/2)*cos(psi/2) + sin(phi/2)*sin(theta/2)*sin(psi/2),
    //         sin(phi/2)*cos(theta/2)*cos(psi/2) - cos(phi/2)*sin(theta/2)*sin(psi/2),
    //         cos(phi/2)*sin(theta/2)*cos(psi/2) + sin(phi/2)*cos(theta/2)*sin(psi/2),
    //         cos(phi/2)*cos(theta/2)*sin(psi/2) - sin(phi/2)*sin(theta/2)*cos(psi/2)
    //     ];
    // };
    // window.quatMul = function quatMul(q1, q2) {a
    //     const [w1, x1, y1, z1] = q1;
    //     const [w2, x2, y2, z2] = q2;
    //     return [
    //         (-x1*x2) - (y1*y2) - (z1*z2) + (w1*w2),
    //         (x1*w2)  + (y1*z2) - (z1*y2) + (w1*x2),
    //         (-x1*z2) + (y1*w2) + (z1*x2) + (w1*y2),
    //         (x1*y2)  - (y1*x2) + (z1*w2) + (w1*z2),
    //     ];
    // };
    // const speed = [walkSpeed, walkSpeed, 0];
    // const negSpeed = [-walkSpeed, -walkSpeed, 0];
    /*
    getFirstUnit(); setArrowKeyListener(); u = unitInstance;
    */
    const speed = 20;
    const negSpeed = -20;
    window.vecHeap = vec3.create();
    function move(dirX, dirY, moveSpeed, target) {
        // Allow only movement on the XY plane, and scale to moveSpeed.
        vec3.add(target, target,
          vec3.scale(
            vecHeap,
            vec3.normalize(
              vecHeap,
              vec3.set(vecHeap, dirX[0], dirX[1], 0)
            ),
            moveSpeed
          )
        );
        vec3.add(target, target,
          vec3.scale(
            vecHeap,
            vec3.normalize(
              vecHeap,
              vec3.set(vecHeap, dirY[0], dirY[1], 0)
            ),
            moveSpeed
          )
        );
        return target
    }
    function listenForArrow(e) {
        const quatHeap = window.quatHeap || quat.create();

        cam.onrotate = function(theta, phi) {
            quat.rotateZ(quatHeap, unitInstance.localRotation, theta);
            unitInstance.setRotation(quatHeap);
        }

        function stopMoving(e) {
            // if (e.keyCode < 37 || e.keyCode > 40) {
            //     return;
            // }
            switch (e.keyCode) {
                case 37: // arrow key left
                    break;
                case 65: // a key
                    break;
                case 38: // arrow key up
                    break;
                case 87: // w key
                    break;
                case 39: // arrow key right
                    break;
                case 68: // d key
                    break; 
                case 40: // arrow key down
                    break;
                case 83: // s key
                    break; 
                default:
                    console.log("stop moving - default returning");
                    return;
            }
            console.log('setting stand sequence (STOP): ', seqStand);
            unitInstance.setSequence(seqStand);
            isWalking = false;
            console.log('cam postion: ', cam.position)
            console.log('cam target: ', cam.target)
            document.removeEventListener('keyup', stopMoving);
        }
        let distanceDelta = vec3.create();
        switch (e.keyCode) {
            case 37: // arrow key left
                // cam.move(vec3Mul(cam.directionX, negSpeed));
                // unitInstance.move(vec3Mul(cam.directionX, negSpeed));
                move(cam.directionX, [0, 0], negSpeed, distanceDelta);
                cam.move(distanceDelta);
                unitInstance.move(distanceDelta);
                break;
            case 65: // a key
                move(cam.directionX, [0, 0], negSpeed, distanceDelta);
                cam.move(distanceDelta);
                unitInstance.move(distanceDelta);
                break;
            case 38: // arrow key up
                // cam.move(vec3Mul(cam.directionY, speed));
                // unitInstance.move(vec3Mul(cam.directionY, speed));
                move([0, 0], cam.directionY, speed, distanceDelta);
                cam.move(distanceDelta);
                unitInstance.move(distanceDelta);
                break;
            case 87: // w key
                move([0, 0], cam.directionY, speed, distanceDelta);
                cam.move(distanceDelta);
                unitInstance.move(distanceDelta);
                break;
            case 39: // arrow key right
                // cam.move(vec3Mul(cam.directionX, speed));
                // unitInstance.move(vec3Mul(cam.directionX, speed));
                move(cam.directionX, [0, 0], speed, distanceDelta);
                cam.move(distanceDelta)
                unitInstance.move(distanceDelta)
                break;
            case 68: // d key
                move(cam.directionX, [0, 0], speed, distanceDelta);
                cam.move(distanceDelta)
                unitInstance.move(distanceDelta)
                break; 
            case 40: // arrow key down
                // cam.move(vec3Mul(cam.directionY, negSpeed));
                // unitInstance.move(vec3Mul(cam.directionY, negSpeed));
                move([0, 0], cam.directionY, negSpeed, distanceDelta);
                cam.move(distanceDelta);
                unitInstance.move(distanceDelta);
                break;
            case 83: // s key
                move([0, 0], cam.directionY, negSpeed, distanceDelta);
                cam.move(distanceDelta);
                unitInstance.move(distanceDelta);
                break; 
            default:
                console.log("default returning");
                return;
        }
        vec3.set(cam.target, cam.location[0], cam.location[1], 0);
        vec3.set(cam.target, unitInstance.localLocation[0], unitInstance.localLocation[1], 0);
        vec3.set(cam.position, cam.location[0], cam.location[1], cam.position[2]);
        // cam.distance = 410;
        if (!isWalking) {
            console.log('setting walk sequence: ', seqWalk);
            unitInstance.setSequenceLoopMode(2);
            // unitInstance.setSequenceLoopMode(0);
            unitInstance.setSequence(seqWalk);
            document.addEventListener('keyup', stopMoving);
            isWalking = true;
            unitInstance.isWalking = isWalking;
        }
    }
    document.addEventListener('keydown', listenForArrow);
    window.listenForArrow = listenForArrow;
}
// setArrowKeyListener();

// window.removeEventListener('keydown', window.usedArrowListener)
function stuff() {
window.texture = viewer.load('textures/shockwave_ice1.blp');
window.spherePrimitive = ModelViewer.utils.mdx.primitives.createSphere(20,20,20);
(async()=> {
window.sphereModel = await ModelViewer.utils.mdx.createPrimitive(viewer, spherePrimitive , { texture });
window.sphereInstance = sphereModel .addInstance();
window.Unit = Object.getPrototypeOf(viewer.units[0]).constructor;
window.testUnitInfo = { "location":[0,0,100],"rotation":[0,0,0,1],"player":0,"scale":[1,1,1] };
viewer.units.push(new Unit(viewer, sphereModel , undefined, testUnitInfo ));
// viewer.scenes[0].addInstance(sphereInstance)
viewer.worldScene.addInstance(sphereInstance);
sphereInstance.move([0,0,20]);
window.mapWidth = viewer.worldScene.grid.width;
window.mapDepth = viewer.worldScene.grid.depth;
})();
}
window.stuff