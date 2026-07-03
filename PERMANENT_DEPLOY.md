# 永久部署指南 - GitHub + Vercel

## 🎯 目标
部署一个永久有效、可分享的工单系统，完全免费，无需购买域名。

---

## 方式1：GitHub + Vercel（最推荐）

### 为什么选择这个方案？
- ✅ 永久免费托管
- ✅ 自动生成域名（xxx.vercel.app）
- ✅ 自动 HTTPS
- ✅ 每次 push 代码自动部署
- ✅ 全球 CDN 加速
- ✅ 无需信用卡

---

## 📋 详细步骤

### 步骤1：创建 GitHub 账号

1. **访问**: https://github.com/signup
2. **注册账号**:
   - 输入邮箱
   - 创建密码
   - 选择用户名
   - 验证邮箱
3. **完成注册**

**已有账号？** 直接登录 https://github.com/login

---

### 步骤2：初始化 Git 仓库

打开命令行（PowerShell 或 Git Bash），执行：

```bash
# 进入项目目录
cd "C:/Users/admin/Desktop/claude workspace/客服工单系统7.10/ticket-system"

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "客服工单系统 - 初始提交"
```

---

### 步骤3：创建 GitHub 仓库

1. **访问**: https://github.com/new
2. **填写信息**:
   - Repository name: `ticket-system`（或自定义）
   - Description: `客服工单系统 Demo`
   - 选择 **Public**（公开仓库，免费）
   - **不要**勾选 "Add a README file"
3. **点击**: "Create repository"

---

### 步骤4：推送代码到 GitHub

GitHub 会显示推送命令，复制执行：

```bash
# 添加远程仓库（替换成您的 GitHub 用户名）
git remote add origin https://github.com/你的用户名/ticket-system.git

# 设置主分支名称
git branch -M main

# 推送代码
git push -u origin main
```

**提示**: 第一次 push 可能需要登录 GitHub。

---

### 步骤5：连接 Vercel

1. **访问**: https://vercel.com/signup
2. **注册方式**: 选择 "Continue with GitHub"
3. **授权**: 允许 Vercel 访问 GitHub
4. **导入项目**:
   - 点击 "Add New..." → "Project"
   - 选择 `ticket-system` 仓库
   - 点击 "Import"
5. **配置**（保持默认）:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **部署**: 点击 "Deploy"

---

### 步骤6：等待部署完成

- 时间：约 1-2 分钟
- 完成后会显示：
  ```
  🎉 Congratulations!
  
  Your project is now live at:
  https://ticket-system-xxx.vercel.app
  ```

**这个链接永久有效！** 可以随时访问和分享。

---

## 🎁 部署完成后

### 您的系统链接
```
https://你的项目名.vercel.app
```

### 功能特点
- ✅ 永久有效（不会过期）
- ✅ 自动 HTTPS（安全）
- ✅ 可以随时分享
- ✅ 支持自定义域名（可选，需要购买域名）

### 更新部署
以后修改代码后，只需：
```bash
git add .
git commit -m "更新说明"
git push
```

Vercel 会**自动重新部署**，无需手动操作！

---

## 🆚 其他方案对比

| 方案 | 免费 | 永久 | 自动部署 | 难度 | 推荐度 |
|------|------|------|---------|------|--------|
| **GitHub + Vercel** | ✅ | ✅ | ✅ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| GitHub + Netlify | ✅ | ✅ | ✅ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| GitHub Pages | ✅ | ✅ | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Cloudflare Pages | ✅ | ✅ | ✅ | ⭐⭐ | ⭐⭐⭐⭐ |
| Netlify Drop | ✅ | ❌ | ❌ | ⭐ | ⭐ |

---

## 🆘 常见问题

### Q1: 必须使用 GitHub 吗？
**A**: 是的，但 GitHub 完全免费。您也可以选择：
- GitLab + Netlify
- Bitbucket + Vercel

### Q2: 我不会用 Git 怎么办？
**A**: 
1. 下载 GitHub Desktop: https://desktop.github.com/
2. 使用图形界面，无需命令行
3. 或使用 VS Code 内置 Git 功能

### Q3: push 时要求登录怎么办？
**A**: 
1. 使用 GitHub Desktop（自动登录）
2. 或配置 Git 凭证：
   ```bash
   git config --global user.name "你的名字"
   git config --global user.email "你的邮箱"
   ```

### Q4: 域名可以自定义吗？
**A**: 
- 免费域名：`xxx.vercel.app` （Vercel 提供）
- 自定义域名：需要购买域名后在 Vercel 绑定

### Q5: 中国大陆能访问吗？
**A**: 
- Vercel: 可以访问，但速度可能较慢
- Netlify: 访问速度更好
- Cloudflare Pages: 最佳选择（中国友好）

---

## 🔄 方式2：GitHub + Netlify

如果 Vercel 访问有问题，可以使用 Netlify：

1. **访问**: https://app.netlify.com/signup
2. **注册**: 选择 "GitHub"
3. **导入项目**: "Add new site" → "Import an existing project"
4. **选择仓库**: `ticket-system`
5. **配置**:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **部署**: 点击 "Deploy site"

**结果**: 获得 `xxx.netlify.app` 永久域名

---

## 🔄 方式3：GitHub Pages

完全依托 GitHub，无需第三方：

### 步骤1：修改构建配置

编辑 `vite.config.ts`：
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/ticket-system/', // 改为您的仓库名
  // ...
})
```

### 步骤2：添加部署脚本

在 `package.json` 添加：
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

### 步骤3：安装 gh-pages
```bash
npm install -D gh-pages
```

### 步骤4：部署
```bash
npm run deploy
```

### 步骤5：配置 GitHub Pages
1. 访问仓库 Settings → Pages
2. Source: 选择 `gh-pages` 分支
3. 保存

**结果**: `https://你的用户名.github.io/ticket-system/`

---

## ✅ 推荐流程总结

### 最简单的方式（推荐）：

```
1. 创建 GitHub 账号 (5分钟)
   ↓
2. 推送代码到 GitHub (2分钟)
   ↓
3. 连接 Vercel (3分钟)
   ↓
4. 自动部署 (2分钟)
   ↓
5. 获得永久链接！✅
```

**总时间**: 约 15 分钟
**费用**: 完全免费
**有效期**: 永久

---

## 📞 需要帮助？

如果在操作过程中遇到问题，可以查看：

- **Git 安装**: https://git-scm.com/downloads
- **GitHub Desktop**: https://desktop.github.com/
- **Vercel 文档**: https://vercel.com/docs
- **Netlify 文档**: https://docs.netlify.com/

---

## 🎯 下一步

**立即开始**：

1. 如果没有 GitHub 账号，先注册：https://github.com/signup
2. 然后按照步骤 2-6 操作
3. 15分钟后获得永久链接！

---

**状态**: 准备就绪  
**预计时间**: 15分钟  
**费用**: 免费  
**有效期**: 永久 ✅
