// packages/core/src/types.ts
// Defines the shape of a task and the storage interface
// Params: None
// Returns: Interfaces and Types used across the application

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface IStorageAdapter {
  saveTasks(tasks: Task[]): Promise<void>;
  loadTasks(): Promise<Task[]>;
}

export type FilterType = 'ALL' | 'ACTIVE' | 'COMPLETED';
