# 工单列表重构集成指南

## 已完成的核心模块

### 1. 类型定义 (types/index.ts)
- ✅ 27个字段的 Ticket 类型
- ✅ ComplaintLevel, ChannelType 等新类型
- ✅ ColumnConfig（列配置个性化）

### 2. 常量配置
- ✅ constants/complaintRules.ts - 投诉等级规则
- ✅ COMPLAINT_LEVEL_CONFIG - 4个等级配置
- ✅ CHANNEL_TYPE_CONFIG - 5种渠道类型

### 3. Mock 数据 (mock/tickets.ts)
- ✅ 重构为27字段
- ✅ 50条示例数据
- ✅ 自动根据投诉等级设置跟进要求

### 4. 服务层 (services/ticketService.ts)
- ✅ createTicket 适配新字段
- ✅ 自动填充 followUpFrequency 和 firstResponseRequirement

### 5. 表格列配置 (pages/TicketListColumns.tsx)
- ✅ 27列完整定义
- ✅ 操作列（查看/处理/编辑）
- ✅ DEFAULT_VISIBLE_COLUMNS 默认可见列

### 6. 表单组件 (components/TicketForm.tsx)
- ✅ 27字段表单
- ✅ 新增/编辑模式
- ✅ 投诉等级变更自动填充跟进要求
- ✅ 只读字段（联系次数、处理结果等）

## TicketList.tsx 集成步骤

### 步骤1：导入新模块
```tsx
// 在 TicketList.tsx 顶部添加
import { getTicketColumns } from './TicketListColumns';
import TicketForm from '../components/TicketForm';
import { COMPLAINT_LEVEL_CONFIG } from '../constants/complaintRules';
```

### 步骤2：替换表格列定义
找到原来的 `columns` 定义（约300行），替换为：
```tsx
const columns = getTicketColumns(
  handleView,
  handleProcess,
  handleEdit,
  (record) => canProcessTicket(record.assigneeId),
  (record) => canEditTicket(record.assigneeId)
);
```

### 步骤3：更新新增工单弹窗表单
替换原 Modal 中的表单内容：
```tsx
<Modal
  title="新增工单"
  open={createModalVisible}
  onOk={handleCreateSubmit}
  onCancel={() => {
    setCreateModalVisible(false);
    createForm.resetFields();
  }}
  width={800}
  okText="创建"
  cancelText="取消"
>
  <Form form={createForm} layout="vertical">
    <TicketForm
      form={createForm}
      isEdit={false}
      channels={channels}
      users={users}
    />
  </Form>
</Modal>
```

### 步骤4：更新编辑工单弹窗表单
```tsx
<Modal
  title="编辑工单"
  open={editModalVisible}
  onOk={handleEditSubmit}
  onCancel={() => {
    setEditModalVisible(false);
    editForm.resetFields();
  }}
  width={800}
  okText="保存"
  cancelText="取消"
>
  <Form form={editForm} layout="vertical">
    <TicketForm
      form={editForm}
      isEdit={true}
      channels={channels}
      users={users}
    />
  </Form>
</Modal>
```

### 步骤5：更新 handleCreateSubmit
```tsx
const handleCreateSubmit = async () => {
  try {
    const values = await createForm.validateFields();
    // 转换日期字段
    const payload = {
      ...values,
      feedbackTime: values.feedbackTime?.toISOString(),
      nextContactTime: values.nextContactTime?.toISOString(),
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
```

### 步骤6：更新 handleEdit（打开编辑弹窗时回填数据）
```tsx
const handleEdit = (record: Ticket) => {
  setCurrentTicket(record);
  editForm.setFieldsValue({
    ...record,
    feedbackTime: record.feedbackTime ? dayjs(record.feedbackTime) : null,
    nextContactTime: record.nextContactTime ? dayjs(record.nextContactTime) : null,
    completionTime: record.completionTime ? dayjs(record.completionTime) : null,
    createdAt: record.createdAt ? dayjs(record.createdAt) : null,
  });
  setEditModalVisible(true);
};
```

## 列配置个性化（可选高级功能）

### 创建列设置组件 (components/ColumnSettings.tsx)
```tsx
import { Modal, Checkbox, Tree } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

// 实现拖拽排序 + 显示/隐藏
// 使用 @dnd-kit/sortable 或 react-beautiful-dnd
```

