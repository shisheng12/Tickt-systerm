// 工单列表列配置 - 27个字段
import { Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Ticket } from '../types';
import { TICKET_STATUS, PRIORITY_CONFIG, SOURCE_CONFIG } from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG, COMPLAINT_LEVEL_CONFIG } from '../constants/complaintRules';
import dayjs from 'dayjs';

export function getTicketColumns(
  onView: (record: Ticket) => void,
  onProcess: (record: Ticket) => void,
  onEdit: (record: Ticket) => void,
  canProcess: (record: Ticket) => boolean,
  canEdit: (record: Ticket) => boolean
): ColumnsType<Ticket> {
  return [
    {
      title: '反馈时间',
      dataIndex: 'feedbackTime',
      key: 'feedbackTime',
      width: 160,
      sorter: true,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '项目',
      dataIndex: 'project',
      key: 'project',
      width: 100
    },
    {
      title: '经纪主体',
      dataIndex: 'brokerageEntity',
      key: 'brokerageEntity',
      width: 140
    },
    {
      title: '支付渠道',
      dataIndex: 'paymentChannel',
      key: 'paymentChannel',
      width: 120
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNumber',
      key: 'workOrderNumber',
      width: 150,
      fixed: 'left',
      render: (text: string) => <span style={{ color: '#3d7fff', fontWeight: 500 }}>{text}</span>
    },
    {
      title: '内部订单号',
      dataIndex: 'internalOrderNumber',
      key: 'internalOrderNumber',
      width: 150,
      render: (text?: string) => text || '-'
    },
    {
      title: '保单号',
      dataIndex: 'policyNumber',
      key: 'policyNumber',
      width: 180
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100
    },
    {
      title: '客户电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '客户诉求',
      dataIndex: 'customerRequest',
      key: 'customerRequest',
      width: 200,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '保司侧是否核身',
      dataIndex: 'nuclearBodyStatus',
      key: 'nuclearBodyStatus',
      width: 130,
      render: (text: string) => (
        <Tag color={text === '是' ? 'green' : text === '否' ? 'default' : 'orange'}>{text}</Tag>
      )
    },
    {
      title: '客诉类别',
      dataIndex: 'category',
      key: 'category',
      width: 180
    },
    {
      title: '处理结果',
      dataIndex: 'processingResult',
      key: 'processingResult',
      width: 200,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      )
    },
    {
      title: '联系次数',
      dataIndex: 'contactCount',
      key: 'contactCount',
      width: 100,
      align: 'center'
    },
    {
      title: '下次联系时间',
      dataIndex: 'nextContactTime',
      key: 'nextContactTime',
      width: 160,
      render: (time: string | null) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '完结时间',
      dataIndex: 'completionTime',
      key: 'completionTime',
      width: 160,
      render: (time: string | null) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '完结状态',
      dataIndex: 'completionStatus',
      key: 'completionStatus',
      width: 140,
      render: (text: string) => text || '-'
    },
    {
      title: '跟进人',
      dataIndex: 'follower',
      key: 'follower',
      width: 100,
      render: (text: string) => text || '-'
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 110,
      render: (source: string) => {
        const config = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG];
        return <Tag icon={config.icon}>{config.text}</Tag>;
      }
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel: string) => {
        const config = CHANNEL_TYPE_CONFIG[channel as keyof typeof CHANNEL_TYPE_CONFIG];
        return <Tag color={config?.color || 'default'}>{config?.label || channel}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const config = TICKET_STATUS[status as keyof typeof TICKET_STATUS];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '提交人',
      dataIndex: 'submitterName',
      key: 'submitterName',
      width: 120
    },
    {
      title: '投诉等级',
      dataIndex: 'complaintLevel',
      key: 'complaintLevel',
      width: 110,
      render: (level: string) => {
        const config = COMPLAINT_LEVEL_CONFIG[level as keyof typeof COMPLAINT_LEVEL_CONFIG];
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '跟进频次',
      dataIndex: 'followUpFrequency',
      key: 'followUpFrequency',
      width: 140,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '首响要求',
      dataIndex: 'firstResponseRequirement',
      key: 'firstResponseRequirement',
      width: 160,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: Ticket) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a onClick={() => onView(record)}>查看</a>
          {canProcess(record) && <a onClick={() => onProcess(record)}>处理</a>}
          {canEdit(record) && <a onClick={() => onEdit(record)}>编辑</a>}
        </div>
      )
    }
  ];
}

// 默认可见列配置（支持个性化）
export const DEFAULT_VISIBLE_COLUMNS = [
  'workOrderNumber',
  'feedbackTime',
  'customerName',
  'phone',
  'customerRequest',
  'category',
  'channel',
  'priority',
  'status',
  'complaintLevel',
  'contactCount',
  'follower',
  'action'
];
