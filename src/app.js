import { AssetCache, CanonicalCompositor, referenceBounds, referenceSourcePoint } from "./canonical.js";
import { CanvasTracker, detectCanvasQuad, rectifySource, trackingScheduleDelay } from "./cv.js";
import { applyReferenceGesture, gestureFromPointers, nearestCorner, normalizedPointer, normalizedPointerSamples, zoomFocusFromPointer, zoomViewAt } from "./input.js";
import {
  ASPECT_PRESETS,
  BLEND_MODES,
  MODES,
  createCaptureLayer,
  createProject,
  createReferenceItem,
  createScribbleLayer,
  defaultQuad,
  layerCollection,
  makeId,
  moveLayer,
  removeLayer,
  touchProject,
} from "./model.js";
import { ProjectionRenderer } from "./renderer.js";
import { MemoryProjectStore, ProjectStore } from "./store.js";

const elements = Object.fromEntries([...document.querySelectorAll("[id]")].map((element) => [element.id, element]));
let store = new ProjectStore();
let assetCache;
let compositor;
let renderer;
let project = null;
let projects = [];
let view = "canonical";
let background = null;
let cameraStream = null;
let saveTimer = 0;
let renderToken = 0;
let activeCorner = -1;
let activeStroke = null;
let gestureStart = null;
let maskSession = null;
let brushCursor = null;
let previewFrame = 0;
let previewRunning = false;
let previewDirty = false;
let rectificationSession = null;
let canvasTracker = null;
let trackingFrame = 0;
let trackingFrameKind = null;
let reacquireTimer = 0;
let canvasDetectionAbort = null;
let captureInProgress = false;
let editingLayerId = null;
let renamingLayerId = null;
let layerDrag = null;
let suppressInspectorClick = false;
let pinchStart = null;
let suppressEditingUntilPointersClear = false;
let interactionRollback = null;
const pointers = new Map();
const navigationPointers = new Map();
const drawSettings = { tool: "pen", colour: "#e8442e", width: 0.008 };
const maskSettings = { tool: "erase", width: 0.08, hardness: 0.75 };
const OVERLAY_OPACITY = 0.72;
const TRACKING_PROCESSING_LIMIT_MS = 250;

initialize().catch(showError);

async function initialize() {
  populatePresets();
  bindEvents();
  try {
    projects = await store.listProjects();
  } catch {
    store = new MemoryProjectStore();
    projects = await store.listProjects();
  }
  assetCache = new AssetCache(store);
  compositor = new CanonicalCompositor(assetCache);
  try {
    renderer = new ProjectionRenderer(elements.projectionCanvas);
  } catch (error) {
    elements.trackingLabel.textContent = error.message;
  }
  renderProjectList();
}

function bindEvents() {
  elements.newProjectButton.addEventListener("click", () => elements.projectDialog.showModal());
  elements.projectForm.addEventListener("submit", createProjectFromForm);
  elements.projectForm.elements.preset.addEventListener("change", applyPreset);
  elements.projectForm.elements.ratioWidth.addEventListener("input", markPresetCustom);
  elements.projectForm.elements.ratioHeight.addEventListener("input", markPresetCustom);
  elements.projectList.addEventListener("click", handleProjectListClick);
  elements.backButton.addEventListener("click", closeProject);
  elements.projectName.addEventListener("click", renameProject);
  elements.photoButton.addEventListener("click", () => togglePhotoView().catch(showError));
  elements.liveButton.addEventListener("click", () => toggleLiveView().catch(showError));
  elements.finishModeButton.addEventListener("click", () => finishCurrentMode().catch(showError));
  elements.layersButton.addEventListener("click", toggleLayerPanel);
  elements.layerDialog.addEventListener("click", handleLayerTypeClick);
  elements.cancelLayerButton.addEventListener("click", () => elements.layerDialog.close());
  elements.referenceInput.addEventListener("change", importReferences);
  elements.photoInput.addEventListener("change", importPhoto);
  elements.inspector.addEventListener("click", handleInspectorClick);
  elements.inspector.addEventListener("input", handleInspectorInput);
  elements.inspector.addEventListener("keydown", handleInspectorKeyDown);
  elements.inspector.addEventListener("pointerdown", beginLayerDrag);
  elements.inspector.addEventListener("pointermove", updateLayerDrag);
  elements.inspector.addEventListener("pointerup", finishLayerDrag);
  elements.inspector.addEventListener("pointercancel", finishLayerDrag);
  elements.interactionCanvas.addEventListener("pointerdown", pointerDown);
  elements.interactionCanvas.addEventListener("pointermove", pointerMove);
  elements.interactionCanvas.addEventListener("pointerup", pointerUp);
  elements.interactionCanvas.addEventListener("pointercancel", pointerUp);
  elements.interactionCanvas.addEventListener("pointerleave", pointerLeave);
  elements.viewportPanel.addEventListener("wheel", wheelZoom, { passive: false });
  window.addEventListener("resize", drawInteraction);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && project) saveNow();
  });
}

function populatePresets() {
  elements.projectForm.elements.preset.innerHTML = ASPECT_PRESETS.map(
    (preset) => `<option value="${preset.id}">${preset.label}</option>`,
  ).join("");
}

function applyPreset(event) {
  const preset = ASPECT_PRESETS.find((candidate) => candidate.id === event.target.value);
  if (!preset || preset.id === "custom") return;
  elements.projectForm.elements.ratioWidth.value = roundedRatio(preset.width);
  elements.projectForm.elements.ratioHeight.value = roundedRatio(preset.height);
}

function markPresetCustom() {
  elements.projectForm.elements.preset.value = "custom";
}

async function createProjectFromForm(event) {
  event.preventDefault();
  const form = new FormData(elements.projectForm);
  const created = createProject({
    name: form.get("name"),
    ratioWidth: Number(form.get("ratioWidth")),
    ratioHeight: Number(form.get("ratioHeight")),
  });
  await store.saveProject(created);
  elements.projectDialog.close();
  await openProject(created.id);
}

function renderProjectList() {
  elements.projectList.innerHTML = projects.length ? projects.map((item) => `
    <article class="project-entry" data-project-id="${item.id}">
      <button class="delete-project" data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">Delete</button>
      <strong>${escapeHtml(item.name)}</strong>
      <span>${item.canvas.ratioWidth.toFixed(2)} : ${item.canvas.ratioHeight.toFixed(2)} &middot; ${formatDate(item.updatedAt)}</span>
    </article>
  `).join("") : `<p class="empty-projects">No local projects yet. Start with the ratio of your physical canvas.</p>`;
}

async function handleProjectListClick(event) {
  const deleteId = event.target.closest("[data-delete]")?.dataset.delete;
  if (deleteId) {
    event.stopPropagation();
    if (confirm("Delete this project and its local images?")) {
      await store.deleteProject(deleteId);
      projects = await store.listProjects();
      renderProjectList();
    }
    return;
  }
  const id = event.target.closest("[data-project-id]")?.dataset.projectId;
  if (id) await openProject(id);
}

async function openProject(id) {
  project = await store.getProject(id);
  if (!project) return;
  editingLayerId = null;
  closeLayerPanel();
  project.lastOpenedAt = new Date().toISOString();
  elements.projectsView.hidden = true;
  elements.workspaceView.hidden = false;
  elements.projectName.textContent = project.name;
  await setView(project.source.kind === "still" ? "photo" : "canonical");
  await saveNow();
}

async function closeProject() {
  stopCamera();
  closeLayerPanel();
  await saveNow();
  project = null;
  elements.workspaceView.hidden = true;
  elements.projectsView.hidden = false;
  projects = await store.listProjects();
  renderProjectList();
}

async function renameProject() {
  const name = prompt("Project name", project.name)?.trim();
  if (!name) return;
  project.name = name;
  elements.projectName.textContent = name;
  scheduleSave();
}

