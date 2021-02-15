/**
 * MDX Library Mods
 *  A number of modications need to made to the mdx code in order to be
 *  used in the context of gaming. They are listed here in the following format:
 *  <file-path>:<line number>:<reason>
 *  For example:
 *  C:\Users\Ryan\projects\3dmodel\mdx-m3-viewer\src\viewer\handlers\w3x\ 85: prevent sequence (animation) override
 */

function heightAt(location) {
    let corners = window.viewer.map.corners;
    let centerOffset = window.viewer.map.centerOffset;
    let x = (location[0] - centerOffset[0]) / 128;
    let y = (location[1] - centerOffset[1]) / 128;
  
    let minY = Math.floor(y),
      maxY = Math.ceil(y),
      minX = Math.floor(x),
      maxX = Math.ceil(x);
  
    // See if this coordinate is in the map
    if (maxY >= 0 && minY < corners.length - 1 && maxX >= 0 && minX < corners[0].length - 1) {
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

let unitType = 'Grunt';
function getFirstUnit(opts = { 'comment(s)': unitType ? unitType : 'bandit' }) {
    // window.viewer = viewer;
    // window.cam = viewer.worldScene.camera;
    const usedKey = Object.keys(opts)[0];
    const n = window.viewer.map.units.length;
    // console.log(viewer.map.units)
    for (let i = 0; i < n; i++) {
        const unit = window.viewer.map.units[i]
        if (unit.row && unit.row[usedKey] === opts[usedKey]) {
            window.unitInstance = unit.instance;
            window.u = window.unitInstance;
            return window.u;
        }
    }
}


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


let usedArrowListener;
function setArrowKeyListener({ camera, unitInstance, walkSpeed = 20 }) {
    console.log('setting up walking listeners');
    const unit = unitInstance || window.unitInstance 
    const cam = camera || window.viewer.worldScene.camera
    let isWalking = false;
    let seqWalk;
    let seqStand;
    unit.userSetSequence = true;
    unit.model.sequences.forEach((seq, i) => {
        if (seq.name.match(/walk/i)) {
            seqWalk = i;
        }
        if (seq.name.match(/stand/i) && seqStand === undefined) {
            seqStand = i;
        }
    });

    const speed = walkSpeed;
    const negSpeed = -1 * walkSpeed;
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
    const quatHeap = window.quatHeap || quat.create();

    cam.onrotate = function(theta, phi) {
        quat.rotateZ(quatHeap, unit.localRotation, theta);
        unit.setRotation(quatHeap);
    }
    function listenForArrow(e) {

        function stopMoving(e) {
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
            unit.setSequence(seqStand);
            isWalking = false;
            document.removeEventListener('keyup', stopMoving);
        }
        let distanceDelta = vec3.create();
        switch (e.keyCode) {
            case 37: // arrow key left
                move(cam.directionX, [0, 0], negSpeed, distanceDelta);
                break;
            case 65: // a key
                move(cam.directionX, [0, 0], negSpeed, distanceDelta);
                break;
            case 38: // arrow key up
                move([0, 0], cam.directionY, speed, distanceDelta);
                break;
            case 87: // w key
                move([0, 0], cam.directionY, speed, distanceDelta);
                break;
            case 39: // arrow key right
                move(cam.directionX, [0, 0], speed, distanceDelta);
                break;
            case 68: // d key
                move(cam.directionX, [0, 0], speed, distanceDelta);
                break; 
            case 40: // arrow key down
                move([0, 0], cam.directionY, negSpeed, distanceDelta);
                break;
            case 83: // s key
                move([0, 0], cam.directionY, negSpeed, distanceDelta);
                break; 
            default:
                console.log("default returning");
                return;
        }
        cam.move(distanceDelta);
        unit.move(distanceDelta);

        var tmp = unit.localLocation
        var zCoord = heightAt(tmp);
        unit.setLocation([tmp[0], tmp[1], zCoord]);
        vec3.set(cam.target, unit.localLocation[0], unit.localLocation[1], unit.localLocation[2]);
        vec3.set(cam.position, cam.location[0], cam.location[1], cam.position[2]);
        cam.ref_update();
        if (!isWalking) {
            // console.log('setting walk sequence: ', seqWalk);
            unit.setSequenceLoopMode(2);
            // unit.setSequenceLoopMode(0);
            unit.setSequence(seqWalk);
            document.addEventListener('keyup', stopMoving);
            isWalking = true;
            unit.isWalking = isWalking;
        }
    }
    document.addEventListener('keydown', listenForArrow);
    window.listenForArrow = listenForArrow;
    function onClick(e) {
        if (e.which === 1 || e.button === 0) {
        //   console.log('Left mouse button at ' + e.clientX + 'x' + e.clientY);
        }
        if (e.which === 2 || e.button === 1) {
        //   console.log('Middle mouse button at ' + e.clientX + 'x' + e.clientY);
          unit.setSequenceLoopMode(2);
          unit.setSequence(1);
        }
        if (e.which === 3 || e.button === 2) {
        //   console.log('Right mouse button at ' + e.clientX + 'x' + e.clientY);
          unit.setSequenceLoopMode(0)
          unit.setSequence(5) // attack;
        }
        if (e.which === 4 || e.button === 3) {
        //   console.log('Backward mouse button at ' + e.clientX + 'x' + e.clientY);
        }
        if (e.which === 5 || e.button === 4) {
        //   console.log('Forward mouse button at ' + e.clientX + 'x' + e.clientY);
        }
    }
    document.addEventListener('mousedown', onClick); 
}
// setArrowKeyListener();

// window.removeEventListener('keydown', window.usedArrowListener)
