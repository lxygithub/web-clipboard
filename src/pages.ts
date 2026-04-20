// Pure HTML templates and CSS — no Hono app
export const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';";

const CSS_VARS = `
:root {
  --bg: #0a0a0f;
  --surface: #12121a;
  --border: rgba(0,240,255,0.15);
  --border-active: rgba(0,240,255,0.5);
  --cyan: #00f0ff;
  --purple: #7b2fff;
  --text: #e0e0e0;
  --text-dim: #808080;
  --danger: #ff4057;
  --success: #00ff88;
  --radius: 2px;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
}
a { color: var(--cyan); text-decoration: none; }
a:hover { text-decoration: underline; }
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 0;
}
.container {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 16px;
}
h1 {
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-bottom: 24px;
}
h1 .accent { color: var(--cyan); }
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.header .logo { font-size: 1rem; font-weight: 700; }
.header .logo .accent { color: var(--cyan); }
.header nav { display: flex; gap: 16px; }
.header nav a {
  color: var(--text-dim);
  font-size: 0.85rem;
  transition: color 0.2s;
}
.header nav a:hover { color: var(--cyan); text-decoration: none; }
textarea {
  width: 100%;
  min-height: 200px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 12px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
textarea:focus {
  border-color: var(--border-active);
  box-shadow: 0 0 8px rgba(0,240,255,0.1);
}
input[type="text"], input[type="password"] {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input[type="text"]:focus, input[type="password"]:focus {
  border-color: var(--border-active);
  box-shadow: 0 0 8px rgba(0,240,255,0.1);
}
select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
}
button {
  background: transparent;
  border: 1px solid var(--cyan);
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 8px 20px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
button:hover {
  background: rgba(0,240,255,0.1);
  box-shadow: 0 0 12px rgba(0,240,255,0.2);
}
button:active { transform: scale(0.98); }
button:disabled { opacity: 0.4; cursor: not-allowed; }
.char-count { font-size: 0.75rem; color: var(--text-dim); text-align: right; margin-top: 4px; }
.char-count.warn { color: var(--danger); }
.options { display: flex; gap: 12px; align-items: center; margin: 16px 0; flex-wrap: wrap; }
.options label { font-size: 0.8rem; color: var(--text-dim); display: flex; align-items: center; gap: 6px; }
.result { display: none; margin-top: 24px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.result.show { display: block; }
.result .url { font-size: 1.1rem; color: var(--cyan); word-break: break-all; margin-bottom: 12px; }
.result .qr-wrap { display: inline-block; padding: 8px; background: #fff; border-radius: var(--radius); }
.result .actions { display: flex; gap: 8px; margin-top: 12px; }
.view-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  min-height: 120px;
  max-height: 60vh;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.7;
}
.meta { display: flex; gap: 16px; font-size: 0.75rem; color: var(--text-dim); margin-top: 12px; }
.expired-banner {
  background: rgba(255,64,87,0.1);
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  padding: 8px 12px;
  color: var(--danger);
  font-size: 0.85rem;
  margin-bottom: 16px;
}
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; justify-content: center; align-items: center; }
.modal-overlay.show { display: flex; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; min-width: 300px; }
.modal h3 { margin-bottom: 12px; font-size: 1rem; }
.modal input { width: 100%; margin-bottom: 12px; }
.history-list { list-style: none; }
.history-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
.history-item:last-child { border-bottom: none; }
.history-item .history-url { font-size: 0.8rem; margin-bottom: 4px; }
.history-item .history-url a { color: var(--cyan); font-weight: 600; }
.history-item .history-preview { font-size: 0.85rem; color: var(--text); margin-bottom: 4px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-item .preview { font-size: 0.85rem; color: var(--text); margin-bottom: 4px; display: block; }
.history-item .preview-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-item .preview-link:hover { text-decoration: none; }
.history-item .preview-link:hover .preview-text { color: var(--cyan); }
.history-item .meta-info { font-size: 0.7rem; color: var(--text-dim); }
.history-item .qr-toggle { font-size: 0.65rem; padding: 2px 8px; margin-left: 8px; cursor: pointer; color: var(--text-dim); border: 1px solid var(--border); border-radius: var(--radius); background: transparent; font-family: var(--font-mono); transition: all 0.2s; }
.history-item .qr-toggle:hover { color: var(--cyan); border-color: var(--cyan); }
.history-item .qr-expand { display: none; padding: 12px 0; }
.history-item .qr-expand.show { display: block; }
.history-item .qr-expand img { display: inline-block; padding: 8px; background: #fff; border-radius: var(--radius); }
.badge { display: inline-block; font-size: 0.65rem; padding: 1px 6px; border-radius: var(--radius); margin-left: 8px; }
.badge.expired { background: rgba(255,64,87,0.15); color: var(--danger); border: 1px solid rgba(255,64,87,0.3); }
.badge.active { background: rgba(0,255,136,0.1); color: var(--success); border: 1px solid rgba(0,255,136,0.3); }
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 24px; }
.tab-bar { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
.tab { padding: 8px 16px; font-size: 0.85rem; color: var(--text-dim); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }
.empty-state { text-align: center; color: var(--text-dim); padding: 40px 0; font-size: 0.85rem; }
@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
.cursor::after { content: '█'; animation: blink 1s step-end infinite; color: var(--cyan); margin-left: 2px; }
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--surface); border: 1px solid var(--success); color: var(--success);
  padding: 8px 20px; border-radius: var(--radius); font-family: var(--font-mono);
  font-size: 0.8rem; z-index: 200; opacity: 0; transition: opacity 0.2s; pointer-events: none;
}
.toast.show { opacity: 1; }
@media (max-width: 600px) {
  .container { padding: 24px 12px; }
  .stats-bar { font-size: 0.7rem; color: var(--text-dim); margin-bottom: 4px; }
.stats-bar span { color: var(--cyan); }
h1 { font-size: 1.2rem; }
  textarea { min-height: 150px; }
  .options { flex-direction: column; align-items: flex-start; }
}
`;

