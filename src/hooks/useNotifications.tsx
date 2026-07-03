// 通知轮询 Hook - 模拟实时推送
import { useState, useEffect, useCallback, useRef } from 'react';
import { notification as antdNotification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import type { AppNotification } from '../types';
import {
  pollNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead as svcMarkAsRead,
  markAllAsRead as svcMarkAllAsRead,
  clearNotifications as svcClearNotifications
} from '../services/notificationService';
import { getCurrentUser } from '../services/authService';

// 轮询间隔（毫秒）- 模拟实时，实际应使用 WebSocket
const POLL_INTERVAL = 15000; // 15秒

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [api, contextHolder] = antdNotification.useNotification();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 刷新本地状态
  const refresh = useCallback(() => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  // 执行一次轮询
  const doPoll = useCallback(async () => {
    if (!getCurrentUser()) return;
    try {
      const fresh = await pollNotifications();
      // 对新到达的通知弹出右上角提示
      fresh.forEach(n => {
        api.open({
          title: n.title,
          description: n.content,
          icon: <BellOutlined style={{ color: '#3d7fff' }} />,
          placement: 'topRight',
          duration: 4.5
        });
      });
      refresh();
    } catch (error) {
      console.error('通知轮询失败', error);
    }
  }, [api, refresh]);

  // 启动轮询
  useEffect(() => {
    if (!getCurrentUser()) return;

    // 首次立即刷新已有通知
    refresh();

    // 延迟首次轮询，避免登录瞬间弹窗
    const firstPoll = setTimeout(doPoll, 3000);

    // 定时轮询
    timerRef.current = setInterval(doPoll, POLL_INTERVAL);

    return () => {
      clearTimeout(firstPoll);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [doPoll, refresh]);

  // 标记单条已读
  const markAsRead = useCallback((id: string) => {
    svcMarkAsRead(id);
    refresh();
  }, [refresh]);

  // 全部已读
  const markAllAsRead = useCallback(() => {
    svcMarkAllAsRead();
    refresh();
  }, [refresh]);

  // 清空
  const clearAll = useCallback(() => {
    svcClearNotifications();
    refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    contextHolder
  };
}
