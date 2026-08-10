const EPSILON = 1e-10;

export function homographyFromQuad(quad) {
  return solveHomography(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    quad,
  );
}

export function solveHomography(source, destination) {
  if (source.length !== 4 || destination.length !== 4) {
    throw new TypeError("A homography requires four source and destination points");
  }

  const matrix = [];
  for (let index = 0; index < 4; index += 1) {
    const { x, y } = source[index];
    const { x: targetX, y: targetY } = destination[index];
    matrix.push([x, y, 1, 0, 0, 0, -targetX * x, -targetX * y, targetX]);
    matrix.push([0, 0, 0, x, y, 1, -targetY * x, -targetY * y, targetY]);
  }

  const solution = gaussianElimination(matrix);
  return [solution[0], solution[1], solution[2], solution[3], solution[4], solution[5], solution[6], solution[7], 1];
}

export function invertHomography(matrix) {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(determinant) < EPSILON) throw new Error("Cannot invert a degenerate homography");
  const scale = 1 / determinant;
  return [
    (e * i - f * h) * scale,
    (c * h - b * i) * scale,
    (b * f - c * e) * scale,
    (f * g - d * i) * scale,
    (a * i - c * g) * scale,
    (c * d - a * f) * scale,
    (d * h - e * g) * scale,
    (b * g - a * h) * scale,
    (a * e - b * d) * scale,
  ];
}

export function projectPoint(matrix, point) {
  const denominator = matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  if (Math.abs(denominator) < EPSILON) throw new Error("Point projects to infinity");
  return {
    x: (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / denominator,
    y: (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / denominator,
  };
}

export function orderCorners(points) {
  if (points.length !== 4) throw new TypeError("Exactly four corners are required");
  const centre = points.reduce(
    (result, point) => ({ x: result.x + point.x / 4, y: result.y + point.y / 4 }),
    { x: 0, y: 0 },
  );
  const clockwise = [...points].sort(
    (left, right) => Math.atan2(left.y - centre.y, left.x - centre.x) - Math.atan2(right.y - centre.y, right.x - centre.x),
  );
  const topLeftIndex = clockwise.reduce((best, point, index) =>
    point.x + point.y < clockwise[best].x + clockwise[best].y ? index : best, 0);
  const ordered = [...clockwise.slice(topLeftIndex), ...clockwise.slice(0, topLeftIndex)];
  return signedArea(ordered) > 0 ? ordered : [ordered[0], ordered[3], ordered[2], ordered[1]];
}

export function smoothQuad(previous, next, amount = 0.28) {
  if (!previous || previous.length !== 4) return next.map((point) => ({ ...point }));
  return next.map((point, index) => ({
    x: previous[index].x + (point.x - previous[index].x) * amount,
    y: previous[index].y + (point.y - previous[index].y) * amount,
  }));
}

export function quadArea(quad) {
  return Math.abs(signedArea(quad));
}

export function isPlausibleQuad(quad, minimumArea = 0.04) {
  if (!Array.isArray(quad) || quad.length !== 4 || quadArea(quad) < minimumArea) return false;
  const signs = quad.map((point, index) => {
    const next = quad[(index + 1) % 4];
    const after = quad[(index + 2) % 4];
    return (next.x - point.x) * (after.y - next.y) - (next.y - point.y) * (after.x - next.x);
  });
  return signs.every((sign) => sign > EPSILON) || signs.every((sign) => sign < -EPSILON);
}

function signedArea(points) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function gaussianElimination(matrix) {
  const rowCount = matrix.length;
  for (let column = 0; column < rowCount; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < rowCount; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    }
    if (Math.abs(matrix[pivot][column]) < EPSILON) throw new Error("Cannot solve a degenerate homography");
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    const divisor = matrix[column][column];
    for (let value = column; value <= rowCount; value += 1) matrix[column][value] /= divisor;
    for (let row = 0; row < rowCount; row += 1) {
      if (row === column) continue;
      const factor = matrix[row][column];
      for (let value = column; value <= rowCount; value += 1) {
        matrix[row][value] -= factor * matrix[column][value];
      }
    }
  }
  return matrix.map((row) => row[rowCount]);
}