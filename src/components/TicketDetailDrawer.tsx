import { useState, useEffect } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Timeline,
  Upload,
  Input,
  message,
  Divider,
  Popconfirm,
  Empty,
  Avatar,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  SendOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  PictureOutlined
} from '@ant-design/icons';
import type { Ticket, TicketStatus, User } from '../types';
import {
  getTicket,
  assignTicket,
  changeTicketStatus,
  uploadAttachment,
  addComment,
  setDueDate
} from '../services/ticketService';
import { getUsers } from '../services/roleService';
import { useAuth, useCanProcessTicket } from '../hooks/usePermission';
import { hasPermission } from '../services/authService';
import {
  getNextStatuses,
  STATUS_META,
  TRANSITION_LABELS,
  isFinalStatus,
  checkResolveRequirement
} from '../utils/statusFlow';
import {
  TICKET_CATEGORIES,
  COMPLETION_STATUS,
  PRIORITY_CONFIG,
  SOURCE_CONFIG,
  TICKET_STATUS
} from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG, COMPLAINT_LEVEL_CONFIG } from '../constants/complaintRules';
import dayjs from 'dayjs';
import './TicketDetailDrawer.css';

const { TextArea } = Input;

interface TicketDetailDrawerProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void; // 数据更新后通知父组件刷新列表
  mode?: 'view' | 'process'; // 模式：view=查看模式（只读），process=处理模式（可操作）
}

// 处理记录动作的图标与文案
const ACTION_META: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
  create: { icon: <FileTextOutlined />, text: '创建工单', color: '#3d7fff' },
  assign: { icon: <UserOutlined />, text: '分配责任人', color: '#722ed1' },
  status_change: { icon: <SwapOutlined />, text: '状态变更', color: '#ff9e3d' },
  comment: { icon: <SendOutlined />, text: '添加备注', color: '#31cc31' },
  upload: { icon: <PaperClipOutlined />, text: '上传材料', color: '#13c2c2' },
  export: { icon: <FileTextOutlined />, text: '导出', color: '#666' }
};

