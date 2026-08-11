# ArtAlign

ArtAlign is a client-side painting proportion overlay for composing references in a flat canonical canvas, then projecting those layers onto a photographed or live physical canvas.

Deployed to GitHub Pages at <https://brennangit.github.io/ArtAlign/>.

## Run locally

No build step is required.

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. Projects and image assets are stored locally in IndexedDB and are not uploaded.

## Workflow

1. Create a project with the physical canvas aspect ratio.
2. Open the Layers button in the lower-right corner and add a Drawing or Reference layer. Reference opens the camera/gallery image picker.
3. Use each layer's edit icon to enter its drawing, reference, or raster controls. Select the tick in the top-right mode chip when finished. Drag a layer row horizontally to change opacity or vertically to reorder it.
4. Select the compact Photo or Live button in the top-right corner to register the physical canvas. Automatic detection can always be replaced with manual corner adjustment and keeps the projected overlay visible while dragging.
5. In Photo mode, open Layers and select **Add photo as layer** to create a persistent, rectified canonical layer. In Live mode, use **Capture painting** from the same panel.

Mask edits preview continuously while drawing, and the on-canvas cursor shows the current brush footprint. Pointer input retains coalesced pen/touch/mouse samples and smooths the rendered vector path.

Canvas navigation can begin anywhere in the surrounding viewport field. Pinch around a point on touchscreens or use the mouse wheel over the point you want to keep in focus; gestures outside the canvas preserve that off-canvas focus point. In Photo view, a single-pointer drag pans the canvas, while canonical single-pointer drags remain reserved for drawing and editing.

Reference **Rectify** is intended for photographs of physical prints or pages. It retains the original source asset and creates a separate flattened derivative.

## Browser requirements

- WebGL and IndexedDB
- Pointer Events
- Camera access for Live mode
- HTTPS for camera access outside `localhost`; GitHub Pages provides HTTPS

OpenCV 4.13 is loaded from the pinned official OpenCV URL when detection, tracking, or rectification is first used. If it cannot load, still/manual corner workflows remain available. For fully offline deployment, vendor the same OpenCV prebuilt and update `OPEN_CV_URL` in `src/cv.js`.

Automatic contour detection runs in a disposable Web Worker so OpenCV cannot block the interface. Live optical-flow sampling is capped at a responsive cadence and automatically pauses in manual-corner mode if a device exceeds the processing budget.

## Tests

```sh
npm test
```

The automated suite covers model, persistence, coordinate conversion, pointer gestures, homographies, corner ordering, smoothing, and tracking confidence. Before relying on Live mode in the studio, verify rear-camera permission, handheld reacquisition, and tracking responsiveness on the target iPhone; desktop automation cannot reproduce physical camera motion.