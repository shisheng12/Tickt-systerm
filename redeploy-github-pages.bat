@echo off
chcp 65001 >nul
echo ========================================
echo GitHub Pages 重新部署
echo ========================================
echo.

cd /d "%~dp0"

echo 步骤1: 清理并重新构建...
call npm run build
echo ✓ 构建完成
echo.

echo 步骤2: 添加 .nojekyll 文件...
echo. > dist\.nojekyll
echo ✓ .nojekyll 已添加
echo.

echo 步骤3: 部署到 GitHub Pages...
npx gh-pages -d dist -b gh-pages
echo ✓ 部署完成
echo.

echo ========================================
echo 部署成功！
echo ========================================
echo.
echo 等待 2-3 分钟后访问:
echo https://shisheng12.github.io/Tickt-systerm/
echo.
pause
