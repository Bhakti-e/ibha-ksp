"""Route coverage checker — compares api.ts calls against local_server.py routes."""
import re, sys

api_ts = open('web/app/lib/api.ts', encoding='utf-8').read()
server = open('local_server.py', encoding='utf-8').read()

# Paths from apiClient.get/post/put/delete('/...')
frontend_paths = re.findall(r"apiClient\.[a-z]+\(['\"`]([^'\"`\)]+)", api_ts)

# Routes registered: @app.route('/api/v1/...')
server_routes = re.findall(r"@app\.route\(['\"]([^'\"]+)", server)

print("=== Frontend API paths vs local_server.py routes ===")
missing = []
for p in sorted(set(frontend_paths)):
    # Normalise template literals like `/trends/forecast` and dynamic ${x}
    static = re.sub(r'\$\{[^}]+\}', '<x>', p).rstrip('/')
    # api.ts paths don't include /api/v1 prefix; strip it from server routes for comparison
    def norm(r):
        r = re.sub(r'/api/v1', '', r)
        r = re.sub(r'<[^>]+>', '<x>', r)
        return r.rstrip('/')

    matched = any(
        norm(r) == static or static.startswith(norm(r).rstrip('/'))
        for r in server_routes
    )
    status = 'OK     ' if matched else 'MISSING'
    if not matched:
        missing.append(p)
    print(f'  {status}  {p}')

print()
print(f'Registered routes: {len(server_routes)}')
print(f'Missing routes:    {len(missing)}')
if missing:
    for m in missing:
        print(f'  - {m}')
sys.exit(0 if not missing else 1)
