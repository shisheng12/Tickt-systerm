// 生成模拟工单数据的脚本 - 完整字段版本
import type { Ticket, ComplaintLevel, ChannelType } from '../types';

const projects = ['融盛', '泰康', '平安', '太保', '国寿'];
const brokerageEntities = ['东方大地', '华泰保险经纪', '明亚保险经纪', '泛华保险经纪'];
const paymentChannels = ['连连支付', '支付宝', '微信支付', '银联支付', '云闪付'];
const categories = [
  '监管投诉-引导性',
  '监管投诉-非引导性',
  '理赔咨询',
  '理赔投诉',
  '退保申请',
  '退保投诉',
  '保单变更',
  '保单查询',
  '投诉-服务态度',
  '投诉-未履行告知义务',
  '投诉-信息泄露',
  '投诉-保费收取问题',
  '续保咨询',
  '核保咨询',
  '产品咨询',
  '回访问题',
  '其他'
];

// 7种渠道类型（含监管）
const channels: ChannelType[] = ['保司', '经纪', '支付', '监管', '内部工单', '客户反馈', '其它'];

const customerRequests = [
  '要求退保并退还全部保费',
  '咨询理赔进度，已提交材料一周未回复',
  '投诉销售人员误导，要求处理',
  '保单信息填写有误，申请更正',
  '对扣费有异议，要求说明',
  '要求加急处理理赔',
  '投诉客服态度恶劣',
  '理赔资料补充说明',
  '咨询续保优惠政策',
  '要求撤销自动续费'
];

const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];
const statuses: Array<Ticket['status']> = ['pending', 'assigned', 'processing', 'pending_confirm', 'resolved', 'closed', 'reopened'];
const sources: Array<Ticket['source']> = ['feishu_form', 'manual', 'community'];
const completionStatuses = ['正常完结', '冷处理', '联系不上', ''];
const complaintLevels: ComplaintLevel[] = ['一般工单', '紧急工单', '加急工单', '特急工单'];
const nuclearStatuses = ['是', '否', '待核实'];
const followers = ['李四', '赵六', '孙七', '周八', '郑十', '陈十二'];
const creators = ['张三', '李四', '王五', '外部'];
const userComplaintChannels = ['飞书投诉', '400热线', '客服来电', '微信', '邮件', 'APP', '其他'];
const submitters = ['张三', '外部用户-王磊', '外部用户-李娜', '系统自动', '客服热线'];