async function importReferences(event) {
  const files = [...event.target.files];
  let lastItem = null;
  for (const file of files) {
    const assetId = makeId("asset");
    const image = await imageFromBlob(file);
    await store.putAsset({ id: assetId, projectId: project.id, blob: file, kind: "reference" });
    const item = createReferenceItem(assetId, imageDimensions(image), file.name.replace(/\.[^.]+$/, ""));
    project.referenceGroup.children.push(item);
    project.activeLayerId = item.id;
    lastItem = item;
  }
  event.target.value = "";
  if (!lastItem) return;
  editingLayerId = lastItem.id;
  project.mode = MODES.COMPOSE_REFERENCE;
  await setView("canonical");
  openLayerPanel();
  scheduleSave();
}

async function importPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  stopCamera();
  const assetId = makeId("asset");
  await store.putAsset({ id: assetId, projectId: project.id, blob: file, kind: "photo" });
  project.source = { kind: "still", assetId };
  background = await assetCache.get(assetId);
  event.target.value = "";
  project.mode = MODES.EDIT_CORNERS;
  await setView("photo");
  await redetectCanvas();
  scheduleSave();
}

async function setView(nextView) {
  if (nextView !== view) {
    canvasDetectionAbort?.abort();
    canvasDetectionAbort = null;
  }
  if (nextView !== "live" && cameraStream) stopCamera();
  view = nextView;
  const canonical = view === "canonical";
  elements.editorCanvas.style.display = canonical ? "block" : "none";
  elements.projectionCanvas.style.display = canonical ? "none" : "block";
  if (canonical) {
    const dimensions = rectificationSession ? imageDimensions(rectificationSession.image) : project.canvas.resolution;
    elements.stage.style.setProperty("--stage-ratio", dimensions.width / dimensions.height);
    elements.trackingLabel.textContent = rectificationSession ? "Adjust the source image corners" : "Canonical canvas";
  } else {
    if (view === "photo" && !background && project.source.assetId) background = await assetCache.get(project.source.assetId);
    const dimensions = imageDimensions(view === "live" ? elements.cameraVideo : background);
    elements.stage.style.setProperty("--stage-ratio", dimensions.width / dimensions.height || 1);
    renderer?.setBackground(view === "live" ? elements.cameraVideo : background);
    renderer?.setProjection(project.projection.quad);
    if (view === "live") renderer?.start();
    elements.trackingLabel.textContent = project.projection.tracking === "tracking" ? "Tracking canvas" : "Manual corners";
  }
  elements.photoButton.classList.toggle("active", view === "photo");
  elements.liveButton.classList.toggle("active", view === "live");
  updateCameraButton(elements.photoButton, view === "photo", "Open photo");
  updateCameraButton(elements.liveButton, view === "live", "Open live camera");
  applyCanvasView();
  await refresh();
}

function updateCameraButton(button, active, inactiveLabel) {
  const label = active ? "Return to canvas" : inactiveLabel;
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute("aria-label", label);
  button.title = label;
}

async function refresh(rebuild = true, updateControls = true) {
  if (!project) return;
  const token = ++renderToken;
  const soloLayerId = project.mode === MODES.EYEDROPPER ? project.activeLayerId : null;
  const renderOptions = { soloLayerId, forceOpaqueId: soloLayerId };
  if (project.mode === MODES.MASK && maskSession) {
    renderOptions.maskOverrideId = maskSession.layerId;
    renderOptions.maskOverride = maskSession.canvas;
  }
  const overlay = rectificationSession
    ? compositor.canvas
    : rebuild ? await compositor.rebuild(project, renderOptions) : compositor.canvas;
  if (token !== renderToken) return;
  renderer?.setOverlay(overlay);
  renderer?.setProjection(project.projection.quad);
  if (view === "canonical") {
    const canvas = elements.editorCanvas;
    const dimensions = rectificationSession ? imageDimensions(rectificationSession.image) : project.canvas.resolution;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(rectificationSession?.image ?? overlay, 0, 0, canvas.width, canvas.height);
  }
  elements.emptyHint.hidden = Boolean(rectificationSession) || project.referenceGroup.children.length > 0 || project.layers.some((layer) => layer.kind === "capture" || layer.strokes?.length);
  updateModeChip();
  if (updateControls) renderInspector();
  drawInteraction();
}

function updateModeChip() {
  const canonicalView = view === "canonical" && project.mode === MODES.VIEW && !rectificationSession;
  const labels = {
    [MODES.VIEW]: "Canonical canvas",
    [MODES.COMPOSE_REFERENCE]: "Reference",
    [MODES.EDIT_CORNERS]: "Edit corners",
    [MODES.DRAW]: "Drawing",
    [MODES.MASK]: "Mask",
    [MODES.EYEDROPPER]: "Eyedropper",
  };
  let label = labels[project.mode] ?? "Canvas";
  if (rectificationSession) label = "Rectify reference";
  else if (view === "photo") label = project.mode === MODES.EDIT_CORNERS ? "Photo corners" : "Photo";
  else if (view === "live") label = project.mode === MODES.EDIT_CORNERS ? "Live corners" : "Live";
  elements.modeLabel.textContent = label;
  elements.finishModeButton.hidden = canonicalView;
  elements.modeChip.classList.toggle("active", !canonicalView);
}

async function finishCurrentMode() {
  if (rectificationSession) return applyReferenceRectification();
  if (project.mode === MODES.COMPOSE_REFERENCE) project.activeLayerId = project.referenceGroup.id;
  if (project.mode === MODES.MASK) {
    maskSession = null;
    brushCursor = null;
  }
  editingLayerId = null;
  project.mode = MODES.VIEW;
  await setView("canonical");
  scheduleSave();
}

