import test from "node:test";
import assert from "node:assert/strict";

import {
  homographyFromQuad,
  invertHomography,
  isPlausibleQuad,
  orderCorners,
  projectPoint,
  smoothQuad,
} from "../src/geometry.js";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("homography maps canonical corners to a perspective quadrilateral", () => {
  const quad = [{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.1 }, { x: 0.8, y: 0.85 }, { x: 0.2, y: 0.9 }];
  const matrix = homographyFromQuad(quad);
  const mapped = projectPoint(matrix, { x: 1, y: 1 });
  close(mapped.x, quad[2].x);
  close(mapped.y, quad[2].y);
});

test("inverse homography returns projected points to canonical space", () => {
  const matrix = homographyFromQuad([{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.2 }, { x: 0.88, y: 0.92 }, { x: 0.12, y: 0.84 }]);
  const canonical = { x: 0.37, y: 0.61 };
  const restored = projectPoint(invertHomography(matrix), projectPoint(matrix, canonical));
  close(restored.x, canonical.x);
  close(restored.y, canonical.y);
});

test("corners normalize to top-left, top-right, bottom-right, bottom-left", () => {
  const ordered = orderCorners([{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 0 }]);
  assert.deepEqual(ordered, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]);
});

test("quad plausibility rejects crossed and tiny shapes", () => {
  assert.equal(isPlausibleQuad([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]), true);
  assert.equal(isPlausibleQuad([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }]), false);
  assert.equal(isPlausibleQuad([{ x: 0, y: 0 }, { x: 0.01, y: 0 }, { x: 0.01, y: 0.01 }, { x: 0, y: 0.01 }]), false);
});

test("smoothing applies a light temporal interpolation", () => {
  const previous = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
  const next = Array.from({ length: 4 }, () => ({ x: 1, y: 1 }));
  assert.deepEqual(smoothQuad(previous, next, 0.25), Array.from({ length: 4 }, () => ({ x: 0.25, y: 0.25 })));
});