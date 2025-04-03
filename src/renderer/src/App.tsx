import Key from './components/Key'
import { useCallback, useState, useEffect } from 'react'
import throttle from 'lodash/throttle'
import CanvasRectangleSpawner from './components/CanvasRectangleSpawner'

declare global {
  interface Window {
    electronAPI: {
      onGlobalKeyPressed: (
        callback: (_event: Electron.IpcRendererEvent, data: string[]) => void
      ) => void
    }
  }
}

function App(): JSX.Element {
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  const updatePressedKeys = useCallback(
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

  const config = {
    grid_cols: 8,
    grid_rows: 2,
    padding_of_key: 20,
    space_between_keys: 10,
    accent_color: 'oklch(.667 .295 322.15)',
    border_radius_of_key: 10,
    keys_to_track: [
      {
        label: 'Tab',
        key_name: 'TAB',
        width: 90,
        height: 60
      },
      {
        label: '2',
        key_name: '2',
        width: 90,
        height: 60
      },
      {
        label: '3',
        key_name: '3',
        width: 90,
        height: 60
      },
      {
        label: 'R',
        key_name: 'R',
        width: 90,
        height: 60
      },
      {
        label: 'O',
        key_name: 'O',
        width: 90,
        height: 60
      },
      {
        label: '-',
        key_name: 'MINUS',
        width: 90,
        height: 60
      },
      {
        label: '=',
        key_name: 'EQUALS',
        width: 90,
        height: 60
      },
      {
        label: '\\',
        key_name: 'BACKSLASH',
        width: 90,
        height: 60
      },
      {
        label: 'L⇧',
        key_name: 'LEFT SHIFT',
        width: 90,
        height: 60
      },
      {
        label: '⇪',
        key_name: 'CAPS LOCK',
        width: 90,
        height: 60
      },
      {
        label: 'C',
        key_name: 'C',
        width: 90,
        height: 60
      },
      {
        label: '',
        key_name: 'SPACE',
        width: 90,
        height: 60
      },
      {
        label: 'R⌥',
        key_name: 'RIGHT ALT',
        width: 90,
        height: 60
      },
      {
        label: ',',
        key_name: 'COMMA',
        width: 90,
        height: 60
      },
      {
        label: '↵',
        key_name: 'RETURN',
        width: 90,
        height: 60
      },
      {
        label: 'R⇧',
        key_name: 'RIGHT SHIFT',
        width: 90,
        height: 60
      }
    ]
  }

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
                    height={400}
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
