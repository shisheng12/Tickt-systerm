import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Checkbox,
  Button,
  Space,
  message,
  Tag,
  Tabs,
  Transfer,
  Spin,
  Popconfirm,
  Tooltip
} from 'antd';
import { SaveOutlined, TeamOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TransferProps } from 'antd';
import type { Role, User, Permission } from '../types';
import {
  getRoles,
  getUsers,
  updateRolePermissions,
  assignUserRole
} from '../services/roleService';
import { PERMISSION_DEFS, PERMISSION_GROUPS } from '../constants/permission';
import { useAuth } from '../hooks/usePermission';
import './PermissionManage.css';

// 矩阵表格的行类型
interface MatrixRow {
  key: string;
  group: string;
  permKey: Permission;
  label: string;
  desc: string;
}

export default function PermissionManage() {
  const authUser = useAuth();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 权限矩阵的本地编辑状态：roleId -> Set<Permission>
  const [matrix, setMatrix] = useState<Record<string, Set<Permission>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // 成员分配当前选中的角色
  const [activeRoleId, setActiveRoleId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, usersData] = await Promise.all([getRoles(), getUsers()]);
      setRoles(rolesData);
      setUsers(usersData);

      // 初始化矩阵状态
      const initMatrix: Record<string, Set<Permission>> = {};
      rolesData.forEach(r => {
        initMatrix[r.id] = new Set(r.permissions);
      });
      setMatrix(initMatrix);
      setDirty(false);

      if (rolesData.length && !activeRoleId) {
        setActiveRoleId(rolesData[0].id);
      }
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换单个权限点
  const togglePermission = (roleId: string, permKey: Permission, checked: boolean) => {
    setMatrix(prev => {
      const next = { ...prev };
      const set = new Set(next[roleId]);
      if (checked) {
        set.add(permKey);
      } else {
        set.delete(permKey);
      }
      next[roleId] = set;
      return next;
    });
    setDirty(true);
  };

  // 保存权限矩阵
  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      // 逐个角色保存变更
      for (const role of roles) {
        const newPerms = Array.from(matrix[role.id] || []);
        const oldPerms = role.permissions;
        // 仅当有变化时才提交
        const changed =
          newPerms.length !== oldPerms.length ||
          newPerms.some(p => !oldPerms.includes(p));
        if (changed) {
          await updateRolePermissions(role.id, newPerms);
        }
      }
      message.success('权限矩阵已保存，界面权限即时生效');
      await loadData();
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 构建矩阵表格数据
  const matrixRows: MatrixRow[] = PERMISSION_DEFS.map(def => ({
    key: def.key,
    group: def.group,
    permKey: def.key,
    label: def.label,
    desc: def.desc
  }));

  // 矩阵表格列：权限点 + 每个角色一列
  const matrixColumns: ColumnsType<MatrixRow> = [
    {
      title: '权限点',
      dataIndex: 'label',
      key: 'label',
      fixed: 'left',
      width: 220,
      render: (label, record) => (
        <Tooltip title={record.desc}>
          <div>
            <div style={{ fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.permKey}</div>
          </div>
        </Tooltip>
      )
    },
    ...roles.map(role => ({
      title: (
        <div style={{ textAlign: 'center' as const }}>
          <div>{role.name}</div>
          <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>
            {matrix[role.id]?.size || 0} 项
          </Tag>
        </div>
      ),
      key: role.id,
      align: 'center' as const,
      width: 140,
      render: (_: unknown, record: MatrixRow) => (
        <Checkbox
          checked={matrix[role.id]?.has(record.permKey) || false}
          onChange={e => togglePermission(role.id, record.permKey, e.target.checked)}
        />
      )
    }))
  ];

  // 成员分配：Transfer 数据源（所有用户）
  const transferDataSource = users.map(u => ({
    key: u.id,
    title: `${u.name}（${u.team}）`,
    description: u.email
  }));

  // 当前角色的成员（作为 Transfer 右侧 targetKeys）
  const targetKeys = users.filter(u => u.roleId === activeRoleId).map(u => u.id);

  // 成员分配变更
  const handleTransferChange: TransferProps['onChange'] = async (nextTargetKeys, direction, moveKeys) => {
    setAssigning(true);
    try {
      if (direction === 'right') {
        // 加入当前角色
        for (const userId of moveKeys) {
          await assignUserRole(userId as string, activeRoleId);
        }
        message.success(`已将 ${moveKeys.length} 名成员分配到该角色`);
      } else {
        // 移出当前角色 —— 需要指定移到哪个角色，这里默认降级为只读观察
        const fallbackRole = roles.find(r => r.id === 'R_VIEWER');
        if (!fallbackRole) {
          message.warning('缺少默认角色，无法移出');
          return;
        }
        for (const userId of moveKeys) {
          await assignUserRole(userId as string, fallbackRole.id);
        }
        message.success(`已将 ${moveKeys.length} 名成员移出（降级为只读观察）`);
      }
      await loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setAssigning(false);
    }
  };

  // 每个角色的成员数量统计
  const getRoleMemberCount = (roleId: string) => users.filter(u => u.roleId === roleId).length;

  return (
    <div className="permission-manage-page">
      <h2>权限配置</h2>

      <Spin spinning={loading}>
        <Tabs
          defaultActiveKey="matrix"
          items={[
            {
              key: 'matrix',
              label: (
                <span>
                  <SafetyOutlined /> 权限矩阵
                </span>
              ),
              children: (
                <Card
                  variant="borderless"
                  className="matrix-card"
                  extra={
                    <Space>
                      {dirty && <Tag color="orange">有未保存的更改</Tag>}
                      <Button icon={<ReloadOutlined />} onClick={loadData} disabled={saving}>
                        重置
                      </Button>
                      <Popconfirm
                        title="确认保存权限矩阵？"
                        description="保存后将立即影响相关角色用户的界面权限"
                        onConfirm={handleSaveMatrix}
                        okText="确认保存"
                        cancelText="取消"
                        disabled={!dirty}
                      >
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={saving}
                          disabled={!dirty}
                        >
                          保存变更
                        </Button>
                      </Popconfirm>
                    </Space>
                  }
                >
                  <div className="matrix-hint">
                    勾选/取消勾选来编辑「角色 × 权限点」。行按功能分组，鼠标悬停查看权限说明。
                  </div>
                  <Table
                    columns={matrixColumns}
                    dataSource={matrixRows}
                    pagination={false}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    rowClassName={(record) => `matrix-row-group-${record.group}`}
                  />
                </Card>
              )
            },
            {
              key: 'members',
              label: (
                <span>
                  <TeamOutlined /> 成员分配
                </span>
              ),
              children: (
                <Card variant="borderless" className="members-card">
                  <div className="role-selector">
                    <span className="role-selector-label">选择角色：</span>
                    <Space wrap>
                      {roles.map(role => (
                        <Button
                          key={role.id}
                          type={activeRoleId === role.id ? 'primary' : 'default'}
                          onClick={() => setActiveRoleId(role.id)}
                        >
                          {role.name}
                          <Tag
                            color={activeRoleId === role.id ? 'white' : 'blue'}
                            style={{ marginLeft: 6, marginRight: 0 }}
                          >
                            {getRoleMemberCount(role.id)}
                          </Tag>
                        </Button>
                      ))}
                    </Space>
                  </div>

                  <div className="transfer-hint">
                    左侧为全部客服，右侧为「{roles.find(r => r.id === activeRoleId)?.name}」的成员。
                    移动即时生效；移出角色将降级为「只读观察」。
                  </div>

                  <Spin spinning={assigning}>
                    <Transfer
                      dataSource={transferDataSource}
                      targetKeys={targetKeys}
                      onChange={handleTransferChange}
                      render={item => item.title}
                      titles={['全部客服', '该角色成员']}
                      listStyle={{ width: 320, height: 400 }}
                      showSearch
                      filterOption={(input, item) =>
                        item.title.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Spin>
                </Card>
              )
            }
          ]}
        />
      </Spin>
    </div>
  );
}
