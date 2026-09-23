import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalResolution,
  createCaptureLayer,
  resizeProjectCanvas,
  createProject,
  createReferenceItem,
  createScribbleLayer,
  defaultQuad,
  layerCollection,
  moveLayer,
  removeLayer,
} from "../src/model.js";

test("canonical resolution preserves ratio with an 1800px long edge", () => {
  assert.deepEqual(canonicalResolution(4, 3), { width: 1800, height: 1350 });
  assert.deepEqual(canonicalResolution(2, 3), { width: 1200, height: 1800 });
});

test("project starts with separate canonical and projection state", () => {
  const project = createProject({ name: " Study ", ratioWidth: 4, ratioHeight: 3 });

  assert.equal(project.name, "Study");
  assert.deepEqual(project.canvas.resolution, { width: 1800, height: 1350 });
  assert.equal(project.referenceGroup.children.length, 0);
  assert.deepEqual(project.layers, []);
  assert.equal(project.activeLayerId, null);
  assert.deepEqual(project.projection.quad, defaultQuad());
  assert.notEqual(project.referenceGroup, project.projection);
});

test("maskable raster factories retain source and mask assets independently", () => {
  const reference = createReferenceItem("asset-source", { width: 1200, height: 800 });
  const capture = createCaptureLayer("asset-capture", "Capture 01", { width: 1800, height: 1200 });

  assert.equal(reference.assetId, "asset-source");
  assert.equal(reference.sourceAssetId, "asset-source");
  assert.equal(reference.maskAssetId, null);
  assert.equal(capture.assetId, "asset-capture");
  assert.equal(capture.maskAssetId, null);
  assert.deepEqual(capture.placement, { x: 0.5, y: 0.5, width: 1, height: 1 });
  assert.notEqual(reference.colourKey, capture.colourKey);
});

test("resizing keeps references, captures and strokes centered at their original physical size", () => {
  const project = createProject({ name: "Resize", ratioWidth: 4, ratioHeight: 3 });
  const reference = createReferenceItem("ref", { width: 800, height: 400 });
  reference.transform.x = 0.75;
  reference.transform.y = 0.25;
  const capture = createCaptureLayer("capture", "Capture", project.canvas.resolution);
  const drawing = createScribbleLayer();
  drawing.strokes.push({ tool: "pen", width: 0.02, points: [{ x: 0.75, y: 0.25 }, { x: 0.5, y: 0.5 }] });
  project.referenceGroup.children.push(reference);
  project.layers.push(capture, drawing);

  assert.equal(resizeProjectCanvas(project, 8, 3), true);
  assert.deepEqual(project.canvas.resolution, { width: 1800, height: 675 });
  assert.equal(reference.transform.x, 0.625);
  assert.equal(reference.transform.y, 0.25);
  assert.ok(Math.abs(reference.transform.scale - 2 / 3) < 1e-12);
  assert.deepEqual(capture.placement, { x: 0.5, y: 0.5, width: 0.5, height: 1 });
  assert.deepEqual(drawing.strokes[0].points, [{ x: 0.625, y: 0.25 }, { x: 0.5, y: 0.5 }]);
  assert.equal(drawing.strokes[0].width, 0.02);

  assert.equal(resizeProjectCanvas(project, 8, 6), true);
  assert.equal(reference.transform.y, 0.375);
  assert.equal(reference.transform.scale, 0.5);
  assert.deepEqual(capture.placement, { x: 0.5, y: 0.5, width: 0.5, height: 0.5 });
  assert.equal(drawing.strokes[0].width, 0.01);
  assert.equal(resizeProjectCanvas(project, 8, 6), false);
  assert.throws(() => resizeProjectCanvas(project, -1, 2), /positive numbers/);
});

test("invalid canvas ratios are rejected", () => {
  assert.throws(() => canonicalResolution(0, 1), /positive numbers/);
  assert.throws(() => createProject({ name: "Bad", ratioWidth: NaN, ratioHeight: 1 }), /positive numbers/);
});

test("layers reorder and remove only within their compositing collection", () => {
  const project = createProject({ name: "Layers", ratioWidth: 1, ratioHeight: 1 });
  const firstDrawing = createScribbleLayer("Drawing 1");
  const drawing = createScribbleLayer("Drawing 2");
  const firstReference = createReferenceItem("asset-a", { width: 100, height: 100 }, "Reference A");
  const secondReference = createReferenceItem("asset-b", { width: 100, height: 100 }, "Reference B");
  project.layers.push(firstDrawing, drawing);
  project.referenceGroup.children.push(firstReference, secondReference);

  assert.equal(layerCollection(project, drawing.id), project.layers);
  assert.equal(layerCollection(project, firstReference.id), project.referenceGroup.children);
  assert.equal(moveLayer(project, drawing.id, 0), true);
  assert.deepEqual(project.layers.map((layer) => layer.name), ["Drawing 2", "Drawing 1"]);
  assert.equal(moveLayer(project, firstReference.id, 1), true);
  assert.deepEqual(project.referenceGroup.children.map((layer) => layer.name), ["Reference B", "Reference A"]);

  project.activeLayerId = drawing.id;
  assert.equal(removeLayer(project, drawing.id), drawing);
  assert.equal(project.activeLayerId, firstDrawing.id);
  assert.equal(removeLayer(project, project.referenceGroup.id), null);
});