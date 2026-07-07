// 工单服务 - 内存 CRUD 操作
import type { Ticket, TicketQueryParams, PaginatedResult, ProcessLog, Attachment, TicketStatus } from '../types';
import { getInitialData } from '../mock';
import { getCurrentUser, canEditTicket, canProcessTicket } from './authService';
import { pushNotification } from './notificationService';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 内存数据存储
let ticketsStore: Ticket[] = getInitialData().tickets;

// 生成新工单号
function generateWorkOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const maxNum = ticketsStore.reduce((max, t) => {
    const match = t.workOrderNumber.match(/\d{5}$/);
    if (match) {
      const num = parseInt(match[0], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  const nextNum = String(maxNum + 1).padStart(5, '0');
  return `WO${year}${month}${nextNum}`;
}

// 生成新ID
function generateId(): string {
  const maxId = ticketsStore.reduce((max, t) => {
    const num = parseInt(t.id.slice(1), 10);
    return num > max ? num : max;
  }, 0);
  return `T${String(maxId + 1).padStart(4, '0')}`;
}

// 查询工单列表（带筛选、分页）
export async function queryTickets(params: TicketQueryParams = {}): Promise<PaginatedResult<Ticket>> {
  await delay();

  const {
    keyword,
    status,
    priority,
    channel,
    complaintLevel,
    phone,
    hasContacted,
    assigneeId,
    source,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params;

  let filtered = [...ticketsStore];

  // 关键词搜索
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(t =>
      t.workOrderNumber.toLowerCase().includes(kw) ||
      t.customerName.toLowerCase().includes(kw) ||
      t.customerRequest.toLowerCase().includes(kw) ||
      t.policyNumber.toLowerCase().includes(kw) ||
      (t.internalOrderNumber && t.internalOrderNumber.toLowerCase().includes(kw))
    );
  }

  // 电话筛选
  if (phone) {
    filtered = filtered.filter(t => t.phone && t.phone.includes(phone));
  }

  // 状态筛选（支持虚拟状态）
  if (status) {
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (status === 'pending_timeout') {
      filtered = filtered.filter(t => {
        if (!t.dueAt) return false;
        if (t.status === 'completed') return false;
        const due = new Date(t.dueAt);
        return due > now && due < inTwoHours;
      });
    } else if (status === 'overdue') {
      filtered = filtered.filter(t => {
        if (!t.dueAt) return false;
        if (t.status === 'completed') return false;
        return new Date(t.dueAt) < now;
      });
    } else if (status === 'processing') {
      // 处理中：包含 processing
      filtered = filtered.filter(t => t.status === 'processing');
    } else if (status === 'completed') {
      // 已完结：包含 completed
      filtered = filtered.filter(t => t.status === 'completed');
    } else {
      filtered = filtered.filter(t => t.status === status);
    }
  }

  // 优先级筛选
  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }

  // 投诉等级筛选
  if (complaintLevel) {
    filtered = filtered.filter(t => t.complaintLevel === complaintLevel);
  }

  // 渠道筛选
  if (channel) {
    filtered = filtered.filter(t => t.channel === channel);
  }

  // 客户是否曾进线
  if (hasContacted !== undefined && hasContacted !== '') {
    const contacted = hasContacted === 'true';
    filtered = filtered.filter(t => t.hasContacted === contacted);
  }

  // 责任人筛选
  if (assigneeId) {
    if (assigneeId === 'unassigned') {
      filtered = filtered.filter(t => !t.assigneeId);
    } else {
      filtered = filtered.filter(t => t.assigneeId === assigneeId);
    }
  }

  // 来源筛选
  if (source) {
    filtered = filtered.filter(t => t.source === source);
  }

  // 时间范围筛选
  if (startDate) {
    filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(startDate));
  }
  if (endDate) {
    filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(endDate));
  }

  // 排序
  filtered.sort((a, b) => {
    let aVal: any = a[sortBy];
    let bVal: any = b[sortBy];

    // 处理 null 值
    if (aVal === null) aVal = '';
    if (bVal === null) bVal = '';

    // 优先级特殊处理：urgent > high > medium > low
    if (sortBy === 'priority') {
      const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      aVal = priorityOrder[aVal] || 0;
      bVal = priorityOrder[bVal] || 0;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  // 分页
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = filtered.slice(start, end);

  return {
    data,
    total,
    page,
    pageSize
  };
}

// 获取单个工单详情
export async function getTicket(id: string): Promise<Ticket | null> {
  await delay();
  return ticketsStore.find(t => t.id === id) || null;
}

// 创建工单
export async function createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const now = new Date().toISOString();

  // 根据投诉等级自动设置跟进要求
  const complaintLevel = ticketData.complaintLevel || '一般工单';
  const followUpMap: Record<string, { frequency: string; firstResponse: string }> = {
    '一般工单': { frequency: '至少3天1次', firstResponse: '分派后4小时内触达' },
    '紧急工单': { frequency: '至少1天1次', firstResponse: '分派后2小时内触达' },
    '加急工单': { frequency: '至少1天2次', firstResponse: '分派后1小时内触达' },
    '特急工单': { frequency: '至少一天2次', firstResponse: '分派后30分钟内触达' }
  };
  const followUpReqs = followUpMap[complaintLevel];

  const newTicket: Ticket = {
    id: generateId(),
    workOrderNumber: generateWorkOrderNumber(),
    feedbackTime: ticketData.feedbackTime || now,
    project: ticketData.project || '',
    brokerageEntity: ticketData.brokerageEntity || '',
    paymentChannel: ticketData.paymentChannel || '',
    internalOrderNumber: ticketData.internalOrderNumber,
    policyNumber: ticketData.policyNumber || '',
    customerName: ticketData.customerName || '',
    phone: ticketData.phone || '',
    customerRequest: ticketData.customerRequest || '',
    nuclearBodyStatus: ticketData.nuclearBodyStatus || '否',
    category: ticketData.category || '',
    processingResult: '',
    contactCount: 0,
    nextContactTime: null,
    completionTime: null,
    completionStatus: '',
    follower: '',
    source: ticketData.source || 'manual',
    channel: ticketData.channel || '保司',
    priority: ticketData.priority || 'medium',
    status: 'pending',
    createdAt: now,
    submitterName: ticketData.submitterName || currentUser.user.name,
    complaintLevel,
    followUpFrequency: followUpReqs.frequency,
    firstResponseRequirement: followUpReqs.firstResponse,

    // 系统字段
    assigneeId: null,
    updatedAt: now,
    resolvedAt: null,
    dueAt: ticketData.dueAt || null,
    processLogs: [
      {
        id: `L${Date.now()}_001`,
        operatorId: currentUser.user.id,
        action: 'create',
        remark: '工单创建',
        at: now
      }
    ],
    attachments: []
  };

  ticketsStore.push(newTicket);
  return newTicket;
}

// 更新工单基本信息
export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
  await delay();

  const ticket = ticketsStore.find(t => t.id === id);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  if (!canEditTicket(ticket.assigneeId)) {
    throw new Error('无权限编辑此工单');
  }

  const now = new Date().toISOString();
  Object.assign(ticket, updates, { updatedAt: now });

  return ticket;
}

// 分配责任人
export async function assignTicket(id: string, assigneeId: string, remark: string = ''): Promise<Ticket> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const ticket = ticketsStore.find(t => t.id === id);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  const now = new Date().toISOString();
  ticket.assigneeId = assigneeId;
  ticket.updatedAt = now;

  // 如果当前是 pending 状态，自动变更为 processing
  if (ticket.status === 'pending') {
    ticket.status = 'processing';
  }

  // 添加处理记录
  ticket.processLogs.push({
    id: `L${Date.now()}_${ticket.processLogs.length + 1}`,
    operatorId: currentUser.user.id,
    action: 'assign',
    from: ticket.status,
    to: 'processing',
    remark: remark || `分配给责任人`,
    at: now
  });

  // 推送通知给新责任人（改派或首次分配）
  if (assigneeId && assigneeId !== currentUser.user.id) {
    pushNotification(
      'reassigned',
      `工单 ${ticket.workOrderNumber}（${ticket.customerName} - ${ticket.category}）已分配给你，请及时处理`,
      assigneeId,
      ticket.id,
      ticket.workOrderNumber
    );
  }

  return ticket;
}

