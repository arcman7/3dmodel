const { vec3, vec4, mat4, quat } = window.glMatrix
// C:\Games\WarCraft III                     (old)
// C:\Program Files (x86)\Warcraft III       (new)

var { ModelViewer, handlers, Scene, Camera } = ModelViewer.default.viewer
// shim methods and variables for custom mdx methods
let vectorHeap = vec3.create();
let vectorHeap2 = vec3.create();
let vectorHeap3 = vec3.create();
let quatHeap = quat.create();
let matHeap = mat4.create();
let VEC3_UNIT_X = vec3.fromValues(1, 0, 0);
let VEC3_UNIT_Y = vec3.fromValues(0, 1, 0);
let VEC3_UNIT_Z = vec3.fromValues(0, 0, 1);
let VEC3_ZERO = vec3.create();
let VEC3_ONE = vec3.fromValues(1, 1, 1);
let QUAT_ZERO = quat.fromValues(0, 0, 0, 0);
let QUAT_DEFAULT = quat.create();

let heap = vec4.create();
Camera.prototype.setRotationAroundAngles = function setRotationAroundAngles(horizontalAngle, verticalAngle, point, length) {
  quat.identity(quatHeap);
  quat.rotateX(quatHeap, quatHeap, verticalAngle);
  quat.rotateZ(quatHeap, quatHeap, horizontalAngle);

  this.setRotationAround(quatHeap, point, length);
}
Camera.prototype.setRotationAround = function setRotationAround(rotation, point, length) {
  this.setRotation(rotation);

  if (length == null) {
    length = vec3.len(vec3.sub(vectorHeap, this.location, point));
  }

  quat.conjugate(quatHeap, quatHeap);
  vec3.copy(vectorHeap, VEC3_UNIT_Z);
  vec3.transformQuat(vectorHeap, vectorHeap, quatHeap);
  vec3.scale(vectorHeap, vectorHeap, length);
  vec3.add(this.location, vectorHeap, point);
}
const v3pos = vec3.create(), v3dir = vec3.create(), v3up = vec3.create(), v3sub = vec3.create();
const m4rot = mat4.create();
const f32rot = new Float32Array(1);


window.canvas = document.getElementById('test');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
window.onresize = () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

var viewer = new ModelViewer(canvas)
viewer.on('error', (errInfo) => {
  const { viewer, error, reason } = errInfo
  console.log(`Error: ${error}, Reason: ${reason}`);
  console.log(errInfo)
});
let scene = viewer.addScene();
scene.camera.move([0, 0, 500]);
scene.camera.move([100, 10, 50]);
viewer.addHandler(handlers.mdx);
viewer.addHandler(handlers.blp);
viewer.addHandler(handlers.dds);
function reforgedPathSolver(path) {
  return "/reforged/" + path;
}
function classicPathSolver(path) {
  return "/classic/" + path;
}

window.model =  null
async function getGrunt(reforged = false, hd = false) {
  const usedSolver = reforged ? reforgedPathSolver : classicPathSolver
  try {
    window.model = await (viewer.load('units/orc/grunt/grunt.mdx', usedSolver, { reforged, hd }))
  } catch (err) {
    console.error(err)
    throw err
  }
  console.log('succeeded, reforged: ', reforged, ' hd: ', hd)
  return model
}

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

getGrunt(true, true).then(() => {
  let instance = model.addInstance();
  scene.addInstance(instance);
  console.log('starting animation frames for grunt');
  window.m = new UIModel({ instance, scene })
})

class UIModel {
  constructor({ instance, scene }) {
    this.yaw = -Math.PI / 2;
    this.pitch = -Math.PI / 4;
    this.distance = 400;
    this.center = vec3.create();
    this.minDistance = 8;
    this.maxDistance = 3000
    this.state = {
      teamColor: 0
    }
    this.canvas = window.canvas

    this.instance = instance
    this.scene = scene
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseWheel = this.onMouseWheel.bind(this)
    this.animate = this.animate.bind(this)
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mousewheel', this.onMouseWheel)

    this.componentDidMount()
  }

  freeCamera() {
    if (this.scene) {
      this.scene.camera.setRotationAroundAngles(this.yaw, this.pitch, this.center, this.distance);
    }
  }

