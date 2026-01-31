/**
 * Secure IPC Wrapper – Protection Boundary
 *
 * Every IPC handler that accesses business data MUST use protectedProcedure.
 * This wrapper:
 *  1. Validates the session token
 *  2. Verifies branch access
 *  3. Checks role/permission
 *  4. Builds a trusted context (ctx)
 *  5. Calls the handler with ctx
 *
 * NEVER trust renderer input for identity, role, or branch.
 */

import type { IpcMainInvokeEvent } from 'electron'
import { getSession, getRoleForBranch, type SessionContext } from '../services/auth.service'
import { getDb } from '../db'
import type { PrismaClient } from '@prisma/client'

// ── Role hierarchy (higher index = more power) ─────────────

const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  SALES: 1,
  ACCOUNTANT: 2,
  MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
}

// ── Permission → minimum role mapping ──────────────────────

export type Permission =
  | 'read'
  | 'write'
  | 'manage_orders'
  | 'manage_accounts'
  | 'manage_inventory'
  | 'manage_ledger'
  | 'manage_commissions'
  | 'manage_settings'
  | 'manage_users'
  | 'view_analytics'
  | 'view_cost_price'
  | 'view_profit'
  | 'lock_period'
  | 'post_manual_ledger'
  | 'manage_cash_register'

const PERMISSION_MIN_ROLE: Record<Permission, string> = {
  read: 'VIEWER',
  write: 'SALES',
  manage_orders: 'SALES',
  manage_accounts: 'SALES',
  manage_inventory: 'MANAGER',
  manage_ledger: 'ACCOUNTANT',
  manage_commissions: 'MANAGER',
  manage_settings: 'ADMIN',
  manage_users: 'ADMIN',
  view_analytics: 'VIEWER',
  view_cost_price: 'ACCOUNTANT',
  view_profit: 'ACCOUNTANT',
  lock_period: 'OWNER',
  post_manual_ledger: 'ACCOUNTANT',
  manage_cash_register: 'SALES',
}

// ── Context passed to every protected handler ──────────────

export interface SecureContext {
  user: { id: string; email: string; fullName: string }
  activeBranchId: string
  role: string
  session: SessionContext
  prisma: PrismaClient
}

// ── Error types ────────────────────────────────────────────

export class IpcAuthError extends Error {
  constructor(
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_BRANCH',
    message: string,
  ) {
    super(message)
    this.name = 'IpcAuthError'
  }
}

// ── The wrapper ────────────────────────────────────────────

type ProtectedHandler<TInput, TOutput> = (
  ctx: SecureContext,
  input: TInput,
) => Promise<TOutput>

/**
 * Wraps an IPC handler with authentication and authorization.
 *
 * Usage:
 *   ipcMain.handle('orders:list', protectedProcedure('read', async (ctx, filters) => {
 *     return ctx.prisma.order.findMany({ where: { branchId: ctx.activeBranchId, ... } })
 *   }))
 *
 * The renderer must send: { token, branchId, ...payload }
 */
export function protectedProcedure<TInput = any, TOutput = any>(
  requiredPermission: Permission,
  handler: ProtectedHandler<TInput, TOutput>,
) {
  return async (
    _event: IpcMainInvokeEvent,
    rawArgs: { token: string; branchId: string } & TInput,
  ): Promise<TOutput> => {
    // 1. Extract token
    const { token, branchId, ...input } = rawArgs ?? {}

    if (!token) {
      throw new IpcAuthError('UNAUTHORIZED', 'Oturum bulunamadı. Lütfen giriş yapın.')
    }

    // 2. Validate session
    const session = await getSession(token)
    if (!session) {
      throw new IpcAuthError('UNAUTHORIZED', 'Oturum geçersiz veya süresi dolmuş.')
    }

    // 3. Validate branch access
    if (!branchId) {
      throw new IpcAuthError('INVALID_BRANCH', 'Şube seçilmedi.')
    }

    if (!session.allowedBranchIds.includes(branchId)) {
      throw new IpcAuthError('FORBIDDEN', 'Bu şubeye erişim yetkiniz yok.')
    }

    // 4. Check role for this branch
    const role = getRoleForBranch(session, branchId)
    if (!role) {
      throw new IpcAuthError('FORBIDDEN', 'Bu şubede rolünüz bulunamadı.')
    }

    // 5. Check permission
    const minRole = PERMISSION_MIN_ROLE[requiredPermission]
    if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
      throw new IpcAuthError(
        'FORBIDDEN',
        `Bu işlem için yeterli yetkiniz yok (gerekli: ${minRole}).`,
      )
    }

    // 6. Build context
    const ctx: SecureContext = {
      user: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
      },
      activeBranchId: branchId,
      role,
      session,
      prisma: getDb(),
    }

    // 7. Call handler
    return handler(ctx, input as TInput)
  }
}
