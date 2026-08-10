const DATABASE_NAME = "artalign";
const DATABASE_VERSION = 1;

export class ProjectStore {
  constructor(indexedDB = globalThis.indexedDB) {
    this.indexedDB = indexedDB;
    this.databasePromise = null;
  }

  async listProjects() {
    const database = await this.#database();
    const projects = await request(database.transaction("projects").objectStore("projects").getAll());
    return sortProjects(projects);
  }

  async getProject(id) {
    const database = await this.#database();
    return request(database.transaction("projects").objectStore("projects").get(id));
  }

  async saveProject(project) {
    const database = await this.#database();
    await request(database.transaction("projects", "readwrite").objectStore("projects").put(project));
    return project;
  }

  async deleteProject(id) {
    const database = await this.#database();
    const transaction = database.transaction(["projects", "assets"], "readwrite");
    transaction.objectStore("projects").delete(id);
    const assetIndex = transaction.objectStore("assets").index("projectId");
    const assetKeys = await request(assetIndex.getAllKeys(id));
    for (const key of assetKeys) transaction.objectStore("assets").delete(key);
    await transactionDone(transaction);
  }

  async putAsset({ id, projectId, blob, kind = "image" }) {
    const database = await this.#database();
    const record = { id, projectId, blob, kind, updatedAt: new Date().toISOString() };
    await request(database.transaction("assets", "readwrite").objectStore("assets").put(record));
    return id;
  }

  async getAsset(id) {
    const database = await this.#database();
    const record = await request(database.transaction("assets").objectStore("assets").get(id));
    return record?.blob ?? null;
  }

  async deleteAsset(id) {
    const database = await this.#database();
    await request(database.transaction("assets", "readwrite").objectStore("assets").delete(id));
  }

  async #database() {
    if (!this.indexedDB) throw new Error("IndexedDB is unavailable in this browser");
    if (!this.databasePromise) this.databasePromise = openDatabase(this.indexedDB);
    return this.databasePromise;
  }
}

export class MemoryProjectStore {
  constructor() {
    this.projects = new Map();
    this.assets = new Map();
  }

  async listProjects() {
    return sortProjects([...this.projects.values()].map(clone));
  }

  async getProject(id) {
    const project = this.projects.get(id);
    return project ? clone(project) : undefined;
  }

  async saveProject(project) {
    this.projects.set(project.id, clone(project));
    return project;
  }

  async deleteProject(id) {
    this.projects.delete(id);
    for (const [assetId, asset] of this.assets) {
      if (asset.projectId === id) this.assets.delete(assetId);
    }
  }

  async putAsset({ id, projectId, blob, kind = "image" }) {
    this.assets.set(id, { id, projectId, blob, kind });
    return id;
  }

  async getAsset(id) {
    return this.assets.get(id)?.blob ?? null;
  }

  async deleteAsset(id) {
    this.assets.delete(id);
  }
}

function openDatabase(indexedDB) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    openRequest.onupgradeneeded = () => {
      const database = openRequest.result;
      if (!database.objectStoreNames.contains("projects")) {
        database.createObjectStore("projects", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("assets")) {
        const assets = database.createObjectStore("assets", { keyPath: "id" });
        assets.createIndex("projectId", "projectId", { unique: false });
      }
    };
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror = () => reject(openRequest.error);
  });
}

function request(idbRequest) {
  return new Promise((resolve, reject) => {
    idbRequest.onsuccess = () => resolve(idbRequest.result);
    idbRequest.onerror = () => reject(idbRequest.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function sortProjects(projects) {
  return projects.sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt));
}

function clone(value) {
  return structuredClone(value);
}