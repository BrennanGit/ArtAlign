import test from "node:test";
import assert from "node:assert/strict";

import { CanonicalCompositor } from "../src/canonical.js";
import { createCaptureLayer, createProject, createScribbleLayer, resizeProjectCanvas } from "../src/model.js";

test("resized captures keep their aspect ratio and remain centered", async () => {
  const calls = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        clearRect() {}, save() {}, restore() {},
        drawImage: (...args) => calls.push(args),
      }),
    }),
  };
  try {
    const project = createProject({ name: "Capture", ratioWidth: 4, ratioHeight: 3 });
    project.layers.push(createCaptureLayer("image", "Capture", project.canvas.resolution));
    resizeProjectCanvas(project, 8, 3);
    const compositor = new CanonicalCompositor({ get: async () => ({ width: 1800, height: 1350 }) });
    await compositor.rebuild(project);
    assert.deepEqual(calls.at(-1).slice(1), [450, 0, 900, 675]);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("straight line strokes use one segment rather than the pen's smoothed curve", async () => {
  const commands = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        clearRect() {}, save() {}, restore() {}, drawImage() {}, beginPath() {}, stroke() {},
        moveTo: (...args) => commands.push(["move", ...args]),
        lineTo: (...args) => commands.push(["line", ...args]),
        quadraticCurveTo: (...args) => commands.push(["curve", ...args]),
      }),
    }),
  };
  try {
    const project = createProject({ name: "Line", ratioWidth: 1, ratioHeight: 1 });
    const drawing = createScribbleLayer();
    drawing.strokes.push({ tool: "line", colour: "#e8442e", width: 0.008, points: [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }] });
    project.layers.push(drawing);
    const compositor = new CanonicalCompositor({ get: async () => null });
    await compositor.rebuild(project);
    assert.deepEqual(commands, [["move", 450, 900], ["line", 1350, 900]]);
  } finally {
    globalThis.document = previousDocument;
  }
});