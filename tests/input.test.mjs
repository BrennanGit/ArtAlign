import test from "node:test";
import assert from "node:assert/strict";

import { applyReferenceGesture, gestureFromPointers, nearestCorner, normalizedPointer, normalizedPointerSamples, zoomFocusFromPointer, zoomViewAt } from "../src/input.js";
import { referenceSourcePoint } from "../src/canonical.js";

test("pointer coordinates normalize and clamp to an element", () => {
  const element = { getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 200 }) };
  assert.deepEqual(normalizedPointer({ clientX: 300, clientY: 100 }, element), { x: 0.5, y: 0.25 });
  assert.deepEqual(normalizedPointer({ clientX: 900, clientY: -10 }, element), { x: 1, y: 0 });
});

test("pointer sampling retains coalesced movement points", () => {
  const element = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
  const event = {
    clientX: 90,
    clientY: 90,
    getCoalescedEvents: () => [
      { clientX: 10, clientY: 20 },
      { clientX: 40, clientY: 50 },
      { clientX: 90, clientY: 90 },
    ],
  };

  assert.deepEqual(normalizedPointerSamples(event, element), [
    { x: 0.1, y: 0.2 },
    { x: 0.4, y: 0.5 },
    { x: 0.9, y: 0.9 },
  ]);
});

test("zoom focus uses the pointer inside the canvas and its centre outside", () => {
  const element = { getBoundingClientRect: () => ({ left: 100, right: 500, top: 50, bottom: 250, width: 400, height: 200 }) };

  assert.deepEqual(zoomFocusFromPointer({ clientX: 300, clientY: 100 }, element), { x: 0.5, y: 0.25 });
  assert.deepEqual(zoomFocusFromPointer({ clientX: 80, clientY: 100 }, element), { x: 0.5, y: 0.5 });
  assert.deepEqual(zoomFocusFromPointer({ clientX: 300, clientY: 280 }, element), { x: 0.5, y: 0.5 });
});

test("corner hit testing chooses only a nearby corner", () => {
  const quad = [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }];
  assert.equal(nearestCorner({ x: 0.13, y: 0.12 }, quad), 0);
  assert.equal(nearestCorner({ x: 0.5, y: 0.5 }, quad), -1);
});

test("two-pointer gestures translate, scale, and rotate a reference", () => {
  const initial = gestureFromPointers(new Map([[1, { x: 0.2, y: 0.4 }], [2, { x: 0.4, y: 0.4 }]]));
  const current = gestureFromPointers(new Map([[1, { x: 0.3, y: 0.4 }], [2, { x: 0.3, y: 0.8 }]]));
  const transform = applyReferenceGesture(
    { x: 0.5, y: 0.5, scale: 1, rotation: 0, flipX: false },
    initial,
    current,
  );
  assert.ok(Math.abs(transform.x - 0.5) < 1e-9);
  assert.ok(Math.abs(transform.y - 0.7) < 1e-9);
  assert.ok(Math.abs(transform.scale - 2) < 1e-9);
  assert.ok(Math.abs(transform.rotation - Math.PI / 2) < 1e-9);
});

test("canonical points map back into a transformed reference source", () => {
  const item = {
    dimensions: { width: 400, height: 200 },
    transform: { x: 0.5, y: 0.5, scale: 0.5, rotation: 0, flipX: false },
  };
  assert.deepEqual(referenceSourcePoint(item, { x: 0.5, y: 0.5 }, 1000, 1000), { x: 0.5, y: 0.5 });
  assert.deepEqual(referenceSourcePoint({ ...item, transform: { ...item.transform, flipX: true } }, { x: 0.6, y: 0.5 }, 1000, 1000), { x: 0.3, y: 0.5 });
});

test("focal zoom preserves the focused canvas point and clamps useful limits", () => {
  const initial = { panX: 0.1, panY: -0.2, zoom: 1.5, rotation: 0 };
  const focus = { x: 0.75, y: 0.25 };
  const zoomed = zoomViewAt(initial, 3, focus);

  assert.ok(Math.abs(zoomed.panX + zoomed.zoom * focus.x - initial.panX - initial.zoom * focus.x) < 1e-12);
  assert.ok(Math.abs(zoomed.panY + zoomed.zoom * focus.y - initial.panY - initial.zoom * focus.y) < 1e-12);
  assert.equal(zoomed.rotation, 0);
  assert.deepEqual(initial, { panX: 0.1, panY: -0.2, zoom: 1.5, rotation: 0 });
  assert.equal(zoomViewAt(initial, 0.01, focus).zoom, 0.25);
  assert.equal(zoomViewAt(initial, 20, focus).zoom, 8);
});