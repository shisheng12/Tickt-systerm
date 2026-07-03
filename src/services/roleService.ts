// 角色与权限服务（扩展CRUD功能）
import type { Role, User, Permission } from '../types';
import { getInitialData } from '../mock';
import { hasPermission } from './authService';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 内存数据存储
let rolesStore: Role[] = getInitialData().roles;
let usersStore: User[] = getInitialData().users;

// ========== 角色管理 ==========

// 获取所有角色
export async function getRoles(): Promise<Role[]> {
  await delay();
  return [...rolesStore];
}

// 获取单个角色
export async function getRole(roleId: string): Promise<Role | null> {
  await delay();
  return rolesStore.find(r => r.id === roleId) || null;
}

// 创建角色
export async function createRole(data: { name: string; description: string; level: number }): Promise<Role> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  // 检查角色名是否重复
  if (rolesStore.some(r => r.name === data.name)) {
    throw new Error('角色名称已存在');
  }

  const newRole: Role = {
    id: `R_${Date.now()}`,
    name: data.name,
    description: data.description,
    permissions: [],
    level: data.level
  };

  rolesStore.push(newRole);
  return newRole;
}

// 更新角色
export async function updateRole(roleId: string, data: Partial<{ name: string; description: string; level: number }>): Promise<Role> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  const role = rolesStore.find(r => r.id === roleId);
  if (!role) {
    throw new Error('角色不存在');
  }

  // 检查角色名是否与其他角色重复
  if (data.name && rolesStore.some(r => r.id !== roleId && r.name === data.name)) {
    throw new Error('角色名称已存在');
  }

  Object.assign(role, data);
  return role;
}

// 删除角色
export async function deleteRole(roleId: string): Promise<void> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  // 检查是否有用户使用该角色
  const hasUsers = usersStore.some(u => u.roleId === roleId);
  if (hasUsers) {
    throw new Error('该角色下还有用户，无法删除');
  }

  rolesStore = rolesStore.filter(r => r.id !== roleId);
}

// 更新角色权限
export async function updateRolePermissions(roleId: string, permissions: Permission[]): Promise<Role> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  const role = rolesStore.find(r => r.id === roleId);
  if (!role) {
    throw new Error('角色不存在');
  }

  role.permissions = permissions;
  return role;
}

// ========== 用户管理 ==========

// 获取所有用户
export async function getUsers(): Promise<User[]> {
  await delay();
  return [...usersStore];
}

// 获取单个用户
export async function getUser(userId: string): Promise<User | null> {
  await delay();
  return usersStore.find(u => u.id === userId) || null;
}

// 创建用户
export async function createUser(data: {
  username: string;
  name: string;
  password: string;
  roleId: string;
  team: string;
  email?: string;
  phone?: string;
  active?: boolean;
}): Promise<User> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  // 检查用户名是否重复
  if (usersStore.some(u => u.username === data.username)) {
    throw new Error('用户名已存在');
  }

  // 检查角色是否存在
  if (!rolesStore.some(r => r.id === data.roleId)) {
    throw new Error('角色不存在');
  }

  const newUser: User = {
    id: `U_${Date.now()}`,
    username: data.username,
    name: data.name,
    roleId: data.roleId,
    team: data.team,
    email: data.email,
    phone: data.phone,
    active: data.active !== false,
    createdAt: new Date().toISOString()
  };

  usersStore.push(newUser);

  // 存储密码（实际应该在后端加密存储）
  // 这里只是 Mock，实际不应该在前端处理密码
  return newUser;
}

// 更新用户
export async function updateUser(userId: string, data: Partial<{
  name: string;
  roleId: string;
  team: string;
  email: string;
  phone: string;
  active: boolean;
}>): Promise<User> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  const user = usersStore.find(u => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  // 检查角色是否存在
  if (data.roleId && !rolesStore.some(r => r.id === data.roleId)) {
    throw new Error('角色不存在');
  }

  Object.assign(user, data);
  return user;
}

// 删除用户
export async function deleteUser(userId: string): Promise<void> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  usersStore = usersStore.filter(u => u.id !== userId);
}

// 修改密码
export async function changePassword(userId: string, newPassword: string): Promise<void> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  const user = usersStore.find(u => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  // 实际应该调用后端API修改密码
  // 这里只是 Mock，密码存储在 authService 中
  console.log(`用户 ${user.username} 的密码已更新`);
}

// 获取角色下的成员
export async function getRoleMembers(roleId: string): Promise<User[]> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限访问');
  }

  return usersStore.filter(u => u.roleId === roleId);
}

// 分配用户到角色
export async function assignUserRole(userId: string, roleId: string): Promise<User> {
  await delay();

  if (!hasPermission('perm.manage')) {
    throw new Error('无权限操作');
  }

  const user = usersStore.find(u => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const role = rolesStore.find(r => r.id === roleId);
  if (!role) {
    throw new Error('角色不存在');
  }

  user.roleId = roleId;
  return user;
}

// 重置数据
export function resetRoles(): void {
  rolesStore = getInitialData().roles;
  usersStore = getInitialData().users;
}
