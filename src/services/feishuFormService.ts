// 飞书进单服务（模拟）
// Demo 用假数据模拟飞书收集表单进单，真实接入点已用 TODO 标注
import type { Ticket, Priority } from '../types';
import { createTicket } from './ticketService';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 飞书表单提交的字段（对应仿飞书收集表单）
export interface FeishuFormPayload {
  submitterName: string;   // 提交人
  channel: string;         // 社群/渠道
  category: string;        // 问题分类
  customerName: string;    // 客户姓名
  phone: string;           // 客户手机号
  customerRequest: string; // 问题描述
  priority: Priority;      // 优先级
  project?: string;        // 项目（保司）
}

// 模拟接收一条飞书表单进单，生成来源为 feishu_form 的工单
export async function receive(payload: FeishuFormPayload): Promise<Ticket> {
  await delay(500);

  // TODO: 接入真实飞书 API —— 通过收集表单事件订阅(webhook) 或长连接接收进单
  // 真实实现时，这里应解析飞书回调的表单数据，映射为工单字段

  const ticket = await createTicket({
    source: 'feishu_form',
    submitterName: payload.submitterName,
    channel: payload.channel,
    category: payload.category,
    customerName: payload.customerName,
    phone: payload.phone,
    customerRequest: payload.customerRequest,
    priority: payload.priority,
    project: payload.project || '',
  });

  return ticket;
}

// 随机生成一条模拟表单数据（用于「一键模拟进单」快速演示）
export function randomFormData(): FeishuFormPayload {
  const submitters = ['外部用户-王磊', '外部用户-李娜', '外部用户-张伟', '外部用户-刘洋'];
  const customers = ['陈仕胜', '黄晓明', '周雅琴', '林志强', '吴敏'];
  const requests = [
    '要求退保并退还全部保费',
    '咨询理赔进度，已提交材料一周未回复',
    '投诉销售人员误导，要求处理',
    '保单信息填写有误，申请更正',
    '对扣费有异议，要求说明',
  ];
  const categories = ['监管投诉-引导性', '理赔咨询', '退保申请', '保单变更', '投诉-服务态度'];
  const channels = ['暖哇客户群', 'VIP客户群A', '客户反馈专线'];
  const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  const projects = ['融盛', '泰康', '平安', '太保'];

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  return {
    submitterName: pick(submitters),
    channel: pick(channels),
    category: pick(categories),
    customerName: pick(customers),
    phone: `1${Math.floor(Math.random() * 9 + 3)}${String(Math.floor(Math.random() * 1e8)).padStart(9, '0')}`,
    customerRequest: pick(requests),
    priority: pick(priorities),
    project: pick(projects),
  };
}