function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${CSS_VARS}</style>
</head>
<body>
${body}
<div class="toast" id="toast"></div>
</body>
</html>`;
}

export const HTML_INDEX = baseHtml("网络剪切板 - 创建", `
<div class="container">
  <div class="header">
    <div class="logo"><span class="accent">></span>clip<span class="cursor"></span></div>
    <nav><a href="/history">history</a></nav>
  </div>
  <div class="stats-bar">clips created: <span id="totalClips">...</span></div>
  <h1><span class="accent">$</span> new clip</h1>
  <textarea id="textInput" placeholder="Paste or type text here..." maxlength="102400"></textarea>
  <div class="char-count" id="charCount">0 / 100KB</div>
  <div class="options">
    <label>TTL:
      <select id="expiresIn">
        <option value="3600">1h</option>
        <option value="86400" selected>24h</option>
        <option value="604800">7d</option>
        <option value="2592000">30d</option>
      </select>
    </label>
    <label>Password:
      <input type="password" id="password" placeholder="optional" style="width:120px">
    </label>
  </div>
  <button id="createBtn" onclick="createClip()">create clip</button>
  <div class="result" id="result">
    <div class="url" id="clipUrl"></div>
    <div class="qr-wrap"><img src="" id="qrImg" style="display:none"></div>
    <div class="actions">
      <button onclick="copyUrl()">copy link</button>
      <button onclick="goToView()">open</button>
    </div>
  </div>
