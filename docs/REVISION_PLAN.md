# Revision Plan – Multi-Tenant Security Refactor

## Overview
Refactored KoyuncuERP from prototype with mock authentication to production-grade, secure, multi-branch ERP system with real database-backed auth, branch isolation, and double-entry accounting.

## Completed Steps

### Step 1: Prisma Schema
- [x] Added User, Branch, UserBranch, Session models
- [x] Added CashRegister, CashTransaction, Payment models
- [x] Added required `branchId` to all transactional tables
- [x] Composite indexes on high-volume tables
- [x] Unique constraints (branchId + orderNo, branchId + account code)

### Step 2: Auth Service
- [x] `electron/services/auth.service.ts` with bcrypt + SHA-256 session tokens
- [x] `electron/ipc/auth.ts` with login/logout/me handlers
- [x] 24-hour session TTL, server-side validation

### Step 3: IPC Protection Wrapper
- [x] `electron/ipc/_secure.ts` — protectedProcedure pattern
- [x] Role hierarchy with 15 permission types
- [x] Token → Session → Branch verification chain

### Step 4: Refactor All IPC Handlers
- [x] accounts.ts — branch-scoped CRUD
- [x] orders.ts — branch-scoped with auto-ledger entries
- [x] ledger.ts — account ownership verification
- [x] analytics.ts — branch-scoped KPIs
- [x] products.ts — global catalog, branch-scoped stock
- [x] platinum.ts — inventory, pricing, finance

### Step 5: Trustworthy Audit Logs
- [x] userId/branchId always from session context
- [x] Client cannot override audit identity

### Step 6: Accounting Automation
- [x] Auto-ledger on order create (debit receivables)
- [x] Auto-reversal on order cancel
- [x] Auto-commission on DELIVERED status

### Step 7: Cash Register & Payments
- [x] `electron/ipc/cash.ts` — open/close/transact/Z-report
- [x] Split payment support (CASH/CARD/TRANSFER/INSTALLMENT)

### Step 8: Frontend
- [x] Removed all demo/mock authentication
- [x] Real IPC-based auth in AuthContext
- [x] Branch selection page after login
- [x] Branch indicator in sidebar
- [x] Updated role references (Turkish → enum)

### Infrastructure
- [x] Seed script (`prisma/seed.ts`)
- [x] Security documentation
- [x] Preload channel whitelist updated

## Post-Deployment Checklist
- [ ] Run `npx prisma migrate dev --name identity_branch_scope`
- [ ] Run `npx ts-node prisma/seed.ts`
- [ ] Set `DATABASE_URL` in environment
- [ ] Change default owner password after first login
- [ ] Create additional users via admin panel or direct DB
- [ ] Verify branch isolation with multi-user testing
