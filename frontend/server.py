import os
import http.server
import socketserver

# Generate runtime-config.js with API_URL from environment
api_url = os.environ.get("API_URL", "http://localhost:5001")
with open("runtime-config.js", "w") as f:
    f.write(f"window.API_BASE_URL = '{api_url}';\n")

port = int(os.environ.get("PORT", 8080))

handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
    print(f"Serving frontend on 0.0.0.0:{port}")
    print(f"API_URL configured as: {api_url}")
    httpd.serve_forever()
