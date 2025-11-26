import { useWindowManager } from '@/contexts/WindowManagerContext'
import BrowserWindow from './BrowserWindow'

export default function WindowsContainer() {
  const { state } = useWindowManager()

  return (
    <>
      {state.windows.map(window => (
        <BrowserWindow key={window.id} window={window} />
      ))}
    </>
  )
}
