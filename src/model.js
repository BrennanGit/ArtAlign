export const SCHEMA_VERSION = 1;
export const LONG_EDGE = 1800;

export const MODES = Object.freeze({
  VIEW: "VIEW",
  COMPOSE_REFERENCE: "COMPOSE_REFERENCE",
  EDIT_CORNERS: "EDIT_CORNERS",
  DRAW: "DRAW",
  MASK: "MASK",
  EYEDROPPER: "EYEDROPPER",
});

export const BLEND_MODES = Object.freeze(["normal", "multiply", "screen", "difference"]);

export const ASPECT_PRESETS = Object.freeze([
  { id: "custom", label: "Custom", width: 1, height: 1 },
  { id: "square", label: "1:1", width: 1, height: 1 },
  { id: "a-portrait", label: "A-series portrait", width: 1, height: Math.SQRT2 },
  { id: "a-landscape", label: "A-series landscape", width: Math.SQRT2, height: 1 },
  { id: "4:3-portrait", label: "4:3 portrait", width: 3, height: 4 },
  { id: "4:3-landscape", label: "4:3 landscape", width: 4, height: 3 },
  { id: "5:4-portrait", label: "5:4 portrait", width: 4, height: 5 },
  { id: "5:4-landscape", label: "5:4 landscape", width: 5, height: 4 },
  { id: "3:2-portrait", label: "3:2 portrait", width: 2, height: 3 },
  { id: "3:2-landscape", label: "3:2 landscape", width: 3, height: 2 },
]);

export function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function canonicalResolution(width, height, longEdge = LONG_EDGE) {
  assertPositiveRatio(width, height);
  if (width >= height) {
    return { width: longEdge, height: Math.max(1, Math.round((longEdge * height) / width)) };
  }
  return { width: Math.max(1, Math.round((longEdge * width) / height)), height: longEdge };
}

export function createProject({ name, ratioWidth, ratioHeight }) {
  assertPositiveRatio(ratioWidth, ratioHeight);
  const now = new Date().toISOString();
  const projectId = makeId("project");

  return {
    id: projectId,
    schemaVersion: SCHEMA_VERSION,
    name: name.trim() || "Untitled painting",
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    canvas: {
      ratioWidth,
      ratioHeight,
      resolution: canonicalResolution(ratioWidth, ratioHeight),
    },
    referenceGroup: {
      id: makeId("reference-group"),
      kind: "reference-group",
      name: "Reference",
      visible: true,
      opacity: 1,
      blendMode: "normal",
      children: [],
    },
    layers: [],
    activeLayerId: null,
    mode: MODES.VIEW,
    source: { kind: "none", assetId: null },
    projection: {
      quad: defaultQuad(),
      confidence: 0,
      tracking: "idle",
    },
    view: { panX: 0, panY: 0, zoom: 1, rotation: 0 },
  };
}

export function createReferenceItem(assetId, dimensions, name = "Reference") {
  return {
    id: makeId("reference"),
    kind: "reference-item",
    name,
    assetId,
    sourceAssetId: assetId,
    dimensions: { width: dimensions.width, height: dimensions.height },
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, flipX: false },
    visible: true,
    opacity: 1,
    blendMode: "normal",
    colourKey: defaultColourKey(),
    maskAssetId: null,
  };
}

export function createCaptureLayer(assetId, name, dimensions) {
  return {
    id: makeId("capture"),
    kind: "capture",
    name,
    assetId,
    dimensions: { width: dimensions.width, height: dimensions.height },
    visible: true,
    opacity: 1,
    blendMode: "normal",
    colourKey: defaultColourKey(),
    maskAssetId: null,
  };
}

export function createScribbleLayer(name = "Scribble") {
  return {
    id: makeId("scribble"),
    kind: "scribble",
    name,
    visible: true,
    opacity: 1,
    blendMode: "normal",
    strokes: [],
    redo: [],
  };
}

export function layerCollection(project, layerId) {
  if (project.referenceGroup.children.some((layer) => layer.id === layerId)) return project.referenceGroup.children;
  if (project.layers.some((layer) => layer.id === layerId)) return project.layers;
  return null;
}

export function moveLayer(project, layerId, targetIndex) {
  const layers = layerCollection(project, layerId);
  if (!layers) return false;
  const currentIndex = layers.findIndex((layer) => layer.id === layerId);
  const nextIndex = Math.max(0, Math.min(layers.length - 1, targetIndex));
  if (currentIndex === nextIndex) return false;
  const [layer] = layers.splice(currentIndex, 1);
  layers.splice(nextIndex, 0, layer);
  return true;
}

export function removeLayer(project, layerId) {
  const layers = layerCollection(project, layerId);
  if (!layers) return null;
  const index = layers.findIndex((layer) => layer.id === layerId);
  const [removed] = layers.splice(index, 1);
  if (project.activeLayerId === layerId) {
    project.activeLayerId = layers[Math.min(index, layers.length - 1)]?.id
      ?? project.layers.at(-1)?.id
      ?? project.referenceGroup.children.at(-1)?.id
      ?? project.referenceGroup.id;
  }
  return removed;
}

export function defaultColourKey() {
  return {
    enabled: false,
    colour: [255, 255, 255],
    tolerance: 24,
    softness: 36,
  };
}

export function defaultQuad(inset = 0.08) {
  return [
    { x: inset, y: inset },
    { x: 1 - inset, y: inset },
    { x: 1 - inset, y: 1 - inset },
    { x: inset, y: 1 - inset },
  ];
}

export function touchProject(project) {
  project.updatedAt = new Date().toISOString();
  return project;
}

function assertPositiveRatio(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new TypeError("Canvas ratio values must be positive numbers");
  }
}