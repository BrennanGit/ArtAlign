# Task #022: OpenCV Status Chip

- ID: #022-opencv-status-chip
- Created: 2026-08-11 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #021-opencv-runtime

## Summary

Add a compact, issue-only OpenCV status chip to the lower-left of the viewport so loader, detection, and tracking failures are visible and diagnosable without replacing the normal workflow status.

## Acceptance Criteria

- [x] The chip is hidden when there is no OpenCV issue.
- [x] Loader, detection, and tracking failures surface concise actionable messages and preserve a useful detail for debugging.
- [x] Successful detection/tracking clears stale OpenCV issues.
- [x] The chip is readable and positioned correctly on desktop and mobile.
- [x] Existing tests, diagnostics, and a browser smoke check pass.
- [x] Live reacquisition keeps the last OpenCV issue visible until a retry succeeds.
- [x] Weak detection candidates are reported instead of silently replacing the corners.

## Plan

- [x] Add issue-only chip markup and responsive styling.
- [x] Centralize issue display/clear behavior in `src/app.js` and connect OpenCV failure paths.
- [x] Verify hidden, visible, recovery, and mobile presentation states.

## Execution Log

- 2026-08-11 UTC Start-of-turn Context Recap: Goal: make OpenCV issues easier to diagnose from the UI. Current State: transient OpenCV workflow text is stored in `trackingLabel`, but there is no persistent issue surface. Blocking Issues: none. Next Subtask: add a viewport-local issue chip and route failure/recovery states through one helper. Known Risks: stale issue messages, overlap with the inspector/layers control, and overly noisy transient tracking loss.
- 2026-08-11 UTC: Added an issue-only lower-left OpenCV chip with responsive sizing, tooltip detail, and clear-on-recovery behavior. Routed detection, tracking, and reference-detection failure paths through `reportOpenCvIssue()`.
- 2026-08-11 UTC: Browser verification: normal Photo mode keeps the chip hidden; a simulated worker timeout showed `Detection failed · adjust corners` with the full error in the tooltip; successful Redetect cleared it; mobile bounds stayed above and left of the Layers control. Node suite passes 24/24 and diagnostics are clean.
- 2026-08-11 UTC: Follow-up investigation found live retries cleared the chip before every 700ms reacquisition, making repeated failures appear invisible. Added sticky retry issues, confidence reporting, a low-confidence rejection threshold, and separate tracking-setup messaging.
- 2026-08-11 UTC: Browser verification with runtime 3: null results show `No usable canvas`, weak 8% results show the confidence detail, real detection reports `Canvas detected · 100%`, and simulated live retries keep `No usable canvas · hold camera steady` visible across retry cycles. Node suite passes 24/24.
- 2026-08-11 UTC: Follow-up browser inspection found the chip markup was loading with a cached pre-chip stylesheet, leaving it as unstyled static text. Versioned `styles.css` as `runtime=3`; reloaded mobile page now renders the chip at the lower-left with its intended dark badge styling.

## Artifacts Changed

* `index.html`, `styles.css`, `src/app.js`, `README.md`, `.tracking/meta.md`
