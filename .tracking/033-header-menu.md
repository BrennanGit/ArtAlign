# Task #033: Header Menu

- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent

## Acceptance Criteria
- [x] A generic menu icon opens the existing view/export/canvas-size menu.
- [x] Menu button sits at the right edge of the workspace header on phone and desktop.

## Plan
- [x] Update `index.html` menu button icon and label, `styles.css` header tool spacing; verify with phone-width browser layout and menu click.

## Execution Log
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: generic right-aligned header menu. Current State: camera icon and hidden mobile save-state owns the only auto margin. Blocking Issues: none. Next Subtask: change icon and layout. Known Risks: narrow phone widths and safe-area insets.
- 2026-09-23 UTC: Replaced icon/label and added auto margin to tools. Browser at 375px measured a 12px right inset and menu expanded with all four options.