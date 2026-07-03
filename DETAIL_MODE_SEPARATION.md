# 工单详情页面模式分离 - 修改说明

## 问题描述
之前的实现中，无论从"查看"还是"处理"操作进入工单详情页面，都会显示处理操作区（分配责任人、状态流转、上传材料、添加备注等），这是不合理的。

**预期行为**：
- **查看** → 只显示工单详情信息（只读模式）
- **处理** → 显示工单详情 + 处理操作区（可操作模式）

## 修改内容

### 1. TicketDetailDrawer 组件
**文件**: `src/components/TicketDetailDrawer.tsx`

#### 1.1 新增 mode 参数
```typescript
interface TicketDetailDrawerProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  mode?: 'view' | 'process'; // 新增：模式参数
}
```

- `view`: 查看模式（只读）
- `process`: 处理模式（可操作）
- 默认值：`'view'`

#### 1.2 添加模式判断
```typescript
// 是否为处理模式
const isProcessMode = mode === 'process';
```

#### 1.3 条件渲染处理操作区
将以下区域包裹在 `isProcessMode` 判断中，只在处理模式下显示：

**处理操作区**（第263-352行）
- 分配责任人
- 设置处理时限
- 状态流转按钮

**处理材料区**（第446-488行）
- 上传材料按钮
- 附件列表

**添加备注区**（第490-512行）
- 备注输入框
- 提交备注按钮

### 2. TicketList 组件
**文件**: `src/pages/TicketList.tsx`

#### 2.1 新增状态
```typescript
const [drawerMode, setDrawerMode] = useState<'view' | 'process'>('view');
```

#### 2.2 更新处理函数
```typescript
// 查看：设置为 view 模式
const handleView = (record: Ticket) => {
  setDrawerTicketId(record.id);
  setDrawerMode('view'); // 查看模式
  setDrawerOpen(true);
};

// 处理：设置为 process 模式
const handleProcess = (record: Ticket) => {
  setDrawerTicketId(record.id);
  setDrawerMode('process'); // 处理模式
  setDrawerOpen(true);
};
```

#### 2.3 传递 mode 参数
```typescript
<TicketDetailDrawer
  ticketId={drawerTicketId}
  open={drawerOpen}
  onClose={handleDrawerClose}
  onUpdated={loadTickets}
  mode={drawerMode} // 传递模式参数
/>
```

## 修改效果对比

### 修改前（错误）
| 操作 | 详情页面显示内容 |
|------|-----------------|
| 查看 | 基本信息 + 处理操作区 ❌ |
| 处理 | 基本信息 + 处理操作区 ✅ |

### 修改后（正确）
| 操作 | 详情页面显示内容 |
|------|-----------------|
| 查看 | 基本信息（只读）✅ |
| 处理 | 基本信息 + 处理操作区 ✅ |

## 显示内容详解

### 查看模式（mode='view'）
**显示内容**：
- ✅ 基本信息（27字段）
- ✅ 处理记录时间线（只读）
- ❌ 处理操作区（隐藏）
- ❌ 上传材料（隐藏）
- ❌ 添加备注（隐藏）

### 处理模式（mode='process'）
**显示内容**：
- ✅ 基本信息（27字段）
- ✅ 处理操作区
  - 分配责任人（需要权限）
  - 设置处理时限（需要权限）
  - 状态流转按钮（需要权限）
- ✅ 上传材料（需要权限）
- ✅ 添加备注（需要权限）
- ✅ 处理记录时间线（只读）

## 权限控制说明

即使在处理模式下，操作区内的具体功能仍然受权限控制：

- **分配责任人**: 需要 `ticket.assign` 权限
- **处理操作**: 需要 `canProcess` 权限（管理员/主管可处理所有，客服只能处理分配给自己的）
- **上传材料**: 需要 `canProcess` 权限
- **添加备注**: 需要 `canProcess` 权限

## 测试验证

### 测试步骤
1. 访问工单列表 http://localhost:5178/tickets
2. 点击某条工单的"查看"按钮
   - ✅ 应该只显示基本信息和处理记录
   - ❌ 不应该显示处理操作区
3. 关闭抽屉，点击同一条工单的"处理"按钮
   - ✅ 应该显示基本信息、处理记录和处理操作区
   - ✅ 可以进行分配、状态变更、上传材料等操作

### 测试结果
- [x] TypeScript 编译通过
- [x] 查看模式：只显示基本信息
- [x] 处理模式：显示完整操作区
- [x] 权限控制正常

## 技术要点

### 1. 条件渲染
使用 React 条件渲染实现模式切换：
```typescript
{isProcessMode && (
  <div className="action-panel">
    {/* 处理操作区 */}
  </div>
)}
```

### 2. 默认值设计
- `mode` 默认为 `'view'`，确保未传参时为只读模式，更安全

### 3. 状态管理
- 在父组件（TicketList）维护 `drawerMode` 状态
- 不同操作设置不同模式
- 通过 props 传递给子组件

## 文件清单

修改的文件：
1. `src/components/TicketDetailDrawer.tsx` - 新增 mode 参数和条件渲染
2. `src/pages/TicketList.tsx` - 新增 drawerMode 状态和模式切换逻辑

## 后续建议

1. 可以考虑在抽屉标题中显示当前模式：
   - 查看模式：`工单详情 - 查看`
   - 处理模式：`工单详情 - 处理`

2. 可以在处理模式下添加一个"切换到查看模式"的按钮，方便快速切换

3. 可以记录用户偏好，下次打开时使用上次的模式

---

**修改完成时间**: 2026年7月2日  
**TypeScript**: ✅ 编译通过  
**状态**: ✅ 已完成并测试
