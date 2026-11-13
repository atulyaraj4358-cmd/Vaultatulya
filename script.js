'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TABS = ['All','APK','PDF','ZIP','Apps','Games'];
const THEMES = {aurora:'🌌',sunset:'🌅',ocean:'🌊',candy:'🍬',neon:'🌃',forest:'🌲'};
let S = {version:0, files:[], apps:[]}, tab = 'All', q = '', hidden = new Set(), fresh = {}, known = null, fails = 0, loaded = false;
let tok = sessionStorage.getItem('av_tok'), user = localStorage.getItem('av_user') || '';

/* ---------- toasts & confetti ---------- */
function toast(kind, msg, action) {
  const t = document.createElement('div'); t.className = 'toast glass ' + kind;
  const s = document.createElement('span'); s.textContent = ({success:'✅ ',error:'⚠️ ',info:'ℹ️ '}[kind] || '') + msg; t.append(s);
  if (action) { const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = action.label; b.onclick = () => { action.fn(); t.remove(); }; t.append(b); }
  t.append(document.createElement('i')); $('#toasts').append(t);
  let x0 = null; t.onpointerdown = e => x0 = e.clientX; t.onpointerup = e => { if (x0 !== null && e.clientX - x0 > 60) t.remove(); };
  setTimeout(() => t.remove(), action ? 6500 : 4000);
}
function confetti() {
  for (let i = 0; i < 36; i++) { const e = document.createElement('span'); e.className = 'cf'; e.textContent = '🎉✨🎊💎🔒'[i % 5 * 2 % 5] || '🎉';
    e.style.left = Math.random() * 100 + 'vw'; e.style.setProperty('--x', (Math.random() * 200 - 100) + 'px'); e.style.animationDelay = Math.random() * .5 + 's';
    document.body.append(e); setTimeout(() => e.remove(), 3000); }
}

/* ---------- API ---------- */
async function api(action, body, retry = 1) {
  const o = body ? {method:'POST', credentials:'include', headers:{'Content-Type':'application/json','X-Admin-Token':tok || ''}, body:JSON.stringify(body)} : {credentials:'include', cache:'no-store'};
  const r = await fetch('api.php?action=' + action, o), t = await r.text(); let j;
  try { j = JSON.parse(t); } catch (e) {
    if (retry) return api(action, body, 0);
    toast('error', 'Server returned HTML. Open the site once in a normal browser tab and try again.'); throw e;
  }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Error'), {status:r.status});
  return j;
}
function setDot(s) { $('#dot').className = 'dot ' + s; $('#pill').hidden = s !== 'off'; }

/* ---------- sync ---------- */
async function load() {
  setDot('sync');
  try {
    const d = await api('list'); fails = 0; setDot('');
    const all = [...d.files, ...d.apps];
    if (known) all.filter(x => !known.has(x.id) && x.addedBy !== '__me').forEach(x => {
      fresh[x.id] = Date.now() + 60000;
      toast('info', '🆕 New file added: ' + x.title, {label:'View', fn:() => { $('#search').value = ''; q = ''; tab = 'All'; render(); document.querySelector('[data-id="' + x.id + '"]')?.scrollIntoView({behavior:'smooth', block:'center'}); }});
    });
    known = new Set(all.map(x => x.id)); S = d; render();
  } catch (e) { fails++; setDot('off'); }
}
async function poll() {
  let wait = document.hidden ? 30000 : 5000;
  try { const v = await api('version'); fails = 0; setDot(''); if (v.version !== S.version) await load(); }
  catch (e) { fails++; setDot('off'); wait = Math.min(60000, 5000 * 2 ** fails); }
  setTimeout(poll, wait);
}
['focus', 'online'].forEach(e => addEventListener(e, load)); document.addEventListener('visibilitychange', () => !document.hidden && load());

