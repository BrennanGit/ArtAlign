# Painting Proportion Overlay App — Technical Spec

## 1. Purpose

A lightweight client-side web app for checking composition and proportions while painting from photographic references.

Primary target:

- iPhone Safari
- handheld live camera use
- personal use

Development and testing should also work comfortably in a Windows desktop browser.

Hosting:

- GitHub Pages
- no backend
- no accounts
- no server-side image processing

The central idea is to maintain a **canonical flat representation of the painting canvas**, then perspective-project selected layers from that space onto the physical canvas as seen in a photograph or live camera feed.

---

## 2. Core Geometry

There are three main coordinate spaces:

    Reference image(s)
          ↓
    composition transforms
          ↓
    Canonical canvas
          ↓
    perspective homography
          ↓
    Photo / camera view

### Canonical canvas

Each project has a rectangular flat coordinate system representing the physical painting surface.

Persistent content lives here:

- reference composition
- painting captures
- scribble layers
- guides

Use normalised coordinates where practical:

    x: 0..1
    y: 0..1

### Canvas aspect ratio

The project canvas aspect ratio is entered manually during setup.

Provide:

- preset dropdown
- editable width / height ratio fields

Suggested presets:

- Custom
- 1:1
- A-series portrait — `1 : √2`
- A-series landscape — `√2 : 1`
- 4:3 portrait
- 4:3 landscape
- 5:4 portrait
- 5:4 landscape
- 3:2 portrait
- 3:2 landscape

Selecting a preset fills the ratio fields.

Editing either field manually switches to `Custom`.

Physical units are not required because only the ratio matters geometrically.

### Perspective transform

The physical canvas appears as a quadrilateral in a photograph or camera frame.

A 3×3 homography maps between:

    canonical rectangle ↔ observed quadrilateral

We need both directions:

    H     canonical → camera/photo
    H^-1  camera/photo → canonical

`H` is used to project overlays onto the physical canvas.

`H^-1` is used to flatten captured paintings back into canonical space.

### Interaction and viewport coordinates

The painting field is larger than the canonical canvas when the canvas is zoomed or
panned. Pointer input therefore has two normalized forms:

- **Raw stage-relative coordinates** are derived from the pointer's position in the
    viewport and may be less than `0` or greater than `1`. Wheel and pinch navigation
    use these coordinates so zoom remains focused on the actual pointer or pinch
    midpoint, including outside the canvas.
- **Clamped canonical coordinates** constrain each axis to `0..1`. Drawing, masking,
    corner movement, and other edits use these coordinates so persistent canvas data
    remains inside the canonical surface.

Corner handles are selected using distance from the raw pointer position, with a
finite local circular hit radius. The selected corner is then moved using the
clamped coordinate; a pointer far outside the canvas must not select a corner merely
because its position clamps to an edge.

The view transform used for navigation is stored separately as `panX`, `panY`, and
`zoom`. It changes how the stage is displayed but never changes canonical layer
geometry or the project homography.

---

## 3. Project Setup Workflow

### Create project

User supplies:

- project name
- canvas aspect ratio

The app creates a canonical canvas resolution using that ratio.

A working resolution around 1500–2000 px on the long edge is probably sufficient initially.


### Import reference images

A project's reference is a **composable reference group**, not a single image.

The user may import one or more reference images and arrange them independently within canonical canvas space.

Examples:

- one portrait reference
- face from one image + clothing from another
- several source images combined into one composition
- alternative elements overlapping or placed side-by-side

Each imported image becomes a `ReferenceItem` inside the project's `ReferenceGroup`.


#### Rectify Reference

Normal digital images can be used directly.

If a source image is itself a photograph of a physical print/page, optionally allow warping.

Users select:
    Rectify

The app:

1. attempts to detect the four physical image corners
2. displays the proposed quadrilateral
3. shows four draggable corner handles
4. allows manual correction
5. rectifies the image into canonical flat space using the known project aspect ratio


