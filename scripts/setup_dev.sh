#!/usr/bin/env bash
set -e

echo "=== AccessAI Environment Setup ==="
echo "Checking Python..."
python3 --version

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Verifying test suite..."
./scripts/run_tests.sh

echo "=== Setup complete! ==="
