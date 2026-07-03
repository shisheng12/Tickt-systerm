// 通知服务 - 基于工单数据派生通知 + 模拟实时推送
import type { AppNotification, NotificationType } from '../types';
import { getAllTickets } from './ticketService';
import { getCurrentUser } from './authService';
import dayjs from 'dayjs';

// 内存中的通知存储（按用户隔离）
let notificationsStore: AppNotification[] = [];

// 已生成过的派生通知去重集合（避免重复生成超时/到期通知）
const derivedKeys = new Set<string>();

// 模拟新工单推送的计数器
let mockPushCounter = 0;

// 生成通知ID
function genId(): string {
  return `N${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// 通知类型对应的标题
const TYPE_TITLES: Record<NotificationType, string> = {
  new_ticket: '新工单分配',
  status_change: '工单状态变更',
  overdue: '工单超时预警',
  due_soon: '工单即将到期',
  reassigned: '工单改派',
  comment: '新增处理备注'
};

// 基于工单数据派生通知（超时、即将到期）
async function deriveNotifications(userId: string): Promise<AppNotification[]> {
  const tickets = await getAllTickets();
  const now = dayjs();
  const newNotifications: AppNotification[] = [];

  tickets.forEach(ticket => {
    // 仅对当前用户负责的、未完结的工单生成预警
    if (ticket.assigneeId !== userId) return;
    if (ticket.status === 'resolved' || ticket.status === 'closed') return;
    if (!ticket.dueAt) return;

    const due = dayjs(ticket.dueAt);
    const hoursToDue = due.diff(now, 'hour', true);

    // 已超时
    if (hoursToDue < 0) {
      const key = `overdue_${ticket.id}`;
      if (!derivedKeys.has(key)) {
        derivedKeys.add(key);
        newNotifications.push({
          id: genId(),
          type: 'overdue',
          title: TYPE_TITLES.overdue,
          content: `工单 ${ticket.workOrderNumber}（${ticket.customerName}）已超过处理时限，请尽快处理`,
          ticketId: ticket.id,
          workOrderNumber: ticket.workOrderNumber,
          targetUserId: userId,
          read: false,
          createdAt: now.toISOString()
        });
      }
    }
    // 即将到期（4小时内）
    else if (hoursToDue <= 4) {
      const key = `due_soon_${ticket.id}`;
      if (!derivedKeys.has(key)) {
        derivedKeys.add(key);
        newNotifications.push({
          id: genId(),
          type: 'due_soon',
          title: TYPE_TITLES.due_soon,
          content: `工单 ${ticket.workOrderNumber}（${ticket.customerName}）将在 ${Math.ceil(hoursToDue)} 小时内到期`,
          ticketId: ticket.id,
          workOrderNumber: ticket.workOrderNumber,
          targetUserId: userId,
          read: false,
          createdAt: now.toISOString()
        });
      }
    }
  });

  return newNotifications;
}

// 模拟随机新工单推送（每次轮询有一定概率触发）
function simulateNewTicketPush(userId: string): AppNotification | null {
  // 30% 概率推送一条模拟新工单通知
  if (Math.random() > 0.3) return null;

  mockPushCounter++;
  const mockCustomers = ['王先生', '李女士', '张先生', '陈女士', '刘先生'];
  const mockRequests = ['理赔进度咨询', '退保申请', '保单信息变更', '投诉服务态度', '发票开具'];
  const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
  const request = mockRequests[Math.floor(Math.random() * mockRequests.length)];
  const mockWorkOrder = `WO-SIM-${String(mockPushCounter).padStart(4, '0')}`;

  return {
    id: genId(),
    type: 'new_ticket',
    title: TYPE_TITLES.new_ticket,
    content: `新工单 ${mockWorkOrder}：${customer} - ${request}，已分配给你`,
    workOrderNumber: mockWorkOrder,
    targetUserId: userId,
    read: false,
    createdAt: dayjs().toISOString()
  };
}

// 轮询获取新通知（核心方法）
export async function pollNotifications(): Promise<AppNotification[]> {
  const authUser = getCurrentUser();
  if (!authUser) return [];

  const userId = authUser.user.id;

  // 1. 派生通知（超时、即将到期）
  const derived = await deriveNotifications(userId);

  // 2. 模拟新工单推送
  const mockPush = simulateNewTicketPush(userId);

  const fresh = [...derived];
  if (mockPush) fresh.push(mockPush);

  // 加入存储（最新的在前）
  if (fresh.length > 0) {
    notificationsStore = [...fresh, ...notificationsStore];
  }

  return fresh;
}

// 获取当前用户的所有通知
export function getNotifications(): AppNotification[] {
  const authUser = getCurrentUser();
  if (!authUser) return [];
  return notificationsStore.filter(n => n.targetUserId === authUser.user.id);
}

// 获取未读数量
export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

// 标记单条为已读
export function markAsRead(notificationId: string): void {
  const n = notificationsStore.find(item => item.id === notificationId);
  if (n) n.read = true;
}

// 全部标记为已读
export function markAllAsRead(): void {
  const authUser = getCurrentUser();
  if (!authUser) return;
  notificationsStore.forEach(n => {
    if (n.targetUserId === authUser.user.id) n.read = true;
  });
}

// 清空当前用户的通知
export function clearNotifications(): void {
  const authUser = getCurrentUser();
  if (!authUser) return;
  notificationsStore = notificationsStore.filter(n => n.targetUserId !== authUser.user.id);
}

// 手动添加通知（供其他操作触发，如状态变更、改派时调用）
export function pushNotification(
  type: NotificationType,
  content: string,
  targetUserId: string,
  ticketId?: string,
  workOrderNumber?: string
): void {
  notificationsStore.unshift({
    id: genId(),
    type,
    title: TYPE_TITLES[type],
    content,
    ticketId,
    workOrderNumber,
    targetUserId,
    read: false,
    createdAt: dayjs().toISOString()
  });
}
