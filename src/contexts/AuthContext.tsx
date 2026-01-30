import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type UserRole = 'patron' | 'mudur' | 'muhasebeci' | 'satis_elemani' | 'acente'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  agencyId?: string
  agencyName?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  canViewCost: boolean
  canViewProfit: boolean
  canViewAllAgencies: boolean
  canManageUsers: boolean
  canCreateInvoice: boolean
  canApproveCommission: boolean
  canViewReports: boolean
  canEditStock: boolean
}

export type Permission =
  | 'view_cost_price'
  | 'view_profit'
  | 'view_all_agencies'
  | 'manage_users'
  | 'create_invoice'
  | 'approve_commission'
  | 'view_reports'
  | 'edit_stock'
  | 'view_accounting'
  | 'view_dashboard_full'
  | 'view_salary_info'
  | 'export_data'
  | 'delete_records'
  | 'manage_settings'

const rolePermissions: Record<UserRole, Permission[]> = {
  patron: [
    'view_cost_price', 'view_profit', 'view_all_agencies', 'manage_users',
    'create_invoice', 'approve_commission', 'view_reports', 'edit_stock',
    'view_accounting', 'view_dashboard_full', 'view_salary_info',
    'export_data', 'delete_records', 'manage_settings',
  ],
  mudur: [
    'view_cost_price', 'view_profit', 'view_all_agencies',
    'create_invoice', 'approve_commission', 'view_reports', 'edit_stock',
    'view_accounting', 'view_dashboard_full', 'export_data',
  ],
  muhasebeci: [
    'view_cost_price', 'view_profit', 'create_invoice',
    'view_reports', 'view_accounting', 'export_data',
  ],
  satis_elemani: [
    'create_invoice', 'view_reports',
  ],
  acente: [
    'view_reports',
  ],
}

const roleLabels: Record<UserRole, string> = {
  patron: 'Patron',
  mudur: 'Müdür',
  muhasebeci: 'Muhasebeci',
  satis_elemani: 'Satış Elemanı',
  acente: 'Acente',
}

export { roleLabels }

// Demo users for development
const demoUsers: Record<string, { password: string; user: User }> = {
  'patron@koyuncu.com': {
    password: 'patron123',
    user: {
      id: 'u1',
      name: 'Ahmet Koyuncu',
      email: 'patron@koyuncu.com',
      role: 'patron',
    },
  },
  'mudur@koyuncu.com': {
    password: 'mudur123',
    user: {
      id: 'u2',
      name: 'Mehmet Yılmaz',
      email: 'mudur@koyuncu.com',
      role: 'mudur',
    },
  },
  'muhasebe@koyuncu.com': {
    password: 'muhasebe123',
    user: {
      id: 'u3',
      name: 'Ayşe Demir',
      email: 'muhasebe@koyuncu.com',
      role: 'muhasebeci',
    },
  },
  'satis@koyuncu.com': {
    password: 'satis123',
    user: {
      id: 'u4',
      name: 'Ali Çelik',
      email: 'satis@koyuncu.com',
      role: 'satis_elemani',
    },
  },
  'acente@koyuncu.com': {
    password: 'acente123',
    user: {
      id: 'u5',
      name: 'John Smith',
      email: 'acente@koyuncu.com',
      role: 'acente',
      agencyId: 'ag1',
      agencyName: 'ABC Trading LLC',
    },
  },
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('koyuncu_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const entry = demoUsers[email]
    if (entry) {
      setUser(entry.user)
      localStorage.setItem('koyuncu_user', JSON.stringify(entry.user))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('koyuncu_user')
  }, [])

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false
      return rolePermissions[user.role].includes(permission)
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        canViewCost: hasPermission('view_cost_price'),
        canViewProfit: hasPermission('view_profit'),
        canViewAllAgencies: hasPermission('view_all_agencies'),
        canManageUsers: hasPermission('manage_users'),
        canCreateInvoice: hasPermission('create_invoice'),
        canApproveCommission: hasPermission('approve_commission'),
        canViewReports: hasPermission('view_reports'),
        canEditStock: hasPermission('edit_stock'),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
