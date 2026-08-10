import test from "node:test";
import assert from "node:assert/strict";

import { createProject } from "../src/model.js";
import { MemoryProjectStore } from "../src/store.js";

test("project metadata and image assets persist independently", async () => {
  const store = new MemoryProjectStore();
  const project = createProject({ name: "Portrait", ratioWidth: 4, ratioHeight: 5 });
  const source = new Blob(["pixels"], { type: "image/png" });

  await store.putAsset({ id: "asset-1", projectId: project.id, blob: source });
  await store.saveProject(project);
  project.name = "Portrait revised";
  await store.saveProject(project);

  assert.equal((await store.getProject(project.id)).name, "Portrait revised");
  assert.equal(await (await store.getAsset("asset-1")).text(), "pixels");
});

test("projects sort by most recently opened and deletion cleans assets", async () => {
  const store = new MemoryProjectStore();
  const older = createProject({ name: "Older", ratioWidth: 1, ratioHeight: 1 });
  const newer = createProject({ name: "Newer", ratioWidth: 1, ratioHeight: 1 });
  older.lastOpenedAt = "2026-01-01T00:00:00.000Z";
  newer.lastOpenedAt = "2026-02-01T00:00:00.000Z";
  await store.saveProject(older);
  await store.saveProject(newer);
  await store.putAsset({ id: "old-asset", projectId: older.id, blob: new Blob(["old"]) });

  assert.deepEqual((await store.listProjects()).map(({ name }) => name), ["Newer", "Older"]);
  await store.deleteProject(older.id);
  assert.equal(await store.getAsset("old-asset"), null);
});