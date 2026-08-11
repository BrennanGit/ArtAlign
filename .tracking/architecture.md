# Architecture

## Coordinate Spaces

1. Source raster coordinates belong to each imported asset.
2. Reference transforms place source rasters in normalized canonical canvas space.
3. Captures, scribbles, and guides already occupy normalized canonical space.
4. A project homography maps canonical space to the observed still/video quadrilateral.

Reference transforms and the project homography must never be merged in persistent state.

### Interaction Coordinates

- **Source pixels** are the intrinsic pixel coordinates of an imported image or camera frame.
- **Canonical coordinates** are normalized canvas coordinates. Persistent layers, masks, guides, and canvas corner quads use the `[0, 1]` range on each axis.
- **Observed coordinates** are pixels in the photo or live camera frame. The project homography maps between these and canonical coordinates.
- **Viewport coordinates** are client-pixel positions in the complete painting field, including space outside the visible canvas.
- **Raw stage-relative coordinates** convert viewport input into the stage's normalized coordinate system without clamping. Navigation uses these coordinates so wheel and pinch zoom preserve the actual focus point even when it is outside the canvas.
- **Clamped editing coordinates** clamp raw stage-relative input to `[0, 1]` before changing canonical content or canvas corners. Corner hit testing uses the raw point first, so a handle's generous local circular target cannot extend across unrelated field space.

The stage view transform (`panX`, `panY`, and `zoom`) is a transient navigation transform applied to the rendered stage. It does not alter canonical content, homography data, or source raster coordinates.

## Runtime Boundaries

- `src/model.js`: serializable project and layer contracts.
- `src/store.js`: IndexedDB metadata/assets with blobs stored independently.
- `src/geometry.js`: pure homography, corner ordering, and quad validation.
- `src/canonical.js`: rebuild-on-change flat layer compositor and editing hit geometry.
- `src/renderer.js`: shared WebGL still/video background and perspective projection.
- `src/cv.js`: OpenCV loading, quad detection, and inverse rectification.
- `src/app.js`: explicit interaction modes, workflows, autosave, and responsive UI state.

## Rendering Contract

The canonical compositor produces one flat transparent texture. `ProjectionRenderer` inverse-maps display pixels through the current homography and blends that texture over a static image or current video frame. Changing camera geometry does not rebuild canonical content.

## Persistence Contract

Project JSON contains asset IDs only. Source images and generated masks/captures live in the IndexedDB `assets` store. Metadata autosave never rewrites blobs.