/* ---------- render ---------- */
function items() {
  const all = [...S.files.map(x => ({...x, kind:'files'})), ...S.apps.map(x => ({...x, kind:'apps'}))].filter(x => !hidden.has(x.id));
  const f = all.filter(x => tab === 'All' || (tab === 'Apps' ? x.kind === 'apps' || x.type === 'APP' : tab === 'Games' ? x.type === 'GAME' : x.type === tab));
  if (!q) return f;
  const k = q.toLowerCase(); return f.filter(x => [x.title, x.desc, x.type, ...(x.tags || [])].join(' ').toLowerCase().includes(k));
}
function hl(s) { const e = esc(s); if (!q) return e; return e.replace(new RegExp('(' + esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); }
function render() {
  const list = items(), g = $('#grid'), old = {};
  g.querySelectorAll('.card').forEach(c => old[c.dataset.id] = c.getBoundingClientRect());
  g.innerHTML = list.length ? list.map((x, i) => `<article class="card glass" data-id="${esc(x.id)}" data-kind="${x.kind}" style="--i:${loaded ? 0 : i}">
    ${fresh[x.id] > Date.now() ? '<span class="new">NEW</span>' : ''}<span class="ic">${esc(x.icon)}</span>
    <h3>${hl(x.title)}</h3><p>${hl(x.desc)}</p>
    <div class="meta">${esc(x.type)} · ${esc(x.size || '—')} · ${esc((x.date || '').slice(0, 10))} · ⬇️ ${+x.downloads || 0}</div>
    <div class="row"><button class="btn" data-a="dl">⬇️</button><button class="btn ghost" data-a="view">👁️</button><button class="btn ghost" data-a="share">🔗</button>${tok ? '<button class="btn ghost" data-a="del">🗑️</button>' : ''}</div></article>`).join('')
    : '<div class="empty">🔍 Nothing here yet. Try another search or tab.</div>';
  g.querySelectorAll('.card').forEach(c => { const o = old[c.dataset.id]; if (!o) return; const n = c.getBoundingClientRect();
    c.style.animation = 'none'; c.animate([{transform:`translate(${o.left - n.left}px,${o.top - n.top}px)`}, {transform:'none'}], {duration:450, easing:'cubic-bezier(.2,1.4,.3,1)'}); });
  loaded = true;
}
function byId(id) { return items().find(x => x.id === id) || [...S.files, ...S.apps].find(x => x.id === id); }

/* ---------- modal ---------- */
let lastFocus;
function modal(html) {
  lastFocus = document.activeElement; const m = $('#modal'); m.innerHTML = `<div class="sheet glass" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false;
  (m.querySelector('input,textarea,button') || m).focus();
}
function closeModal() { $('#modal').hidden = true; lastFocus?.focus(); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.dataset.close !== undefined) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab' && !$('#modal').hidden) { const f = [...$('#modal').querySelectorAll('input,textarea,select,button')], a = document.activeElement;
    if (e.shiftKey && a === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && a === f.at(-1)) { e.preventDefault(); f[0].focus(); } }
});

/* ---------- card actions ---------- */
$('#grid').addEventListener('click', async e => {
  const b = e.target.closest('button[data-a]'); if (!b) return; const c = b.closest('.card'), id = c.dataset.id, x = byId(id); if (!x) return;
  if (b.dataset.a === 'dl') { window.open(x.link, '_blank', 'noopener'); toast('success', 'Download started'); confetti(); api('increment_download', {id, kind:c.dataset.kind}).then(load).catch(() => {}); }
  if (b.dataset.a === 'share') { try { await navigator.clipboard.writeText(x.link); } catch { const t = document.createElement('textarea'); t.value = x.link; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); } toast('success', 'Link copied 🔗'); }
  if (b.dataset.a === 'view') modal(`<h2>${esc(x.icon)} ${esc(x.title)}</h2><p>${esc(x.desc)}</p><p>${esc(x.type)} · ${esc(x.size)} · ⬇️ ${+x.downloads || 0}</p><p>${(x.tags || []).map(t => '#' + esc(t)).join(' ')}</p><button class="btn" data-close>Close</button>`);
  if (b.dataset.a === 'del') {
    hidden.add(id); c.classList.add('out'); let undone = false;
    toast('info', 'Deleted “' + x.title + '”', {label:'Undo', fn:() => { undone = true; hidden.delete(id); render(); }});
    setTimeout(async () => { if (undone) return; try { await api('delete', {id}); } catch (er) { hidden.delete(id); toast('error', er.message); } load(); }, 6500);
  }
});
document.addEventListener('pointermove', e => { const c = e.target.closest?.('.card'); if (!c) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%'); c.style.transform = `perspective(700px) rotateY(${(x - .5) * 12}deg) rotateX(${(.5 - y) * 12}deg)`; });
document.addEventListener('pointerout', e => { const c = e.target.closest?.('.card'); if (c) c.style.transform = ''; });

/* ---------- login ---------- */
function paintUser() { $('#who').textContent = user ? (tok ? '👑 ' : '👤 ') + user : ''; $('#loginBtn').textContent = user ? 'Log out' : 'Log in'; $('#admin').hidden = !tok; render(); }
$('#loginBtn').onclick = () => {
  if (user) { user = ''; tok = null; localStorage.removeItem('av_user'); sessionStorage.removeItem('av_tok'); paintUser(); return toast('info', 'Logged out'); }
  modal(`<h2>🔒 Log in</h2><div class="f"><input id="lu" placeholder="Username" autocomplete="username"><input id="lp" type="password" placeholder="Password" autocomplete="current-password"><button class="btn" id="lgo">Log in</button></div>`);
  $('#lgo').onclick = async () => {
    const u = $('#lu').value.trim(), p = $('#lp').value; if (!u || !p) return toast('error', 'Enter username and password');
    if (u === 'atulya') { try { const r = await api('login', {user:u, pass:p}); tok = r.token; sessionStorage.setItem('av_tok', tok); } catch (e) { return toast('error', e.status === 403 ? 'Wrong admin credentials' : 'Login failed'); } }
    user = u; localStorage.setItem('av_user', u); closeModal(); paintUser(); toast('success', 'Welcome, ' + u + '!' + (tok ? ' 👑' : ''));
  };
};

/* ---------- admin add ---------- */
function addForm(app) {
  modal(`<h2>${app ? '📱 Add App' : '➕ Add File'}</h2><div class="f"><input id="t" placeholder="Title" maxlength="80"><textarea id="d" placeholder="Description" maxlength="300"></textarea>
  <select id="ty">${(app ? ['APP','GAME','APK','ZIP'] : ['APK','PDF','ZIP']).map(t => `<option>${t}</option>`).join('')}</select><input id="sz" placeholder="Size (e.g. 24 MB)"><input id="ln" type="url" placeholder="https://download-link"><input id="ic" placeholder="Emoji icon (optional)" maxlength="4"><input id="tg" placeholder="Tags, comma separated"><button class="btn" id="pub">Publish</button></div>`);
  $('#pub').onclick = async () => {
    const b = {kind:app ? 'apps' : 'files', title:$('#t').value, desc:$('#d').value, type:$('#ty').value, size:$('#sz').value, link:$('#ln').value, icon:$('#ic').value, tags:$('#tg').value.split(',').map(s => s.trim()).filter(Boolean)};
    if (!b.title.trim()) return toast('error', 'Please add a title');
    if (!/^https?:\/\//i.test(b.link)) return toast('error', 'Link must start with http:// or https://');
    if (!confirm('Publish “' + b.title + '” for everyone?')) return;
    try { const r = await api('add', b); known?.add(r.item.id); closeModal(); confetti(); toast('success', 'Published!'); load(); } catch (e) { toast('error', e.status === 403 ? 'Session expired. Log in again.' : e.message); }
  };
}
$('#addBtn').onclick = () => addForm(false); $('#addApp').onclick = () => addForm(true);

/* ---------- UI setup ---------- */
$('#tabs').innerHTML = TABS.map(t => `<button role="tab" aria-selected="${t === 'All'}">${t}</button>`).join('');
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; tab = b.textContent; $('#tabs').querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b)); render(); };
$('#search').oninput = e => { q = e.target.value.trim(); render(); };
$('#themes').innerHTML = Object.entries(THEMES).map(([k, v]) => `<button data-t="${k}" title="${k}" aria-label="${k} theme" style="background:var(--a)">${''}</button>`).join('');
const PAL = {aurora:'#7c5cff,#00d4ff', sunset:'#ff5e62,#ff9966', ocean:'#0072ff,#00c6ff', candy:'#ff6ec4,#7873f5', neon:'#b026ff,#00ffa3', forest:'#11998e,#38ef7d'};
$('#themes').querySelectorAll('button').forEach(b => b.style.background = `linear-gradient(135deg,${PAL[b.dataset.t]})`);
function setTheme(t) { document.documentElement.dataset.theme = t; localStorage.setItem('av_theme', t); $('#themes').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t)); }
$('#themes').onclick = e => { const b = e.target.closest('button'); if (b) setTheme(b.dataset.t); };
setTheme(localStorage.getItem('av_theme') in THEMES ? localStorage.getItem('av_theme') : 'aurora');
$('#title').innerHTML = [...'Everything you love. One Vault.'].map((c, i) => c === ' ' ? ' ' : `<span style="animation-delay:${i * 45}ms">${esc(c)}</span>`).join('');
const words = ['APK','PDF','ZIP','GAME','APP']; let wi = 0;
setInterval(() => { const w = $('#word'); w.classList.add('out'); setTimeout(() => { wi = (wi + 1) % 5; w.textContent = words[wi]; w.classList.remove('out'); }, 400); }, 2200);
addEventListener('scroll', () => { const h = document.documentElement; $('#prog').style.transform = `scaleX(${scrollY / Math.max(1, h.scrollHeight - innerHeight)})`; document.querySelector('nav').style.backdropFilter = `blur(${24 + Math.min(scrollY / 20, 16)}px) saturate(180%)`; }, {passive:true});
let taps = 0, tt; $('#logo').onclick = () => { taps++; clearTimeout(tt); tt = setTimeout(() => taps = 0, 1500); if (taps >= 5) { taps = 0; confetti(); confetti(); } };
paintUser(); load().then(() => setTimeout(poll, 5000));

/* ===== Phase 4: Animation Booster ===== */
(() => {
const de = document.documentElement, LV = ['high', 'low', 'off'];
let fx = LV.includes(localStorage.getItem('av_fx')) ? localStorage.getItem('av_fx') : 'high';
if (matchMedia('(prefers-reduced-motion:reduce)').matches) fx = 'off';
const fxb = document.createElement('button'); fxb.className = 'btn sm ghost'; $('#themes').before(fxb);
const setFx = (v, keep, auto) => { fx = v; de.dataset.fx = v; fxb.textContent = '✨ ' + v[0].toUpperCase() + v.slice(1); if (keep) localStorage.setItem('av_fx', v); if (auto) toast('info', 'Effects set to ' + v + ' for smoother speed'); };
fxb.onclick = () => setFx(LV[(LV.indexOf(fx) + 1) % 3], true); setFx(fx);

/* loader: ring draws itself, then liquid circle reveal */
const L = document.createElement('div'); L.id = 'loader'; L.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/></svg><span>🔒</span>'; document.body.append(L);
setTimeout(() => L.classList.add('gone'), fx === 'off' ? 100 : 1300); setTimeout(() => L.remove(), fx === 'off' ? 300 : 2200);

/* skeleton shimmer until first data */
if (!known) $('#grid').innerHTML = '<div class="card glass sk"></div>'.repeat(6);

/* stars, shooting stars, floating emoji, FPS guard */
const cv = document.createElement('canvas'); cv.id = 'fxc'; cv.setAttribute('aria-hidden', 'true'); document.body.prepend(cv); const c = cv.getContext('2d');
let w, h; const rs = () => { w = cv.width = innerWidth; h = cv.height = innerHeight; }; rs(); addEventListener('resize', rs);
const stars = Array.from({length:90}, () => ({x:Math.random(), y:Math.random(), r:Math.random() * 1.6 + .4, p:Math.random() * 6}));
const em = Array.from({length:10}, (_, i) => ({x:Math.random(), y:Math.random(), e:'🎮📱🤖📄🗜️✨'[[0, 2, 4, 5, 7, 9][i % 6]] || '✨', s:Math.random() * .3 + .15}));
let shoot = null, t0 = 0, fr = 0, low = 0, prev = 0;
(function loop(t) {
  requestAnimationFrame(loop);
  if (t - prev > 500) { t0 = t; fr = 0; } prev = t; fr++;
  if (t - t0 >= 1000) { const f = fr; fr = 0; t0 = t; if (f < 30 && !document.hidden && fx !== 'off') { if (++low >= 3) { low = 0; setFx(fx === 'high' ? 'low' : 'off', true, true); } } else low = 0; }
  c.clearRect(0, 0, w, h); if (fx === 'off') return;
  c.fillStyle = '#fff'; stars.slice(0, fx === 'high' ? 90 : 30).forEach(s => { c.globalAlpha = .25 + .75 * Math.abs(Math.sin(t / 700 + s.p)); c.fillRect(s.x * w, s.y * h, s.r, s.r); });
  if (fx !== 'high') return;
  c.globalAlpha = .45; c.font = '20px serif'; em.forEach(o => { o.y -= o.s / 600; if (o.y < -.05) o.y = 1.05; c.fillText(o.e, o.x * w + Math.sin(t / 1500 + o.x * 9) * 14, o.y * h); });
  if (!shoot && Math.random() < .004) shoot = {x:Math.random() * w, y:Math.random() * h * .4, l:1};
  if (shoot) { c.globalAlpha = shoot.l; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(shoot.x, shoot.y); c.lineTo(shoot.x - 70, shoot.y - 28); c.stroke(); shoot.x += 14; shoot.y += 5.5; shoot.l -= .03; if (shoot.l <= 0) shoot = null; }
  c.globalAlpha = 1;
})(0);

/* cursor glow, sparkle trail, orb parallax + gyroscope, magnetic buttons, ripple */
const glow = document.createElement('div'); glow.id = 'glow'; document.body.append(glow); let lt = 0; const orbs = $('.orbs');
document.addEventListener('pointermove', e => {
  glow.style.transform = `translate(${e.clientX - 100}px,${e.clientY - 100}px)`; orbs.style.setProperty('--px', e.clientX / innerWidth - .5); orbs.style.setProperty('--py', e.clientY / innerHeight - .5);
  if (fx === 'high' && e.timeStamp - lt > 45) { lt = e.timeStamp; const s = document.createElement('span'); s.className = 'sp'; s.textContent = '✨'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; document.body.append(s); setTimeout(() => s.remove(), 650); }
  const b = e.target.closest?.('.btn'); if (b && fx === 'high') { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .15}px ${(e.clientY - r.top - r.height / 2) * .25}px`; }
});
document.addEventListener('pointerout', e => { const b = e.target.closest?.('.btn'); if (b) b.style.translate = ''; });
addEventListener('deviceorientation', e => { if (e.gamma == null) return; orbs.style.setProperty('--px', Math.max(-.5, Math.min(.5, e.gamma / 90))); orbs.style.setProperty('--py', Math.max(-.5, Math.min(.5, (e.beta - 45) / 90))); });
document.addEventListener('pointerdown', e => { const b = e.target.closest('.btn'); if (!b || fx === 'off') return; const r = b.getBoundingClientRect(), s = document.createElement('span'); s.className = 'rip'; s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px'; b.append(s); setTimeout(() => s.remove(), 650); });

/* theme colour wave from the clicked dot */
$('#themes').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || fx === 'off') return; const r = b.getBoundingClientRect(), d = document.createElement('div'); d.className = 'wave';
  d.style.left = r.left + r.width / 2 + 'px'; d.style.top = r.top + r.height / 2 + 'px'; d.style.background = `linear-gradient(135deg,${PAL[b.dataset.t]})`; document.body.append(d); setTimeout(() => d.remove(), 950); });