export default function TicketDetailDrawer({
  ticketId,
  open,
  onClose,
  onUpdated,
  mode = 'view' // 默认为查看模式
}: TicketDetailDrawerProps) {
  const authUser = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 各操作的临时状态
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canAssign = hasPermission('ticket.assign');
  const canProcess = useCanProcessTicket(ticket?.assigneeId ?? null);

  // 是否为处理模式
  const isProcessMode = mode === 'process';

  // 加载工单详情与用户列表
  useEffect(() => {
    if (open && ticketId) {
      loadData();
    } else if (!open) {
      // 关闭时清理状态
      setTicket(null);
      setComment('');
    }
  }, [open, ticketId]);

  const loadData = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [ticketData, usersData] = await Promise.all([
        getTicket(ticketId),
        users.length ? Promise.resolve(users) : getUsers()
      ]);
      setTicket(ticketData);
      if (!users.length) setUsers(usersData as User[]);
    } catch (error: any) {
      message.error(error.message || '加载工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新当前工单（操作后局部刷新）
  const refreshTicket = async () => {
    if (!ticketId) return;
    const updated = await getTicket(ticketId);
    setTicket(updated);
    onUpdated?.();
  };

  // 分配/改派责任人
  const handleAssign = async (assigneeId: string) => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      await assignTicket(ticket.id, assigneeId);
      message.success('责任人分配成功');
      await refreshTicket();
    } catch (error: any) {
      message.error(error.message || '分配失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 设置处理时限
  const handleSetDueDate = async (date: dayjs.Dayjs | null) => {
    if (!ticket || !date) return;
    setSubmitting(true);
    try {
      await setDueDate(ticket.id, date.toISOString());
      message.success('处理时限已更新');
      await refreshTicket();
    } catch (error: any) {
      message.error(error.message || '设置失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 状态流转
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;

    // 解决/关闭前的弱校验提示
    if (isFinalStatus(newStatus)) {
      const check = checkResolveRequirement(
        ticket.processLogs.length,
        ticket.attachments.length
      );
      if (!check.ok) {
        message.warning(check.message!);
        // 弱校验：仅提示，不阻断
      }
    }

    setSubmitting(true);
    try {
      await changeTicketStatus(ticket.id, newStatus);
      message.success(`已变更为「${STATUS_META[newStatus].text}」`);
      await refreshTicket();
    } catch (error: any) {
      message.error(error.message || '状态变更失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 模拟上传材料
  const handleUpload = async (file: File) => {
    if (!ticket) return false;
    setUploading(true);
    try {
      // TODO: 接入真实文件上传服务（OSS/S3），此处仅模拟
      await uploadAttachment(ticket.id, {
        name: file.name,
        type: file.type.startsWith('image') ? 'image' : 'file'
      });
      message.success(`材料「${file.name}」上传成功`);
      await refreshTicket();
    } catch (error: any) {
      message.error(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
    return false; // 阻止 antd 默认上传行为
  };

  // 添加处理备注
  const handleAddComment = async () => {
    if (!ticket || !comment.trim()) {
      message.warning('请输入备注内容');
      return;
    }
    setSubmitting(true);
    try {
      await addComment(ticket.id, comment.trim());
      message.success('备注已添加');
      setComment('');
      await refreshTicket();
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserName = (id: string | null) => {
    if (!id) return '未分配';
    return users.find(u => u.id === id)?.name || id;
  };

  const nextStatuses = ticket ? getNextStatuses(ticket.status) : [];
  const categoryConfig = ticket ? TICKET_CATEGORIES.find(c => c.value === ticket.category) : null;
  const completionConfig = ticket?.completionStatus
    ? COMPLETION_STATUS.find(c => c.value === ticket.completionStatus)
    : null;

  return (
    <Drawer
      title={
        ticket ? (
          <Space>
            <span className="drawer-ticket-no">{ticket.workOrderNumber}</span>
            <Tag color={STATUS_META[ticket.status].color}>
              {STATUS_META[ticket.status].text}
            </Tag>
          </Space>
        ) : '工单详情'
      }
      width={720}
      open={open}
      onClose={onClose}
      loading={loading}
      className="ticket-detail-drawer"
    >
      {ticket && (
        <>
          {/* 处理操作区 - 仅在处理模式下显示 */}
          {isProcessMode && (
            <div className="action-panel">
              <div className="action-panel-title">
                <CheckCircleOutlined /> 处理操作
              </div>

            <div className="action-row">
              <span className="action-label">责任人：</span>
              {canAssign ? (
                <Select
                  value={ticket.assigneeId || undefined}
                  placeholder="选择责任人"
                  style={{ width: 200 }}
                  onChange={handleAssign}
                  disabled={submitting}
                  options={users
                    .filter(u => u.roleId !== 'R_VIEWER')
                    .map(u => ({ value: u.id, label: `${u.name}（${u.team}）` }))}
                />
              ) : (
                <span>{getUserName(ticket.assigneeId)}</span>
              )}
            </div>

            <div className="action-row">
              <span className="action-label">处理时限：</span>
              {canProcess ? (
                <DatePicker
                  showTime
                  value={ticket.dueAt ? dayjs(ticket.dueAt) : null}
                  onChange={handleSetDueDate}
                  style={{ width: 200 }}
                  disabled={submitting}
                  placeholder="设置处理时限"
                />
              ) : (
                <span>{ticket.dueAt ? dayjs(ticket.dueAt).format('YYYY-MM-DD HH:mm') : '未设置'}</span>
              )}
            </div>

            <div className="action-row">
              <span className="action-label">状态流转：</span>
              {canProcess ? (
                nextStatuses.length > 0 ? (
                  <Space wrap>
                    {nextStatuses.map(status => {
                      const label = TRANSITION_LABELS[status] || STATUS_META[status].text;
                      const isFinal = isFinalStatus(status);
                      return isFinal ? (
                        <Popconfirm
                          key={status}
                          title={`确认${label}？`}
                          description="终态变更后需重新打开才能继续处理"
                          onConfirm={() => handleStatusChange(status)}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button size="small" type="primary" disabled={submitting}>
                            {label}
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Button
                          key={status}
                          size="small"
                          type="primary"
                          disabled={submitting}
                          onClick={() => handleStatusChange(status)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </Space>
                ) : (
                  <span style={{ color: '#999' }}>当前状态无可用流转</span>
                )
              ) : (
                <span style={{ color: '#999' }}>
                  {canProcess === false ? '无处理权限' : '—'}
                </span>
              )}
            </div>
          </div>
          )}

          {/* 基本信息 - 更新为27字段 */}
          <Divider orientation="left">基本信息</Divider>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="工单号">
              <span style={{ fontWeight: 600, color: '#3d7fff' }}>{ticket.workOrderNumber}</span>
            </Descriptions.Item>
            <Descriptions.Item label="反馈时间">
              {dayjs(ticket.feedbackTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="项目">{ticket.project}</Descriptions.Item>
            <Descriptions.Item label="经纪主体">{ticket.brokerageEntity}</Descriptions.Item>
            <Descriptions.Item label="支付渠道">{ticket.paymentChannel}</Descriptions.Item>
            <Descriptions.Item label="内部订单号">
              {ticket.internalOrderNumber || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>
            <Descriptions.Item label="保单号">
              <span style={{ fontFamily: 'monospace' }}>{ticket.policyNumber}</span>
            </Descriptions.Item>
            <Descriptions.Item label="客户姓名">{ticket.customerName}</Descriptions.Item>
            <Descriptions.Item label="客户电话">{ticket.phone}</Descriptions.Item>
            <Descriptions.Item label="保司侧是否核身">
              <Tag color={ticket.nuclearBodyStatus === '是' ? 'green' : ticket.nuclearBodyStatus === '否' ? 'default' : 'orange'}>
                {ticket.nuclearBodyStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户诉求" span={2}>
              {ticket.customerRequest}
            </Descriptions.Item>
            <Descriptions.Item label="客诉类别">
              {categoryConfig ? (
                <Tag color={categoryConfig.color}>{categoryConfig.label}</Tag>
              ) : ticket.category}
            </Descriptions.Item>
            <Descriptions.Item label="投诉等级">
              <Tag color={COMPLAINT_LEVEL_CONFIG[ticket.complaintLevel]?.color || 'default'}>
                {ticket.complaintLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="跟进频次要求" span={2}>
              {ticket.followUpFrequency}
            </Descriptions.Item>
            <Descriptions.Item label="首响要求" span={2}>
              {ticket.firstResponseRequirement}
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={PRIORITY_CONFIG[ticket.priority].color}>
                {PRIORITY_CONFIG[ticket.priority].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="处理状态">
              <Tag color={TICKET_STATUS[ticket.status].color}>
                {TICKET_STATUS[ticket.status].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="来源">
              {SOURCE_CONFIG[ticket.source]?.icon} {SOURCE_CONFIG[ticket.source]?.text}
            </Descriptions.Item>
            <Descriptions.Item label="渠道">
              <Tag color={CHANNEL_TYPE_CONFIG[ticket.channel]?.color || 'default'}>
                {CHANNEL_TYPE_CONFIG[ticket.channel]?.label || ticket.channel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提交人">{ticket.submitterName}</Descriptions.Item>
            <Descriptions.Item label="跟进人">
              {ticket.follower || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>
            <Descriptions.Item label="联系次数">
              <span style={{ fontWeight: 600, color: '#3d7fff' }}>{ticket.contactCount}</span> 次
            </Descriptions.Item>
            <Descriptions.Item label="下次联系时间">
              {ticket.nextContactTime ? dayjs(ticket.nextContactTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="处理结果" span={2}>
              {ticket.processingResult || <span style={{ color: '#999' }}>暂无</span>}
            </Descriptions.Item>
            <Descriptions.Item label="完结时间">
              {ticket.completionTime ? dayjs(ticket.completionTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完结状态">
              {completionConfig ? (
                <Tag color={completionConfig.color}>{completionConfig.label}</Tag>
              ) : ticket.completionStatus || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(ticket.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          {/* 处理材料 - 仅在处理模式下显示 */}
          {isProcessMode && (
            <>
              <Divider orientation="left">
                处理材料
                {canProcess && (
                  <Upload
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    disabled={uploading}
                    accept="image/*,.pdf,.doc,.docx,.xlsx"
                  >
                    <Button
                      size="small"
                      type="link"
                      icon={<UploadOutlined />}
                      loading={uploading}
                    >
                      上传材料
                    </Button>
                  </Upload>
                )}
              </Divider>
              {ticket.attachments.length > 0 ? (
                <div className="attachment-list">
                  {ticket.attachments.map(att => (
                    <div key={att.id} className="attachment-item">
                      {att.type === 'image' ? <PictureOutlined /> : <PaperClipOutlined />}
                      <span className="attachment-name">{att.name}</span>
                      {/* TODO: 接入真实文件预览/下载 */}
                      <Tooltip title="Demo 模拟文件，暂不支持真实下载">
                        <span className="attachment-mock">mock</span>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无处理材料"
                  style={{ margin: '12px 0' }}
                />
              )}

              {/* 添加备注 */}
              {canProcess && (
                <>
                  <Divider orientation="left">添加处理备注</Divider>
                  <Space.Compact style={{ width: '100%' }}>
                    <TextArea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="输入处理备注或沟通记录..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </Space.Compact>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    style={{ marginTop: 8 }}
                    loading={submitting}
                    onClick={handleAddComment}
                  >
                    提交备注
                  </Button>
                </>
              )}
            </>
          )}

          {/* 处理记录时间线 */}
          <Divider orientation="left">处理记录时间线</Divider>
          <Timeline
            className="process-timeline"
            items={[...ticket.processLogs]
              .sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf())
              .map(log => {
                const meta = ACTION_META[log.action] || ACTION_META.comment;
                return {
                  dot: (
                    <Avatar
                      size={24}
                      style={{ backgroundColor: meta.color }}
                      icon={meta.icon}
                    />
                  ),
                  children: (
                    <div className="timeline-item">
                      <div className="timeline-header">
                        <span className="timeline-action">{meta.text}</span>
                        {log.from && log.to && (
                          <span className="timeline-transition">
                            {STATUS_META[log.from as TicketStatus]?.text || log.from}
                            {' → '}
                            {STATUS_META[log.to as TicketStatus]?.text || log.to}
                          </span>
                        )}
                      </div>
                      <div className="timeline-remark">{log.remark}</div>
                      <div className="timeline-meta">
                        <UserOutlined /> {getUserName(log.operatorId)}
                        <span className="timeline-time">
                          <ClockCircleOutlined /> {dayjs(log.at).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                  )
                };
              })}
          />
        </>
      )}
    </Drawer>
  );
}