const userIds = ['U1002', 'U1004', 'U1005', 'U1006', 'U1008', 'U1010', null];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): string {
  const now = new Date('2026-07-10T12:00:00+08:00');
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function randomPhone(): string {
  const prefix = ['138', '139', '158', '188', '199'];
  return `${randomItem(prefix)}${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`;
}

function generatePolicyNumber(): string {
  const prefix = ['P', 'L', 'H'];
  const year = 2024 + Math.floor(Math.random() * 3);
  const random = Math.floor(Math.random() * 1e12).toString().padStart(12, '0');
  return `${prefix}${year}${random}`;
}

function generateInternalOrderNumber(): string | undefined {
  if (Math.random() < 0.5) return undefined;
  return `IO${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 1000)}`;
}

function generateContactId(): string | undefined {
  if (Math.random() < 0.6) return undefined;
  return `CI${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 1000)}`;
}

function getFollowUpRequirements(level: ComplaintLevel): { frequency: string; firstResponse: string } {
  const map: Record<ComplaintLevel, { frequency: string; firstResponse: string }> = {
    '一般工单': { frequency: '至少3天1次', firstResponse: '分派后4小时内触达' },
    '紧急工单': { frequency: '至少1天1次', firstResponse: '分派后2小时内触达' },
    '加急工单': { frequency: '至少1天2次', firstResponse: '分派后1小时内触达' },
    '特急工单': { frequency: '至少一天2次', firstResponse: '分派后30分钟内触达' }
  };
  return map[level];
}

function generateTicket(index: number): Ticket {
  const daysAgo = Math.floor(Math.random() * 30);
  const feedbackTime = randomDate(daysAgo);
  const createdAt = randomDate(daysAgo);
  const status = randomItem(statuses);
  const assigneeId = status === 'pending' ? null : randomItem(userIds);
  const priority = randomItem(priorities);
  const source = randomItem(sources);
  const complaintLevel = randomItem(complaintLevels);
  const followUpReqs = getFollowUpRequirements(complaintLevel);
  const channel = randomItem(channels);
  const creator = randomItem(creators);
  const isExternal = creator === '外部';

  const createdDate = new Date(createdAt);
  const updatedAt = new Date(createdDate.getTime() + Math.random() * 48 * 60 * 60 * 1000).toISOString();

  let completionTime: string | null = null;
  let dueAt: string | null = null;
  if (priority === 'urgent') {
    dueAt = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
  } else if (priority === 'high') {
    dueAt = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  } else if (priority === 'medium') {
    dueAt = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  let resolvedAt: string | null = null;
  if (status === 'resolved' || status === 'closed') {
    resolvedAt = new Date(createdDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString();
    completionTime = resolvedAt;
  }

  const contactCount = status === 'pending' ? 0 : Math.floor(Math.random() * 5) + 1;

  let nextContactTime: string | null = null;
  if (status !== 'resolved' && status !== 'closed' && Math.random() < 0.5) {
    nextContactTime = new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
  }

  const processingResults = [
    '已联系客户，客户要求继续跟进',
    '客户暂未接听，已留言',
    '已向上级反馈，等待处理方案',
    '材料已提交保司，等待审核',
    '客户同意处理方案',
    '问题已解决，客户满意',
    '无法联系到客户',
    ''
  ];
  const processingResult = contactCount > 0 ? randomItem(processingResults) : '';

  const workOrderNumber = `WO2026${String(index + 1).padStart(5, '0')}`;

  return {
    id: `T${String(index + 1).padStart(4, '0')}`,
    workOrderNumber,
    feedbackTime,
    source,
    channel,
    project: randomItem(projects),
    brokerageEntity: randomItem(brokerageEntities),
    paymentChannel: randomItem(paymentChannels),
    internalOrderNumber: generateInternalOrderNumber(),
    policyNumber: generatePolicyNumber(),
    userComplaintChannel: randomItem(userComplaintChannels),
    customerName: `客户${String.fromCharCode(0x5f20 + Math.floor(Math.random() * 100))}${'甲乙丙丁戊己庚辛壬癸'[Math.floor(Math.random() * 10)]}`,
    phone: randomPhone(),
    contactPhone: Math.random() > 0.5 ? randomPhone() : undefined,
    customerRequest: randomItem(customerRequests),
    nuclearBodyStatus: randomItem(nuclearStatuses),
    category: randomItem(categories),
    complaintLevel,
    followUpFrequency: followUpReqs.frequency,
    firstResponseRequirement: followUpReqs.firstResponse,
    priority,
    status,
    processingResult,
    contactCount,
    nextContactTime,
    completionTime,
    completionStatus: (status === 'resolved' || status === 'closed') ? randomItem(completionStatuses) : '',
    follower: contactCount > 0 ? randomItem(followers) : '',
    creator: isExternal ? '外部' : creator,
    creatorName: isExternal ? '外部用户' : creator,
    submitterName: isExternal ? `外部用户-${workOrderNumber}` : randomItem(submitters),
    hasContacted: Math.random() > 0.4,
    contactId: generateContactId(),

    // 系统字段
    assigneeId,
    dueAt,
    createdAt,
    updatedAt,
    resolvedAt,
    processLogs: [],
    attachments: []
  };
}

// 生成50条模拟工单
const tickets: Ticket[] = Array.from({ length: 50 }, (_, i) => generateTicket(i));

export default tickets;