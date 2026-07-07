// 工单处理抽屉 - 3栏重构版（基本信息 + 处理操作 + 处理记录时间线）
import { useState, useEffect } from 'react';
import {
  Drawer,
  Descriptions,
  Button,
  Space,
  Tag,
  Timeline,
  Upload,
  Input,
  message,
  Divider,
  Empty,
  Avatar,
  Modal,
  Radio,
  Popconfirm,
  Form,
  Select,
  DatePicker
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  SendOutlined,
  SwapOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  CheckOutlined,
  FileDoneOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { Ticket, TicketStatus, Attachment, ProcessLog, CompletionStatus } from '../types';
import {
  getTicket,
  assignTicket,
  addComment,
  setNextContactTime,
  resolveTicket,
  batchAssign,
  updateTicket
} from '../services/ticketService';
import { getUsers } from '../services/roleService';
import { useAuth } from '../hooks/usePermission';
import { COMPLAINT_LEVEL_CONFIG, CHANNEL_TYPE_CONFIG, RESOLUTION_OPTIONS } from '../constants/complaintRules';
import { TICKET_CATEGORIES, TICKET_STATUS, PRIORITY_CONFIG, SOURCE_CONFIG, NUCLEAR_STATUS } from '../constants/ticket';
import dayjs from 'dayjs';
import './TicketDetailDrawer.css';

const { TextArea } = Input;

interface TicketProcessDrawerProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function TicketProcessDrawer({
  ticketId,
  open,
  onClose,
  onUpdated
}: TicketProcessDrawerProps) {
  const authUser = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 处理操作状态
  const [processing, setProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const [nextContactTime, setNextContactTimeValue] = useState<string | null>(null);

  // 分配弹窗
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  // 完结弹窗
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveStep, setResolveStep] = useState<'select' | 'confirm'>('select');
  const [resolveType, setResolveType] = useState<CompletionStatus>('正常完结');
  const [resolveRemark, setResolveRemark] = useState('');

  // 编辑模式
  const [editMode, setEditMode] = useState(false);
  const [editForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    if (open && ticketId) {
      loadData();
    } else {
      setTicket(null);
      setComment('');
      setUploadedFiles([]);
      setEditMode(false);
      editForm.resetFields();
    }
  }, [open, ticketId]);

  const loadData = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [ticketData, usersData] = await Promise.all([
        getTicket(ticketId),
        getUsers()
      ]);
      setTicket(ticketData);
      setUsers(usersData);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 分配责任人
  const handleAssign = async () => {
    if (!selectedAssignee || !ticket) return;
    try {
      setProcessing(true);
      await batchAssign([ticket.id], selectedAssignee);
      message.success('分配成功');
      setAssignModalVisible(false);
      loadData();
      onUpdated?.();
    } catch (error: any) {
      message.error(error.message || '分配失败');
    } finally {
      setProcessing(false);
    }
  };

  // 处理操作（添加备注 + 上传材料）
  const handleProcess = async () => {
    if (!comment.trim() && uploadedFiles.length === 0) {
      message.warning('请输入备注或上传材料');
      return;
    }

    try {
      setProcessing(true);
      // 添加处理记录（含材料和备注）
      await addComment(
        ticket!.id,
        comment.trim() || '处理材料',
        uploadedFiles.length > 0 ? uploadedFiles : undefined
      );

      // 如果设置了下次联系时间
      if (nextContactTime) {
        await setNextContactTime(ticket!.id, nextContactTime);
      }

      message.success('处理成功');
      setComment('');
      setUploadedFiles([]);
      setNextContactTimeValue(null);
      loadData();
      onUpdated?.();
    } catch (error: any) {
      message.error(error.message || '处理失败');
    } finally {
      setProcessing(false);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (file: File) => {
    // Mock 上传：生成附件记录
    const attachment: Attachment = {
      id: `F${Date.now()}`,
      name: file.name,
      type: file.type.startsWith('image') ? 'image' : 'file',
      url: `mock://files/${Date.now()}`
    };
    setUploadedFiles([...uploadedFiles, attachment]);
    message.success(`已添加：${file.name}`);
    return false; // 阻止默认上传
  };

  // 完结处理 - 第一步：选择完结类型
  const handleResolveStart = () => {
    setResolveType('正常完结');
    setResolveRemark('');
    setResolveStep('select');
    setResolveModalVisible(true);
  };

  // 完结处理 - 第二步：二次确认
  const handleResolveConfirm = async () => {
    if (!resolveRemark.trim()) {
      message.warning('请填写处理结果');
      return;
    }
    try {
      setProcessing(true);
      await resolveTicket(ticket!.id, resolveType, resolveRemark);
      message.success('工单已完结');
      setResolveModalVisible(false);
      loadData();
      onUpdated?.();
    } catch (error: any) {
      message.error(error.message || '完结失败');
    } finally {
      setProcessing(false);
    }
  };

  // 编辑基础信息 - 进入编辑模式
  const handleEditStart = () => {
    if (!ticket) return;
    editForm.setFieldsValue({
      project: ticket.project,
      brokerageEntity: ticket.brokerageEntity,
      paymentChannel: ticket.paymentChannel,
      internalOrderNumber: ticket.internalOrderNumber || '',
      contactPhone: ticket.contactPhone || '',
      nuclearBodyStatus: ticket.nuclearBodyStatus,
      category: ticket.category,
      complaintLevel: ticket.complaintLevel,
      priority: ticket.priority,
      source: ticket.source
    });
    setEditMode(true);
  };

  // 编辑基础信息 - 取消
  const handleEditCancel = () => {
    setEditMode(false);
    editForm.resetFields();
  };

  // 编辑基础信息 - 保存
  const handleEditSave = async () => {
    if (!ticket) return;
    try {
      const values = await editForm.validateFields();
      setProcessing(true);
      await updateTicket(ticket.id, {
        project: values.project,
        brokerageEntity: values.brokerageEntity,
        paymentChannel: values.paymentChannel,
        internalOrderNumber: values.internalOrderNumber || undefined,
        contactPhone: values.contactPhone || undefined,
        nuclearBodyStatus: values.nuclearBodyStatus,
        category: values.category,
        complaintLevel: values.complaintLevel,
        priority: values.priority,
        source: values.source
      });
      message.success('基础信息已更新');
      setEditMode(false);
      loadData();
      onUpdated?.();
    } catch (error: any) {
      if (error?.errorFields) return; // 表单校验失败
      message.error(error.message || '保存失败');
    } finally {
      setProcessing(false);
    }
  };

  const renderActionButton = () => {
    if (!ticket) return null;

    // 待处理：显示"开始处理"按钮
    if (ticket.status === 'pending') {
      return (
        <Space>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              setSelectedAssignee(null);
              assignForm.resetFields();
              setAssignModalVisible(true);
            }}
          >
            分配
          </Button>
          <Popconfirm
            title="确认开始处理？"
            onConfirm={async () => {
              try {
                setProcessing(true);
                await addComment(ticket.id, '开始处理');
                message.success('已进入处理状态');
                loadData();
                onUpdated?.();
              } catch (err: any) {
                message.error(err.message);
              } finally {
                setProcessing(false);
              }
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button type="primary" icon={<CheckOutlined />} loading={processing}>
              开始处理
            </Button>
          </Popconfirm>
        </Space>
      );
    }

    // 处理中：显示"确认完结"按钮
    if (ticket.status === 'processing') {
      return (
        <Button
          type="primary"
          icon={<FileDoneOutlined />}
          onClick={handleResolveStart}
        >
          确认完结
        </Button>
      );
    }

    // 已完结：提示
    if (ticket.status === 'completed') {
      return <Tag color="green" icon={<CheckCircleOutlined />}>工单已完结</Tag>;
    }

    return null;
  };

  if (!ticket) {
    return <Drawer open={open} onClose={onClose} width={900} />;
  }

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined />
          <span>工单处理 - {ticket.workOrderNumber}</span>
          <Tag color={TICKET_STATUS[ticket.status]?.color || 'default'}>
            {TICKET_STATUS[ticket.status]?.text || ticket.status}
          </Tag>
        </Space>
      }
      width={1000}
      open={open}
      onClose={onClose}
      loading={loading}
    >
      {/* ====== 第一栏：基本信息 ====== */}
      <div className="info-section">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 基本信息</span>
          {!editMode ? (
            <Button size="small" icon={<EditOutlined />} onClick={handleEditStart}>
              编辑基础信息
            </Button>
          ) : (
            <Space size="small">
              <Button size="small" onClick={handleEditCancel}>取消</Button>
              <Button size="small" type="primary" loading={processing} onClick={handleEditSave}>
                保存
              </Button>
            </Space>
          )}
        </div>
        {editMode ? (
          <Form form={editForm} layout="vertical" component={false}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="工单号">{ticket.workOrderNumber}</Descriptions.Item>
              <Descriptions.Item label="反馈时间">{dayjs(ticket.feedbackTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="保司">
                <Form.Item name="project" noStyle rules={[{ required: true, message: '请输入保司' }]}>
                  <Input placeholder="如：融盛、平安" />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="经纪主体">
                <Form.Item name="brokerageEntity" noStyle rules={[{ required: true, message: '请输入经纪主体' }]}>
                  <Input placeholder="如：东方大地" />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="支付渠道">
                <Form.Item name="paymentChannel" noStyle rules={[{ required: true, message: '请输入支付渠道' }]}>
                  <Input placeholder="如：连连支付" />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="内部订单号">
                <Form.Item name="internalOrderNumber" noStyle>
                  <Input placeholder="非必填" />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="保单号">{ticket.policyNumber}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{ticket.customerName}</Descriptions.Item>
              <Descriptions.Item label="客户电话">{ticket.phone}</Descriptions.Item>
              <Descriptions.Item label="联系人电话">
                <Form.Item name="contactPhone" noStyle>
                  <Input placeholder="非必填" />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="保司侧核身">
                <Form.Item name="nuclearBodyStatus" noStyle rules={[{ required: true, message: '请选择核身状态' }]}>
                  <Select style={{ width: '100%' }} options={NUCLEAR_STATUS.map(s => ({ value: s.value, label: s.label }))} />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="客户是否曾进线">
                <Tag color={ticket.hasContacted ? 'blue' : 'default'}>
                  {ticket.hasContacted ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="进线ID">{ticket.contactId || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户诉求" span={2}>{ticket.customerRequest}</Descriptions.Item>
              <Descriptions.Item label="客诉类别">
                <Form.Item name="category" noStyle rules={[{ required: true, message: '请选择客诉类别' }]}>
                  <Select
                    showSearch
                    style={{ width: '100%' }}
                    optionFilterProp="label"
                    options={TICKET_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                  />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="投诉等级">
                <Form.Item name="complaintLevel" noStyle rules={[{ required: true, message: '请选择投诉等级' }]}>
                  <Select
                    style={{ width: '100%' }}
                    options={Object.entries(COMPLAINT_LEVEL_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Form.Item name="priority" noStyle rules={[{ required: true, message: '请选择优先级' }]}>
                  <Select
                    style={{ width: '100%' }}
                    options={Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({ value: k, label: v.text }))}
                  />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="处理状态">
                <Tag color={TICKET_STATUS[ticket.status]?.color}>
                  {TICKET_STATUS[ticket.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源">
                <Form.Item name="source" noStyle rules={[{ required: true, message: '请选择来源' }]}>
                  <Select
                    style={{ width: '100%' }}
                    options={Object.entries(SOURCE_CONFIG).map(([k, v]) => ({ value: k, label: v.text }))}
                  />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label="反馈渠道">
                <Tag color={CHANNEL_TYPE_CONFIG[ticket.channel]?.color}>
                  {ticket.channel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用户投诉渠道">{ticket.userComplaintChannel}</Descriptions.Item>
              <Descriptions.Item label="创建人">{ticket.creatorName}</Descriptions.Item>
              <Descriptions.Item label="最近跟进人">{ticket.follower || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系次数">
                <Tag color="blue">{ticket.contactCount} 次</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="下次联系时间">
                {ticket.nextContactTime ? dayjs(ticket.nextContactTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理结果" span={2}>
                {ticket.processingResult || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完结时间">
                {ticket.completionTime ? dayjs(ticket.completionTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完结状态">
                <Tag>{ticket.completionStatus || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(ticket.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Form>
        ) : (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="工单号">{ticket.workOrderNumber}</Descriptions.Item>
            <Descriptions.Item label="反馈时间">{dayjs(ticket.feedbackTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="保司">{ticket.project}</Descriptions.Item>
            <Descriptions.Item label="经纪主体">{ticket.brokerageEntity}</Descriptions.Item>
            <Descriptions.Item label="支付渠道">{ticket.paymentChannel}</Descriptions.Item>
            <Descriptions.Item label="内部订单号">{ticket.internalOrderNumber || '-'}</Descriptions.Item>
            <Descriptions.Item label="保单号">{ticket.policyNumber}</Descriptions.Item>
            <Descriptions.Item label="客户姓名">{ticket.customerName}</Descriptions.Item>
            <Descriptions.Item label="客户电话">{ticket.phone}</Descriptions.Item>
            <Descriptions.Item label="联系人电话">{ticket.contactPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="保司侧核身">
              <Tag color={ticket.nuclearBodyStatus === '是' ? 'green' : 'orange'}>
                {ticket.nuclearBodyStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户是否曾进线">
              <Tag color={ticket.hasContacted ? 'blue' : 'default'}>
                {ticket.hasContacted ? '是' : '否'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="进线ID">{ticket.contactId || '-'}</Descriptions.Item>
            <Descriptions.Item label="客户诉求" span={2}>{ticket.customerRequest}</Descriptions.Item>
            <Descriptions.Item label="客诉类别">
              <Tag>{ticket.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="投诉等级">
              <Tag color={COMPLAINT_LEVEL_CONFIG[ticket.complaintLevel]?.color}>
                {ticket.complaintLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={
                ticket.priority === 'urgent' ? 'red' :
                ticket.priority === 'high' ? 'orange' :
                ticket.priority === 'medium' ? 'blue' : 'default'
              }>
                {ticket.priority === 'urgent' ? '紧急' :
                 ticket.priority === 'high' ? '高' :
                 ticket.priority === 'medium' ? '中' : '低'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="处理状态">
              <Tag color={TICKET_STATUS[ticket.status]?.color}>
                {TICKET_STATUS[ticket.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="来源">{ticket.source}</Descriptions.Item>
            <Descriptions.Item label="反馈渠道">
              <Tag color={CHANNEL_TYPE_CONFIG[ticket.channel]?.color}>
                {ticket.channel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户投诉渠道">{ticket.userComplaintChannel}</Descriptions.Item>
            <Descriptions.Item label="创建人">{ticket.creatorName}</Descriptions.Item>
            <Descriptions.Item label="最近跟进人">{ticket.follower || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系次数">
              <Tag color="blue">{ticket.contactCount} 次</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="下次联系时间">
              {ticket.nextContactTime ? dayjs(ticket.nextContactTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="处理结果" span={2}>
              {ticket.processingResult || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完结时间">
              {ticket.completionTime ? dayjs(ticket.completionTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="完结状态">
              <Tag>{ticket.completionStatus || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(ticket.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </div>

      <Divider />

      {/* ====== 第二栏：处理操作 ====== */}
      <div className="action-section">
        <div className="section-title">⚙️ 处理操作</div>

        {/* 操作按钮区 */}
        <div style={{ marginBottom: 16 }}>
          {renderActionButton()}
        </div>

        {/* 处理输入区（仅处理中显示） */}
        {ticket.status === 'processing' && (
          <div className="process-form">
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, color: '#666' }}>本次处理备注（每次提交 = 一次联系次数）：</div>
              <TextArea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="例如：已联系客户，客户同意下周提交理赔材料..."
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, color: '#666' }}>上传材料（非必填）：</div>
              <Upload
                multiple
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept="image/*,.pdf,.doc,.docx,.xlsx"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  选择文件
                </Button>
              </Upload>

              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {uploadedFiles.map(file => (
                    <Tag key={file.id} icon={<PaperClipOutlined />} style={{ marginBottom: 4 }}>
                      {file.name}
                      <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => setUploadedFiles(uploadedFiles.filter(f => f.id !== file.id))}
                      >
                        移除
                      </Button>
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, color: '#666' }}>下次联系时间（可选）：</div>
              <DatePicker
                showTime
                style={{ width: 300 }}
                onChange={(date) => setNextContactTimeValue(date ? date.toISOString() : null)}
                placeholder="选择下次联系时间"
              />
            </div>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleProcess}
              loading={processing}
              disabled={!comment.trim() && uploadedFiles.length === 0}
            >
              提交处理记录（+1 联系次数）
            </Button>
          </div>
        )}
      </div>

      <Divider />

      {/* ====== 第三栏：处理记录时间线 ====== */}
      <div className="timeline-section">
        <div className="section-title">📝 处理记录时间线（{ticket.contactCount} 条）</div>

        {ticket.processLogs && ticket.processLogs.length > 0 ? (
          <Timeline
            items={[...ticket.processLogs]
              .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
              .map(log => ({
                dot: (
                  <Avatar size={32} style={{ backgroundColor: '#3d7fff' }}>
                    {log.operatorName?.charAt(0) || log.operatorId.charAt(0)}
                  </Avatar>
                ),
                children: (
                  <div style={{ paddingBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: '#3d7fff' }}>{log.operatorName || log.operatorId}</span>
                      <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                        {dayjs(log.at).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                    <div style={{ marginBottom: 4 }}>{log.remark}</div>
                    {log.attachments && log.attachments.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {log.attachments.map(att => (
                          <Tag key={att.id} icon={<PaperClipOutlined />} color="blue">
                            {att.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }))}
          />
        ) : (
          <Empty description="暂无处理记录" />
        )}
      </div>

      {/* ====== 分配弹窗 ====== */}
      <Modal
        title="分配责任人"
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={processing}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            label="选择责任人"
            name="assigneeId"
            rules={[{ required: true, message: '请选择责任人' }]}
          >
            <Select
              placeholder="选择客服人员"
              onChange={setSelectedAssignee}
              options={users
                .filter(u => u.roleId === 'R_AGENT' || u.roleId === 'R_LEAD')
                .map(u => ({ value: u.id, label: `${u.name}（${u.team}）` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ====== 完结弹窗（2步骤） ====== */}
      <Modal
        title="确认完结工单"
        open={resolveModalVisible}
        onCancel={() => {
          setResolveModalVisible(false);
          setResolveStep('select');
        }}
        footer={
          resolveStep === 'select' ? (
            [
              <Button key="cancel" onClick={() => setResolveModalVisible(false)}>
                取消
              </Button>,
              <Button
                key="next"
                type="primary"
                onClick={() => setResolveStep('confirm')}
              >
                下一步
              </Button>
            ]
          ) : (
            [
              <Button key="back" onClick={() => setResolveStep('select')}>
                上一步
              </Button>,
              <Button
                key="confirm"
                type="primary"
                danger
                loading={processing}
                onClick={handleResolveConfirm}
              >
                确认完结
              </Button>
            ]
          )
        }
        width={500}
      >
        {resolveStep === 'select' ? (
          <div>
            <div style={{ marginBottom: 16, color: '#666' }}>
              请选择工单完结类型：
            </div>
            <Radio.Group
              value={resolveType}
              onChange={e => setResolveType(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {RESOLUTION_OPTIONS.map(opt => (
                  <Radio key={opt.value} value={opt.value} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: opt.color }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
              <div style={{ color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>
                ⚠️ 二次确认
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                您即将把工单标记为 <strong style={{ color: '#fa8c16' }}>{resolveType}</strong>，此操作不可撤销。
              </div>
            </div>

            <div style={{ marginBottom: 8, color: '#666' }}>处理结果：</div>
            <TextArea
              rows={4}
              value={resolveRemark}
              onChange={e => setResolveRemark(e.target.value)}
              placeholder="请详细填写处理结果..."
            />
          </div>
        )}
      </Modal>
    </Drawer>
  );
}