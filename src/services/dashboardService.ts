// Dashboard 统计数据服务 - 8卡片+2图表
import type { Ticket, ChannelType } from '../types';
import { getAllTickets } from './ticketService';
import { getUsers } from './roleService';
import { getCurrentUser } from './authService';
import dayjs from 'dayjs';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export interface DashboardQuery {
  startDate?: string;
  endDate?: string;
}

// 8个指标卡
export interface DashboardCards {
  total: number;           // 工单总数
  pending: number;         // 待处理数
  processing: number;      // 处理中数
  resolved: number;        // 已完结数
  pendingTimeout: number;  // 2小时超时预警
  overdue: number;         // 已超时
  special: number;         // 特级工单数
  supervision: number;     // 监管单数
}

// 渠道统计
export interface ChannelStats {
  channel: string;
  total: number;
  pending: number;
  processing: number;
  pendingTimeout: number;
  overdue: number;
}

// 跟进人统计
export interface AssigneeStats {
  name: string;
  userId: string;
  created: number;   // 进单
  resolved: number;  // 完单
  overdue: number;   // 超时
}

export interface DashboardStats {
  cards: DashboardCards;
  channelStats: ChannelStats[];
  assigneeStats: AssigneeStats[];
  suggestions: { type: string; content: string }[];
}

export async function getDashboardStats(query: DashboardQuery = {}): Promise<DashboardStats> {
  await delay();

  const currentAuth = getCurrentUser();
  if (!currentAuth) throw new Error('未登录');

  const { user, role } = currentAuth;
  const allTickets = await getAllTickets();
  const allUsers = await getUsers();

  // 数据权限隔离
  let tickets: Ticket[] = [];
  if (role.id === 'R_ADMIN') {
    tickets = allTickets;
  } else if (role.id === 'R_LEAD') {
    const teamUserIds = allUsers.filter(u => u.team === user.team).map(u => u.id);
    tickets = allTickets.filter(t => t.assigneeId && teamUserIds.includes(t.assigneeId));
  } else if (role.id === 'R_AGENT') {
    tickets = allTickets.filter(t => t.assigneeId === user.id);
  } else {
    throw new Error('当前角色无权访问数据总览');
  }

  // 日期筛选
  if (query.startDate || query.endDate) {
    const start = query.startDate ? dayjs(query.startDate) : null;
    const end = query.endDate ? dayjs(query.endDate) : null;
    tickets = tickets.filter(t => {
      const created = dayjs(t.createdAt);
      if (start && created.isBefore(start, 'day')) return false;
      if (end && created.isAfter(end, 'day')) return false;
      return true;
    });
  }

  const now = dayjs();
  const inTwoHours = now.add(2, 'hour');

  // 8个核心指标
  const pending = tickets.filter(t => t.status === 'pending').length;
  const processing = tickets.filter(t => t.status === 'processing').length;
  const resolved = tickets.filter(t => t.status === 'completed').length;

  // 2小时超时预警：dueAt 在 0-2小时之间
  const pendingTimeout = tickets.filter(t => {
    if (!t.dueAt) return false;
    if (t.status === 'completed') return false;
    const due = dayjs(t.dueAt);
    return due.isAfter(now) && due.isBefore(inTwoHours);
  }).length;

  // 已超时：dueAt 已过且未完结
  const overdue = tickets.filter(t => {
    if (!t.dueAt) return false;
    if (t.status === 'completed') return false;
    return dayjs(t.dueAt).isBefore(now);
  }).length;

  // 特级工单数
  const special = tickets.filter(t => t.complaintLevel === '特急工单').length;

  // 监管单数
  const supervision = tickets.filter(t => t.channel === '监管').length;

  const cards: DashboardCards = {
    total: tickets.length,
    pending,
    processing,
    resolved,
    pendingTimeout,
    overdue,
    special,
    supervision
  };

  // 渠道统计（4个渠道）
  const channelMap = new Map<ChannelType, ChannelStats>();
  const allChannels: ChannelType[] = ['保司', '经纪', '支付', '监管'];

  allChannels.forEach(ch => {
    const list = tickets.filter(t => t.channel === ch);
    channelMap.set(ch, {
      channel: ch,
      total: list.length,
      pending: list.filter(t => t.status === 'pending').length,
      processing: list.filter(t => t.status === 'processing').length,
      pendingTimeout: list.filter(t => {
        if (!t.dueAt) return false;
        if (t.status === 'completed') return false;
        const due = dayjs(t.dueAt);
        return due.isAfter(now) && due.isBefore(inTwoHours);
      }).length,
      overdue: list.filter(t => {
        if (!t.dueAt) return false;
        if (t.status === 'completed') return false;
        return dayjs(t.dueAt).isBefore(now);
      }).length
    });
  });

  // 跟进人统计
  const assigneeMap = new Map<string, { name: string; created: number; resolved: number; overdue: number }>();
  tickets.forEach(t => {
    if (!t.assigneeId) return;
    const userId = t.assigneeId;
    const name = allUsers.find(u => u.id === userId)?.name || userId;
    if (!assigneeMap.has(userId)) {
      assigneeMap.set(userId, { name, created: 0, resolved: 0, overdue: 0 });
    }
    const s = assigneeMap.get(userId)!;
    s.created++;
    if (t.status === 'completed') s.resolved++;
    if (t.dueAt && dayjs(t.dueAt).isBefore(now) && t.status !== 'completed') {
      s.overdue++;
    }
  });

  const assigneeStats: AssigneeStats[] = Array.from(assigneeMap.entries())
    .map(([userId, s]) => ({ userId, ...s }))
    .sort((a, b) => b.created - a.created)
    .slice(0, 10);

  // 智能建议
  const suggestions: { type: string; content: string }[] = [];
  if (overdue > 5) {
    suggestions.push({ type: 'warning', content: `当前有 ${overdue} 个工单已超时，请优先处理` });
  }
  if (pendingTimeout > 0) {
    suggestions.push({ type: 'warning', content: `${pendingTimeout} 个工单将在2小时内超时` });
  }
  if (supervision > 0) {
    suggestions.push({ type: 'info', content: `当前有 ${supervision} 个监管单需特别关注` });
  }
  if (suggestions.length === 0) {
    suggestions.push({ type: 'success', content: '工单处理状况良好' });
  }

  return {
    cards,
    channelStats: Array.from(channelMap.values()),
    assigneeStats,
    suggestions
  };
}