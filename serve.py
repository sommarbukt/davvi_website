"""Lokale Vorschau mit kurzen URLs wie auf Vercel (/chalets statt /chalets.html).
Start: im Ordner website  `python serve.py`  → http://localhost:8000  (Beenden: Strg+C)"""
import http.server, os, socketserver
PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path, _, query = self.path.partition('?')
        local = path.lstrip('/').split('#')[0]
        # /chalets → chalets.html (wie cleanUrls bei Vercel)
        if local and not os.path.splitext(local)[1] and os.path.isfile(local + '.html'):
            self.path = '/' + local + '.html' + ('?' + query if query else '')
        # /chalets.html → 308 auf /chalets (wie Vercel)
        elif local.endswith('.html') and local != 'slider-lab.html' and os.path.isfile(local):
            target = '/' if local == 'index.html' else '/' + local[:-5]
            self.send_response(308); self.send_header('Location', target + ('?' + query if query else '')); self.end_headers()
            return None
        return super().send_head()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'DAVVI lokal: http://localhost:{PORT}  (Strg+C beendet)')
    httpd.serve_forever()
