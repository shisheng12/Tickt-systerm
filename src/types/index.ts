// 类型定义文件 - 全面优化版本

// 工单来源
export type TicketSource = 'feishu_form' | 'manual' | 'community';

// 优先级
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// 工单处理状态（核心6状态 + 2个虚拟状态）
export type TicketStatus =
  | 'pending'           // 待处理
  | 'assigned'          // 已分配
  | 'processing'        // 处理中
  | 'pending_confirm'   // 待确认
  | 'resolved'          // 已解决
  | 'closed'            // 已关闭
  | 'reopened'          // 重新打开
  | 'pending_timeout';  // 虚拟状态：待超时（2小时内）

// Dashboard筛选用的状态枚举（含虚拟状态）
export type DashboardStatusFilter =
  | 'pending'
  | 'processing'
  | 'resolved'
  | 'pending_timeout'
  | 'overdue';

// 完结状态（处理完结弹窗选项）
export type CompletionStatus =
  | '正常完结'
  | '冷处理'
  | '联系不上'
  | '未取得有效联系'
  | '已达成一致'
  | '诉求过高，无法达成一致';

// 班次类型
export type ShiftType = 'day' | 'mid' | 'night';

// 渠道类型（5种）
export type ChannelType =
  | '保司'        // 保司渠道
  | '经纪'        // 经纪主体
  | '支付'        // 支付渠道
  | '监管'        // 监管渠道
  | '内部工单'
  | '客户反馈'
  | '其它';

// 导出文件格式
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

// 处理记录操作类型
export type ProcessAction =
  | 'create'
  | 'assign'
  | 'status_change'
  | 'comment'      // 添加处理备注（每次联系次数+1）
  | 'upload'       // 上传材料
  | 'export'
  | 'resolve';     // 确认完结

// 权限点
export type Permission =
  | 'dashboard.view'
  | 'ticket.view'
  | 'ticket.create'
  | 'ticket.edit'
  | 'ticket.process'
  | 'ticket.assign'
  | 'ticket.export'
  | 'perm.manage'
  | 'schedule.manage';

// 投诉等级（基于投诉表样版）
export type ComplaintLevel = '一般工单' | '紧急工单' | '加急工单' | '特急工单';

// 附件
export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

// 处理记录
export interface ProcessLog {
  id: string;
  operatorId: string;
  operatorName?: string;    // 操作人姓名（冗余存储，避免每次查表）
  operatorAvatar?: string;   // 操作人头像
  action: ProcessAction;
  from?: string;
  to?: string;
  remark: string;
  attachments?: Attachment[]; // 处理时上传的材料
  at: string;
}

// 工单（完整字段）
export interface Ticket {
  id: string;
  workOrderNumber: string;               // 工单号

  // 反馈信息
  feedbackTime: string;                  // 反馈时间
  source: TicketSource;                  // 来源（feishu_form/manual/community）
  channel: ChannelType;                  // 反馈渠道（保司/经纪/支付/监管/内部/客户/其它）

  // 业务信息
  project: string;                       // 项目（保司）
  brokerageEntity: string;               // 经纪主体
  paymentChannel: string;                // 支付渠道
  internalOrderNumber?: string;          // 内部订单号（非必填）
  policyNumber: string;                  // 保单号
  userComplaintChannel: string;          // 用户投诉渠道（手动填写）

  // 客户信息
  customerName: string;                  // 客户姓名
  phone: string;                         // 客户电话（投保人）
  contactPhone?: string;                 // 联系人电话
  customerRequest: string;               // 客户诉求
  nuclearBodyStatus: string;             // 保司侧是否核身

  // 分类信息
  category: string;                      // 客诉类别
  complaintLevel: ComplaintLevel;        // 投诉等级
  followUpFrequency: string;             // 跟进频次要求
  firstResponseRequirement: string;      // 首响要求

  // 处理信息
  priority: Priority;                    // 优先级
  status: TicketStatus;                  // 处理状态
  processingResult: string;              // 处理结果（最后一条）
  contactCount: number;                  // 联系次数（处理操作次数）
  nextContactTime: string | null;        // 下次联系时间
  completionTime: string | null;         // 完结时间
  completionStatus: string;              // 完结状态
  follower: string;                      // 跟进人（最后一个）

  // 用户信息
  creator: string;                       // 创建人（外部填写的默认为外部）
  creatorName: string;                   // 创建人姓名
  submitterName: string;                 // 提交人

  // 客户进线信息
  hasContacted: boolean;                 // 客户是否曾进线
  contactId?: string;                    // 进线ID

  // 系统字段
  assigneeId: string | null;             // 责任人ID
  dueAt: string | null;                  // 到期时间
  createdAt: string;                     // 创建时间
  updatedAt: string;                     // 更新时间
  resolvedAt: string | null;             // 解决时间
  processLogs: ProcessLog[];             // 处理记录
  attachments: Attachment[];             // 附件
}

// 用户
export interface User {
  id: string;
  name: string;
  roleId: string;
  email: string;
  active: boolean;
  team: string;
}

// 角色
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

// 排班
export interface Schedule {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  channel: string;
  remark: string;
}

// 社群渠道（保留兼容）
export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  feishuChatId: string;
  exportFormat: ExportFormat;
}

// 登录用户上下文
export interface AuthUser {
  user: User;
  role: Role;
}

// 查询筛选条件
export interface TicketQueryParams {
  keyword?: string;
  status?: TicketStatus | 'pending_timeout' | 'overdue'; // 支持虚拟状态
  priority?: Priority;
  channel?: ChannelType;
  complaintLevel?: string;
  phone?: string;
  hasContacted?: string;
  assigneeId?: string;
  source?: TicketSource;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'priority' | 'dueAt';
  sortOrder?: 'asc' | 'desc';
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 定时导出策略
export interface ExportStrategy {
  id: string;
  channelId: string;
  frequency: 'daily' | 'weekly';
  time: string;
  format: ExportFormat;
  enabled: boolean;
}

// 通知类型
export type NotificationType =
  | 'new_ticket'      // 新工单分配
  | 'status_change'   // 工单状态变更
  | 'overdue'         // 工单超时预警
  | 'due_soon'        // 工单即将到期
  | 'reassigned'      // 工单改派
  | 'comment';        // 新增处理备注

// 通知
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  ticketId?: string;
  workOrderNumber?: string;
  targetUserId: string;
  read: boolean;
  createdAt: string;
}

// 列配置（个性化显示/隐藏和排序）
export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
}
