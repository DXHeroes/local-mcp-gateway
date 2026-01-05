#!/bin/bash
# =============================================================================
# Local MCP Gateway - Environment Setup Script
# =============================================================================
# This script automates the environment configuration setup:
# 1. Copies .env.example to .env
# 2. Generates BETTER_AUTH_SECRET
# 3. Prompts for optional configuration
# =============================================================================

set -e

echo "=== Local MCP Gateway - Environment Setup ==="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    read -p ".env file already exists. Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

echo "Creating .env from template..."
cp .env.example .env

echo ""
echo "Generating Better Auth secret..."
SECRET=$(openssl rand -hex 32)

# Platform-specific sed (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your-secret-key-min-32-chars-generate-with-openssl-rand-hex-32/$SECRET/" .env
    sed -i '' "s/change-me-generate-with-openssl-rand-hex-32-immediately/$SECRET/" .env
else
    # Linux
    sed -i "s/your-secret-key-min-32-chars-generate-with-openssl-rand-hex-32/$SECRET/" .env
    sed -i "s/change-me-generate-with-openssl-rand-hex-32-immediately/$SECRET/" .env
fi

echo "✓ BETTER_AUTH_SECRET generated and configured"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Environment setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your .env file has been created with:"
echo "  • BETTER_AUTH_SECRET: Generated (32 bytes)"
echo "  • PORT: 3001"
echo "  • NODE_ENV: development"
echo "  • VITE_API_URL: http://localhost:3001"
echo ""
echo "Optional configuration (edit .env to enable):"
echo "  • Email (Resend): RESEND_API_KEY"
echo "  • OAuth (Google): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
echo "  • OAuth (GitHub): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET"
echo "  • Payments (Paddle): PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET"
echo "  • Monitoring (Sentry): SENTRY_DSN"
echo ""
echo "Next steps:"
echo "  1. Review .env file: nano .env"
echo "  2. Start development: pnpm dev"
echo ""
echo "Documentation:"
echo "  • Full guide: docs/ENVIRONMENT_SETUP.md"
echo "  • Migration: docs/MIGRATION_ENV.md"
echo ""
