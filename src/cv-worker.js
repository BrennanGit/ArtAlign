self.onmessage = async (event) => {
  const { id, openCvUrl, width, height, pixels, expectedAspect } = event.data;
  try {
    const cv = await loadOpenCv(openCvUrl);
    const result = detectCanvasQuad(cv, width, height, pixels, expectedAspect);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error?.message || String(error) });
  }
};

let openCvPromise = null;

function loadOpenCv(url) {
  if (self.cv?.Mat) return Promise.resolve(self.cv);
  if (openCvPromise) return openCvPromise;
  openCvPromise = new Promise((resolve, reject) => {
    try {
      self.importScripts(url);
    } catch (error) {
      reject(error);
      return;
    }
    Promise.resolve(self.cv).then((cv) => waitForRuntime(cv).then(() => resolve(cv), reject), reject);
  });
  return openCvPromise;
}

function waitForRuntime(cv) {
  if (!cv) return Promise.reject(new Error("OpenCV did not expose a worker runtime"));
  if (cv.Mat) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (cv.Mat) resolve();
      else if (Date.now() - startedAt > 12000) reject(new Error("OpenCV worker initialization timed out"));
      else setTimeout(check, 40);
    };
    check();
  });
}

function detectCanvasQuad(cv, width, height, pixels, expectedAspect) {
  const source = new cv.Mat(height, width, cv.CV_8UC4);
  source.data.set(new Uint8Array(pixels));
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let best = null;

  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.Canny(blurred, edges, 55, 165);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    const frameArea = width * height;
    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);
      const approximation = new cv.Mat();
      try {
        if (Math.abs(cv.contourArea(contour)) < frameArea * 0.025) continue;
        const perimeter = cv.arcLength(contour, true);
        cv.approxPolyDP(contour, approximation, perimeter * 0.025, true);
        if (approximation.rows !== 4 || !cv.isContourConvex(approximation)) continue;
        const area = Math.abs(cv.contourArea(approximation));
        if (area < frameArea * 0.035) continue;
        const points = [];
        for (let pointIndex = 0; pointIndex < 4; pointIndex += 1) {
          points.push({
            x: approximation.data32S[pointIndex * 2] / width,
            y: approximation.data32S[pointIndex * 2 + 1] / height,
          });
        }
        const quad = orderCorners(points);
        if (!isPlausibleQuad(quad)) continue;
        const score = scoreQuadCandidate(quad, expectedAspect);
        if (!best || score > best.score) best = { quad, score };
      } finally {
        approximation.delete();
        contour.delete();
      }
    }
  } finally {
    source.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }

  return best ? { quad: best.quad, confidence: Math.min(1, best.score / 0.55) } : null;
}

function scoreQuadCandidate(quad, expectedAspect) {
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

function orderCorners(points) {
  const centre = points.reduce((sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }), { x: 0, y: 0 });
  const ordered = [...points].sort((first, second) => Math.atan2(first.y - centre.y, first.x - centre.x) - Math.atan2(second.y - centre.y, second.x - centre.x));
  const start = ordered.reduce((best, point, index) => point.x + point.y < ordered[best].x + ordered[best].y ? index : best, 0);
  return [...ordered.slice(start), ...ordered.slice(0, start)];
}

function isPlausibleQuad(quad) {
  if (quad.length !== 4 || quadArea(quad) < 0.01) return false;
  let sign = 0;
  for (let index = 0; index < 4; index += 1) {
    const first = quad[index];
    const second = quad[(index + 1) % 4];
    const third = quad[(index + 2) % 4];
    const cross = (second.x - first.x) * (third.y - second.y) - (second.y - first.y) * (third.x - second.x);
    if (!cross) return false;
    if (sign && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return true;
}

function quadArea(quad) {
  return Math.abs(quad.reduce((sum, point, index) => {
    const next = quad[(index + 1) % quad.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0) / 2);
}

function distance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}
