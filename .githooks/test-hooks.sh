#!/bin/bash

# Lucky50 專案 - Git Hooks 測試腳本
# 自動測試所有 Git hooks 是否正常運作

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 計數器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 測試結果記錄
FAILED_TEST_NAMES=()

# ============================================
# 工具函數
# ============================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  Lucky50 Git Hooks 自動化測試                         ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_start() {
    local test_name=$1
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  測試 #${TOTAL_TESTS}: ${test_name}... "
}

test_pass() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ 通過${NC}"
}

test_fail() {
    local test_name=$1
    local reason=$2
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FAILED_TEST_NAMES+=("${test_name}: ${reason}")
    echo -e "${RED}✗ 失敗${NC}"
    if [ -n "$reason" ]; then
        echo -e "    ${RED}原因: ${reason}${NC}"
    fi
}

cleanup_test_branch() {
    local branch=$1
    git checkout main 2>/dev/null || true
    git branch -D "$branch" 2>/dev/null || true
}

# ============================================
# 環境檢查
# ============================================

check_environment() {
    print_section "環境檢查"
    
    # 檢查是否在專案根目錄
    test_start "檢查是否在專案根目錄"
    if [ ! -d ".git" ]; then
        test_fail "檢查是否在專案根目錄" "不在 Git 倉庫根目錄"
        exit 1
    fi
    test_pass
    
    # 檢查是否在 main 分支
    test_start "檢查當前分支是否為 main"
    CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        test_fail "檢查當前分支" "當前不在 main 分支（在 ${CURRENT_BRANCH}）"
        echo ""
        echo -e "${YELLOW}請先切換到 main 分支：git checkout main${NC}"
        exit 1
    fi
    test_pass
    
    # 檢查工作目錄是否乾淨
    test_start "檢查工作目錄是否乾淨"
    if [ -n "$(git status --porcelain)" ]; then
        test_fail "檢查工作目錄" "工作目錄有未提交的變更"
        echo ""
        echo -e "${YELLOW}請先提交或儲存變更：git stash${NC}"
        exit 1
    fi
    test_pass
    
    # 檢查 hooks 是否已安裝
    test_start "檢查 pre-commit hook 是否已安裝"
    if [ ! -f ".git/hooks/pre-commit" ]; then
        test_fail "pre-commit hook" "未安裝"
        echo ""
        echo -e "${YELLOW}請先安裝 hooks：./.githooks/install.sh${NC}"
        exit 1
    fi
    test_pass
    
    test_start "檢查 commit-msg hook 是否已安裝"
    if [ ! -f ".git/hooks/commit-msg" ]; then
        test_fail "commit-msg hook" "未安裝"
        echo ""
        echo -e "${YELLOW}請先安裝 hooks：./.githooks/install.sh${NC}"
        exit 1
    fi
    test_pass
}

# ============================================
# Pre-commit Hook 測試
# ============================================

test_precommit_hook() {
    print_section "Pre-commit Hook 測試"
    
    # 測試 1: 在 main 分支提交應該被阻止
    test_start "在 main 分支提交應該被阻止"
    git checkout main 2>/dev/null
    if git commit --allow-empty -m "test" 2>&1 | grep -q "禁止在.*分支直接提交"; then
        test_pass
    else
        test_fail "main 分支保護" "未能阻止 main 分支提交"
    fi
    
    # 測試 2: 在功能分支提交應該被允許
    test_start "在功能分支提交應該被允許"
    TEST_BRANCH="test/test-user/test-feature-$$"
    git checkout -b "$TEST_BRANCH" 2>/dev/null
    if git commit --allow-empty -m "test: 測試提交" 2>&1; then
        test_pass
        git reset --hard HEAD~1 2>/dev/null
    else
        test_fail "功能分支提交" "功能分支無法提交"
    fi
    cleanup_test_branch "$TEST_BRANCH"
    
    # 測試 3: 分支命名規範檢查（警告）
    test_start "分支命名規範檢查（不規範的名稱應顯示警告）"
    BAD_BRANCH="my-feature"
    git checkout -b "$BAD_BRANCH" 2>/dev/null
    COMMIT_OUTPUT=$(git commit --allow-empty -m "test: 測試" 2>&1)
    if echo "$COMMIT_OUTPUT" | grep -q "不符合專案規範"; then
        test_pass
        git reset --hard HEAD~1 2>/dev/null
    else
        test_fail "分支命名檢查" "未顯示分支命名警告"
        git reset --hard HEAD~1 2>/dev/null
    fi
    cleanup_test_branch "$BAD_BRANCH"
    
    # 測試 4: 測試 master 分支也應該被保護
    test_start "master 分支也應該被保護"
    if git show-ref --verify --quiet refs/heads/master; then
        git checkout master 2>/dev/null
        if git commit --allow-empty -m "test" 2>&1 | grep -q "禁止在.*分支直接提交"; then
            test_pass
        else
            test_fail "master 分支保護" "未能阻止 master 分支提交"
        fi
        git checkout main 2>/dev/null
    else
        echo -e "${YELLOW}跳過（master 分支不存在）${NC}"
    fi
    
    # 測試 5: 測試 develop 分支也應該被保護
    test_start "develop 分支也應該被保護"
    if git show-ref --verify --quiet refs/heads/develop; then
        git checkout develop 2>/dev/null
        if git commit --allow-empty -m "test" 2>&1 | grep -q "禁止在.*分支直接提交"; then
            test_pass
        else
            test_fail "develop 分支保護" "未能阻止 develop 分支提交"
        fi
        git checkout main 2>/dev/null
    else
        echo -e "${YELLOW}跳過（develop 分支不存在）${NC}"
    fi
}

