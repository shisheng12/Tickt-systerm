import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import TicketList from '../pages/TicketList';
import PermissionManage from '../pages/PermissionManage';
import RoleManage from '../pages/RoleManage';
import UserManage from '../pages/UserManage';
import ScheduleManage from '../pages/ScheduleManage';
import ExternalCapabilities from '../pages/ExternalCapabilities';
import ErrorPage from '../pages/ErrorPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorPage />
  },
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'tickets',
        element: <TicketList />
      },
      {
        path: 'admin/roles',
        element: <RoleManage />
      },
      {
        path: 'admin/users',
        element: <UserManage />
      },
      {
        path: 'admin/permissions',
        element: <PermissionManage />
      },
      {
        path: 'admin/schedules',
        element: <ScheduleManage />
      },
      {
        path: 'external',
        element: <ExternalCapabilities />
      }
    ]
  },
  {
    // catch-all：未匹配的路径重定向到首页
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
