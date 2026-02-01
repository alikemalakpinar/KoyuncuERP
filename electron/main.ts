import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { getDb, disconnectDb } from './db'
import { registerAuthHandlers } from './ipc/auth'
import { registerAccountHandlers } from './ipc/accounts'
import { registerOrderHandlers } from './ipc/orders'
import { registerLedgerHandlers } from './ipc/ledger'
import { registerProductHandlers } from './ipc/products'
import { registerAnalyticsHandlers } from './ipc/analytics'
import { registerPlatinumHandlers } from './ipc/platinum'
import { registerCashHandlers } from './ipc/cash'
import { registerReturnHandlers } from './ipc/returns'
import { registerInvoiceHandlers } from './ipc/invoices'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

async function bootstrap() {
  getDb()
  registerAuthHandlers(ipcMain)
  registerAccountHandlers(ipcMain)
  registerOrderHandlers(ipcMain)
  registerLedgerHandlers(ipcMain)
  registerProductHandlers(ipcMain)
  registerAnalyticsHandlers(ipcMain)
  registerPlatinumHandlers(ipcMain)
  registerCashHandlers(ipcMain)
  registerReturnHandlers(ipcMain)
  registerInvoiceHandlers(ipcMain)
}

app.whenReady().then(async () => {
  await bootstrap()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await disconnectDb()
  if (process.platform !== 'darwin') app.quit()
})