</div>
<script>
function showToast(m){var t=document.getElementById('toast');if(t){t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}}
const MAX_SIZE = 102400;
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
let currentUrl = '';
textInput.addEventListener('input', () => {
  const len = textInput.value.length;
  charCount.textContent = len + ' / ' + (len / 1024).toFixed(1) + 'KB';
  charCount.className = 'char-count' + (len > MAX_SIZE * 0.9 ? ' warn' : '');
});
async function createClip() {
  const text = textInput.value.trim();
  if (!text) { showToast('Text is empty'); return; }
  if (text.length > 102400) { showToast('Text exceeds 100KB limit'); return; }
  const btn = document.getElementById('createBtn');
  btn.disabled = true; btn.textContent = 'creating...';
  try {
    const userId = getUserId();
    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        text: text,
        expiresIn: parseInt(document.getElementById('expiresIn').value),
        password: document.getElementById('password').value || undefined
      })
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error'); btn.disabled = false; btn.textContent = 'create clip'; return; }
    currentUrl = location.origin + data.url;
    document.getElementById('clipUrl').textContent = currentUrl;
    const qrImg = document.getElementById('qrImg');
    qrImg.src = '/api/qr/' + data.id;
    qrImg.style.display = 'block';
    document.getElementById('result').classList.add('show');
    showToast('Clip created');
  } catch (e) { showToast('Network error'); }
  btn.disabled = false; btn.textContent = 'create clip';
}
function copyUrl() { navigator.clipboard.writeText(currentUrl).then(() => showToast('Link copied')); }
function goToView() { location.href = '/view/' + currentUrl.split('/').pop(); }
function getUserId() {
  let uid = localStorage.getItem('clipboard_uid');
  if (!uid) { uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('clipboard_uid', uid); }
  return uid;
}
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('totalClips').textContent = data.total;
  } catch (e) {}
}
document.addEventListener('DOMContentLoaded', loadStats);
</script>
`);

export const HTML_VIEW = baseHtml("网络剪切板 - 查看", `
<div class="container">
  <div class="header">
    <div class="logo"><span class="accent">></span>clip<span class="cursor"></span></div>
    <nav><a href="/">new</a> <a href="/history">history</a></nav>
  </div>
  <div id="expiredBanner" class="expired-banner" style="display:none">This clip has expired. Content is still viewable.</div>
  <div class="view-content" id="clipContent" style="display:none"></div>
  <div class="meta" id="clipMeta" style="display:none">
    <span id="createdAt"></span><span id="countdown"></span>
  </div>
  <div style="margin-top:16px"><button onclick="copyContent()" id="copyBtn">copy to clipboard</button></div>
</div>
<div class="modal-overlay" id="passwordModal">
  <div class="modal">
    <h3>Password required</h3>
    <input type="password" id="passwordInput" placeholder="Enter password" onkeydown="if(event.key==='Enter')verifyPassword()">
    <button onclick="verifyPassword()">unlock</button>
  </div>
