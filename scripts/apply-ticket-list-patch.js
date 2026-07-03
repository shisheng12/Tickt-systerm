#!/usr/bin/env node
/**
 * TicketList 重构补丁脚本
 *
 * 使用方法：
 * 1. 手动修改 src/pages/TicketList.tsx
 * 2. 或运行此脚本自动应用补丁
 */

const fs = require('fs');
const path = require('path');

const TICKET_LIST_PATH = path.join(__dirname, '../src/pages/TicketList.tsx');

// 读取文件
let content = fs.readFileSync(TICKET_LIST_PATH, 'utf8');

// 补丁1：在列定义前插入简化的列配置调用
const columnDefStart = content.indexOf('const columns: ColumnsType<Ticket> = [');
if (columnDefStart !== -1) {
  const columnDefEnd = content.indexOf('  ];', columnDefStart) + 4;

  const newColumnDef = `  // 表格列配置（使用新的27列配置）
  const authUser = useAuth();
  const columns = getTicketColumns(
    handleView,
    (record) => {
      // 处理权限：管理员/主管可处理所有，客服只能处理已分配给自己的
      if (!authUser) return false;
      const role = authUser.role.id;
      if (role === 'R_ADMIN' || role === 'R_LEAD') return true;
      if (role === 'R_AGENT' && record.assigneeId === authUser.user.id) return true;
      return false;
    },
    handleEdit,
    (record) => {
      // 处理权限检查（同上）
      if (!authUser) return false;
      const role = authUser.role.id;
      if (role === 'R_ADMIN' || role === 'R_LEAD') return true;
      if (role === 'R_AGENT' && record.assigneeId === authUser.user.id) return true;
      return false;
    },
    () => canEdit
  );`;

  content = content.substring(0, columnDefStart) + newColumnDef + content.substring(columnDefEnd);

  console.log('✅ 已替换表格列定义');
}

// 补丁2：查找并更新新增工单Modal的表单部分
const createModalStart = content.indexOf('title="新增工单"');
if (createModalStart !== -1) {
  // 查找该 Modal 内的 Form 标签
  const formStart = content.indexOf('<Form', createModalStart);
  const formEnd = content.indexOf('</Form>', formStart) + 7;

  const newForm = `<Form form={createForm} layout="vertical">
            <TicketForm
              form={createForm}
              isEdit={false}
              channels={channels}
              users={users}
            />
          </Form>`;

  if (formStart !== -1 && formEnd !== -1) {
    content = content.substring(0, formStart) + newForm + content.substring(formEnd);
    console.log('✅ 已更新新增工单表单');
  }
}

// 补丁3：查找并更新编辑工单Modal的表单部分
const editModalStart = content.indexOf('title="编辑工单"');
if (editModalStart !== -1) {
  const formStart = content.indexOf('<Form', editModalStart);
  const formEnd = content.indexOf('</Form>', formStart) + 7;

  const newForm = `<Form form={editForm} layout="vertical">
            <TicketForm
              form={editForm}
              isEdit={true}
              channels={channels}
              users={users}
            />
          </Form>`;

  if (formStart !== -1 && formEnd !== -1) {
    content = content.substring(0, formStart) + newForm + content.substring(formEnd);
    console.log('✅ 已更新编辑工单表单');
  }
}

// 写回文件
fs.writeFileSync(TICKET_LIST_PATH, content, 'utf8');
console.log('\n✅ 补丁应用完成！');
console.log('请运行 npm run dev 查看效果');
