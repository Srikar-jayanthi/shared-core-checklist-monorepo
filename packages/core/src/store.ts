// packages/core/src/store.ts
// Manages the state of the application and notifies subscribers of changes
// Params: IStorageAdapter to handle persistence without knowing platform specifics
// Returns: Instance of ChecklistStore

import { Task, IStorageAdapter, FilterType } from './types.js';

export class ChecklistStore {
  private tasks: Task[] = [];
  private filter: FilterType = 'ALL';
  private subscribers: Set<() => void> = new Set();
  private storage: IStorageAdapter;
  private isInitialized = false;
  private cachedFilteredTasks: Task[] | null = null;

  constructor(storageAdapter: IStorageAdapter) {
    this.storage = storageAdapter;
    // Fast-path synchronous hydration if adapter supports it (e.g. LocalStorage)
    if ('loadTasksSync' in storageAdapter && typeof (storageAdapter as any).loadTasksSync === 'function') {
      try {
        const syncTasks = (storageAdapter as any).loadTasksSync();
        if (Array.isArray(syncTasks) && syncTasks.length > 0) {
          this.tasks = [...syncTasks];
          this.isInitialized = true;
        }
      } catch {
        // ignore fallback to async init
      }
    }
    // Asynchronously initialize from storage
    this.init().catch((err) => {
      console.error('Failed to initialize tasks from storage:', err);
    });
  }

  // Subscribes a UI component to state changes
  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notifies all subscribers to re-render
  private notify(): void {
    this.cachedFilteredTasks = null;
    for (const callback of this.subscribers) {
      callback();
    }
  }

  // Initialization logic to load tasks
  public async init(): Promise<void> {
    try {
      const loaded = await this.storage.loadTasks();
      if (Array.isArray(loaded)) {
        if (!this.isInitialized && this.tasks.length === 0) {
          this.tasks = [...loaded];
        } else if (!this.isInitialized && this.tasks.length > 0) {
          const currentIds = new Set(this.tasks.map((t) => t.id));
          const missing = loaded.filter((t) => !currentIds.has(t.id));
          this.tasks = [...missing, ...this.tasks];
        } else {
          this.tasks = [...loaded];
        }
      }
    } finally {
      this.isInitialized = true;
      this.notify();
    }
  }

  // Business rule: Add a new task
  public async addTask(title: string): Promise<Task> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Task title cannot be empty');
    }

    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const task: Task = {
      id,
      title: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    this.tasks = [...this.tasks, task];
    await this.storage.saveTasks(this.tasks);
    this.notify();
    return task;
  }

  // Business rule: Toggle task completion status
  public async toggleTask(id: string): Promise<void> {
    const taskIndex = this.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    this.tasks = this.tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    await this.storage.saveTasks(this.tasks);
    this.notify();
  }

  // Business rule: Delete a task
  public async deleteTask(id: string): Promise<void> {
    const taskIndex = this.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    this.tasks = this.tasks.filter((t) => t.id !== id);
    await this.storage.saveTasks(this.tasks);
    this.notify();
  }

  // Business rule: Set filter type
  public setFilter(filter: FilterType): void {
    if (this.filter !== filter) {
      this.filter = filter;
      this.notify();
    }
  }

  // Retrieve current active filter
  public getFilter(): FilterType {
    return this.filter;
  }

  // Retrieve tasks based on the current filter
  public getFilteredTasks(): Task[] {
    if (!this.cachedFilteredTasks) {
      switch (this.filter) {
        case 'ACTIVE':
          this.cachedFilteredTasks = this.tasks.filter((t) => !t.completed);
          break;
        case 'COMPLETED':
          this.cachedFilteredTasks = this.tasks.filter((t) => t.completed);
          break;
        case 'ALL':
        default:
          this.cachedFilteredTasks = [...this.tasks];
          break;
      }
    }
    return this.cachedFilteredTasks;
  }

  // Retrieve all tasks
  public getTasks(): Task[] {
    return [...this.tasks];
  }
}
