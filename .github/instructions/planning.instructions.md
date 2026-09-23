---
applyTo: "**"
---

# Workspace Task Tracking Protocol (Agent Mode)

## Purpose

Maintain durable, navigable task memory across sessions using `.tracking/`.

This protocol ensures:
- Work is structured and reproducible.
- Context limits are managed safely.
- Architectural intent is preserved.
- Refactors do not silently break invariants.
- Alignment with user intent takes priority over uninterrupted progress.

This system is project-agnostic and reusable across repositories.

---

# Core Principles

1. Plan before editing.
2. Log every meaningful change.
3. Verify before ticking.
4. Keep recaps short and structured.
5. Never rely on memory — rely on `.tracking/`.
6. Only one task is active at a time: the top of the Active Task Stack.
7. Clarify consequential uncertainty early; otherwise execute end-to-end without pausing between subtasks.
8. If the request would change how a future agent understands the system, it requires a task entry.

---

# Intent Envelope (Keep Going When Aligned)

Agents should maximize useful progress, not the number of steps completed without user input. A short clarification is preferable to implementing the wrong behavior.

If work remains consistent with:
- the user's original intent,
- the project brief,
- known architectural constraints,

then continue executing without pausing — even if it requires:
- creating prerequisite tasks,
- fixing bugs discovered during execution,
- refactoring small subsystems,
- adding tests or scaffolding.

Apply the Clarification Checkpoint before making consequential assumptions. Otherwise continue without unnecessary approval requests; pause when a Stop Condition is met.

## Clarification Checkpoint

During intake, before editing affected code, and whenever new uncertainty changes the plan:

1. Check the request, spec, and nearby implementation for an answer. Identify choices that would materially change user-facing behavior, data semantics, acceptance criteria, or the scope of work.
2. If a consequential choice remains unresolved, ask the user one concise question (or a small related set) with concrete options, a recommendation when possible, and the tradeoff that makes the answer matter. Do not guess and build on that guess. Record the open question in the task plan and pause the affected work until answered.
3. Record the answer and resulting decision in the active task's acceptance criteria or execution log before resuming. If the task is still planned, update that plan first.

Make routine, reversible implementation decisions using existing conventions without asking. A low-risk assumption may be stated and checked during verification; do not interrupt for every subtask. Independent work may continue while waiting only if it cannot prejudge the unresolved decision.

---

# Folder Conventions

- Tracking folder: `.tracking/`
- Task file: `.tracking/NNN-short-slug.md`
- Meta index: `.tracking/meta.md`
- Optional system-level documentation: `.tracking/architecture.md`

If `.tracking/architecture.md` exists, read it before structural changes.

---

# Active Task Stack

`.tracking/meta.md` must contain:

