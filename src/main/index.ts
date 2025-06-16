import { app, shell, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron'
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
  accent_color_rgb: {
    r: number
    g: number
    b: number
  }
  accent_color: string
  border_radius_of_key: number
  keys_to_track: {
    label: string
    key_name: string
    width: number
    height: number
  }[]
  press_record: PressRecord[]
}

interface PressRecord {
  key_name: string
  cnt: number
}

// Set default values if the config doesn't exist or is corrupted
const defaultConfig: KeyViewerConfig = {
  window: {
    width: 900,
    height: 670
  },
  grid_cols: 2,
  grid_rows: 1,
  tile_spawn_area_height: 300,
  padding_of_key: 20,
  space_between_keys: 10,
  accent_color_rgb: {
    r: 104,
    g: 212,
    b: 252
  },
  accent_color: 'rgb(104, 212, 252)',
  border_radius_of_key: 10,
  keys_to_track: [
    {
      label: 'F',
      key_name: 'F',
      width: 90,
      height: 60
    },
    {
      label: 'J',
      key_name: 'J',
      width: 90,
      height: 60
    }
  ],
  press_record: []
}

function loadConfig(configPath: string): KeyViewerConfig {
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

let keyViewerConfig = defaultConfig
let configJsonPath: string = ''
let pressedKeys: string[] = []
let mainWindow: BrowserWindow
let ignoreMouseEvents = false

// Factory that creates a listener and hooks platform‑specific error callbacks
function createKeyboardListener(): GlobalKeyboardListener {
  return new GlobalKeyboardListener({
    windows: { onError: restartKeyListener },
    mac: { onError: restartKeyListener },
    x11: { onError: restartKeyListener }
  })
}

let gkl: GlobalKeyboardListener = createKeyboardListener()

const newPresses: PressRecord[] = []

function savePressRecordFile(presses): void {
  const newContent = { ...keyViewerConfig }
  newContent['press_record'] = presses
  fs.writeFile(configJsonPath, JSON.stringify(newContent, null, 2), () => {})
}

async function readPressRecordFile(): Promise<PressRecord[]> {
  const readData = await JSON.parse(fs.readFileSync(configJsonPath, 'utf-8'))['press_record']
  const arr = keyViewerConfig.keys_to_track.map((configKey) => configKey.key_name)
  const onlyKeysToTrack = readData.filter((key) => arr.includes(key.key_name))
  return onlyKeysToTrack
}

function openConfig(): void {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ['openFile']
    })
    .then(async (result) => {
      if (result.canceled) {
        mainWindow.webContents.send('config-file-read', keyViewerConfig)
        return
      }
      configJsonPath = result.filePaths[0]
      keyViewerConfig = loadConfig(configJsonPath)
      mainWindow.setSize(keyViewerConfig.window.width, keyViewerConfig.window.height)
      mainWindow.webContents.send('config-file-read', {
        config: keyViewerConfig,
        pressRecords: await readPressRecordFile()
      })
    })
}

// Listen for key events. The callback receives an event object and a boolean indicating key down/up.
const handleKeyPress = (e): void => {
  if (!e.name) {
    return
  }
  if (e.state === 'DOWN' && !pressedKeys.includes(e.name)) {
    if (!keyViewerConfig.keys_to_track.map((key) => key.key_name).includes(e.name)) {
      return
    }
    pressedKeys = [...pressedKeys, e.name]
    let passed = false
    for (const press of newPresses) {
      if (press.key_name === e.name) {
        press.cnt += 1
        passed = true
      }
    }
    if (!passed) {
      newPresses.push({
        key_name: e.name,
        cnt: 1
      })
    }
    // console.log(e.name)
    mainWindow.webContents.send('global-key-pressed', pressedKeys)
    mainWindow.webContents.send(
      'total-count-changed',
      newPresses.reduce((sum, item) => sum + item.cnt, 0)
    )
  } else if (e.state === 'UP' && pressedKeys.includes(e.name)) {
    pressedKeys = pressedKeys.filter((key) => key !== e.name)
    mainWindow.webContents.send('global-key-pressed', pressedKeys)
  }
}
// Re‑initialises the native key server when it crashes.
function restartKeyListener(): void {
  try {
    // Detach the old handler to avoid leaks / duplicates
    gkl.removeListener(handleKeyPress)
  } catch {
    /* ignored: the listener might already be gone */
  }

  gkl = createKeyboardListener()
  gkl.addListener(handleKeyPress)
}
/** Attaches the key‑press callback once to the current listener. */
function attachKeyListener(): void {
  gkl.addListener(handleKeyPress)
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
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  globalShortcut.register('Alt+Space', () => {
    if (ignoreMouseEvents) {
      mainWindow.setIgnoreMouseEvents(false, { forward: false })
      ignoreMouseEvents = false
    } else {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
      ignoreMouseEvents = true
    }
  })

  attachKeyListener()

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
app.on('window-all-closed', async () => {
  const record = await readPressRecordFile()
  const map = new Map()
  const arr = [...record, ...newPresses]
  arr.forEach(({ key_name, cnt }) => {
    map.set(key_name, (map.get(key_name) || 0) + cnt)
  })
  const sum = Array.from(map, ([key_name, cnt]) => ({ key_name, cnt }))
  savePressRecordFile(sum)
  app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
