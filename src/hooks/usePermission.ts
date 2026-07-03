// 权限检查 Hook
import { useEffect, useState } from 'react';
import type { Permission, AuthUser } from '../types';
import {
  getCurrentUser,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  canEditTicket as checkCanEditTicket,
  canProcessTicket as checkCanProcessTicket
} from '../services/authService';

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(getCurrentUser());

  useEffect(() => {
    // 监听登录状态变化
    const checkAuth = () => {
      setAuthUser(getCurrentUser());
    };

    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return authUser;
}

export function usePermission(permission: Permission): boolean {
  const authUser = useAuth();
  return authUser ? checkPermission(permission) : false;
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const authUser = useAuth();
  return authUser ? checkAnyPermission(permissions) : false;
}

export function useCanEditTicket(assigneeId: string | null): boolean {
  const authUser = useAuth();
  return authUser ? checkCanEditTicket(assigneeId) : false;
}

export function useCanProcessTicket(assigneeId: string | null): boolean {
  const authUser = useAuth();
  return authUser ? checkCanProcessTicket(assigneeId) : false;
}
