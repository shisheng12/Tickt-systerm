// 权限点定义 - 对应需求文档第6节权限矩阵
import type { Permission } from '../types';

// 权限类型
export type PermissionType = 'page' | 'data' | 'action';

// 权限点分组与中文说明
export interface PermissionDef {
  key: Permission;
  label: string;
  group: string;
  type: PermissionType;
  desc: string;
}

export const PERMISSION_DEFS: PermissionDef[] = [
  // 数据看板
  { key: 'dashboard.view', label: '访问数据看板', group: 'dashboard', type: 'page', desc: '可以访问工单数据总览页面' },
  { key: 'dashboard.view_all', label: '查看全部数据', group: 'dashboard', type: 'data', desc: '可查看所有团队的工单数据统计' },
  { key: 'dashboard.export', label: '导出数据报表', group: 'dashboard', type: 'action', desc: '可导出数据看板报表' },

  // 工单管理
  { key: 'ticket.view', label: '访问工单列表', group: 'ticket', type: 'page', desc: '可以访问工单列表页面' },
  { key: 'ticket.view_all', label: '查看全部工单', group: 'ticket', type: 'data', desc: '可查看所有人的工单，否则只能看自己的' },
  { key: 'ticket.view_team', label: '查看团队工单', group: 'ticket', type: 'data', desc: '可查看本团队所有工单' },
  { key: 'ticket.create', label: '新增工单', group: 'ticket', type: 'action', desc: '可创建新工单' },
  { key: 'ticket.edit', label: '编辑工单', group: 'ticket', type: 'action', desc: '可编辑工单基本信息' },
  { key: 'ticket.process', label: '处理工单', group: 'ticket', type: 'action', desc: '可处理工单（改状态、上传材料、添加跟进）' },
  { key: 'ticket.assign', label: '分配工单', group: 'ticket', type: 'action', desc: '可分配/改派工单责任人' },
  { key: 'ticket.batch_assign', label: '批量分配', group: 'ticket', type: 'action', desc: '可批量分配工单' },
  { key: 'ticket.export', label: '导出工单', group: 'ticket', type: 'action', desc: '可导出工单数据' },
  { key: 'ticket.delete', label: '删除工单', group: 'ticket', type: 'action', desc: '可删除工单（危险操作）' },

  // 用户管理
  { key: 'user.view', label: '访问用户管理', group: 'user', type: 'page', desc: '可以访问用户管理页面' },
  { key: 'user.create', label: '新增用户', group: 'user', type: 'action', desc: '可创建新用户' },
  { key: 'user.edit', label: '编辑用户', group: 'user', type: 'action', desc: '可编辑用户信息' },
  { key: 'user.delete', label: '删除用户', group: 'user', type: 'action', desc: '可删除用户' },
  { key: 'user.assign_role', label: '分配角色', group: 'user', type: 'action', desc: '可为用户分配角色' },

  // 角色权限
  { key: 'role.view', label: '访问角色管理', group: 'role', type: 'page', desc: '可以访问角色管理页面' },
  { key: 'role.create', label: '新增角色', group: 'role', type: 'action', desc: '可创建新角色' },
  { key: 'role.edit', label: '编辑角色', group: 'role', type: 'action', desc: '可编辑角色信息' },
  { key: 'role.delete', label: '删除角色', group: 'role', type: 'action', desc: '可删除角色' },
  { key: 'role.edit_permission', label: '编辑权限', group: 'role', type: 'action', desc: '可编辑角色权限配置' },

  // 系统配置
  { key: 'schedule.view', label: '访问排班配置', group: 'system', type: 'page', desc: '可以访问排班配置页面' },
  { key: 'schedule.edit', label: '编辑排班', group: 'system', type: 'action', desc: '可编辑排班配置' }
];

// 权限分组定义
export const PERMISSION_GROUPS = [
  { key: 'dashboard', label: '数据看板', order: 1 },
  { key: 'ticket', label: '工单管理', order: 2 },
  { key: 'user', label: '用户管理', order: 3 },
  { key: 'role', label: '角色权限', order: 4 },
  { key: 'system', label: '系统配置', order: 5 }
];

// 权限类型标签
export const PERMISSION_TYPE_LABELS = {
  page: '页面权限',
  data: '数据权限',
  action: '操作权限'
} as const;

// 班次配置
export const SHIFT_CONFIG = {
  day: { label: '早班', time: '09:00-18:00', color: '#3d7fff', bg: '#e6f4ff' },
  mid: { label: '中班', time: '12:00-21:00', color: '#ff9e3d', bg: '#fff7e6' },
  night: { label: '晚班', time: '18:00-03:00', color: '#722ed1', bg: '#f9f0ff' }
} as const;

export type ShiftKey = keyof typeof SHIFT_CONFIG;
