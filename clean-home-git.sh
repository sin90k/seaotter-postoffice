#!/bin/bash
# 安全清理 ~/.git 误建仓库脚本
# 用法: bash clean-home-git.sh

set -e

HOME_DIR="${HOME:-/Users/pengminsu}"
GIT_DIR="$HOME_DIR/.git"

echo "=========================================="
echo "1. 验证 ~/.git 是否存在"
echo "=========================================="

if [ ! -d "$GIT_DIR" ]; then
  echo "❌ $GIT_DIR 不存在，无需清理。"
  exit 0
fi

echo "✓ $GIT_DIR 存在"

echo ""
echo "=========================================="
echo "2. 确认这是误建仓库（无有效提交）"
echo "=========================================="

cd "$HOME_DIR"
if git rev-parse --git-dir > /dev/null 2>&1; then
  COMMIT_COUNT=$(git rev-list --all --count 2>/dev/null || echo "0")
  echo "   当前目录: $(pwd)"
  echo "   提交数: $COMMIT_COUNT"
  if [ "$COMMIT_COUNT" = "0" ]; then
    echo "✓ 确认为空仓库，可安全删除"
  else
    echo "⚠️  有 $COMMIT_COUNT 个提交，请确认是否真的要删除！"
    read -p "   输入 YES 继续删除: " confirm
    if [ "$confirm" != "YES" ]; then
      echo "已取消"
      exit 1
    fi
  fi
fi

echo ""
echo "=========================================="
echo "3. 确认项目仓库独立存在"
echo "=========================================="

for proj in "seaotter-postoffice" "seaotterpostoffice"; do
  proj_path="$HOME_DIR/$proj"
  if [ -d "$proj_path" ]; then
    if [ -d "$proj_path/.git" ]; then
      echo "✓ $proj 有独立 .git，删除 ~/.git 不会影响它"
    else
      # 可能在 seaotterpostoffice/seaotter-postoffice 结构下
      nested="$proj_path/seaotter-postoffice/.git"
      if [ -d "$nested" ]; then
        echo "✓ $proj/seaotter-postoffice 有独立 .git"
      fi
    fi
  fi
done

echo ""
echo "=========================================="
echo "4. 删除前磁盘使用"
echo "=========================================="

BEFORE=$(du -sh "$GIT_DIR" 2>/dev/null | cut -f1)
echo "   ~/.git 占用: $BEFORE"
df -h / | tail -1

echo ""
echo "=========================================="
echo "5. 删除 ~/.git"
echo "=========================================="

rm -rf "$GIT_DIR"
echo "✓ 已删除 $GIT_DIR"

echo ""
echo "=========================================="
echo "6. 删除后确认"
echo "=========================================="

if [ -d "$GIT_DIR" ]; then
  echo "❌ 删除失败，$GIT_DIR 仍存在"
  exit 1
else
  echo "✓ 删除成功"
fi

echo ""
echo "=========================================="
echo "7. 可选：清理常见开发缓存"
echo "=========================================="

read -p "是否清理 ~/Library/Caches 和 ~/node_modules? (y/N): " cleanup
if [ "$cleanup" = "y" ] || [ "$cleanup" = "Y" ]; then
  if [ -d "$HOME_DIR/node_modules" ]; then
    echo "   删除 ~/node_modules..."
    rm -rf "$HOME_DIR/node_modules"
    echo "   ✓ 已删除"
  fi
  if [ -d "$HOME_DIR/Library/Caches" ]; then
    echo "   清理 ~/Library/Caches (保留结构)..."
    find "$HOME_DIR/Library/Caches" -maxdepth 1 -mindepth 1 -exec rm -rf {} + 2>/dev/null || true
    echo "   ✓ 已清理"
  fi
fi

echo ""
echo "=========================================="
echo "完成！磁盘已释放约 $BEFORE"
echo "=========================================="
df -h / | tail -1
