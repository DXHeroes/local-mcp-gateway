#!/bin/bash
set -e

# Directory for certs
CERT_DIR="$HOME/.local-mcp-data/certs"
mkdir -p "$CERT_DIR"

KEY_FILE="$CERT_DIR/localhost.key"
CRT_FILE="$CERT_DIR/localhost.crt"

if [ -f "$KEY_FILE" ] && [ -f "$CRT_FILE" ]; then
  echo "✅ Certificates already exist in $CERT_DIR"
else
  echo "Generating self-signed certificates..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CRT_FILE" \
    -subj "/CN=localhost"
  echo "✅ Generated certificates in $CERT_DIR"
fi

