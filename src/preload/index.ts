import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      onGlobalKeyPressed: (callback) => ipcRenderer.on('global-key-pressed', callback),
      onTotalCountChange: (callback) => ipcRenderer.on('total-count-changed', callback),
      onConfigFileRead: (callback) => ipcRenderer.on('config-file-read', callback),
      openConfigSelectionDialog: () => ipcRenderer.send('open-config-selction-dialog')
    })
    contextBridge.exposeInMainWorld('camera', {
      async getStream(constraints: MediaStreamConstraints) {
        return await navigator.mediaDevices.getUserMedia(constraints)
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
