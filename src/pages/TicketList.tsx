import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Card,
  message,
  Modal,
  Form,
  Row,
  Col,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import type { TablePaginationConfig, TableRowSelection } from 'antd/es/table';
import type { Ticket, TicketStatus, Priority, ChannelType } from '../types';
import { queryTickets, createTicket, batchAssign } from '../services/ticketService';
import { getUsers } from '../services/roleService';
import { getChannels } from '../services/channelService';
import { useAuth } from '../hooks/usePermission';
import { TICKET_STATUS, PRIORITY_CONFIG, SOURCE_CONFIG } from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG, COMPLAINT_LEVEL_CONFIG } from '../constants/complaintRules';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import TicketProcessDrawer from '../components/TicketProcessDrawer';
import FeishuFormModal from '../components/FeishuFormModal';
import TicketForm from '../components/TicketForm';
import { getTicketColumns } from './TicketListColumns';
import { exportTicketsByFormat } from '../utils/exportUtil';
import './TicketList.css';

const { RangePicker } = DatePicker;

const MAX_EXPORT = 5000; // 单次导出上限

export default function TicketList() {
  const authUser = useAuth();
  const canCreate = useAuth() && authUser?.role?.permissions?.includes('ticket.create');
  const canAssign = useAuth() && authUser?.role?.permissions?.includes('ticket.assign');
  const [searchParams] = useSearchParams();

  // 数据状态
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [channelFilter, setChannelFilter] = useState<ChannelType | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [complaintLevelFilter, setComplaintLevelFilter] = useState<string | undefined>();
  const [phoneFilter, setPhoneFilter] = useState('');
  const [policyNumberFilter, setPolicyNumberFilter] = useState('');
  const [hasContactedFilter, setHasContactedFilter] = useState<string | undefined>();

  // 查询参数
  const [queryParams, setQueryParams] = useState({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // 多选状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Ticket[]>([]);

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTicketId, setDrawerTicketId] = useState<string | null>(null);
  const [feishuOpen, setFeishuOpen] = useState(false);

  // 分配弹窗
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [assignMode, setAssignMode] = useState<'single' | 'batch'>('single');
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);

  const [createForm] = Form.useForm();

  // 辅助数据
  const [users, setUsers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    loadAuxData();
  }, []);

  // 从 URL 参数初始化筛选条件（Dashboard卡片跳转）
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    const channelFromUrl = searchParams.get('channel');
    const complaintLevelFromUrl = searchParams.get('complaintLevel');
    const keywordFromUrl = searchParams.get('keyword');
    const policyFromUrl = searchParams.get('policyNumber');

    let hasFilter = false;

    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
      hasFilter = true;
    }
    if (channelFromUrl) {
      setChannelFilter(channelFromUrl as any);
      hasFilter = true;
    }
    if (complaintLevelFromUrl) {
      setComplaintLevelFilter(complaintLevelFromUrl);
      hasFilter = true;
    }
    if (keywordFromUrl) {
      setKeyword(keywordFromUrl);
      hasFilter = true;
    }
    if (policyFromUrl) {
      setPolicyNumberFilter(policyFromUrl);
      hasFilter = true;
    }

    if (hasFilter) {
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
      message.error('加载基础数据失败');
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {
        ...queryParams,
        keyword,
        status: statusFilter,
        priority: priorityFilter,
        channel: channelFilter,
        complaintLevel: complaintLevelFilter,
        phone: phoneFilter,
        policyNumber: policyNumberFilter,
        hasContacted: hasContactedFilter,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD')
      };
      const result = await queryTickets(params as any);
      setTickets(result.data);
      setTotal(result.total);
    } catch (error: any) {
      message.error(error.message || '加载工单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQueryParams({ ...queryParams, page: 1 });
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setChannelFilter(undefined);
    setComplaintLevelFilter(undefined);
    setPhoneFilter('');
    setPolicyNumberFilter('');
    setHasContactedFilter(undefined);
    setDateRange(null);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setQueryParams({ page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setQueryParams({
      ...queryParams,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10
    });
  };

  // 多选配置
  const rowSelection: TableRowSelection<Ticket> = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows);
    }
  };

  // 打开处理抽屉
  const handleProcess = (record: Ticket) => {
    setDrawerTicketId(record.id);
    setDrawerOpen(true);
  };

  // 关闭抽屉
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setDrawerTicketId(null);
  };

  // 新增工单
  const handleCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      feedbackTime: dayjs(),
      nuclearBodyStatus: '否',
      source: 'manual',
      channel: '保司',
      priority: 'medium',
      complaintLevel: '一般工单',
      followUpFrequency: '至少3天1次',
      firstResponseRequirement: '分派后4小时内触达',
      hasContacted: false
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
      await createTicket(payload as any);
      message.success('工单创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadTickets();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '创建失败');
    }
  };

  // 导出Excel（支持多选/筛选/上限5000条）
  const handleExport = async () => {
    try {
      setLoading(true);
      // 决定导出的工单
      let exportTickets: Ticket[];
      if (selectedRowKeys.length > 0) {
        // 导出选中的工单
        exportTickets = selectedRows;
        message.info(`导出选中的 ${exportTickets.length} 条工单`);
      } else {
        // 导出当前筛选条件下的工单
        const params = {
          ...queryParams,
          keyword,
          status: statusFilter,
          priority: priorityFilter,
          channel: channelFilter,
          complaintLevel: complaintLevelFilter,
          phone: phoneFilter,
          policyNumber: policyNumberFilter,
          hasContacted: hasContactedFilter,
          startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
          endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
          pageSize: MAX_EXPORT,
          page: 1
        };
        const result = await queryTickets(params as any);
        exportTickets = result.data.slice(0, MAX_EXPORT);
        message.info(`导出当前筛选的 ${exportTickets.length} 条工单（最多${MAX_EXPORT}条）`);
      }

      if (exportTickets.length === 0) {
        message.warning('没有可导出的工单');
        return;
      }

      exportTicketsByFormat(exportTickets, 'xlsx', `工单导出_${dayjs().format('YYYYMMDD_HHmmss')}`);
      message.success(`成功导出 ${exportTickets.length} 条工单`);
    } catch (error: any) {
      message.error('导出失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 打开分配弹窗
  const handleOpenAssign = (record?: Ticket) => {
    assignForm.resetFields();
    if (record) {
      // 单条分配
      setAssignMode('single');
      setAssigningTicket(record);
    } else {
      // 批量分配
      setAssignMode('batch');
      setAssigningTicket(null);
    }
    setAssignModalVisible(true);
  };

  // 确认分配
  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      let ticketIds: string[];
      if (assignMode === 'single' && assigningTicket) {
        ticketIds = [assigningTicket.id];
      } else {
        ticketIds = selectedRowKeys.map(k => String(k));
      }

      if (ticketIds.length === 0) {
        message.warning('请选择要分配的工单');
        return;
      }

      await batchAssign(ticketIds, values.assigneeId);
      message.success(`成功分配 ${ticketIds.length} 个工单`);
      setAssignModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      loadTickets();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '分配失败');
    }
  };

  // 表格列配置
  const columns = getTicketColumns(
    handleProcess,
    () => handleOpenAssign(),
    (record) => {
      if (!authUser) return false;
      const role = authUser.role.id;
      if (role === 'R_ADMIN' || role === 'R_LEAD') return true;
      if (role === 'R_AGENT' && record.assigneeId === authUser.user.id) return true;
      return false;
    }
  );

  return (
    <div className="ticket-list-page">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 筛选区域 */}
          <div className="filter-section">
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="工单号/客户姓名/保单号"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Input
                  placeholder="保单号"
                  value={policyNumberFilter}
                  onChange={(e) => setPolicyNumberFilter(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Input
                  placeholder="客户电话"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="处理状态"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {Object.entries(TICKET_STATUS).map(([key, val]) => (
                    <Select.Option key={key} value={key}>
                      {val.text}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="优先级"
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                    <Select.Option key={key} value={key}>
                      {val.text}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="反馈渠道"
                  value={channelFilter}
                  onChange={setChannelFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {Object.entries(CHANNEL_TYPE_CONFIG).map(([key, val]) => (
                    <Select.Option key={key} value={key}>
                      {val.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="投诉等级"
                  value={complaintLevelFilter}
                  onChange={setComplaintLevelFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {Object.entries(COMPLAINT_LEVEL_CONFIG).map(([key, val]) => (
                    <Select.Option key={key} value={key}>
                      {val.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="曾进线"
                  value={hasContactedFilter}
                  onChange={setHasContactedFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Select.Option value="true">是</Select.Option>
                  <Select.Option value="false">否</Select.Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Col>
              <Col xs={24} md={24}>
                <Space wrap>
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
              </Col>
            </Row>
          </div>

          {/* 表格区 */}
          <div>
            {/* 多选时的批量操作栏 */}
            {selectedRowKeys.length > 0 && (
              <div style={{ marginBottom: 12, padding: '8px 16px', background: '#e6f4ff', borderRadius: 4 }}>
                <Space>
                  <span>已选择 <strong style={{ color: '#3d7fff' }}>{selectedRowKeys.length}</strong> 项</span>
                  {canAssign && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<UserAddOutlined />}
                      onClick={() => handleOpenAssign()}
                    >
                      批量分配
                    </Button>
                  )}
                  <Button size="small" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                  </Button>
                </Space>
              </div>
            )}

            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              loading={loading}
              rowSelection={rowSelection}
              scroll={{ x: 3500 }}
              pagination={{
                current: queryParams.page,
                pageSize: queryParams.pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              onChange={handleTableChange}
            />
          </div>
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
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical">
          <TicketForm form={createForm} isEdit={false} channels={channels} users={users} />
        </Form>
      </Modal>

      {/* 批量分配弹窗 */}
      <Modal
        title={assignMode === 'single' ? '分配工单' : `批量分配 ${selectedRowKeys.length} 个工单`}
        open={assignModalVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={false}
        okText="确认分配"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            label="选择责任人"
            name="assigneeId"
            rules={[{ required: true, message: '请选择责任人' }]}
          >
            <Select
              placeholder="选择客服人员"
              showSearch
              optionFilterProp="label"
              options={users
                .filter(u => u.roleId === 'R_AGENT' || u.roleId === 'R_LEAD')
                .map(u => ({ value: u.id, label: `${u.name}（${u.team}）` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 工单处理抽屉 */}
      <TicketProcessDrawer
        ticketId={drawerTicketId}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onUpdated={loadTickets}
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