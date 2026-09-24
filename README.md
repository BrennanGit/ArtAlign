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

1. Create a project with the physical canvas width and height. Use **Canvas size** in the view menu to change them later; the plane grows or shrinks around the center while existing references, captures, and strokes keep their physical positions and sizes. Guides divide the new plane.
2. Open the Layers button in the lower-right corner and add a Drawing, Guides, or Reference layer. Reference opens the camera/gallery image picker. Each guide layer has independent horizontal/vertical division counts, colour, and thickness; three divisions draw two internal lines on each axis.
3. Click a layer name to edit its drawing, reference, or raster controls. Use the transform icon on a layer row to enter its transform mode directly; the Reference group icon transforms all of its items together. Drawing has Pen, Straight line (press and drag between endpoints), and Eraser tools. Select the orange tick beside the layer name and type below the list, or the viewport mode chip, when finished. Drag a layer row horizontally to change opacity. Swipe vertically to scroll the list; to reorder, briefly hold a layer name until its row highlights, then drag it. Holding the row at either list edge while dragging scrolls through longer lists.
4. Open the view menu in the top-right corner for Project onto photo, Project onto video, or Download. The PNG includes visible layers over white at canonical resolution. Automatic detection can always be replaced with manual corner adjustment and keeps the projected overlay visible while dragging.
5. In Photo mode, open Layers and select **Add photo as layer** to create a persistent, rectified canonical layer. In Live mode, use **Capture painting** from the same panel.

In reference or layer transform mode, checkboxes replace the transform icons in each layer row. Check other layers to move, resize, and rotate them together; the active layer drives the handles, and a checked Reference group includes its reference items. Unticking the active layer makes another checked layer active, and unticking the last checked layer exits transform mode. Captures and guides can also be transformed from their row icons. The resulting positions are saved and can be undone together.

Mask edits preview continuously while drawing, and the on-canvas cursor shows the current brush footprint. Pointer input retains coalesced pen/touch/mouse samples and smooths the rendered vector path.

In Drawing mode, pen, straight line, and eraser also work in the surrounding field outside the canvas. Those marks stay visible while editing; only the portion on the canvas is included in the projection or exported PNG. Transform the drawing layer to move off-canvas marks onto the canvas later. Mask and corner editing remain confined to the canvas.

Canvas navigation can begin anywhere in the surrounding viewport field. Two fingers pan in all views, including while pinching to zoom around the gesture; the mouse wheel zooms over its pointer. Gestures outside the canvas preserve that off-canvas focus point. In Photo view, a single-pointer drag pans the canvas, while canonical single-pointer drags remain reserved for drawing and editing.

Header Undo and Redo cover project edits across layer types, including drawing and mask changes. Canvas panning and zooming are saved but are not undoable; undoing an edit leaves the current view in place. Repeated slider movement is one action. History is bounded and lasts for the current open-project session; the restored state itself is autosaved. Original and intermediate image assets remain in local storage for history and are removed when the project is deleted.

Reference **Rectify** is intended for photographs of physical prints or pages. It retains the original source asset and creates a separate flattened derivative.

## Browser requirements

- WebGL and IndexedDB
- Pointer Events
- Camera access for Live mode
- HTTPS for camera access outside `localhost`; GitHub Pages provides HTTPS

OpenCV 4.13 is loaded from the pinned official OpenCV URL when detection or tracking is first used. Automatic contour detection waits for the asynchronous runtime inside a disposable, versioned Web Worker so OpenCV cannot block the interface. Rectification uses WebGL and does not require OpenCV. If OpenCV cannot load, still/manual corner workflows remain available. For fully offline deployment, vendor the same OpenCV prebuilt and update `OPEN_CV_URL` in `src/cv.js`.

Live optical-flow sampling uses the main-thread OpenCV runtime, is capped at a responsive cadence, and automatically pauses in manual-corner mode if a device exceeds the processing budget.

When OpenCV reports a detection or tracking problem, an issue chip appears in the lower-left of the viewport with a concise action and the full runtime detail available on hover.

Photo detection reports its confidence in the workflow status and rejects weak candidates so they cannot silently replace the current corners. Live reacquisition keeps the last OpenCV issue visible until a retry succeeds.

## Tests

```sh
npm test
```

The automated suite covers model, persistence, coordinate conversion, pointer gestures, homographies, corner ordering, smoothing, and tracking confidence. Before relying on Live mode in the studio, verify rear-camera permission, handheld reacquisition, and tracking responsiveness on the target iPhone; desktop automation cannot reproduce physical camera motion.