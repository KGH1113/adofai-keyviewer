import React, { useRef, useEffect } from 'react'

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
  isGrowing: boolean
}

interface CanvasRectangleSpawnerProps {
  width?: number
  height?: number
  pressedKeys: string[]
  triggerKey: string // Key that this canvas listens to
  rectWidth: number
  rectColor: string
}

const CanvasRectangleSpawner: React.FC<CanvasRectangleSpawnerProps> = ({
  width = 800,
  height = 600,
  pressedKeys,
  triggerKey,
  rectWidth,
  rectColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rectanglesRef = useRef<Rectangle[]>([])
  // Track previous key state for detecting press/release transitions
  const prevPressedKeysRef = useRef<string[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let animationFrameId: number

    const render = (): void => {
      // Check whether the trigger key (e.g., "O") was pressed previously and is pressed now.
      const wasPressed = prevPressedKeysRef.current.includes(triggerKey)
      const isPressed = pressedKeys.includes(triggerKey)

      // On new press, spawn a new rectangle.
      if (!wasPressed && isPressed) {
        const newRect: Rectangle = {
          x: canvas.width / 2 - rectWidth / 2, // Center horizontally
          y: canvas.height, // Start at bottom of canvas
          width: rectWidth,
          height: 0,
          isGrowing: true
        }
        rectanglesRef.current.push(newRect)
      }

      // On key release, mark the last growing rectangle as no longer growing.
      if (wasPressed && !isPressed) {
        const growingRectangles = rectanglesRef.current.filter((rect) => rect.isGrowing)
        if (growingRectangles.length > 0) {
          growingRectangles[growingRectangles.length - 1].isGrowing = false
        }
      }

      // Update the previous pressed keys for the next frame.
      prevPressedKeysRef.current = [...pressedKeys]

      // Clear the canvas.
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw each rectangle.
      rectanglesRef.current = rectanglesRef.current.filter((rect) => {
        if (rect.isGrowing) {
          // Increase the rectangle’s height while the key is held down.
          rect.height += 3
          // Adjust y so that the rectangle appears to grow upward from the bottom.
          rect.y = canvas.height - rect.height
        } else {
          // Once released, move the rectangle upward.
          rect.y -= 3
        }

        // Draw the rectangle if it is still visible.
        if (rect.y + rect.height > 0) {
          context.fillStyle = rectColor
          context.fillRect(rect.x, rect.y, rect.width, rect.height)
          return true
        }
        // Remove rectangle if it moves out of the canvas.
        return false
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return (): void => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [pressedKeys, triggerKey, width, height, rectWidth, rectColor])

  return <canvas ref={canvasRef} width={width} height={height} />
}

export default CanvasRectangleSpawner
