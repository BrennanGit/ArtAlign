# Task #035: Layer List Touch Scrolling

- Created: 2026-09-23 UTC
- Status: done
- Type: bugfix
- Owner: agent

## Acceptance Criteria
- [x] Vertical touch swipes over layer rows scroll the inspector without changing layer order or opacity.
- [x] Horizontal opacity drags and mouse reordering still work.
- [x] Touch users retain an explicit way to reorder layers.
- [x] Holding a reorderable row briefly highlights it; dragging then reorders it with touch or mouse without changing opacity.
- [x] Vertical touch movement before the hold scrolls; active drags near either list edge auto-scroll, staying within the layer's collection.
- [x] Remove editor reorder arrows and document the revised gesture.
- [x] Non-editable app text disallows selection and layer names suppress WebKit touch callouts; editing inputs remain selectable (physical iOS confirmation pending).

## Plan
- [x] Update `styles.css` layer-row touch behavior and `updateLayerDrag()` in `src/app.js`; verify with touch browser interaction.
- [x] Add reorder buttons to `renderInspector()`/`handleInspectorClick()` for touch; verify button-driven reordering and `npm test`.
- [x] Replace editor buttons with held-row drag in `src/app.js` and `styles.css`; check hold highlight, touch scrolling, opacity, collection boundaries, and both edge-scroll directions in the browser.
- [x] Update `README.md` gesture wording; run `npm test` and `git diff --check`.
- [x] Disable selection on non-editable text in `styles.css`, including WebKit long-press callouts on layer names; verify computed styles and hold-to-drag in the browser.

## Execution Log
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: scroll anywhere on layer list. Current State: inspector supports pan-y, but rows opt out and pointer drag interprets vertical movement as reorder. Blocking Issues: none. Next Subtask: allow pan-y on rows and reserve vertical touch gestures for scrolling. Known Risks: pointer cancellation while native scrolling.
- 2026-09-23 UTC: Allowed pan-y on rows, guarded touch vertical drag, and added editor arrows for mobile reordering. Browser at phone widths confirmed upward and downward row swipes (including icon area) scroll without reordering, horizontal touch drag changed opacity, mouse drag reordered, and editor Up reordered then disabled at the boundary. `npm test`: 31/31; `git diff --check` and editor diagnostics clean. Removed the browser-only test project.
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: replace arrows with highlighted press-and-hold reordering and edge scrolling. Current State: row labels use native pan-y, mouse vertical drag reorders, and editor arrows reorder on touch. Blocking Issues: none. Next Subtask: preserve pre-hold touch scrolling while arming held drag. Known Risks: native touch scrolling cancels an active pointer, and rerendering rows can drop the drag highlight.
- 2026-09-23 UTC: Removed editor arrows and implemented 300ms hold-to-reorder with a highlighted row, manual vertical touch scroll before hold on row labels, horizontal opacity drag, and frame-driven edge scrolling bounded to the layer list. Browser verified touch and mouse reordering, stationary highlight without scroll, touch scroll before hold, opacity, and auto-scroll in both directions across a 12-layer test project. Removed only that test project; the prior project remained. Updated README; `npm test` 31/31, `node --check src/app.js`, `git diff --check`, and editor diagnostics clean.
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: mobile hold-to-drag must not select the row text. Current State: layer-name has unprefixed user-select only; nested strong may trigger iOS long-press selection. Blocking Issues: no physical iOS device for verification. Next Subtask: disable non-editable selection and WebKit row callout while preserving text inputs; validate computed styles and drag.
- 2026-09-23 UTC: Disabled selection globally for non-editable elements with prefixed and standard CSS, restored selection on editable fields, suppressed WebKit callouts on layer names, and bumped the stylesheet URL. Browser computed styles show none on nested layer text, text on inputs; simulated touch hold highlighted the row with no selected text and released cleanly. `npm test` 31/31; diff check and diagnostics clean. Physical iOS Safari behavior remains to be confirmed on-device.