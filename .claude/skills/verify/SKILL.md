# Verify skill – bobil26 dashboard

## Launch

```bash
# Start the proxy server (serves HTML + proxies /api/chat to Anthropic)
python3 /home/joraknes/bobil26/server.py &
sleep 1
# Confirm it's up:
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/dashboard.html
```

## Drive

```javascript
// Playwright path
const {chromium} = require('/home/joraknes/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
```

URL: `http://localhost:8080/dashboard.html`

## Key flows to drive

- **Border crossing rows**: inject legs via `legs[]` + `renderTrip()`, check `.brow` position vs `[data-field="til"]` values
- **Google Maps button**: call `fld(id,'fra',val)`, check `#ml{id}` href and `.off` class
- **AI chat**: fill `#iant` with key, use `#ai-inp` + `#ai-btn`, wait for `.ai-msg.a` (not `.thinking`) to appear
- **No-key error**: clear `localStorage.removeItem('anthrKey')` before sending, expect `.ai-msg.err`
- **Clear**: call `aiClear()`, expect 1 `.ai-msg` remaining

## Gotchas

- Port 8080 may already be occupied by `python3 -m http.server 8080` — kill with `fuser -k 8080/tcp`
- `$ANTHROPIC_API_KEY` (Claude Code session key) returns 401 from Anthropic Messages API — use a real `sk-ant-...` user key
- `renderTrip()` re-renders the DOM; always re-query elements after calling it
