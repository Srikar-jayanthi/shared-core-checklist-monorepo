// packages/web/src/storage/LocalStorageAdapter.ts
// Implements the core storage port using browser APIs
import { IStorageAdapter, Task } from '@checklist/core';

export class LocalStorageAdapter implements IStorageAdapter {
  private readonly KEY = 'checklist_tasks';

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }

  loadTasksSync(): Task[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(this.KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
      return [];
    } catch {
      return [];
    }
  }

  async loadTasks(): Promise<Task[]> {
    return this.loadTasksSync();
  }
}
