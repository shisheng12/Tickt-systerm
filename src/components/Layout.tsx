import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  ApiOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth, usePermission } from '../hooks/usePermission';
import { logout } from '../services/authService';
import NotificationCenter from './NotificationCenter';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // 权限检查
  const canViewDashboard = usePermission('dashboard.view');
  const canViewTickets = usePermission('ticket.view');
  const canManagePermissions = usePermission('perm.manage');
  const canManageSchedules = usePermission('schedule.manage');
  const canExport = usePermission('ticket.export');
  const canCreateTicket = usePermission('ticket.create');

  useEffect(() => {
    // 未登录跳转到登录页
    if (!authUser) {
      navigate('/login');
    }
  }, [authUser, navigate]);

  if (!authUser) {
    return null;
  }

  // 构建菜单项（根据权限显隐）
  const menuItems: MenuProps['items'] = [];

  if (canViewDashboard) {
    menuItems.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工单数据总览'
    });
  }

  if (canViewTickets) {
    menuItems.push({
      key: '/tickets',
      icon: <FileTextOutlined />,
      label: '工单数据列表'
    });
  }

  if (canManagePermissions || canManageSchedules) {
    const adminSubItems = [];

    if (canManagePermissions) {
      adminSubItems.push({
        key: '/admin/roles',
        label: '角色管理'
      });
      adminSubItems.push({
        key: '/admin/users',
        label: '用户管理'
      });
      adminSubItems.push({
        key: '/admin/permissions',
        label: '权限配置'
      });
    }

    if (canManageSchedules) {
      adminSubItems.push({
        key: '/admin/schedules',
        label: '排班配置'
      });
    }

    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined />,
      label: '系统配置',
      children: adminSubItems
    });
  }

  // 外部能力：飞书进单人人可用；导出策略需 ticket.export。有其一即显示
  if (canCreateTicket || canExport) {
    menuItems.push({
      key: '/external',
      icon: <ApiOutlined />,
      label: '外部能力'
    });
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  // 获取当前选中的菜单键
  const selectedKey = location.pathname;
  const openKeys = selectedKey.startsWith('/admin') ? ['/admin'] : [];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          <FileTextOutlined style={{ fontSize: 24, color: '#fff' }} />
          {!collapsed && <span style={{ marginLeft: 12, color: '#fff', fontSize: 16, fontWeight: 'bold' }}>工单系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>客服工单管理系统</div>
          <Space size="middle">
            <span style={{ color: '#666' }}>当前角色：{authUser.role.name}</span>
            <NotificationCenter />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" icon={<Avatar size="small" icon={<UserOutlined />} />}>
                {authUser.user.name}
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
