# Task #006: Compact Layer Panel

- ID: #006-compact-layer-panel
- Created: 2026-08-11 UTC
- Status: done
- Type: refactor
- Stability: experimental
- Owner: agent
- Related: #002-layer-first-ui
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Reduce wasted space and unpredictable action wrapping in the Layers inspector, especially on phones, while preserving readable controls and internal scrolling.

## Acceptance Criteria

- [x] Selected-layer actions use stable, compact grids instead of loose standalone buttons.
- [x] Panel controls remain readable and comfortably operable at narrow phone widths.
- [x] The mobile Layers sheet occupies roughly 30% of the viewport height and scrolls internally.
- [x] Portrait and landscape layouts have no horizontal overflow or incoherent overlap.
- [x] Existing unit tests pass.

## Plan

- [x] Compact editor markup — File: `src/app.js` — Function: `renderInspector()` — Group reference, mask, drawing, and projection actions into explicit compact grids; shorten context-redundant labels — Verification: inspector DOM actions remain present and dispatchable.
- [x] Tighten panel geometry — File: `styles.css` — Selectors: `.inspector`, `.layer-editor`, `.control`, `.control-row`, responsive `.inspector` — Reduce local spacing and control height, retain usable touch targets, and cap the mobile sheet near `30dvh` — Verification: computed dimensions and portrait/landscape screenshots.
- [x] Regression verification — Files: `tests/*.test.mjs`, browser UI — Functions: inspector event delegation and layout — Run the full test suite, check diagnostics, and verify overflow and scrolling at phone and desktop viewports.

## Execution Log

* 2026-08-11 UTC Start-of-turn Context Recap:

  * Goal: Make the Layers inspector substantially denser and reduce its mobile footprint from half-screen toward 30%.
  * Current State: The mobile sheet is capped at `50dvh`; editor buttons inherit a global 42px minimum and selected-reference controls occupy 785px vertically.
  * Blocking Issues: None.
  * Next Subtask: Group editor actions in stable compact grids and tighten panel-specific spacing.
  * Known Risks: Dense controls must remain legible and usable at narrow portrait widths, and landscape rules must not cause overflow.

* 2026-08-11 UTC Completion:

  * Grouped reference transforms into a stable four-column row, shortened redundant action labels, and grouped all mask modes into one three-column row without changing event actions.
  * Reduced panel-local button and select height from 42px to 34px, tightened editor/header/section spacing, and reduced layer rows from 48px to 44px.
  * Capped the phone sheet at `30dvh`; retained a 168px minimum on short landscape screens and hid the redundant floating Layers control while the sheet is open.
  * Browser verification: portrait measured 374x253 at 390x844 (exactly 30% height); landscape measured 828x168 at 844x390; desktop measured 372x656 at 1280x800. All layouts were internally scrollable where needed with zero horizontal overflow.
  * Verification: 22/22 tests pass and changed-file diagnostics are clean.

## Decisions

* Keep the global button sizing unchanged and compact only the inspector, preserving larger controls elsewhere in the application.

## Useful Commands and Testing

* `npm test`
* Browser geometry and screenshots at portrait, landscape, and desktop sizes against `http://localhost:8080/`

## Artifacts Changed

* `src/app.js` — stable compact action group markup and context-shortened labels.
* `styles.css` — dense panel controls, spacing, layer rows, and responsive sheet geometry.

## Final Summary

Reduced the mobile Layers sheet to roughly 30% of the viewport and made its selected-layer controls denser and predictable without changing editing behavior.