function renderInspector() {
  if (rectificationSession) {
    const layer = findLayer(rectificationSession.layerId);
    elements.inspector.innerHTML = `
      ${panelHeader(`Rectify ${layer?.name ?? "reference"}`)}
      <div class="layer-editor">
        <p>Align the four handles with the physical print or page.</p>
        <button data-action="apply-reference-rectification" class="primary">Apply rectification</button>
        <div class="control-row"><button data-action="redetect-reference">Redetect</button><button data-action="cancel-reference-rectification">Cancel</button></div>
      </div>
    `;
    return;
  }
  const selected = selectedLayer();
  const common = selected ? `
    <label class="control inline-control"><span>Blend mode</span><select data-field="blendMode">${BLEND_MODES.map((mode) => `<option value="${mode}" ${mode === selected.blendMode ? "selected" : ""}>${titleCase(mode)}</option>`).join("")}</select></label>
  ` : "";
  const referenceControls = selected?.kind === "reference-item" ? `
    <div class="control-row four"><button data-action="fit">Fit</button><button data-action="centre">Centre</button><button data-action="reset">Reset</button><button data-action="flip" title="Flip horizontally">${selected.transform.flipX ? "Unflip" : "Flip"}</button></div>
    <div class="control-row"><button data-action="rectify-reference">Rectify</button><button data-action="done-reference" class="primary">Done</button></div>
  ` : "";
  const colourKeyControls = isRasterLayer(selected) ? `
    <h3>Colour key</h3>
    <label class="control"><span><input data-field="keyEnabled" type="checkbox" ${selected.colourKey.enabled ? "checked" : ""}> Enabled</span></label>
    <label class="control">Key colour<span class="colour-picker-row"><input data-field="keyColour" type="color" value="${rgbToHex(selected.colourKey.colour)}"><button data-action="eyedropper" class="mini-icon-button ${project.mode === MODES.EYEDROPPER ? "active" : ""}" title="Pick key colour" aria-label="Pick key colour"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m19 3 2 2-9.5 9.5-3-3zM14 6l4 4M8.5 11.5 4 16v4h4l4.5-4.5"/></svg></button></span></label>
    <label class="control">Tolerance<input data-field="keyTolerance" type="range" min="0" max="150" value="${selected.colourKey.tolerance}"></label>
    <label class="control">Softness<input data-field="keySoftness" type="range" min="1" max="150" value="${selected.colourKey.softness}"></label>
  ` : "";
  const referenceGroupControls = selected?.kind === "reference-group" ? `
    <button data-action="edit-reference">Edit reference items</button>
  ` : "";
  const maskControls = isRasterLayer(selected) ? `
    <h3>Mask</h3>
    <div class="control-row three"><button data-action="mask" class="${project.mode === MODES.MASK ? "primary" : ""}">Edit</button><button data-action="mask-erase" class="${maskSettings.tool === "erase" ? "primary" : ""}">Erase</button><button data-action="mask-restore" class="${maskSettings.tool === "restore" ? "primary" : ""}">Restore</button></div>
    <label class="control">Brush size<input data-field="maskWidth" type="range" min="0.01" max="0.3" step="0.01" value="${maskSettings.width}"></label>
    <label class="control">Hardness<input data-field="maskHardness" type="range" min="0.05" max="1" step="0.05" value="${maskSettings.hardness}"></label>
    <div class="control-row three"><button data-action="mask-undo">Undo</button><button data-action="mask-redo">Redo</button><button data-action="mask-reset">Reset</button></div>
  ` : "";
  const scribbleControls = selected?.kind === "scribble" ? `
    <div class="control-row"><button data-action="pen" class="${drawSettings.tool === "pen" ? "primary" : ""}">Pen</button><button data-action="eraser" class="${drawSettings.tool === "eraser" ? "primary" : ""}">Eraser</button></div>
    <label class="control">Colour<input data-field="drawColour" type="color" value="${drawSettings.colour}"></label>
    <label class="control">Width<input data-field="drawWidth" type="range" min="0.002" max="0.05" step="0.002" value="${drawSettings.width}"></label>
    <div class="control-row three"><button data-action="undo">Undo</button><button data-action="redo">Redo</button><button data-action="clear">Clear</button></div>
  ` : "";
  const projectionControls = view !== "canonical" ? `
    <h3>Canvas registration</h3>
    <div class="control-row"><button data-action="redetect">Redetect</button><button data-action="edit-corners">Edit corners</button></div>
    <button data-action="capture">${view === "photo" ? "Add photo as layer" : "Capture painting"}</button>
  ` : "";
  elements.inspector.innerHTML = `
    ${panelHeader("Layers", true)}
    <div class="layer-list">${layerRows()}</div>
    ${editingLayerId === selected?.id ? `<div class="layer-editor"><div class="editor-heading"><strong>${escapeHtml(selected.name)}</strong><span>${titleCase(selected.kind)}</span></div>${common}${referenceControls}${referenceGroupControls}${colourKeyControls}${maskControls}${scribbleControls}${projectionControls}</div>` : projectionControls ? `<div class="layer-editor">${projectionControls}</div>` : ""}
  `;
}

function panelHeader(title, allowAdd = false) {
  return `<div class="layer-panel-header"><h2>${escapeHtml(title)}</h2><div>${allowAdd ? `<button data-action="add-layer" class="mini-icon-button" title="Add layer" aria-label="Add layer"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>` : ""}<button data-action="close-panel" class="mini-icon-button" title="Close layers" aria-label="Close layers"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></div>`;
}

function layerRows() {
  const topLayers = [...project.layers].reverse().map((layer) => layerRow(layer)).join("");
  const references = [...project.referenceGroup.children].reverse().map((layer) => layerRow(layer, true)).join("");
  return `${topLayers}${layerRow(project.referenceGroup, false, true)}${references}`;
}

function layerRow(layer, nested = false, fixed = false) {
  const active = project.activeLayerId === layer.id;
  const editing = editingLayerId === layer.id;
  const renaming = renamingLayerId === layer.id;
  const percent = Math.round(layer.opacity * 100);
  return `
    <div class="layer-row ${active ? "active" : ""} ${editing ? "editing" : ""} ${nested ? "nested" : ""}" data-layer-id="${layer.id}" data-fixed="${fixed}" style="--layer-opacity:${percent}%">
      <button class="visibility mini-icon-button" data-visible="${layer.id}" title="${layer.visible ? "Hide" : "Show"} ${escapeHtml(layer.name)}" aria-label="${layer.visible ? "Hide" : "Show"} ${escapeHtml(layer.name)}"><svg aria-hidden="true" viewBox="0 0 24 24">${layer.visible ? `<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>` : `<path d="m3 3 18 18M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.1 2.8M6.7 6.7C3.6 8.6 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4.2-.9"/>`}</svg></button>
      ${renaming ? `<input class="layer-rename-input" data-rename-input="${layer.id}" value="${escapeHtml(layer.name)}" aria-label="Layer name">` : `<button class="layer-name" data-select="${layer.id}"><strong>${escapeHtml(layer.name)}</strong><span>${percent}%</span></button>`}
      <button class="mini-icon-button" data-action="edit-layer" data-layer-action-id="${layer.id}" title="Edit ${escapeHtml(layer.name)}" aria-label="Edit ${escapeHtml(layer.name)}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM13.5 8l3 3"/></svg></button>
      <button class="mini-icon-button" data-action="rename-layer" data-layer-action-id="${layer.id}" title="${renaming ? "Save" : "Rename"} ${escapeHtml(layer.name)}" aria-label="${renaming ? "Save" : "Rename"} ${escapeHtml(layer.name)}"><svg aria-hidden="true" viewBox="0 0 24 24">${renaming ? `<path d="M5 12l4 4L19 6"/>` : `<path d="M4 20h16M14 4l6 6M5 17l2-6L16 2l6 6-9 9z"/>`}</svg></button>
      ${fixed ? `<span class="fixed-layer" title="Reference group"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v18M5 8h14M5 16h14"/></svg></span>` : `<button class="mini-icon-button danger" data-action="delete-layer" data-layer-action-id="${layer.id}" title="Delete ${escapeHtml(layer.name)}" aria-label="Delete ${escapeHtml(layer.name)}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg></button>`}
    </div>
  `;
}

