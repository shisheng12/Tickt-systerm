import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  message,
  Modal,
  Form,
  DatePicker,
  Tag,
  Tooltip,
  Popconfirm,
  Spin,
  Empty
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { Schedule, User, Channel, ShiftType } from '../types';
import {
  querySchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../services/scheduleService';
import { getUsers } from '../services/roleService';
import { getChannels } from '../services/channelService';
import { SHIFT_CONFIG } from '../constants/permission';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import './ScheduleManage.css';

dayjs.extend(isoWeek);

const SHIFT_ORDER: ShiftType[] = ['day', 'mid', 'night'];

export default function ScheduleManage() {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  // 当前周的起始日（周一）
  const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('isoWeek'));

  // 按社群筛选
  const [channelFilter, setChannelFilter] = useState<string | undefined>();

  // 新增/编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 本周的7天
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
    [weekStart]
  );

  useEffect(() => {
    loadAuxData();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [weekStart, channelFilter]);

  const loadAuxData = async () => {
    try {
      const [usersData, channelsData] = await Promise.all([getUsers(), getChannels()]);
      // 只读观察角色不参与排班
      setUsers(usersData.filter(u => u.roleId !== 'R_VIEWER'));
      setChannels(channelsData);
    } catch (error: any) {
      message.error('加载基础数据失败');
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const start = weekStart.format('YYYY-MM-DD');
      const end = weekStart.add(6, 'day').format('YYYY-MM-DD');
      const data = await querySchedules(start, end, channelFilter);
      setSchedules(data);
    } catch (error: any) {
      message.error(error.message || '加载排班失败');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || userId;

  // 获取某天某班次的排班
  const getCellSchedules = (date: Dayjs, shift: ShiftType) => {
    const dateStr = date.format('YYYY-MM-DD');
    return schedules.filter(s => s.date === dateStr && s.shift === shift);
  };

  // 检测某天某客服是否冲突（多班次）
  const hasConflict = (date: Dayjs, userId: string) => {
    const dateStr = date.format('YYYY-MM-DD');
    return schedules.filter(s => s.date === dateStr && s.userId === userId).length > 1;
  };

  // 打开新增弹窗
  const handleAdd = (date?: Dayjs, shift?: ShiftType) => {
    setEditingSchedule(null);
    form.resetFields();
    if (date) form.setFieldValue('date', date);
    if (shift) {
      form.setFieldValue('shift', shift);
      const cfg = SHIFT_CONFIG[shift];
      const [start, end] = cfg.time.split('-');
      form.setFieldsValue({ startTime: start, endTime: end });
    }
    setModalOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      ...schedule,
      date: dayjs(schedule.date),
      // remark 存储为字符串，tags Select 需要数组
      remark: schedule.remark ? [schedule.remark] : []
    });
    setModalOpen(true);
  };

  // 班次变更时自动填充时段
  const handleShiftChange = (shift: ShiftType) => {
    const cfg = SHIFT_CONFIG[shift];
    const [start, end] = cfg.time.split('-');
    form.setFieldsValue({ startTime: start, endTime: end });
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        userId: values.userId,
        date: (values.date as Dayjs).format('YYYY-MM-DD'),
        shift: values.shift,
        startTime: values.startTime,
        endTime: values.endTime,
        channel: values.channel,
        // tags Select 返回数组，Schedule.remark 为字符串
        remark: Array.isArray(values.remark) ? (values.remark[0] || '') : (values.remark || '')
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
        message.success('排班已更新');
      } else {
        await createSchedule(payload);
        message.success('排班已创建');
      }
      setModalOpen(false);
      await loadSchedules();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除排班
  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
      message.success('排班已删除');
      await loadSchedules();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const isToday = (date: Dayjs) => date.isSame(dayjs(), 'day');
  const weekLabel = `${weekStart.format('YYYY年MM月DD日')} - ${weekStart.add(6, 'day').format('MM月DD日')}`;

  return (
    <div className="schedule-manage-page">
      <h2>排班配置</h2>

      {/* 工具栏 */}
      <Card variant="borderless" className="schedule-toolbar">
        <div className="toolbar-inner">
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => setWeekStart(weekStart.subtract(7, 'day'))}>
              上一周
            </Button>
            <Button icon={<CalendarOutlined />} onClick={() => setWeekStart(dayjs().startOf('isoWeek'))}>
              本周
            </Button>
            <Button onClick={() => setWeekStart(weekStart.add(7, 'day'))}>
              下一周 <RightOutlined />
            </Button>
            <span className="week-label">{weekLabel}</span>
          </Space>
          <Space>
            <Select
              placeholder="按社群筛选"
              value={channelFilter}
              onChange={setChannelFilter}
              allowClear
              style={{ width: 180 }}
              options={channels.map(c => ({ value: c.name, label: c.name }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
              新增排班
            </Button>
          </Space>
        </div>
      </Card>

      {/* 周视图表格 */}
      <Spin spinning={loading}>
        <Card variant="borderless" className="schedule-grid-card">
          <div className="schedule-grid">
            {/* 表头：星期 */}
            <div className="grid-corner">班次 / 日期</div>
            {weekDays.map(day => (
              <div key={day.format('YYYY-MM-DD')} className={`grid-day-header ${isToday(day) ? 'today' : ''}`}>
                <div className="day-week">周{['一', '二', '三', '四', '五', '六', '日'][day.isoWeekday() - 1]}</div>
                <div className="day-date">{day.format('MM-DD')}</div>
              </div>
            ))}

            {/* 每个班次一行 */}
            {SHIFT_ORDER.map(shift => {
              const cfg = SHIFT_CONFIG[shift];
              return (
                <div key={shift} className="grid-row" style={{ display: 'contents' }}>
                  <div className="grid-shift-header" style={{ background: cfg.bg, color: cfg.color }}>
                    <div className="shift-name">{cfg.label}</div>
                    <div className="shift-time">{cfg.time}</div>
                  </div>
                  {weekDays.map(day => {
                    const cellSchedules = getCellSchedules(day, shift);
                    return (
                      <div
                        key={`${shift}-${day.format('YYYY-MM-DD')}`}
                        className="grid-cell"
                        onDoubleClick={() => handleAdd(day, shift)}
                      >
                        {cellSchedules.map(s => {
                          const conflict = hasConflict(day, s.userId);
                          return (
                            <div
                              key={s.id}
                              className="schedule-chip"
                              style={{ borderLeftColor: cfg.color }}
                            >
                              <div className="chip-main">
                                <span className="chip-name">
                                  {getUserName(s.userId)}
                                  {conflict && (
                                    <Tooltip title="该客服当天有多个班次，请注意冲突">
                                      <Tag color="red" style={{ marginLeft: 4, fontSize: 10, padding: '0 4px' }}>
                                        冲突
                                      </Tag>
                                    </Tooltip>
                                  )}
                                </span>
                                <span className="chip-actions">
                                  <EditOutlined onClick={() => handleEdit(s)} />
                                  <Popconfirm
                                    title="确认删除此排班？"
                                    onConfirm={() => handleDelete(s.id)}
                                    okText="删除"
                                    cancelText="取消"
                                  >
                                    <DeleteOutlined />
                                  </Popconfirm>
                                </span>
                              </div>
                              <div className="chip-channel">{s.channel}</div>
                            </div>
                          );
                        })}
                        {cellSchedules.length === 0 && (
                          <div className="grid-cell-empty" onClick={() => handleAdd(day, shift)}>
                            <PlusOutlined />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {schedules.length === 0 && !loading && (
            <Empty description="本周暂无排班，点击「新增排班」或双击单元格添加" style={{ marginTop: 24 }} />
          )}
        </Card>
      </Spin>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingSchedule ? '编辑排班' : '新增排班'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="客服" name="userId" rules={[{ required: true, message: '请选择客服' }]}>
            <Select
              placeholder="选择客服"
              showSearch
              optionFilterProp="label"
              options={users.map(u => ({ value: u.id, label: `${u.name}（${u.team}）` }))}
            />
          </Form.Item>
          <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="班次" name="shift" rules={[{ required: true, message: '请选择班次' }]}>
            <Select
              placeholder="选择班次"
              onChange={handleShiftChange}
              options={SHIFT_ORDER.map(s => ({
                value: s,
                label: `${SHIFT_CONFIG[s].label}（${SHIFT_CONFIG[s].time}）`
              }))}
            />
          </Form.Item>
          <Space style={{ display: 'flex' }} size="middle">
            <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                placeholder="开始"
                options={['09:00', '12:00', '18:00'].map(t => ({ value: t, label: t }))}
              />
            </Form.Item>
            <Form.Item label="结束时间" name="endTime" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                placeholder="结束"
                options={['18:00', '21:00', '03:00'].map(t => ({ value: t, label: t }))}
              />
            </Form.Item>
          </Space>
          <Form.Item label="负责社群" name="channel" rules={[{ required: true, message: '请选择社群' }]}>
            <Select
              placeholder="选择社群"
              options={channels.map(c => ({ value: c.name, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Select
              mode="tags"
              placeholder="可选备注（可自由输入）"
              maxCount={1}
              options={[
                { value: '顶班', label: '顶班' },
                { value: '临时调整', label: '临时调整' },
                { value: '培训', label: '培训' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