### Compose reference

Reference items are edited individually over the flat canonical canvas.

For the selected reference item, allow:

- translate
- uniform scale
- rotate
- flip horizontally
- opacity
- blend mode
- colour key
- erase / restore mask

Mobile gestures:

- one finger: translate
- two fingers: scale + rotate

Desktop should provide equivalent mouse interaction.

Useful controls:

- Fit
- Centre
- Reset Transform
- Flip Horizontal
- opacity
- blend mode
- Colour Key
- Erase
- Restore

The user may add additional reference images at any time.

### Finish reference composition

When satisfied, the user selects something such as:

    Done Editing Reference

The complete reference group then behaves as a single logical layer for most normal actions.

At group level:

- show/hide
- opacity
- blend mode

The user can later reopen:

    Edit Reference

to modify individual items.

The composition should not be permanently baked.

---

## 4. Main Workflow

Typical use:

1. Paint.
2. Open the app.
3. Choose Photo or Live.
4. App finds the physical canvas.
5. Correct detected corners if necessary.
6. Selected canonical layers are projected onto the painting.
7. Adjust opacity / blend mode / visible layers.
8. Return to painting.
9. Repeat.

When desired, the current painting can be captured as another persistent iteration:

    camera/photo
        ↓
    detected canvas quad
        ↓
    inverse homography
        ↓
    canonical painting layer

All painting captures therefore remain automatically aligned.

Live mode should be thought of generally as:

> Project selected canonical layers onto the tracked physical canvas.

That supports normal comparison and could later also support a projector/tracing-style workflow without requiring a different geometry system.

---

## 5. Canvas Detection

Use OpenCV.js.

Likely pipeline:

    source frame
        ↓
    downscale
        ↓
    grayscale
        ↓
    blur
        ↓
    edge detection
        ↓
    contours
        ↓
    polygon approximation
        ↓
    score quadrilateral candidates

Relevant functions might include:

    cv.resize()
    cv.cvtColor()
    cv.GaussianBlur()
    cv.Canny()
    cv.findContours()
    cv.arcLength()
    cv.approxPolyDP()
    cv.contourArea()
    cv.isContourConvex()

Candidate scoring can consider:

- area
- convexity
- rectangularity
- location in frame
- edge strength
- known project aspect ratio
- proximity to previously tracked canvas position

### Corner ordering

Always normalise detected corners consistently:

    top-left
    top-right
    bottom-right
    bottom-left

Corner ordering must remain stable between frames.

---

## 6. Manual Corner Correction

Automatic detection should always be correctable.

Display four draggable corner handles linked by bright coloured lines.

Each handle should have:

- a precise centre cross
- a large touch target
- strong visual contrast against arbitrary paintings

### Magnifier while dragging

While a corner is being dragged, display a magnified loupe of the surrounding image.

The loupe should:

- appear away from the user's finger
- show the exact selected point with a crosshair
- update continuously
- disappear when dragging ends

This is especially important on iPhone because the finger obscures the point being positioned.

---

## 7. Still Photo Mode

The background is an imported or captured image.

Process:

1. detect canvas
2. correct corners if needed
3. compute homography
4. project selected canonical layers onto the photographed canvas

Controls should include:

- layer opacity/visibility
- blend mode
- colour key where applicable
- mask tools where applicable
- redetect
- edit corners

Still mode should use the same projection renderer as live mode.

---

## 8. Live Mode

Assume the phone is handheld.

The overlay needs to remain visually attached to the physical canvas while the phone:

- translates
- rotates
- tilts
- approaches/recedes

Camera input:

    navigator.mediaDevices.getUserMedia()

Prefer the rear-facing camera.

### Live pipeline

    camera frame
        ↓
    canvas tracking/detection
        ↓
    current homography
        ↓
    WebGL render
        ↓
    camera + projected overlay

### Detection vs tracking

Do not run full contour detection unnecessarily on every frame.

Use full detection to:

