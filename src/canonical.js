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
      if (layer.kind === "guide") this.#drawGuide(layer, width, height);
    }
    return this.canvas;
  }

  drawSurroundings(project, context, viewportWidth, viewportHeight, stageBounds) {
    const { width, height } = project.canvas.resolution;
    context.save();
    context.beginPath();
    context.rect(0, 0, viewportWidth, viewportHeight);
    context.rect(stageBounds.x, stageBounds.y, stageBounds.width, stageBounds.height);
    context.clip("evenodd");
    context.translate(stageBounds.x, stageBounds.y);
    context.scale(stageBounds.width / width, stageBounds.height / height);
    for (const layer of project.layers) {
      if (layer.visible && layer.kind === "scribble" && layer.strokes.length) this.#drawScribble(layer, width, height, context);
    }
    context.restore();
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
    const prepared = prepareRaster(image, mask, layer.colourKey, layer.dimensions.width, layer.dimensions.height, options.forceOpaqueId === layer.id);
    const placement = layer.placement ?? { x: 0.5, y: 0.5, width: 1, height: 1 };
    this.context.save();
    this.context.globalAlpha = options.forceOpaqueId === layer.id ? 1 : layer.opacity;
    this.context.globalCompositeOperation = toCanvasBlend(layer.blendMode);
    if (isLayerTransformed(layer.transform)) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(prepared, (placement.x - placement.width / 2) * width, (placement.y - placement.height / 2) * height, placement.width * width, placement.height * height);
      drawTransformedCanvas(this.context, canvas, layer.transform, width, height);
    } else {
      this.context.drawImage(prepared, (placement.x - placement.width / 2) * width, (placement.y - placement.height / 2) * height, placement.width * width, placement.height * height);
    }
    this.context.restore();
  }

  #drawScribble(layer, width, height, context = this.context) {
    let minX = 0;
    let minY = 0;
    let maxX = width;
    let maxY = height;
    for (const stroke of layer.strokes) {
      const radius = stroke.width * Math.min(width, height) / 2 + 1;
      for (const point of stroke.points) {
        minX = Math.min(minX, Math.floor(point.x * width - radius));
        minY = Math.min(minY, Math.floor(point.y * height - radius));
        maxX = Math.max(maxX, Math.ceil(point.x * width + radius));
        maxY = Math.max(maxY, Math.ceil(point.y * height + radius));
      }
    }
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = maxX - minX;
    layerCanvas.height = maxY - minY;
    const layerContext = layerCanvas.getContext("2d");
    layerContext.lineCap = "round";
    layerContext.lineJoin = "round";
    if (minX || minY) layerContext.translate(-minX, -minY);
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
      } else if (stroke.tool === "line") {
        const end = stroke.points[1];
        layerContext.lineTo(end.x * width, end.y * height);
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
    context.save();
    context.globalAlpha = layer.opacity;
    context.globalCompositeOperation = toCanvasBlend(layer.blendMode);
    drawTransformedCanvas(context, layerCanvas, layer.transform, width, height, minX, minY);
    context.restore();
  }

  #drawGuide(layer, width, height) {
    const canvas = isLayerTransformed(layer.transform) ? document.createElement("canvas") : null;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas ? canvas.getContext("2d") : this.context;
    this.context.save();
    this.context.globalAlpha = layer.opacity;
    this.context.globalCompositeOperation = toCanvasBlend(layer.blendMode);
    context.strokeStyle = layer.colour;
    context.lineWidth = layer.thickness * Math.min(width, height);
    context.beginPath();
    for (const fraction of guidePositions(layer.horizontal)) {
      context.moveTo(0, fraction * height);
      context.lineTo(width, fraction * height);
    }
    for (const fraction of guidePositions(layer.vertical)) {
      context.moveTo(fraction * width, 0);
      context.lineTo(fraction * width, height);
    }
    context.stroke();
    if (canvas) drawTransformedCanvas(this.context, canvas, layer.transform, width, height);
    this.context.restore();
  }
}

export function guidePositions(divisions) {
  const count = Math.max(0, Math.min(100, Math.trunc(Number(divisions) || 0)));
  return Array.from({ length: Math.max(0, count - 1) }, (_, index) => (index + 1) / count);
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

export function layerSourcePoint(layer, point, canvasWidth, canvasHeight) {
  const { x = 0.5, y = 0.5, scale = 1, rotation = 0 } = layer.transform ?? {};
  const offsetX = (point.x - x) * canvasWidth;
  const offsetY = (point.y - y) * canvasHeight;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return {
    x: (offsetX * cosine + offsetY * sine) / (scale * canvasWidth) + 0.5,
    y: (-offsetX * sine + offsetY * cosine) / (scale * canvasHeight) + 0.5,
  };
}

function drawTransformedCanvas(context, canvas, transform, width, height, offsetX = 0, offsetY = 0) {
  if (!isLayerTransformed(transform)) return context.drawImage(canvas, offsetX, offsetY);
  context.translate(transform.x * width, transform.y * height);
  context.rotate(transform.rotation);
  context.scale(transform.scale, transform.scale);
  context.drawImage(canvas, offsetX - width / 2, offsetY - height / 2, canvas.width, canvas.height);
}

function isLayerTransformed(transform) {
  return transform && (transform.x !== 0.5 || transform.y !== 0.5 || transform.scale !== 1 || transform.rotation !== 0);
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