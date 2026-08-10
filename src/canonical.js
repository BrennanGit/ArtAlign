import { BLEND_MODES } from "./model.js";

const canvasBlendModes = new Set(BLEND_MODES);

export class AssetCache {
  constructor(store) {
    this.store = store;
    this.images = new Map();
  }

  async get(assetId) {
    if (!assetId) return null;
    if (!this.images.has(assetId)) {
      this.images.set(assetId, this.#load(assetId));
    }
    return this.images.get(assetId);
  }

  forget(assetId) {
    const image = this.images.get(assetId);
    image?.then((value) => value?.close?.());
    this.images.delete(assetId);
  }

  async #load(assetId) {
    const blob = await this.store.getAsset(assetId);
    if (!blob) return null;
    if (globalThis.createImageBitmap) return createImageBitmap(blob, { imageOrientation: "from-image" });
    return loadImage(URL.createObjectURL(blob));
  }
}

export class CanonicalCompositor {
  constructor(assetCache) {
    this.assetCache = assetCache;
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d", { alpha: true });
  }

  async rebuild(project, options = {}) {
    const { width, height } = project.canvas.resolution;
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.clearRect(0, 0, width, height);

    const soloReference = project.referenceGroup.children.some((item) => item.id === options.soloLayerId);
    if (
      project.referenceGroup.visible
      && options.excludeLayerId !== project.referenceGroup.id
      && (!options.soloLayerId || options.soloLayerId === project.referenceGroup.id || soloReference)
    ) {
      await this.#drawReferenceGroup(project.referenceGroup, width, height, options);
    }
    for (const layer of project.layers) {
      if (!layer.visible || layer.id === options.excludeLayerId || options.soloLayerId && layer.id !== options.soloLayerId) continue;
      if (layer.kind === "scribble") this.#drawScribble(layer, width, height);
      if (layer.kind === "capture") await this.#drawRaster(layer, width, height, options);
    }
    return this.canvas;
  }

  async #drawReferenceGroup(group, width, height, options) {
    this.context.save();
    const isolateChild = group.children.some((item) => item.id === options.soloLayerId);
    this.context.globalAlpha = isolateChild ? 1 : group.opacity;
    this.context.globalCompositeOperation = isolateChild ? "source-over" : toCanvasBlend(group.blendMode);
    const groupCanvas = document.createElement("canvas");
    groupCanvas.width = width;
    groupCanvas.height = height;
    const groupContext = groupCanvas.getContext("2d");
    for (const item of group.children) {
      if (!item.visible || item.id === options.excludeLayerId || isolateChild && item.id !== options.soloLayerId) continue;
      await drawReferenceItem(
        groupContext,
        item,
        await this.assetCache.get(item.assetId),
        options.maskOverrideId === item.id ? options.maskOverride : await this.assetCache.get(item.maskAssetId),
        width,
        height,
        isolateChild,
      );
    }
    this.context.drawImage(groupCanvas, 0, 0);
    this.context.restore();
  }

  async #drawRaster(layer, width, height, options) {
    const image = await this.assetCache.get(layer.assetId);
    if (!image) return;
    const mask = options.maskOverrideId === layer.id ? options.maskOverride : await this.assetCache.get(layer.maskAssetId);
    const prepared = prepareRaster(image, mask, layer.colourKey, width, height, options.forceOpaqueId === layer.id);
    this.context.save();
    this.context.globalAlpha = options.forceOpaqueId === layer.id ? 1 : layer.opacity;
    this.context.globalCompositeOperation = toCanvasBlend(layer.blendMode);
    this.context.drawImage(prepared, 0, 0, width, height);
    this.context.restore();
  }

  #drawScribble(layer, width, height) {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerContext = layerCanvas.getContext("2d");
    layerContext.lineCap = "round";
    layerContext.lineJoin = "round";
    for (const stroke of layer.strokes) {
      if (stroke.points.length === 0) continue;
      layerContext.beginPath();
      layerContext.strokeStyle = stroke.colour;
      layerContext.lineWidth = stroke.width * Math.min(width, height);
      layerContext.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
      const first = stroke.points[0];
      layerContext.moveTo(first.x * width, first.y * height);
      if (stroke.points.length === 1) {
        layerContext.lineTo(first.x * width + 0.01, first.y * height);
      } else {
        for (let index = 1; index < stroke.points.length - 1; index += 1) {
          const point = stroke.points[index];
          const next = stroke.points[index + 1];
          layerContext.quadraticCurveTo(
            point.x * width,
            point.y * height,
            (point.x + next.x) * width / 2,
            (point.y + next.y) * height / 2,
          );
        }
        const last = stroke.points.at(-1);
        layerContext.quadraticCurveTo(last.x * width, last.y * height, last.x * width, last.y * height);
      }
      layerContext.stroke();
    }
    this.context.save();
    this.context.globalAlpha = layer.opacity;
    this.context.globalCompositeOperation = toCanvasBlend(layer.blendMode);
    this.context.drawImage(layerCanvas, 0, 0);
    this.context.restore();
  }
}