// 变更工单状态
export async function changeTicketStatus(
  id: string,
  newStatus: TicketStatus,
  remark: string = ''
): Promise<Ticket> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const ticket = ticketsStore.find(t => t.id === id);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  if (!canProcessTicket(ticket.assigneeId)) {
    throw new Error('无权限处理此工单');
  }

  // 状态流转校验（核心5状态）
  const validTransitions: Record<TicketStatus, TicketStatus[]> = {
    pending: ['processing', 'pending_timeout', 'overdue', 'completed'],
    processing: ['pending_timeout', 'overdue', 'completed'],
    pending_timeout: ['processing', 'overdue', 'completed'],
    overdue: ['processing', 'completed'],
    completed: []
  };

  if (!validTransitions[ticket.status]?.includes(newStatus)) {
    throw new Error(`不允许从 ${ticket.status} 变更为 ${newStatus}`);
  }

  const now = new Date().toISOString();
  const oldStatus = ticket.status;
  ticket.status = newStatus;
  ticket.updatedAt = now;

  // 如果是已完成，记录解决时间
  if (newStatus === 'completed' && !ticket.resolvedAt) {
    ticket.resolvedAt = now;
  }

  // 添加处理记录
  ticket.processLogs.push({
    id: `L${Date.now()}_${ticket.processLogs.length + 1}`,
    operatorId: currentUser.user.id,
    action: 'status_change',
    from: oldStatus,
    to: newStatus,
    remark: remark || `状态变更`,
    at: now
  });

  // 状态变更通知责任人（若非本人操作）
  if (ticket.assigneeId && ticket.assigneeId !== currentUser.user.id) {
    pushNotification(
      'status_change',
      `工单 ${ticket.workOrderNumber} 状态已变更为「${newStatus}」`,
      ticket.assigneeId,
      ticket.id,
      ticket.workOrderNumber
    );
  }

  return ticket;
}

