#!/bin/bash
set -e

# Generate certs if needed
./scripts/generate-certs.sh

CERT_DIR="$HOME/.local-mcp-data/certs"
CONFIG_TEMPLATE="nginx/local.conf.template"
CONFIG_FILE="nginx/local.conf"

# Replace placeholders in template
sed "s|CERT_KEY_PATH|$CERT_DIR/localhost.key|g" "$CONFIG_TEMPLATE" > "$CONFIG_FILE"
sed -i "" "s|CERT_CRT_PATH|$CERT_DIR/localhost.crt|g" "$CONFIG_FILE"

echo "Starting local Nginx..."
echo "HTTP: http://localhost:8080"
echo "HTTPS: https://localhost:8443"

nginx -c "$(pwd)/$CONFIG_FILE"

