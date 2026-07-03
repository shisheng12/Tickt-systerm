// 认证服务 - 登录与权限检查（支持密码验证）
import type { User, Role, AuthUser, Permission } from '../types';
import { users, roles } from '../mock';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 当前登录用户
let currentAuthUser: AuthUser | null = null;

// 用户密码存储（模拟，实际应该加密存储在后端）
const userPasswords: Record<string, string> = {
  'admin': 'admin123',
  'leader': 'leader123',
  'agent': 'agent123',
  'viewer': 'viewer123'
};

// 模拟登录（选择角色，保留旧方法兼容性）
export async function login(userId: string): Promise<AuthUser> {
  await delay();

  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const role = roles.find(r => r.id === user.roleId);
  if (!role) {
    throw new Error('角色不存在');
  }

  currentAuthUser = { user, role };

  // 存储到 localStorage 以便刷新后保持登录状态
  localStorage.setItem('authUser', JSON.stringify(currentAuthUser));

  return currentAuthUser;
}

// 账号密码登录（新增）
export async function loginWithPassword(username: string, password: string): Promise<{ success: boolean; message?: string }> {
  await delay();

  // 查找用户
  const user = users.find(u => u.username === username);
  if (!user) {
    return { success: false, message: '用户名或密码错误' };
  }

  // 检查用户是否启用
  if (!user.active) {
    return { success: false, message: '该账号已被禁用，请联系管理员' };
  }

  // 验证密码
  const storedPassword = userPasswords[username];
  if (storedPassword !== password) {
    return { success: false, message: '用户名或密码错误' };
  }

  // 查找角色
  const role = roles.find(r => r.id === user.roleId);
  if (!role) {
    return { success: false, message: '角色配置异常，请联系管理员' };
  }

  // 设置当前用户
  currentAuthUser = { user, role };

  // 存储到 localStorage
  localStorage.setItem('authUser', JSON.stringify(currentAuthUser));

  return { success: true };
}

// 修改密码（新增）
export async function changeUserPassword(username: string, newPassword: string): Promise<void> {
  await delay();

  if (!userPasswords[username]) {
    throw new Error('用户不存在');
  }

  // 更新密码（实际应用中应该调用后端API）
  userPasswords[username] = newPassword;
}

// 登出
export async function logout(): Promise<void> {
  await delay(100);
  currentAuthUser = null;
  localStorage.removeItem('authUser');
}

// 获取当前登录用户
export function getCurrentUser(): AuthUser | null {
  if (currentAuthUser) {
    return currentAuthUser;
  }

  // 尝试从 localStorage 恢复
  const stored = localStorage.getItem('authUser');
  if (stored) {
    try {
      currentAuthUser = JSON.parse(stored);
      return currentAuthUser;
    } catch {
      localStorage.removeItem('authUser');
    }
  }

  return null;
}

// 检查是否有某个权限
export function hasPermission(permission: Permission): boolean {
  if (!currentAuthUser) {
    return false;
  }

  return currentAuthUser.role.permissions.includes(permission);
}

// 检查是否有任意一个权限
export function hasAnyPermission(permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(p));
}

// 检查是否有所有权限
export function hasAllPermissions(permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(p));
}

// 检查是否是工单的责任人
export function isTicketAssignee(assigneeId: string | null): boolean {
  if (!currentAuthUser || !assigneeId) {
    return false;
  }

  return currentAuthUser.user.id === assigneeId;
}

// 检查是否可以编辑工单（管理员、主管可以编辑所有，客服只能编辑自己的）
export function canEditTicket(assigneeId: string | null): boolean {
  if (!currentAuthUser) {
    return false;
  }

  const roleId = currentAuthUser.user.roleId;

  // 管理员和主管可以编辑所有
  if (roleId === 'R_ADMIN' || roleId === 'R_LEAD') {
    return hasPermission('ticket.edit');
  }

  // 客服只能编辑自己的
  if (roleId === 'R_AGENT') {
    return hasPermission('ticket.edit') && isTicketAssignee(assigneeId);
  }

  return false;
}

// 检查是否可以处理工单（管理员、主管可以处理所有，客服只能处理自己的）
export function canProcessTicket(assigneeId: string | null): boolean {
  if (!currentAuthUser) {
    return false;
  }

  const roleId = currentAuthUser.user.roleId;

  // 管理员和主管可以处理所有
  if (roleId === 'R_ADMIN' || roleId === 'R_LEAD') {
    return hasPermission('ticket.process');
  }

  // 客服只能处理自己的
  if (roleId === 'R_AGENT') {
    return hasPermission('ticket.process') && isTicketAssignee(assigneeId);
  }

  return false;
}
