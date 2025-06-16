import React from 'react'

interface Props {
  name: string
  pressed: boolean
  padding: number
  accentColor: string
  accentColorRGB: {
    r: number
    g: number
    b: number
  }
  borderRadius: number
  width: number
  height: number
  startPressCnt: number
}

const Key = React.memo(function Key({
  name,
  pressed,
  padding,
  accentColor,
  accentColorRGB,
  borderRadius,
  width,
  height,
  startPressCnt
}: Props): JSX.Element {
  const [cnt, setCnt] = React.useState<number>(0)
  React.useEffect(() => {
    if (pressed) {
      setCnt((prev) => prev + 1)
    }
  }, [pressed])

  return (
    <div
      style={{
        padding,
        color: pressed ? '#000' : '#fff',
        border: `2px solid ${pressed ? '#fff' : accentColor}`,
        background: pressed
          ? '#fff'
          : `rgba(${accentColorRGB.r}, ${accentColorRGB.g}, ${accentColorRGB.b}, 0.1)`,
        borderRadius,
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1
      }}
    >
      <p
        style={{
          fontSize: '1.3rem',
          fontWeight: 'bold'
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontSize: '0.6rem',
          fontWeight: 'normal'
        }}
      >
        {startPressCnt + cnt}
      </p>
    </div>
  )
})

export default Key
