// Dashboard 统计数据服务（优化版：数据权限隔离 + 环比 + 实用图表）
import type { Ticket, TicketStatus, Priority } from '../types';
import { getAllTickets } from './ticketService';
import { getUsers } from './roleService';
import { getCurrentUser } from './authService';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

// 延迟模拟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 统计查询参数（仅保留日期筛选）
export interface DashboardQuery {
  startDate?: string; // ISO date string
  endDate?: string;
}

// 指标卡数据（带环比）
export interface MetricCard {
  value: number;
  label: string;
  trend?: number; // 环比变化百分比，正数上升、负数下降
  status?: TicketStatus; // 用于跳转时传递筛选条件
}

// 紧急待处理工单
export interface UrgentTicket {
  id: string;
  workOrderNumber: string;
  customerName: string;
  category: string;
  priority: Priority;
  dueAt: string | null;
  overdueDays: number; // 正数=已超时天数，负数=距超时天数
}

// 责任人负载 + 超时率
export interface AssigneeLoad {
  assigneeId: string;
  assigneeName: string;
  inProgress: number;   // 处理中
  overdue: number;      // 超时数
  overdueRate: number;  // 超时率（百分比）
}

// 趋势数据（近7天）
export interface TrendData {
  date: string; // YYYY-MM-DD
  created: number;
  resolved: number;
}

// 智能建议
export interface Suggestion {
  type: 'warning' | 'info' | 'success';
  content: string;
}

// 综合统计结果
export interface DashboardStats {
  cards: MetricCard[];
  urgentTickets: UrgentTicket[];
  assigneeLoad: AssigneeLoad[];
  trendData: TrendData[];
  suggestions: Suggestion[];
}

