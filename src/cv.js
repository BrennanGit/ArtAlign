import { homographyFromQuad, isPlausibleQuad, orderCorners, quadArea, smoothQuad } from "./geometry.js";

const OPEN_CV_URL = "https://docs.opencv.org/4.13.0/opencv.js";
let openCvPromise = null;

export function loadOpenCv(url = OPEN_CV_URL) {
  if (globalThis.cv?.Mat) return Promise.resolve(globalThis.cv);
  if (openCvPromise) return openCvPromise;
  openCvPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(() => fail(new Error("OpenCV loading timed out. Manual corners remain available.")), 12000);
    const fail = (error) => {
      clearTimeout(timeout);
      script.remove();
      openCvPromise = null;
      reject(error);
    };
    script.src = url;
    script.async = true;
    script.onload = async () => {
      try {
        const candidate = globalThis.cv instanceof Promise ? await globalThis.cv : globalThis.cv;
        await waitForRuntime(candidate);
        clearTimeout(timeout);
        resolve(candidate);
      } catch (error) {
        fail(error);
      }
    };
    script.onerror = () => fail(new Error("OpenCV could not be loaded. Manual corners remain available."));
    document.head.append(script);
  });
  return openCvPromise;
}

export async function detectCanvasQuad(source, expectedAspect = 1, maxDimension = 480, options = {}) {
  const frame = sourceCanvas(source, maxDimension);
  const image = frame.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, frame.width, frame.height);
  return detectInWorker(image, expectedAspect, options.signal);
}

export function scoreQuadCandidate(quad, expectedAspect = 1) {
  if (!isPlausibleQuad(quad)) return 0;
  const top = distance(quad[0], quad[1]);
  const right = distance(quad[1], quad[2]);
  const bottom = distance(quad[2], quad[3]);
  const left = distance(quad[3], quad[0]);
  const observedAspect = (top + bottom) / Math.max(0.001, right + left);
  const aspectPenalty = Math.abs(Math.log(observedAspect / Math.max(0.001, expectedAspect)));
  const centre = quad.reduce((point, corner) => ({ x: point.x + corner.x / 4, y: point.y + corner.y / 4 }), { x: 0, y: 0 });
  const centrePenalty = Math.hypot(centre.x - 0.5, centre.y - 0.5);
  return quadArea(quad) / (1 + aspectPenalty * 0.45 + centrePenalty * 0.25);
}

export function trackingConfidence({ totalFeatures, trackedFeatures, meanError, quad, previousQuad }) {
  if (totalFeatures < 8 || trackedFeatures < 8 || !isPlausibleQuad(quad)) return 0;
  const featureScore = Math.min(1, trackedFeatures / 40) * Math.min(1, trackedFeatures / totalFeatures);
  const errorScore = Math.max(0, 1 - meanError / 24);
  const movement = previousQuad
    ? quad.reduce((sum, point, index) => sum + distance(point, previousQuad[index]), 0) / 4
    : 0;
  const consistencyScore = Math.max(0, 1 - movement / 0.32);
  return Math.max(0, Math.min(1, featureScore * 0.5 + errorScore * 0.3 + consistencyScore * 0.2));
}

export function trackingScheduleDelay(processingMs, targetInterval = 125, minimumYield = 80) {
  const duration = Number.isFinite(processingMs) ? Math.max(0, processingMs) : 0;
  return Math.max(minimumYield, targetInterval - duration);
}

export class CanvasTracker {
  constructor({ maxDimension = 320, smoothing = 0.32 } = {}) {
    this.maxDimension = maxDimension;
    this.smoothing = smoothing;
    this.cv = null;
    this.previousGray = null;
    this.previousPoints = null;
    this.quad = null;
  }

  async initialize(source, quad) {
    this.dispose();
    this.cv = await loadOpenCv();
    const frame = sourceCanvas(source, this.maxDimension);
    this.previousGray = grayscaleMat(this.cv, frame);
    this.previousPoints = this.#findFeatures(this.previousGray);
    this.quad = quad.map((point) => ({ ...point }));
    return this.previousPoints.rows;
  }

