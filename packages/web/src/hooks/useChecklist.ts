import { useSyncExternalStore, useCallback } from 'react';
import { ChecklistStore, FilterType } from '@checklist/core';

export function useChecklist(store: ChecklistStore) {
  const tasks = useSyncExternalStore(
    useCallback((callback) => store.subscribe(callback), [store]),
    () => store.getFilteredTasks(),
    () => []
  );

  const filter = useSyncExternalStore(
    useCallback((callback) => store.subscribe(callback), [store]),
    () => store.getFilter(),
    () => 'ALL' as FilterType
  );

  const addTask = useCallback(
    async (title: string) => {
      await store.addTask(title);
    },
    [store]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      await store.toggleTask(id);
    },
    [store]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await store.deleteTask(id);
    },
    [store]
  );

  const setFilter = useCallback(
    (newFilter: FilterType) => {
      store.setFilter(newFilter);
    },
    [store]
  );

  return {
    tasks,
    filter,
    addTask,
    toggleTask,
    deleteTask,
    setFilter,
  };
}
