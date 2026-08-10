# Architecture

## Coordinate Spaces

1. Source raster coordinates belong to each imported asset.
2. Reference transforms place source rasters in normalized canonical canvas space.
3. Captures, scribbles, and guides already occupy normalized canonical space.
4. A project homography maps canonical space to the observed still/video quadrilateral.

Reference transforms and the project homography must never be merged in persistent state.

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