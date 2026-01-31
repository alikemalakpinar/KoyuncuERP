/**
 * Auth Context – Netflix-style multi-step authentication
 *
 * Flow: Branch Selection → User Selection → Password Entry → Dashboard
 *
 * Demo mode (no Electron): uses hardcoded branches/users
 * Electron mode: uses IPC calls to backend
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api, setAuthToken, setActiveBranch, getAuthToken, hasIpc } from '../lib/ipc'

// ── Types ──────────────────────────────────────────────────

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'ACCOUNTANT' | 'VIEWER'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarColor?: string
}

export interface AuthBranch {
  branchId: string
  branchName: string
  branchCode: string
  role: UserRole
}

export interface BranchInfo {
  branchId: string
  branchName: string
  branchCode: string
  city: string
  userCount: number
}

export interface BranchUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarColor: string
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

// ── Demo Data ──────────────────────────────────────────────

const DEMO_BRANCHES: BranchInfo[] = [
  { branchId: 'branch-ist', branchName: 'Istanbul Merkez', branchCode: 'IST', city: 'Istanbul', userCount: 5 },
  { branchId: 'branch-ank', branchName: 'Ankara Showroom', branchCode: 'ANK', city: 'Ankara', userCount: 3 },
  { branchId: 'branch-izm', branchName: 'Izmir Depo', branchCode: 'IZM', city: 'Izmir', userCount: 2 },
  { branchId: 'branch-usa', branchName: 'USA Office', branchCode: 'USA', city: 'New Jersey', userCount: 2 },
]

const DEMO_BRANCH_USERS: Record<string, BranchUser[]> = {
  'branch-ist': [
    { id: 'u1', fullName: 'Ali Kemal Akpinar', email: 'ali@koyuncu.com', role: 'OWNER', avatarColor: 'from-amber-500 to-orange-600' },
    { id: 'u2', fullName: 'Mehmet Yilmaz', email: 'mehmet@koyuncu.com', role: 'ADMIN', avatarColor: 'from-blue-500 to-indigo-600' },
    { id: 'u3', fullName: 'Ayse Demir', email: 'ayse@koyuncu.com', role: 'ACCOUNTANT', avatarColor: 'from-emerald-500 to-teal-600' },
    { id: 'u4', fullName: 'Fatma Kaya', email: 'fatma@koyuncu.com', role: 'SALES', avatarColor: 'from-purple-500 to-violet-600' },
    { id: 'u5', fullName: 'Hasan Celik', email: 'hasan@koyuncu.com', role: 'MANAGER', avatarColor: 'from-cyan-500 to-blue-600' },
  ],
  'branch-ank': [
    { id: 'u6', fullName: 'Emre Ozturk', email: 'emre@koyuncu.com', role: 'MANAGER', avatarColor: 'from-cyan-500 to-blue-600' },
    { id: 'u7', fullName: 'Zeynep Arslan', email: 'zeynep@koyuncu.com', role: 'SALES', avatarColor: 'from-pink-500 to-rose-600' },
    { id: 'u8', fullName: 'Ali Kemal Akpinar', email: 'ali@koyuncu.com', role: 'OWNER', avatarColor: 'from-amber-500 to-orange-600' },
  ],
  'branch-izm': [
    { id: 'u9', fullName: 'Burak Sahin', email: 'burak@koyuncu.com', role: 'MANAGER', avatarColor: 'from-teal-500 to-emerald-600' },
    { id: 'u10', fullName: 'Ali Kemal Akpinar', email: 'ali@koyuncu.com', role: 'OWNER', avatarColor: 'from-amber-500 to-orange-600' },
  ],
  'branch-usa': [
    { id: 'u11', fullName: 'John Smith', email: 'john@koyuncu.com', role: 'MANAGER', avatarColor: 'from-indigo-500 to-blue-600' },
    { id: 'u12', fullName: 'Ali Kemal Akpinar', email: 'ali@koyuncu.com', role: 'OWNER', avatarColor: 'from-amber-500 to-orange-600' },
  ],
}

// ── Auth Steps ─────────────────────────────────────────────

export type AuthStep = 'branch' | 'user' | 'password' | 'authenticated'

// ── Context ────────────────────────────────────────────────

interface AuthContextType {
  // State
  step: AuthStep
  user: AuthUser | null
  activeBranch: AuthBranch | null
  isAuthenticated: boolean
  role: UserRole | null

  // Branch step
  availableBranches: BranchInfo[]
  selectBranch: (branchId: string) => void
  selectedBranchInfo: BranchInfo | null

  // User step
  branchUsers: BranchUser[]
  selectUser: (userId: string) => void
  selectedUser: BranchUser | null

  // Password step
  login: (password: string) => Promise<boolean>

  // Navigation
  goBackToUsers: () => void
  goBackToBranches: () => void
  logout: () => Promise<void>

  // Permissions
  hasPermission: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<AuthStep>('branch')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [activeBranch, setActiveBranchState] = useState<AuthBranch | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Selection state
  const [availableBranches] = useState<BranchInfo[]>(DEMO_BRANCHES)
  const [selectedBranchInfo, setSelectedBranchInfo] = useState<BranchInfo | null>(null)
  const [branchUsers, setBranchUsers] = useState<BranchUser[]>([])
  const [selectedUser, setSelectedUser] = useState<BranchUser | null>(null)

  const isAuthenticated = step === 'authenticated' && !!user && !!activeBranch
  const role = activeBranch?.role ?? null

  // Step 1: Select branch
  const selectBranch = useCallback((branchId: string) => {
    const branch = availableBranches.find((b) => b.branchId === branchId)
    if (!branch) return
    setSelectedBranchInfo(branch)
    const users = DEMO_BRANCH_USERS[branchId] ?? []
    setBranchUsers(users)
    setStep('user')
  }, [availableBranches])

  // Step 2: Select user
  const selectUser = useCallback((userId: string) => {
    const u = branchUsers.find((bu) => bu.id === userId)
    if (!u) return
    setSelectedUser(u)
    setStep('password')
  }, [branchUsers])

  // Step 3: Enter password and authenticate
  const login = useCallback(async (password: string): Promise<boolean> => {
    if (!selectedUser || !selectedBranchInfo) return false

    // Demo fallback when running in browser (no Electron)
    if (!hasIpc()) {
      // Accept any non-empty password in demo mode
      if (!password) return false
      const demoToken = 'demo-token-' + Date.now()
      setToken(demoToken)
      setAuthToken(demoToken)
      setUser({
        id: selectedUser.id,
        email: selectedUser.email,
        fullName: selectedUser.fullName,
        avatarColor: selectedUser.avatarColor,
      })
      setActiveBranchState({
        branchId: selectedBranchInfo.branchId,
        branchName: selectedBranchInfo.branchName,
        branchCode: selectedBranchInfo.branchCode,
        role: selectedUser.role,
      })
      setActiveBranch(selectedBranchInfo.branchId)
      setStep('authenticated')
      return true
    }

    try {
      const result = await api.login(selectedUser.email, password)
      if (!result.success) return false

      const { token: newToken, user: userData } = result.data
      setToken(newToken)
      setAuthToken(newToken)
      setUser(userData)
      setActiveBranchState({
        branchId: selectedBranchInfo.branchId,
        branchName: selectedBranchInfo.branchName,
        branchCode: selectedBranchInfo.branchCode,
        role: selectedUser.role,
      })
      setActiveBranch(selectedBranchInfo.branchId)
      setStep('authenticated')
      return true
    } catch {
      return false
    }
  }, [selectedUser, selectedBranchInfo])

  // Navigation
  const goBackToUsers = useCallback(() => {
    setSelectedUser(null)
    setStep('user')
  }, [])

  const goBackToBranches = useCallback(() => {
    setSelectedBranchInfo(null)
    setSelectedUser(null)
    setBranchUsers([])
    setStep('branch')
  }, [])

  const logout = useCallback(async () => {
    try { if (token) await api.logout(token) } catch { /* ignore */ }
    setToken(null)
    setAuthToken(null)
    setUser(null)
    setActiveBranchState(null)
    setActiveBranch(null)
    setSelectedBranchInfo(null)
    setSelectedUser(null)
    setBranchUsers([])
    setStep('branch')
  }, [token])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!role) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
  }, [role])

  // Restore session
  useEffect(() => {
    const existingToken = getAuthToken()
    if (existingToken && !user) {
      if (hasIpc()) {
        api.me(existingToken).then((result) => {
          if (result.success) {
            setToken(existingToken)
            setUser(result.data.user)
            if (result.data.branches?.length === 1) {
              setActiveBranchState(result.data.branches[0])
              setStep('authenticated')
            }
          }
        }).catch(() => {})
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      step, user, activeBranch, isAuthenticated, role,
      availableBranches, selectBranch, selectedBranchInfo,
      branchUsers, selectUser, selectedUser,
      login, goBackToUsers, goBackToBranches, logout, hasPermission,
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