- acquire the canvas initially
- reacquire it if tracking confidence drops

Between detections, track image features.

Relevant OpenCV.js functionality:

    cv.goodFeaturesToTrack()
    cv.calcOpticalFlowPyrLK()

Track multiple useful features on or around the canvas rather than relying only on four raw corner pixels.

Use those correspondences to update the homography.

### Tracking confidence

Maintain a confidence value based on things such as:

- successfully tracked feature count
- optical-flow errors
- geometric plausibility
- temporal consistency
- canvas area/shape

If tracking is lost:

- fade or suppress the overlay
- attempt reacquisition
- restore the overlay when confidence recovers

Do not allow the overlay to confidently jump onto some unrelated rectangle in the room.

### Stabilisation

Tracking coordinates may jitter.

Apply light temporal smoothing to the quad or homography.

Avoid excessive smoothing because visible lag while moving the phone will be worse than slight jitter.

---

## 9. Rendering

Use WebGL as the primary display compositor.

OpenCV should mainly handle:

- canvas detection
- feature tracking
- image analysis
- homography estimation
- destructive/output-producing image transforms such as rectification

WebGL should mainly handle real-time, non-destructive display operations:

- image/video display
- perspective projection
- layer opacity
- applying masks
- colour-key evaluation
- blend modes
- compositing

### Shared live/still renderer

The renderer should not care whether its background source is:

- a static image
- a live video frame

The same projection path should be used in both cases.

### Canonical overlay

Selected canonical layers can be composited into an offscreen texture before final perspective projection.

For example:

    Reference Group
    Painting comparison
    Scribbles
    Guides
          ↓
    Canonical Overlay Texture
          ↓
    Perspective Projection

Camera movement then only changes the final homography.

The canonical overlay only needs rebuilding when layer contents or settings change.

---

## 10. Rectifying Painting Captures

When a new painting iteration is saved:

1. freeze/capture the current image
2. detect corners and offer manual correction
3. apply `H^-1`
4. generate a flat canonical image
5. save it as a new painting layer

Relevant OpenCV functions:

    cv.getPerspectiveTransform()
    cv.warpPerspective()

Display warping can remain WebGL-based.

---

## 11. Layer Model

Suggested top-level layer types:

- Reference Group
- Capture
- Scribble
- Guide (for grids and things)

All raster/image layers should share common capabilities where possible.

A generic raster layer may contain roughly:

    {
        id,
        name,
        assetId,
        visible,
        opacity,
        blendMode,
        mask
    }

### Reference Group

The project contains one special `ReferenceGroup`.

Suggested structure:

    ReferenceGroup {
        id
        name
        visible
        opacity
        blendMode
        children: ReferenceItem[]
    }

A `ReferenceItem` represents one source image:

    ReferenceItem {
        id
        assetId

        transform: {
            x
            y
            scale
            rotation
            flipX
        }

        opacity
        blendMode
        mask
    }

Group-level properties apply to the whole reference composition.

Item-level properties apply to individual source images.

Avoid arbitrary nested groups unless a later requirement justifies them.

### Capture layers

Each saved capture iteration is a flat canonical image.

For example:

    Capture 01
    Capture 02
    Capture 03

New iterations become active while older ones remain available.

### Scribble layers

Prefer storing scribbles as vector strokes rather than permanently rasterising them.

Example:

    {
        points: [{x, y}, ...],
        colour,
        width,
        opacity
    }

Advantages:

- resolution independent
- small storage
- easy undo
- easy deletion
- can rerender at any resolution

Rasterise scribbles into the canonical overlay texture when required.

---

## 12. Generic Layer Masking

Any raster-capable layer may have a non-destructive transparency mask.

This includes:

- reference items
- capture layers
- future raster layer types

The original source image must remain unchanged.

The visible alpha is derived from:

    source alpha
        ×
    generated colour-key mask
        ×
    manual mask
        ×
    layer opacity

