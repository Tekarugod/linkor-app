const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nodusBridge', {
  askAI: (payload) => ipcRenderer.invoke('ai:chat', payload),

  authRegister: (payload) => ipcRenderer.invoke('auth:register', payload),
  authLogin: (payload) => ipcRenderer.invoke('auth:login', payload),
  authLogout: () => ipcRenderer.invoke('auth:logout'),

  cloudPush: (payload) => ipcRenderer.invoke('cloud:push', payload),
  cloudPull: () => ipcRenderer.invoke('cloud:pull'),

  appQuit: () => ipcRenderer.invoke('app:quit'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-updates'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url)
});
