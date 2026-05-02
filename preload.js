const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nodusBridge', {
  askAI: (payload) => ipcRenderer.invoke('ai:chat', payload),

  authRegister: (payload) => ipcRenderer.invoke('auth:register', payload),
  authLogin: (payload) => ipcRenderer.invoke('auth:login', payload),
  authLogout: () => ipcRenderer.invoke('auth:logout'),
  authRestore: () => ipcRenderer.invoke('auth:restore'),

  cloudPush: (payload) => ipcRenderer.invoke('cloud:push', payload),
  cloudPull: () => ipcRenderer.invoke('cloud:pull'),

  appQuit: () => ipcRenderer.invoke('app:quit'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getChangelog: () => ipcRenderer.invoke('app:get-changelog'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-updates'),
  checkForUpdatesSilent: () => ipcRenderer.invoke('app:check-updates-silent'),
  downloadUpdate: () => ipcRenderer.invoke('app:download-update'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  onUpdateChecking: (callback) => ipcRenderer.on('update:checking', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update:available', (_event, data) => callback(data)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update:not-available', (_event, data) => callback(data)),
  onUpdateProgress: (callback) => ipcRenderer.on('update:progress', (_event, data) => callback(data)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update:downloaded', (_event, data) => callback(data)),
  onUpdateError: (callback) => ipcRenderer.on('update:error', (_event, data) => callback(data)),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url)
});