// 上传处理材料（模拟）
export async function uploadAttachment(
  ticketId: string,
  file: { name: string; type: string }
): Promise<Ticket> {
  await delay(500);

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const ticket = ticketsStore.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  if (!canProcessTicket(ticket.assigneeId)) {
    throw new Error('无权限处理此工单');
  }

  const now = new Date().toISOString();
  const attachment: Attachment = {
    id: `F${Date.now()}`,
    name: file.name,
    type: file.type,
    url: `mock://files/${Date.now()}`
  };

  ticket.attachments.push(attachment);
  ticket.updatedAt = now;

  // 添加处理记录
  ticket.processLogs.push({
    id: `L${Date.now()}_${ticket.processLogs.length + 1}`,
    operatorId: currentUser.user.id,
    action: 'upload',
    remark: `上传附件：${file.name}`,
    at: now
  });

  // TODO: 接入真实文件上传服务（OSS/S3等）

  return ticket;
}

// 添加处理备注（支持上传材料 + 联系次数+1）
export async function addComment(
  ticketId: string,
  comment: string,
  attachments?: Attachment[]
): Promise<Ticket> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const ticket = ticketsStore.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  if (!canProcessTicket(ticket.assigneeId)) {
    throw new Error('无权限处理此工单');
  }

  const now = new Date().toISOString();
  ticket.updatedAt = now;

  // 添加处理记录（含材料和操作人信息）
  ticket.processLogs.push({
    id: `L${Date.now()}_${ticket.processLogs.length + 1}`,
    operatorId: currentUser.user.id,
    operatorName: currentUser.user.name,
    operatorAvatar: currentUser.user.name.charAt(0),
    action: 'comment',
    remark: comment,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
    at: now
  });

  // 联系次数 +1
  ticket.contactCount = (ticket.contactCount || 0) + 1;

  // 处理结果同步为最新备注
  ticket.processingResult = comment;

  // 更新跟进人为当前操作人
  ticket.follower = currentUser.user.name;

  // 如果当前是 pending 状态，自动转为 processing
  if (ticket.status === 'pending') {
    ticket.status = 'processing';
  }

  return ticket;
}

