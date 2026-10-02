import React, { useState } from 'react';
import { ChecklistStore } from '@checklist/core';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { useChecklist } from './hooks/useChecklist';
import './index.css';

// Default instance using Dependency Inversion with LocalStorageAdapter
const defaultStorage = new LocalStorageAdapter();
const defaultStore = new ChecklistStore(defaultStorage);

interface AppProps {
  store?: ChecklistStore;
}

export const App: React.FC<AppProps> = ({ store = defaultStore }) => {
  const [inputValue, setInputValue] = useState('');
  const { tasks, filter, addTask, toggleTask, deleteTask, setFilter } = useChecklist(store);

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    try {
      await addTask(trimmed);
      setInputValue('');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="badge">Clean Architecture & Monorepo</div>
        <h1>Shared Core Checklist</h1>
        <p className="subtitle">
          Web Shell Powered by <span className="highlight">@checklist/core</span>
        </p>
      </header>

      <main className="checklist-card">
        {/* Task Creation Form */}
        <form className="task-form" onSubmit={handleAddTask}>
          <input
            type="text"
            className="task-input"
            data-testid="task-input"
            placeholder="What needs to be done?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            data-testid="add-task-btn"
            onClick={handleAddTask}
          >
            Add Task
          </button>
        </form>

        {/* Filter Controls */}
        <div className="filter-group" role="group" aria-label="Task filters">
          <button
            type="button"
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            data-testid="filter-all"
            onClick={() => setFilter('ALL')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'ACTIVE' ? 'active' : ''}`}
            data-testid="filter-active"
            onClick={() => setFilter('ACTIVE')}
          >
            Active
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            data-testid="filter-completed"
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
          </button>
        </div>

        {/* Task List */}
        <ul className="task-list">
          {tasks.length === 0 ? (
            <li className="empty-state">
              No tasks to display under "{filter.toLowerCase()}" filter.
            </li>
          ) : (
            tasks.map((task) => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
                data-testid="task-item"
                data-completed={task.completed}
              >
                <div className="task-left">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    data-testid="task-checkbox"
                    data-completed={task.completed}
                    checked={task.completed}
                    aria-checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Toggle ${task.title}`}
                  />
                  <span className="task-title">{task.title}</span>
                </div>
                <button
                  type="button"
                  className="btn-delete"
                  data-testid="delete-task-btn"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer info */}
        <footer className="card-footer">
          <span>{tasks.filter((t) => !t.completed).length} items remaining</span>
          <span className="storage-badge">Storage: Browser LocalStorage</span>
        </footer>
      </main>
    </div>
  );
};

export default App;