```md
## Active Task Stack

- Top (current):
  - #NNN-short-slug — Status: in-progress — Owner: agent
- Stack:
  - #MMM-short-slug — Status: in-progress — Owner: agent
  - #PPP-short-slug — Status: in-progress — Owner: agent
````

Rules:

* The first entry under “Top” is the currently active task.
* Stack order is most-recent first.
* Only the top task may be edited.
* During multi-feature intake or a handoff, planned task files may be created or refined before activation; implementation and execution logs belong only to the top task.
* Tasks may be PUSHED or POPPED during execution.

---

# When To Create A Task

On any non-trivial request (multi-file changes, logic changes, API changes, structural refactors):

You MUST:

1. Create a new task file before editing code.
2. Add it to `.tracking/meta.md`.
3. Set status = planned.
4. PUSH it to the Active Task Stack.
5. Set status = in-progress.
6. Begin execution.

Exceptions:

* Pure documentation edits.
* Minor typo fixes.
* Small isolated formatting changes.

If unsure → create a task.

## Task Granularity (Avoid Task Explosion)

Default: One task should cover one coherent deliverable.

Agents should NOT create a new task for each planned subtask. Keep subtasks inside the current task unless:
- A prerequisite bug/fix is blocking progress and has its own acceptance criteria, OR
- The work is truly out-of-scope for the current deliverable, OR
- The change is large enough to be independently verifiable and shippable, OR
- The user asked for separate tasks.

Rule of thumb:
- If the new task would take <30 minutes or touches <3 files, keep it as a subtask in the current task.

### Multiple Features in One Request

When a prompt asks for multiple independently deliverable features, treat each feature as one task even if it is small. This overrides the single-task default and the <30-minute rule. Keep tightly coupled steps within a feature as subtasks; do not split every file or fix attempt into its own task.

Before implementing any feature:

1. Identify the requested features, dependencies, consequential open questions, and a sensible execution order. Apply the Clarification Checkpoint before locking in acceptance criteria that depend on a user decision.
2. Create a separate task file for **every** independently deliverable feature, with acceptance criteria, file/function-oriented subtasks, and verification steps. Add every task to `.tracking/meta.md` with status `planned`.
3. Activate only the first task: put it at the top of the Active Task Stack and set it to `in-progress`. Leave other feature tasks `planned` in the task index, not in the active stack.
4. Execute and verify the top task, log the result, then POP it. Activate the next planned feature and continue without waiting for confirmation unless a Stop Condition applies.

If the user explicitly requests separate planning tasks, preserve that separation even when two features touch the same files. Record shared prerequisites or dependencies in the task plans.

## Rapid Iteration Policy (Single Task by Default)

When the user is giving immediate feedback on recent implementation (e.g., “still seeing X”, “almost works, but…”), DO NOT create a new task per fix attempt.

Instead:
- Keep work inside the same active implementation task.
- Add each attempt as a new subtask + execution-log entry.
- Update acceptance criteria to reflect the latest observed issue.
- Mark task done only after the iteration loop stabilizes.

Create a separate bugfix task only when one or more are true:
- The revisit happens in a separate session/time window (not immediate back-and-forth).
- The bug affects a different subsystem than the active implementation.
- The fix is independently shippable with its own acceptance criteria.
- The user explicitly requests separate tracking items.

If prior immediate-iteration tasks were split unnecessarily, prefer consolidation:
- Merge execution notes into the original implementation task.
- Keep one canonical task file for the implementation arc.
- Remove superseded task entries from `.tracking/meta.md`.

### Plan-only Tasks
If the user explicitly asks for a plan, create a docs/research task and stop after delivering the plan.
Implementation should be a separate task only when the user requests it.

### Detours: Subtask vs New Task
If a prerequisite fix is small and local, add it as a subtask in the current task.
If it requires changes across multiple modules, has distinct acceptance criteria, or is reusable beyond the current work, create a detour task and PUSH it.


---

# Execution Workflow

## 1. Create Task (Initial or Detour)

* Determine next NNN (zero-padded).
* Create `.tracking/NNN-short-slug.md` from template.
* Add entry to `.tracking/meta.md`.
* PUSH to Active Task Stack.
* Set status = in-progress.

For multi-feature prompts, first create and index **all** feature plans as `planned`, then activate one at a time as described above. A planned task is not an active-stack entry.

---

## 2. Plan

Break work into checklist subtasks.

Each subtask must:

* Reference files.
* Reference functions.
* Include verification steps.

Do not edit code until Plan exists. If acceptance criteria depend on an unanswered consequential question, record it and clarify before editing the affected behavior.

---

## 3. Execute

For each subtask:

* Make the change.
* Log timestamped entry in Execution Log.
* Verify.
* Tick checkbox.
* Proceed to the next subtask when its intent and acceptance criteria are clear; otherwise apply the Clarification Checkpoint.

### Continuation Rule (Stay Aligned)

After completing a subtask, continue to the next subtask when its intent and acceptance criteria are clear.

Do not pause for routine confirmation. If a new consequential choice arises, apply the Clarification Checkpoint before continuing affected work.

---

# Auto-Chaining (Prerequisite Handling)

If execution is blocked by a bug or missing capability:

1. Create a new task for the prerequisite.
2. PUSH it onto the Active Task Stack.
3. Execute it immediately if:

   * It is required to complete the original intent.
   * It falls within project specification.
   * It does not require a high-impact product decision.
4. POP when verified complete.
5. Resume previous task automatically.

Do not stop at PUSH or POP boundaries.

---

# Active Task Stack Operations

## PUSH

Use when:

* A prerequisite task is required.
* A bug fix is needed to continue.
* A refactor is required to unblock progress.

Steps:

1. Create task.
2. Add to meta.md.
3. Add to top of stack.
4. Begin execution immediately.

## POP

Use when:

* Top task is completed or blocked.

Steps:

1. Update status in task file and meta.md.
2. Remove it from top of stack.
3. Resume the next task on the stack, or activate the next planned feature from the task index, automatically.

---

# Stop Conditions (Only Reasons To Pause)

The agent must continue executing until the stack unwinds and tasks are complete unless:

1. A consequential user decision is required (meaningful tradeoffs not covered by the request, spec, or codebase): ask a focused clarifying question, record it, and pause affected work until answered.
2. Missing user input (files, credentials, environment, approval).
3. Unbounded ambiguity (risk of wasted work).
4. Verification impossible (high regression risk).
5. User explicitly asked to pause.
6. After a bounded analysis of a multi-feature request, the combined implementation and verification are clearly too large to finish reliably in this chat. Use the handoff procedure below; do not invoke this merely because the request has several features or context may compact.

Discovering a bug elsewhere is NOT a stop condition if it can be fixed within project scope.

### Oversized-Request Handoff

Make this call after a brief scope and dependency analysis, before starting implementation where possible. If the work is too large for reliable end-to-end execution in this chat with regards to context management:

1. Leave a durable plan for each feature in `.tracking/`, with acceptance criteria, dependency order, verification steps, and any unresolved questions. For an analysis-only handoff, index them as `planned` in `.tracking/meta.md` and leave the Active Task Stack empty. If implementation has already begun, keep that task `in-progress` at the top of the stack with an accurate execution log and next step; leave the remaining features `planned`.
2. In the response, say plainly: "This is huge; put the implementation in a new chat." Link the task files, state what has and has not been implemented or verified, and name the first task to resume. Do not imply completion or silently drop a feature.
3. Stop after that handoff. The next chat resumes from `.tracking/meta.md` and the task files; it should not re-plan completed analysis without cause.

This is an escape hatch for genuinely oversized work, not a default pause between ordinary subtasks.

---

# Context Discipline (Every Turn)

At start of each session:

1. Read:

   * `.tracking/meta.md`
   * Top task file
    * If the stack is empty but planned feature tasks remain, the next planned task file (activate it before adding an execution log)
   * `.tracking/architecture.md` (if exists)

2. Append to Execution Log:

```md
Start-of-turn Context Recap:
Goal:
Current State:
Blocking Issues:
Next Subtask:
Known Risks:
```

3. Include a 3–5 bullet recap in chat.

Keep concise.

---

# Cleanup

Before marking a task complete:

* Remove obsolete code.
* Remove temporary scaffolding.
* Update README if behavior changed.
* Update `.tracking/meta.md`:

  * Status
  * Files affected
  * Functions affected
* POP from stack.

---

# Completion

When the stack is empty and no planned feature tasks remain:

* Confirm original user intent satisfied.
* Ensure all tasks are done or blocked.
* Add final summaries.

---

# Safeguards

* If numbering collision occurs → choose next available.
* If required file missing → create minimal stub.
* If user edited files between sessions → re-read before modifying.
* Snippet Cache ≤100 lines.
* Do not delete code without checking active tasks.

---

# Trigger Phrase

If a prompt contains `#plan`, full protocol must be followed.

---

# Self-Reminder

* Read meta.md first; update it last.
* Plan → execute → verify → pop.
* Log every change.
* Continue while aligned; clarify before consequential assumptions.
* Do not pause for routine decisions.
