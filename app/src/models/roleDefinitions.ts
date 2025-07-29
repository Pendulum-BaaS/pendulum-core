export const USER_ROLES = {
  admin: 'admin',
  user: 'user',
  public: 'public',
} as const;

type ValueOf<T> = T[keyof T];

export type UserRole = ValueOf<typeof USER_ROLES>;

export interface RoleDefinition {
  name: string;
  description: string;
}

export const PREDEFINED_ROLES: Record<UserRole, RoleDefinition> = {
  [USER_ROLES.admin]: {
    name: 'Admin',
    description: 'Administrative access with full system privileges',
  },
  [USER_ROLES.user]: {
    name: 'User',
    description: 'Standard user with permissions based on collection settings',
  },
  [USER_ROLES.public]: {
    name: 'Public',
    description: 'Public access with permissions based on collection settings',
  },
};
