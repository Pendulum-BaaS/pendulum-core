export const USER_ROLES = {
  admin: 'admin',
  editor: 'editor',
  user: 'user',
} as const;

type ValueOf<T> = T[keyof T];

export type UserRole = ValueOf<typeof USER_ROLES>;

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
}

export const PREDEFINED_ROLES: Record<UserRole, RoleDefinition> = {
  [USER_ROLES.admin]: {
    name: 'Administrator',
    description: 'Full access to all resources & user management',
    permissions: [
      'read:all',
      'write:all',
      'delete:all',
      'manage:users',
      'manage:settings',
    ],
  },
  [USER_ROLES.editor]: {
    name: 'Editor',
    description: 'Can: read, write, delete - Cannot: manage users',
    permissions: [
      'read:all',
      'write:all',
      'delete:all',
    ],
  },
  [USER_ROLES.user]: {
    name: 'User',
    description: 'Can: read, manage own content',
    permissions: [
      'read:own',
      'write:own',
      'delete:own',
    ],
  },
};

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  return PREDEFINED_ROLES[userRole].permissions.includes(permission);
};
