import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Space, message, Tag, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { Dayjs } from 'dayjs';
import { getDashboardStats } from '../services/dashboardService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './Dashboard.css';

const { RangePicker } = DatePicker;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const query = dateRange
        ? { startDate: dateRange[0].format('YYYY-MM-DD'), endDate: dateRange[1].format('YYYY-MM-DD') }
        : {};
      const data = await getDashboardStats(query);
      setStats(data);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 卡片点击跳转（携带筛选参数）
  const handleCardClick = (filterType: string, filterValue?: string) => {
    const params = new URLSearchParams();
    if (filterType && filterValue) {
      params.set(filterType, filterValue);
    }
    navigate(`/tickets?${params.toString()}`);
  };

  // 反馈渠道图表配置
  const channelChartOption: EChartsOption = stats ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总数', '待处理', '处理中', '超时预警', '已超时'], top: 10 },
    xAxis: {
      type: 'category',
      data: stats.channelStats.map((c: any) => c.channel)
    },
    yAxis: { type: 'value' },
    series: [
      { name: '总数', type: 'bar', data: stats.channelStats.map((c: any) => c.total), itemStyle: { color: '#3d7fff' } },
      { name: '待处理', type: 'bar', data: stats.channelStats.map((c: any) => c.pending), itemStyle: { color: '#faad14' } },
      { name: '处理中', type: 'line', data: stats.channelStats.map((c: any) => c.processing), itemStyle: { color: '#52c41a' } },
      { name: '超时预警', type: 'line', data: stats.channelStats.map((c: any) => c.pendingTimeout), itemStyle: { color: '#ff9e3d' } },
      { name: '已超时', type: 'line', data: stats.channelStats.map((c: any) => c.overdue), itemStyle: { color: '#ff3d3d' } }
    ]
  } : {};

  // 跟进人工作量图表
  const assigneeChartOption: EChartsOption = stats ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['进单', '完单', '超时'], top: 10 },
    xAxis: { type: 'category', data: stats.assigneeStats.map((a: any) => a.name) },
    yAxis: { type: 'value' },
    series: [
      { name: '进单', type: 'bar', data: stats.assigneeStats.map((a: any) => a.created), itemStyle: { color: '#3d7fff' } },
      { name: '完单', type: 'bar', data: stats.assigneeStats.map((a: any) => a.resolved), itemStyle: { color: '#52c41a' } },
      { name: '超时', type: 'bar', data: stats.assigneeStats.map((a: any) => a.overdue), itemStyle: { color: '#ff3d3d' } }
    ]
  } : {};

  if (!stats) {
    return <Card loading={loading} />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>工单数据总览</h2>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={loadStats} loading={loading}>
            查询
          </Button>
          <Button onClick={() => { setDateRange(null); setTimeout(loadStats, 0); }}>
            重置
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadStats} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 8个指标卡 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('', '')}>
            <Statistic title="工单总数" value={stats.cards.total} valueStyle={{ color: '#3d7fff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('status', 'pending')}>
            <Statistic title="待处理数" value={stats.cards.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('status', 'processing')}>
            <Statistic title="处理中数" value={stats.cards.processing} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('status', 'resolved')}>
            <Statistic title="已完结数" value={stats.cards.resolved} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('status', 'pending_timeout')}>
            <Statistic title="2小时超时预警" value={stats.cards.pendingTimeout} valueStyle={{ color: '#ff9e3d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('status', 'overdue')}>
            <Statistic title="已超时数" value={stats.cards.overdue} valueStyle={{ color: '#ff3d3d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('complaintLevel', '特急工单')}>
            <Statistic title="特级工单数" value={stats.cards.special} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable className="metric-card" onClick={() => handleCardClick('channel', '监管')}>
            <Statistic title="监管单数" value={stats.cards.supervision} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
      </Row>

      {/* 智能建议 */}
      {stats.suggestions?.map((s: any, idx: number) => (
        <Alert
          key={idx}
          type={s.type}
          message={s.content}
          showIcon
          style={{ marginTop: 16, marginBottom: 8 }}
        />
      ))}

      {/* 图表区 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="📊 反馈渠道数据" loading={loading}>
            <ReactECharts option={channelChartOption} style={{ height: 360 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="👥 跟进人工作量" loading={loading}>
            <ReactECharts option={assigneeChartOption} style={{ height: 360 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}