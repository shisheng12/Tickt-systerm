// 工单相关常量定义

// 客诉类别（基于投诉表样版补充完整）
export const TICKET_CATEGORIES = [
  { value: '监管投诉-引导性', label: '监管投诉-引导性', color: '#ff3d3d' },
  { value: '监管投诉-非引导性', label: '监管投诉-非引导性', color: '#ff3d3d' },
  { value: '投诉-服务态度', label: '投诉-服务态度', color: '#ff9e3d' },
  { value: '投诉-未履行告知义务', label: '投诉-未履行告知义务', color: '#ff9e3d' },
  { value: '投诉-信息泄露', label: '投诉-信息泄露', color: '#ff3d3d' },
  { value: '投诉-保费收取问题', label: '投诉-保费收取问题', color: '#ff9e3d' },
  { value: '理赔咨询', label: '理赔咨询', color: '#3d7fff' },
  { value: '理赔投诉', label: '理赔投诉', color: '#ff9e3d' },
  { value: '退保申请', label: '退保申请', color: '#666' },
  { value: '退保投诉', label: '退保投诉', color: '#ff9e3d' },
  { value: '保单变更', label: '保单变更', color: '#666' },
  { value: '保单查询', label: '保单查询', color: '#666' },
  { value: '续保咨询', label: '续保咨询', color: '#3d7fff' },
  { value: '核保咨询', label: '核保咨询', color: '#3d7fff' },
  { value: '产品咨询', label: '产品咨询', color: '#3d7fff' },
  { value: '回访问题', label: '回访问题', color: '#666' },
  { value: '其他', label: '其他', color: '#999' }
];

// 完结状态
export const COMPLETION_STATUS = [
  { value: '未取得有效联系', label: '未取得有效联系', color: '#999' },
  { value: '已达成一致', label: '已达成一致', color: '#31cc31' },
  { value: '诉求过高，无法达成一致', label: '诉求过高，无法达成一致', color: '#ff9e3d' },
  { value: '客户自行撤诉', label: '客户自行撤诉', color: '#31cc31' },
  { value: '已协商解决', label: '已协商解决', color: '#31cc31' },
  { value: '已赔付', label: '已赔付', color: '#31cc31' },
  { value: '已退保', label: '已退保', color: '#666' },
  { value: '转其他部门处理', label: '转其他部门处理', color: '#3d7fff' },
  { value: '无效工单', label: '无效工单', color: '#999' }
];

// 工单状态配置
export const TICKET_STATUS = {
  pending: { text: '待处理', color: 'default' },
  assigned: { text: '已分配', color: 'blue' },
  processing: { text: '处理中', color: 'orange' },
  pending_confirm: { text: '待确认', color: 'purple' },
  resolved: { text: '已解决', color: 'green' },
  closed: { text: '已关闭', color: 'default' },
  reopened: { text: '重新打开', color: 'red' }
} as const;

// 优先级配置
export const PRIORITY_CONFIG = {
  urgent: { text: '紧急', color: '#ff3d3d', weight: 4 },
  high: { text: '高', color: '#ff9e3d', weight: 3 },
  medium: { text: '中', color: '#3d7fff', weight: 2 },
  low: { text: '低', color: '#999', weight: 1 }
} as const;

// 来源配置
export const SOURCE_CONFIG = {
  feishu_form: { text: '飞书表单', icon: '📋' },
  manual: { text: '手动新增', icon: '✍️' },
  community: { text: '社群', icon: '👥' }
} as const;

// 核身状态
export const NUCLEAR_STATUS = [
  { value: '是', label: '是' },
  { value: '否', label: '否' },
  { value: '待核实', label: '待核实' }
];
