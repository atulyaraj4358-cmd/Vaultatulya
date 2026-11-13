'use strict';
const Games = (() => {
const W = 360, H = 520, LIST = [{id:'merge',n:'Brainrot Merge',e:'🐸'},{id:'snake',n:'Emoji Snake',e:'🐍'},{id:'memory',n:'Emoji Memory Match',e:'🧠'}];
let ov, cv, cx, cur, cid, raf, last = 0, done = false, fx = [], tx = [], shk = 0, ac, mute = localStorage.getItem('av_mute') === '1';
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const best = id => +localStorage.getItem('av_best_' + id) || 0, rnd = n => Math.random() * n | 0;
function beep(f = 440, d = .08) { if (mute) return; try { ac = ac || new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.value = .05; o.connect(g); g.connect(ac.destination); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.start(); o.stop(ac.currentTime + d); } catch {} }
function burst(x, y, e = '✨', n = 12) { for (let i = 0; i < n; i++) fx.push({x, y, vx:(Math.random() - .5) * 7, vy:(Math.random() - .5) * 7 - 2, l:1, e}); }
function float(x, y, t, c = '#fff') { tx.push({x, y, t, c, l:1}); }
const H_ = {beep, burst, float, shake:n => shk = calm ? 0 : n};
function drawFx() {
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  fx.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .15; p.l -= .02; cx.globalAlpha = Math.max(p.l, 0); cx.font = '16px serif'; cx.fillText(p.e, p.x, p.y); });
  tx.forEach(p => { p.y -= 1; p.l -= .018; cx.globalAlpha = Math.max(p.l, 0); cx.fillStyle = p.c; cx.font = 'bold 20px system-ui'; cx.fillText(p.t, p.x, p.y); });
  cx.globalAlpha = 1; fx = fx.filter(p => p.l > 0); tx = tx.filter(p => p.l > 0);
}
const rr = (x, y, w, h, r) => { cx.beginPath(); (cx.roundRect || cx.rect).call(cx, x, y, w, h, r); };

/* ---------- Brainrot Merge ---------- */
function merge(h) {
  const E = ['🐸','🐹','🐱','🐶','🦊','🐼','🦁','🐘','🐉'], R = [16,21,27,33,40,47,55,63,72];
  let balls = [], aim = W / 2, cd = 0, acc = 0, c = rnd(4), nx = rnd(4); const g = {score:0, over:false};
  const step = () => {
    cd--; const add = [];
    for (const b of balls) {
      b.vy += .35; b.vx *= .995; b.vy *= .995; b.x += b.vx; b.y += b.vy; b.age++;
      if (b.x < b.r) { b.x = b.r; b.vx *= -.3; } if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -.3; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy *= -.2; b.vx *= .98; }
    }
    for (let k = 0; k < 2; k++) for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j]; if (a.dead || b.dead) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r; if (d >= m || d === 0) continue;
      if (a.t === b.t && a.t < 8) {
        a.dead = b.dead = true; const t = a.t + 1, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
        add.push({x, y, vx:0, vy:0, t, r:R[t], age:0}); g.score += t * 10; h.burst(x, y, E[t], 10); h.float(x, y, '+' + t * 10, '#ffd60a'); h.beep(260 + t * 70, .12); if (t >= 4) h.shake(10); continue;
      }
      const nx2 = dx / d, ny = dy / d, ov = m - d, ma = a.r * a.r, mb = b.r * b.r, tot = ma + mb;
      a.x -= nx2 * ov * mb / tot; a.y -= ny * ov * mb / tot; b.x += nx2 * ov * ma / tot; b.y += ny * ov * ma / tot;
      const rv = (b.vx - a.vx) * nx2 + (b.vy - a.vy) * ny;
      if (rv < 0) { const j2 = -1.25 * rv / (1 / ma + 1 / mb); a.vx -= j2 * nx2 / ma; a.vy -= j2 * ny / ma; b.vx += j2 * nx2 / mb; b.vy += j2 * ny / mb; }
    }
    balls = balls.filter(b => !b.dead).concat(add);
    if (balls.some(b => b.age > 120 && b.y - b.r < 90)) g.over = true;
  };
  g.pointer = (t, x) => { aim = Math.max(R[c], Math.min(W - R[c], x));
    if (t === 'up' && cd <= 0 && !g.over) { balls.push({x:aim, y:44, vx:0, vy:0, t:c, r:R[c], age:0}); c = nx; nx = rnd(4); cd = 30; beep(500, .05); } };
  g.update = dt => { acc += dt; while (acc >= 16.67) { if (!g.over) step(); acc -= 16.67; } };
  g.draw = () => {
    cx.setLineDash([8, 8]); cx.strokeStyle = '#ff453a99'; cx.beginPath(); cx.moveTo(0, 90); cx.lineTo(W, 90); cx.stroke(); cx.setLineDash([]);
    cx.strokeStyle = '#fff3'; cx.beginPath(); cx.moveTo(aim, 44); cx.lineTo(aim, H); cx.stroke();
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (const b of balls) { cx.fillStyle = '#ffffff14'; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 7); cx.fill(); cx.font = b.r * 1.5 + 'px serif'; cx.fillText(E[b.t], b.x, b.y + 2); }
    cx.font = R[c] * 1.5 + 'px serif'; cx.fillText(E[c], aim, 44); cx.font = '12px system-ui'; cx.fillStyle = '#fff'; cx.fillText('Next', W - 30, 12); cx.font = '26px serif'; cx.fillText(E[nx], W - 30, 38);
  };
  return g;
}

