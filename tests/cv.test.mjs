import test from "node:test";
import assert from "node:assert/strict";

import { trackingConfidence, trackingScheduleDelay } from "../src/cv.js";

const square = [
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.9, y: 0.9 },
  { x: 0.1, y: 0.9 },
];

test("tracking confidence rewards stable, numerous low-error features", () => {
  const stable = trackingConfidence({ totalFeatures: 60, trackedFeatures: 52, meanError: 2, quad: square, previousQuad: square });
  const noisy = trackingConfidence({ totalFeatures: 60, trackedFeatures: 12, meanError: 18, quad: square, previousQuad: square });
  assert.ok(stable > 0.8);
  assert.ok(noisy < stable);
});

test("tracking confidence rejects sparse or implausible updates", () => {
  const crossed = [square[0], square[2], square[1], square[3]];
  assert.equal(trackingConfidence({ totalFeatures: 60, trackedFeatures: 7, meanError: 1, quad: square, previousQuad: square }), 0);
  assert.equal(trackingConfidence({ totalFeatures: 60, trackedFeatures: 50, meanError: 1, quad: crossed, previousQuad: square }), 0);
});

test("tracking cadence always yields and targets a bounded sample rate", () => {
  assert.equal(trackingScheduleDelay(20), 105);
  assert.equal(trackingScheduleDelay(100), 80);
  assert.equal(trackingScheduleDelay(Number.NaN), 125);
});