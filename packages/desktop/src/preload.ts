import { ipcRenderer } from 'electron';

export interface DesktopAPI {
  getTasks: () => Promise<any[]>;
  addTask: (title: string) => Promise<any>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (filter: string) => Promise<void>;
  getFilter: () => Promise<string>;
  onStoreChanged: (callback: (data: { tasks: any[]; filter: string }) => void) => () => void;
}

const desktopAPI: DesktopAPI = {
  getTasks: () => ipcRenderer.invoke('store:getTasks'),
  addTask: (title: string) => ipcRenderer.invoke('store:addTask', title),
  toggleTask: (id: string) => ipcRenderer.invoke('store:toggleTask', id),
  deleteTask: (id: string) => ipcRenderer.invoke('store:deleteTask', id),
  setFilter: (filter: string) => ipcRenderer.invoke('store:setFilter', filter),
  getFilter: () => ipcRenderer.invoke('store:getFilter'),
  onStoreChanged: (callback) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('store:changed', handler);
    return () => ipcRenderer.removeListener('store:changed', handler);
  },
};

(window as any).desktopAPI = desktopAPI;