// 批量分配工单（一对一、多对一）
export async function batchAssign(ticketIds: string[], assigneeId: string): Promise<void> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  if (!currentUser.role.permissions.includes('ticket.assign')) {
    throw new Error('无分配权限');
  }

  const tickets = ticketIds.map(id => ticketsStore.find(t => t.id === id)).filter(Boolean) as Ticket[];

  if (tickets.length === 0) {
    throw new Error('未选择工单');
  }

  const now = new Date().toISOString();
  tickets.forEach(ticket => {
    const oldAssignee = ticket.assigneeId;
    ticket.assigneeId = assigneeId;
    ticket.updatedAt = now;
    if (ticket.status === 'pending') {
      ticket.status = 'processing';
    }

    // 添加处理记录
    ticket.processLogs.push({
      id: `L${Date.now()}_${ticket.id}_${Math.random().toString(36).slice(2, 6)}`,
      operatorId: currentUser.user.id,
      operatorName: currentUser.user.name,
      action: 'assign',
      from: oldAssignee || 'unassigned',
      to: assigneeId,
      remark: `分配给${ticket.follower || '责任人'}`,
      at: now
    });

    // 推送通知
    pushNotification(
      'reassigned',
      `工单 ${ticket.workOrderNumber} 已分配给你`,
      assigneeId,
      ticket.id,
      ticket.workOrderNumber
    );
  });
}

// 完结工单（带完结类型）
export async function resolveTicket(
  ticketId: string,
  resolutionType: string,
  remark: string
): Promise<Ticket> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const ticket = ticketsStore.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  if (!canProcessTicket(ticket.assigneeId)) {
    throw new Error('无权限处理此工单');
  }

  const now = new Date().toISOString();

  // 更新状态
  ticket.status = 'completed';
  ticket.completionTime = now;
  ticket.completionStatus = resolutionType;
  ticket.resolvedAt = now;
  ticket.processingResult = remark;
  ticket.updatedAt = now;

  // 添加处理记录
  ticket.processLogs.push({
    id: `L${Date.now()}_${ticket.processLogs.length + 1}`,
    operatorId: currentUser.user.id,
    operatorName: currentUser.user.name,
    operatorAvatar: currentUser.user.name.charAt(0),
    action: 'resolve',
    from: ticket.status,
    to: 'completed',
    remark: `完结类型：${resolutionType}。${remark}`,
    at: now
  });

  return ticket;
}

// 设置下次联系时间
export async function setNextContactTime(ticketId: string, nextContactTime: string): Promise<Ticket> {
  await delay();

  const ticket = ticketsStore.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  ticket.nextContactTime = nextContactTime;
  ticket.updatedAt = new Date().toISOString();

  return ticket;
}

// 设置处理时限
export async function setDueDate(ticketId: string, dueAt: string): Promise<Ticket> {
  await delay();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('未登录');
  }

  const ticket = ticketsStore.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('工单不存在');
  }

  if (!canProcessTicket(ticket.assigneeId)) {
    throw new Error('无权限处理此工单');
  }

  const now = new Date().toISOString();
  ticket.dueAt = dueAt;
  ticket.updatedAt = now;

  // 添加处理记录
  ticket.processLogs.push({
    id: `L${Date.now()}_${ticket.processLogs.length + 1}`,
    operatorId: currentUser.user.id,
    action: 'comment',
    remark: `设置处理时限：${dueAt}`,
    at: now
  });

  return ticket;
}

// 获取所有工单（用于统计）
export async function getAllTickets(): Promise<Ticket[]> {
  await delay(100);
  return [...ticketsStore];
}

// 重置数据（用于测试）
export function resetTickets(): void {
  ticketsStore = getInitialData().tickets;
}
