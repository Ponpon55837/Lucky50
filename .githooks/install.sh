#!/bin/bash

# Lucky50 專案 - Git Hooks 安裝腳本
# 用於安裝專案的 Git hooks 到 .git/hooks/

set -e

echo "🔧 正在安裝 Lucky50 專案的 Git hooks..."
echo ""

# 檢查是否在專案根目錄
if [ ! -d ".git" ]; then
    echo "❌ 錯誤：請在專案根目錄執行此腳本"
    exit 1
fi

# 檢查 .githooks 目錄是否存在
if [ ! -d ".githooks" ]; then
    echo "❌ 錯誤：找不到 .githooks 目錄"
    exit 1
fi

# 複製 hooks
echo "📋 複製 pre-commit hook..."
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo ""
echo "✅ Git hooks 安裝完成！"
echo ""
echo "📝 已安裝的 hooks："
echo "  • pre-commit - 防止在 main 分支直接提交"
echo ""
echo "🧪 測試建議："
echo "  1. 切換到 main 分支：git checkout main"
echo "  2. 嘗試提交：git commit --allow-empty -m \"test\""
echo "  3. 應該會看到錯誤訊息阻止提交"
echo ""
echo "💡 提示："
echo "  - 如果需要重新安裝，再次執行此腳本即可"
echo "  - 如果需要臨時跳過 hook，使用：git commit --no-verify"
echo "  - 但請注意：跳過 hook 違反專案規範！"
echo ""
