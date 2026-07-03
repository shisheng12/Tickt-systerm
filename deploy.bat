@echo off
chcp 65001 >nul
echo =========================================
echo 客服工单系统 - 快速部署脚本
echo =========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
node -v
echo ✓ npm 已安装
npm -v
echo.

REM 检查 Vercel CLI
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 正在安装 Vercel CLI...
    call npm install -g vercel
    echo ✓ Vercel CLI 安装完成
    echo.
)

echo 🔨 正在构建项目...
call npm run build

if %errorlevel% equ 0 (
    echo ✓ 构建成功！
    echo.
    echo 🚀 开始部署到 Vercel...
    echo.
    call vercel --prod

    echo.
    echo =========================================
    echo ✅ 部署完成！
    echo =========================================
    echo.
    echo 您现在可以通过 Vercel 提供的链接访问系统
    echo 所有人都可以通过该链接访问
    echo.
) else (
    echo ❌ 构建失败，请检查错误信息
    pause
    exit /b 1
)

pause
