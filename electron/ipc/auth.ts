/**
 * Auth IPC Handlers
 *
 * auth:login       – Authenticate user, return token + branches
 * auth:logout      – Revoke session
 * auth:me          – Get current session info (validate token)
 * auth:branches    – Get all branches for login screen
 * auth:branchUsers – Get users for a specific branch
 */

import type { IpcMain } from 'electron'
import { login, logout, getSession } from '../services/auth.service'
import { getDb } from '../db'

export function registerAuthHandlers(ipcMain: IpcMain) {
  // Get all branches for login screen
  ipcMain.handle('auth:branches', async () => {
    try {
      const db = getDb()
      const branches = await db.branch.findMany({
        include: {
          _count: { select: { users: { where: { isActive: true } } } },
        },
        orderBy: { name: 'asc' },
      })

      return {
        success: true,
        data: branches.map((b) => ({
          branchId: b.id,
          branchName: b.name,
          branchCode: b.code,
          city: b.address || '',
          userCount: b._count.users,
        })),
      }
    } catch (error: any) {
      console.error('[IPC] auth:branches error:', error)
      return { success: false, error: 'Şubeler yüklenemedi.' }
    }
  })

  // Get users for a specific branch
  ipcMain.handle('auth:branchUsers', async (_event, data: { branchId: string }) => {
    try {
      const db = getDb()
      const userBranches = await db.userBranch.findMany({
        where: { branchId: data.branchId, isActive: true },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, isActive: true },
          },
        },
      })

      // Generate avatar colors based on user name
      const colors = [
        'from-amber-500 to-orange-600',
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-purple-500 to-violet-600',
        'from-cyan-500 to-blue-600',
        'from-pink-500 to-rose-600',
        'from-teal-500 to-emerald-600',
        'from-indigo-500 to-blue-600',
      ]

      const users = userBranches
        .filter((ub) => ub.user.isActive)
        .map((ub, idx) => ({
          id: ub.user.id,
          fullName: ub.user.fullName,
          email: ub.user.email,
          role: ub.role,
          avatarColor: colors[idx % colors.length],
        }))

      return { success: true, data: users }
    } catch (error: any) {
      console.error('[IPC] auth:branchUsers error:', error)
      return { success: false, error: 'Kullanıcılar yüklenemedi.' }
    }
  })

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
