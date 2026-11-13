'use strict';
const Phone = (() => {
const B = [{id:'store',n:'Vault Store',e:'🏪',g:'#0a84ff,#5ac8fa'},{id:'files',n:'Files',e:'🗂️',g:'#30d158,#64d2ff'},{id:'browser',n:'Browser',e:'🧭',g:'#0a84ff,#64d2ff'},{id:'settings',n:'Settings',e:'⚙️',g:'#8e8e93,#636366'},
  {id:'notes',n:'Notes',e:'📝',g:'#ffd60a,#ff9f0a'},{id:'calc',n:'Calculator',e:'🧮',g:'#ff9f0a,#ff453a'},{id:'clock',n:'Clock',e:'⏰',g:'#3a3a3c,#1c1c1e'},{id:'games',n:'Games',e:'🎮',g:'#bf5af2,#ff375f'}];
const DOCK = ['store', 'files', 'browser', 'settings'], DL = ['APK', 'ZIP', 'PDF'];
let el, scr, appEl, seen = null, badge = false, inst, clk, dp;
try { inst = JSON.parse(localStorage.getItem('av_inst') || '[]'); } catch { inst = []; }
const save = () => localStorage.setItem('av_inst', JSON.stringify(inst));
const find = id => B.find(a => a.id === id) || inst.find(a => a.id === id);
const ic = (a, i = 0) => `<button class="pi" data-app="${esc(a.id)}" style="animation-delay:${i * 50}ms"${a.id === 'store' && badge ? ' data-b' : ''}><span style="background:linear-gradient(135deg,${esc(a.g)})">${esc(a.e)}</span><small>${esc(a.n)}</small></button>`;
const paint = () => { $('#ph-home').innerHTML = `<div class="grid">${[...B.filter(a => !DOCK.includes(a.id)), ...inst].map(ic).join('')}</div><div class="dock glass">${DOCK.map(id => ic(find(id))).join('')}</div>`; };
function clock() { const d = new Date(); $('#pt').textContent = $('#lc').textContent = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); $('#ld').textContent = d.toLocaleDateString([], {weekday:'long', month:'long', day:'numeric'}); }
function note(m) { const i = $('#isl'); i.textContent = m; i.classList.add('open'); setTimeout(() => i.classList.remove('open'), 3200); }
function install(x) {
  inst.push({id:x.id, n:x.title, e:x.icon, g:'#7c5cff,#00d4ff', link:x.link, type:x.type, inst:true}); save(); paint();
  if (DL.includes(x.type)) window.open(x.link, '_blank', 'noopener');
  api('increment_download', {id:x.id, kind:'apps'}).catch(() => {}); toast('success', x.title + ' installed 📲'); note('✅ ' + x.title + ' installed');
}
const dlFile = x => { window.open(x.link, '_blank', 'noopener'); toast('success', 'Download started'); api('increment_download', {id:x.id, kind:'files'}).catch(() => {}); };

const APPS = {
  store(ab) {
    const draw = () => { ab.innerHTML = S.apps.length ? S.apps.map(x => `<div class="row2"><span>${esc(x.icon)}</span><div><b>${esc(x.title)}</b><small>${esc(x.desc)}</small><small>${esc(x.type)} · ${esc(x.size || '—')}</small></div>${inst.some(i => i.id === x.id) ? `<button class="get" data-open="${esc(x.id)}">OPEN</button>` : `<button class="get" data-get="${esc(x.id)}">GET</button>`}</div>`).join('') : '<p>🛍️ No apps yet. The admin can publish one with “+ Add App”.</p>'; };
    draw();
    ab.onclick = e => { const o = e.target.closest('[data-open]'), g = e.target.closest('[data-get]');
      if (o) return openApp(o.dataset.open, 175, 360);
      if (!g || g.disabled) return; const x = S.apps.find(a => a.id === g.dataset.get); if (!x) return;
      g.disabled = true; g.innerHTML = '<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/></svg>'; setTimeout(() => { install(x); if (ab.isConnected) draw(); }, 1700); };
  },
  files(ab) {
    ab.innerHTML = S.files.length ? S.files.map(x => `<div class="row2"><span>${esc(x.icon)}</span><div><b>${esc(x.title)}</b><small>${esc(x.type)} · ${esc(x.size || '—')} · ⬇️ ${+x.downloads || 0}</small></div><button class="get" data-f="${esc(x.id)}">⬇️</button></div>`).join('') : '<p>🗂️ The vault is empty.</p>';
    ab.onclick = e => { const b = e.target.closest('[data-f]'); const x = b && S.files.find(f => f.id === b.dataset.f); if (x) dlFile(x); };
  },
  browser(ab) {
    ab.innerHTML = '<input id="bu" type="url" placeholder="https://example.com"><div style="display:flex;gap:8px;margin:8px 0"><button class="get" id="bgo">Go</button><button class="get" id="bnt">↗ New tab</button></div><iframe id="bf" title="Browser" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style="height:60%"></iframe>';
    const u = () => { const v = $('#bu').value.trim(); return /^https?:\/\//i.test(v) ? v : v ? 'https://' + v : ''; };
    $('#bgo').onclick = () => { const v = u(); if (v) $('#bf').src = v; }; $('#bnt').onclick = () => { const v = u(); if (v) window.open(v, '_blank', 'noopener'); };
  },
  settings(ab) {
    ab.innerHTML = `<h3>🎨 Theme</h3><div style="display:flex;gap:10px;flex-wrap:wrap">${Object.entries(THEMES).map(([k, v]) => `<button class="get" data-th="${k}">${v} ${k}</button>`).join('')}</div><h3>🌗 Appearance</h3><button class="get" id="lt">Toggle dark / light</button><h3>ℹ️ About</h3><p>A Vault phone · iOS-style demo 🔒</p>`;
    ab.onclick = e => { const t = e.target.closest('[data-th]'); if (t) setTheme(t.dataset.th); if (e.target.id === 'lt') scr.classList.toggle('light'); };
  },
  notes(ab) { ab.innerHTML = '<textarea id="nt" rows="14" placeholder="Write a note…"></textarea>'; $('#nt').value = localStorage.getItem('av_notes') || ''; $('#nt').oninput = e => localStorage.setItem('av_notes', e.target.value); },
  calc(ab) {
    let cur = '0', acc = null, op = null, fresh = true; const K = ['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='];
    const f = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b ? a / b : NaN;
    ab.innerHTML = `<div class="cd" id="cd">0</div><div class="calc">${K.map(k => `<button data-k="${k}" class="${'÷×−+='.includes(k) ? 'o' : ''} ${k === '0' ? 'z' : ''}">${k}</button>`).join('')}</div>`;
    ab.onclick = e => { const k = e.target.dataset.k; if (!k) return;
      if (/\d/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; } else if (k === '.') { if (!cur.includes('.')) cur += '.'; fresh = false; }
      else if (k === 'C') { cur = '0'; acc = op = null; fresh = true; } else if (k === '±') cur = String(-cur); else if (k === '%') cur = String(cur / 100);
      else { if (op && !fresh) { acc = f(acc, +cur, op); cur = String(+acc.toFixed(10)); } else acc = +cur; op = k === '=' ? null : k; fresh = true; }
      $('#cd').textContent = cur; };
  },
  clock(ab) {
    const Z = [['New York','America/New_York'], ['London','Europe/London'], ['India','Asia/Kolkata'], ['Tokyo','Asia/Tokyo']]; let t0 = 0, run = 0, el0 = 0;
    ab.innerHTML = '<div id="wc"></div><h3>⏱️ Stopwatch</h3><div class="cd" id="sw">0.00</div><button class="get" id="ss">Start</button> <button class="get" id="sr">Reset</button>';
    const id = setInterval(() => { if (!ab.isConnected) return clearInterval(id);
      $('#wc').innerHTML = Z.map(([n, z]) => `<div class="row2"><b>${n}</b><span style="margin-left:auto">${new Date().toLocaleTimeString([], {timeZone:z, hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span></div>`).join('');
      if (run) $('#sw').textContent = ((el0 + Date.now() - t0) / 1000).toFixed(2); }, 200);
    $('#ss').onclick = e => { if (run) { el0 += Date.now() - t0; run = 0; e.target.textContent = 'Start'; } else { t0 = Date.now(); run = 1; e.target.textContent = 'Stop'; } };
    $('#sr').onclick = () => { el0 = 0; run = 0; t0 = 0; $('#sw').textContent = '0.00'; $('#ss').textContent = 'Start'; };
  }
};
function openApp(id, x = 175, y = 360) {
  const a = find(id); if (!a) return;
  if (a.id === 'games') return Games.open();
  if (a.inst && DL.includes(a.type)) return window.open(a.link, '_blank', 'noopener');
  if (id === 'store' && badge) { badge = false; paint(); }
  appEl.style.transformOrigin = x + 'px ' + y + 'px'; appEl.className = 'ph-app'; appEl.hidden = false;
  appEl.innerHTML = `<div class="ph-ah"><b>${esc(a.e)} ${esc(a.n)}</b>${a.inst ? `<a href="${esc(a.link)}" target="_blank" rel="noopener" style="color:inherit">↗</a>` : ''}</div><div class="ph-ab"></div>`;
  const ab = appEl.querySelector('.ph-ab');
  if (a.inst) { ab.style.padding = 0; ab.innerHTML = `<iframe title="${esc(a.n)}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="${esc(a.link)}"></iframe>`; } else APPS[id](ab);
}
function closeApp() { if (appEl.hidden) return false; appEl.classList.add('closing'); setTimeout(() => { appEl.hidden = true; appEl.innerHTML = ''; }, 250); return true; }
function build() {
  el = document.createElement('div'); el.id = 'phone'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Virtual iPhone');
  el.innerHTML = '<div class="ph-screen"><div class="isl" id="isl"></div><div class="ph-top"><b id="pt"></b><span>📶 🛜 🔋</span></div><div class="home" id="ph-home"></div><div class="lock" id="ph-lock"><div class="lc" id="lc"></div><div id="ld"></div><p>⬆️ Swipe up to unlock</p></div><div class="ph-app" id="ph-app" hidden></div><div class="hind" id="hind" role="button" aria-label="Home"></div></div><button class="ph-x" aria-label="Close phone">✖️</button>';
  document.body.append(el); scr = el.firstChild; appEl = $('#ph-app');
  const h = $('#ph-home'); let lp = false, lt;
  h.addEventListener('pointerdown', e => { const b = e.target.closest('.pi'); if (!b) return; lp = false; clearTimeout(lt);
    lt = setTimeout(() => { const a = inst.find(x => x.id === b.dataset.app); if (a) { lp = true; b.classList.add('jig'); if (confirm('Delete “' + a.n + '”?')) { inst = inst.filter(x => x !== a); save(); paint(); } else b.classList.remove('jig'); } }, 700); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => h.addEventListener(t, () => clearTimeout(lt)));
  h.addEventListener('click', e => { const b = e.target.closest('.pi'); if (!b) return; if (lp) { lp = false; return; } const r = b.getBoundingClientRect(), s = scr.getBoundingClientRect(); openApp(b.dataset.app, r.left - s.left + r.width / 2, r.top - s.top + r.height / 2); });
  const lock = $('#ph-lock'); let sy = 0; lock.addEventListener('pointerdown', e => sy = e.clientY); lock.addEventListener('pointerup', e => { if (sy - e.clientY > 50 || Math.abs(sy - e.clientY) < 6) lock.classList.add('up'); });
  $('#hind').onclick = () => { if (!closeApp()) lock.classList.add('up'); };
  el.querySelector('.ph-x').onclick = close;
  $('.ph-top').addEventListener('pointerdown', e => { if (innerWidth <= 520) return; const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top; const mv = ev => { el.style.left = ev.clientX - ox + 'px'; el.style.top = ev.clientY - oy + 'px'; }; addEventListener('pointermove', mv); addEventListener('pointerup', () => removeEventListener('pointermove', mv), {once:true}); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden && !closeApp()) close(); });
  paint();
}
function open() { if (!el) build(); el.hidden = false; $('#ph-lock').classList.remove('up'); appEl.hidden = true; paint(); clock(); clearInterval(clk); clk = setInterval(clock, 1000); el.querySelector('.ph-x').focus(); }
function close() { el.hidden = true; clearInterval(clk); $('#phoneBtn').focus(); }
function sync() {
  if (!seen) { seen = new Set(S.apps.map(a => a.id)); return; }
  S.apps.filter(a => !seen.has(a.id)).forEach(a => { seen.add(a.id); if (inst.some(i => i.id === a.id)) return; badge = true; if (el && !el.hidden) { note('🆕 ' + a.title + ' in Vault Store'); paint(); } });
}
const pb = document.createElement('button'); pb.id = 'phoneBtn'; pb.className = 'btn'; pb.textContent = '📱 Open Phone'; pb.onclick = () => (el && !el.hidden ? close() : open()); document.body.append(pb);
const ib = document.createElement('button'); ib.className = 'btn sm ghost'; ib.hidden = true; ib.textContent = '📲 Add to Home Screen'; $('#loginBtn').before(ib);
addEventListener('beforeinstallprompt', e => { e.preventDefault(); dp = e; ib.hidden = false; });
ib.onclick = async () => { if (dp) { dp.prompt(); await dp.userChoice; dp = null; ib.hidden = true; } };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
return {open, close, sync};
})();
{ const _r = render; render = function () { _r(); Phone.sync(); }; }