/* ---------- Emoji Snake ---------- */
function snake(h) {
  const C = 18, N = 26, S = 20, F = ['🍎','🍕','🍔','🍩','🍇','🍓','🌮','🍪'];
  let body = [{x:9, y:13}, {x:8, y:13}, {x:7, y:13}], dir = {x:1, y:0}, nd = dir, spd = 140, acc = 0, sx = 0, sy = 0, food; const g = {score:0, over:false};
  const place = () => { do food = {x:rnd(C), y:rnd(N), e:F[rnd(8)]}; while (body.some(s => s.x === food.x && s.y === food.y)); }; place();
  const turn = (x, y) => { if (x !== -dir.x || y !== -dir.y) nd = {x, y}; };
  g.key = k => ({ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1], ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0]}[k] || []).length && turn(...({ArrowUp:[0,-1], w:[0,-1], ArrowDown:[0,1], s:[0,1], ArrowLeft:[-1,0], a:[-1,0], ArrowRight:[1,0], d:[1,0]}[k]));
  g.pointer = (t, x, y) => { if (t === 'down') { sx = x; sy = y; } if (t === 'up') { const dx = x - sx, dy = y - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy)); } };
  g.update = dt => { if (g.over) return; acc += dt; if (acc < spd) return; acc = 0; dir = nd;
    const hd = {x:body[0].x + dir.x, y:body[0].y + dir.y};
    if (hd.x < 0 || hd.y < 0 || hd.x >= C || hd.y >= N || body.some(s => s.x === hd.x && s.y === hd.y)) { g.over = true; h.shake(12); return; }
    body.unshift(hd);
    if (hd.x === food.x && hd.y === food.y) { g.score += 10; spd = Math.max(60, spd - 4); h.burst(hd.x * S + 10, hd.y * S + 10, food.e, 8); h.float(hd.x * S + 10, hd.y * S, '+10', '#30d158'); h.beep(600 + g.score, .06); place(); } else body.pop(); };
  g.draw = () => {
    cx.strokeStyle = '#ffffff0d'; for (let i = 0; i <= C; i++) { cx.beginPath(); cx.moveTo(i * S, 0); cx.lineTo(i * S, H); cx.stroke(); }
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = '18px serif'; cx.fillText(food.e, food.x * S + 10, food.y * S + 11);
    body.forEach((s, i) => { if (i === 0) return; cx.shadowColor = cx.fillStyle = `hsl(${(140 + i * 8) % 360} 90% 55%)`; cx.shadowBlur = 12; cx.beginPath(); cx.arc(s.x * S + 10, s.y * S + 10, 8, 0, 7); cx.fill(); });
    cx.shadowBlur = 0; cx.font = '22px serif'; cx.fillText('🐍', body[0].x * S + 10, body[0].y * S + 11);
  };
  return g;
}

