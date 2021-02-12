function urlWithParams(src, params) {
  if (params) {
      let entries = Object.entries(params);
      if (entries.length) {
          let encodedParams = entries.map(([key, value]) => `${key}=${value}`).join('&');
          let separator = '&';
          if (src.indexOf('?') === -1) {
              separator = '?';
          }
          return `${src}${separator}${encodedParams}`;
      }
  }
  return src;
}
// function localOrHive(src, params) {
//   src = src.toLowerCase();

//   if (window.location.hostname === '127.0.0.1') {
//     console.log('using local')
//     return urlWithParams(`${'http://127.0.0.1:3000'}/classic/${src}`, params);
//   } else {
//     return `https://www.hiveworkshop.com/data/static_assets/mpq/tft/${src}`;
//   }
// }

function localOrHive(src, params) {
  src = src.toLowerCase();

  if (window.location.hostname === '127.0.0.1') {
    return urlWithParams(`${window.location.origin}/assets?path=${src}`, params);
  } else {
    if (params && params.reforged) {
      return `https://beta.hiveworkshop.com/casc-contents?path=${src}`;
    } else {
      return `https://www.hiveworkshop.com/data/static_assets/mpq/tft/${src}`;
    }
  }
}


ModelViewer = ModelViewer.default;

const common = ModelViewer.common;
const glMatrix = common.glMatrix;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;
const math = glMatrix.math;

function wc3PathSolver(src, params) {
  return localOrHive(src.toLowerCase().replace(/\\/g, '/'), params);
}
function reforgedPathSolver(path, params) {
  return urlWithParams("/reforged/" + path.toLowerCase().replace(/\\/g, '/'), params);
}
function classicPathSolver(path, params) {
  return urlWithParams("/classic/" + path.toLowerCase().replace(/\\/g, '/'), params);
}
const reforged = false;
let canvas = document.getElementById('canvas');
// window.viewer = new ModelViewer.viewer.handlers.War3MapViewer(canvas, reforged ? reforgedPathSolver : classicPathSolver);
window.viewer = new ModelViewer.viewer.handlers.War3MapViewer(canvas, localOrHive);
window.scene = viewer.worldScene;
viewer.solverParams = viewer.solverParams || {};
viewer.solverParams['reforged'] = reforged;
viewer.solverParams['hd'] = reforged;
let statusElement = document.getElementById('status');
statusElement.textContent = 'Initializing the viewer';

let thingsLoading = [];
// use this ref in my_physics.js
window.thingsLoading = thingsLoading;
function updateStatus() {
  if (thingsLoading.length) {
    statusElement.textContent = `Loading ${thingsLoading.join(', ')}`;
  } else {
    statusElement.textContent = '';
  }
}

for (let key of viewer.promiseMap.keys()) {
  let file = key.slice(key.lastIndexOf('/') + 1);

  if (file !== '') {
    thingsLoading.push(file);
  }
}

updateStatus();

viewer.on('loadstart', ({ fetchUrl }) => {
  let file = fetchUrl.slice(fetchUrl.lastIndexOf('/') + 1);

  if (file !== '') {
    thingsLoading.push(file);
    updateStatus();
  }
});

viewer.on('loadend', ({ fetchUrl }) => {
  let file = fetchUrl.slice(fetchUrl.lastIndexOf('/' ) + 1);

  if (file !== '') {
    let index = thingsLoading.indexOf(file);

    if (index !== -1) {
      thingsLoading.splice(index, 1);
      updateStatus();
    }
  }
});

let meter = new FPSMeter({
  position: 'absolute',
  right: '10px',
  top: '10px',
  left: 'calc(100% - 130px)',
  theme: 'transparent',
  heat: 1,
  graph: 1
});

let cellsElement = document.getElementById('cells');
let instancesElement = document.getElementById('instances');
let particlesElement = document.getElementById('particles');

// setupCamera(viewer.worldScene, 3000);

function step() {
  console.log('inside step')
  if (window.stopUsingStep === true) {
    console.log('stop using step')
    return;
  }
  if (viewer.worldScene === undefined && viewer.scenes[0] !== undefined) {
    viewer.worldScene = viewer.scenes[0];
  }
  requestAnimationFrame(step);

  viewer.updateAndRender();
  meter.tick();
  
  cellsElement.textContent = `Cells: ${viewer.visibleCells}`;
  instancesElement.textContent = `Instances: ${viewer.visibleInstances}`;
  particlesElement.textContent = `Particles: ${viewer.updatedParticles}`;
}

function handleDrop(file) { }

document.addEventListener('dragover', e => {
  e.preventDefault();
});

document.addEventListener('dragend', e => {
  e.preventDefault();
});

document.addEventListener('drop', e => {
  e.preventDefault();

  let file = e.dataTransfer.files[0];
  let name = file.name;
  let ext = name.substr(name.lastIndexOf('.')).toLowerCase();

  if (ext === '.w3m' || ext === '.w3x') {
    let reader = new FileReader();

    reader.addEventListener('loadend', e => {
      viewer.loadMap(e.target.result);

      step();
      window.mapLoaded = true;

    });

    reader.readAsArrayBuffer(file);
  }
});
