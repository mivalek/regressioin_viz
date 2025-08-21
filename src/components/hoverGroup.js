import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export default class HoverGroup extends THREE.Group {
  constructor(pointColor) {
    super();

    this.visible = false;

    const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: pointColor || 0xff0000,
    });

    const points = {};
    ["plane", "x", "y", "z"].forEach((x) => {
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      if (x === "plane") {
        point.renderOrder = 3;
        this.add(point);
        points[x] = { point: point };
        return;
      }
      const labelDiv = document.createElement("div");
      labelDiv.className = "label";
      labelDiv.textContent = "";

      const label = new CSS2DObject(labelDiv);
      if (x === "x") {
        label.position.set(0, -0.1, 0.1);
        label.center.set(1, 0);
      } else if (x === "y") {
        label.position.set(-0.2, 0, 0.2);
        label.center.set(1, 0.5);
      } else {
        label.position.set(-0.1, 0.1, 0);
        label.center.set(1, 1);
      }
      point.add(label);
      this.add(point);
      points[x] = { point: point, label: labelDiv };
    });
    this.points = points;
  }
  update(coords) {
    // update plane point
    this.points.plane.point.position.set(coords.x, coords.y, coords.z);
    // update axis points
    ["x", "y", "z"].forEach((axis) => {
      const factor = axis === "y" ? 10 : 1;
      const fixed = 1;
      // const fixed = axis === "y" ? 1 : 2;
      this.points[axis].point.position[axis] = coords[axis];
      this.points[axis].label.textContent = Number(
        coords[axis] * (axis === "z" ? -factor : factor)
      ).toFixed(fixed);
    });
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }
}
