// 角色管理页面 - 角色CRUD + 权限编辑 + 成员展示
import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Checkbox,
  Spin,
  Tooltip,
  Avatar,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  ReloadOutlined,
  TeamOutlined,
  SaveOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Role, User, Permission } from '../types';
import {
  getRoles,
  getUsers,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions
} from '../services/roleService';
import { PERMISSION_DEFS, PERMISSION_GROUPS, PERMISSION_TYPE_LABELS } from '../constants/permission';
import type { PermissionType } from '../constants/permission';
import './RoleManage.css';

interface RoleFormData {
  name: string;
  description: string;
  level: number;
}

// 权限分组（按功能模块）
interface PermissionGroup {
  key: string;
  label: string;
  permissions: {
    page: typeof PERMISSION_DEFS;
    data: typeof PERMISSION_DEFS;
    action: typeof PERMISSION_DEFS;
  };
}

export default function RoleManage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 新增/编辑角色弹窗
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm<RoleFormData>();

  // 权限编辑抽屉
  const [permDrawerVisible, setPermDrawerVisible] = useState(false);
  const [editingPermRole, setEditingPermRole] = useState<Role | null>(null);
  const [permSet, setPermSet] = useState<Set<Permission>>(new Set());
  const [permDirty, setPermDirty] = useState(false);
  const [permSaving, setPermSaving] = useState(false);

  // 成员展示抽屉
  const [memberDrawerVisible, setMemberDrawerVisible] = useState(false);
  const [viewingMemberRole, setViewingMemberRole] = useState<Role | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([getRoles(), getUsers()]);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (error: any) {
      message.error(error.message || '加载失败');
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
      loadData();
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
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 打开权限编辑抽屉
  const handleEditPermissions = (role: Role) => {
    setEditingPermRole(role);
    setPermSet(new Set(role.permissions));
    setPermDirty(false);
    setPermDrawerVisible(true);
  };

  // 切换权限
  const togglePermission = (permKey: Permission, checked: boolean) => {
    setPermSet(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(permKey);
      } else {
        next.delete(permKey);
      }
      return next;
    });
    setPermDirty(true);
  };

  // 保存权限
  const handleSavePermissions = async () => {
    if (!editingPermRole) return;

    setPermSaving(true);
    try {
      const newPerms = Array.from(permSet);
      await updateRolePermissions(editingPermRole.id, newPerms);
      message.success('权限已保存');
      setPermDrawerVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setPermSaving(false);
    }
  };

  // 打开成员展示抽屉
  const handleViewMembers = (role: Role) => {
    setViewingMemberRole(role);
    setMemberDrawerVisible(true);
  };

  // 每个角色的成员数量统计
  const getRoleMemberCount = (roleId: string) => users.filter(u => u.roleId === roleId).length;

  // 获取角色成员列表
  const getRoleMembers = (roleId: string) => users.filter(u => u.roleId === roleId);

  // 按分组组织权限
  const permissionGroups: PermissionGroup[] = PERMISSION_GROUPS.map(group => ({
    key: group.key,
    label: group.label,
    permissions: {
      page: PERMISSION_DEFS.filter(p => p.group === group.key && p.type === 'page'),
      data: PERMISSION_DEFS.filter(p => p.group === group.key && p.type === 'data'),
      action: PERMISSION_DEFS.filter(p => p.group === group.key && p.type === 'action')
    }
  })).filter(group =>
    group.permissions.page.length > 0 ||
    group.permissions.data.length > 0 ||
    group.permissions.action.length > 0
  );

  // 角色列表表格列
  const roleColumns: ColumnsType<Role> = [
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
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleViewMembers(record)}
        >
          {getRoleMemberCount(record.id)} 人
        </Button>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handleEditPermissions(record)}
          >
            编辑权限
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增角色
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={roleColumns}
            dataSource={roles}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个角色`
            }}
          />
        </Spin>
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

      {/* 权限编辑抽屉 */}
      <Drawer
        title={
          <Space>
            <SafetyOutlined />
            <span>编辑权限 - {editingPermRole?.name}</span>
          </Space>
        }
        width={720}
        open={permDrawerVisible}
        onClose={() => {
          if (permDirty) {
            Modal.confirm({
              title: '有未保存的更改',
              content: '确定要关闭吗？未保存的更改将丢失。',
              okText: '确定关闭',
              cancelText: '继续编辑',
              onOk: () => {
                setPermDrawerVisible(false);
                setPermDirty(false);
              }
            });
          } else {
            setPermDrawerVisible(false);
          }
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              {permDirty && <Tag color="orange">有未保存的更改</Tag>}
              <Button onClick={() => setPermDrawerVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={permSaving}
                disabled={!permDirty}
                onClick={handleSavePermissions}
              >
                保存权限
              </Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
            已选择 {permSet.size} 个权限点，按功能模块分组，每组包含页面、数据、操作三类权限
          </div>
          <div>
            {permissionGroups.map(group => {
              const hasPermissions =
                group.permissions.page.length > 0 ||
                group.permissions.data.length > 0 ||
                group.permissions.action.length > 0;

              if (!hasPermissions) return null;

              return (
                <div key={group.key} style={{ marginBottom: 32 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottom: '2px solid #1890ff',
                    color: '#1890ff'
                  }}>
                    {group.label}
                  </div>

                  {/* 页面权限 */}
                  {group.permissions.page.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 8,
                        color: '#52c41a'
                      }}>
                        <Tag color="green" style={{ marginRight: 8 }}>页面权限</Tag>
                        控制能否访问该模块页面
                      </div>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        {group.permissions.page.map(perm => (
                          <div key={perm.key} style={{
                            padding: '10px 12px',
                            background: permSet.has(perm.key) ? '#f6ffed' : '#fafafa',
                            borderRadius: 6,
                            border: `1px solid ${permSet.has(perm.key) ? '#b7eb8f' : '#d9d9d9'}`,
                            transition: 'all 0.3s'
                          }}>
                            <Checkbox
                              checked={permSet.has(perm.key)}
                              onChange={e => togglePermission(perm.key, e.target.checked)}
                            >
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{perm.label}</div>
                                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                  {perm.desc}
                                </div>
                                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                                  {perm.key}
                                </div>
                              </div>
                            </Checkbox>
                          </div>
                        ))}
                      </Space>
                    </div>
                  )}

                  {/* 数据权限 */}
                  {group.permissions.data.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 8,
                        color: '#1890ff'
                      }}>
                        <Tag color="blue" style={{ marginRight: 8 }}>数据权限</Tag>
                        控制能查看哪些数据范围
                      </div>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        {group.permissions.data.map(perm => (
                          <div key={perm.key} style={{
                            padding: '10px 12px',
                            background: permSet.has(perm.key) ? '#e6f7ff' : '#fafafa',
                            borderRadius: 6,
                            border: `1px solid ${permSet.has(perm.key) ? '#91d5ff' : '#d9d9d9'}`,
                            transition: 'all 0.3s'
                          }}>
                            <Checkbox
                              checked={permSet.has(perm.key)}
                              onChange={e => togglePermission(perm.key, e.target.checked)}
                            >
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{perm.label}</div>
                                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                  {perm.desc}
                                </div>
                                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                                  {perm.key}
                                </div>
                              </div>
                            </Checkbox>
                          </div>
                        ))}
                      </Space>
                    </div>
                  )}

                  {/* 操作权限 */}
                  {group.permissions.action.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 8,
                        color: '#fa8c16'
                      }}>
                        <Tag color="orange" style={{ marginRight: 8 }}>操作权限</Tag>
                        控制能使用哪些操作按钮
                      </div>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        {group.permissions.action.map(perm => (
                          <div key={perm.key} style={{
                            padding: '10px 12px',
                            background: permSet.has(perm.key) ? '#fff7e6' : '#fafafa',
                            borderRadius: 6,
                            border: `1px solid ${permSet.has(perm.key) ? '#ffd591' : '#d9d9d9'}`,
                            transition: 'all 0.3s'
                          }}>
                            <Checkbox
                              checked={permSet.has(perm.key)}
                              onChange={e => togglePermission(perm.key, e.target.checked)}
                            >
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{perm.label}</div>
                                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                  {perm.desc}
                                </div>
                                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                                  {perm.key}
                                </div>
                              </div>
                            </Checkbox>
                          </div>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>

      {/* 成员展示抽屉 */}
      <Drawer
        title={
          <Space>
            <TeamOutlined />
            <span>成员列表 - {viewingMemberRole?.name}</span>
          </Space>
        }
        width={600}
        open={memberDrawerVisible}
        onClose={() => setMemberDrawerVisible(false)}
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          该角色共有 {viewingMemberRole ? getRoleMemberCount(viewingMemberRole.id) : 0} 名成员。
          成员管理操作请前往用户列表页面。
        </div>

        {viewingMemberRole && getRoleMembers(viewingMemberRole.id).length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {getRoleMembers(viewingMemberRole.id).map(user => (
              <div
                key={user.id}
                style={{
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0'
                }}
              >
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {user.email} · {user.team}
                    </div>
                  </div>
                </Space>
              </div>
            ))}
          </Space>
        ) : (
          <Empty description="该角色暂无成员" />
        )}
      </Drawer>
    </div>
  );
}
