import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export default class RegressionPlane extends THREE.Group {
  constructor(params, n_segments, materialParams, lineColor) {
    super();
    const material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      opacity: materialParams?.opacity || 1,
      transparent: materialParams?.transparent || false,
      color: materialParams?.color || 0x888888,
      depthWrite: materialParams ? !materialParams?.transparent : true,
      //   depthWrite: true,
      specular: 0x222222,
    });
    const geometry = new THREE.BufferGeometry();
    const regPlane = new THREE.Mesh(geometry, material);
    regPlane.name = "RegressionPlane";
    regPlane.params = params;
    regPlane.n_segments = n_segments;
    regPlane.renderOrder = 0;
    this.plane = regPlane;
    this.add(regPlane);

    this.plane = regPlane;
    const points = this.makePlaneGridPoints();
    const indices = this.makeIndices();
    geometry.setIndex(indices);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    geometry.computeVertexNormals();

    const wireframeGeom = new THREE.WireframeGeometry(geometry);
    const wireframe = new THREE.LineSegments(
      wireframeGeom,
      new THREE.LineBasicMaterial({
        color: 0xcccccc,
        depthTest: false,
      })
    );
    wireframe.renderOrder = 1;
    this.wireframe = wireframe;
    this.add(wireframe);

    const sectionLineMaterial = new THREE.LineBasicMaterial({
      color: lineColor || 0x383b53,
      depthTest: true,
    });
    const sectionLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    const sectionLineX = new THREE.Line(
      sectionLineGeometry,
      sectionLineMaterial
    );
    const sectionLineZ = new THREE.Line(
      sectionLineGeometry.clone(),
      sectionLineMaterial
    );
    const labelXDiv = document.createElement("div");
    labelXDiv.className = "label slope";
    labelXDiv.textContent = "";

    const labelX = new CSS2DObject(labelXDiv);
    labelX.position.set(0.2, 0, 0);
    labelX.center.set(0, 1);
    sectionLineX.add(labelX);
    const labelZDiv = labelXDiv.cloneNode();
    const labelZ = new CSS2DObject(labelZDiv);
    labelZ.position.set(0, 0, -0.2);
    labelZ.center.set(0, 1);
    sectionLineZ.add(labelZ);

    sectionLineX.visible = false;
    sectionLineZ.visible = false;
    sectionLineX.renderOrder = 2;
    sectionLineZ.renderOrder = 3;
    this.add(sectionLineX);
    this.add(sectionLineZ);
    this.sectionLines = {
      x: { line: sectionLineX, label: { div: labelXDiv, object: labelX } },
      z: { line: sectionLineZ, label: { div: labelZDiv, object: labelZ } },
    };
  }

  makePlaneGridPoints() {
    const points = [];
    const { b0, b1, b2, b3 } = this.plane.params;
    for (let i = 0; i <= this.plane.n_segments; i++) {
      const x = i;
      for (let j = 0; j <= this.plane.n_segments; j++) {
        const y = b0 + b1 * i + b2 * j + b3 * i * j;
        const z = -j;
        points.push(x, y, z);
      }
    }
    return points;
  }

  makeIndices() {
    // generate indices (data for element array buffer)
    const indices = [];
    const n_seg = this.plane.n_segments;
    for (let i = 0; i < n_seg; i++) {
      for (let j = 0; j < n_seg; j++) {
        const a = i * (n_seg + 1) + (j + 1);
        const b = i * (n_seg + 1) + j;
        const c = (i + 1) * (n_seg + 1) + j;
        const d = (i + 1) * (n_seg + 1) + (j + 1);

        // generate two faces (triangles) per iteration
        indices.push(a, b, d); // face one
        indices.push(b, c, d); // face two
      }
    }
    return indices;
  }

  update(params) {
    this.plane.params = params;
    const points = this.makePlaneGridPoints();
    this.plane.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    this.wireframe.geometry = new THREE.WireframeGeometry(this.plane.geometry);
    this.plane.geometry.attributes.position.needsUpdate = true;
  }

  updateSectionLines(point) {
    const { b0, b1, b2, b3 } = this.plane.params;
    const { x, _, z } = point;
    const n = this.plane.n_segments;
    const y_z0 = b0 + x * b1;
    const y_z1 = b0 + x * b1 + n * b2 + x * n * b3;
    const y_x0 = b0 - z * b2;
    const y_x1 = b0 + n * b1 - z * b2 + n * -z * b3;
    // const xLine_min = new THREE.Vector3(x, y_z0, 0);
    // const xLine_max = new THREE.Vector3(x, y_z1, -n);
    // const zLine_min = new THREE.Vector3(0, y_x0, -z);
    // const zLine_max = new THREE.Vector3(n, y_x1, -z);
    let posAttr = this.sectionLines.x.line.geometry.attributes.position;
    posAttr.setXYZ(0, x, y_z0, 0);
    posAttr.setXYZ(1, x, y_z1, -n);
    posAttr.needsUpdate = true;
    this.sectionLines.x.label.div.textContent = Number(
      b2 + x * b3 * 10
    ).toFixed(2);
    this.sectionLines.x.label.object.position.set(x, y_z1, -(n + 0.2));
    posAttr = this.sectionLines.z.line.geometry.attributes.position;
    posAttr.setXYZ(0, 0, y_x0, z);
    posAttr.setXYZ(1, n, y_x1, z);
    posAttr.needsUpdate = true;
    this.sectionLines.z.label.div.textContent = Number(
      b1 - z * b3 * 10
    ).toFixed(2);
    this.sectionLines.z.label.object.position.set(n + 0.2, y_x1, z);
    this.sectionLines.x.line.visible = true;
    this.sectionLines.z.line.visible = true;
  }

  hideSectionLines() {
    this.sectionLines.x.line.visible = false;
    this.sectionLines.z.line.visible = false;
  }
}
