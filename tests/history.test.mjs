import test from "node:test";
import assert from "node:assert/strict";

import { ProjectHistory } from "../src/history.js";
import { createProject } from "../src/model.js";

test("project history restores actions and discards redo after a new edit", () => {
  const project = createProject({ name: "Study", ratioWidth: 1, ratioHeight: 1 });
  const history = new ProjectHistory(project);
  project.name = "First";
  history.record(project);
  project.name = "Second";
  history.record(project);
  assert.equal(history.undo().name, "First");
  assert.equal(history.undo().name, "Study");
  assert.equal(history.redo().name, "First");
  project.name = "New";
  history.record(project);
  assert.equal(history.canRedo, false);
});

test("navigation and timestamps do not create actions or clear redo", () => {
  const project = createProject({ name: "Study", ratioWidth: 1, ratioHeight: 1 });
  const history = new ProjectHistory(project, 2);
  project.updatedAt = "later";
  assert.equal(history.record(project), false);
  project.view.zoom = 2;
  assert.equal(history.record(project, "zoom"), false);
  project.view.panX = 0.25;
  project.view.zoom = 3;
  assert.equal(history.record(project, "zoom"), false);
  assert.equal(history.canUndo, false);
  project.name = "Edited";
  assert.equal(history.record(project), true);
  project.name = history.undo().name;
  assert.equal(project.name, "Study");
  project.view.panY = 0.5;
  assert.equal(history.record(project), false);
  assert.equal(history.canRedo, true);
  assert.equal(history.redo().name, "Edited");
});