// 渠道服务
import type { Channel } from '../types';
import { getInitialData } from '../mock';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 内存数据存储
let channelsStore: Channel[] = getInitialData().channels;

// 获取所有渠道
export async function getChannels(): Promise<Channel[]> {
  await delay();
  return [...channelsStore];
}

// 获取单个渠道
export async function getChannel(id: string): Promise<Channel | null> {
  await delay();
  return channelsStore.find(c => c.id === id) || null;
}

// 按名称查找渠道
export async function getChannelByName(name: string): Promise<Channel | null> {
  await delay();
  return channelsStore.find(c => c.name === name) || null;
}

// 重置数据
export function resetChannels(): void {
  channelsStore = getInitialData().channels;
}
