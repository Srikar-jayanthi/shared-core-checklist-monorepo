import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChecklistStore, Task, IStorageAdapter, FilterType } from '../src/index.js';

class MockStorageAdapter implements IStorageAdapter {
  public savedTasks: Task[] = [];
  public loadTasksMock = vi.fn().mockImplementation(async () => [...this.savedTasks]);
  public saveTasksMock = vi.fn().mockImplementation(async (tasks: Task[]) => {
    this.savedTasks = [...tasks];
  });

  async loadTasks(): Promise<Task[]> {
    return this.loadTasksMock();
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    return this.saveTasksMock(tasks);
  }
}

describe('ChecklistStore (Core Business Logic)', () => {
  let mockStorage: MockStorageAdapter;
  let store: ChecklistStore;

  beforeEach(() => {
    mockStorage = new MockStorageAdapter();
    store = new ChecklistStore(mockStorage);
  });

  it('can be instantiated with a storage adapter', () => {
    expect(store).toBeInstanceOf(ChecklistStore);
    expect(store.getTasks()).toEqual([]);
    expect(store.getFilter()).toBe('ALL');
  });

  it('notifies subscribers when initialized with existing storage data', async () => {
    const initialTasks: Task[] = [
      { id: '1', title: 'Persisted Task', completed: false, createdAt: Date.now() },
    ];
    mockStorage.savedTasks = initialTasks;

    const subscriber = vi.fn();
    const newStore = new ChecklistStore(mockStorage);
    newStore.subscribe(subscriber);

    await newStore.init();

    expect(newStore.getTasks()).toHaveLength(1);
    expect(newStore.getTasks()[0].title).toBe('Persisted Task');
    expect(subscriber).toHaveBeenCalled();
  });

  it('adds a task, updates internal state, and saves to storage', async () => {
    const subscriber = vi.fn();
    store.subscribe(subscriber);

    const task = await store.addTask('Buy Groceries');

    expect(task.title).toBe('Buy Groceries');
    expect(task.completed).toBe(false);
    expect(typeof task.id).toBe('string');
    expect(typeof task.createdAt).toBe('number');

    const tasks = store.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task.id);
    expect(mockStorage.saveTasksMock).toHaveBeenCalledWith(tasks);
    expect(subscriber).toHaveBeenCalled();
  });

  it('throws an error when adding a task with an empty or whitespace title', async () => {
    await expect(store.addTask('')).rejects.toThrow('Task title cannot be empty');
    await expect(store.addTask('   ')).rejects.toThrow('Task title cannot be empty');
  });

  it('toggles a task completion status and notifies subscribers', async () => {
    const task = await store.addTask('Complete homework');
    expect(task.completed).toBe(false);

    const subscriber = vi.fn();
    store.subscribe(subscriber);

    await store.toggleTask(task.id);
    const updatedTasks = store.getTasks();
    expect(updatedTasks[0].completed).toBe(true);
    expect(subscriber).toHaveBeenCalled();

    // Toggle back to active
    await store.toggleTask(task.id);
    expect(store.getTasks()[0].completed).toBe(false);
  });

  it('throws an error when toggling a non-existent task', async () => {
    await expect(store.toggleTask('non-existent-id')).rejects.toThrow(
      'Task with id non-existent-id not found'
    );
  });

  it('deletes a task from internal state and notifies subscribers', async () => {
    const task1 = await store.addTask('Task 1');
    const task2 = await store.addTask('Task 2');

    expect(store.getTasks()).toHaveLength(2);

    const subscriber = vi.fn();
    store.subscribe(subscriber);

    await store.deleteTask(task1.id);

    const remainingTasks = store.getTasks();
    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toBe(task2.id);
    expect(mockStorage.saveTasksMock).toHaveBeenCalledWith(remainingTasks);
    expect(subscriber).toHaveBeenCalled();
  });

  it('throws an error when deleting a non-existent task', async () => {
    await expect(store.deleteTask('missing-id')).rejects.toThrow(
      'Task with id missing-id not found'
    );
  });

  it('filters tasks accurately by ALL, ACTIVE, and COMPLETED', async () => {
    const task1 = await store.addTask('Active Task 1');
    const task2 = await store.addTask('Active Task 2');
    const task3 = await store.addTask('Completed Task');

    await store.toggleTask(task3.id);

    // Default ALL filter
    store.setFilter('ALL');
    expect(store.getFilteredTasks()).toHaveLength(3);

    // ACTIVE filter
    store.setFilter('ACTIVE');
    const activeTasks = store.getFilteredTasks();
    expect(activeTasks).toHaveLength(2);
    expect(activeTasks.map((t) => t.id)).toEqual([task1.id, task2.id]);

    // COMPLETED filter
    store.setFilter('COMPLETED');
    const completedTasks = store.getFilteredTasks();
    expect(completedTasks).toHaveLength(1);
    expect(completedTasks[0].id).toBe(task3.id);
  });

  it('allows unsubscribing from store changes', async () => {
    const subscriber = vi.fn();
    const unsubscribe = store.subscribe(subscriber);

    await store.addTask('Subscribed Task');
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();

    await store.addTask('Another Task');
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