/* ---------- Emoji Memory Match ---------- */
function memory(h) {
  const P = [...'🐶🐱🦊🐼🦁🐸🐙🦄🐢🐵🍕🚀🎸🌈'], g = {score:0, over:false}, GAP = 10, CW = (W - 50) / 4;
  let level = 1, cards = [], open = [], lock = 0, combo = 0, time = 0, total = 0, next = 0;
  const init = () => { const pairs = Math.min(2 + level, 10), e = P.slice().sort(() => Math.random() - .5).slice(0, pairs);
    cards = [...e, ...e].sort(() => Math.random() - .5).map(x => ({e:x, f:0, tf:0, m:false})); open = []; lock = 0; time = total = 12 + pairs * 6 - level; next = 0; }; init();
  const pos = i => ({x:20 + (i % 4) * (CW + GAP), y:70 + (i / 4 | 0) * (CW + GAP)});
  g.pointer = (t, px, py) => { if (t !== 'up' || lock > 0 || g.over) return;
    cards.forEach((c, i) => { const p = pos(i); if (px > p.x && px < p.x + CW && py > p.y && py < p.y + CW && !c.m && !c.tf && open.length < 2) { c.tf = 1; open.push(c); h.beep(400 + open.length * 100, .05);
      if (open.length === 2) lock = 600; } }); };
  g.update = dt => { if (g.over) return; time -= dt / 1000; if (time <= 0) { g.over = true; return; }
    cards.forEach(c => c.f += (c.tf - c.f) * .2);
    if (lock > 0) { lock -= dt; if (lock <= 0) { const [a, b] = open, i = cards.indexOf(b), p = pos(i);
      if (a.e === b.e) { a.m = b.m = true; combo++; g.score += 100 * combo; h.burst(p.x + CW / 2, p.y + CW / 2, '✨', 14); h.float(p.x + CW / 2, p.y, combo > 1 ? 'Combo x' + combo + '!' : 'Match!', '#ffd60a'); h.beep(700 + combo * 80, .12); }
      else { a.tf = b.tf = 0; combo = 0; h.beep(200, .1); } open = []; } }
    if (!next && cards.every(c => c.m)) { g.score += Math.ceil(time) * 5; h.float(W / 2, H / 2, 'Level ' + (level + 1) + '!', '#30d158'); h.beep(900, .3); next = 1; setTimeout(() => { level++; init(); }, 900); } };
  g.draw = () => {
    cx.fillStyle = '#ffffff22'; rr(20, 40, W - 40, 10, 5); cx.fill(); cx.fillStyle = time / total < .25 ? '#ff453a' : '#30d158'; rr(20, 40, (W - 40) * Math.max(0, time / total), 10, 5); cx.fill();
    cx.fillStyle = '#fff'; cx.font = '14px system-ui'; cx.textAlign = 'left'; cx.fillText('Level ' + level + (combo > 1 ? '  🔥 x' + combo : ''), 20, 20);
    cards.forEach((c, i) => { const p = pos(i), s = Math.abs(Math.cos(c.f * Math.PI)); cx.save(); cx.translate(p.x + CW / 2, p.y + CW / 2); cx.scale(Math.max(s, .02), 1);
      cx.fillStyle = c.f > .5 ? (c.m ? '#30d15855' : '#ffffff33') : '#7c5cff'; rr(-CW / 2, -CW / 2, CW, CW, 14); cx.fill();
      cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.font = CW * .55 + 'px serif'; cx.fillStyle = '#fff'; cx.fillText(c.f > .5 ? c.e : '❓', 0, 3); cx.restore(); });
  };
  return g;
}
const MAKE = {merge, snake, memory};