  track(source) {
    if (!this.cv || !this.previousGray || !this.previousPoints || !this.quad) {
      throw new Error("Canvas tracker is not initialized");
    }
    const frame = sourceCanvas(source, this.maxDimension);
    const currentGray = grayscaleMat(this.cv, frame);
    const nextPoints = new this.cv.Mat();
    const status = new this.cv.Mat();
    const errors = new this.cv.Mat();
    const totalFeatures = this.previousPoints.rows;
    let homography = null;
    let sourcePoints = null;
    let destinationPoints = null;
    let transformedPoints = null;

    try {
      this.cv.calcOpticalFlowPyrLK(
        this.previousGray,
        currentGray,
        this.previousPoints,
        nextPoints,
        status,
        errors,
        new this.cv.Size(15, 15),
        2,
        new this.cv.TermCriteria(this.cv.TermCriteria_COUNT | this.cv.TermCriteria_EPS, 20, 0.01),
      );
      const previous = [];
      const current = [];
      let errorTotal = 0;
      for (let index = 0; index < status.rows; index += 1) {
        const error = errors.data32F[index];
        if (!status.data[index] || !Number.isFinite(error) || error > 32) continue;
        previous.push(this.previousPoints.data32F[index * 2], this.previousPoints.data32F[index * 2 + 1]);
        current.push(nextPoints.data32F[index * 2], nextPoints.data32F[index * 2 + 1]);
        errorTotal += error;
      }
      const trackedFeatures = previous.length / 2;
      if (trackedFeatures < 8) return { quad: this.quad, confidence: 0, trackedFeatures };

      sourcePoints = this.cv.matFromArray(trackedFeatures, 1, this.cv.CV_32FC2, previous);
      destinationPoints = this.cv.matFromArray(trackedFeatures, 1, this.cv.CV_32FC2, current);
      homography = this.cv.findHomography(sourcePoints, destinationPoints, this.cv.RANSAC, 3);
      if (!homography || homography.empty()) return { quad: this.quad, confidence: 0, trackedFeatures };

      const quadPixels = this.quad.flatMap((point) => [point.x * frame.width, point.y * frame.height]);
      const sourceQuad = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, quadPixels);
      transformedPoints = new this.cv.Mat();
      this.cv.perspectiveTransform(sourceQuad, transformedPoints, homography);
      sourceQuad.delete();
      const candidate = Array.from({ length: 4 }, (_, index) => ({
        x: transformedPoints.data32F[index * 2] / frame.width,
        y: transformedPoints.data32F[index * 2 + 1] / frame.height,
      }));
      const confidence = trackingConfidence({
        totalFeatures,
        trackedFeatures,
        meanError: errorTotal / trackedFeatures,
        quad: candidate,
        previousQuad: this.quad,
      });
      if (confidence <= 0) return { quad: this.quad, confidence, trackedFeatures };

      this.quad = smoothQuad(this.quad, candidate, this.smoothing);
      this.previousGray.delete();
      this.previousPoints.delete();
      this.previousGray = currentGray.clone();
      this.previousPoints = trackedFeatures < 24
        ? this.#findFeatures(this.previousGray)
        : this.cv.matFromArray(trackedFeatures, 1, this.cv.CV_32FC2, current);
      return { quad: this.quad.map((point) => ({ ...point })), confidence, trackedFeatures };
    } finally {
      currentGray.delete();
      nextPoints.delete();
      status.delete();
      errors.delete();
      sourcePoints?.delete();
      destinationPoints?.delete();
      transformedPoints?.delete();
      homography?.delete();
    }
  }

  dispose() {
    this.previousGray?.delete();
    this.previousPoints?.delete();
    this.previousGray = null;
    this.previousPoints = null;
    this.quad = null;
  }

  #findFeatures(gray) {
    const points = new this.cv.Mat();
    const mask = new this.cv.Mat();
    try {
      this.cv.goodFeaturesToTrack(gray, points, 80, 0.01, 7, mask, 3, false, 0.04);
      return points;
    } finally {
      mask.delete();
    }
  }
}

export async function rectifySource(source, quad, width, height) {
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const gl = output.getContext("webgl", { alpha: false, antialias: true, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL is required to add a photo layer");
  const program = createRectificationProgram(gl);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "a_position");
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.uniform1i(gl.getUniformLocation(program, "u_source"), 0);
  gl.uniformMatrix3fv(gl.getUniformLocation(program, "u_homography"), false, transpose3(homographyFromQuad(quad)));
  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
  return canvasBlob(output);
}

function sourceCanvas(source, maxDimension = Infinity) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!sourceWidth || !sourceHeight) throw new Error("The image source is not ready");
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function grayscaleMat(cv, canvas) {
  const source = cv.imread(canvas);
  const gray = new cv.Mat();
  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    return gray;
  } finally {
    source.delete();
  }
}

function waitForRuntime(cv) {
  if (!cv) return Promise.reject(new Error("OpenCV did not expose a runtime"));
  if (cv.Mat) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (cv.Mat) resolve();
      else if (Date.now() - startedAt > 15000) reject(new Error("OpenCV runtime initialization timed out"));
      else setTimeout(check, 40);
    };
    check();
  });
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode rectified image")), "image/png"));
}

function detectInWorker(image, expectedAspect, signal) {
  if (typeof Worker === "undefined") {
    return Promise.reject(new Error("Automatic detection is unavailable. Adjust corners manually."));
  }
  return runCvWorker({
    operation: "detect",
    width: image.width,
    height: image.height,
    pixels: image.data.buffer,
    expectedAspect,
  }, [image.data.buffer], {
    signal,
    timeoutMs: 15000,
    timeoutMessage: "Automatic detection timed out. Adjust corners manually.",
  });
}

function runCvWorker(payload, transfers, { signal, timeoutMs, timeoutMessage }) {
  if (typeof Worker === "undefined") return Promise.reject(new Error("OpenCV workers are unavailable in this browser."));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./cv-worker.js", import.meta.url));
    const id = `${Date.now()}-${Math.random()}`;
    let settled = false;
    const timeout = setTimeout(() => finish(reject, new Error(timeoutMessage)), timeoutMs);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      callback(value);
    };
    const abort = () => finish(reject, new DOMException("Detection cancelled", "AbortError"));
    if (signal?.aborted) return abort();
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event) => {
      if (event.data.id !== id) return;
      if (event.data.error) finish(reject, new Error(event.data.error));
      else finish(resolve, event.data.result);
    };
    worker.onerror = (event) => finish(reject, new Error(event.message || "Automatic detection failed"));
    worker.postMessage({ id, openCvUrl: OPEN_CV_URL, ...payload }, transfers);
  });
}

function createRectificationProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_source;
    uniform mat3 u_homography;
    void main() {
      vec2 canonical = vec2(v_uv.x, 1.0 - v_uv.y);
      vec3 projected = u_homography * vec3(canonical, 1.0);
      vec2 sourcePoint = projected.xy / projected.z;
      gl_FragColor = texture2D(u_source, sourcePoint);
    }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function transpose3(matrix) {
  return new Float32Array([matrix[0], matrix[3], matrix[6], matrix[1], matrix[4], matrix[7], matrix[2], matrix[5], matrix[8]]);
}

function distance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}