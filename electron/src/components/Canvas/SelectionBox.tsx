import styles from './SelectionBox.module.css'

interface SelectionBoxProps {
  x: number
  y: number
  width: number
  height: number
}

export default function SelectionBox({ x, y, width, height }: SelectionBoxProps) {
  return (
    <div
      className={styles.selectionBox}
      style={{
        left: x,
        top: y,
        width,
        height
      }}
    />
  )
}
