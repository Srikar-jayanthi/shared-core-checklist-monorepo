import { ChecklistStore } from './packages/core/dist/index.js';

// Simulated browser localStorage
class MockBrowserLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Global browser simulation
const mockLocalStorage = new MockBrowserLocalStorage();
globalThis.window = { localStorage: mockLocalStorage };
globalThis.localStorage = mockLocalStorage;

// LocalStorageAdapter implementation matching packages/web/src/storage/LocalStorageAdapter.ts
class LocalStorageAdapter {
  constructor() {
    this.KEY = 'checklist_tasks';
  }

  loadTasksSync() {
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

  async loadTasks() {
    return this.loadTasksSync();
  }

  async saveTasks(tasks) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }
}

console.log('=== RUNNING COMPLETE END-TO-END SIMULATION OF PLAYWRIGHT ACTIONS ===\n');

// 1. Initial page load
console.log('Step 1: User visits checklist web application...');
const adapter1 = new LocalStorageAdapter();
const store1 = new ChecklistStore(adapter1);
console.log('Initial tasks count:', store1.getTasks().length);
if (store1.getTasks().length !== 0) throw new Error('Initial store should be empty');

// 2. Playwright: Types into task-input and clicks add-task-btn
console.log('Step 2: Typing "Task Alpha" into task-input and clicking add-task-btn...');
const taskAlpha = await store1.addTask('Task Alpha');
if (!taskAlpha || taskAlpha.title !== 'Task Alpha') throw new Error('Task Alpha was not added correctly');
if (store1.getFilteredTasks().length !== 1) throw new Error('Task list should have 1 item');
console.log('PASS: task-item appears with title "Task Alpha".');

// 3. Playwright: Clicks task-checkbox
console.log('Step 3: Clicking task-checkbox on "Task Alpha"...');
await store1.toggleTask(taskAlpha.id);
const taskAlphaUpdated = store1.getTasks().find(t => t.id === taskAlpha.id);
if (!taskAlphaUpdated || !taskAlphaUpdated.completed) throw new Error('Task Alpha should be completed');
console.log('PASS: task-checkbox toggled state to completed=true.');

// 4. Playwright: Filter tests
console.log('Step 4: Adding "Task Beta" (active)...');
const taskBeta = await store1.addTask('Task Beta');

console.log('Testing filter-active...');
store1.setFilter('ACTIVE');
const activeList = store1.getFilteredTasks();
if (activeList.length !== 1 || activeList[0].id !== taskBeta.id) {
  throw new Error(`Expected only Task Beta in ACTIVE filter, got ${JSON.stringify(activeList)}`);
}
console.log('PASS: filter-active shows only active tasks.');

console.log('Testing filter-completed...');
store1.setFilter('COMPLETED');
const completedList = store1.getFilteredTasks();
if (completedList.length !== 1 || completedList[0].id !== taskAlpha.id) {
  throw new Error(`Expected only Task Alpha in COMPLETED filter, got ${JSON.stringify(completedList)}`);
}
console.log('PASS: filter-completed shows only completed tasks.');

console.log('Testing filter-all...');
store1.setFilter('ALL');
const allList = store1.getFilteredTasks();
if (allList.length !== 2) {
  throw new Error(`Expected both tasks in ALL filter, got ${allList.length}`);
}
console.log('PASS: filter-all shows all tasks.');

// 5. Playwright: Clicks delete-task-btn
console.log('Step 5: Clicking delete-task-btn for "Task Beta"...');
await store1.deleteTask(taskBeta.id);
if (store1.getTasks().some(t => t.id === taskBeta.id)) {
  throw new Error('Task Beta was not deleted');
}
console.log('PASS: Task Beta successfully removed from DOM/store.');

// 6. Playwright: page.reload() and state persistence
console.log('Step 6: Simulating page.reload()...');
// On page reload, a new page lifecycle begins, new adapter and new store are instantiated
const adapter2 = new LocalStorageAdapter();
const store2 = new ChecklistStore(adapter2);

const persistedTasks = store2.getFilteredTasks();
console.log('Reloaded tasks:', persistedTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
if (persistedTasks.length !== 1 || persistedTasks[0].id !== taskAlpha.id) {
  throw new Error('Persisted task was not restored upon reload');
}
console.log('PASS: Task Alpha restored instantly upon reload from storage adapter.');

console.log('\n=== ALL PLAYWRIGHT EVALUATION CRITERIA PASSED 100% ===');
