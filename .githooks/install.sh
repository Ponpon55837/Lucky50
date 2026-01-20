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
echo "📋 複製 Git hooks..."
echo "  • pre-commit - 防止在受保護分支直接提交並驗證分支命名"
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "  • commit-msg - 驗證提交訊息格式"
cp .githooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg

echo ""
echo "✅ Git hooks 安裝完成！"
echo ""
echo "📝 已安裝的 hooks："
echo "  • pre-commit"
echo "    - 防止在受保護分支（main, master, develop 等）直接提交"
echo "    - 驗證分支命名規範（僅警告）"
echo "  • commit-msg"
echo "    - 驗證提交訊息格式是否符合 Conventional Commits 規範"
echo "    - 目前為警告模式，不會阻止提交"
echo ""
echo "🧪 測試建議："
echo "  1. 測試 pre-commit hook："
echo "     git checkout main"
echo "     git commit --allow-empty -m \"test\""
echo "     → 應該會看到錯誤訊息阻止提交"
echo ""
echo "  2. 測試 commit-msg hook："
echo "     git checkout -b test/your-name/test-hooks"
echo "     git commit --allow-empty -m \"invalid message\""
echo "     → 應該會看到格式警告訊息"
echo ""
echo "     git commit --allow-empty -m \"feat: 測試訊息格式\""
echo "     → 應該會成功提交"
echo ""
echo "💡 提示："
echo "  - 如果需要重新安裝，再次執行此腳本即可"
echo "  - 如果需要臨時跳過 hook，使用：git commit --no-verify"
echo "  - 但請注意：跳過 hook 違反專案規範！"
echo "  - 如需啟用強制檢查，編輯對應的 hook 檔案並修改 ENFORCE 參數"
echo ""
