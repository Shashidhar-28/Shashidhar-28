// Pure 2048 logic (no DOM) so it can be tested.
(function (root) {
  function slideLine(line) {
    const tiles = line.filter(v => v !== 0);
    const out = [];
    let score = 0;
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === tiles[i + 1]) {
        const m = tiles[i] * 2;
        out.push(m); score += m; i++;
      } else out.push(tiles[i]);
    }
    while (out.length < line.length) out.push(0);
    return { line: out, score };
  }

  // dir: 0 left, 1 up, 2 right, 3 down. grid is array of rows.
  function move(grid, dir) {
    const n = grid.length;
    let score = 0, moved = false;
    const res = grid.map(r => r.slice());
    for (let i = 0; i < n; i++) {
      let line = [];
      for (let j = 0; j < n; j++) {
        line.push(dir === 0 ? grid[i][j] : dir === 2 ? grid[i][n - 1 - j]
          : dir === 1 ? grid[j][i] : grid[n - 1 - j][i]);
      }
      const r = slideLine(line);
      score += r.score;
      for (let j = 0; j < n; j++) {
        const v = r.line[j];
        if (dir === 0) res[i][j] = v;
        else if (dir === 2) res[i][n - 1 - j] = v;
        else if (dir === 1) res[j][i] = v;
        else res[n - 1 - j][i] = v;
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (res[i][j] !== grid[i][j]) moved = true;
    return { grid: res, score, moved };
  }

  function emptyCells(grid) {
    const c = [];
    grid.forEach((r, i) => r.forEach((v, j) => { if (!v) c.push([i, j]); }));
    return c;
  }

  function addRandom(grid, rnd) {
    const cells = emptyCells(grid);
    if (!cells.length) return null;
    const [i, j] = cells[Math.floor((rnd || Math.random)() * cells.length)];
    grid[i][j] = (rnd || Math.random)() < 0.9 ? 2 : 4;
    return [i, j];
  }

  function canMove(grid) {
    if (emptyCells(grid).length) return true;
    return [0, 1].some(d => move(grid, d).moved);
  }

  const api = { slideLine, move, emptyCells, addRandom, canMove };
  if (typeof module !== 'undefined') module.exports = api; else root.G2048 = api;
})(this);