### localStorage 持久化
```tsx
const COLUMN_CONFIG_KEY = 'ticket_list_column_config';

// 保存
localStorage.setItem(COLUMN_CONFIG_KEY, JSON.stringify(columnConfig));

// 读取
const saved = localStorage.getItem(COLUMN_CONFIG_KEY);
const columnConfig = saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
```

## TicketDetailDrawer 重构要点

### 更新字段展示（27字段）
```tsx
<Descriptions column={2}>
  <Descriptions.Item label="工单号">{ticket.workOrderNumber}</Descriptions.Item>
  <Descriptions.Item label="反馈时间">{dayjs(ticket.feedbackTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
  <Descriptions.Item label="项目">{ticket.project}</Descriptions.Item>
  <Descriptions.Item label="经纪主体">{ticket.brokerageEntity}</Descriptions.Item>
  <Descriptions.Item label="支付渠道">{ticket.paymentChannel}</Descriptions.Item>
  <Descriptions.Item label="内部订单号">{ticket.internalOrderNumber || '-'}</Descriptions.Item>
  {/* ...其他25个字段 */}
  <Descriptions.Item label="投诉等级">
    <Tag color={COMPLAINT_LEVEL_CONFIG[ticket.complaintLevel].color}>
      {ticket.complaintLevel}
    </Tag>
  </Descriptions.Item>
  <Descriptions.Item label="跟进频次">{ticket.followUpFrequency}</Descriptions.Item>
  <Descriptions.Item label="首响要求">{ticket.firstResponseRequirement}</Descriptions.Item>
</Descriptions>
```

### 处理逻辑调整
- 移除责任人、创建人字段
- 联系次数 = processLogs.length
- 处理时上传材料：processLogs[i].attachments

## 导出工具适配 (utils/exportUtil.ts)

### 更新 ticketsToRows 函数
```tsx
function ticketsToRows(tickets: Ticket[]): any[][] {
  const headers = [
    '反馈时间', '项目', '经纪主体', '支付渠道', '工单号',
    '内部订单号', '保单号', '客户姓名', '客户电话', '客户诉求',
    '保司侧是否核身', '客诉类别', '处理结果', '联系次数', '下次联系时间',
    '完结时间', '完结状态', '跟进人', '来源', '渠道',
    '优先级', '处理状态', '创建时间', '提交人',
    '投诉等级', '跟进频次', '首响要求'
  ];

  const rows = tickets.map(ticket => [
    dayjs(ticket.feedbackTime).format('YYYY-MM-DD HH:mm'),
    ticket.project,
    ticket.brokerageEntity,
    ticket.paymentChannel,
    ticket.workOrderNumber,
    ticket.internalOrderNumber || '',
    ticket.policyNumber,
    ticket.customerName,
    ticket.phone,
    ticket.customerRequest,
    ticket.nuclearBodyStatus,
    ticket.category,
    ticket.processingResult,
    ticket.contactCount,
    ticket.nextContactTime ? dayjs(ticket.nextContactTime).format('YYYY-MM-DD HH:mm') : '',
    ticket.completionTime ? dayjs(ticket.completionTime).format('YYYY-MM-DD HH:mm') : '',
    ticket.completionStatus,
    ticket.follower,
    SOURCE_CONFIG[ticket.source]?.text || ticket.source,
    ticket.channel,
    PRIORITY_CONFIG[ticket.priority]?.text || ticket.priority,
    TICKET_STATUS[ticket.status]?.text || ticket.status,
    dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm'),
    ticket.submitterName,
    ticket.complaintLevel,
    ticket.followUpFrequency,
    ticket.firstResponseRequirement
  ]);

  return [headers, ...rows];
}
```

## 验证检查清单

- [ ] TypeScript 编译无错误
- [ ] 新增工单表单所有字段可填写
- [ ] 投诉等级变更自动填充跟进要求
- [ ] 表格显示27列
- [ ] 查看/处理/编辑按钮正常
- [ ] 导出Excel包含27列
- [ ] Dashboard 兼容新字段

## 已知限制

1. 列配置个性化需额外引入拖拽库（@dnd-kit/sortable）
2. TicketDetailDrawer 需手动更新27字段展示
3. feishuFormService 需适配新字段（已在 createTicket 中兼容）

## 下一步

完整重构的剩余工作可以渐进式完成，当前核心模块已可用。
