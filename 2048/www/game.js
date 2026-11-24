(function () {
  const N = 4;
  const $ = id => document.getElementById(id);
  const board = $('board');
  let grid, score, best, prev, won, keepGoing, tiles;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

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

  function render(newPos, merged) {
    board.querySelectorAll('.tile').forEach(t => t.remove());
    grid.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      const t = document.createElement('div');
      t.className = 'tile ' + (v <= 2048 ? 't' + v : 'tbig');
      if (newPos && newPos[0] === r && newPos[1] === c) t.classList.add('new');
      else if (merged && merged.has(r + ',' + c)) t.classList.add('merge');
      t.textContent = v;
      place(t, r, c);
      board.appendChild(t);
    }));
    $('score').textContent = score;
    $('best').textContent = best;
  }

  function mergedCells(before, after) {
    const s = new Set();
    after.forEach((row, r) => row.forEach((v, c) => { if (v && v !== before[r][c] && v > 2) s.add(r + ',' + c); }));
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
    if (!won && !keepGoing && grid.some(row => row.includes(2048))) {
      won = true; showOverlay('You win!', true);
    } else if (!G2048.canMove(grid)) showOverlay('Game over', false);
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
    $('overlay').hidden = true; render();
  };

  const keys = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, a: 0, w: 1, d: 2, s: 3 };
  document.addEventListener('keydown', e => {
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

  start();
})();
