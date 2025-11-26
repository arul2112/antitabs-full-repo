import { app, BrowserWindow, ipcMain, session, globalShortcut, shell, screen, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { fileURLToPath } from 'url'

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.allowDowngrade = false

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get the app icon path
function getIconPath() {
  const isDev = process.env.VITE_DEV_SERVER_URL !== undefined
  const basePath = isDev ? path.join(__dirname, '../build') : path.join(process.resourcesPath, 'build')

  if (process.platform === 'darwin') {
    return path.join(basePath, 'icon.icns')
  } else if (process.platform === 'win32') {
    return path.join(basePath, 'icon.ico')
  } else {
    return path.join(basePath, 'icon.png')
  }
}

let mainWindow: BrowserWindow | null = null

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

async function createWindow() {
  try {
    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.bounds

    // Load app icon
    const iconPath = getIconPath()
    console.log('Loading icon from:', iconPath)

    let appIcon
    try {
      const fs = await import('fs')
      if (!fs.existsSync(iconPath)) {
        console.warn('Icon file does not exist at:', iconPath)
        appIcon = undefined
      } else {
        appIcon = nativeImage.createFromPath(iconPath)
        if (appIcon.isEmpty()) {
          console.warn('App icon is empty, using default. Path:', iconPath)
          appIcon = undefined
        } else {
          console.log('Icon loaded successfully, size:', appIcon.getSize())
        }
      }
    } catch (err) {
      console.warn('Failed to load app icon:', err)
      appIcon = undefined
    }

    // Set dock icon on macOS
    if (process.platform === 'darwin' && appIcon) {
      app.dock.setIcon(appIcon)
    }

    mainWindow = new BrowserWindow({
      width: width,
      height: height,
      x: 0,
      y: 0,
      frame: false,
      fullscreen: true,
      backgroundColor: '#0d0d0d',
      icon: appIcon,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true,
        sandbox: false
      },
      show: false
    })

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show()
    })

    // Load the app - in development use Vite dev server, in production use built files
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
      // Open DevTools in development
      // mainWindow.webContents.openDevTools()
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    // Handle window errors
    mainWindow.webContents.on('crashed', () => {
      console.error('Window crashed')
    })

    mainWindow.webContents.on('unresponsive', () => {
      console.warn('Window became unresponsive')
    })

    mainWindow.webContents.on('responsive', () => {
      console.log('Window became responsive again')
    })

    // Listen for mouse wheel events with modifier keys
    mainWindow.webContents.on('before-input-event', (event, input) => {
      try {
        const isMac = process.platform === 'darwin'
        const modifiersPressed = isMac
          ? (input.meta && input.alt)
          : (input.control && input.alt)

        if (modifiersPressed && input.type === 'mouseWheel') {
          event.preventDefault()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('canvas-zoom-wheel', {
              deltaY: (input as any).deltaY,
              x: (input as any).x,
              y: (input as any).y
            })
          }
        }
      } catch (err) {
        console.error('Error in before-input-event:', err)
      }
    })

    // Set up webview partition for isolation
    const webviewSession = session.fromPartition('persist:webview')
    webviewSession.setPermissionRequestHandler((webContents, permission, callback) => {
      const allowedPermissions = ['notifications', 'media', 'geolocation', 'openExternal']
      callback(allowedPermissions.includes(permission))
    })

  } catch (error) {
    console.error('Error creating window:', error)
  }
}

app.whenReady().then(() => {
  try {
    createWindow()

    // Check for updates after window is created (only in production)
    if (!process.env.VITE_DEV_SERVER_URL) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.log('Auto-update check failed:', err)
        })
      }, 3000) // Wait 3 seconds after app starts
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (error) {
    console.error('Error in app.whenReady:', error)
  }
})

app.on('window-all-closed', () => {
  try {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  } catch (error) {
    console.error('Error in window-all-closed:', error)
  }
})

// Cleanup on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// IPC handlers for window operations
ipcMain.handle('app-minimize', () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize()
    }
  } catch (error) {
    console.error('Error minimizing window:', error)
    throw error
  }
})

ipcMain.handle('app-maximize', () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false)
      } else {
        mainWindow.setFullScreen(true)
      }
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error)
    throw error
  }
})

ipcMain.handle('app-close', () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close()
    }
  } catch (error) {
    console.error('Error closing window:', error)
    throw error
  }
})

ipcMain.handle('app-fullscreen', (_event, flag: boolean) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(flag)
    }
  } catch (error) {
    console.error('Error setting fullscreen:', error)
    throw error
  }
})

// IPC handler for opening external links
ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Error opening external URL:', error)
    return { success: false, error: (error as Error).message }
  }
})

// ============================================
// AUTO-UPDATER EVENTS
// ============================================

// When an update is available
autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  }
})

// When no update is available
autoUpdater.on('update-not-available', (info) => {
  console.log('No update available. Current version:', info.version)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-not-available', {
      version: info.version
    })
  }
})

// Download progress
autoUpdater.on('download-progress', (progress) => {
  console.log(`Download progress: ${progress.percent.toFixed(2)}%`)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  }
})

// Update downloaded and ready to install
autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  }
})

// Error during update
autoUpdater.on('error', (error) => {
  console.error('Auto-update error:', error)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', {
      message: error.message
    })
  }
})

// ============================================
// AUTO-UPDATER IPC HANDLERS
// ============================================

// Check for updates manually
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, updateInfo: result?.updateInfo }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Download the update
ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error) {
    console.error('Error downloading update:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Install the update and restart
ipcMain.handle('install-update', () => {
  try {
    autoUpdater.quitAndInstall(false, true)
    return { success: true }
  } catch (error) {
    console.error('Error installing update:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Get current app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
