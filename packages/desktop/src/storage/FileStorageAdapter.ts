import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { IStorageAdapter, Task } from '@checklist/core';

export class FileStorageAdapter implements IStorageAdapter {
  private filePath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dataDir = path.join(os.homedir(), '.checklist-app');
      this.filePath = path.join(dataDir, 'tasks.json');
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // directory exists or cannot be created
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      await fs.writeFile(this.filePath, JSON.stringify(tasks, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save tasks to file system:', error);
    }
  }

  async loadTasks(): Promise<Task[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error) {
      // If file doesn't exist yet, return empty list
      return [];
    }
  }
}