// 获取 Dashboard 统计数据（带权限隔离）
export async function getDashboardStats(query: DashboardQuery = {}): Promise<DashboardStats> {
  await delay();

  const currentAuth = getCurrentUser();
  if (!currentAuth) {
    throw new Error('未登录');
  }

  const { user, role } = currentAuth;
  const allTickets = await getAllTickets();
  const allUsers = await getUsers();

  // 数据权限隔离
  let tickets: Ticket[] = [];
  if (role.id === 'R_ADMIN') {
    // 管理员：看全部
    tickets = allTickets;
  } else if (role.id === 'R_LEAD') {
    // 主管：看本 team 客服负责的工单
    const teamUserIds = allUsers.filter(u => u.team === user.team).map(u => u.id);
    tickets = allTickets.filter(t => t.assigneeId && teamUserIds.includes(t.assigneeId));
  } else if (role.id === 'R_AGENT') {
    // 专员：只看自己负责的
    tickets = allTickets.filter(t => t.assigneeId === user.id);
  } else {
    // 其他角色（只读观察）无权访问
    throw new Error('当前角色无权访问数据总览');
  }

  // 日期范围筛选
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
  const total = tickets.length;

  // 统计各状态工单数
  const pending = tickets.filter(t => t.status === 'pending').length;
  const processing = tickets.filter(
    t => t.status === 'processing' || t.status === 'assigned'
  ).length;
  const resolved = tickets.filter(
    t => t.status === 'resolved' || t.status === 'closed'
  ).length;
  const overdue = tickets.filter(
    t => t.dueAt && dayjs(t.dueAt).isBefore(now) && t.status !== 'resolved' && t.status !== 'closed'
  ).length;

  // 环比计算（与上周期对比）
  const periodDays = query.startDate && query.endDate
    ? dayjs(query.endDate).diff(dayjs(query.startDate), 'day') + 1
    : 7; // 默认7天
  const prevStart = now.subtract(periodDays * 2, 'day');
  const prevEnd = now.subtract(periodDays, 'day');

  // 根据权限隔离同样筛选上周期数据
  let prevTickets = allTickets.filter(t => {
    const created = dayjs(t.createdAt);
    return created.isBetween(prevStart, prevEnd, 'day', '[]');
  });
  if (role.id === 'R_LEAD') {
    const teamUserIds = allUsers.filter(u => u.team === user.team).map(u => u.id);
    prevTickets = prevTickets.filter(t => t.assigneeId && teamUserIds.includes(t.assigneeId));
  } else if (role.id === 'R_AGENT') {
    prevTickets = prevTickets.filter(t => t.assigneeId === user.id);
  }

  const prevTotal = prevTickets.length;
  const prevPending = prevTickets.filter(t => t.status === 'pending').length;
  const prevProcessing = prevTickets.filter(
    t => t.status === 'processing' || t.status === 'assigned'
  ).length;
  const prevResolved = prevTickets.filter(
    t => t.status === 'resolved' || t.status === 'closed'
  ).length;

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // 指标卡片
  const cards: MetricCard[] = [
    { value: total, label: '工单总数', trend: calcTrend(total, prevTotal) },
    { value: pending, label: '待处理', trend: calcTrend(pending, prevPending), status: 'pending' },
    {
      value: processing,
      label: '处理中',
      trend: calcTrend(processing, prevProcessing),
      status: 'processing'
    },
    { value: resolved, label: '已完结', trend: calcTrend(resolved, prevResolved), status: 'resolved' },
    { value: overdue, label: '超时预警', trend: calcTrend(overdue, 0) }
  ];

  // 紧急待处理工单（高优先级或临近超时，未完结）
  const urgentTickets: UrgentTicket[] = tickets
    .filter(
      t =>
        (t.priority === 'urgent' || t.priority === 'high') &&
        t.status !== 'resolved' &&
        t.status !== 'closed'
    )
    .map(t => {
      const overdueDays = t.dueAt ? dayjs(now).diff(dayjs(t.dueAt), 'day') : 0;
      return {
        id: t.id,
        workOrderNumber: t.workOrderNumber,
        customerName: t.customerName,
        category: t.category,
        priority: t.priority,
        dueAt: t.dueAt,
        overdueDays
      };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays)
    .slice(0, 10);

  // 责任人负载 + 超时率
  const assigneeMap = new Map<string, { inProgress: number; overdue: number }>();
  tickets.forEach(t => {
    if (!t.assigneeId) return;
    if (t.status === 'processing' || t.status === 'assigned') {
      if (!assigneeMap.has(t.assigneeId)) {
        assigneeMap.set(t.assigneeId, { inProgress: 0, overdue: 0 });
      }
      const stats = assigneeMap.get(t.assigneeId)!;
      stats.inProgress++;
      if (t.dueAt && dayjs(t.dueAt).isBefore(now)) {
        stats.overdue++;
      }
    }
  });

  const assigneeLoad: AssigneeLoad[] = Array.from(assigneeMap.entries())
    .map(([assigneeId, stats]) => ({
      assigneeId,
      assigneeName: allUsers.find(u => u.id === assigneeId)?.name || assigneeId,
      inProgress: stats.inProgress,
      overdue: stats.overdue,
      overdueRate: stats.inProgress > 0 ? Math.round((stats.overdue / stats.inProgress) * 100) : 0
    }))
    .sort((a, b) => b.overdueRate - a.overdueRate || b.inProgress - a.inProgress)
    .slice(0, 8);

  // 趋势数据（近7天）
  const trendData: TrendData[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = now.subtract(i, 'day').format('YYYY-MM-DD');
    const created = tickets.filter(t => dayjs(t.createdAt).format('YYYY-MM-DD') === date).length;
    const resolved = tickets.filter(
      t => t.resolvedAt && dayjs(t.resolvedAt).format('YYYY-MM-DD') === date
    ).length;
    trendData.push({ date, created, resolved });
  }

  // 智能建议
  const suggestions: Suggestion[] = [];
  if (overdue > 5) {
    suggestions.push({
      type: 'warning',
      content: `当前有 ${overdue} 个工单超时未完结，建议优先处理高优先级工单或调配人力`
    });
  }
  if (pending > processing * 2) {
    suggestions.push({
      type: 'warning',
      content: `待处理工单积压（${pending} 个），建议及时分配责任人`
    });
  }
  const highOverdueAgent = assigneeLoad.find(a => a.overdueRate > 50);
  if (highOverdueAgent) {
    suggestions.push({
      type: 'info',
      content: `${highOverdueAgent.assigneeName} 超时率较高（${highOverdueAgent.overdueRate}%），建议协调资源或培训支持`
    });
  }
  const avgCreatedLast3Days = trendData.slice(-3).reduce((sum, d) => sum + d.created, 0) / 3;
  const avgResolvedLast3Days = trendData.slice(-3).reduce((sum, d) => sum + d.resolved, 0) / 3;
  if (avgCreatedLast3Days > avgResolvedLast3Days * 1.5) {
    suggestions.push({
      type: 'warning',
      content: '近3天进单速度明显快于处理速度，注意人力储备和排班安排'
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'success',
      content: '工单处理状况良好，保持当前节奏'
    });
  }

  return {
    cards,
    urgentTickets,
    assigneeLoad,
    trendData,
    suggestions
  };
}
