import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { registerAccountHandlers } from './ipc/accounts'
import { registerOrderHandlers } from './ipc/orders'
import { registerLedgerHandlers } from './ipc/ledger'
import { registerAnalyticsHandlers } from './ipc/analytics'
import { registerProductHandlers } from './ipc/products'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpcHandlers() {
  registerAccountHandlers(ipcMain)
  registerOrderHandlers(ipcMain)
  registerLedgerHandlers(ipcMain)
  registerAnalyticsHandlers(ipcMain)
  registerProductHandlers(ipcMain)
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
