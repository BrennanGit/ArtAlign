export class ProjectHistory {
  constructor(project, limit = 50) {
    this.limit = limit;
    this.past = [];
    this.future = [];
    this.current = snapshot(project);
    this.group = null;
  }

  record(project, group = null) {
    const next = snapshot(project);
    if (next === this.current) return false;
    if (!group || group !== this.group) {
      this.past.push(this.current);
      if (this.past.length > this.limit) this.past.shift();
    }
    this.current = next;
    this.future = [];
    this.group = group;
    return true;
  }

  undo() {
    if (!this.past.length) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    this.group = null;
    return JSON.parse(this.current);
  }

  redo() {
    if (!this.future.length) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    this.group = null;
    return JSON.parse(this.current);
  }

  endGroup() { this.group = null; }

  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
}

function snapshot(project) {
  const copy = structuredClone(project);
  delete copy.updatedAt;
  delete copy.lastOpenedAt;
  delete copy.view;
  return JSON.stringify(copy);
}