/* liquid tab indicator */
const tabs = $('#tabs'), ind = document.createElement('i'); ind.className = 'ind'; tabs.prepend(ind);
const mv = () => { const b = tabs.querySelector('[aria-selected=true]'); if (b) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft}px)`; } };
tabs.addEventListener('click', () => requestAnimationFrame(mv)); addEventListener('resize', mv); mv(); document.fonts?.ready.then(mv);

/* download button: ring then check */
$('#grid').addEventListener('click', e => { const b = e.target.closest('button[data-a=dl]'); if (!b || b.dataset.busy) return; b.dataset.busy = 1;
  b.innerHTML = '<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/></svg>'; setTimeout(() => b.textContent = '✅', 1300); setTimeout(() => { b.textContent = '⬇️'; delete b.dataset.busy; }, 2600); });

/* fireworks on confetti (publish, new best, logo x5) + Konami emoji rain */
function fireworks() { for (let k = 0; k < 3; k++) setTimeout(() => { const x = innerWidth * (.15 + Math.random() * .7), y = innerHeight * (.15 + Math.random() * .4), em2 = '🎆✨💥🌟'[k % 4 * 2 % 4] || '✨';
  for (let i = 0; i < 18; i++) { const s = document.createElement('span'), a = i / 18 * 6.283; s.className = 'fw'; s.textContent = i % 3 ? '✨' : '🎆'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', Math.cos(a) * 110 + 'px'); s.style.setProperty('--dy', Math.sin(a) * 110 + 'px'); document.body.append(s); setTimeout(() => s.remove(), 1100); } }, k * 250); }
const _cf = confetti; confetti = function () { _cf(); if (fx === 'high') fireworks(); };
const KON = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']; let ki = 0;
document.addEventListener('keydown', e => { ki = e.key === KON[ki] ? ki + 1 : (e.key === KON[0] ? 1 : 0); if (ki === KON.length) { ki = 0; toast('success', 'Konami! 🎮');
  for (let i = 0; i < 60; i++) { const s = document.createElement('span'); s.className = 'cf'; s.textContent = ['🎮','📱','🤖','📄','🗜️','✨','🔒'][i % 7]; s.style.left = Math.random() * 100 + 'vw'; s.style.setProperty('--x', '0px'); s.style.animationDelay = Math.random() * 1.5 + 's'; document.body.append(s); setTimeout(() => s.remove(), 4000); } } });

/* counting-up stats + hero parallax */
const st = document.createElement('p'); st.id = 'stats'; st.className = 'tag'; st.innerHTML = '📄 <b data-n="f">0</b> files · 📱 <b data-n="a">0</b> apps · ⬇️ <b data-n="d">0</b> downloads'; $('.hero .tag').after(st);
function count(el, to) { const from = +el.dataset.v || 0, t = performance.now(); el.dataset.v = to; (function s(n) { const p = Math.min(1, (n - t) / 800); el.textContent = Math.round(from + (to - from) * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(s); })(t); }
const _r = render; render = function () { _r(); const d = [...S.files, ...S.apps].reduce((a, x) => a + (+x.downloads || 0), 0); count(st.querySelector('[data-n=f]'), S.files.length); count(st.querySelector('[data-n=a]'), S.apps.length); count(st.querySelector('[data-n=d]'), d); };
addEventListener('scroll', () => { $('.hero').style.transform = `translateY(${Math.min(scrollY, 600) * .25}px)`; $('.hero').style.opacity = Math.max(.2, 1 - scrollY / 700); }, {passive:true});
})();
