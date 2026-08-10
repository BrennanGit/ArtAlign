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
- Maximum meaningful progress per request.

This system is project-agnostic and reusable across repositories.

---

# Core Principles

1. Plan before editing.
2. Log every meaningful change.
3. Verify before ticking.
4. Keep recaps short and structured.
5. Never rely on memory — rely on `.tracking/`.
6. Only one task is active at a time: the top of the Active Task Stack.
7. Default behavior: execute end-to-end without pausing between subtasks.
8. If the request would change how a future agent understands the system, it requires a task entry.

---

# Intent Envelope (Default: Keep Going)

Agents should maximize progress per request.

If work remains consistent with:
- the user's original intent,
- the project brief,
- known architectural constraints,

then continue executing without pausing — even if it requires:
- creating prerequisite tasks,
- fixing bugs discovered during execution,
- refactoring small subsystems,
- adding tests or scaffolding.

Only pause when a Stop Condition is met.

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

---

## 2. Plan

Break work into checklist subtasks.

Each subtask must:

* Reference files.
* Reference functions.
* Include verification steps.

Do not edit code until Plan exists.

---

## 3. Execute

For each subtask:

* Make the change.
* Log timestamped entry in Execution Log.
* Verify.
* Tick checkbox.
* Immediately proceed to next subtask.

### Continuation Rule (Do Not Pause)

After completing a subtask, immediately continue to the next subtask.

Do not pause for confirmation unless a Stop Condition is met.

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
3. Resume next task on stack automatically.

---

# Stop Conditions (Only Reasons To Pause)

The agent must continue executing until the stack unwinds and tasks are complete unless:

1. User decision required (meaningful tradeoffs not covered by spec).
2. Missing user input (files, credentials, environment, approval).
3. Unbounded ambiguity (risk of wasted work).
4. Verification impossible (high regression risk).
5. User explicitly asked to pause.

Discovering a bug elsewhere is NOT a stop condition if it can be fixed within project scope.

---

# Context Discipline (Every Turn)

At start of each session:

1. Read:

   * `.tracking/meta.md`
   * Top task file
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

When the stack is empty:

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
* Continue until complete or blocked.
* Do not pause unnecessarily.
