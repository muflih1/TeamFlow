export const ROLE_PERMISSIONS = {
  'org:owner': [
    'org:profile:delete',
    'org:profile:read',
    'org:profile:manage',
    'org:billing:read',
    'org:billing:manage',
    'org:memberships:read',
    'org:memberships:manage',
    'org:memberships:invite',
    'org:channels:read',
    'org:channels:create',
    'org:channels:update',
    'org:channels:delete',
  ],
  'org:admin': [
    'org:profile:read',
    'org:profile:manage',
    'org:billing:read',
    'org:billing:manage',
    'org:memberships:read',
    'org:memberships:manage',
    'org:memberships:invite',
    'org:channels:read',
    'org:channels:create',
    'org:channels:update',
    'org:channels:delete',
  ],
  'org:member': [
    'org:profile:read',
    'org:billing:read',
    'org:memberships:read',
    'org:channels:read',
  ],
} as const;

export type Roles = keyof typeof ROLE_PERMISSIONS;

export type Permissions = (typeof ROLE_PERMISSIONS)[Roles][number];

export function has<T extends {role: Roles}>(
  membership: T,
  permission: Permissions,
) {
  return new Set(ROLE_PERMISSIONS[membership.role]).has(permission);
}
