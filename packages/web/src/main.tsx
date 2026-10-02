import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ChecklistStore } from '@checklist/core';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';

// Instantiate core store injecting the web platform storage adapter (Dependency Inversion)
const storageAdapter = new LocalStorageAdapter();
const store = new ChecklistStore(storageAdapter);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App store={store} />
  </React.StrictMode>
);
