import test from "node:test";
import assert from "node:assert/strict";

import { guidePositions } from "../src/canonical.js";
import { createGuideLayer } from "../src/model.js";

test("guide layers start with independent equal thirds on both axes", () => {
  const first = createGuideLayer();
  const second = createGuideLayer();
  first.colour = "#00ff00";
  assert.equal(second.colour, "#e8442e");
  assert.equal(first.horizontal, 3);
  assert.equal(first.vertical, 3);
  assert.deepEqual(guidePositions(first.horizontal), [1 / 3, 2 / 3]);
  assert.deepEqual(guidePositions(0), []);
  assert.deepEqual(guidePositions(1), []);
  assert.deepEqual(guidePositions(4), [0.25, 0.5, 0.75]);
});