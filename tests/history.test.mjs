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

test("continuous edits group into one undo, timestamps do not create actions", () => {
  const project = createProject({ name: "Study", ratioWidth: 1, ratioHeight: 1 });
  const history = new ProjectHistory(project, 2);
  project.updatedAt = "later";
  assert.equal(history.record(project), false);
  project.view.zoom = 2;
  history.record(project, "zoom");
  project.view.zoom = 3;
  history.record(project, "zoom");
  assert.equal(history.undo().view.zoom, 1);
  assert.equal(history.redo().view.zoom, 3);
});