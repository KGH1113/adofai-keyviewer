import Key from './components/Key'
import { useCallback, useState, useEffect } from 'react'
import throttle from 'lodash/throttle'
import CanvasRectangleSpawner from './components/CanvasRectangleSpawner'

interface KeyViewerConfig {
  window: {
    width: number
    height: number
    transparent: boolean
    show_frame: boolean
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

declare global {
  interface Window {
    electronAPI: {
      onGlobalKeyPressed: (
        callback: (_event: Electron.IpcRendererEvent, data: string[]) => void
      ) => void
      onConfigFileRead: (
        callback: (_event: Electron.IpcRendererEvent, data: KeyViewerConfig) => void
      ) => void
    }
  }
}

function App(): JSX.Element {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])
  const [config, setConfig] = useState<KeyViewerConfig>({
    window: {
      width: 900,
      height: 670,
      transparent: false,
      show_frame: false
    },
    grid_cols: 2,
    grid_rows: 1,
    tile_spawn_area_height: 300,
    padding_of_key: 20,
    space_between_keys: 10,
    accent_color: 'oklch(.667 .295 322.15)',
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
    ]
  })

  const updatePressedKeys = useCallback(
    () =>
      throttle((data: string[]) => {
        setPressedKeys([...data])
      }, 100),
    []
  )

  useEffect(() => {
    // Subscribe to global key pressed events
    window.electronAPI.onGlobalKeyPressed((_event, data) => {
      setPressedKeys([...data])
    })
  }, [updatePressedKeys])

  useEffect(() => {
    window.electronAPI.onConfigFileRead((_event, data) => {
      console.log(data)
      setConfig(data)
    })
  })

  return (
    <div className="h-[300px] w-full">
      <div className="relative">
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
                    rectWidth={50 - row * 7}
                    rectColor={['#fff', config.accent_color][(row + 1) % 2]}
                  />
                ))}
            </div>
          ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.grid_cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${config.grid_rows}, minmax(0, 1fr))`,
          gap: config.space_between_keys,
          position: 'absolute',
          bottom: 0,
          width: '100%'
        }}
      >
        {config.keys_to_track.map((data, i) => (
          <Key
            key={i}
            name={data.label}
            pressed={pressedKeys.includes(data.key_name)}
            padding={config.padding_of_key}
            accentColor={config.accent_color}
            borderRadius={config.border_radius_of_key}
            width={data.width}
            height={data.height}
          />
        ))}
      </div>
    </div>
  )
}

export default App