# ============================================
# Commit-msg Hook 測試
# ============================================

test_commitmsg_hook() {
    print_section "Commit-msg Hook 測試"
    
    TEST_BRANCH="test/test-user/commit-msg-test-$$"
    git checkout -b "$TEST_BRANCH" 2>/dev/null
    
    # 測試 1: 正確的提交訊息格式
    test_start "正確的提交訊息格式應該被接受"
    if git commit --allow-empty -m "feat: 新增測試功能" 2>&1; then
        test_pass
        git reset --hard HEAD~1 2>/dev/null
    else
        test_fail "正確格式" "正確的提交訊息被拒絕"
    fi
    
    # 測試 2: 不正確的提交訊息格式（應顯示警告但不阻止）
    test_start "不正確的提交訊息應顯示警告"
    COMMIT_OUTPUT=$(git commit --allow-empty -m "Add new feature" 2>&1)
    if echo "$COMMIT_OUTPUT" | grep -q "格式建議改進\|格式不符"; then
        test_pass
        git reset --hard HEAD~1 2>/dev/null
    else
        test_fail "錯誤格式警告" "未顯示格式警告"
        git reset --hard HEAD~1 2>/dev/null
    fi
    
    # 測試 3: 帶 scope 的提交訊息
    test_start "帶 scope 的提交訊息格式"
    if git commit --allow-empty -m "feat(api): 新增使用者 API" 2>&1; then
        test_pass
        git reset --hard HEAD~1 2>/dev/null
    else
        test_fail "scope 格式" "帶 scope 的訊息被拒絕"
    fi
    
    # 測試 4: 破壞性變更標記
    test_start "破壞性變更標記格式"
    if git commit --allow-empty -m "feat!: 重構 API 接口" 2>&1; then
        test_pass
        git reset --hard HEAD~1 2>/dev/null
    else
        test_fail "破壞性變更格式" "破壞性變更訊息被拒絕"
    fi
    
    # 測試 5: 空提交訊息
    test_start "空提交訊息應該被拒絕"
    # 注意：Git 本身就會拒絕空訊息，所以這裡測試 Git 的行為
    if ! git commit --allow-empty -m "" 2>&1; then
        test_pass
    else
        test_fail "空訊息檢查" "空訊息未被拒絕"
        git reset --hard HEAD~1 2>/dev/null
    fi
    
    cleanup_test_branch "$TEST_BRANCH"
}

# ============================================
# 整合測試
# ============================================

test_integration() {
    print_section "整合測試"
    
    # 測試 1: 完整的工作流程
    test_start "完整工作流程測試"
    TEST_BRANCH="feat/test-user/integration-test-$$"
    git checkout -b "$TEST_BRANCH" 2>/dev/null
    
    # 建立測試檔案
    echo "test" > test-file-$$.txt
    git add test-file-$$.txt
    
    # 提交
    if git commit -m "feat: 新增測試檔案" 2>&1; then
        # 清理
        git reset --hard HEAD~1 2>/dev/null
        rm -f test-file-$$.txt
        test_pass
    else
        rm -f test-file-$$.txt
        test_fail "完整流程" "工作流程執行失敗"
    fi
    
    cleanup_test_branch "$TEST_BRANCH"
}

# ============================================
# 報告生成
# ============================================

print_summary() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  測試總結                                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  總測試數：${BLUE}${TOTAL_TESTS}${NC}"
    echo -e "  通過：${GREEN}${PASSED_TESTS}${NC}"
    echo -e "  失敗：${RED}${FAILED_TESTS}${NC}"
    echo ""
    
    if [ ${FAILED_TESTS} -eq 0 ]; then
        echo -e "${GREEN}✓ 所有測試通過！Git hooks 運作正常。${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ 有 ${FAILED_TESTS} 個測試失敗：${NC}"
        echo ""
        for failed_test in "${FAILED_TEST_NAMES[@]}"; do
            echo -e "  ${RED}•${NC} ${failed_test}"
        done
        echo ""
        echo -e "${YELLOW}請檢查 Git hooks 的安裝和配置。${NC}"
        echo ""
        return 1
    fi
}

# ============================================
# 主函數
# ============================================

main() {
    print_header
    
    # 環境檢查
    check_environment
    
    # 執行測試
    test_precommit_hook
    test_commitmsg_hook
    test_integration
    
    # 顯示總結
    print_summary
    
    # 返回適當的退出碼
    if [ ${FAILED_TESTS} -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# 執行主函數
main
