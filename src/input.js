export function normalizedPointer(event, element) {
  const bounds = element.getBoundingClientRect();
  return clampPoint({
    x: (event.clientX - bounds.left) / Math.max(1, bounds.width),
    y: (event.clientY - bounds.top) / Math.max(1, bounds.height),
  });
}

export function normalizedPointerSamples(event, element) {
  const events = event.getCoalescedEvents?.() ?? [event];
  const samples = events.length ? events : [event];
  return samples.map((sample) => normalizedPointer(sample, element));
}

export function zoomFocusFromPointer(event, element) {
  const bounds = element.getBoundingClientRect();
  if (
    event.clientX < bounds.left
    || event.clientX > bounds.right
    || event.clientY < bounds.top
    || event.clientY > bounds.bottom
  ) return { x: 0.5, y: 0.5 };
  return normalizedPointer(event, element);
}

export function clampPoint(point) {
  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  };
}

export function nearestCorner(point, quad, radius = 0.08) {
  let match = -1;
  let distance = radius;
  quad.forEach((corner, index) => {
    const candidate = Math.hypot(point.x - corner.x, point.y - corner.y);
    if (candidate <= distance) {
      match = index;
      distance = candidate;
    }
  });
  return match;
}

export function gestureFromPointers(pointers) {
  const points = [...pointers.values()];
  if (points.length === 0) return null;
  if (points.length === 1) {
    return { centre: { ...points[0] }, distance: 0, angle: 0 };
  }
  const [first, second] = points;
  return {
    centre: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    angle: Math.atan2(second.y - first.y, second.x - first.x),
  };
}

export function applyReferenceHandle(initialTransform, initialPointer, currentPointer, handle) {
  const initialVector = {
    x: initialPointer.x - initialTransform.x,
    y: initialPointer.y - initialTransform.y,
  };
  const currentVector = {
    x: currentPointer.x - initialTransform.x,
    y: currentPointer.y - initialTransform.y,
  };
  if (handle === "resize") {
    const initialDistance = Math.hypot(initialVector.x, initialVector.y);
    const currentDistance = Math.hypot(currentVector.x, currentVector.y);
    return {
      ...initialTransform,
      scale: Math.max(0.05, initialTransform.scale * currentDistance / Math.max(0.0001, initialDistance)),
    };
  }
  return {
    ...initialTransform,
    rotation: initialTransform.rotation
      + Math.atan2(currentVector.y, currentVector.x)
      - Math.atan2(initialVector.y, initialVector.x),
  };
}

export function zoomViewAt(view, requestedZoom, focus, minimumZoom = 0.25, maximumZoom = 8) {
  const currentZoom = Number.isFinite(view.zoom) ? view.zoom : 1;
  const zoom = Math.max(minimumZoom, Math.min(maximumZoom, requestedZoom));
  return {
    ...view,
    panX: (view.panX ?? 0) + focus.x * (currentZoom - zoom),
    panY: (view.panY ?? 0) + focus.y * (currentZoom - zoom),
    zoom,
  };
}

export function panViewByPointer(view, initialPointer, currentPointer, bounds) {
  const zoom = Number.isFinite(view.zoom) && view.zoom > 0 ? view.zoom : 1;
  return {
    ...view,
    panX: (view.panX ?? 0) + (currentPointer.x - initialPointer.x) / Math.max(1, bounds.width * zoom),
    panY: (view.panY ?? 0) + (currentPointer.y - initialPointer.y) / Math.max(1, bounds.height * zoom),
  };
}