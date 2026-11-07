#!/usr/bin/env bash
set -e

echo "=========================================="
echo "AccessAI Test Suite Runner"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

export PYTHONPATH="${ROOT_DIR}/apps/api"
python3 -m unittest discover -s "${ROOT_DIR}/apps/api/tests" -p "test_*.py" -v

echo "=========================================="
echo "All 17 Tests Passed Successfully!"
echo "=========================================="
