import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { Result, Button } from 'antd';
import { getCurrentUser } from '../services/authService';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  // 判断错误类型
  let status: '404' | '500' | '403' = '500';
  let title = '出错了';
  let subTitle = '抱歉，页面发生了一些问题。';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      status = '404';
      title = '404';
      subTitle = '抱歉，您访问的页面不存在。';
    } else if (error.status === 403) {
      status = '403';
      title = '403';
      subTitle = '抱歉，您没有权限访问此页面。';
    } else {
      subTitle = error.statusText || subTitle;
    }
  } else if (error instanceof Error) {
    subTitle = error.message;
  }

  // 根据登录状态决定返回目标
  const handleGoHome = () => {
    const authUser = getCurrentUser();
    if (authUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5'
      }}
    >
      <Result
        status={status}
        title={title}
        subTitle={subTitle}
        extra={
          <Button type="primary" onClick={handleGoHome}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