export function referenceBounds(item, canvasWidth, canvasHeight) {
  const fitScale = Math.min(canvasWidth / item.dimensions.width, canvasHeight / item.dimensions.height);
  const width = item.dimensions.width * fitScale * item.transform.scale;
  const height = item.dimensions.height * fitScale * item.transform.scale;
  return { x: item.transform.x * canvasWidth, y: item.transform.y * canvasHeight, width, height };
}

export function referenceSourcePoint(item, point, canvasWidth, canvasHeight) {
  const bounds = referenceBounds(item, canvasWidth, canvasHeight);
  const offsetX = point.x * canvasWidth - bounds.x;
  const offsetY = point.y * canvasHeight - bounds.y;
  const cosine = Math.cos(-item.transform.rotation);
  const sine = Math.sin(-item.transform.rotation);
  let localX = offsetX * cosine - offsetY * sine;
  const localY = offsetX * sine + offsetY * cosine;
  if (item.transform.flipX) localX *= -1;
  return {
    x: localX / bounds.width + 0.5,
    y: localY / bounds.height + 0.5,
  };
}

async function drawReferenceItem(context, item, image, mask, width, height, forceOpaque = false) {
  if (!image) return;
  const bounds = referenceBounds(item, width, height);
  const prepared = prepareRaster(image, mask, item.colourKey, item.dimensions.width, item.dimensions.height, forceOpaque);
  context.save();
  context.globalAlpha = forceOpaque ? 1 : item.opacity;
  context.globalCompositeOperation = forceOpaque ? "source-over" : toCanvasBlend(item.blendMode);
  context.translate(bounds.x, bounds.y);
  context.rotate(item.transform.rotation);
  context.scale(item.transform.flipX ? -1 : 1, 1);
  context.drawImage(prepared, -bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
  context.restore();
}

function prepareRaster(image, mask, colourKey, width, height, forceOpaque) {
  if ((!colourKey?.enabled && !mask) || forceOpaque) return image;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  if (colourKey?.enabled) applyColourKey(context, width, height, colourKey);
  if (mask) {
    context.globalCompositeOperation = "destination-in";
    context.drawImage(mask, 0, 0, width, height);
  }
  return canvas;
}

function applyColourKey(context, width, height, settings) {
  const pixels = context.getImageData(0, 0, width, height);
  const [red, green, blue] = settings.colour;
  const start = settings.tolerance;
  const end = start + Math.max(1, settings.softness);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const distance = Math.hypot(pixels.data[index] - red, pixels.data[index + 1] - green, pixels.data[index + 2] - blue);
    const keyAlpha = Math.max(0, Math.min(1, (distance - start) / (end - start)));
    pixels.data[index + 3] *= keyAlpha;
  }
  context.putImageData(pixels, 0, 0);
}

function toCanvasBlend(mode) {
  return canvasBlendModes.has(mode) ? (mode === "normal" ? "source-over" : mode) : "source-over";
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}