async function handleInspectorClick(event) {
  if (suppressInspectorClick) return;
  const selectId = event.target.closest("[data-select]")?.dataset.select;
  const visibleId = event.target.closest("[data-visible]")?.dataset.visible;
  if (selectId) {
    project.activeLayerId = selectId;
    renderInspector();
    drawInteraction();
    return;
  }
  if (visibleId) {
    const layer = findLayer(visibleId);
    layer.visible = !layer.visible;
    scheduleSave();
    await refresh();
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  const actionLayerId = event.target.closest("[data-layer-action-id]")?.dataset.layerActionId;
  if (action === "close-panel") return closeLayerPanel();
  if (action === "add-layer") return elements.layerDialog.showModal();
  if (action === "edit-layer") return editLayer(actionLayerId);
  if (action === "rename-layer") return renameLayer(actionLayerId);
  if (action === "delete-layer") return deleteLayer(actionLayerId);
  if (action === "apply-reference-rectification") return applyReferenceRectification();
  if (action === "redetect-reference") return redetectReference();
  if (action === "cancel-reference-rectification") return finishReferenceRectification(false);
  if (action === "redetect") return redetectCanvas();
  if (action === "edit-corners") {
    if (view === "live") stopLiveTracking();
    project.mode = MODES.EDIT_CORNERS;
    elements.trackingLabel.textContent = "Manual corners";
    renderer?.setProjection(project.projection.quad, OVERLAY_OPACITY);
    scheduleSave();
    return refresh(false);
  }
  if (action === "capture") return capturePainting();
  const layer = selectedLayer();
  if (action === "rectify-reference") return beginReferenceRectification(layer);
  if (action === "done-reference") {
    project.activeLayerId = project.referenceGroup.id;
    project.mode = MODES.VIEW;
    scheduleSave();
    return refresh();
  }
  if (action === "edit-reference") {
    project.activeLayerId = project.referenceGroup.children[0]?.id ?? project.referenceGroup.id;
    project.mode = MODES.COMPOSE_REFERENCE;
    scheduleSave();
    return refresh();
  }
  if (action === "mask") return beginMaskSession(layer);
  if (action === "eyedropper") {
    project.mode = MODES.EYEDROPPER;
    scheduleSave();
    return refresh();
  }
  if (action === "mask-erase" || action === "mask-restore") {
    maskSettings.tool = action === "mask-erase" ? "erase" : "restore";
    if (project.mode !== MODES.MASK) await beginMaskSession(layer);
    renderInspector();
    return;
  }
  if (action === "mask-undo") return maskUndo();
  if (action === "mask-redo") return maskRedo();
  if (action === "mask-reset") return resetMask();
  if (action === "fit") layer.transform.scale = 1;
  if (action === "centre") Object.assign(layer.transform, { x: 0.5, y: 0.5 });
  if (action === "reset") Object.assign(layer.transform, { x: 0.5, y: 0.5, scale: 1, rotation: 0, flipX: false });
  if (action === "flip") layer.transform.flipX = !layer.transform.flipX;
  if (action === "pen" || action === "eraser") drawSettings.tool = action;
  if (action === "undo" && layer.strokes.length) layer.redo.push(layer.strokes.pop());
  if (action === "redo" && layer.redo.length) layer.strokes.push(layer.redo.pop());
  if (action === "clear") { layer.redo.push(...layer.strokes); layer.strokes = []; }
  scheduleSave();
  await refresh();
}

async function handleInspectorInput(event) {
  const field = event.target.dataset.field;
  if (!field) return;
  const layer = selectedLayer();
  if (field === "opacity") layer.opacity = Number(event.target.value);
  if (field === "blendMode") layer.blendMode = event.target.value;
  if (field === "keyEnabled") layer.colourKey.enabled = event.target.checked;
  if (field === "keyColour") layer.colourKey.colour = hexToRgb(event.target.value);
  if (field === "keyTolerance") layer.colourKey.tolerance = Number(event.target.value);
  if (field === "keySoftness") layer.colourKey.softness = Number(event.target.value);
  if (field === "drawColour") drawSettings.colour = event.target.value;
  if (field === "drawWidth") drawSettings.width = Number(event.target.value);
  if (field === "maskWidth") maskSettings.width = Number(event.target.value);
  if (field === "maskHardness") maskSettings.hardness = Number(event.target.value);
  scheduleSave();
  await refresh();
}

function toggleLayerPanel() {
  if (elements.inspector.classList.contains("open")) closeLayerPanel();
  else openLayerPanel();
}

function openLayerPanel() {
  elements.inspector.classList.add("open");
  elements.inspector.removeAttribute("inert");
  elements.inspector.setAttribute("aria-hidden", "false");
  elements.layersButton.setAttribute("aria-expanded", "true");
  elements.layersButton.setAttribute("aria-label", "Close layers");
  renderInspector();
}

function closeLayerPanel() {
  elements.inspector.classList.remove("open");
  elements.inspector.setAttribute("inert", "");
  elements.inspector.setAttribute("aria-hidden", "true");
  elements.layersButton.setAttribute("aria-expanded", "false");
  elements.layersButton.setAttribute("aria-label", "Open layers");
}

async function handleLayerTypeClick(event) {
  const type = event.target.closest("[data-layer-type]")?.dataset.layerType;
  if (!type) return;
  elements.layerDialog.close();
  if (type === "reference") {
    elements.referenceInput.click();
    return;
  }
  const number = project.layers.filter((layer) => layer.kind === "scribble").length + 1;
  const drawing = createScribbleLayer(`Drawing ${number}`);
  project.layers.push(drawing);
  project.activeLayerId = drawing.id;
  editingLayerId = drawing.id;
  project.mode = MODES.DRAW;
  await setView("canonical");
  openLayerPanel();
  scheduleSave();
}

async function editLayer(layerId) {
  const layer = findLayer(layerId);
  if (!layer) return;
  if (layer.kind === "reference-group") {
    const child = layer.children.at(-1);
    if (!child) {
      elements.layerDialog.showModal();
      return;
    }
    project.activeLayerId = child.id;
    editingLayerId = child.id;
    project.mode = MODES.COMPOSE_REFERENCE;
  } else {
    project.activeLayerId = layer.id;
    editingLayerId = layer.id;
    project.mode = layer.kind === "scribble" ? MODES.DRAW : layer.kind === "reference-item" ? MODES.COMPOSE_REFERENCE : MODES.VIEW;
  }
  await setView("canonical");
  scheduleSave();
}

function renameLayer(layerId) {
  const layer = findLayer(layerId);
  if (!layer) return;
  if (renamingLayerId === layerId) return commitLayerRename(layerId);
  renamingLayerId = layerId;
  renderInspector();
  const input = elements.inspector.querySelector(`[data-rename-input="${layerId}"]`);
  input?.focus();
  input?.select();
}

function commitLayerRename(layerId) {
  const layer = findLayer(layerId);
  const input = elements.inspector.querySelector(`[data-rename-input="${layerId}"]`);
  const name = input?.value.trim();
  renamingLayerId = null;
  if (!layer || !name) {
    renderInspector();
    return;
  }
  layer.name = name;
  scheduleSave();
  renderInspector();
}

function handleInspectorKeyDown(event) {
  const layerId = event.target.dataset.renameInput;
  if (!layerId) return;
  if (event.key === "Enter") {
    event.preventDefault();
    commitLayerRename(layerId);
  }
  if (event.key === "Escape") {
    renamingLayerId = null;
    renderInspector();
  }
}

async function deleteLayer(layerId) {
  const layer = findLayer(layerId);
  if (!layer || layer.kind === "reference-group" || !confirm(`Delete “${layer.name}”?`)) return;
  if (maskSession?.layerId === layer.id) maskSession = null;
  const removed = removeLayer(project, layerId);
  if (!removed) return;
  if (editingLayerId === layerId) editingLayerId = null;
  if (renamingLayerId === layerId) renamingLayerId = null;
  await deleteUnusedLayerAssets(removed);
  project.mode = MODES.VIEW;
  scheduleSave();
  await refresh();
}

async function deleteUnusedLayerAssets(layer) {
  const remaining = [project.referenceGroup, ...project.referenceGroup.children, ...project.layers];
  const retainedIds = new Set(remaining.flatMap(layerAssetIds));
  for (const assetId of new Set(layerAssetIds(layer))) {
    if (!assetId || retainedIds.has(assetId)) continue;
    assetCache.forget(assetId);
    await store.deleteAsset(assetId);
  }
}

function layerAssetIds(layer) {
  return [layer.assetId, layer.sourceAssetId, layer.maskAssetId].filter(Boolean);
}

function beginLayerDrag(event) {
  if (event.button !== 0 || event.target.closest(".mini-icon-button, input, select, label")) return;
  const row = event.target.closest("[data-layer-id]");
  const layer = findLayer(row?.dataset.layerId);
  if (!row || !layer) return;
  const collection = layerCollection(project, layer.id);
  layerDrag = {
    pointerId: event.pointerId,
    layerId: layer.id,
    row,
    startX: event.clientX,
    startY: event.clientY,
    startIndex: collection?.indexOf(layer) ?? -1,
    originalOpacity: layer.opacity,
    rowHeight: Math.max(44, row.getBoundingClientRect().height),
    direction: null,
    moved: false,
  };
  elements.inspector.setPointerCapture(event.pointerId);
}

function updateLayerDrag(event) {
  if (!layerDrag || event.pointerId !== layerDrag.pointerId) return;
  const deltaX = event.clientX - layerDrag.startX;
  const deltaY = event.clientY - layerDrag.startY;
  if (!layerDrag.direction && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8) {
    const canReorder = layerCollection(project, layerDrag.layerId);
    layerDrag.direction = Math.abs(deltaX) >= Math.abs(deltaY) || !canReorder ? "opacity" : "reorder";
    layerDrag.moved = true;
  }
  if (layerDrag.direction === "opacity") {
    const layer = findLayer(layerDrag.layerId);
    layer.opacity = Math.max(0, Math.min(1, layerDrag.originalOpacity + deltaX / Math.max(160, layerDrag.row.clientWidth)));
    const percent = Math.round(layer.opacity * 100);
    layerDrag.row.style.setProperty("--layer-opacity", `${percent}%`);
    const value = layerDrag.row.querySelector(".layer-name span");
    if (value) value.textContent = `${percent}%`;
    requestEditorPreview();
  }
  if (layerDrag.direction === "reorder") {
    const steps = Math.round(deltaY / layerDrag.rowHeight);
    if (moveLayer(project, layerDrag.layerId, layerDrag.startIndex - steps)) {
      renderInspector();
      requestEditorPreview();
    }
  }
}

function finishLayerDrag(event) {
  if (!layerDrag || event.pointerId !== layerDrag.pointerId) return;
  if (elements.inspector.hasPointerCapture(event.pointerId)) elements.inspector.releasePointerCapture(event.pointerId);
  const moved = layerDrag.moved;
  layerDrag = null;
  if (!moved) return;
  suppressInspectorClick = true;
  setTimeout(() => { suppressInspectorClick = false; }, 0);
  scheduleSave();
  refresh().catch(showError);
}

async function togglePhotoView() {
  closeLayerPanel();
  if (view === "photo") return returnToCanvas();
  elements.photoInput.click();
}

async function toggleLiveView() {
  closeLayerPanel();
  if (view === "live") return returnToCanvas();
  await startCamera();
}

async function returnToCanvas() {
  project.mode = MODES.VIEW;
  await setView("canonical");
  scheduleSave();
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return showError(new Error("Camera access is unavailable. Use Photo instead."));
  stopCamera();
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
      },
      audio: false,
    });
    elements.cameraVideo.srcObject = cameraStream;
    await elements.cameraVideo.play();
    background = elements.cameraVideo;
    project.source = { kind: "live", assetId: null };
    project.mode = MODES.EDIT_CORNERS;
    await setView("live");
    await redetectCanvas();
  } catch (error) {
    showError(new Error(`Camera could not start: ${error.message}`));
  }
}

