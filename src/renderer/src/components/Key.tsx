import React from 'react'

interface Props {
  name: string
  pressed: boolean
  padding: number
  accentColor: string
  borderRadius: number
  width: number
  height: number
}

const Key = React.memo(function Key({
  name,
  pressed,
  padding,
  accentColor,
  borderRadius,
  width,
  height
}: Props): JSX.Element {
  return (
    <div
      style={{
        padding,
        color: accentColor,
        border: `2px solid ${accentColor}`,
        background: pressed ? accentColor : 'transparent',
        borderRadius,
        width,
        height
      }}
    >
      {name}
    </div>
  )
})

export default Key
