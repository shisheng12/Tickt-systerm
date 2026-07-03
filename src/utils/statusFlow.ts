// 工单状态流转规则 - 集中封装（对应需求文档第5节）
// 便于后续替换为真实后端校验逻辑
import type { TicketStatus } from '../types';

// 合法的状态流转映射表
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  pending: ['assigned'],
  assigned: ['processing'],
  processing: ['pending_confirm', 'resolved'],
  pending_confirm: ['resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['processing']
};

// 状态显示配置
export const STATUS_META: Record<TicketStatus, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'default' },
  assigned: { text: '已分配', color: 'blue' },
  processing: { text: '处理中', color: 'orange' },
  pending_confirm: { text: '待确认', color: 'purple' },
  resolved: { text: '已解决', color: 'green' },
  closed: { text: '已关闭', color: 'default' },
  reopened: { text: '重新打开', color: 'red' }
};

// 获取某状态下可流转到的下一步状态列表
export function getNextStatuses(current: TicketStatus): TicketStatus[] {
  return STATUS_TRANSITIONS[current] || [];
}

// 校验流转是否合法
export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// 状态动作的中文描述（用于按钮文案）
export const TRANSITION_LABELS: Partial<Record<TicketStatus, string>> = {
  assigned: '分配',
  processing: '开始处理',
  pending_confirm: '提交待确认',
  resolved: '标记已解决',
  closed: '关闭工单',
  reopened: '重新打开'
};

// 判断状态是否为"终态"（已解决/已关闭）
export function isFinalStatus(status: TicketStatus): boolean {
  return status === 'resolved' || status === 'closed';
}

// 校验解决/关闭前是否满足材料要求（弱校验，仅提示）
// 需求文档第5节：resolved/closed 需要至少一条处理记录或一个附件
export function checkResolveRequirement(
  logsCount: number,
  attachmentsCount: number
): { ok: boolean; message?: string } {
  if (logsCount <= 1 && attachmentsCount === 0) {
    return {
      ok: false,
      message: '建议先添加处理记录或上传处理材料，再标记为已解决/已关闭'
    };
  }
  return { ok: true };
}
