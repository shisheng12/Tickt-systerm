import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, DatePicker, Card, message, Modal, Form } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { Ticket, TicketQueryParams, ChannelType } from '../types';
import { queryTickets, createTicket, updateTicket } from '../services/ticketService';
import { getUsers } from '../services/roleService';
import { getChannels } from '../services/channelService';
import { usePermission, useAuth } from '../hooks/usePermission';
import { TICKET_STATUS, PRIORITY_CONFIG } from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG } from '../constants/complaintRules';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import TicketDetailDrawer from '../components/TicketDetailDrawer';
import FeishuFormModal from '../components/FeishuFormModal';
import TicketForm from '../components/TicketForm';
import { getTicketColumns } from './TicketListColumns';
import { exportTicketsToExcel } from '../utils/exportUtil';
import './TicketList.css';

const { RangePicker } = DatePicker;

export default function TicketList() {
  const authUser = useAuth();
  const canCreate = usePermission('ticket.create');
  const canEdit = usePermission('ticket.edit');
  const [searchParams] = useSearchParams();

  // 数据状态
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // 查询参数
  const [queryParams, setQueryParams] = useState<TicketQueryParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [channelFilter, setChannelFilter] = useState<ChannelType | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTicketId, setDrawerTicketId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'process'>('view'); // 抽屉模式
  const [feishuOpen, setFeishuOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);

  // 表单
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 辅助数据
  const [users, setUsers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    loadAuxData();
  }, []);

  // 从 URL 参数初始化筛选条件
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
      setTimeout(() => handleSearch(), 100);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTickets();
  }, [queryParams]);

  const loadAuxData = async () => {
    try {
      const [usersData, channelsData] = await Promise.all([getUsers(), getChannels()]);
      setUsers(usersData);
      setChannels(channelsData);
    } catch (error: any) {
      message.error('加载辅助数据失败');
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const result = await queryTickets(queryParams);
      setTickets(result.data);
      setTotal(result.total);
    } catch (error: any) {
      message.error(error.message || '加载工单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQueryParams({
      ...queryParams,
      page: 1,
      keyword,
      status: statusFilter as any,
      priority: priorityFilter as any,
      channel: channelFilter,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD')
    });
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setChannelFilter(undefined);
    setDateRange(null);
    setQueryParams({ page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setQueryParams({
      ...queryParams,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10
    });
  };

  const handleExport = () => {
    exportTicketsToExcel(tickets);
    message.success('导出成功');
  };

  const handleCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      feedbackTime: dayjs(),
      nuclearBodyStatus: '否',
      source: 'manual',
      channel: '客户反馈',
      priority: 'medium',
      complaintLevel: '一般工单',
      followUpFrequency: '至少3天1次',
      firstResponseRequirement: '分派后4小时内触达'
    });
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        ...values,
        feedbackTime: values.feedbackTime?.toISOString(),
        nextContactTime: values.nextContactTime?.toISOString()
      };
      await createTicket(payload);
      message.success('工单创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadTickets();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '创建失败');
    }
  };

  const handleEdit = (record: Ticket) => {
    setCurrentTicket(record);
    editForm.setFieldsValue({
      ...record,
      feedbackTime: record.feedbackTime ? dayjs(record.feedbackTime) : null,
      nextContactTime: record.nextContactTime ? dayjs(record.nextContactTime) : null,
      completionTime: record.completionTime ? dayjs(record.completionTime) : null,
      createdAt: record.createdAt ? dayjs(record.createdAt) : null
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!currentTicket) return;
    try {
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        feedbackTime: values.feedbackTime?.toISOString(),
        nextContactTime: values.nextContactTime?.toISOString(),
        completionTime: values.completionTime?.toISOString()
      };
      await updateTicket(currentTicket.id, payload);
      message.success('工单更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      loadTickets();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '更新失败');
    }
  };

  const handleView = (record: Ticket) => {
    setDrawerTicketId(record.id);
    setDrawerMode('view'); // 查看模式
    setDrawerOpen(true);
  };

  const handleProcess = (record: Ticket) => {
    // 处理逻辑：打开抽屉并进入处理模式
    setDrawerTicketId(record.id);
    setDrawerMode('process'); // 处理模式
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setDrawerTicketId(null);
  };

  // 表格列配置
  const columns = getTicketColumns(
    handleView,
    handleProcess,
    handleEdit,
    (record) => {
      if (!authUser) return false;
      const role = authUser.role.id;
      if (role === 'R_ADMIN' || role === 'R_LEAD') return true;
      if (role === 'R_AGENT' && record.assigneeId === authUser.user.id) return true;
      return false;
    },
    () => canEdit
  );

  return (
    <div className="ticket-list-page">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 筛选区域 */}
          <div className="filter-section">
            <Space wrap>
              <Input
                placeholder="搜索工单号/客户姓名/保单号"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
              <Select
                placeholder="处理状态"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                allowClear
              >
                {Object.entries(TICKET_STATUS).map(([key, val]) => (
                  <Select.Option key={key} value={key}>
                    {val.text}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="优先级"
                value={priorityFilter}
                onChange={setPriorityFilter}
                style={{ width: 110 }}
                allowClear
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                  <Select.Option key={key} value={key}>
                    {val.text}
                  </Select.Option>
                ))}
              </Select>
              <Select
                placeholder="渠道"
                value={channelFilter}
                onChange={setChannelFilter}
                style={{ width: 130 }}
                allowClear
              >
                {Object.entries(CHANNEL_TYPE_CONFIG).map(([key, val]) => (
                  <Select.Option key={key} value={key}>
                    {val.label}
                  </Select.Option>
                ))}
              </Select>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={['开始日期', '结束日期']}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出Excel
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                style={{ color: '#3370ff', borderColor: '#3370ff' }}
                onClick={() => setFeishuOpen(true)}
              >
                模拟收到飞书表单
              </Button>
              {canCreate && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新增工单
                </Button>
              )}
            </Space>
          </div>

          {/* 表格 */}
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
            onChange={handleTableChange}
            scroll={{ x: 3500 }}
          />
        </Space>
      </Card>

      {/* 新增工单弹窗 */}
      <Modal
        title="新增工单"
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        width={900}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <TicketForm form={createForm} isEdit={false} channels={channels} users={users} />
        </Form>
      </Modal>

      {/* 编辑工单弹窗 */}
      <Modal
        title="编辑工单"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <TicketForm form={editForm} isEdit={true} channels={channels} users={users} />
        </Form>
      </Modal>

      {/* 工单详情抽屉 */}
      <TicketDetailDrawer
        ticketId={drawerTicketId}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onUpdated={loadTickets}
        mode={drawerMode}
      />

      {/* 飞书进单表单 */}
      <FeishuFormModal
        open={feishuOpen}
        channels={channels}
        onClose={() => setFeishuOpen(false)}
        onSubmitted={loadTickets}
      />
    </div>
  );
}
