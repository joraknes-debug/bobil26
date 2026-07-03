#!/usr/bin/env python3
"""Bobil-dashboard: serverer statiske filer og proxyer /api/chat til Anthropic API."""
import http.server, json, os
from urllib import request as urlreq, error as urlerr

PORT = int(os.environ.get('PORT', 8080))
BASE = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kw):
        super().__init__(*args, directory=BASE, **kw)

    def do_OPTIONS(self):
        self._cors(200)

    def do_POST(self):
        if self.path != '/api/chat':
            self.send_error(404)
            return
        n = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(n)
        key = self.headers.get('X-Ant-Key', '').strip()
        if not key:
            self._json(400, {'error': {'message': 'Mangler API-nøkkel'}})
            return
        try:
            req = urlreq.Request(
                'https://api.anthropic.com/v1/messages',
                data=body,
                headers={
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                }
            )
            with urlreq.urlopen(req, timeout=60) as r:
                self._json(r.status, json.loads(r.read()))
        except urlerr.HTTPError as e:
            self._json(e.code, json.loads(e.read()))
        except Exception as e:
            self._json(502, {'error': {'message': str(e)}})

    def _cors(self, code):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Ant-Key')
        self.end_headers()

    def _json(self, code, data):
        out = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def log_message(self, fmt, *args):
        line = fmt % args
        if '/api/chat' in line:
            print('[AI]', line)

if __name__ == '__main__':
    os.chdir(BASE)
    httpd = http.server.HTTPServer(('', PORT), Handler)
    print(f'Bobil-dashboard → http://localhost:{PORT}/dashboard.html')
    print('Stopp med Ctrl+C')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStoppet.')
