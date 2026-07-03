// 用户管理页面 - 用户CRUD、密码配置、角色分配
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Switch,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  ReloadOutlined,
  KeyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { User } from '../types';
import { getUsers, createUser, updateUser, deleteUser, changePassword } from '../services/roleService';
import { getRoles } from '../services/roleService';
import './UserManage.css';

interface UserFormData {
  username: string;
  name: string;
  password?: string;
  roleId: string;
  team: string;
  email?: string;
  phone?: string;
  active: boolean;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export default function UserManage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 新增/编辑用户弹窗
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormData>();

  // 修改密码弹窗
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordForm] = Form.useForm<PasswordFormData>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开新增用户弹窗
  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalVisible(true);
  };

  // 打开编辑用户弹窗
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      team: user.team,
      email: user.email,
      phone: user.phone,
      active: user.active
    });
    setModalVisible(true);
  };

  // 保存用户（新增或编辑）
  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        // 编辑（不包含密码）
        const { password, ...updateData } = values;
        await updateUser(editingUser.id, updateData);
        message.success('用户更新成功');
      } else {
        // 新增（必须包含密码）
        if (!values.password) {
          message.error('请输入初始密码');
          return;
        }
        await createUser(values as any);
        message.success('用户创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '操作失败');
    }
  };

  // 删除用户
  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      message.success('用户删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 打开修改密码弹窗
  const handleChangePassword = (user: User) => {
    setPasswordUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  // 保存新密码
  const handleSavePassword = async () => {
    if (!passwordUser) return;

    try {
      const values = await passwordForm.validateFields();
      await changePassword(passwordUser.id, values.newPassword);
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '修改失败');
    }
  };

  // 切换用户状态
  const handleToggleActive = async (user: User, active: boolean) => {
    try {
      await updateUser(user.id, { active });
      message.success(active ? '用户已启用' : '用户已禁用');
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text) => <Tag icon={<UserOutlined />} color="blue">{text}</Tag>
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '角色',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 120,
      render: (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        return role ? <Tag color="purple">{role.name}</Tag> : '-';
      }
    },
    {
      title: '团队',
      dataIndex: 'team',
      key: 'team',
      width: 120
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      align: 'center',
      render: (active: boolean, record) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="修改密码">
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleChangePassword(record)}
            >
              改密
            </Button>
          </Tooltip>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            description={`删除用户 ${record.name} 后无法恢复`}
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="user-manage-page">
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>用户管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增用户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个用户`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSaveUser}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名只能包含字母、数字、下划线，3-20个字符' }
            ]}
            tooltip="用于登录，不可重复"
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="登录用户名"
              disabled={!!editingUser}
            />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="初始密码"
              name="password"
              rules={[
                { required: true, message: '请输入初始密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
              tooltip="创建后可通过改密功能修改"
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="初始密码"
              />
            </Form.Item>
          )}

          <Form.Item
            label="姓名"
            name="name"
            rules={[
              { required: true, message: '请输入姓名' },
              { max: 20, message: '姓名最多20个字符' }
            ]}
          >
            <Input placeholder="真实姓名" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="roleId"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色" options={roles.map(r => ({ value: r.id, label: r.name }))} />
          </Form.Item>

          <Form.Item
            label="团队"
            name="team"
            rules={[{ required: true, message: '请输入团队' }]}
          >
            <Input placeholder="如：客服一组" />
          </Form.Item>

          <Form.Item label="邮箱" name="email">
            <Input type="email" placeholder="user@example.com" />
          </Form.Item>

          <Form.Item label="电话" name="phone">
            <Input placeholder="手机号" />
          </Form.Item>

          <Form.Item label="状态" name="active" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码弹窗 */}
      <Modal
        title={<Space><KeyOutlined />修改密码 - {passwordUser?.name}</Space>}
        open={passwordModalVisible}
        onOk={handleSavePassword}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        width={500}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="再次输入新密码"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