async function redetectCanvas() {
  const source = view === "live" ? elements.cameraVideo : background;
  if (!source) return;
  canvasDetectionAbort?.abort();
  const detectionView = view;
  const detectionAbort = new AbortController();
  canvasDetectionAbort = detectionAbort;
  if (view === "live") stopLiveTracking();
  project.mode = MODES.EDIT_CORNERS;
  project.projection.tracking = "searching";
  project.projection.confidence = 0;
  elements.trackingLabel.textContent = "Searching for canvas...";
  renderer?.setProjection(project.projection.quad, view === "live" ? 0 : OVERLAY_OPACITY);
  try {
    const result = await detectCanvasQuad(source, project.canvas.ratioWidth / project.canvas.ratioHeight, 480, { signal: detectionAbort.signal });
    if (view !== detectionView || detectionAbort.signal.aborted) return;
    if (!result) throw new Error("No plausible canvas found");
    project.projection.quad = result.quad;
    project.projection.confidence = result.confidence;
    project.projection.tracking = view === "live" ? "tracking" : "detected";
    project.mode = view === "live" ? MODES.VIEW : MODES.EDIT_CORNERS;
    elements.trackingLabel.textContent = view === "live" ? "Tracking canvas" : "Canvas detected";
    renderer?.setProjection(result.quad, OVERLAY_OPACITY);
    drawInteraction();
    scheduleSave();
    if (view === "live") await startLiveTracking(source, result.quad);
  } catch (error) {
    if (error.name === "AbortError" || view !== detectionView) return;
    project.projection.tracking = view === "live" ? "searching" : "manual";
    project.projection.confidence = 0;
    elements.trackingLabel.textContent = view === "live"
      ? "Searching for canvas..."
      : error.message.includes("manually") ? error.message : `${error.message}. Adjust corners manually.`;
    renderer?.setProjection(project.projection.quad, view === "live" ? 0 : OVERLAY_OPACITY);
    drawInteraction();
    if (view === "live") scheduleReacquisition();
  } finally {
    if (canvasDetectionAbort === detectionAbort) canvasDetectionAbort = null;
  }
}

async function startLiveTracking(source, quad) {
  canvasTracker = new CanvasTracker();
  const featureCount = await canvasTracker.initialize(source, quad);
  if (featureCount < 8) {
    canvasTracker.dispose();
    canvasTracker = null;
    throw new Error("Not enough image detail to track the canvas");
  }
  queueTrackingFrame();
}

function queueTrackingFrame(delay = 0) {
  if (!canvasTracker || view !== "live" || !cameraStream) return;
  if (delay > 0) {
    trackingFrameKind = "timeout";
    trackingFrame = setTimeout(() => {
      trackingFrame = 0;
      queueTrackingFrame();
    }, delay);
    return;
  }
  if (typeof elements.cameraVideo.requestVideoFrameCallback === "function") {
    trackingFrameKind = "video";
    trackingFrame = elements.cameraVideo.requestVideoFrameCallback(trackLiveFrame);
  } else {
    trackingFrameKind = "animation";
    trackingFrame = requestAnimationFrame(trackLiveFrame);
  }
}

function trackLiveFrame() {
  trackingFrame = 0;
  if (!canvasTracker || view !== "live" || !cameraStream) return;
  const startedAt = performance.now();
  try {
    const result = canvasTracker.track(elements.cameraVideo);
    const processingMs = performance.now() - startedAt;
    if (processingMs > TRACKING_PROCESSING_LIMIT_MS) {
      project.projection.tracking = "manual";
      project.projection.confidence = 0;
      project.mode = MODES.EDIT_CORNERS;
      stopLiveTracking();
      renderer?.setProjection(project.projection.quad, OVERLAY_OPACITY);
      elements.trackingLabel.textContent = "Tracking paused to keep this device responsive. Adjust corners or Redetect.";
      drawInteraction();
      return;
    }
    project.projection.confidence = result.confidence;
    if (result.confidence >= 0.35) {
      project.projection.quad = result.quad;
      project.projection.tracking = "tracking";
      const opacity = OVERLAY_OPACITY * Math.min(1, result.confidence / 0.65);
      renderer?.setProjection(result.quad, opacity);
      elements.trackingLabel.textContent = `Tracking canvas ${Math.round(result.confidence * 100)}%`;
      queueTrackingFrame(trackingScheduleDelay(processingMs));
      return;
    }
    project.projection.tracking = "searching";
    renderer?.setProjection(project.projection.quad, 0);
    elements.trackingLabel.textContent = "Tracking lost. Searching...";
    stopLiveTracking();
    scheduleReacquisition();
  } catch (error) {
    console.warn("Live tracking paused", error);
    project.projection.tracking = "searching";
    renderer?.setProjection(project.projection.quad, 0);
    elements.trackingLabel.textContent = "Searching for canvas...";
    stopLiveTracking();
    scheduleReacquisition();
  }
}

function scheduleReacquisition() {
  clearTimeout(reacquireTimer);
  if (view !== "live" || !cameraStream) return;
  reacquireTimer = setTimeout(() => {
    reacquireTimer = 0;
    redetectCanvas();
  }, 700);
}