  componentWillUnmount() {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      delete this.frame;
    }
    this.removeEvents();
  }

  onMouseDown(e) {
    document.addEventListener("mousemove", this.onMouseMove, true);
    document.addEventListener("mouseup", this.onMouseUp, true);
    this.dragPos = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }

  onMouseMove(e) {
    if (this.dragPos && this.canvas) {
      const dx = e.clientX - this.dragPos.x,
        dy = e.clientY - this.dragPos.y;
      const dim = (this.canvas.width + this.canvas.height) / 2;
      this.yaw += dx * 2 * Math.PI / dim;
      this.pitch += dy * 2 * Math.PI / dim;
      while (this.yaw > Math.PI) {
        this.yaw -= Math.PI * 2;
      }
      while (this.yaw < -Math.PI) {
        this.yaw += Math.PI * 2;
      }
      this.pitch = Math.min(this.pitch, 0);
      this.pitch = Math.max(this.pitch, -Math.PI);
      this.dragPos = {x: e.clientX, y: e.clientY};

      this.setCamera({target: {value: -1}});
    }
    e.preventDefault();
  }

  onMouseUp(e) {
    delete this.dragPos;
    this.removeEvents();
    e.preventDefault();
  }

  onMouseWheel(e) {
    if (e.deltaY > 0) {
      this.distance = Math.min(this.distance * 1.2, this.maxDistance);
    } else {
      this.distance = Math.max(this.distance / 1.2, this.minDistance);
    }
    this.setCamera({ target: { value: -1 } });
  }

  setCamera(e) {
    let cam = parseInt(e.target.value, 10);
    if (isNaN(cam)) cam = -1;
    this.cam = cam
  }

  setTeamColor(e) {
    let color = parseInt(e.target.value, 10);
    if (isNaN(color)) color = 0;
    this.instance.setTeamColor(color)
  }

  animate(ts) {
    this.frame = requestAnimationFrame(this.animate);
    this.scene.camera.setViewport(...[0, 0, this.canvas.width, this.canvas.height]);

    const model = window.model
    const cam = model.cameras[this.cam];
    if (cam) {
      cam.getPositionTranslation(v3pos, this.instance);
      cam.getTargetTranslation(v3dir, this.instance);
      cam.getRotation(f32rot, this.instance);
      vec3.sub(v3sub, v3dir, v3pos);
      vec3.normalize(v3sub, v3sub);
      mat4.fromRotation(m4rot, f32rot[0], v3sub);
      vec3.set(v3up, 0, 0, 1);
      vec3.transformMat4(v3up, v3up, m4rot);
      const aspect = this.canvas.width / this.canvas.height;
      const vFov = Math.atan(Math.tan(cam.fieldOfView / 2) / aspect) * 2;
      this.scene.camera.perspective(vFov, aspect, cam.nearClippingPlane, cam.farClippingPlane);
      this.scene.camera.moveToAndFace(v3pos, v3dir, v3up);
    } else {
      this.scene.camera.perspective(Math.PI / 4, this.canvas.width / this.canvas.height, this.minDistance, this.maxDistance);
      this.freeCamera();
    }

    this.viewer.updateAndRender();
  }

  modelLoaded(model, index) {
    if (!model) {
      return;
    }
    const instance = this.instance;
    if (model.bounds && model.bounds.radius > 0.05) {
      this.minDistance = Math.min(500, model.bounds.radius * 0.2);
      this.maxDistance = this.minDistance * 1000;
      this.distance = this.minDistance * 10;
    }
    instance.setTeamColor(this.state.teamColor);
    if (model.sequences.length > 0) {
      instance.setSequence(0);
    }
    instance.setSequenceLoopMode(2);
  }

  componentDidMount() {
    if (!this.canvas) {
      return;
    }
    this.viewer = window.viewer;
    this.viewer.gl.clearColor(0.3, 0.3, 0.3, 1);
    
    this.modelLoaded(model, 0);
    this.frame = requestAnimationFrame(this.animate);
  }

  removeEvents() {
    document.removeEventListener("mousemove", this.onMouseMove, true);
    document.removeEventListener("mouseup", this.onMouseUp, true);
  }
}

//inter = setInterval(() => {console.log('seq: ', unitInstance.sequence); }, 150)