/* ---------- loop, finish, UI ---------- */
function finish() {
  const s = cur.score, nb = s > best(cid); if (nb) { localStorage.setItem('av_best_' + cid, s); confetti(); }
  beep(nb ? 880 : 140, .4); toast(nb ? 'success' : 'info', nb ? '🏆 New best: ' + s : 'Game over: ' + s);
  if (s > 0) api('submit_score', {game:cid, name:(typeof user === 'string' && user) || 'Player', score:s}).catch(() => {});
}
function loop(t) {
  raf = requestAnimationFrame(loop); const dt = Math.min(50, t - last); last = t; if (!cur) return;
  cur.update(dt); if (cur.over && !done) { done = true; finish(); }
  const d = Math.min(devicePixelRatio || 1, 2); cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, W, H); cx.save();
  if (shk > .5) { cx.translate((Math.random() - .5) * shk, (Math.random() - .5) * shk); shk *= .88; }
  cx.fillStyle = '#fff'; cur.draw(); drawFx(); cx.restore();
  if (cur.over) { cx.fillStyle = '#000a'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = 'bold 34px system-ui'; cx.fillText('Game over 💥', W / 2, H / 2 - 20); cx.font = '20px system-ui'; cx.fillText('Score ' + cur.score + '  ·  Best ' + best(cid), W / 2, H / 2 + 20); cx.fillText('Tap 🔄 to play again', W / 2, H / 2 + 56); }
  const sc = document.getElementById('gsc'); if (sc && sc.textContent !== '🎯 ' + cur.score) sc.textContent = '🎯 ' + cur.score;
}
function hub() {
  cur = null; ov.innerHTML = `<div class="gbar"><b>🎮 Games Hub</b><button data-g="x" aria-label="Close">✖️</button></div><div class="ghub">${LIST.map(g => `<button class="gtile glass" data-play="${g.id}"><span>${g.e}</span><b>${esc(g.n)}</b><small>🏆 ${best(g.id)}</small><small class="lb" data-lb="${g.id}"></small></button>`).join('')}</div>`;
  ov.querySelector('.gtile').focus();
  api('list').then(d => ov.querySelectorAll('[data-lb]').forEach(el => { const r = d.scores?.[el.dataset.lb]?.[0]; if (r) el.textContent = '🌍 ' + r.name + ': ' + r.score; })).catch(() => {});
}
function play(id) {
  cid = id; done = false; fx = []; tx = []; cur = MAKE[id](H_);
  ov.innerHTML = `<div class="gbar"><button data-g="back" aria-label="Back">⬅️</button><b id="gsc">🎯 0</b><span>🏆 ${best(id)}</span><button data-g="mute" aria-label="Mute">${mute ? '🔇' : '🔊'}</button><button data-g="re" aria-label="Restart">🔄</button><button data-g="x" aria-label="Close">✖️</button></div><canvas id="gcv" width="${W * 2}" height="${H * 2}" aria-label="${esc(id)} game"></canvas>`;
  cv = ov.querySelector('canvas'); cx = cv.getContext('2d');
  const xy = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  ['down', 'move', 'up'].forEach(t => cv.addEventListener('pointer' + t, e => { e.preventDefault(); cur?.pointer?.(t, ...xy(e)); }));
  beep(500, .05);
}
function open() { if (!ov) { ov = document.createElement('div'); ov.id = 'games'; ov.className = 'glass'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); document.body.append(ov);
    ov.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.play) play(b.dataset.play); if (b.dataset.g === 'x') close(); if (b.dataset.g === 'back') hub(); if (b.dataset.g === 're') play(cid);
      if (b.dataset.g === 'mute') { mute = !mute; localStorage.setItem('av_mute', mute ? '1' : '0'); b.textContent = mute ? '🔇' : '🔊'; } });
    document.addEventListener('keydown', e => { if (ov.hidden) return; if (e.key === 'Escape') { cur ? hub() : close(); e.stopPropagation(); } else cur?.key?.(e.key.length === 1 ? e.key.toLowerCase() : e.key); }, true); }
  ov.hidden = false; document.body.style.overflow = 'hidden'; hub(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function close() { ov.hidden = true; cur = null; cancelAnimationFrame(raf); document.body.style.overflow = ''; $('#gamesBtn')?.focus(); }
$('#gamesBtn')?.addEventListener('click', open);
return {open, close};
})();
