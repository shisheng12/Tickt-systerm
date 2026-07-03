// 角色管理页面 - 角色CRUD、权限配置
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Tree,
  Tabs,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Role, Permission } from '../types';
import { getRoles, createRole, updateRole, deleteRole, updateRolePermissions } from '../services/roleService';
import { PERMISSION_DEFS, PERMISSION_GROUPS } from '../constants/permission';
import './RoleManage.css';

interface RoleFormData {
  name: string;
  description: string;
  level: number;
}

export default function RoleManage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // 新增/编辑角色弹窗
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm<RoleFormData>();

  // 权限配置弹窗
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [configuringRole, setConfiguringRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error: any) {
      message.error(error.message || '加载角色失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开新增角色弹窗
  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ level: 1 });
    setModalVisible(true);
  };

  // 打开编辑角色弹窗
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      level: role.level
    });
    setModalVisible(true);
  };

  // 保存角色（新增或编辑）
  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();

      if (editingRole) {
        // 编辑
        await updateRole(editingRole.id, values);
        message.success('角色更新成功');
      } else {
        // 新增
        await createRole(values);
        message.success('角色创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadRoles();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '操作失败');
    }
  };

  // 删除角色
  const handleDelete = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      message.success('角色删除成功');
      loadRoles();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 打开权限配置弹窗
  const handleConfigPermissions = (role: Role) => {
    setConfiguringRole(role);
    setSelectedPermissions([...role.permissions]);
    setPermModalVisible(true);
  };

  // 保存权限配置
  const handleSavePermissions = async () => {
    if (!configuringRole) return;

    try {
      await updateRolePermissions(configuringRole.id, selectedPermissions);
      message.success('权限配置保存成功');
      setPermModalVisible(false);
      loadRoles();
    } catch (error: any) {
      message.error(error.message || '保存失败');
    }
  };

  // 构建权限树数据
  const buildPermissionTree = () => {
    return Object.entries(PERMISSION_GROUPS).map(([groupKey, groupName]) => ({
      title: groupName,
      key: groupKey,
      children: Object.entries(PERMISSION_DEFS)
        .filter(([key]) => key.startsWith(groupKey))
        .map(([key, def]) => ({
          title: `${def.label} - ${def.desc}`,
          key,
        }))
    }));
  };

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '权限级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      align: 'center',
      render: (level: number) => (
        <Tag color={level >= 3 ? 'red' : level >= 2 ? 'orange' : 'default'}>
          Level {level}
        </Tag>
      )
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permCount',
      width: 100,
      align: 'center',
      render: (perms: Permission[]) => (
        <Tag color="green">{perms.length} 个</Tag>
      )
    },
    {
      title: '成员数量',
      key: 'memberCount',
      width: 100,
      align: 'center',
      render: () => <Tag>0 人</Tag> // TODO: 统计成员数量
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handleConfigPermissions(record)}
          >
            配置权限
          </Button>
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
            description="删除角色后，关联用户将失去权限"
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
    <div className="role-manage-page">
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>角色管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadRoles}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增角色
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个角色`
          }}
        />
      </Card>

      {/* 新增/编辑角色弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSaveRole}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色名称"
            name="name"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 20, message: '角色名称最多20个字符' }
            ]}
          >
            <Input placeholder="如：客服专员、质检主管" />
          </Form.Item>

          <Form.Item
            label="角色描述"
            name="description"
            rules={[
              { required: true, message: '请输入角色描述' },
              { max: 100, message: '描述最多100个字符' }
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="描述该角色的职责和权限范围"
            />
          </Form.Item>

          <Form.Item
            label="权限级别"
            name="level"
            rules={[{ required: true, message: '请输入权限级别' }]}
            tooltip="数字越大权限越高，1=基础权限，2=中级权限，3=高级权限"
          >
            <Input type="number" min={1} max={5} placeholder="1-5" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限配置弹窗 */}
      <Modal
        title={`配置权限 - ${configuringRole?.name}`}
        open={permModalVisible}
        onOk={handleSavePermissions}
        onCancel={() => setPermModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          当前已选择 <Tag color="blue">{selectedPermissions.length}</Tag> 个权限
        </div>

        <Tree
          checkable
          defaultExpandAll
          treeData={buildPermissionTree()}
          checkedKeys={selectedPermissions}
          onCheck={(checked) => {
            setSelectedPermissions(checked as Permission[]);
          }}
        />
      </Modal>
    </div>
  );
}
