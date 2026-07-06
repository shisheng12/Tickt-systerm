@echo off
chcp 65001 >nul
echo ========================================
echo 永久部署助手 - GitHub + Vercel
echo ========================================
echo.

echo 第1步：配置 Git 用户信息
echo.
echo 请输入您的名字（用于 Git 提交）：
set /p GIT_NAME=

echo.
echo 请输入您的邮箱（用于 Git 提交）：
set /p GIT_EMAIL=

echo.
echo 正在配置 Git...
git config --global user.name "%GIT_NAME%"
git config --global user.email "%GIT_EMAIL%"
echo ✓ Git 配置完成
echo.

echo 第2步：创建 Git 提交
git add .
git commit -m "客服工单系统 - 完整功能版本"
echo ✓ 代码已提交到本地仓库
echo.

echo ========================================
echo 下一步操作：
echo ========================================
echo.
echo 1. 访问 GitHub 创建仓库：
echo    https://github.com/new
echo.
echo 2. 仓库信息填写：
echo    - Repository name: ticket-system
echo    - Description: 客服工单系统 Demo
echo    - 选择 Public（公开）
echo    - 点击 "Create repository"
echo.
echo 3. 复制推送命令（GitHub 会显示）：
echo    git remote add origin https://github.com/你的用户名/ticket-system.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. 在本目录打开命令行，执行上面的推送命令
echo.
echo 5. 推送成功后访问 Vercel：
echo    https://vercel.com/new
echo    - 选择 "Continue with GitHub"
echo    - 导入 ticket-system 仓库
echo    - 点击 Deploy
echo.
echo 6. 等待 1-2 分钟，获得永久链接！
echo.
echo ========================================
pause