function stopLiveTracking() {
  clearTimeout(reacquireTimer);
  reacquireTimer = 0;
  if (trackingFrame) {
    if (trackingFrameKind === "video" && typeof elements.cameraVideo.cancelVideoFrameCallback === "function") {
      elements.cameraVideo.cancelVideoFrameCallback(trackingFrame);
    } else if (trackingFrameKind === "timeout") {
      clearTimeout(trackingFrame);
    } else {
      cancelAnimationFrame(trackingFrame);
    }
  }
  trackingFrame = 0;
  trackingFrameKind = null;
  canvasTracker?.dispose();
  canvasTracker = null;
}

async function capturePainting() {
  if (captureInProgress) return;
  const sourceView = view;
  const source = sourceView === "live" ? freezeVideoFrame(elements.cameraVideo) : background;
  if (!source) return;
  captureInProgress = true;
  canvasDetectionAbort?.abort();
  elements.trackingLabel.textContent = "Rectifying capture...";
  try {
    const { width, height } = project.canvas.resolution;
    const blob = await rectifySource(source, project.projection.quad, width, height);
    const assetId = makeId("asset");
    await store.putAsset({ id: assetId, projectId: project.id, blob, kind: "capture" });
    const layerPrefix = sourceView === "photo" ? "Photo" : "Capture";
    const captureNumber = project.layers.filter((layer) => layer.kind === "capture" && layer.name.startsWith(layerPrefix)).length + 1;
    const capture = createCaptureLayer(assetId, `${layerPrefix} ${String(captureNumber).padStart(2, "0")}`, { width, height });
    project.layers.push(capture);
    project.activeLayerId = capture.id;
    stopCamera();
    project.mode = MODES.VIEW;
    await setView("canonical");
    await saveNow();
  } catch (error) {
    showError(new Error(`Capture could not be rectified: ${error.message}`));
  } finally {
    captureInProgress = false;
  }
}

async function beginReferenceRectification(layer) {
  if (layer?.kind !== "reference-item") return;
  const sourceAssetId = layer.sourceAssetId ?? layer.assetId;
  layer.sourceAssetId = sourceAssetId;
  const image = await assetCache.get(sourceAssetId);
  if (!image) return showError(new Error("The original reference image is unavailable"));
  rectificationSession = { layerId: layer.id, image, quad: defaultQuad() };
  project.mode = MODES.EDIT_CORNERS;
  await setView("canonical");
  await redetectReference();
}

async function redetectReference() {
  if (!rectificationSession) return;
  rectificationSession.detectionAbort?.abort();
  const session = rectificationSession;
  session.detectionAbort = new AbortController();
  elements.trackingLabel.textContent = "Finding source image corners...";
  try {
    const aspect = project.canvas.ratioWidth / project.canvas.ratioHeight;
    const result = await detectCanvasQuad(session.image, aspect, 480, { signal: session.detectionAbort.signal });
    if (rectificationSession !== session) return;
    if (!result) throw new Error("No plausible rectangle found");
    session.quad = result.quad;
    elements.trackingLabel.textContent = "Source image detected. Adjust if needed.";
  } catch (error) {
    if (error.name === "AbortError" || rectificationSession !== session) return;
    elements.trackingLabel.textContent = error.message.includes("manually") ? error.message : `${error.message}. Adjust corners manually.`;
  }
  await refresh(false);
}

async function applyReferenceRectification() {
  if (!rectificationSession) return;
  const layer = findLayer(rectificationSession.layerId);
  if (!layer) return finishReferenceRectification(false);
  elements.trackingLabel.textContent = "Rectifying reference...";
  try {
    const { width, height } = project.canvas.resolution;
    const blob = await rectifySource(rectificationSession.image, rectificationSession.quad, width, height);
    const assetId = makeId("asset");
    await store.putAsset({ id: assetId, projectId: project.id, blob, kind: "rectified-reference" });
    if (layer.assetId !== layer.sourceAssetId) {
      assetCache.forget(layer.assetId);
      await store.deleteAsset(layer.assetId);
    }
    if (layer.maskAssetId) {
      assetCache.forget(layer.maskAssetId);
      await store.deleteAsset(layer.maskAssetId);
      layer.maskAssetId = null;
    }
    layer.assetId = assetId;
    layer.dimensions = { width, height };
    rectificationSession = null;
    project.mode = MODES.COMPOSE_REFERENCE;
    await setView("canonical");
    await saveNow();
  } catch (error) {
    showError(new Error(`Reference could not be rectified: ${error.message}`));
  }
}

async function finishReferenceRectification(save) {
  rectificationSession?.detectionAbort?.abort();
  rectificationSession = null;
  project.mode = MODES.COMPOSE_REFERENCE;
  await setView("canonical");
  if (save) scheduleSave();
}

function freezeVideoFrame(video) {
  const { width, height } = imageDimensions(video);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(video, 0, 0, width, height);
  return canvas;
}

function stopCamera() {
  stopLiveTracking();
  renderer?.stop();
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  elements.cameraVideo.srcObject = null;
}

function pointerDown(event) {
  if (!project) return;
  elements.interactionCanvas.setPointerCapture(event.pointerId);
  const point = normalizedPointer(event, elements.interactionCanvas);
  pointers.set(event.pointerId, point);
  navigationPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (navigationPointers.size === 2) {
    beginPinchNavigation();
    return;
  }
  if (suppressEditingUntilPointersClear) return;
  if (project.mode === MODES.EDIT_CORNERS && view === "canonical" && rectificationSession) {
    activeCorner = nearestCorner(point, rectificationSession.quad, 0.12);
    if (activeCorner >= 0) {
      interactionRollback = { type: "corner", quad: rectificationSession.quad, index: activeCorner, point: { ...rectificationSession.quad[activeCorner] } };
      rectificationSession.quad[activeCorner] = point;
    }
  }
  if (project.mode === MODES.EDIT_CORNERS && view !== "canonical") {
    activeCorner = nearestCorner(point, project.projection.quad, 0.12);
    if (activeCorner >= 0) {
      interactionRollback = { type: "corner", quad: project.projection.quad, index: activeCorner, point: { ...project.projection.quad[activeCorner] } };
      canvasDetectionAbort?.abort();
      canvasDetectionAbort = null;
      clearTimeout(reacquireTimer);
      reacquireTimer = 0;
      project.projection.tracking = "manual";
      updateCorner(point);
      renderer?.setProjection(project.projection.quad, OVERLAY_OPACITY);
      elements.trackingLabel.textContent = "Manual corners";
    }
  }
  if (project.mode === MODES.DRAW && view === "canonical") {
    const layer = selectedLayer();
    if (layer?.kind !== "scribble") return;
    interactionRollback = { type: "stroke", layer, redo: [...layer.redo] };
    activeStroke = { tool: drawSettings.tool, colour: drawSettings.colour, width: drawSettings.width, opacity: 1, points: [point] };
    layer.strokes.push(activeStroke);
    layer.redo = [];
  }
  if (project.mode === MODES.MASK && view === "canonical" && maskSession) {
    brushCursor = point;
    const imageData = maskSession.context.getImageData(0, 0, maskSession.canvas.width, maskSession.canvas.height);
    interactionRollback = { type: "mask", imageData, redo: [...maskSession.redo] };
    maskSession.undo.push(imageData);
    maskSession.redo = [];
    maskSession.lastPoint = maskPoint(point, selectedLayer());
    paintMaskPoint(maskSession.lastPoint);
    requestEditorPreview();
  }
  if (project.mode === MODES.EYEDROPPER && view === "canonical" && isRasterLayer(selectedLayer())) {
    pickLayerColour(point).catch(showError);
  }
  if (project.mode === MODES.COMPOSE_REFERENCE && selectedLayer()?.kind === "reference-item") {
    interactionRollback = { type: "reference", layer: selectedLayer(), transform: { ...selectedLayer().transform } };
    resetGesture();
  }
}

