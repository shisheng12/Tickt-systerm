// Mock 数据统一导出
import type { Role, User, Channel, Ticket, Schedule } from '../types';
import rolesData from './roles.json';
import usersData from './users.json';
import channelsData from './channels.json';
import schedulesData from './schedules.json';
import ticketsData from './tickets';

export const roles: Role[] = rolesData as Role[];
export const users: User[] = usersData as User[];
export const channels: Channel[] = channelsData as Channel[];
export const tickets: Ticket[] = ticketsData;
export const schedules: Schedule[] = schedulesData as Schedule[];

// 导出便于服务层使用的副本
export function getInitialData() {
  return {
    roles: [...roles],
    users: [...users],
    channels: [...channels],
    tickets: [...tickets],
    schedules: [...schedules]
  };
}
