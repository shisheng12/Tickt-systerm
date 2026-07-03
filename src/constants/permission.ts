// 权限点定义 - 对应需求文档第6节权限矩阵
import type { Permission } from '../types';

// 权限点分组与中文说明
export interface PermissionDef {
  key: Permission;
  label: string;
  group: string;
  desc: string;
}

export const PERMISSION_DEFS: PermissionDef[] = [
  { key: 'dashboard.view', label: '查看数据总览', group: '数据总览', desc: '访问工单数据总览页面' },
  { key: 'ticket.view', label: '查看工单', group: '工单管理', desc: '查看工单列表与详情' },
  { key: 'ticket.create', label: '新增工单', group: '工单管理', desc: '创建新工单' },
  { key: 'ticket.edit', label: '编辑工单', group: '工单管理', desc: '编辑工单基本信息' },
  { key: 'ticket.process', label: '处理工单', group: '工单管理', desc: '分配、改状态、传材料' },
  { key: 'ticket.assign', label: '分配责任人', group: '工单管理', desc: '为工单分配/改派责任人' },
  { key: 'ticket.export', label: '导出工单', group: '工单管理', desc: '导出工单文件' },
  { key: 'perm.manage', label: '权限配置管理', group: '系统配置', desc: '管理角色与权限' },
  { key: 'schedule.manage', label: '排班配置管理', group: '系统配置', desc: '管理客服排班' }
];

// 权限分组顺序
export const PERMISSION_GROUPS = ['数据总览', '工单管理', '系统配置'];

// 班次配置
export const SHIFT_CONFIG = {
  day: { label: '早班', time: '09:00-18:00', color: '#3d7fff', bg: '#e6f4ff' },
  mid: { label: '中班', time: '12:00-21:00', color: '#ff9e3d', bg: '#fff7e6' },
  night: { label: '晚班', time: '18:00-03:00', color: '#722ed1', bg: '#f9f0ff' }
} as const;

export type ShiftKey = keyof typeof SHIFT_CONFIG;