function pointerMove(event) {
  if (navigationPointers.has(event.pointerId)) navigationPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinchStart && navigationPointers.size >= 2) {
    const gesture = gestureFromPointers(navigationPointers);
    if (gesture.distance > 0 && pinchStart.distance > 0) {
      project.view = zoomViewAt(project.view, pinchStart.view.zoom * gesture.distance / pinchStart.distance, pinchStart.focus);
      applyCanvasView();
      drawInteraction();
    }
    return;
  }
  if (suppressEditingUntilPointersClear) return;
  const samples = normalizedPointerSamples(event, elements.interactionCanvas);
  const point = samples.at(-1);
  if (project?.mode === MODES.MASK && view === "canonical") {
    brushCursor = point;
    drawInteraction();
  }
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, point);
  if (activeCorner >= 0) {
    if (rectificationSession) rectificationSession.quad[activeCorner] = point;
    else updateCorner(point);
    drawLoupe(point);
    if (!rectificationSession) renderer?.setProjection(project.projection.quad, OVERLAY_OPACITY);
    drawInteraction();
  }
  if (activeStroke) {
    for (const sample of samples) appendDistinctPoint(activeStroke.points, sample);
    requestEditorPreview();
  }
  if (project.mode === MODES.MASK && maskSession?.lastPoint) {
    const layer = selectedLayer();
    for (const sample of samples) {
      const nextPoint = maskPoint(sample, layer);
      paintMaskLine(maskSession.lastPoint, nextPoint);
      maskSession.lastPoint = nextPoint;
    }
    requestEditorPreview();
  }
  if (gestureStart) {
    selectedLayer().transform = applyReferenceGesture(gestureStart.transform, gestureStart.gesture, gestureFromPointers(pointers));
    refresh();
  }
}

function pointerUp(event) {
  if (!pointers.has(event.pointerId)) return;
  pointers.delete(event.pointerId);
  navigationPointers.delete(event.pointerId);
  elements.loupe.hidden = true;
  if (suppressEditingUntilPointersClear) {
    pinchStart = null;
    if (!pointers.size) {
      suppressEditingUntilPointersClear = false;
      scheduleSave();
    }
    drawInteraction();
    return;
  }
  if (pointers.size && gestureStart) resetGesture();
  else gestureStart = null;
  if (activeCorner >= 0 && !rectificationSession || activeStroke) scheduleSave();
  if (maskSession?.lastPoint) {
    maskSession.lastPoint = null;
    persistMask().catch(showError);
  }
  activeCorner = -1;
  activeStroke = null;
  interactionRollback = null;
  if (event.pointerType === "touch") brushCursor = null;
  drawInteraction();
  if (!pointers.size) scheduleSave();
}

function pointerLeave() {
  if (pointers.size) return;
  brushCursor = null;
  drawInteraction();
}

function wheelZoom(event) {
  if (!project) return;
  event.preventDefault();
  const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? elements.stage.clientHeight : 1;
  const focus = zoomFocusFromPointer(event, elements.interactionCanvas);
  const zoom = project.view.zoom * Math.exp(-event.deltaY * deltaScale * 0.0015);
  project.view = zoomViewAt(project.view, zoom, focus);
  applyCanvasView();
  drawInteraction();
  scheduleSave();
}

function beginPinchNavigation() {
  cancelProvisionalInteraction();
  const gesture = gestureFromPointers(navigationPointers);
  pinchStart = {
    view: { ...project.view },
    distance: gesture.distance,
    focus: normalizedPointer({ clientX: gesture.centre.x, clientY: gesture.centre.y }, elements.interactionCanvas),
  };
  suppressEditingUntilPointersClear = true;
}

function cancelProvisionalInteraction() {
  if (interactionRollback?.type === "corner") {
    interactionRollback.quad[interactionRollback.index] = interactionRollback.point;
  }
  if (interactionRollback?.type === "stroke") {
    if (interactionRollback.layer.strokes.at(-1) === activeStroke) interactionRollback.layer.strokes.pop();
    interactionRollback.layer.redo = interactionRollback.redo;
  }
  if (interactionRollback?.type === "mask") {
    maskSession.context.putImageData(interactionRollback.imageData, 0, 0);
    if (maskSession.undo.at(-1) === interactionRollback.imageData) maskSession.undo.pop();
    maskSession.redo = interactionRollback.redo;
    maskSession.lastPoint = null;
    requestEditorPreview();
  }
  if (interactionRollback?.type === "reference") {
    interactionRollback.layer.transform = interactionRollback.transform;
  }
  interactionRollback = null;
  activeCorner = -1;
  activeStroke = null;
  gestureStart = null;
  brushCursor = null;
  elements.loupe.hidden = true;
}

function applyCanvasView() {
  if (!project) return;
  project.view ??= { panX: 0, panY: 0, zoom: 1, rotation: 0 };
  const { panX = 0, panY = 0, zoom = 1 } = project.view;
  elements.stage.style.transform = `translate(${panX * 100}%, ${panY * 100}%) scale(${zoom})`;
}

async function beginMaskSession(layer) {
  if (!isRasterLayer(layer)) return;
  const dimensions = layer.kind === "reference-item" ? layer.dimensions : project.canvas.resolution;
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (layer.maskAssetId) {
    const existing = await assetCache.get(layer.maskAssetId);
    if (existing) context.drawImage(existing, 0, 0, canvas.width, canvas.height);
  }
  maskSession = { layerId: layer.id, canvas, context, undo: [], redo: [], lastPoint: null };
  brushCursor = null;
  project.mode = MODES.MASK;
  await setView("canonical");
  scheduleSave();
}

function maskPoint(point, layer) {
  const canonical = project.canvas.resolution;
  return layer.kind === "reference-item" ? referenceSourcePoint(layer, point, canonical.width, canonical.height) : point;
}

function paintMaskPoint(point) {
  paintMaskLine(point, point);
}