Masking is therefore part of the generic raster-layer model, not something specific to references.

### Manual mask

The manual mask begins fully opaque.

Tools:

- Erase
- Restore
- brush size
- brush softness/hardness
- undo
- redo
- reset mask

Erase reduces opacity.

Restore increases opacity.

The manual mask should be stored in the layer's own image coordinate space so it remains attached correctly if that layer is transformed.

For painting layers already occupying canonical canvas space, those layer coordinates naturally correspond to canonical space.

---

## 13. Colour Key

Colour keying is a generic non-destructive masking tool available on any maskable raster layer.

Workflow:

1. Select layer.
2. Activate eyedropper.
3. That layer is presented with full opacity and all other layers hidden.
4. Tap a colour in that layer.
5. Adjust tolerance and softness as app highlights affected areas.
6. App generates a colour-key alpha mask.

Example settings:

    colourKeySettings = {
        enabled,
        colour,
        tolerance,
        softness
    }

Do not permanently write colour-key results into the manual mask.

Instead:

    finalMask =
        generatedColourKeyMask
        ×
        manualMask

This allows colour-key settings to change later without losing manual eraser work.

### Soft keying

Do not use exact-colour matching.

Calculate colour distance from the sampled colour.

Pixels should transition approximately as:

    close to key colour
        → transparent

    within softness range
        → partially transparent

    sufficiently different
        → unchanged

This is particularly useful for references or painting captures with midtone backgrounds.

### Rendering

Prefer applying colour-key calculations in the WebGL fragment shader.

The shader combines:

    source image
    colour-key alpha
    manual-mask alpha
    layer opacity

before compositing the layer.

---

## 14. Layer Editing Tools

For any maskable raster layer, provide:

- Eyedropper
- Erase
- Restore
- opacity
- blend mode

Reference items additionally provide:

- Move
- Scale
- Rotate
- Flip

A likely masking workflow is:

    Colour Key
        ↓
    remove broad unwanted areas
        ↓
    Erase / Restore
        ↓
    manually refine

The aim is useful lightweight compositing, not a full Photoshop-style editor.

---

## 15. Scribble Tool

Purpose:

Quickly mark things such as:

- top/bottom of head
- eye line
- centre line
- head width
- silhouette
- correction marks
- arbitrary proportional guides

Tools:

- pen
- eraser
- width
- colour
- undo
- redo
- clear
- new scribble layer

Use Pointer Events so the same implementation handles:

- mouse
- touch
- pen

Scribbling should happen in the flat/canonical editing view.

There is no requirement to scribble directly over live camera view.

---

## 16. Blend Modes

Useful initial modes:

- Normal
- Multiply
- Screen
- Difference

Difference may be particularly useful for spotting alignment or proportional errors.

Additional blend modes can be added later if they prove useful.

---

## 17. Persistence / Autosave

Use IndexedDB for persistent project storage.

From the user's perspective, projects should simply save automatically.

There is no normal `Save` button.

Autosave after meaningful changes such as:

- reference composition edits
- scribble strokes
- masks
- colour-key settings
- layer visibility / opacity
- new painting captures
- project settings

Avoid rewriting large image assets for minor metadata changes.

The app's opening screen should show locally stored projects and reopen them in their last saved state.

Example:

    Projects

    Portrait 01
    Portrait 02
    Study

    + New Project

Storage is local to that browser/device.

An iPhone Safari project database and a Windows Chrome project database are separate.

Export/import is not required initially, but may be useful later for:

- backup
- moving projects between devices
- debugging

---

## 18. Responsive Layout

The interface is mobile-first but should work naturally on desktop without maintaining a separate application.

### Mobile

Portrait iPhone is the primary target.

Rough structure:

    ┌─────────────────────────┐
    │ Project            Menu │
    ├─────────────────────────┤
    │                         │
    │                         │
    │       VIEWPORT          │
    │                         │
    │                         │
    ├─────────────────────────┤
    │ Opacity ━━━━━━━━━       │
    ├─────────────────────────┤
    │ Photo Live Draw Layers  │
    └─────────────────────────┘

