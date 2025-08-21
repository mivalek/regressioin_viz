import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export default class ParamsViz extends THREE.Group {
  constructor(params) {
    super();

    const b0Geom = new THREE.ConeGeometry(0.2, 1, 32);
    const b0Material = new THREE.MeshBasicMaterial({ color: 0xffc71f });
    const b0 = new THREE.Mesh(b0Geom, b0Material);
    this.b0 = b0;
    this.add(b0);

    const b1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 1, 0),
    ]);
    const b1Material = new THREE.MeshBasicMaterial({
      color: 0x6699cc,
      side: THREE.DoubleSide,
      opacity: 0.8,
      transparent: true,
      depthTest: false,
    });
    const b1 = new THREE.Mesh(b1Geom, b1Material);
    b1.renderOrder = 7;
    this.b1 = b1;
    this.add(b1);

    const b2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 1, -1),
    ]);
    const b2Material = new THREE.MeshBasicMaterial({
      color: 0xd53545,
      side: THREE.DoubleSide,
      opacity: 0.8,
      transparent: true,
      depthTest: false,
    });
    const b2 = new THREE.Mesh(b2Geom, b2Material);
    b2.renderOrder = 6;
    this.b2 = b2;
    this.add(b2);

    const ghostPlaneGeom = new THREE.BufferGeometry();

    const vertices = new Float32Array([
      0, 0, 0, 0, 0, -10, 10, 0, -10, 10, 0, 0,
    ]);
    ghostPlaneGeom.setIndex([0, 1, 2, 2, 3, 0]);
    ghostPlaneGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );

    const ghostPlaneMaterial = new THREE.MeshBasicMaterial({
      color: 0x76ab78,
      side: THREE.DoubleSide,
      opacity: 0.1,
      transparent: true,
      depthTest: false,
    });
    const ghostPlane = new THREE.Mesh(ghostPlaneGeom, ghostPlaneMaterial);
    this.ghostPlane = ghostPlane;
    this.add(ghostPlane);

    const b3 = new DoubleCone();
    b3.renderOrder = 5;

    const b3labelDiv = document.createElement("div");
    b3labelDiv.className = "label";
    b3labelDiv.style.background = "#76ab78";
    b3labelDiv.textContent = "b₃×10×10";

    const label = new CSS2DObject(b3labelDiv);
    label.position.set(0, 0, 0);
    label.center.set(-0.1, 0.5);
    b3.add(label);

    this.b3 = b3;
    this.add(b3);
    this.update(params);
  }

  update(params) {
    this.b0.rotation.z = params.b0 >= 0 ? 0 : Math.PI;
    this.b0.position.setY(Math.min(0, params.b0) + Math.abs(params.b0) / 2);
    this.b0.scale.set(1, params.b0 === 0 ? 0.0001 : Math.abs(params.b0), 1);

    this.b1.position.setY(params.b0);
    this.b1.geometry.attributes.position.setY(2, params.b1);
    this.b1.geometry.attributes.position.needsUpdate = true;

    this.b2.position.setY(params.b0);
    this.b2.geometry.attributes.position.setY(2, params.b2);
    this.b2.geometry.attributes.position.needsUpdate = true;

    const vertices = new Float32Array([
      0,
      params.b0,
      0,
      0,
      params.b2 * 10 + params.b0,
      -10,
      10,
      (params.b1 + params.b2) * 10 + params.b0,
      -10,
      10,
      params.b1 * 10 + params.b0,
      0,
    ]);
    this.ghostPlane.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    this.ghostPlane.geometry.attributes.position.needsUpdate = true;

    this.b3.position.set(
      10,
      ((2 * params.b1 + 2 * params.b2 + params.b3 * 10) * 10) / 2 + params.b0,
      -10
    );
    this.b3.scale.set(1, params.b3 * 10 * 10, 1);
  }
}

class DoubleCone extends THREE.Group {
  constructor() {
    super();

    const geom = new THREE.ConeGeometry(0.1, 0.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x76ab78,
    });
    const up = new THREE.Mesh(geom, material);
    up.translateY(0.25);
    const down = new THREE.Mesh(geom, material);
    down.rotateZ(Math.PI);
    down.translateY(0.25);

    this.add(up);
    this.add(down);
    this.up = up;
    this.down = down;
  }
}
