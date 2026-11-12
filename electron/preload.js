'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  const handler = (_event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (patch) => ipcRenderer.invoke('config:save', patch),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  applyTheme: (id) => ipcRenderer.invoke('theme:apply', id),
  restoreAuto: () => ipcRenderer.invoke('theme:auto'),
  onConfig: (callback) => subscribe('config:changed', callback),
  onTheme: (callback) => subscribe('theme:effective', callback),
  onTuck: (callback) => subscribe('tuck:changed', callback),
  getTuck: () => ipcRenderer.invoke('tuck:get'),
  getUpdateInfo: () => ipcRenderer.invoke('update:get'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdate: (callback) => subscribe('update:status', callback),
  openSettings: () => ipcRenderer.invoke('settings:open'),
  finishSetup: (patch) => ipcRenderer.invoke('setup:finish', patch),
  closeSelf: () => ipcRenderer.send('window:close'),
  contextMenu: () => ipcRenderer.invoke('context:menu'),
  pickImage: () => ipcRenderer.invoke('dialog:image'),
  imageData: (filePath) => ipcRenderer.invoke('image:data', filePath),
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
  summary: (text) => ipcRenderer.send('summary:update', text),
  toggleVisibility: () => ipcRenderer.invoke('window:toggle'),
  hide: () => ipcRenderer.invoke('window:hide'),
  openDataDir: () => ipcRenderer.invoke('data:open'),
  openRepository: () => ipcRenderer.invoke('link:repo'),
  quit: () => ipcRenderer.invoke('app:quit'),
  togglePrivacy: () => ipcRenderer.invoke('privacy:toggle')
});
