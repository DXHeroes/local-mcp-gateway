#!/bin/sh
set -eu

runtime_api_url="${API_URL:-${VITE_API_URL:-}}"
escaped_api_url=$(printf '%s' "$runtime_api_url" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/app-config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "$escaped_api_url"
};
EOF
