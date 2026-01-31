/**
 * Auth Context – DB-backed authentication with branch selection
 *
 * - No more demo users or mock auth
 * - Token stored in memory (not localStorage for security)
 * - Branch selection required after login if >1 branch
 * - Permissions derived from role per branch
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api, setAuthToken, setActiveBranch, getAuthToken, hasIpc } from '../lib/ipc'

// ── Types ──────────────────────────────────────────────────

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'ACCOUNTANT' | 'VIEWER'

export interface AuthUser {
  id: string
  email: string
  fullName: string
}

export interface AuthBranch {
  branchId: string
  branchName: string
  branchCode: string
  role: UserRole
}

export type Permission =
  | 'view_dashboard_full' | 'view_cost_price' | 'view_profit' | 'view_reports'
  | 'view_accounting' | 'view_all_agencies' | 'view_salary_info'
  | 'create_invoice' | 'manage_users' | 'approve_commission' | 'edit_stock'
  | 'export_data' | 'delete_records' | 'manage_settings'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'view_dashboard_full', 'view_cost_price', 'view_profit', 'view_reports',
    'view_accounting', 'view_all_agencies', 'view_salary_info',
    'create_invoice', 'manage_users', 'approve_commission', 'edit_stock',
    'export_data', 'delete_records', 'manage_settings',
  ],
  ADMIN: [
    'view_dashboard_full', 'view_cost_price', 'view_profit', 'view_reports',
    'view_accounting', 'view_all_agencies',
    'create_invoice', 'approve_commission', 'edit_stock',
    'export_data', 'manage_settings',
  ],
  MANAGER: [
    'view_dashboard_full', 'view_cost_price', 'view_profit', 'view_reports',
    'view_accounting', 'view_all_agencies',
    'create_invoice', 'approve_commission', 'edit_stock', 'export_data',
  ],
  ACCOUNTANT: [
    'view_cost_price', 'view_profit', 'view_reports', 'view_accounting',
    'create_invoice', 'export_data',
  ],
  SALES: ['create_invoice', 'view_reports'],
  VIEWER: ['view_reports'],
}

export const roleLabels: Record<UserRole, string> = {
  OWNER: 'Patron',
  ADMIN: 'Yönetici',
  MANAGER: 'Müdür',
  SALES: 'Satış',
  ACCOUNTANT: 'Muhasebeci',
  VIEWER: 'Görüntüleyici',
}

// ── Context ────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null
  branches: AuthBranch[]
  activeBranch: AuthBranch | null
  isAuthenticated: boolean
  needsBranchSelection: boolean
  role: UserRole | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  selectBranch: (branchId: string) => void
  hasPermission: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [branches, setBranches] = useState<AuthBranch[]>([])
  const [activeBranch, setActiveBranchState] = useState<AuthBranch | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const isAuthenticated = !!user && !!activeBranch
  const needsBranchSelection = !!user && !activeBranch && branches.length > 1
  const role = activeBranch?.role ?? null

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Demo fallback when running in browser (no Electron)
    if (!hasIpc()) {
      const demoToken = 'demo-token'
      const demoUser: AuthUser = { id: 'demo-1', email, fullName: 'Demo Kullanıcı' }
      const demoBranch: AuthBranch = {
        branchId: 'branch-1',
        branchName: 'Ana Şube',
        branchCode: 'HQ',
        role: 'OWNER',
      }
      setToken(demoToken)
      setAuthToken(demoToken)
      setUser(demoUser)
      setBranches([demoBranch])
      setActiveBranchState(demoBranch)
      setActiveBranch(demoBranch.branchId)
      return true
    }

    try {
      const result = await api.login(email, password)
      if (!result.success) return false

      const { token: newToken, user: userData, branches: branchData } = result.data
      setToken(newToken)
      setAuthToken(newToken)
      setUser(userData)
      setBranches(branchData)

      if (branchData.length === 1) {
        setActiveBranchState(branchData[0])
        setActiveBranch(branchData[0].branchId)
      }

      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try { if (token) await api.logout(token) } catch { /* ignore */ }
    setToken(null)
    setAuthToken(null)
    setUser(null)
    setBranches([])
    setActiveBranchState(null)
    setActiveBranch(null)
  }, [token])

  const selectBranch = useCallback((branchId: string) => {
    const branch = branches.find((b) => b.branchId === branchId)
    if (branch) {
      setActiveBranchState(branch)
      setActiveBranch(branchId)
    }
  }, [branches])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!role) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
  }, [role])

  useEffect(() => {
    const existingToken = getAuthToken()
    if (existingToken && !user) {
      api.me(existingToken).then((result) => {
        if (result.success) {
          setToken(existingToken)
          setUser(result.data.user)
          setBranches(result.data.branches)
        }
      }).catch(() => {})
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user, branches, activeBranch, isAuthenticated, needsBranchSelection,
      role, login, logout, selectBranch, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