The viewport should dominate the screen.

Frequently used controls should be reachable near the bottom.

Less common controls can appear in a menu.

Respect iPhone safe-area insets.

### Desktop

At wider sizes:

    ┌────────────────────────────────────┐
    │ Project controls              Menu │
    ├───────────────────────┬────────────┤
    │                       │ Layers     │
    │       VIEWPORT        │            │
    │                       │ Controls   │
    │                       │            │
    └───────────────────────┴────────────┘

Use responsive CSS rather than device detection.

The underlying controls and application state should remain the same.

---

## 19. Interaction Modes

Keep interaction state explicit.

Suggested modes:

    VIEW
    COMPOSE_REFERENCE
    EDIT_CORNERS
    DRAW
    MASK
    EYEDROPPER

This prevents the same drag gesture from ambiguously meaning:

- move reference
- draw
- erase mask
- move canvas corner

Only the active mode should consume the relevant pointer input.

---

## 20. Useful Browser APIs

Camera:

    navigator.mediaDevices.getUserMedia()

Frame processing:

    video.requestVideoFrameCallback()

with:

    requestAnimationFrame()

as fallback if required.

Input:

    Pointer Events

Rendering:

    WebGL

Utility image manipulation:

    Canvas 2D

Persistence:

    IndexedDB

Image output:

    canvas.toBlob()

---

## 21. OpenCV.js

Use a pinned official OpenCV.js prebuilt, initially OpenCV 4.13.

During development it may be loaded from:

    https://docs.opencv.org/4.13.0/opencv.js

For deployment, prefer vendoring the same prebuilt file into:

    /vendor/opencv.js

and loading it locally from the GitHub Pages site.

Likely required functionality:

### Image preparation

    cv.resize()
    cv.cvtColor()
    cv.GaussianBlur()
    cv.Canny()

### Contours

    cv.findContours()
    cv.arcLength()
    cv.approxPolyDP()
    cv.contourArea()
    cv.isContourConvex()

### Perspective

    cv.getPerspectiveTransform()
    cv.warpPerspective()

### Tracking

    cv.goodFeaturesToTrack()
    cv.calcOpticalFlowPyrLK()

Potentially:

    cv.findHomography()

Verify actual exports against the selected build.

### Memory management

OpenCV.js/WASM objects require explicit cleanup.

Temporary Mats should be:

    mat.delete()

when finished.

For live processing, reuse Mats and buffers where possible rather than constantly allocating new ones.

---

## 22. Suggested Code Organisation

The exact file structure is not important.

The important architectural separation is between:

- project state
- CV
- geometry
- rendering
- editing tools

---

## 23. Performance Considerations

### Do CV at reduced resolution

Do not analyse full-resolution camera frames.

Use something like:

    camera frame
       ├── display/render path
       └── downscaled OpenCV path

### Avoid CPU pixel round-trips

Avoid frequent full-frame:

    getImageData()

calls or equivalent.

Keep live rendering on the GPU.

### Reuse resources

Avoid repeatedly creating:

- WebGL textures
- framebuffers
- large canvases
- OpenCV Mats

### Static textures stay static

Reference images and saved painting layers only need re-uploading when they actually change.

Masks only need updating when edited.

The full canonical overlay texture only needs rebuilding when layer contents or settings change.

---

## 24. iPhone / Safari Considerations

### Secure context

Camera access requires a secure context.

GitHub Pages provides HTTPS.

`localhost` and `python -m http.server` is suitable for desktop development.

An iPhone accessing a Windows dev server over a plain LAN IP should not be assumed to have camera access.

Real-device testing via GitHub Pages is likely simplest.

### Camera video

Likely use:

    autoplay
    muted
    playsinline

### Real-device testing

Desktop testing is useful for:

- layout
- geometry
- WebGL
- OpenCV
- layer editing
- masking

