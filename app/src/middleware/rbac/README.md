# Pendulum Role-Based Access Control (RBAC) System

The Pendulum BaaS implements a comprehensive role-based access control system that governs user permissions across all database operations and administrative functions. This system ensures secure, granular access control while maintaining simplicity for developers.

## Overview

The RBAC system is built around three core concepts:
- **Roles**: Predefined permission sets (admin, editor, user)
- **Permissions**: Granular access rights (read:all, write:own, etc.)
- **Document Ownership**: User-based resource ownership for fine-grained control

## Table of Contents
1. [Role Definitions](#role-definitions)
2. [Permission System](#permission-system)
3. [Authentication & Authorization Flow](#authentication--authorization-flow)
4. [Document Ownership](#document-ownership)
5. [Middleware Components](#middleware-components)
6. [Usage Examples](#usage-examples)
7. [Security Considerations](#security-considerations)

## Role Definitions

### Available Roles

The system defines three predefined roles with escalating permissions:

#### 1. User (Default)
- **Description**: Can read and manage own content
- **Permissions**: `read:own`, `write:own`, `delete:own`
- **Use Case**: Regular application users who can only access their own data

#### 2. Editor
- **Description**: Can read, write, and delete all content but cannot manage users
- **Permissions**: `read:all`, `write:all`, `delete:all`
- **Use Case**: Content managers, moderators, or staff who need broad data access

#### 3. Admin
- **Description**: Full access to all resources and user management
- **Permissions**: `read:all`, `write:all`, `delete:all`, `manage:users`, `manage:settings`
- **Use Case**: System administrators with complete control

### Role Structure

```typescript
export const USER_ROLES = {
  admin: 'admin',
  editor: 'editor',
  user: 'user',
} as const;

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
}
```

## Permission System

### Permission Types

Permissions follow a `action:scope` format:

#### Read Permissions
- `read:own` - Read documents owned by the user
- `read:all` - Read any document in the system

#### Write Permissions
- `write:own` - Create/update documents owned by the user
- `write:all` - Create/update any document in the system

#### Delete Permissions
- `delete:own` - Delete documents owned by the user
- `delete:all` - Delete any document in the system

#### Management Permissions
- `manage:users` - Create, update, delete users and modify roles
- `manage:settings` - Modify system-wide settings

### Permission Checking

```typescript
import { hasPermission } from '../models/roleDefinitions';

// Check if user has specific permission
const canDeleteAll = hasPermission(user.role, 'delete:all');

// Permission hierarchy automatically handles scope
// admin with 'delete:all' can also perform 'delete:own' operations
```

## Authentication & Authorization Flow

### 1. Token-Based Authentication

```typescript
// JWT token contains user info
const token = jwt.sign({
  userId: String(userInfo._id),
  role: userInfo.role || USER_ROLES.user,
  username: userInfo.username,
}, process.env.JWT_SECRET, { expiresIn: "24h" });
```

### 2. Request Authentication

```typescript
// Every protected route requires authentication
router.get('/:id', 
  authenticateToken,           // Verify JWT and extract user info
  requireResourceAccess('read'), // Check permission level
  validateGetOne,              // Validate input
  getController.one           // Execute business logic
);
```

### 3. Permission Validation

The system uses multiple layers of permission checking:

#### Route-Level Permissions
```typescript
// Broad permission categories
requireResourceAccess('read')    // read:own OR read:all
requireResourceAccess('write')   // write:own OR write:all  
requireResourceAccess('delete')  // delete:own OR delete:all
```

#### Document-Level Permissions
```typescript
// Fine-grained ownership checks in controllers
const hasGlobalRead = hasPermission(user.role, 'read:all');
validateDocumentAccess(user, document, 'read', hasGlobalRead);
```

#### Administrative Permissions
```typescript
// Management operations require specific permissions
requireManagementAccess('users')    // manage:users
requireManagementAccess('settings') // manage:settings
```

## Document Ownership

### Automatic Ownership Assignment

All documents automatically receive ownership metadata:

```typescript
const formattedItems = itemsToInsert.map(item => ({
  ...item,
  userId: user.userId,        // Owner identification
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: user.userId,     // Audit trail
}));
```

### Ownership Validation

```typescript
export const isDocumentOwner = (userId: string, document: any): boolean => {
  return document.userId === userId;
};

export const validateDocumentAccess = (
  user: RequiredUser,
  document: any,
  operation: Operation,
  hasGlobalPermission: boolean
): void => {
  if (!hasGlobalPermission && !isDocumentOwner(user.userId, document)) {
    throw createError.forbidden(
      `Access denied: insufficient permissions to ${operation} document`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }
};
```

### Scoped Queries

Users with `*:own` permissions automatically have queries scoped to their documents:

```typescript
// Users can only see their own documents
if (hasPermission(user.role, 'read:all')) {
  result = await getSome(collection, limit, offset, sortKey);
} else if (hasPermission(user.role, 'read:own')) {
  result = await getSomeWithOwnership(collection, user.userId, limit, offset, sortKey);
}
```

## Middleware Components

### Authentication Middleware

#### `authenticateToken`
Validates JWT tokens and extracts user information:

```typescript
export const authenticateToken = (req, res, next) => {
  const token = authHeader?.split(' ')[1];
  if (!token) throw createError.unauthorized('Access token required');
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = { userId: decoded.userId, role: decoded.role };
  next();
};
```

### Authorization Middleware

#### `requireRole(...roles)`
Restricts access to specific roles:

```typescript
// Only admins can access this route
router.patch('/users/:userId/role',
  authenticateToken,
  requireRole(USER_ROLES.admin),
  updateUserRole
);
```

#### `requirePermission(permission)`
Checks for specific permissions:

```typescript
// Requires delete:all permission
router.delete('/all',
  authenticateToken,
  requirePermission('delete:all'),
  deleteAllController
);
```

#### `requireResourceAccess(action)`
Checks for action permissions (own OR all):

```typescript
// Requires read:own OR read:all
router.get('/',
  authenticateToken,
  requireResourceAccess('read'),
  getAllController
);
```

#### `requireManagementAccess(resource)`
Checks for management permissions:

```typescript
// Requires manage:users permission
router.delete('/users/:id',
  authenticateToken,
  requireManagementAccess('users'),
  deleteUserController
);
```

## Usage Examples

### Client-Side Role Checking

```javascript
import { PendulumClient } from 'pendulum-sdk';

const client = new PendulumClient({
  baseURL: 'https://api.yourapp.com',
  authToken: userToken
});

try {
  // This will work for users with read:own or read:all
  const myDocs = await client.db.getAll('documents');
  
  // This will only work for users with write:all or manage:users
  await client.auth.updateUserRole(userId, 'editor');
} catch (error) {
  if (error.response?.data?.error?.errorCode === 'INSUFFICIENT_PERMISSIONS') {
    console.log('User lacks required permissions');
  }
}
```

### Server-Side Permission Checking

```typescript
// In a custom controller
export const customController = async (req: AuthenticatedRequest, res: Response) => {
  const user = getAuthenticatedUser(req);
  
  // Check permissions before proceeding
  if (!hasPermission(user.role, 'manage:settings')) {
    throw createError.forbidden('Insufficient permissions');
  }
  
  // Proceed with operation
  const result = await performAdminOperation();
  res.json(result);
};
```

### Role-Based UI Components

```typescript
// React component with conditional rendering
function AdminPanel({ user }) {
  const canManageUsers = hasPermission(user.role, 'manage:users');
  const canManageSettings = hasPermission(user.role, 'manage:settings');
  
  return (
    <div>
      {canManageUsers && <UserManagement />}
      {canManageSettings && <SystemSettings />}
      <RegularContent />
    </div>
  );
}
```

## Security Considerations

### Token Security
- JWT tokens expire after 24 hours
- Tokens are signed with a secret key stored securely
- Cookies are httpOnly and secure in production

### Permission Validation
- All operations validate permissions at multiple levels
- Document ownership is verified for scoped operations
- Bulk operations require explicit global permissions

### Audit Trail
- All document modifications include `createdBy` and `updatedBy` fields
- Timestamps track `createdAt` and `updatedAt`
- Events are emitted for real-time monitoring

### Role Modification Security
- Users cannot modify their own role
- Only admins can change user roles
- Role changes are validated server-side

### Input Validation
- All role assignments are validated against predefined roles
- Permission strings are checked against known permissions
- User IDs are validated for proper MongoDB format

## Error Handling

The role system integrates with the comprehensive error handling system:

```typescript
// Permission errors return structured responses
{
  "success": false,
  "error": {
    "message": "Access denied: insufficient permissions to delete documents",
    "statusCode": 403,
    "errorCode": "INSUFFICIENT_PERMISSIONS",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "path": "/api/documents"
  }
}
```

Common role-related error codes:
- `INSUFFICIENT_PERMISSIONS` - User lacks required permission
- `INSUFFICIENT_ROLE` - User's role doesn't meet requirements  
- `INVALID_ROLE` - Attempting to assign invalid role
- `SELF_ROLE_CHANGE_DENIED` - User cannot modify own role

For implementation details, see the source files:
- `/app/src/models/roleDefinitions.ts` - Core role and permission definitions
- `/app/src/middleware/roleAuth.ts` - Authentication and authorization middleware
- `/app/src/utils/auth.ts` - Permission checking utilities
- `/app/src/controllers/auth.ts` - Authentication endpoints