</div>
<script>
function showToast(m){var t=document.getElementById('toast');if(t){t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}}
const CLIP_ID = '__CLIP_ID__';
let clipText = '';
(async function loadClip() {
  const pw = new URLSearchParams(window.location.search).get('password');
  try {
    const res = await fetch('/api/get/' + CLIP_ID + (pw ? '?password=' + encodeURIComponent(pw) : ''));
    const data = await res.json();
    if (res.status === 403 && data.requirePassword) { document.getElementById('passwordModal').classList.add('show'); document.getElementById('passwordInput').focus(); return; }
    if (res.status === 404) { document.getElementById('clipContent').textContent = 'Clip not found'; document.getElementById('clipContent').style.display = 'block'; return; }
    if (data.expired) document.getElementById('expiredBanner').style.display = 'block';
    clipText = data.text;
    document.getElementById('clipContent').textContent = clipText;
    document.getElementById('clipContent').style.display = 'block';
    document.getElementById('clipMeta').style.display = 'flex';
    document.getElementById('createdAt').textContent = 'created: ' + formatTime(data.created_at);
    if (!data.expired) startCountdown(data.expires_at);
    else document.getElementById('countdown').textContent = 'expired: ' + formatTime(data.expires_at);
  } catch (e) { document.getElementById('clipContent').textContent = 'Failed to load clip'; document.getElementById('clipContent').style.display = 'block'; }
})();
function verifyPassword() { const pw = document.getElementById('passwordInput').value; if (!pw) return; location.href = location.pathname + '?password=' + encodeURIComponent(pw); }
function copyContent() { navigator.clipboard.writeText(clipText).then(() => showToast('Copied to clipboard')); }
function startCountdown(expiresAt) {
  const el = document.getElementById('countdown');
  function update() {
    const diff = expiresAt - Math.floor(Date.now() / 1000);
    if (diff <= 0) { el.textContent = 'expired'; return; }
    el.textContent = 'expires in: ' + (Math.floor(diff / 3600) > 0 ? Math.floor(diff / 3600) + 'h ' : '') + Math.floor((diff % 3600) / 60) + 'm ' + (diff % 60) + 's';
    setTimeout(update, 1000);
  }
  update();
}
function formatTime(ts) { const d = new Date(ts * 1000); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
</script>
`);

export const HTML_HISTORY = baseHtml("网络剪切板 - 历史", `
<div class="container">
  <div class="header">
    <div class="logo"><span class="accent">></span>clip<span class="cursor"></span></div>
    <nav><a href="/">new</a></nav>
  </div>
  <h1><span class="accent">$</span> history</h1>
  <div class="tab-bar">
    <div class="tab active" data-tab="active" onclick="switchTab('active')">active</div>
    <div class="tab" data-tab="expired" onclick="switchTab('expired')">expired</div>
  </div>
  <ul class="history-list" id="historyList"></ul>
  <div class="pagination" id="pagination"></div>
</div>
<script>
function showToast(m){var t=document.getElementById('toast');if(t){t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}}
let currentTab = 'active', currentPage = 1;
async function loadHistory() {
  try {
    const res = await fetch('/api/history?page=' + currentPage + '&limit=20');
    const data = await res.json();
    let items = (data.items || []).filter(i => currentTab === 'active' ? !i.expired : i.expired);
    const list = document.getElementById('historyList');
    if (items.length === 0) { list.innerHTML = '<div class="empty-state">No clips found</div>'; document.getElementById('pagination').innerHTML = ''; return; }
    list.innerHTML = items.map(item => {
      var url = location.origin + '/view/' + item.id;
      var content = item.hasPassword ? '<span class="content" style="color:var(--text-dim);font-style:italic">**********</span>' : '<span class="content">' + escapeHtml(item.text) + '</span>';
      return '<li class="history-item" data-id="' + item.id + '"><div class="history-url"><a href="' + url + '">/' + item.id + '</a></div><div class="history-preview">' + content + '<span class="badge ' + (item.expired ? 'expired' : 'active') + '">' + (item.expired ? 'expired' : 'active') + '</span><button class="qr-toggle" data-id="' + item.id + '">qr</button></div><div class="qr-expand" id="qr-' + item.id + '"></div><div class="meta-info">' + formatTime(item.created_at) + '</div></li>';
    }).join('');
    list.querySelectorAll('.qr-toggle').forEach(btn => btn.addEventListener('click', function() { toggleQR(this.getAttribute('data-id'), this); }));
    const pag = document.getElementById('pagination'); pag.innerHTML = '';
    if (currentPage > 1) pag.innerHTML += '<button onclick="goPage(' + (currentPage - 1) + ')">prev</button>';
    pag.innerHTML += '<span style="color:var(--text-dim);padding:8px">page ' + currentPage + '</span>';
    if (data.hasMore) pag.innerHTML += '<button onclick="goPage(' + (currentPage + 1) + ')">next</button>';
  } catch (e) { document.getElementById('historyList').innerHTML = '<div class="empty-state">Failed to load: ' + e.message + '</div>'; }
}
function switchTab(tab) { currentTab = tab; currentPage = 1; document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab)); loadHistory(); }
function goPage(p) { currentPage = p; loadHistory(); }
function toggleQR(id, btn) {
  const el = document.getElementById('qr-' + id);
  if (el.classList.contains('show')) { el.classList.remove('show'); return; }
  if (el.querySelector('img')) { el.classList.add('show'); return; }
  const img = document.createElement('img');
  img.src = '/api/qr/' + id;
  img.alt = 'QR code';
  el.appendChild(img);
  el.classList.add('show');
}
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function formatTime(ts) { const d = new Date(ts * 1000); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
function getUserId() { let uid = localStorage.getItem('clipboard_uid'); if (!uid) { uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('clipboard_uid', uid); } return uid; }
document.addEventListener('DOMContentLoaded', loadHistory);
</script>
`);
