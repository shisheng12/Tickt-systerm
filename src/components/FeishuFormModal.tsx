import { useState } from 'react';
import { Modal, Form, Input, Select, Button, message, Space, Tag } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { Priority } from '../types';
import { receive, randomFormData, type FeishuFormPayload } from '../services/feishuFormService';
import { TICKET_CATEGORIES, PRIORITY_CONFIG } from '../constants/ticket';
import './FeishuFormModal.css';

const { TextArea } = Input;

interface FeishuFormModalProps {
  open: boolean;
  channels: { id: string; name: string; type: string }[];
  onClose: () => void;
  onSubmitted?: () => void; // 提交成功后通知刷新列表
}

export default function FeishuFormModal({
  open,
  channels,
  onClose,
  onSubmitted,
}: FeishuFormModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 一键填充随机模拟数据
  const handleFillRandom = () => {
    const data = randomFormData();
    form.setFieldsValue(data);
    message.info('已填充模拟表单数据');
  };

  const handleSubmit = async () => {
    try {
      const values = (await form.validateFields()) as FeishuFormPayload;
      setSubmitting(true);
      const ticket = await receive(values);
      message.success(`飞书表单已收到，生成工单 ${ticket.workOrderNumber}`);
      form.resetFields();
      onSubmitted?.();
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return; // 校验错误
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        <div className="feishu-modal-title">
          <span className="feishu-badge">飞书</span>
          <span>模拟飞书收集表单进单</span>
        </div>
      }
      width={560}
      destroyOnHidden
      footer={[
        <Button key="random" icon={<ThunderboltOutlined />} onClick={handleFillRandom}>
          随机填充
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
          提交进单
        </Button>,
      ]}
    >
      <div className="feishu-form-hint">
        模拟外部用户通过飞书收集表单提交问题，提交后生成来源为
        <Tag color="blue" style={{ margin: '0 4px' }}>
          feishu_form
        </Tag>
        的工单。
      </div>

      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Space style={{ display: 'flex' }} size="middle">
          <Form.Item
            label="提交人"
            name="submitterName"
            rules={[{ required: true, message: '请输入提交人' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="外部用户姓名" />
          </Form.Item>
          <Form.Item
            label="社群/渠道"
            name="channel"
            rules={[{ required: true, message: '请选择社群' }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择社群"
              options={channels.map(c => ({
                value: c.name,
                label: `${c.name}（${c.type === 'external' ? '外部' : '内部'}）`,
              }))}
            />
          </Form.Item>
        </Space>

        <Space style={{ display: 'flex' }} size="middle">
          <Form.Item
            label="客户姓名"
            name="customerName"
            rules={[{ required: true, message: '请输入客户姓名' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="客户姓名" />
          </Form.Item>
          <Form.Item
            label="客户手机号"
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="手机号" />
          </Form.Item>
        </Space>

        <Space style={{ display: 'flex' }} size="middle">
          <Form.Item
            label="问题分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择分类"
              showSearch
              optionFilterProp="label"
              options={TICKET_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
            />
          </Form.Item>
          <Form.Item
            label="优先级"
            name="priority"
            initialValue="medium"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select
              options={(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => ({
                value: p,
                label: PRIORITY_CONFIG[p].text,
              }))}
            />
          </Form.Item>
        </Space>

        <Form.Item label="项目（保司）" name="project">
          <Input placeholder="如：融盛、平安（可选）" />
        </Form.Item>

        <Form.Item
          label="问题描述"
          name="customerRequest"
          rules={[{ required: true, message: '请输入问题描述' }]}
        >
          <TextArea rows={3} placeholder="请描述客户诉求..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
