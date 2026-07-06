@echo off
chcp 65001 >nul
echo ========================================
echo 紧急部署 - 2分钟获得演示链接
echo ========================================
echo.

echo 正在部署到 Netlify...
echo.

cd /d "%~dp0"

echo 步骤1: 检查 dist 文件夹...
if not exist "dist" (
    echo ❌ dist 文件夹不存在，正在构建...
    call npm run build
)
echo ✓ dist 文件夹已准备好
echo.

echo 步骤2: 部署到 Netlify...
netlify deploy --prod --dir=dist --allow-anonymous

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 复制上方显示的链接即可访问！
echo.
pause
