(function () {
  const N = 4;
  const $ = id => document.getElementById(id);
  const board = $('board');
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // ---------- Colour themes ----------
  // tiles: 11 colours for 2..2048, big: colour for >2048. dark/light = text colour on tiles
  const THEMES = {
    classic: { name: 'Classic', bg: '#faf8ef', fg: '#776e65', board: '#bbada0', cell: 'rgba(238,228,218,.35)', btn: '#8f7a66',
      tiles: ['#eee4da','#ede0c8','#f2b179','#f59563','#f67c5f','#f65e3b','#edcf72','#edcc61','#edc850','#edc53f','#edc22e'], big: '#3c3a32', darkTxt: '#776e65', lightTxt: '#f9f6f2' },
    ocean: { name: 'Ocean', bg: '#eaf6fb', fg: '#14506b', board: '#7fb7cf', cell: 'rgba(255,255,255,.35)', btn: '#1d7a9e',
      tiles: ['#d4eef8','#b3e0f2','#8ccfea','#5fb9de','#3fa3d1','#2a8cc0','#2478b0','#1d649c','#175288','#124175','#0c3162'], big: '#061c3a', darkTxt: '#14506b', lightTxt: '#ffffff' },
    forest: { name: 'Forest', bg: '#f0f5e9', fg: '#3b5232', board: '#8aa97a', cell: 'rgba(255,255,255,.3)', btn: '#4f7a3f',
      tiles: ['#e3efcf','#d0e6b0','#b5d98d','#97c96a','#7bb552','#5fa042','#4a8a37','#3b752e','#2e6126','#234e1e','#193b16'], big: '#0e2410', darkTxt: '#3b5232', lightTxt: '#ffffff' },
    candy: { name: 'Candy', bg: '#fff0f6', fg: '#8a3a5c', board: '#e8a5c4', cell: 'rgba(255,255,255,.4)', btn: '#d6479a',
      tiles: ['#ffe0ee','#ffc8e0','#ffaed1','#ff93c2','#ff77b3','#f95ca4','#e94595','#cf3386','#b32577','#971a68','#7c1259'], big: '#4a0a38', darkTxt: '#8a3a5c', lightTxt: '#ffffff' },
    sunset: { name: 'Sunset', bg: '#fff4e5', fg: '#7a3e1d', board: '#e0a67a', cell: 'rgba(255,255,255,.35)', btn: '#c2542d',
      tiles: ['#ffe8c2','#ffd699','#ffc070','#ffa94d','#ff8f3a','#f57328','#e55a1f','#cf4418','#b53213','#99230f','#7d170b'], big: '#430a05', darkTxt: '#7a3e1d', lightTxt: '#ffffff' },
    midnight: { name: 'Midnight (dark)', bg: '#14161f', fg: '#c9cde0', board: '#2a2e42', cell: 'rgba(255,255,255,.06)', btn: '#4a52a0',
      tiles: ['#3a3f5c','#454b72','#5a4fa0','#6e4fc2','#8a4fd6','#a64fe0','#c24fd0','#d94fb0','#e84f8a','#f2536a','#ff6a4f'], big: '#ffd24f', darkTxt: '#14161f', lightTxt: '#f5f6ff' }
  };

  // ---------- Tile sets (index 0 = tile 2 ... index 10 = tile 2048) ----------
  const TILESETS = {
    numbers: { name: '1 2 3 Numbers', labels: null },
    kannada: { name: 'ಕನ್ನಡ ಅಂಕೆ', labels: null, fmt: v => String(v).replace(/\d/g, d => '೦೧೨೩೪೫೬೭೮೯'[d]) },
    fruits: { name: '🍎 Fruits', labels: ['🍒','🍓','🍋','🍊','🍎','🍐','🍑','🍍','🍉','🥭','🍇'] },
    animals: { name: '🐶 Animals', labels: ['🐜','🐭','🐱','🐶','🐰','🦊','🐯','🐼','🦁','🐘','🐉'] },
    space: { name: '🚀 Space', labels: ['⭐','🌙','🪐','☄️','🌍','🌞','🛰️','🚀','👽','🌌','🏆'] }
  };

  const keyOf = v => Math.min(Math.log2(v) - 1, 11);
  let themeKey = ls.get('theme2048') in THEMES ? ls.get('theme2048') : 'classic';
  let setKey = ls.get('tiles2048') in TILESETS ? ls.get('tiles2048') : 'numbers';
  let soundOn = ls.get('sound2048') !== 'off';

  function applyTheme() {
    const t = THEMES[themeKey], r = document.documentElement.style;
    r.setProperty('--bg', t.bg); r.setProperty('--fg', t.fg); r.setProperty('--board', t.board);
    r.setProperty('--cell', t.cell); r.setProperty('--box', t.board); r.setProperty('--btn', t.btn);
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.content = t.bg;
  }

  function fillSelect(sel, obj, cur) {
    Object.keys(obj).forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = obj[k].name; o.selected = k === cur;
      sel.appendChild(o);
    });
  }
  fillSelect($('theme'), THEMES, themeKey);
  fillSelect($('tileset'), TILESETS, setKey);

  // ---------- Sound (Web Audio, no files needed) ----------
  let ac = null;
  function tone(freq, dur, type, vol, delay, slideTo) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t0 = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  const sfx = {
    move() { tone(220, 0.07, 'triangle', 0.08, 0, 160); },
    merge(v) { const f = 330 * Math.pow(1.12, Math.max(0, Math.log2(v) - 2)); tone(f, 0.16, 'sine', 0.18); tone(f * 1.5, 0.12, 'sine', 0.08, 0.04); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.18, i * 0.12)); },
    over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'sawtooth', 0.1, i * 0.16)); }
  };
  function showSnd() { $('snd').textContent = soundOn ? '🔊' : '🔇'; }

  // ---------- Board ----------
  let grid, score, best, prev, won, keepGoing;

  for (let i = 0; i < N * N; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    place(c, Math.floor(i / N), i % N);
    board.appendChild(c);
  }
  function place(el, r, c) {
    el.style.left = `calc(var(--gap) + ${c} * ((100% - 5*var(--gap))/4 + var(--gap)))`;
    el.style.top = `calc(var(--gap) + ${r} * ((100% - 5*var(--gap))/4 + var(--gap)))`;
  }

  function label(v) {
    const s = TILESETS[setKey];
    if (s.labels) return s.labels[Math.min(keyOf(v), 10)];
    return s.fmt ? s.fmt(v) : String(v);
  }

  function render(newPos, merged) {
    const t = THEMES[themeKey], isEmoji = !!TILESETS[setKey].labels;
    board.querySelectorAll('.tile').forEach(x => x.remove());
    grid.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      const k = keyOf(v), el = document.createElement('div');
      el.className = 'tile';
      el.style.background = k > 10 ? t.big : t.tiles[k];
      el.style.color = k < 2 ? t.darkTxt : t.lightTxt;
      if (isEmoji) el.classList.add('emoji');
      else {
        const len = label(v).length;
        if (len >= 4) el.classList.add('xs'); else if (len === 3) el.classList.add('sm');
      }
      if (newPos && newPos[0] === r && newPos[1] === c) el.classList.add('new');
      else if (merged && merged.has(r + ',' + c)) el.classList.add('merge');
      el.textContent = label(v);
      place(el, r, c);
      board.appendChild(el);
    }));
    $('score').textContent = score;
    $('best').textContent = best;
  }

  function mergedCells(before, after) {
    const s = new Set();
    after.forEach((row, r) => row.forEach((v, c) => { if (v > 2 && v !== before[r][c]) s.add(r + ',' + c); }));
    return s;
  }

  function start() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    score = 0; prev = null; won = false; keepGoing = false;
    best = +ls.get('best2048') || 0;
    G2048.addRandom(grid); G2048.addRandom(grid);
    $('overlay').hidden = true;
    render();
  }

  function act(dir) {
    if (!$('overlay').hidden) return;
    const r = G2048.move(grid, dir);
    if (!r.moved) return;
    prev = { grid: grid.map(x => x.slice()), score };
    const merged = mergedCells(grid, r.grid);
    grid = r.grid; score += r.score;
    if (score > best) { best = score; ls.set('best2048', best); }
    const pos = G2048.addRandom(grid);
    render(pos, merged);
    let top = 0;
    merged.forEach(k => { const [a, b] = k.split(',').map(Number); top = Math.max(top, grid[a][b]); });
    if (top) sfx.merge(top); else sfx.move();
    if (!won && !keepGoing && grid.some(row => row.includes(2048))) {
      won = true; sfx.win(); showOverlay('You win!', true);
    } else if (!G2048.canMove(grid)) { sfx.over(); showOverlay('Game over', false); }
  }

  function showOverlay(text, canKeep) {
    $('msg').textContent = text;
    $('keep').hidden = !canKeep;
    $('overlay').hidden = false;
  }

  $('new').onclick = $('again').onclick = start;
  $('keep').onclick = () => { keepGoing = true; $('overlay').hidden = true; };
  $('undo').onclick = () => {
    if (!prev) return;
    grid = prev.grid; score = prev.score; prev = null;
    $('overlay').hidden = true; render(); sfx.move();
  };
  $('snd').onclick = () => { soundOn = !soundOn; ls.set('sound2048', soundOn ? 'on' : 'off'); showSnd(); sfx.move(); };
  $('theme').onchange = e => { themeKey = e.target.value; ls.set('theme2048', themeKey); applyTheme(); render(); e.target.blur(); };
  $('tileset').onchange = e => { setKey = e.target.value; ls.set('tiles2048', setKey); render(); e.target.blur(); };

  const keys = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, a: 0, w: 1, d: 2, s: 3 };
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT') return;
    if (e.key in keys) { e.preventDefault(); act(keys[e.key]); }
  });

  let sx, sy;
  document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1));
  }, { passive: true });

  applyTheme(); showSnd(); start();
})();
