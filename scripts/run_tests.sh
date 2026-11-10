#!/usr/bin/env bash
set -e

echo "=========================================="
echo "AccessAI Test Suite Runner"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

export PYTHONPATH="${ROOT_DIR}/apps/api"
if [ -f "${ROOT_DIR}/.venv/bin/python3" ]; then
    PYTHON_BIN="${ROOT_DIR}/.venv/bin/python3"
else
    PYTHON_BIN="python3"
fi

"${PYTHON_BIN}" -m unittest discover -s "${ROOT_DIR}/apps/api/tests" -p "test_*.py" -v

echo "=========================================="
echo "Running Real-World Live Acceptance Suite"
echo "=========================================="
"${PYTHON_BIN}" "${ROOT_DIR}/scripts/live_acceptance_test.py"

echo "=========================================="
echo "All AccessAI Tests Passed Successfully!"
echo "=========================================="
