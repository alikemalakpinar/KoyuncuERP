/**
 * Auth IPC Handlers
 *
 * auth:login  – Authenticate user, return token + branches
 * auth:logout – Revoke session
 * auth:me     – Get current session info (validate token)
 */

import type { IpcMain } from 'electron'
import { login, logout, getSession } from '../services/auth.service'

export function registerAuthHandlers(ipcMain: IpcMain) {
  ipcMain.handle('auth:login', async (_event, data: { email: string; password: string }) => {
    try {
      return await login(data.email, data.password)
    } catch (error: any) {
      console.error('[IPC] auth:login error:', error)
      return { success: false, error: 'Giriş sırasında bir hata oluştu.' }
    }
  })

  ipcMain.handle('auth:logout', async (_event, data: { token: string }) => {
    try {
      await logout(data.token)
      return { success: true }
    } catch (error: any) {
      console.error('[IPC] auth:logout error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:me', async (_event, data: { token: string }) => {
    try {
      const session = await getSession(data.token)
      if (!session) {
        return { success: false, error: 'Oturum geçersiz.' }
      }
      return {
        success: true,
        data: {
          user: {
            id: session.userId,
            email: session.email,
            fullName: session.fullName,
          },
          branches: session.allowedBranches,
        },
      }
    } catch (error: any) {
      console.error('[IPC] auth:me error:', error)
      return { success: false, error: error.message }
    }
  })
}
