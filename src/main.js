import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import RegressionPlane from "./components/regressionPlane";
import Axis from "./components/axis";
import HoverGroup from "./components/hoverGroup";
import ParamsViz from "./components/paramsViz";
import { PARAMS } from "./lib/constants";
import {
  getFov,
  numberToText,
  textToNumber,
  updateFormulaValues,
} from "./lib/utils";

function main() {
  document
    .querySelectorAll(".control")
    .forEach(
      (ctrl) => (ctrl.innerHTML = numberToText(PARAMS[ctrl.id] * 10, ctrl.id))
    );
  let mouseDown = false;
  let isClick = false;
  let controlActive = false;
  let selectedCamera = document.querySelector("#projection-toggle").checked
    ? "perspective"
    : "orthographic";
  let autorotate = document.querySelector("#autorotate-toggle").checked;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canvas = document.querySelector("#viz");

  const formula = document.querySelector("#formula");
  let aspect = canvas.clientWidth / window.innerHeight;
  let canvasBoundingRect = canvas.getBoundingClientRect();
  // init
  const cameras = {
    perspective: new THREE.PerspectiveCamera(getFov(aspect), aspect, 0.1, 100),
    orthographic: new THREE.OrthographicCamera(
      -10,
      10,
      10 / aspect,
      -10 / aspect,
      0.1,
      100
    ),
  };
  cameras.perspective.position.set(20, 0, 20);

  cameras.orthographic.position.set(20, 5, 20);
  let controls = new OrbitControls(cameras[selectedCamera], canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.update();

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xffffff);
  const hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 3);
  const ambLight = new THREE.AmbientLight(0xffffff, 7);
  const dirLight = new THREE.DirectionalLight(0xffffff, 10);
  dirLight.position.set(4, 50, -5);
  dirLight.target.position.set(5, 5, -5);
  scene.add(hemiLight);
  scene.add(ambLight);
  scene.add(dirLight);

  const plotObject = new THREE.Object3D();
  plotObject.position.set(-5, -5, 5);
  scene.add(plotObject);

  const axesGroup = new THREE.Group();
  plotObject.add(axesGroup);

  [0, 1, 2].forEach((d) => {
    const axis = new Axis(d, [0, d == 2 ? -10 : 10], { color: 0x888888 }, 2);
    plotObject.add(axis);
  });

  const paramsViz = new ParamsViz(PARAMS);
  plotObject.add(paramsViz);
  const regPlane = new RegressionPlane(
    PARAMS,
    10,
    {
      opacity: 0.7,
      transparent: true,
      color: 0x666666,
    },
    0xed254e
  );
  plotObject.add(regPlane);

  const hoverGroup = new HoverGroup(0x2497a8);
  plotObject.add(hoverGroup);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.setSize(canvas.clientWidth, canvas.clientWidth, false);
  renderer.setSize(canvas.clientWidth, window.innerHeight, false);
  renderer.setAnimationLoop(animate);

  const labelRenderer = new CSS2DRenderer({
    element: document.getElementById("labels"),
  });
  // labelRenderer.setSize(canvas.clientWidth, canvas.clientWidth);
  labelRenderer.setSize(canvas.clientWidth, window.innerHeight);

  canvas.addEventListener("pointerdown", (e) => {
    if (
      e.pointerType === "touch" &&
      raycaster.intersectObject(regPlane.plane, false).length
    )
      controls.enabled = false;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch") controls.enabled = true;
  });
  canvas.addEventListener("pointermove", getPointerCoords);
  canvas.addEventListener("click", (e) => {
    isClick = true;
    getPointerCoords(e);
  });
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousedown", () => {
    mouseDown = true;
    isClick = false;
  });
  window.addEventListener("mouseup", () => (mouseDown = false));
  formula.querySelectorAll("input").forEach((i) => {
    i.addEventListener("change", updateRegPlane);
  });
  document
    .querySelector("#autorotate-toggle")
    .addEventListener("change", () => (autorotate = !autorotate));

  document
    .querySelector("#projection-toggle")
    .addEventListener("change", (e) => {
      selectedCamera = e.target.checked ? "perspective" : "orthographic";
      controls = new OrbitControls(cameras[selectedCamera], canvas);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.update();
      onWindowResize();
    });

  function readParamsFromInput() {
    const params = { b0: 0, b1: 0, b2: 0, b3: 0 };
    document.querySelectorAll(".control").forEach((i) => {
      if (Object.keys(params).includes(i.id))
        params[i.id] = textToNumber(i.textContent) / 10;
    });
    return params;
  }

  function updateRegPlane() {
    const params = readParamsFromInput();
    regPlane.update(params);
    paramsViz.update(params);
  }

  function onWindowResize() {
    aspect = canvas.clientWidth / window.innerHeight;
    cameras[selectedCamera].top = 10 / aspect;
    cameras[selectedCamera].bottom = -10 / aspect;
    cameras[selectedCamera].aspect = aspect;
    cameras[selectedCamera].fov = getFov(aspect);
    cameras[selectedCamera].updateProjectionMatrix();
    canvasBoundingRect = canvas.getBoundingClientRect();

    renderer.setSize(canvas.clientWidth, window.innerHeight, false);
    labelRenderer.setSize(canvas.clientWidth, window.innerHeight);
  }

  function getPointerCoords(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x =
      ((event.clientX - canvasBoundingRect.left) / canvas.clientWidth) * 2 - 1;
    pointer.y =
      -(
        (event.clientY + window.scrollY - canvasBoundingRect.top) /
        canvas.clientHeight
      ) *
        2 +
      1;
  }

  function animate() {
    if (!mouseDown || isClick) {
      raycaster.setFromCamera(pointer, cameras[selectedCamera]);
      const intersects = raycaster.intersectObject(regPlane.plane, false);
      if (intersects.length) {
        const worldPoint = plotObject.worldToLocal(intersects[0].point);
        hoverGroup.update(worldPoint);
        regPlane.updateSectionLines(worldPoint);
        updateFormulaValues(worldPoint);
        formula.classList.add("show-values");
      } else {
        if (autorotate) scene.rotateY(0.002);
        hoverGroup.hide();
        regPlane.hideSectionLines();
        formula.classList.remove("show-values");
      }
    }
    if (controlActive && autorotate) scene.rotateY(0.002);
    renderer.render(scene, cameras[selectedCamera]);
    labelRenderer.render(scene, cameras[selectedCamera]);
  }

  document.querySelectorAll(".control").forEach((ctrl) => {
    ctrl.addEventListener("pointerdown", (e) => {
      controlActive = true;
      ctrl.setPointerCapture(e.pointerId);
      ctrl.onpointermove = (e) => {
        const delta = e.movementX / (ctrl.id === "b3" ? 100 : 10);

        const currentVal = textToNumber(ctrl.textContent);
        const newVal = currentVal + delta;
        const newTextContent = numberToText(newVal, ctrl.id);

        ctrl.innerHTML = newTextContent;
        updateRegPlane();
      };
    });
    ctrl.addEventListener("pointerup", (e) => {
      controlActive = false;
      ctrl.releasePointerCapture(e.pointerId);
      ctrl.onpointermove = null;
    });
    ctrl.addEventListener("dblclick", () => {
      ctrl.innerHTML = numberToText(0, ctrl.id);
      updateRegPlane();
    });
  });
}

main();
