// 优化后的登录页面 - 账号密码验证
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { loginWithPassword, getCurrentUser } from '../services/authService';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 如果已登录，跳转到首页
    const authUser = getCurrentUser();
    if (authUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await loginWithPassword(values.username, values.password);

      if (result.success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 快速登录（用于Demo测试）
  const quickLogin = (username: string, password: string) => {
    form.setFieldsValue({ username, password });
    handleLogin({ username, password });
  };

  return (
    <div className="login-container">
      <Card
        className="login-card"
        title={
          <Space>
            <LoginOutlined />
            <span>客服工单系统</span>
          </Space>
        }
      >
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>Demo 测试账号</Divider>

        <div className="demo-accounts">
          <div className="demo-account-row">
            <span className="demo-role">管理员</span>
            <Button
              size="small"
              type="link"
              onClick={() => quickLogin('admin', 'admin123')}
            >
              admin / admin123
            </Button>
          </div>

          <div className="demo-account-row">
            <span className="demo-role">主管</span>
            <Button
              size="small"
              type="link"
              onClick={() => quickLogin('leader', 'leader123')}
            >
              leader / leader123
            </Button>
          </div>

          <div className="demo-account-row">
            <span className="demo-role">客服</span>
            <Button
              size="small"
              type="link"
              onClick={() => quickLogin('agent', 'agent123')}
            >
              agent / agent123
            </Button>
          </div>

          <div className="demo-account-row">
            <span className="demo-role">观察员</span>
            <Button
              size="small"
              type="link"
              onClick={() => quickLogin('viewer', 'viewer123')}
            >
              viewer / viewer123
            </Button>
          </div>
        </div>

        <div className="login-footer">
          <p style={{ color: '#999', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
            不同角色拥有不同权限，可切换体验
          </p>
        </div>
      </Card>
    </div>
  );
}
