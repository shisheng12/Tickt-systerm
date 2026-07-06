// 工单列表列配置 - 精简版（约25个核心字段）
import { Tag, Tooltip, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ToolOutlined, UserAddOutlined } from '@ant-design/icons';
import type { Ticket } from '../types';
import { TICKET_STATUS, PRIORITY_CONFIG, SOURCE_CONFIG } from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG, COMPLAINT_LEVEL_CONFIG } from '../constants/complaintRules';
import dayjs from 'dayjs';

export function getTicketColumns(
  onProcess: (record: Ticket) => void,
  onBatchAssign: (records: Ticket[]) => void,
  canProcess: (record: Ticket) => boolean
): ColumnsType<Ticket> {
  return [
    {
      title: '工单号',
      dataIndex: 'workOrderNumber',
      key: 'workOrderNumber',
      width: 140,
      fixed: 'left',
      render: (text: string, record) => (
        <a onClick={() => onProcess(record)} style={{ color: '#3d7fff', fontWeight: 500 }}>
          {text}
        </a>
      )
    },
    {
      title: '反馈时间',
      dataIndex: 'feedbackTime',
      key: 'feedbackTime',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '保司',
      dataIndex: 'project',
      key: 'project',
      width: 90
    },
    {
      title: '经纪主体',
      dataIndex: 'brokerageEntity',
      key: 'brokerageEntity',
      width: 130,
      ellipsis: true
    },
    {
      title: '支付渠道',
      dataIndex: 'paymentChannel',
      key: 'paymentChannel',
      width: 110
    },
    {
      title: '内部订单号',
      dataIndex: 'internalOrderNumber',
      key: 'internalOrderNumber',
      width: 150,
      render: (text?: string) => text || <span style={{ color: '#ccc' }}>-</span>
    },
    {
      title: '保单号',
      dataIndex: 'policyNumber',
      key: 'policyNumber',
      width: 170,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 90
    },
    {
      title: '客户电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '保司侧核身',
      dataIndex: 'nuclearBodyStatus',
      key: 'nuclearBodyStatus',
      width: 100,
      render: (text: string) => (
        <Tag color={text === '是' ? 'green' : text === '待核实' ? 'orange' : 'default'}>
          {text}
        </Tag>
      )
    },
    {
      title: '客户诉求',
      dataIndex: 'customerRequest',
      key: 'customerRequest',
      width: 180,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      )
    },
    {
      title: '客诉类别',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      ellipsis: true
    },
    {
      title: '投诉等级',
      dataIndex: 'complaintLevel',
      key: 'complaintLevel',
      width: 100,
      render: (level: string) => {
        const config = COMPLAINT_LEVEL_CONFIG[level as keyof typeof COMPLAINT_LEVEL_CONFIG];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{level}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
        return config ? <Tag color={config.color}>{config.text}</Tag> : <Tag>{priority}</Tag>;
      }
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = TICKET_STATUS[status as keyof typeof TICKET_STATUS];
        return config ? <Tag color={config.color}>{config.text}</Tag> : <Tag>{status}</Tag>;
      }
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (source: string) => {
        const config = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG];
        return <span>{config?.icon} {config?.text || source}</span>;
      }
    },
    {
      title: '反馈渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (channel: string) => {
        const config = CHANNEL_TYPE_CONFIG[channel as keyof typeof CHANNEL_TYPE_CONFIG];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{channel}</Tag>;
      }
    },
    {
      title: '用户投诉渠道',
      dataIndex: 'userComplaintChannel',
      key: 'userComplaintChannel',
      width: 110,
      ellipsis: true
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
      render: (text: string) => <Tag color={text === '外部用户' ? 'orange' : 'blue'}>{text}</Tag>
    },
    {
      title: '跟进人',
      dataIndex: 'follower',
      key: 'follower',
      width: 90,
      render: (text: string) => text || <span style={{ color: '#ccc' }}>-</span>
    },
    {
      title: '跟进次数',
      dataIndex: 'contactCount',
      key: 'contactCount',
      width: 80,
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count} 次</Tag>
      )
    },
    {
      title: '下次联系',
      dataIndex: 'nextContactTime',
      key: 'nextContactTime',
      width: 140,
      render: (time: string | null) => time ? dayjs(time).format('MM-DD HH:mm') : '-'
    },
    {
      title: '处理结果',
      dataIndex: 'processingResult',
      key: 'processingResult',
      width: 180,
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text || '-'}
        </Tooltip>
      )
    },
    {
      title: '完结时间',
      dataIndex: 'completionTime',
      key: 'completionTime',
      width: 140,
      render: (time: string | null) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '完结状态',
      dataIndex: 'completionStatus',
      key: 'completionStatus',
      width: 100,
      render: (text: string) => text || <span style={{ color: '#ccc' }}>-</span>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '曾进线',
      dataIndex: 'hasContacted',
      key: 'hasContacted',
      width: 80,
      align: 'center',
      render: (val: boolean) => val ? <Tag color="blue">是</Tag> : <Tag>否</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<ToolOutlined />}
            onClick={() => onProcess(record)}
          >
            处理
          </Button>
        </Space>
      )
    }
  ];
}