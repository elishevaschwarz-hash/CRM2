#!/bin/sh
echo "window.API_BASE_URL = '${API_URL:-http://localhost:5001}';" > /app/runtime-config.js
python -m http.server 8080
