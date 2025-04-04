import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import * as fs from 'fs'

interface KeyViewerConfig {
  window: {
    width: number
    height: number
  }
  grid_cols: number
  grid_rows: number
  tile_spawn_area_height: number
  padding_of_key: number
  space_between_keys: number
  accent_color: string
  border_radius_of_key: number
  keys_to_track: {
    label: string
    key_name: string
    width: number
    height: number
  }[]
}

// Set default values if the config doesn't exist or is corrupted
const defaultConfig: KeyViewerConfig = {
  window: {
    width: 280,
    height: 370
  },
  grid_cols: 4,
  grid_rows: 1,
  tile_spawn_area_height: 300,
  padding_of_key: 20,
  space_between_keys: 10,
  accent_color: 'oklch(.667 .295 322.15)',
  border_radius_of_key: 10,
  keys_to_track: [
    {
      label: 'D',
      key_name: 'D',
      width: 60,
      height: 50
    },
    {
      label: 'F',
      key_name: 'F',
      width: 60,
      height: 50
    },
    {
      label: 'J',
      key_name: 'J',
      width: 60,
      height: 50
    },
    {
      label: 'K',
      key_name: 'K',
      width: 60,
      height: 50
    }
  ]
}

function loadConfig(configPath: string | null): KeyViewerConfig {
  try {
    if (!configPath) {
      return defaultConfig
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch (err) {
    console.log(err)
    return defaultConfig
  }
}

let keyViewerConfig = loadConfig('')
let pressedKeys: string[] = []
let mainWindow: BrowserWindow

function openConfig(): void {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openFile']
    })
    .then((result) => {
      if (result.canceled) {
        mainWindow.webContents.send('config-file-read', keyViewerConfig)
        return
      }
      keyViewerConfig = loadConfig(result.filePaths[0])
      mainWindow.setSize(keyViewerConfig.window.width, keyViewerConfig.window.height)
      mainWindow.webContents.send('config-file-read', keyViewerConfig)
    })
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: keyViewerConfig.window.width,
    height: keyViewerConfig.window.height,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    transparent: true,
    frame: false,
    alwaysOnTop: true
  })

  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setFullScreenable(false)

  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.send('config-file-read', keyViewerConfig)
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Initialize the global keyboard listener
  const gkl = new GlobalKeyboardListener()

  // Listen for key events. The callback receives an event object and a boolean indicating key down/up.
  gkl.addListener((e) => {
    if (!e.name) {
      return
    }
    if (e.state === 'DOWN' && !pressedKeys.includes(e.name)) {
      const pressedKeysCopy = [...pressedKeys]
      pressedKeysCopy.push(e.name)
      pressedKeys = [...pressedKeysCopy]
      // console.log(pressedKeys)
      mainWindow.webContents.send('global-key-pressed', pressedKeys)
    } else if (e.state === 'UP' && pressedKeys.includes(e.name)) {
      const pressedKeysCopy = [...pressedKeys]
      const idx = pressedKeysCopy.indexOf(e.name)
      if (idx > -1) {
        pressedKeysCopy.splice(idx, 1)
      }
      pressedKeys = [...pressedKeysCopy]
      mainWindow.webContents.send('global-key-pressed', pressedKeys)
    }
  })

  ipcMain.on('open-config-selction-dialog', () => {
    // console.log(dialog.showOpenDialog({ properties: ['openFile'] }))
    openConfig()
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('key-detection-message', (event, data) => {
    console.log('Received from renderer:', data)
    // Optionally, send a reply back to the renderer
    event.reply('key-detection-reply', { response: 'Hello from main!' })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