Actual iPhone Safari needs testing for:

- camera behaviour
- touch gestures
- WebGL performance
- WASM/OpenCV performance
- memory use
- viewport/browser chrome behaviour

### EXIF orientation

Normalise imported image orientation before CV processing so displayed coordinates and underlying pixels agree.

### WebGL context loss

Handle:

    webglcontextlost
    webglcontextrestored

Project state should survive renderer recreation.

---

## 25. Lens Distortion

A homography correctly models perspective projection of a flat plane, but phone lenses can introduce radial distortion.

This may mean:

- four corners align correctly
- intermediate regions deviate slightly

Initially:

- prefer the normal rear camera rather than ultra-wide
- avoid placing the canvas at extreme frame edges where possible

Do not add explicit lens calibration unless testing shows it is materially necessary.

---

## 26. Motion and Occlusion

Handheld camera frames may suffer:

- motion blur
- rolling shutter
- temporary hand/brush occlusion
- canvas edges leaving the frame

The goal is useful visual registration while inspecting the painting, not precision AR tracking during rapid movement.

Tracking should fail gracefully.

If confidence drops:

    fade overlay
    show SEARCHING
    reacquire canvas

---

## 27. Canonical Painting Comparison

Because saved painting stages are rectified into the same flat coordinate system, comparison tools are straightforward:

- current vs previous
- reference vs painting
- opacity fade
- Difference blend
- blink comparison

This is one of the main benefits of maintaining canonical canvas space.

---

## 28. Reference Composition vs Camera Projection

Keep these transformations conceptually separate.

### Reference item transform

Each source reference has its own deliberate transform:

    source image
        ↓
    translate / scale / rotate / flip
        ↓
    canonical canvas

Multiple items are composited into the `ReferenceGroup`.

### Canvas homography

The complete canonical result is then projected onto the real painting:

    canonical canvas
        ↓
    homography
        ↓
    photo / live camera

Full pipeline:

    Reference Item A ─┐
    Reference Item B ─┼→ Reference Group
    Reference Item C ─┘
                            ↓
                    Canonical Canvas
                            ↓
                       Homography
                            ↓
                  Photo / Live View

Reference transforms and camera homography should remain separate in project state.

---

## 29. Pointer and Gesture Principles

The app should use direct-manipulation conventions familiar from mobile image-editing and drawing applications.

Gestures should be predictable from:

1. the current tool/mode
2. the object where the gesture begins

A gesture should not unexpectedly change meaning after it has started.

### Canvas Navigation

Where the current tool permits navigation:

- two-finger drag → pan viewport
- pinch → zoom viewport
- two-finger twist → rotate viewport, if canvas rotation is supported
- double-tap or explicit button → fit/reset view

Canvas navigation changes only the user's view and never modifies project geometry.

Mouse equivalents:

- wheel → zoom, preferably centred on pointer
- drag using the normal view/pan interaction → pan
- explicit Fit/Reset control remains available

Avoid relying on middle mouse buttons or unusual mouse chords because the desktop version is primarily a convenient development/secondary interface.


### Direct Object Manipulation

Selectable transformable objects, particularly `ReferenceItem`s, should display a bounding box while being edited.

Touch:

- one-finger drag inside selected object → translate
- drag corner handle → uniform scale
- drag rotation handle → rotate
- pinch/twist beginning inside selected object's bounds → scale + rotate as a convenience shortcut

A pinch beginning outside the selected object's bounds should navigate the canvas rather than transform the object.

Mouse:

- drag object → translate
- drag corner handles → scale
- drag rotation handle → rotate

Do not require gesture-only transformation; visible handles should always provide an explicit alternative.


### Drawing and Mask Tools

When a drawing-style tool is active:

- one-finger/pointer drag → perform the active tool action
- examples: scribble, erase mask, restore mask
- two-finger gestures remain reserved for viewport navigation

The active tool should be visually obvious.

