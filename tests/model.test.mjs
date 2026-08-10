import test from "node:test";
import assert from "node:assert/strict";

import {
  canonicalResolution,
  createCaptureLayer,
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
  assert.notEqual(reference.colourKey, capture.colourKey);
});

test("invalid canvas ratios are rejected", () => {
  assert.throws(() => canonicalResolution(0, 1), /positive numbers/);
  assert.throws(() => createProject({ name: "Bad", ratioWidth: NaN, ratioHeight: 1 }), /positive numbers/);
});

test("layers reorder and remove only within their compositing collection", () => {
  const project = createProject({ name: "Layers", ratioWidth: 1, ratioHeight: 1 });
  const drawing = createScribbleLayer("Drawing 2");
  const firstReference = createReferenceItem("asset-a", { width: 100, height: 100 }, "Reference A");
  const secondReference = createReferenceItem("asset-b", { width: 100, height: 100 }, "Reference B");
  project.layers.push(drawing);
  project.referenceGroup.children.push(firstReference, secondReference);

  assert.equal(layerCollection(project, drawing.id), project.layers);
  assert.equal(layerCollection(project, firstReference.id), project.referenceGroup.children);
  assert.equal(moveLayer(project, drawing.id, 0), true);
  assert.deepEqual(project.layers.map((layer) => layer.name), ["Drawing 2", "Notes"]);
  assert.equal(moveLayer(project, firstReference.id, 1), true);
  assert.deepEqual(project.referenceGroup.children.map((layer) => layer.name), ["Reference B", "Reference A"]);

  project.activeLayerId = drawing.id;
  assert.equal(removeLayer(project, drawing.id), drawing);
  assert.equal(project.activeLayerId, project.layers[0].id);
  assert.equal(removeLayer(project, project.referenceGroup.id), null);
});