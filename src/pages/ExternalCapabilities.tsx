import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Select,
  TimePicker,
  message,
  Modal,
  Form,
  Popconfirm,
  Spin,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  SendOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Channel, ExportStrategy, ExportFormat } from '../types';
import { getChannels } from '../services/channelService';
import {
  getExportStrategies,
  createExportStrategy,
  updateExportStrategy,
  deleteExportStrategy,
  toggleExportStrategy,
  executeStrategyNow,
} from '../services/exportStrategyService';
import FeishuFormModal from '../components/FeishuFormModal';
import { usePermission } from '../hooks/usePermission';
import dayjs from 'dayjs';
import './ExternalCapabilities.css';

const { Text } = Typography;

// 格式标签配色
const FORMAT_COLOR: Record<ExportFormat, string> = {
  xlsx: 'green',
  csv: 'blue',
  pdf: 'red',
};

const FREQUENCY_LABEL: Record<string, string> = {
  daily: '每日',
  weekly: '每周',
};

export default function ExternalCapabilities() {
  const canExport = usePermission('ticket.export');

  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [strategies, setStrategies] = useState<ExportStrategy[]>([]);

  // 飞书进单弹窗
  const [feishuOpen, setFeishuOpen] = useState(false);

  // 策略新增/编辑弹窗
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<ExportStrategy | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channelsData, strategiesData] = await Promise.all([
        getChannels(),
        getExportStrategies(),
      ]);
      setChannels(channelsData);
      setStrategies(strategiesData);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const getChannelName = (channelId: string) =>
    channels.find(c => c.id === channelId)?.name || channelId;

  // 切换启用
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleExportStrategy(id, enabled);
      setStrategies(prev => prev.map(s => (s.id === id ? { ...s, enabled } : s)));
      message.success(enabled ? '策略已启用' : '策略已停用');
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 立即执行（模拟触发导出 + 推送）
  const handleExecute = async (strategy: ExportStrategy) => {
    setExecutingId(strategy.id);
    try {
      const result = await executeStrategyNow(strategy.id);
      message.success(
        `已生成 ${result.filename} 并推送至【${result.channelName}】（${result.ticketCount} 条工单，${result.format.toUpperCase()} 格式）`,
        5
      );
    } catch (error: any) {
      message.error(error.message || '执行失败');
    } finally {
      setExecutingId(null);
    }
  };

  // 打开新增策略
  const handleAdd = () => {
    setEditingStrategy(null);
    form.resetFields();
    form.setFieldsValue({ frequency: 'daily', format: 'xlsx', time: dayjs('18:00', 'HH:mm') });
    setStrategyModalOpen(true);
  };

  // 打开编辑策略
  const handleEdit = (strategy: ExportStrategy) => {
    setEditingStrategy(strategy);
    form.setFieldsValue({
      channelId: strategy.channelId,
      frequency: strategy.frequency,
      time: dayjs(strategy.time, 'HH:mm'),
      format: strategy.format,
    });
    setStrategyModalOpen(true);
  };

  // 提交策略
  const handleStrategySubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        channelId: values.channelId,
        frequency: values.frequency,
        time: (values.time as dayjs.Dayjs).format('HH:mm'),
        format: values.format,
        enabled: editingStrategy ? editingStrategy.enabled : true,
      };
      if (editingStrategy) {
        await updateExportStrategy(editingStrategy.id, payload);
        message.success('策略已更新');
      } else {
        await createExportStrategy(payload);
        message.success('策略已创建');
      }
      setStrategyModalOpen(false);
      await loadData();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除策略
  const handleDelete = async (id: string) => {
    try {
      await deleteExportStrategy(id);
      message.success('策略已删除');
      await loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const columns: ColumnsType<ExportStrategy> = [
    {
      title: '社群/渠道',
      dataIndex: 'channelId',
      key: 'channelId',
      render: (channelId: string) => {
        const channel = channels.find(c => c.id === channelId);
        return (
          <Space>
            <span style={{ fontWeight: 500 }}>{getChannelName(channelId)}</span>
            {channel && (
              <Tag color={channel.type === 'external' ? 'orange' : 'default'}>
                {channel.type === 'external' ? '外部' : '内部'}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '导出频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 110,
      render: (freq: string) => FREQUENCY_LABEL[freq] || freq,
    },
    {
      title: '执行时间',
      dataIndex: 'time',
      key: 'time',
      width: 110,
      render: (time: string) => (
        <span style={{ fontFamily: 'monospace' }}>{time}</span>
      ),
    },
    {
      title: '文件格式',
      dataIndex: 'format',
      key: 'format',
      width: 110,
      render: (format: ExportFormat) => (
        <Tag color={FORMAT_COLOR[format]}>{format.toUpperCase()}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record) => (
        <Switch
          checked={enabled}
          onChange={checked => handleToggle(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="停用"
          disabled={!canExport}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            loading={executingId === record.id}
            disabled={!canExport}
            onClick={() => handleExecute(record)}
          >
            立即执行
          </Button>
          <Button size="small" disabled={!canExport} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除此策略？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            disabled={!canExport}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={!canExport}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="external-capabilities-page">
      <h2>外部能力</h2>

      {/* 飞书进单 */}
      <Card
        variant="borderless"
        className="capability-card"
        title={
          <Space>
            <CloudUploadOutlined style={{ color: '#3370ff' }} />
            <span>飞书表单进单（模拟）</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div className="card-desc">
          模拟外部用户通过飞书收集表单提交问题。点击下方按钮打开仿飞书表单，提交后自动生成来源为
          <Tag color="blue" style={{ margin: '0 4px' }}>feishu_form</Tag>
          的工单进入列表。
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            真实接入点：飞书收集表单事件订阅(webhook) / 长连接（代码已用 TODO 标注）
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={() => setFeishuOpen(true)}
        >
          模拟收到飞书表单
        </Button>
      </Card>

      {/* 定时导出策略 */}
      <Card
        variant="borderless"
        className="capability-card"
        title={
          <Space>
            <ScheduleOutlined style={{ color: '#3d7fff' }} />
            <span>定时导出策略（模拟）</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={!canExport}
          >
            新增策略
          </Button>
        }
      >
        <div className="card-desc">
          为每个社群配置「导出频率 + 时间 + 文件格式」。不同社群按各自格式输出，体现"不同格式文件对应社群"。
          点击「立即执行」模拟触发导出并推送到对应社群。
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            真实接入点：后端 cron 定时任务生成文件 + 飞书机器人/群消息 API 推送（代码已用 TODO 标注）
          </Text>
        </div>
        {!canExport && (
          <Tag color="orange" style={{ marginBottom: 12 }}>
            当前角色无导出权限（ticket.export），仅可查看策略
          </Tag>
        )}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={strategies}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </Spin>
      </Card>

      {/* 飞书进单弹窗 */}
      <FeishuFormModal
        open={feishuOpen}
        channels={channels}
        onClose={() => setFeishuOpen(false)}
        onSubmitted={loadData}
      />

      {/* 策略新增/编辑弹窗 */}
      <Modal
        title={editingStrategy ? '编辑导出策略' : '新增导出策略'}
        open={strategyModalOpen}
        onOk={handleStrategySubmit}
        onCancel={() => setStrategyModalOpen(false)}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="社群/渠道"
            name="channelId"
            rules={[{ required: true, message: '请选择社群' }]}
          >
            <Select
              placeholder="选择社群"
              options={channels.map(c => ({
                value: c.id,
                label: `${c.name}（默认格式：${c.exportFormat.toUpperCase()}）`,
              }))}
              onChange={(channelId) => {
                // 选社群时自动带出其默认导出格式
                const channel = channels.find(c => c.id === channelId);
                if (channel) form.setFieldValue('format', channel.exportFormat);
              }}
            />
          </Form.Item>
          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item
              label="导出频率"
              name="frequency"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { value: 'daily', label: '每日' },
                  { value: 'weekly', label: '每周' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="执行时间"
              name="time"
              rules={[{ required: true, message: '请选择时间' }]}
              style={{ flex: 1 }}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={30} />
            </Form.Item>
          </Space>
          <Form.Item
            label="文件格式"
            name="format"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'xlsx', label: 'XLSX（Excel 表格）' },
                { value: 'csv', label: 'CSV（逗号分隔）' },
                { value: 'pdf', label: 'PDF（打印文档）' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
