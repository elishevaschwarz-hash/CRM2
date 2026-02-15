#!/bin/sh
# Railway Frontend Entrypoint
# Generates config.js with runtime API_URL, then serves static files

# Get environment variables
API_URL="${API_URL:-http://localhost:5001}"
PORT="${PORT:-3000}"

# Generate config.js with the runtime API_URL
cat > /app/frontend/config.js <<EOF
// ─── Runtime Configuration ──────────────────────────────────────────────────
// Generated at container startup by entrypoint.sh

window.API_BASE_URL = '$API_URL';
EOF

echo "Generated config.js with API_BASE_URL=$API_URL"

# Change to the frontend directory and serve via Python's http.server
cd /app/frontend
echo "Starting HTTP server on port $PORT..."
python3 -m http.server $PORT
