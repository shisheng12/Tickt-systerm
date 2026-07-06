@echo off
chcp 65001 >nul
echo ========================================
echo 紧急部署 - Surge.sh
echo 2分钟获得演示链接！
echo ========================================
echo.

cd /d "%~dp0"

echo 正在使用 Surge 部署...
echo.
echo 第一次使用会提示创建账号：
echo 1. Email: 输入您的邮箱
echo 2. Password: 输入密码（至少8位）
echo 3. 直接回车完成后续步骤
echo.
echo ========================================
echo.

surge dist

echo.
echo ========================================
echo ✅ 部署完成！
echo ========================================
echo.
echo 复制上方的链接即可访问！
echo 例如: https://xxx-xxx.surge.sh
echo.
echo 测试账号:
echo   管理员: admin / admin123
echo   客服: agent / agent123
echo.
pause
