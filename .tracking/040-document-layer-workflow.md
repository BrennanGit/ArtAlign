# Task #040: Document Layer Editing Workflow

- ID: #040-document-layer-workflow
- Created: 2026-09-23 UTC
- Status: done
- Type: docs
- Owner: agent
- Related: #038-panel-finish, #039-layer-transform-shortcut

## Summary

Align the technical spec's reference composition and interaction modes with the current layer editing controls.

## Acceptance Criteria

- [x] Reference composition describes selecting a layer name to edit, finishing with the tick in the editor heading beneath the layer list, and reopening by selecting the layer again.
- [x] Modes include TRANSFORM and describe row transform icons, linked reference-group transforms, and finishing with the editor or viewport tick without duplicate transform buttons.
- [x] Spec diff has no whitespace errors or obsolete reference action labels.

## Plan

- [x] Update `spec.md` sections 3 and 19 for reference composition and interaction modes; verify with targeted text search and CRLF-aware `git diff --check`.

## Execution Log

- 2026-09-23 UTC: Start-of-turn Context Recap: Goal: document completed layer UI changes. Current State: reference section names old Done/Edit actions; modes omit TRANSFORM. Blocking Issues: none. Next Subtask: update the two passages. Known Risks: confusing reference composition with generic layer transform or implying group content is baked. Hypothesis: replacing old action labels with row/name/tick behavior suffices; a targeted search for obsolete labels could disconfirm it.
- 2026-09-23 UTC: Updated the two spec sections without changing runtime code. Verified no obsolete reference action labels, no editor diagnostics, and a clean `git -c core.whitespace=cr-at-eol diff --check` (the spec uses CRLF).