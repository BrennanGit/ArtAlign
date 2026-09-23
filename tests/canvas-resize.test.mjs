import test from "node:test";
import assert from "node:assert/strict";

import { CanonicalCompositor } from "../src/canonical.js";
import { createCaptureLayer, createGuideLayer, createProject, createScribbleLayer, resizeProjectCanvas } from "../src/model.js";

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
        translate() {}, rotate() {}, scale() {},
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

test("drawing strokes keep their source points while the compositor applies the layer transform", async () => {
  const operations = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        clearRect() {}, save() {}, restore() {}, beginPath() {}, stroke() {}, moveTo() {}, lineTo() {},
        drawImage: (...args) => operations.push(["draw", ...args.slice(1)]),
        translate: (...args) => operations.push(["translate", ...args]),
        rotate: (angle) => operations.push(["rotate", angle]),
        scale: (...args) => operations.push(["scale", ...args]),
      }),
    }),
  };
  try {
    const project = createProject({ name: "Move", ratioWidth: 2, ratioHeight: 1 });
    const drawing = createScribbleLayer();
    drawing.strokes.push({ tool: "line", colour: "#e8442e", width: 0.008, points: [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }] });
    project.layers.push(drawing);
    const original = structuredClone(drawing.strokes);
    Object.assign(drawing.transform, { x: 0.6, y: 0.4, scale: 0.5, rotation: Math.PI / 2 });
    await new CanonicalCompositor({ get: async () => null }).rebuild(project);
    assert.deepEqual(operations, [
      ["draw", 0, 0],
      ["translate", 1080, 360], ["rotate", Math.PI / 2], ["scale", 0.5, 0.5], ["draw", -900, -450, 1800, 900],
    ]);
    assert.deepEqual(drawing.strokes, original);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("drawing source outside the canvas survives a transform into view", async () => {
  const operations = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        clearRect() {}, save() {}, restore() {}, beginPath() {}, stroke() {},
        drawImage: (canvas, ...args) => operations.push(["draw", canvas.width, canvas.height, ...args]),
        translate: (...args) => operations.push(["translate", ...args]),
        rotate() {}, scale() {},
        moveTo: (...args) => operations.push(["move", ...args]),
        lineTo: (...args) => operations.push(["line", ...args]),
      }),
    }),
  };
  try {
    const project = createProject({ name: "Off canvas", ratioWidth: 1, ratioHeight: 1 });
    const drawing = createScribbleLayer();
    drawing.strokes.push({ tool: "line", colour: "#e8442e", width: 0.008, points: [{ x: 1.2, y: 0.5 }, { x: 1.3, y: 0.5 }] });
    drawing.transform.x = 0;
    project.layers.push(drawing);
    await new CanonicalCompositor({ get: async () => null }).rebuild(project);
    assert.ok(operations.some(([command, canvasWidth, canvasHeight, x, y]) => command === "draw" && canvasWidth > 1.3 * 1800 && canvasHeight === 1800 && x === -900 && y === -900));
    assert.ok(operations.some(([command, x]) => command === "move" && x > 1800));
    assert.deepEqual(drawing.strokes[0].points, [{ x: 1.2, y: 0.5 }, { x: 1.3, y: 0.5 }]);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("surrounding drawing preview excludes the canvas and follows the stage", () => {
  const operations = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        save() {}, restore() {}, beginPath() {}, stroke() {}, moveTo() {}, lineTo() {},
        translate() {}, drawImage() {},
      }),
    }),
  };
  try {
    const project = createProject({ name: "Surroundings", ratioWidth: 1, ratioHeight: 1 });
    const drawing = createScribbleLayer();
    drawing.strokes.push({ tool: "line", colour: "#e8442e", width: 0.008, points: [{ x: -0.1, y: 0.5 }, { x: 0.1, y: 0.5 }] });
    project.layers.push(drawing);
    const context = {
      save() {}, restore() {}, beginPath() {},
      rect: (...args) => operations.push(["rect", ...args]),
      clip: (rule) => operations.push(["clip", rule]),
      translate: (...args) => operations.push(["translate", ...args]),
      scale: (...args) => operations.push(["scale", ...args]),
      drawImage: (...args) => operations.push(["draw", ...args.slice(1)]),
    };
    new CanonicalCompositor({ get: async () => null }).drawSurroundings(project, context, 600, 400, { x: 100, y: 50, width: 300, height: 300 });
    assert.deepEqual(operations.slice(0, 5), [
      ["rect", 0, 0, 600, 400], ["rect", 100, 50, 300, 300], ["clip", "evenodd"],
      ["translate", 100, 50], ["scale", 1 / 6, 1 / 6],
    ]);
    assert.ok(operations.some(([command]) => command === "draw"));
  } finally {
    globalThis.document = previousDocument;
  }
});

test("capture and guide transforms composite after their source content is drawn", async () => {
  const operations = [];
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        clearRect() {}, save() {}, restore() {}, beginPath() {}, stroke() {}, moveTo() {}, lineTo() {},
        drawImage: (...args) => operations.push(["draw", ...args.slice(1)]),
        translate: (...args) => operations.push(["translate", ...args]),
        rotate: (angle) => operations.push(["rotate", angle]),
        scale: (...args) => operations.push(["scale", ...args]),
      }),
    }),
  };
  try {
    const project = createProject({ name: "Linked", ratioWidth: 1, ratioHeight: 1 });
    const capture = createCaptureLayer("image", "Capture", project.canvas.resolution);
    const guide = createGuideLayer();
    capture.transform.x = 0.6;
    guide.transform.rotation = Math.PI / 4;
    project.layers.push(capture, guide);
    await new CanonicalCompositor({ get: async (assetId) => assetId === "image" ? { width: 1800, height: 1800 } : null }).rebuild(project);
    assert.deepEqual(operations, [
      ["draw", 0, 0], ["draw", 0, 0, 1800, 1800],
      ["translate", 1080, 900], ["rotate", 0], ["scale", 1, 1], ["draw", -900, -900, 1800, 1800],
      ["translate", 900, 900], ["rotate", Math.PI / 4], ["scale", 1, 1], ["draw", -900, -900, 1800, 1800],
    ]);
  } finally {
    globalThis.document = previousDocument;
  }
});