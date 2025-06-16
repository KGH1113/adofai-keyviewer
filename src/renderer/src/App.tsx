import Key from './components/Key'
import { useState, useEffect } from 'react'
import CanvasRectangleSpawner from './components/CanvasRectangleSpawner'

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

declare global {
  interface Window {
    electronAPI: {
      onGlobalKeyPressed: (
        callback: (_event: Electron.IpcRendererEvent, data: string[]) => void
      ) => void
      onTotalCountChange: (
        callback: (_event: Electron.IpcRendererEvent, data: number) => void
      ) => void
      onConfigFileRead: (
        callback: (
          _event: Electron.IpcRendererEvent,
          data: { config: KeyViewerConfig; pressRecords: PressRecord[] }
        ) => void
      ) => void
      openConfigSelectionDialog: () => void
    }
    camera: {
      getStream: (c: MediaStreamConstraints) => Promise<MediaStream>
    }
  }
}

let startPressRecord: PressRecord[] = []
let storedTotal = 0

function App(): JSX.Element {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])
  const [config, setConfig] = useState<KeyViewerConfig>({
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
  })
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    // Subscribe to global key pressed events
    window.electronAPI.onGlobalKeyPressed((_event, data) => {
      setPressedKeys([...data])
    })

    window.electronAPI.onTotalCountChange((_event, data) => {
      setTotal(data)
    })

    window.electronAPI.onConfigFileRead((_event, data) => {
      setConfig(data.config)
      startPressRecord = data.pressRecords
      storedTotal = startPressRecord.reduce((sum, item) => sum + item.cnt, 0)
    })

    window.electronAPI.openConfigSelectionDialog()

    return (): void => {
      window.electronAPI.onGlobalKeyPressed(() => {})
      window.electronAPI.onConfigFileRead(() => {})
    }
  }, [])

  return (
    <>
      <div
        style={{
          height: config.tile_spawn_area_height
        }}
      >
        <div>
          {[...Array(config.grid_rows)]
            .map((_, i) => i)
            .map((row, rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${config.grid_cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(1, minmax(0, 1fr))`,
                  gap: config.space_between_keys,
                  zIndex: rowIndex * 10,
                  position: 'absolute',
                  inset: 0
                }}
              >
                {config.keys_to_track
                  .slice(config.grid_cols * row, config.grid_cols * (row + 1))
                  .map((data, colIndex) => (
                    <CanvasRectangleSpawner
                      key={colIndex}
                      pressedKeys={pressedKeys}
                      triggerKey={data.key_name}
                      width={data.width}
                      height={config.tile_spawn_area_height}
                      rectWidth={data.width - (row + 1) * 7}
                      rectColor={['#fff', config.accent_color][(row + 1) % 2]}
                    />
                  ))}
              </div>
            ))}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.grid_cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${config.grid_rows}, minmax(0, 1fr))`,
          gap: config.space_between_keys,
          bottom: config.keys_to_track[0].height + config.space_between_keys,
          width: '100%',
          marginTop: config.space_between_keys
        }}
      >
        {config.keys_to_track.map((data, i) => (
          <Key
            key={i}
            name={data.label}
            pressed={pressedKeys.includes(data.key_name)}
            padding={config.padding_of_key}
            accentColor={config.accent_color}
            accentColorRGB={config.accent_color_rgb}
            borderRadius={config.border_radius_of_key}
            width={data.width}
            height={data.height}
            startPressCnt={
              (startPressRecord.find((press) => press.key_name === data.key_name) ?? { cnt: 0 }).cnt
            }
          />
        ))}
      </div>
      <div
        style={{
          bottom: 0,
          width: '100%'
        }}
      >
        <div
          style={{
            padding: config.padding_of_key,
            color: '#fff',
            border: `2px solid ${config.accent_color}`,
            background: `rgba(${config.accent_color_rgb.r}, ${config.accent_color_rgb.g}, ${config.accent_color_rgb.b}, 0.1)`,
            borderRadius: config.border_radius_of_key,
            width: '100%',
            height: config.keys_to_track[0].height * (2 / 3),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: config.space_between_keys
          }}
        >
          <p
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            Total
          </p>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 'normal'
            }}
          >
            {storedTotal + total}
          </p>
        </div>
      </div>
    </>
  )
}

export default App