function paintMaskLine(from, to) {
  if (!maskSession || !insideUnit(from) && !insideUnit(to)) return;
  const context = maskSession.context;
  const size = maskSettings.width * Math.min(maskSession.canvas.width, maskSession.canvas.height);
  const fromX = from.x * maskSession.canvas.width;
  const fromY = from.y * maskSession.canvas.height;
  const toX = to.x * maskSession.canvas.width;
  const toY = to.y * maskSession.canvas.height;
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const stampCount = Math.max(1, Math.ceil(distance / Math.max(1, size * 0.2)));
  context.save();
  context.globalCompositeOperation = maskSettings.tool === "erase" ? "destination-out" : "source-over";
  for (let index = 0; index <= stampCount; index += 1) {
    const progress = index / stampCount;
    const x = fromX + (toX - fromX) * progress;
    const y = fromY + (toY - fromY) * progress;
    const radius = size / 2;
    if (maskSettings.hardness >= 0.99) {
      context.fillStyle = "rgba(255,255,255,1)";
    } else {
      const gradient = context.createRadialGradient(x, y, radius * maskSettings.hardness, x, y, radius);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
    }
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

async function persistMask() {
  if (!maskSession) return;
  const layer = findLayer(maskSession.layerId);
  const assetId = layer.maskAssetId ?? makeId("mask");
  const blob = await canvasBlob(maskSession.canvas);
  await store.putAsset({ id: assetId, projectId: project.id, blob, kind: "mask" });
  layer.maskAssetId = assetId;
  assetCache.forget(assetId);
  scheduleSave();
  await refresh();
}

async function maskUndo() {
  if (!maskSession?.undo.length) return;
  maskSession.redo.push(maskSession.context.getImageData(0, 0, maskSession.canvas.width, maskSession.canvas.height));
  maskSession.context.putImageData(maskSession.undo.pop(), 0, 0);
  await persistMask();
}

async function maskRedo() {
  if (!maskSession?.redo.length) return;
  maskSession.undo.push(maskSession.context.getImageData(0, 0, maskSession.canvas.width, maskSession.canvas.height));
  maskSession.context.putImageData(maskSession.redo.pop(), 0, 0);
  await persistMask();
}

async function resetMask() {
  if (!maskSession) return;
  maskSession.undo.push(maskSession.context.getImageData(0, 0, maskSession.canvas.width, maskSession.canvas.height));
  maskSession.redo = [];
  maskSession.context.globalCompositeOperation = "source-over";
  maskSession.context.fillStyle = "white";
  maskSession.context.fillRect(0, 0, maskSession.canvas.width, maskSession.canvas.height);
  await persistMask();
}

async function pickLayerColour(point) {
  const layer = selectedLayer();
  const image = await assetCache.get(layer.assetId);
  const sample = maskPoint(point, layer);
  if (!insideUnit(sample)) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(image, sample.x * image.width, sample.y * image.height, 1, 1, 0, 0, 1, 1);
  layer.colourKey.colour = [...canvas.getContext("2d").getImageData(0, 0, 1, 1).data.slice(0, 3)];
  layer.colourKey.enabled = true;
  project.mode = layer.kind === "reference-item" ? MODES.COMPOSE_REFERENCE : MODES.VIEW;
  scheduleSave();
  await refresh();
}

function resetGesture() {
  gestureStart = { transform: { ...selectedLayer().transform }, gesture: gestureFromPointers(pointers) };
}

function updateCorner(point) {
  project.projection.quad[activeCorner] = point;
  project.projection.confidence = 1;
  project.projection.tracking = "manual";
}

function drawInteraction() {
  const canvas = elements.interactionCanvas;
  const bounds = elements.stage.getBoundingClientRect();
  const scale = Math.min(devicePixelRatio || 1, 2);
  const pixelWidth = Math.max(1, Math.round(bounds.width * scale));
  const pixelHeight = Math.max(1, Math.round(bounds.height * scale));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = canvas.getContext("2d");
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  if (!project) return;
  if (view === "canonical" && rectificationSession) drawQuad(context, bounds.width, bounds.height, rectificationSession.quad);
  if (view !== "canonical" && project.mode === MODES.EDIT_CORNERS) drawQuad(context, bounds.width, bounds.height);
  if (view === "canonical" && project.mode === MODES.COMPOSE_REFERENCE) drawReferenceSelection(context, bounds.width, bounds.height);
  if (view === "canonical" && project.mode === MODES.MASK && brushCursor) drawMaskCursor(context, bounds.width, bounds.height);
}

function drawMaskCursor(context, width, height) {
  const layer = findLayer(maskSession?.layerId);
  if (!layer) return;
  let radius = maskSettings.width * Math.min(width, height) / 2;
  if (layer.kind === "reference-item") {
    const bounds = referenceBounds(layer, width, height);
    const sourceScale = bounds.width / layer.dimensions.width;
    radius = maskSettings.width * Math.min(layer.dimensions.width, layer.dimensions.height) * sourceScale / 2;
  }
  const x = brushCursor.x * width;
  const y = brushCursor.y * height;
  context.save();
  context.fillStyle = maskSettings.tool === "erase" ? "rgb(216 79 53 / 18%)" : "rgb(73 214 208 / 18%)";
  context.strokeStyle = "white";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(x, y, Math.max(2, radius), 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = maskSettings.tool === "erase" ? "#d84f35" : "#49d6d0";
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

function requestEditorPreview() {
  previewDirty = true;
  if (previewFrame || previewRunning) return;
  previewFrame = requestAnimationFrame(async () => {
    previewFrame = 0;
    previewDirty = false;
    previewRunning = true;
    try {
      await refresh(true, false);
    } catch (error) {
      showError(error);
    } finally {
      previewRunning = false;
      if (previewDirty) requestEditorPreview();
    }
  });
}

function appendDistinctPoint(points, point) {
  const previous = points.at(-1);
  if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.0001) points.push(point);
}

function drawQuad(context, width, height, quad = project.projection.quad) {
  const points = quad.map((point) => ({ x: point.x * width, y: point.y * height }));
  context.strokeStyle = "#49d6d0";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (const point of [...points.slice(1), points[0]]) context.lineTo(point.x, point.y);
  context.stroke();
  for (const [index, point] of points.entries()) {
    context.fillStyle = index === activeCorner ? "#d84f35" : "#fbfaf6";
    context.strokeStyle = "#202622";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(point.x, point.y, 11, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(point.x - 5, point.y);
    context.lineTo(point.x + 5, point.y);
    context.moveTo(point.x, point.y - 5);
    context.lineTo(point.x, point.y + 5);
    context.stroke();
  }
}

function drawReferenceSelection(context, width, height) {
  const item = selectedLayer();
  if (item?.kind !== "reference-item") return;
  const bounds = referenceBounds(item, width, height);
  context.save();
  context.translate(bounds.x, bounds.y);
  context.rotate(item.transform.rotation);
  context.strokeStyle = "#49d6d0";
  context.lineWidth = 2;
  context.setLineDash([7, 5]);
  context.strokeRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
  context.restore();
}

function drawLoupe(point) {
  const source = rectificationSession?.image ?? (view === "live" ? elements.cameraVideo : background);
  if (!source) return;
  const loupe = elements.loupe;
  const size = 48;
  const dimensions = imageDimensions(source);
  const sourceX = point.x * dimensions.width;
  const sourceY = point.y * dimensions.height;
  const context = loupe.getContext("2d");
  context.clearRect(0, 0, loupe.width, loupe.height);
  context.drawImage(source, sourceX - size / 2, sourceY - size / 2, size, size, 0, 0, loupe.width, loupe.height);
  context.strokeStyle = "#d84f35";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(58, 80); context.lineTo(102, 80);
  context.moveTo(80, 58); context.lineTo(80, 102);
  context.stroke();
  loupe.style.left = `${point.x < 0.5 ? 70 : 8}%`;
  loupe.style.top = `${point.y < 0.45 ? 58 : 8}%`;
  loupe.hidden = false;
}

function selectedLayer() {
  return findLayer(project?.activeLayerId);
}

function findLayer(id) {
  if (!project || !id) return null;
  if (project.referenceGroup.id === id) return project.referenceGroup;
  return project.referenceGroup.children.find((item) => item.id === id) ?? project.layers.find((layer) => layer.id === id) ?? null;
}

function scheduleSave() {
  if (!project) return;
  touchProject(project);
  elements.saveState.textContent = "Saving...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 350);
}

async function saveNow() {
  clearTimeout(saveTimer);
  if (!project) return;
  await store.saveProject(project);
  elements.saveState.textContent = "Saved locally";
}

function showError(error) {
  console.error(error);
  elements.trackingLabel.textContent = error.message;
}

function imageFromBlob(blob) {
  if (globalThis.createImageBitmap) return createImageBitmap(blob, { imageOrientation: "from-image" });
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = reject;
    image.src = url;
  });
}

function imageDimensions(source) {
  return {
    width: source?.videoWidth || source?.naturalWidth || source?.width || 1,
    height: source?.videoHeight || source?.naturalHeight || source?.height || 1,
  };
}

function roundedRatio(value) { return Number(value.toFixed(4)); }
function isRasterLayer(layer) { return layer?.kind === "reference-item" || layer?.kind === "capture"; }
function insideUnit(point) { return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1; }
function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode mask")), "image/png"));
}
function titleCase(value) { return value.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()); }
function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
function rgbToHex(rgb) { return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`; }
function hexToRgb(value) { return [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16)); }
function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]);
}