Entering a drawing or masking mode should prevent ordinary one-finger object movement until that mode is exited.


### Precise Handles

Small geometric points may have a much larger invisible touch target than their visible marker.

This applies particularly to:

- detected canvas corners
- transform handles
- other precision control points

Dragging a canvas-corner handle should display a magnified loupe away from the finger, showing the underlying image and exact selected point with a crosshair.


### Gesture Shortcuts

Familiar gestures may be supported as shortcuts, for example:

- two-finger tap → Undo
- three-finger tap → Redo

However, important functionality should also have visible controls and/or conventional desktop keyboard shortcuts.

Do not make uncommon multi-finger gestures or modifier chords necessary for core operations.


### Mode Safety

Touch actions that modify project data should only occur in an explicit editing mode.

For example:

- View mode → navigation/selection only
- Compose Reference → reference transformation
- Draw → scribble strokes
- Mask → erase/restore
- Edit Corners → corner adjustment
- Eyedropper → colour sampling

This is intended to minimise accidental edits, particularly on touch devices.


### Input Consistency

Use Pointer Events as the common input abstraction.

The interaction model should be based on intent rather than device type:

    translate object
    navigate viewport
    paint stroke
    drag handle

Mouse, touch and pen input should invoke the same underlying actions with input-appropriate gestures.

Where possible, avoid separate feature behaviour for desktop and mobile.

---

## 30. Infrastructure

Production:

    GitHub Pages

Application:

    static HTML/CSS/JavaScript

Dependencies:

    OpenCV.js
    browser WebGL APIs

Storage:

    IndexedDB

Backend:

    none

### Windows development

Any simple localhost static server is sufficient.

For example:

    python -m http.server 8080

Then:

    http://localhost:8080

No build system is inherently required.

A lightweight dev server or bundler is fine if convenient, provided the deployed result remains static.

---

## 31. Important Architectural Rules

1. **Canonical canvas space is the source of truth.**

2. **Reference composition and camera perspective are separate transforms.**

3. **The reference is a composable group containing multiple independently editable source images.**

4. **Still-photo and live-camera display use the same WebGL projection path.**

5. **Painting captures are inverse-warped into canonical space before becoming persistent layers.**

6. **Automatic canvas detection always has manual correction.**

7. **Manual corner correction uses a magnified loupe while dragging.**

8. **Live mode assumes a handheld phone and therefore requires continuous tracking/reacquisition.**

9. **Scribbles live in canonical flat space; live scribbling is not required.**

10. **Masking is a generic capability available to any raster layer.**

11. **Colour keying and manual erasing combine non-destructively into the final layer mask.**

12. **OpenCV handles CV/geometry work; WebGL handles compositing and live display wherever practical.**

13. **Projects autosave locally using IndexedDB.**

14. **Keep the application client-side and static unless a future requirement genuinely demands otherwise.**

---

## 32. Main Technical Uncertainties

The basic perspective maths and still-image workflow are straightforward.

The areas most likely to require experimentation are:

- reliable canvas detection against arbitrary backgrounds
- stable handheld canvas tracking on iPhone
- balancing tracking smoothing against visible lag
- OpenCV.js/WASM performance and memory use in Safari
- lens distortion near frame edges
- keeping masking/editing interactions pleasant on a phone

The architecture should allow those algorithms and UI details to change without affecting the core project/layer model.

---

## 33. Summary

The app revolves around one flat canonical painting surface.

Reference images are independently composed into a reusable group:

    reference images
        ↓
    individual transforms + masks
        ↓
    Reference Group
        ↓
    canonical canvas

Painting captures are also stored there:

    photographed painting
        ↓
    inverse perspective warp
        ↓
    canonical canvas

For checking the real painting, selected canonical layers are projected outward:

    canonical layer stack
        ↓
    current homography
        ↓
    detected physical canvas
        ↓
    photo or live camera view

That geometry and layer model should remain the central organising principle of the implementation.
