#!/bin/bash

echo "========================================="
echo "客服工单系统 - 快速部署脚本"
echo "========================================="
echo ""

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"
echo "✓ npm 版本: $(npm -v)"
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
    echo "✓ Vercel CLI 安装完成"
    echo ""
fi

echo "🔨 正在构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ 构建成功！"
    echo ""
    echo "🚀 开始部署到 Vercel..."
    echo ""
    vercel --prod

    echo ""
    echo "========================================="
    echo "✅ 部署完成！"
    echo "========================================="
    echo ""
    echo "您现在可以通过 Vercel 提供的链接访问系统"
    echo "所有人都可以通过该链接访问"
    echo ""
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
