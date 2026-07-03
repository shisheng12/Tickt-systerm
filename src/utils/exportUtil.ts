// 工单导出工具 - Excel / CSV / PDF 导出（更新为27字段）
import * as XLSX from 'xlsx';
import type { Ticket, ExportFormat } from '../types';
import { TICKET_STATUS, PRIORITY_CONFIG, SOURCE_CONFIG } from '../constants/ticket';
import { CHANNEL_TYPE_CONFIG } from '../constants/complaintRules';
import dayjs from 'dayjs';

// 导出配置
interface ExportOptions {
  filename?: string;
  sheetName?: string;
}

// 将工单数据转换为 Excel 可用的二维数组（27列）
function ticketsToRows(tickets: Ticket[]): any[][] {
  // 表头（27列）
  const headers = [
    '反馈时间',
    '项目',
    '经纪主体',
    '支付渠道',
    '工单号',
    '内部订单号',
    '保单号',
    '客户姓名',
    '客户电话',
    '客户诉求',
    '保司侧是否核身',
    '客诉类别',
    '处理结果',
    '联系次数',
    '下次联系时间',
    '完结时间',
    '完结状态',
    '跟进人',
    '来源',
    '渠道',
    '优先级',
    '处理状态',
    '创建时间',
    '提交人',
    '投诉等级',
    '跟进频次',
    '首响要求'
  ];

  // 数据行
  const rows = tickets.map(ticket => [
    dayjs(ticket.feedbackTime).format('YYYY-MM-DD HH:mm'),
    ticket.project,
    ticket.brokerageEntity,
    ticket.paymentChannel,
    ticket.workOrderNumber,
    ticket.internalOrderNumber || '',
    ticket.policyNumber,
    ticket.customerName,
    ticket.phone,
    ticket.customerRequest,
    ticket.nuclearBodyStatus,
    ticket.category,
    ticket.processingResult || '',
    ticket.contactCount,
    ticket.nextContactTime ? dayjs(ticket.nextContactTime).format('YYYY-MM-DD HH:mm') : '',
    ticket.completionTime ? dayjs(ticket.completionTime).format('YYYY-MM-DD HH:mm') : '',
    ticket.completionStatus || '',
    ticket.follower || '',
    SOURCE_CONFIG[ticket.source]?.text || ticket.source,
    CHANNEL_TYPE_CONFIG[ticket.channel]?.label || ticket.channel,
    PRIORITY_CONFIG[ticket.priority]?.text || ticket.priority,
    TICKET_STATUS[ticket.status]?.text || ticket.status,
    dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm'),
    ticket.submitterName,
    ticket.complaintLevel,
    ticket.followUpFrequency,
    ticket.firstResponseRequirement
  ]);

  return [headers, ...rows];
}

// 导出工单为 Excel 文件
export function exportTicketsToExcel(
  tickets: Ticket[],
  options: ExportOptions = {}
): void {
  const { filename = `工单列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`, sheetName = '工单数据' } = options;

  // 转换数据
  const rows = ticketsToRows(tickets);

  // 创建工作表
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // 设置列宽（27列）
  const colWidths = [
    { wch: 16 }, // 反馈时间
    { wch: 10 }, // 项目
    { wch: 14 }, // 经纪主体
    { wch: 12 }, // 支付渠道
    { wch: 18 }, // 工单号
    { wch: 18 }, // 内部订单号
    { wch: 20 }, // 保单号
    { wch: 10 }, // 客户姓名
    { wch: 12 }, // 客户电话
    { wch: 30 }, // 客户诉求
    { wch: 14 }, // 保司侧是否核身
    { wch: 20 }, // 客诉类别
    { wch: 30 }, // 处理结果
    { wch: 10 }, // 联系次数
    { wch: 16 }, // 下次联系时间
    { wch: 16 }, // 完结时间
    { wch: 18 }, // 完结状态
    { wch: 10 }, // 跟进人
    { wch: 12 }, // 来源
    { wch: 12 }, // 渠道
    { wch: 10 }, // 优先级
    { wch: 10 }, // 处理状态
    { wch: 16 }, // 创建时间
    { wch: 12 }, // 提交人
    { wch: 12 }, // 投诉等级
    { wch: 16 }, // 跟进频次
    { wch: 20 }  // 首响要求
  ];
  worksheet['!cols'] = colWidths;

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 下载文件
  XLSX.writeFile(workbook, filename);
}

// 导出工单为 CSV 文件
export function exportTicketsToCSV(
  tickets: Ticket[],
  options: ExportOptions = {}
): void {
  const { filename = `工单列表_${dayjs().format('YYYYMMDD_HHmmss')}.csv` } = options;

  const rows = ticketsToRows(tickets);

  // 转换为 CSV 字符串
  const csvContent = rows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '');
          // 如果包含逗号、换行或引号，需要用双引号包裹并转义内部引号
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');

  // 添加 BOM 使 Excel 能正确识别 UTF-8
  const BOM = '﻿';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 下载文件
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// 导出工单为 PDF（使用浏览器打印功能）
export function exportTicketsToPDF(
  tickets: Ticket[],
  options: ExportOptions = {}
): void {
  const { filename = `工单列表_${dayjs().format('YYYYMMDD_HHmmss')}.pdf` } = options;

  const rows = ticketsToRows(tickets);

  // 构建 HTML 表格
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        body { font-family: "Microsoft YaHei", Arial, sans-serif; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) { background-color: #fafafa; }
        @media print {
          body { margin: 0; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <h1>工单数据列表 - ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</h1>
      <table>
        <thead>
          <tr>${rows[0].map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .slice(1)
            .map(row => `<tr>${row.map(cell => `<td>${cell || '-'}</td>`).join('')}</tr>`)
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // 打开新窗口并打印
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// 根据格式分发导出（用于 exportStrategyService）
export function exportTicketsByFormat(
  tickets: Ticket[],
  format: ExportFormat,
  baseName: string = '工单列表'
): string {
  const timestamp = dayjs().format('YYYYMMDD_HHmmss');
  const filename = `${baseName}_${timestamp}`;

  switch (format) {
    case 'xlsx':
      exportTicketsToExcel(tickets, { filename: `${filename}.xlsx` });
      return `${filename}.xlsx`;
    case 'csv':
      exportTicketsToCSV(tickets, { filename: `${filename}.csv` });
      return `${filename}.csv`;
    case 'pdf':
      exportTicketsToPDF(tickets, { filename: `${filename}.pdf` });
      return `${filename}.pdf`;
    default:
      exportTicketsToExcel(tickets, { filename: `${filename}.xlsx` });
      return `${filename}.xlsx`;
  }
}
