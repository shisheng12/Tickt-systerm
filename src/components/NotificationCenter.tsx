import { useState } from 'react';
import { Badge, Popover, List, Button, Empty, Tag, Typography } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  SwapOutlined,
  MessageOutlined,
  SyncOutlined,
  CheckOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { AppNotification, NotificationType } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationCenter.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// 通知类型对应的图标和颜色
const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  new_ticket: { icon: <FileAddOutlined />, color: '#3d7fff' },
  status_change: { icon: <SyncOutlined />, color: '#722ed1' },
  overdue: { icon: <ExclamationCircleOutlined />, color: '#ff3d3d' },
  due_soon: { icon: <ClockCircleOutlined />, color: '#ff9e3d' },
  reassigned: { icon: <SwapOutlined />, color: '#13c2c2' },
  comment: { icon: <MessageOutlined />, color: '#52c41a' }
};

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    contextHolder
  } = useNotifications();

  // 点击通知项
  const handleItemClick = (item: AppNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    // 有关联工单则跳转到工单列表
    if (item.ticketId) {
      setOpen(false);
      navigate('/tickets');
    }
  };

  const content = (
    <div className="notification-panel">
      <div className="notification-header">
        <span className="notification-title">
          通知中心
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} 条未读</span>}
        </span>
        <div className="notification-actions">
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            全部已读
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            清空
          </Button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ padding: '32px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={item => {
              const config = TYPE_CONFIG[item.type];
              return (
                <List.Item
                  className={`notification-item ${item.read ? 'read' : 'unread'}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="notification-item-content">
                    <div
                      className="notification-icon"
                      style={{ color: config.color, background: `${config.color}15` }}
                    >
                      {config.icon}
                    </div>
                    <div className="notification-body">
                      <div className="notification-item-title">
                        {item.title}
                        {!item.read && <span className="dot" />}
                      </div>
                      <div className="notification-item-desc">{item.content}</div>
                      <Text type="secondary" className="notification-time">
                        {dayjs(item.createdAt).fromNow()}
                      </Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {contextHolder}
      <Popover
        content={content}
        trigger="click"
        placement="bottomRight"
        open={open}
        onOpenChange={setOpen}
        overlayClassName="notification-popover"
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            className="notification-bell"
          />
        </Badge>
      </Popover>
    </>
  );
}
