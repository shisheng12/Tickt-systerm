// 排班服务
import type { Schedule, ShiftType } from '../types';
import { getInitialData } from '../mock';
import { hasPermission } from './authService';

// 模拟异步延迟
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 内存数据存储
let schedulesStore: Schedule[] = getInitialData().schedules;

// 生成新ID
function generateId(): string {
  const maxId = schedulesStore.reduce((max, s) => {
    const num = parseInt(s.id.slice(1), 10);
    return num > max ? num : max;
  }, 0);
  return `S${String(maxId + 1).padStart(3, '0')}`;
}

// 查询排班（按日期范围）
export async function querySchedules(startDate?: string, endDate?: string, channel?: string): Promise<Schedule[]> {
  await delay();

  if (!hasPermission('schedule.manage')) {
    throw new Error('无权限访问');
  }

  let filtered = [...schedulesStore];

  if (startDate) {
    filtered = filtered.filter(s => s.date >= startDate);
  }

  if (endDate) {
    filtered = filtered.filter(s => s.date <= endDate);
  }

  if (channel) {
    filtered = filtered.filter(s => s.channel === channel);
  }

  // 按日期排序
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  return filtered;
}

// 获取单个排班
export async function getSchedule(id: string): Promise<Schedule | null> {
  await delay();

  if (!hasPermission('schedule.manage')) {
    throw new Error('无权限访问');
  }

  return schedulesStore.find(s => s.id === id) || null;
}

// 创建排班
export async function createSchedule(scheduleData: Omit<Schedule, 'id'>): Promise<Schedule> {
  await delay();

  if (!hasPermission('schedule.manage')) {
    throw new Error('无权限操作');
  }

  // 检查冲突（同一客服同一天是否已有排班）
  const conflict = schedulesStore.find(
    s => s.userId === scheduleData.userId && s.date === scheduleData.date && s.shift === scheduleData.shift
  );

  if (conflict) {
    throw new Error('该客服在此日期已有相同班次的排班');
  }

  const newSchedule: Schedule = {
    id: generateId(),
    ...scheduleData
  };

  schedulesStore.push(newSchedule);
  return newSchedule;
}

// 更新排班
export async function updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
  await delay();

  if (!hasPermission('schedule.manage')) {
    throw new Error('无权限操作');
  }

  const schedule = schedulesStore.find(s => s.id === id);
  if (!schedule) {
    throw new Error('排班不存在');
  }

  // 如果修改了日期、用户或班次，检查冲突
  if (updates.date || updates.userId || updates.shift) {
    const checkUserId = updates.userId || schedule.userId;
    const checkDate = updates.date || schedule.date;
    const checkShift = updates.shift || schedule.shift;

    const conflict = schedulesStore.find(
      s => s.id !== id && s.userId === checkUserId && s.date === checkDate && s.shift === checkShift
    );

    if (conflict) {
      throw new Error('该客服在此日期已有相同班次的排班');
    }
  }

  Object.assign(schedule, updates);
  return schedule;
}

// 删除排班
export async function deleteSchedule(id: string): Promise<void> {
  await delay();

  if (!hasPermission('schedule.manage')) {
    throw new Error('无权限操作');
  }

  const index = schedulesStore.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error('排班不存在');
  }

  schedulesStore.splice(index, 1);
}

// 批量创建排班（按周）
export async function batchCreateSchedules(schedules: Omit<Schedule, 'id'>[]): Promise<Schedule[]> {
  await delay(500);

  if (!hasPermission('schedule.manage')) {
    throw new Error('无权限操作');
  }

  const created: Schedule[] = [];

  for (const data of schedules) {
    // 检查冲突
    const conflict = schedulesStore.find(
      s => s.userId === data.userId && s.date === data.date && s.shift === data.shift
    );

    if (!conflict) {
      const newSchedule: Schedule = {
        id: generateId(),
        ...data
      };
      schedulesStore.push(newSchedule);
      created.push(newSchedule);
    }
  }

  return created;
}

// 重置数据
export function resetSchedules(): void {
  schedulesStore = getInitialData().schedules;
}
