import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Space, message, Tag, Alert, Table, Empty } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import { getDashboardStats, type MetricCard, type UrgentTicket, type AssigneeLoad } from '../services/dashboardService';
import { PRIORITY_CONFIG } from '../constants/ticket';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import './Dashboard.css';

const { RangePicker } = DatePicker;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<MetricCard[]>([]);
  const [urgentTickets, setUrgentTickets] = useState<UrgentTicket[]>([]);
  const [assigneeLoad, setAssigneeLoad] = useState<AssigneeLoad[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; created: number; resolved: number }[]>([]);
  const [suggestions, setSuggestions] = useState<{ type: string; content: string }[]>([]);

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
      setCards(data.cards);
      setUrgentTickets(data.urgentTickets);
      setAssigneeLoad(data.assigneeLoad);
      setTrendData(data.trendData);
      setSuggestions(data.suggestions);
    } catch (error: any) {
      message.error(error.message || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
    setDateRange(dates);
  };

  const handleSearch = () => {
    loadStats();
  };

  const handleReset = () => {
    setDateRange(null);
    setTimeout(() => loadStats(), 0);
  };

  // 卡片点击跳转工单列表，传递状态筛选
  const handleCardClick = (card: MetricCard) => {
    if (card.status) {
      navigate(`/tickets?status=${card.status}`);
    } else {
      navigate('/tickets');
    }
  };

  // 趋势图配置
  const trendChartOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['进单', '完结'] },
    xAxis: { type: 'category', data: trendData.map(d => dayjs(d.date).format('MM-DD')) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '进单',
        type: 'line',
        data: trendData.map(d => d.created),
        smooth: true,
        itemStyle: { color: '#3d7fff' }
      },
      {
        name: '完结',
        type: 'line',
        data: trendData.map(d => d.resolved),
        smooth: true,
        itemStyle: { color: '#52c41a' }
      }
    ]
  };

  // 责任人负载图配置
  const assigneeChartOption: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['处理中', '超时'] },
    xAxis: { type: 'category', data: assigneeLoad.map(a => a.assigneeName) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '处理中',
        type: 'bar',
        stack: 'total',
        data: assigneeLoad.map(a => a.inProgress),
        itemStyle: { color: '#3d7fff' }
      },
      {
        name: '超时',
        type: 'bar',
        stack: 'total',
        data: assigneeLoad.map(a => a.overdue),
        itemStyle: { color: '#ff3d3d' }
      }
    ]
  };

  // 紧急工单表格列
  const urgentColumns: ColumnsType<UrgentTicket> = [
    {
      title: '工单号',
      dataIndex: 'workOrderNumber',
      key: 'workOrderNumber',
      width: 150,
      render: (text, record) => (
        <a onClick={() => navigate(`/tickets?id=${record.id}`)}>{text}</a>
      )
    },
    { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 100 },
    { title: '类别', dataIndex: 'category', key: 'category', width: 140 },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: string) => {
        const cfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      }
    },
    {
      title: '超时状态',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      width: 120,
      render: (days: number) =>
        days > 0 ? (
          <Tag color="red">已超时 {days} 天</Tag>
        ) : days === 0 ? (
          <Tag color="orange">今日到期</Tag>
        ) : (
          <Tag color="default">剩余 {-days} 天</Tag>
        )
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>工单数据总览</h2>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            placeholder={['开始日期', '结束日期']}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={handleSearch} loading={loading}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={loadStats} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 指标卡片（可点击跳转） */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {cards.map((card, idx) => (
          <Col key={idx} xs={24} sm={12} md={8} lg={4.8}>
            <Card
              hoverable
              className="metric-card"
              onClick={() => handleCardClick(card)}
              loading={loading}
            >
              <Statistic
                title={card.label}
                value={card.value}
                suffix={
                  card.trend !== undefined && card.trend !== 0 ? (
                    <span className={`trend ${card.trend > 0 ? 'up' : 'down'}`}>
                      {card.trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      {Math.abs(card.trend)}%
                    </span>
                  ) : null
                }
                valueStyle={{ fontSize: 28, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 智能建议 */}
      {suggestions.map((s, idx) => (
        <Alert
          key={idx}
          type={s.type as any}
          title={s.content}
          icon={
            s.type === 'warning' ? (
              <WarningOutlined />
            ) : s.type === 'info' ? (
              <InfoCircleOutlined />
            ) : (
              <CheckCircleOutlined />
            )
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      ))}

      {/* 图表区 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="📈 进单 vs 完结趋势（近7天）" loading={loading}>
            {trendData.length > 0 ? (
              <ReactECharts option={trendChartOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无趋势数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="👤 责任人负载 & 超时率" loading={loading}>
            {assigneeLoad.length > 0 ? (
              <ReactECharts option={assigneeChartOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无责任人数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 紧急待处理工单 */}
      <Card title="🔥 紧急待处理工单" style={{ marginTop: 16 }} loading={loading}>
        {urgentTickets.length > 0 ? (
          <Table
            columns={urgentColumns}
            dataSource={urgentTickets}
            rowKey="id"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="暂无紧急工单" />
        )}
      </Card>
    </div>
  );
}
