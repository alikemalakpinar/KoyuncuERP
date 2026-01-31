# Security Architecture – KoyuncuERP

## Threat Model

### Trust Boundary
The Electron **Main process** is the trust boundary. The Renderer (Chromium) is treated as untrusted — identical to a browser client in a web application.

### Authentication
- **bcryptjs** (12 rounds) for password hashing
- **Session tokens**: 32 random bytes → SHA-256 hashed before DB storage
- **24-hour TTL** with server-side Session table
- Token stored in-memory only (never localStorage)
- `auth:login`, `auth:logout`, `auth:me` are the only unprotected IPC channels

### Authorization
Every business IPC handler is wrapped with `protectedProcedure(permission, handler)`:
1. Validates token → resolves Session → loads User + UserBranch records
2. Verifies the requested `branchId` is in the user's allowed branches
3. Checks role hierarchy against required permission
4. Injects `SecureContext { user, activeBranchId, role, prisma }` — handler never sees raw token

### Role Hierarchy
```
VIEWER(0) < SALES(1) < ACCOUNTANT(2) < MANAGER(3) < ADMIN(4) < OWNER(5)
```

### Branch Isolation
- Every transactional table has a required `branchId` column
- All Prisma queries include `branchId: ctx.activeBranchId` filter
- Cross-branch data access is impossible through the IPC layer
- Products are global catalog (shared); stock movements are branch-scoped

### Audit Logging
- `userId` and `branchId` are always derived from the validated session
- Client cannot inject or override audit identity
- All CREATE, UPDATE, DELETE operations generate audit entries

### IDOR Prevention
- `findUnique` replaced with `findFirst` + branchId constraint on sensitive queries
- Account ownership verified before ledger/order operations

## Preload Channel Whitelist
Only explicitly whitelisted IPC channels can be invoked from the renderer. The preload script validates channel names before forwarding.

## Key Files
| File | Purpose |
|------|---------|
| `electron/services/auth.service.ts` | Login, session management, password hashing |
| `electron/ipc/_secure.ts` | protectedProcedure wrapper, role/permission matrix |
| `electron/preload.ts` | Channel whitelist, contextIsolation bridge |
| `src/contexts/AuthContext.tsx` | Frontend auth state (no secrets) |
