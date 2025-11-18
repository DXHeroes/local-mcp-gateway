#!/bin/sh
set -e

# Directory for certs
CERT_DIR="/etc/nginx/certs"
mkdir -p "$CERT_DIR"

KEY_FILE="$CERT_DIR/localhost.key"
CRT_FILE="$CERT_DIR/localhost.crt"

if [ ! -f "$KEY_FILE" ] || [ ! -f "$CRT_FILE" ]; then
  echo "Generating self-signed certificates inside Docker..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CRT_FILE" \
    -subj "/CN=localhost"
fi

exec "$@"

