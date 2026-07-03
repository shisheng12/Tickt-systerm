// 工单新增/编辑表单组件 - 27个字段
import { Form, Input, Select, DatePicker, Row, Col, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Ticket, ComplaintLevel, ChannelType } from '../types';
import { TICKET_CATEGORIES, PRIORITY_CONFIG, SOURCE_CONFIG } from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG, COMPLAINT_LEVEL_CONFIG, COMPLETION_STATUS } from '../constants/complaintRules';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface TicketFormProps {
  form: FormInstance;
  isEdit: boolean;
  channels: { id: string; name: string }[];
  users: { id: string; name: string }[];
}

export default function TicketForm({ form, isEdit, channels, users }: TicketFormProps) {
  // 监听投诉等级变化，自动填充跟进要求
  const handleComplaintLevelChange = (level: ComplaintLevel) => {
    const config = COMPLAINT_LEVEL_CONFIG[level];
    form.setFieldsValue({
      followUpFrequency: config.followUpRequirement,
      firstResponseRequirement: config.firstResponseTime
    });
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="反馈时间"
            name="feedbackTime"
            rules={[{ required: true, message: '请选择反馈时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="项目（保司）"
            name="project"
            rules={[{ required: true, message: '请输入项目' }]}
          >
            <Input placeholder="如：融盛、平安" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="经纪主体"
            name="brokerageEntity"
            rules={[{ required: true, message: '请输入经纪主体' }]}
          >
            <Input placeholder="如：东方大地" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="支付渠道"
            name="paymentChannel"
            rules={[{ required: true, message: '请输入支付渠道' }]}
          >
            <Input placeholder="如：连连支付" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="内部订单号" name="internalOrderNumber">
            <Input placeholder="非必填" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="保单号"
            name="policyNumber"
            rules={[{ required: true, message: '请输入保单号' }]}
          >
            <Input placeholder="保单号" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="客户姓名"
            name="customerName"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="客户姓名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="客户电话"
            name="phone"
            rules={[
              { required: true, message: '请输入客户电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="手机号" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="客户诉求"
        name="customerRequest"
        rules={[{ required: true, message: '请输入客户诉求' }]}
      >
        <TextArea rows={3} placeholder="请详细描述客户诉求..." />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="保司侧是否核身"
            name="nuclearBodyStatus"
            rules={[{ required: true, message: '请选择核身状态' }]}
          >
            <Select placeholder="选择核身状态">
              <Select.Option value="是">是</Select.Option>
              <Select.Option value="否">否</Select.Option>
              <Select.Option value="待核实">待核实</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="客诉类别"
            name="category"
            rules={[{ required: true, message: '请选择客诉类别' }]}
          >
            <Select
              placeholder="选择客诉类别"
              showSearch
              optionFilterProp="label"
              options={TICKET_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
            />
          </Form.Item>
        </Col>
      </Row>

      {isEdit && (
        <>
          <Form.Item label="处理结果" name="processingResult">
            <TextArea rows={2} placeholder="处理记录汇总（只读）" disabled />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="联系次数" name="contactCount">
                <InputNumber style={{ width: '100%' }} disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="下次联系时间" name="nextContactTime">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="完结时间" name="completionTime">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="完结状态" name="completionStatus">
                <Select
                  placeholder="选择完结状态"
                  options={COMPLETION_STATUS.map(s => ({ value: s.value, label: s.label }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="跟进人" name="follower">
            <Input placeholder="跟进人" />
          </Form.Item>
        </>
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="来源"
            name="source"
            rules={[{ required: true, message: '请选择来源' }]}
          >
            <Select placeholder="选择来源">
              {Object.entries(SOURCE_CONFIG).map(([key, val]) => (
                <Select.Option key={key} value={key}>
                  {val.text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="渠道"
            name="channel"
            rules={[{ required: true, message: '请选择渠道' }]}
          >
            <Select placeholder="选择渠道">
              {Object.entries(CHANNEL_TYPE_CONFIG).map(([key, val]) => (
                <Select.Option key={key} value={key}>
                  {val.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="优先级"
            name="priority"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="选择优先级">
              {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                <Select.Option key={key} value={key}>
                  {val.text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="提交人" name="submitterName">
            <Input placeholder="提交人" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="投诉等级"
            name="complaintLevel"
            rules={[{ required: true, message: '请选择投诉等级' }]}
          >
            <Select placeholder="选择投诉等级" onChange={handleComplaintLevelChange}>
              {Object.entries(COMPLAINT_LEVEL_CONFIG).map(([key, val]) => (
                <Select.Option key={key} value={key}>
                  {val.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          {isEdit && (
            <Form.Item label="创建时间" name="createdAt">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" disabled />
            </Form.Item>
          )}
        </Col>
      </Row>

      <Form.Item label="跟进频次要求" name="followUpFrequency">
        <Input placeholder="自动根据投诉等级填充" disabled />
      </Form.Item>

      <Form.Item label="首响要求" name="firstResponseRequirement">
        <Input placeholder="自动根据投诉等级填充" disabled />
      </Form.Item>
    </>
  );
}
