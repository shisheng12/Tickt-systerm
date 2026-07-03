// 定时导出策略服务（模拟）
// Demo 用假数据模拟"每个社群 + 频率 + 时间 + 格式"的定时导出策略
// 真实定时任务与飞书推送接入点已用 TODO 标注
import type { ExportStrategy, Ticket } from '../types';
import { getInitialData } from '../mock';
import { getChannels } from './channelService';
import { getAllTickets } from './ticketService';
import { exportTicketsByFormat } from '../utils/exportUtil';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 生成初始策略：为每个社群按其 exportFormat 建一条默认策略
function buildInitialStrategies(): ExportStrategy[] {
  const { channels } = getInitialData();
  return channels.map((c, idx) => ({
    id: `ES${String(idx + 1).padStart(3, '0')}`,
    channelId: c.id,
    frequency: idx % 2 === 0 ? 'daily' : 'weekly',
    time: idx % 2 === 0 ? '18:00' : '09:00',
    format: c.exportFormat,
    enabled: idx % 3 !== 0, // 部分默认启用
  }));
}

// 内存存储
let strategiesStore: ExportStrategy[] = buildInitialStrategies();

// 生成新 ID
function generateId(): string {
  const maxId = strategiesStore.reduce((max, s) => {
    const num = parseInt(s.id.slice(2), 10);
    return num > max ? num : max;
  }, 0);
  return `ES${String(maxId + 1).padStart(3, '0')}`;
}

// 获取所有策略
export async function getExportStrategies(): Promise<ExportStrategy[]> {
  await delay();
  return [...strategiesStore];
}

// 创建策略
export async function createExportStrategy(
  data: Omit<ExportStrategy, 'id'>
): Promise<ExportStrategy> {
  await delay();
  const strategy: ExportStrategy = { id: generateId(), ...data };
  strategiesStore.push(strategy);
  return strategy;
}

// 更新策略
export async function updateExportStrategy(
  id: string,
  updates: Partial<ExportStrategy>
): Promise<ExportStrategy> {
  await delay();
  const strategy = strategiesStore.find(s => s.id === id);
  if (!strategy) {
    throw new Error('策略不存在');
  }
  Object.assign(strategy, updates);
  return strategy;
}

// 删除策略
export async function deleteExportStrategy(id: string): Promise<void> {
  await delay();
  const idx = strategiesStore.findIndex(s => s.id === id);
  if (idx === -1) {
    throw new Error('策略不存在');
  }
  strategiesStore.splice(idx, 1);
}

// 切换启用状态
export async function toggleExportStrategy(id: string, enabled: boolean): Promise<ExportStrategy> {
  return updateExportStrategy(id, { enabled });
}

// 立即执行一条策略（模拟触发导出 + 推送到社群）
export interface ExecuteResult {
  filename: string;
  channelName: string;
  format: string;
  ticketCount: number;
}

export async function executeStrategyNow(id: string): Promise<ExecuteResult> {
  await delay(500);

  const strategy = strategiesStore.find(s => s.id === id);
  if (!strategy) {
    throw new Error('策略不存在');
  }

  const channels = await getChannels();
  const channel = channels.find(c => c.id === strategy.channelId);
  if (!channel) {
    throw new Error('社群不存在');
  }

  // 取该社群的工单
  const allTickets = await getAllTickets();
  const channelTickets: Ticket[] = allTickets.filter(t => t.channel === channel.name);

  // 按社群配置的格式导出（体现"不同格式文件对应社群"）
  const baseName = `${channel.name}_工单导出`;
  const filename = exportTicketsByFormat(channelTickets, strategy.format, baseName);

  // TODO: 接入真实飞书机器人/群消息 API，将生成的文件推送到对应群
  // 真实实现：调用飞书 API 上传文件并发送到 channel.feishuChatId

  return {
    filename,
    channelName: channel.name,
    format: strategy.format,
    ticketCount: channelTickets.length,
  };
}

// 重置数据
export function resetExportStrategies(): void {
  strategiesStore = buildInitialStrategies();
}
