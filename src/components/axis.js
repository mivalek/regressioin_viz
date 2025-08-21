import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

export default class Axis extends THREE.Object3D {
  constructor(direction, lims, materialParams, renderOrder) {
    const directionLabels = ["x", "y", "z"];
    super();
    this.name = directionLabels[direction].toUpperCase() + "-axis";
    this.direction = direction;
    this.lims = lims.toSorted((a, b) => a - b);

    const material = new LineMaterial({
      color: materialParams?.color || 0x000000,
      resolution:
        materialParams?.resolution ||
        new THREE.Vector2(window.innerWidth, window.innerHeight),
    });

    const minPoint = new THREE.Vector3();
    minPoint.setComponent(direction, this.lims[0]);
    const maxPoint = new THREE.Vector3();
    maxPoint.setComponent(direction, this.lims[1]);
    const axisLineGeometry = new LineGeometry().setFromPoints([
      minPoint,
      maxPoint,
    ]);
    const axisLine = new Line2(axisLineGeometry, material);
    axisLine.renderOrder = renderOrder;
    this.add(axisLine);

    let labelText = "y";
    let position = [-0.7, maxPoint.y / 2, 0.7];
    if (direction === 2) {
      labelText = "x₂";
      position = [0, -0.7, minPoint.z / 2];
    } else if (direction === 0) {
      labelText = "x₁";
      position = [maxPoint.x / 2, -0.7, 0];
    }
    const labelDiv = document.createElement("div");
    labelDiv.className = "axis-label";
    labelDiv.textContent = labelText;

    const label = new CSS2DObject(labelDiv);
    label.position.set(...position);
    this.add(label);

    const axisTicks = new THREE.Object3D();
    this.add(axisTicks);
    for (let t = this.lims[0]; t <= this.lims[1]; t++) {
      const tickEnd = new THREE.Vector3();
      let tickDirection = [2];
      let tickLabelText = t;
      let tickLabelPosition = [0, -0.3, 0];
      if (direction === 1) {
        tickDirection = [0, 2];
        tickLabelText = t * 10;
        tickLabelPosition = [-0.3, 0, 0.3];
      } else if (direction === 2) {
        tickDirection = [0];
        tickLabelText = -t;
      }
      tickDirection.forEach((td) =>
        tickEnd.setComponent(td, td == 2 ? 0.1 : -0.1)
      );
      const tickGeometry = new LineGeometry().setFromPoints([
        new THREE.Vector3(),
        tickEnd,
      ]);
      const tickLine = new Line2(tickGeometry, material);
      tickLine.position.setComponent(direction, t);
      tickLine.renderOrder = renderOrder;

      const tickLabelDiv = document.createElement("div");
      tickLabelDiv.className = "tick-label";
      tickLabelDiv.textContent = tickLabelText;
      const tickLabel = new CSS2DObject(tickLabelDiv);
      tickLabel.position.set(...tickLabelPosition);
      tickLine.add(tickLabel);
      axisTicks.add(tickLine);
    }
  }
}
