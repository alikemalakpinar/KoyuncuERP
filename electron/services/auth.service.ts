/**
 * Auth Service – Session-based authentication
 *
 * - bcrypt password verification
 * - Server-side session table with token hashing
 * - Session revocation (logout / forced invalidation)
 * - Branch-role resolution per user
 */

import { randomBytes, createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { getDb } from '../db'

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const BCRYPT_ROUNDS = 12

// ── Token helpers ───────────────────────────────────────────

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// ── Public API ──────────────────────────────────────────────

export interface SessionContext {
  userId: string
  email: string
  fullName: string
  allowedBranches: { branchId: string; branchName: string; branchCode: string; role: string }[]
  allowedBranchIds: string[]
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function login(email: string, password: string) {
  const db = getDb()

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return { success: false as const, error: 'Geçersiz e-posta veya şifre' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { success: false as const, error: 'Geçersiz e-posta veya şifre' }
  }

  // Get branch assignments
  const userBranches = await db.userBranch.findMany({
    where: { userId: user.id, isActive: true },
    include: { branch: { select: { id: true, name: true, code: true } } },
  })

  if (userBranches.length === 0) {
    return { success: false as const, error: 'Bu kullanıcıya atanmış şube bulunamadı' }
  }

  // Create session
  const token = generateToken()
  const tokenH = hashToken(token)

  await db.session.create({
    data: {
      userId: user.id,
      tokenHash: tokenH,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  })

  const branches = userBranches.map((ub) => ({
    branchId: ub.branch.id,
    branchName: ub.branch.name,
    branchCode: ub.branch.code,
    role: ub.role,
  }))

  return {
    success: true as const,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      branches,
    },
  }
}

export async function logout(token: string): Promise<void> {
  const db = getDb()
  const tokenH = hashToken(token)

  await db.session.updateMany({
    where: { tokenHash: tokenH, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getSession(token: string): Promise<SessionContext | null> {
  const db = getDb()
  const tokenH = hashToken(token)

  const session = await db.session.findUnique({
    where: { tokenHash: tokenH },
    include: {
      user: {
        include: {
          branches: {
            where: { isActive: true },
            include: { branch: { select: { id: true, name: true, code: true } } },
          },
        },
      },
    },
  })

  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt < new Date()) return null
  if (!session.user.isActive) return null

  const allowedBranches = session.user.branches.map((ub) => ({
    branchId: ub.branch.id,
    branchName: ub.branch.name,
    branchCode: ub.branch.code,
    role: ub.role,
  }))

  return {
    userId: session.user.id,
    email: session.user.email,
    fullName: session.user.fullName,
    allowedBranches,
    allowedBranchIds: allowedBranches.map((b) => b.branchId),
  }
}

export function getRoleForBranch(
  sessionCtx: SessionContext,
  branchId: string,
): string | null {
  const branch = sessionCtx.allowedBranches.find((b) => b.branchId === branchId)
  return branch?.role ?? null
}
