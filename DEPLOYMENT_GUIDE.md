# 客服工单系统 - 在线部署指南

本系统是纯前端 Demo 项目（使用 Mock 数据），可以免费部署到多个静态托管平台，供所有人访问。

---

## 🚀 方案1：使用 Vercel 部署（推荐）

### 特点
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动 CI/CD
- ✅ 中国大陆可访问（速度较慢）

### 部署步骤

#### 方式A：通过 GitHub（推荐）

1. **将代码推送到 GitHub**
   ```bash
   cd "C:/Users/admin/Desktop/claude workspace/客服工单系统7.10/ticket-system"
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/ticket-system.git
   git push -u origin main
   ```

2. **访问 Vercel 并导入项目**
   - 访问 https://vercel.com/
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"
   - 选择您的 GitHub 仓库
   - 配置会自动检测（已有 vercel.json）
   - 点击 "Deploy"

3. **等待部署完成**
   - 约 1-2 分钟
   - 自动生成域名：`https://你的项目名.vercel.app`

#### 方式B：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd "C:/Users/admin/Desktop/claude workspace/客服工单系统7.10/ticket-system"
   vercel
   ```

4. **按提示操作**
   - 首次部署选择 "y" 创建新项目
   - 接受默认配置
   - 部署完成后会显示访问链接

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

### 自定义域名（可选）
- 在 Vercel 项目设置中可以绑定自己的域名
- 支持免费 SSL 证书

---

## 🌐 方案2：使用 Netlify 部署

### 特点
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动 CI/CD
- ✅ 中国大陆访问速度更好

### 部署步骤

1. **创建 Netlify 配置文件**（已包含在项目中）
   
2. **通过 GitHub 部署**
   - 访问 https://app.netlify.com/
   - 点击 "Add new site" → "Import an existing project"
   - 连接 GitHub 仓库
   - 构建设置：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - 点击 "Deploy site"

3. **通过 Netlify CLI 部署**
   ```bash
   npm install -g netlify-cli
   netlify login
   cd "C:/Users/admin/Desktop/claude workspace/客服工单系统7.10/ticket-system"
   netlify deploy
   ```

---

## 📦 方案3：使用 GitHub Pages 部署

### 特点
- ✅ 完全免费
- ✅ 直接托管在 GitHub
- ⚠️ 需要修改 base 路径配置

### 部署步骤

1. **更新 vite.config.ts**
   ```typescript
   base: '/ticket-system/', // 改为您的仓库名
   ```

2. **添加部署脚本到 package.json**
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **安装 gh-pages**
   ```bash
   npm install -D gh-pages
   ```

4. **部署**
   ```bash
   npm run deploy
   ```

5. **配置 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 `gh-pages` 分支
   - 访问 `https://你的用户名.github.io/ticket-system/`

---

## 🔧 方案4：使用 Cloudflare Pages

### 特点
- ✅ 完全免费
- ✅ 超快速度（中国大陆友好）
- ✅ 自动 HTTPS
- ✅ 无限带宽

### 部署步骤

1. **访问 Cloudflare Pages**
   - https://pages.cloudflare.com/

2. **连接 GitHub 仓库**
   - 构建命令: `npm run build`
   - 构建输出目录: `dist`

3. **部署完成**
   - 自动生成域名：`https://你的项目名.pages.dev`

---

## 📝 本地构建测试

在部署前，建议先本地测试构建：

```bash
cd "C:/Users/admin/Desktop/claude workspace/客服工单系统7.10/ticket-system"

# 安装依赖
npm install

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

访问 http://localhost:5178 查看生产版本效果。

---

## 🌟 推荐配置

### 最佳实践：Vercel + GitHub

**优点**：
- 自动部署：每次 push 代码自动部署
- 预览环境：每个 PR 自动生成预览链接
- 回滚方便：一键回滚到任意历史版本
- 免费额度充足：个人项目完全够用

**部署后访问示例**：
```
生产环境: https://ticket-system.vercel.app
预览环境: https://ticket-system-git-feature-xxx.vercel.app
```

---

## 🔐 环境变量配置（如需要）

如果未来需要连接真实后端 API，可以在部署平台配置环境变量：

### Vercel
Settings → Environment Variables

### Netlify
Site settings → Environment variables

### 示例
```
VITE_API_URL=https://api.example.com
VITE_API_KEY=your-api-key
```

然后在代码中使用：
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 📊 部署后功能验证

部署成功后，访问在线地址并测试：

- [ ] 登录功能正常
- [ ] Dashboard 数据显示
- [ ] 工单列表加载
- [ ] 新增工单功能
- [ ] 查看工单详情（只读模式）
- [ ] 处理工单功能（操作模式）
- [ ] 导出 Excel/CSV/PDF
- [ ] 权限控制正常
- [ ] 路由跳转正常
- [ ] 所有27字段显示

---

## 🆘 常见问题

### Q1: 部署后页面空白？
**A**: 检查浏览器控制台错误，可能是路由配置问题。确保 `vercel.json` 中有重写规则。

### Q2: 刷新页面 404？
**A**: 需要配置 SPA 路由重写，已在 `vercel.json` 中配置。

### Q3: 中国大陆访问慢？
**A**: 
- Vercel: 使用香港节点，速度可接受
- Netlify: 速度更好
- Cloudflare Pages: 最佳选择

### Q4: 想使用自己的域名？
**A**: 所有平台都支持自定义域名绑定，且提供免费 SSL 证书。

### Q5: 如何更新部署？
**A**: 
- GitHub 集成：直接 push 代码，自动部署
- CLI 部署：运行 `vercel --prod` 或 `netlify deploy --prod`

---

## 📞 技术支持

- Vercel 文档: https://vercel.com/docs
- Netlify 文档: https://docs.netlify.com
- Vite 部署指南: https://vitejs.dev/guide/static-deploy.html

---

## ✅ 快速开始（推荐流程）

```bash
# 1. 进入项目目录
cd "C:/Users/admin/Desktop/claude workspace/客服工单系统7.10/ticket-system"

# 2. 安装 Vercel CLI
npm install -g vercel

# 3. 登录 Vercel
vercel login

# 4. 部署到 Vercel
vercel --prod

# 5. 获得在线访问地址
# 示例: https://ticket-system-xxx.vercel.app
```

部署完成后，所有人都可以通过生成的链接访问系统！🎉

---

**当前状态**: 配置文件已创建，随时可以部署  
**预计部署时间**: 2-5 分钟  
**完全免费**: ✅
