// 投诉等级跟进规则 - 基于投诉表样版.xlsx 的"跟进要求"表

import type { ComplaintLevel } from '../types';

// 投诉等级配置
export const COMPLAINT_LEVEL_CONFIG: Record<ComplaintLevel, {
  label: string;
  color: string;
  followUpRequirement: string; // 跟进频次要求
  firstResponseTime: string;   // 首响要求
  reminderRules: string[];     // 跟进提醒规则
  completionCondition: string; // 完结条件
}> = {
  '一般工单': {
    label: '一般工单',
    color: 'default',
    followUpRequirement: '完结前根据要求跟进，至少3天1次',
    firstResponseTime: '分派后4小时内触达',
    reminderRules: [
      '4小时内未首响提醒',
      '72小时内未出现1次跟进记录提醒（提前3小时）'
    ],
    completionCondition: '冷处理后办结 - 冷处理超过15天后未出现新反馈内容后办结'
  },
  '紧急工单': {
    label: '紧急工单',
    color: 'orange',
    followUpRequirement: '完结前根据要求跟进，至少1天1次',
    firstResponseTime: '分派后2小时内触达',
    reminderRules: [
      '2小时内未首响提醒',
      '24小时内未出现1次跟进记录提醒（提前3小时）',
      '72小时内未3次跟进提醒（提前3小时）'
    ],
    completionCondition: '冷处理后办结 - 冷处理超过10天后未出现新反馈内容后办结'
  },
  '加急工单': {
    label: '加急工单',
    color: 'gold',
    followUpRequirement: '完结前根据要求跟进，至少1天2次',
    firstResponseTime: '分派后1小时内触达',
    reminderRules: [
      '1小时内未首响提醒',
      '24小时内未出现2次跟进记录提醒（提前1小时）',
      '48小时内未3次跟进提醒（提前3小时）'
    ],
    completionCondition: '冷处理后办结 - 诉求过高无法满足，经反馈上级后评估冷处理'
  },
  '特急工单': {
    label: '特急工单',
    color: 'red',
    followUpRequirement: '完结前根据要求跟进，至少一天2次',
    firstResponseTime: '分派后30分钟内触达',
    reminderRules: [
      '15分钟内未首响提醒',
      '24小时内没有出现2次跟进记录提醒（提前1小时）',
      '48小时内未4次跟进提醒（提前3小时）',
      '未完结前每距离上一次跟进12小时提醒'
    ],
    completionCondition: '冷处理后办结 - 冷处理超过7天后未出现新反馈内容后办结'
  }
};

// 渠道类型配置（重构）
export const CHANNEL_TYPE_CONFIG = {
  '保司渠道': { label: '保司渠道', color: 'blue' },
  '支付渠道': { label: '支付渠道', color: 'cyan' },
  '内部工单': { label: '内部工单', color: 'purple' },
  '客户反馈': { label: '客户反馈', color: 'orange' },
  '其它': { label: '其它', color: 'default' }
};

// 完结状态配置（新增冷处理）
export const COMPLETION_STATUS = [
  { value: '未取得有效联系', label: '未取得有效联系' },
  { value: '已达成一致', label: '已达成一致' },
  { value: '诉求过高，无法达成一致', label: '诉求过高，无法达成一致' },
  { value: '冷处理', label: '冷处理' }
];
