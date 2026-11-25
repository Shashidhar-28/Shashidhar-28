// Procedural 3D models for fruit, vegetable, stone and space tile sets (three.js).
(function (root) {
  const T = () => root.THREE;
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

  function mat(color, o) { return new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.45, metalness: 0 }, o)); }
  function tex(w, h, draw, rep) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rep) t.repeat.set(rep[0], rep[1]);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  // vertical gradient (v: bottom->top) with optional streaks/speckles
  function grad(stops, o) {
    o = o || {};
    return tex(256, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, h, 0, 0);
      stops.forEach(s => gr.addColorStop(s[0], s[1]));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < (o.streaks || 0); i++) {
        g.fillStyle = o.streakColor || 'rgba(0,0,0,.12)';
        const x = rnd() * w; g.fillRect(x, 0, 2 + rnd() * 6, h);
      }
      for (let i = 0; i < (o.speck || 0); i++) {
        g.fillStyle = o.speckColor || 'rgba(255,255,255,.35)';
        g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 1.6, 0, 7); g.fill();
      }
    });
  }
  function noiseBump(scale, n) {
    return tex(256, 256, (g, w, h) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++) {
        const v = 90 + rnd() * 80 | 0; g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath(); g.arc(rnd() * w, rnd() * h, scale * (0.5 + rnd()), 0, 7); g.fill();
      }
    });
  }
  function smooth(pts, n) {
    const c = new THREE.SplineCurve(pts.map(p => new THREE.Vector2(p[0], p[1])));
    return c.getPoints(n || 48);
  }
  function lathe(pts, m, seg, sx, sy, sz) {
    const geo = new THREE.LatheGeometry(smooth(pts), seg || 64);
    const mesh = new THREE.Mesh(geo, m);
    if (sx) mesh.scale.set(sx, sy || sx, sz || sx);
    return mesh;
  }
  function sph(r, m, x, y, z, sx, sy, sz) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), m);
    s.position.set(x || 0, y || 0, z || 0); if (sx) s.scale.set(sx, sy, sz); return s;
  }
  function tube(pts, r, m) {
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 24, r, 8), m);
  }
  function leaf(m, len, wid) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(wid, len * 0.45, 0, len); s.quadraticCurveTo(-wid, len * 0.45, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false });
    return new THREE.Mesh(g, m);
  }
  function cone(r, h, m) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), m); }
  function wobble(geo, amp, freq, seed) {
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * freq + seed) * Math.sin(v.y * freq * 1.3 + seed * 2) * Math.sin(v.z * freq * 0.9 + seed * 3);
      v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals(); return geo;
  }
  function lobes(mesh, n, amp) {
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + amp * Math.cos(n * a);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    mesh.geometry.computeVertexNormals(); return mesh;
  }
  const G = (...a) => { const g = new THREE.Group(); a.forEach(x => g.add(x)); return g; };
  const pose = (g, x, y, z) => { g.rotation.set(x === undefined ? 0.25 : x, y === undefined ? -0.5 : y, z || 0); return g; };
  const GREEN = () => mat(0x2f8a2f, { roughness: 0.55 });
  const STEM = () => mat(0x5a3a1a, { roughness: 0.8 });

  // ---------- gems ----------
  function gem(color, o) {
    o = o || {};
    const prof = [[0, -0.95], [1.0, 0.08], [1.02, 0.2], [0.58, 0.62], [0, 0.62]].map(p => new THREE.Vector2(p[0], p[1]));
    const m = new THREE.Mesh(new THREE.LatheGeometry(prof, o.seg || 10), new THREE.MeshPhysicalMaterial({
      color, metalness: 0.15, roughness: 0.03, flatShading: true, transparent: true, opacity: Math.min(1, (o.opacity || 0.9) + 0.08),
      envMapIntensity: 1.5, clearcoat: 1, side: THREE.DoubleSide }));
    return pose(G(m), 0.45, -0.5, 0);
  }
  function crystal(color, op) {
    const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ color, metalness: 0.1, roughness: 0.05, flatShading: true, transparent: true, opacity: op, envMapIntensity: 2.5, clearcoat: 1 });
    [[0, 0, 0, 0, 0, 1.4], [-0.55, -0.1, 0.1, 0.35, 0, 1.0], [0.55, -0.15, 0.1, -0.3, 0, 1.1], [0.2, -0.2, 0.5, 0.2, 0.5, 0.8], [-0.2, -0.2, -0.4, -0.3, -0.3, 0.7]].forEach(c => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, c[5], 6), m), tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.38, 6), m);
      tip.position.y = c[5] / 2 + 0.19; const k = G(body, tip); k.position.set(c[0], c[1] + c[5] / 2 - 0.5, c[2]); k.rotation.set(c[3], 0, c[4]); g.add(k);
    });
    return pose(g, 0.2, -0.5, 0);
  }

  // ---------- fruits ----------
  const fruits = [
    () => { // cherries
      const m = mat(0x9a0a1c, { roughness: 0.12, clearcoat: 1 });
      const a = sph(0.55, m, -0.55, -0.55, 0), b = sph(0.55, m, 0.6, -0.65, 0.15);
      const s1 = tube([[-0.5, -0.05, 0], [-0.3, 0.5, 0], [0, 1.1, 0]], 0.04, STEM()), s2 = tube([[0.55, -0.15, 0.1], [0.4, 0.5, 0], [0, 1.1, 0]], 0.04, STEM());
      const l = leaf(GREEN(), 0.8, 0.28); l.position.set(0, 1.1, 0); l.rotation.set(-1.2, 0.5, 0.9);
      return pose(G(a, b, s1, s2, l));
    },
    () => { // strawberry
      const t = tex(256, 256, (g, w, h) => {
        const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#b3121c'); gr.addColorStop(1, '#e0222e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 110; i++) { const x = rnd() * w, y = rnd() * h * 0.9 + h * 0.05; g.fillStyle = '#6b0a10'; g.beginPath(); g.ellipse(x + 1, y + 1.5, 2.4, 3.4, 0, 0, 7); g.fill(); g.fillStyle = '#f2d56b'; g.beginPath(); g.ellipse(x, y, 2, 3, 0, 0, 7); g.fill(); }
      });
      const body = lathe([[0, -1], [0.3, -0.85], [0.7, -0.35], [0.85, 0.15], [0.72, 0.6], [0.3, 0.78], [0, 0.78]], mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.6 }));
      const g = G(body);
      for (let i = 0; i < 8; i++) { const c = cone(0.14, 0.6, GREEN()); c.scale.z = 0.35; const a = i / 8 * Math.PI * 2; c.position.set(Math.cos(a) * 0.3, 0.84, Math.sin(a) * 0.3); c.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3); g.add(c); }
      g.add(tube([[0, 0.8, 0], [0.05, 1.05, 0], [0.2, 1.25, 0]], 0.05, GREEN()));
      return pose(g);
    },
    () => { // lemon
      const b = lathe([[0, -1.05], [0.14, -0.98], [0.55, -0.72], [0.85, -0.2], [0.85, 0.2], [0.55, 0.72], [0.14, 0.98], [0, 1.05]],
        mat(0xf4d21a, { roughness: 0.35, bumpMap: noiseBump(2, 700), bumpScale: 0.35, map: grad([[0, '#e8b800'], [0.5, '#ffe53a'], [1, '#e8b800']], { speck: 300, speckColor: 'rgba(255,255,255,.2)' }) }));
      const g = G(b); g.rotation.set(0.3, -0.4, 1.25); const l = leaf(GREEN(), 0.7, 0.25); l.position.set(0.04, 1.0, 0); l.rotation.set(0.3, 0.4, 0.4); b.add(l);
      return G(g);
    },
    () => { // orange
      const o = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xf28a12, { roughness: 0.4, bumpMap: noiseBump(2.4, 900), bumpScale: 0.5, map: grad([[0, '#d86a08'], [0.5, '#ff9a1f'], [1, '#e87a10']], { speck: 200, speckColor: 'rgba(255,200,100,.25)' }) }));
      const l = leaf(GREEN(), 0.9, 0.3); l.position.set(0, 0.98, 0); l.rotation.set(-1.0, 0.2, 0.3);
      const nub = sph(0.12, mat(0x3f6a1a), 0, 1.0, 0, 1, 0.5, 1);
      return pose(G(o, l, nub));
    },
    () => { // apple
      const a = lathe([[0, -0.85], [0.45, -0.82], [0.88, -0.5], [1.0, 0.05], [0.88, 0.55], [0.5, 0.82], [0.14, 0.76], [0, 0.6]],
        mat(0xffffff, { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, map: grad([[0, '#a80d14'], [0.55, '#d3161e'], [0.9, '#d9a02a'], [1, '#9db83a']], { streaks: 14, streakColor: 'rgba(90,0,0,.1)' }) }));
      const st = tube([[0, 0.55, 0], [0.02, 0.85, 0], [0.12, 1.1, 0]], 0.05, STEM()), l = leaf(GREEN(), 0.8, 0.28); l.position.set(0.05, 0.9, 0); l.rotation.set(-0.8, 0.3, -1.1);
      return pose(G(a, st, l));
    },
    () => { // pear
      const p = lathe([[0, -0.92], [0.5, -0.86], [0.8, -0.5], [0.66, 0.05], [0.42, 0.45], [0.3, 0.75], [0.1, 0.9], [0, 0.9]],
        mat(0xffffff, { roughness: 0.4, clearcoat: 0.3, map: grad([[0, '#a8b820'], [0.6, '#c4cc2e'], [1, '#8ea01c']], { speck: 500, speckColor: 'rgba(120,90,20,.35)' }) }));
      const st = tube([[0, 0.85, 0], [0.03, 1.1, 0], [0.15, 1.35, 0]], 0.05, STEM());
      return pose(G(p, st));
    },
    () => { // peach
      const p = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xffffff, { roughness: 0.85, map: grad([[0, '#e8845a'], [0.5, '#f9b27a'], [1, '#ef7b6a']], { speck: 600, speckColor: 'rgba(255,230,200,.3)' }) }));
      p.scale.set(1, 0.95, 0.97);
      const l = leaf(GREEN(), 1.0, 0.3); l.position.set(0.1, 0.92, 0); l.rotation.set(-0.9, 0.4, -1.0);
      return pose(G(p, l, tube([[0, 0.9, 0], [0, 1.05, 0]], 0.04, STEM())));
    },
    () => { // pineapple
      const t = tex(256, 256, (g, w, h) => {
        g.fillStyle = '#e4a21a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a4a0c'; g.lineWidth = 3;
        for (let i = -8; i < 20; i++) { g.beginPath(); g.moveTo(i * 22, 0); g.lineTo(i * 22 + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i * 22 + 256, 0); g.lineTo(i * 22, 256); g.stroke(); }
      }, [2, 1]);
      const b = lathe([[0, -1], [0.55, -0.92], [0.78, -0.4], [0.8, 0.2], [0.62, 0.8], [0.3, 0.98], [0, 1]], mat(0xffffff, { map: t, roughness: 0.55, bumpMap: t, bumpScale: 1.5 }));
      const g = G(b), lm = mat(0x2f7a24, { roughness: 0.5 });
      for (let i = 0; i < 12; i++) { const c = cone(0.1, 1.1 - (i % 3) * 0.15, lm); c.scale.z = 0.4; const a = i / 12 * Math.PI * 2; c.position.set(Math.cos(a) * 0.15, 1.35, Math.sin(a) * 0.15); c.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(c); }
      return pose(g);
    },
    () => { // watermelon
      const t = tex(256, 256, (g, w, h) => {
        g.fillStyle = '#2f9a3a'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 9; i++) { g.strokeStyle = '#124a1c'; g.lineWidth = 9 + rnd() * 6; g.beginPath(); const x = i * 28 + 8; g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.1 + i) * 6, y); g.stroke(); }
      });
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.5 })); m.scale.set(1.3, 1, 1);
      return pose(G(m, tube([[0, 0.98, 0], [0.05, 1.15, 0]], 0.05, STEM())));
    },
    () => { // mango
      const b = lathe([[0, -0.9], [0.32, -0.82], [0.7, -0.4], [0.82, 0.1], [0.62, 0.62], [0.25, 0.88], [0, 0.88]],
        mat(0xffffff, { roughness: 0.3, clearcoat: 0.6, map: grad([[0, '#6aa82a'], [0.4, '#e8b020'], [0.75, '#f07a1c'], [1, '#d83a2a']], { speck: 300, speckColor: 'rgba(255,240,180,.35)' }) }));
      b.scale.set(1.05, 1, 0.78); const l = leaf(GREEN(), 1.0, 0.3); l.position.set(0, 0.85, 0); l.rotation.set(-0.8, 0.2, -1.0);
      return pose(G(b, l, tube([[0, 0.85, 0], [0.04, 1.05, 0]], 0.045, STEM())), 0.25, -0.5, 0.4);
    },
    () => { // grapes
      const m = mat(0x4a1a6a, { roughness: 0.25, clearcoat: 1, envMapIntensity: 1.3 }), g = new THREE.Group();
      const rows = [4, 4, 3, 2, 1];
      rows.forEach((n, r) => { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 0.62, y = 0.7 - r * 0.52; g.add(sph(0.33, m, x + (rnd() - 0.5) * 0.06, y, (rnd() - 0.5) * 0.35)); g.add(sph(0.3, m, x * 0.9, y - 0.1, -0.35 + rnd() * 0.1)); } });
      g.add(tube([[0, 0.85, 0], [0.05, 1.2, 0], [0.2, 1.4, 0]], 0.06, STEM()));
      const l = leaf(GREEN(), 1.0, 0.45); l.position.set(0.1, 1.15, 0.1); l.rotation.set(-0.5, 0.3, -1.2); g.add(l);
      return pose(g, 0.15, -0.4, 0);
    }
  ];

  // ---------- vegetables ----------
  const veg = [
    () => { // garlic
      const t = tex(256, 256, (g, w, h) => { g.fillStyle = '#f4efe6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(150,110,130,.35)'; g.fillRect(i * 21 + 6, 0, 3, h); } });
      const b = lathe([[0, -0.7], [0.5, -0.65], [0.92, -0.2], [0.86, 0.3], [0.5, 0.75], [0.2, 1.05], [0.06, 1.3], [0, 1.3]], mat(0xffffff, { map: t, roughness: 0.6, bumpMap: t, bumpScale: 3 }));
      lobes(b, 7, 0.07);
      const g = G(b); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.add(tube([[Math.cos(a) * 0.2, -0.7, Math.sin(a) * 0.2], [Math.cos(a) * 0.3, -0.85, Math.sin(a) * 0.3]], 0.015, mat(0xd8c8a0))); }
      return pose(g);
    },
    () => { // onion
      const t = tex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#8a2a5a'); gr.addColorStop(0.6, '#b0407a'); gr.addColorStop(1, '#c89aa0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(i * 18 + 4, 0, 3, h); } });
      const b = lathe([[0, -0.82], [0.4, -0.8], [0.92, -0.3], [0.98, 0.2], [0.62, 0.72], [0.22, 1.02], [0.05, 1.3], [0, 1.3]], mat(0xffffff, { map: t, roughness: 0.35, clearcoat: 0.4, bumpMap: t, bumpScale: 2 }));
      const g = G(b); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; g.add(tube([[Math.cos(a) * 0.15, -0.8, Math.sin(a) * 0.15], [Math.cos(a) * 0.28, -0.95, Math.sin(a) * 0.28]], 0.012, mat(0xe8dcc0))); }
      return pose(g);
    },
    () => { // potato
      const geo = wobble(new THREE.IcosahedronGeometry(1, 5), 0.16, 2.2, 1.3);
      const t = tex(256, 256, (g, w, h) => { g.fillStyle = '#b88a52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${70 + rnd() * 40 | 0},${45 + rnd() * 30 | 0},20,.3)`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, 7); g.fill(); } for (let i = 0; i < 7; i++) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 5, 3, 0, 0, 7); g.fill(); } });
      const p = new THREE.Mesh(geo, mat(0xffffff, { map: t, roughness: 0.85, bumpMap: noiseBump(3, 600), bumpScale: 0.8 })); p.scale.set(1.3, 0.85, 0.95);
      return pose(G(p), 0.3, -0.4, 0.15);
    },
    () => { // carrot
      const t = tex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#d9560a'); gr.addColorStop(1, '#f58a1f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 24; i++) { g.fillStyle = 'rgba(120,40,0,.25)'; g.fillRect(0, rnd() * h, w, 2 + rnd() * 3); } });
      const c = lathe([[0, -1.5], [0.06, -1.3], [0.22, -0.5], [0.4, 0.4], [0.46, 0.85], [0, 0.88]], mat(0xffffff, { map: t, roughness: 0.4, bumpMap: t, bumpScale: 2 }));
      const g = G(c), lm = mat(0x2f8a2a, { roughness: 0.6 });
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(tube([[0, 0.85, 0], [Math.cos(a) * 0.25, 1.3, Math.sin(a) * 0.25], [Math.cos(a) * 0.5, 1.8, Math.sin(a) * 0.5]], 0.04, lm)); }
      g.rotation.set(0.25, -0.5, 0.9); return G(g);
    },
    () => { // corn
      const t = tex(256, 256, (g, w, h) => { g.fillStyle = '#f0b81a'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 16) { g.fillStyle = '#ffd53a'; g.beginPath(); g.ellipse(x + 8, y + 8, 6.5, 6.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x + 6, y + 6, 2, 0, 7); g.fill(); } });
      const c = lathe([[0, -1.1], [0.3, -1.0], [0.48, -0.4], [0.52, 0.4], [0.38, 0.95], [0, 1.15]], mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.5, bumpMap: t, bumpScale: 2 }));
      const g = G(c), lm = mat(0x6fae2a, { roughness: 0.6, side: THREE.DoubleSide });
      for (let i = 0; i < 4; i++) { const k = cone(0.5, 1.9, lm); k.scale.z = 0.12; const a = i / 4 * 6.28 + 0.4; k.position.set(Math.cos(a) * 0.45, -0.75, Math.sin(a) * 0.45); k.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); k.rotation.z += Math.PI; k.position.y = -0.2; g.add(k); }
      g.rotation.set(0.2, -0.5, 0.7); return G(g);
    },
    () => { // cucumber
      const t = grad([[0, '#1f5a1a'], [0.5, '#2f8a2a'], [1, '#1f5a1a']], { streaks: 18, streakColor: 'rgba(200,230,150,.3)', speck: 300, speckColor: 'rgba(220,240,170,.4)' });
      const c = lathe([[0, -1.5], [0.28, -1.4], [0.42, -0.7], [0.44, 0.7], [0.3, 1.4], [0, 1.5]], mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.6, bumpMap: noiseBump(1.6, 800), bumpScale: 0.5 }));
      const g = G(c); g.rotation.set(0.3, -0.4, 1.3); return G(g);
    },
    () => { // tomato
      const b = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xffffff, { roughness: 0.18, clearcoat: 1, map: grad([[0, '#c01a14'], [0.7, '#e83222'], [1, '#c8301a']]) })); b.scale.set(1.05, 0.88, 1.05);
      lobes(b, 5, 0.02);
      const g = G(b), lm = mat(0x2f8a2a, { side: THREE.DoubleSide });
      for (let i = 0; i < 6; i++) { const k = cone(0.13, 0.55, lm); k.scale.z = 0.3; const a = i / 6 * 6.28; k.position.set(Math.cos(a) * 0.3, 0.86, Math.sin(a) * 0.3); k.rotation.set(Math.sin(a) * 1.35, 0, -Math.cos(a) * 1.35); g.add(k); }
      g.add(tube([[0, 0.84, 0], [0, 1.05, 0]], 0.05, lm)); return pose(g);
    },
    () => { // broccoli
      const g = new THREE.Group(), sm = mat(0x9cc060, { roughness: 0.6 }), fm = mat(0x1f6a28, { roughness: 0.75, bumpMap: noiseBump(2, 600), bumpScale: 3 });
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.2, 20), sm)); g.children[0].position.y = -0.7;
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28; g.add(tube([[0, -0.2, 0], [Math.cos(a) * 0.5, 0.2, Math.sin(a) * 0.5]], 0.1, sm)); }
      for (let i = 0; i < 34; i++) { const u = rnd() * 6.28, v = Math.acos(1 - rnd() * 0.95), r = 1.0 + rnd() * 0.15, s = sph(0.26 + rnd() * 0.14, fm, Math.sin(v) * Math.cos(u) * r, 0.5 + Math.cos(v) * 0.9, Math.sin(v) * Math.sin(u) * r); g.add(s); }
      return pose(g, 0.3, -0.4, 0);
    },
    () => { // eggplant
      const b = lathe([[0, -1.25], [0.45, -1.15], [0.75, -0.6], [0.68, 0.3], [0.5, 0.8], [0.32, 1.0], [0, 1.0]], mat(0x2a0a40, { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }));
      const g = G(b), lm = mat(0x2f7a24, { side: THREE.DoubleSide });
      for (let i = 0; i < 7; i++) { const k = cone(0.2, 0.6, lm); k.scale.z = 0.3; const a = i / 7 * 6.28; k.position.set(Math.cos(a) * 0.36, 0.95, Math.sin(a) * 0.36); k.rotation.set(Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5); g.add(k); }
      g.add(tube([[0, 1.0, 0], [0.05, 1.3, 0], [0.25, 1.55, 0]], 0.09, lm)); return pose(g, 0.25, -0.5, 0.35);
    },
    () => { // chilli
      const m = mat(0xd4140c, { roughness: 0.12, clearcoat: 1 }), g = new THREE.Group(), cv = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.2, 0.5, 0), new THREE.Vector3(-0.3, 0.1, 0), new THREE.Vector3(0.6, -0.3, 0), new THREE.Vector3(1.4, -0.9, 0)]);
      for (let i = 0; i <= 28; i++) { const t = i / 28, p = cv.getPoint(t), r = 0.36 * Math.pow(1 - t, 0.7) + 0.04; g.add(sph(Math.max(r, 0.04), m, p.x, p.y, p.z)); }
      const lm = mat(0x2f8a2a); g.add(sph(0.3, lm, -1.22, 0.55, 0, 1, 0.55, 1)); g.add(tube([[-1.25, 0.6, 0], [-1.45, 0.95, 0], [-1.6, 1.15, 0]], 0.07, lm));
      return pose(g, 0.2, -0.4, 0.1);
    },
    () => { // bell pepper
      const b = lathe([[0, -0.9], [0.5, -0.88], [0.92, -0.45], [1.0, 0.1], [0.88, 0.62], [0.5, 0.85], [0.3, 0.8], [0, 0.7]], mat(0xe8b020, { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06 }));
      lobes(b, 4, 0.08);
      const g = G(b), lm = mat(0x2f7a24); g.add(tube([[0, 0.7, 0], [0.04, 1.0, 0], [0.18, 1.2, 0]], 0.1, lm));
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 10, 20), lm); c.rotation.x = Math.PI / 2; c.position.y = 0.74; g.add(c); return pose(g);
    }
  ];

  // ---------- stones ----------
  const stones = [
    () => { const r = new THREE.Mesh(wobble(new THREE.IcosahedronGeometry(1, 3), 0.28, 1.8, 2.1), mat(0x7b7b7f, { roughness: 0.9, flatShading: true, bumpMap: noiseBump(4, 400), bumpScale: 1 })); r.scale.set(1.3, 0.85, 1); return pose(G(r), 0.3, -0.4, 0.1); },
    () => crystal(0xf4f6ff, 0.55),
    () => { const a = new THREE.Mesh(wobble(new THREE.SphereGeometry(1, 48, 36), 0.06, 1.5, 4), mat(0xe08a10, { roughness: 0.04, transparent: true, opacity: 0.85, clearcoat: 1, envMapIntensity: 2 })); a.scale.set(1.2, 0.9, 0.9); return pose(G(a)); },
    () => gem(0xe8a010), () => gem(0x4fb81f, { opacity: 0.9 }),
    () => gem(0x0f8a48, { seg: 8, opacity: 0.9 }),
    () => { const t = tex(256, 256, (g, w, h) => { g.fillStyle = '#25b8b0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,70,60,.6)'; g.lineWidth = 2; for (let i = 0; i < 24; i++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rnd() * 40 - 20; y += rnd() * 40 - 20; g.lineTo(x, y); } g.stroke(); } });
      const s = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), mat(0xffffff, { map: t, roughness: 0.35, clearcoat: 0.6 })); s.scale.set(1.1, 0.8, 1); return pose(G(s)); },
    () => gem(0x1432b8, { opacity: 0.92 }), () => gem(0x7a22c0), () => gem(0xc00a22, { opacity: 0.92 }),
    () => gem(0xd8ecff, { seg: 12, opacity: 0.7 })
  ];

  // ---------- space ----------
  function planetTex(draw) { return tex(512, 256, draw); }
  const space = [
    () => { // star
      const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.45 : 1.15, a = i * Math.PI / 5 + Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath();
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 4 }), new THREE.MeshStandardMaterial({ color: 0xffd23a, metalness: 0.85, roughness: 0.16, emissive: 0x6a4a00, emissiveIntensity: 0.55 }));
      m.position.z = -0.2; return pose(G(m), 0.15, -0.5, 0);
    },
    () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xffffff, { roughness: 0.95, map: grad([[0, '#9a9a9a'], [1, '#c8c8c8']], { speck: 500, speckColor: 'rgba(70,70,70,.35)' }), bumpMap: tex(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const r = 4 + rnd() * 22, x = rnd() * w, y = rnd() * h, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#404040'); gr.addColorStop(0.8, '#a0a0a0'); gr.addColorStop(1, '#808080'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }), bumpScale: 2.5 })); return pose(G(m)); },
    () => { // saturn
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.9, 64, 48), mat(0xffffff, { roughness: 0.7, map: grad([[0, '#c8a060'], [0.3, '#e8d098'], [0.5, '#b88a50'], [0.75, '#ecd8a8'], [1, '#c09a60']]) }));
      const rt = tex(512, 4, (g, w) => { for (let x = 0; x < w; x++) { const v = 150 + Math.sin(x * 0.18) * 40 + rnd() * 25; g.fillStyle = `rgb(${v | 0},${v * 0.85 | 0},${v * 0.6 | 0})`; g.fillRect(x, 0, 1, 4); } });
      const rg = new THREE.RingGeometry(1.25, 2.1, 96), pos = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - 1.25) / 0.85, 0.5); }
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); ring.rotation.x = -Math.PI / 2;
      const g = G(p, ring); g.rotation.set(0.45, 0, -0.4); return G(g);
    },
    () => { // comet
      const r = new THREE.Mesh(wobble(new THREE.IcosahedronGeometry(0.6, 3), 0.18, 3, 1), mat(0x6a6f78, { roughness: 0.9, flatShading: true })); r.position.set(0.9, -0.4, 0);
      const g = G(r), tm = new THREE.MeshBasicMaterial({ color: 0x9fe4ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 6; i++) { const k = cone(0.5 - i * 0.04, 2.8, tm); k.rotation.z = Math.PI / 2 + (i - 3) * 0.07; k.position.set(-0.7, 0.2 + (i - 3) * 0.08, 0); g.add(k); }
      g.add(sph(0.85, new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }), 0.9, -0.4, 0));
      return pose(g, 0.1, -0.2, 0.25);
    },
    () => { // earth
      const t = planetTex((g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a4a9a'); gr.addColorStop(0.5, '#1f6ac0'); gr.addColorStop(1, '#1a4a9a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = '#3a8a3a'; for (let i = 0; i < 16; i++) { g.beginPath(); g.ellipse(rnd() * w, 40 + rnd() * (h - 80), 20 + rnd() * 40, 14 + rnd() * 26, rnd() * 3, 0, 7); g.fill(); }
        g.fillStyle = '#b0a060'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(rnd() * w, 60 + rnd() * (h - 120), 10 + rnd() * 16, 8 + rnd() * 10, 0, 0, 7); g.fill(); }
        g.fillStyle = '#f4f8ff'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
        g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 14 + rnd() * 34, 4 + rnd() * 8, 0, 0, 7); g.fill(); }
      });
      const e = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xffffff, { map: t, roughness: 0.5 }));
      const atm = sph(1.06, new THREE.MeshBasicMaterial({ color: 0x6ab4ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
      return pose(G(e, atm), 0.3, 2.2, 0.35);
    },
    () => { // sun
      const t = grad([[0, '#ff8a10'], [0.5, '#ffc828'], [1, '#ff8a10']], { speck: 700, speckColor: 'rgba(255,255,200,.4)' });
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.95, 64, 48), new THREE.MeshBasicMaterial({ map: t }));
      const g = G(s); [1.15, 1.4, 1.8].forEach((r, i) => g.add(sph(r, new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.22 - i * 0.06, blending: THREE.AdditiveBlending, depthWrite: false }))));
      return g;
    },
    () => { // satellite
      const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xd8a830, metalness: 1, roughness: 0.3 });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), gold));
      const pt = tex(128, 64, (c, w, h) => { c.fillStyle = '#1a2f8a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7fa0ff'; c.lineWidth = 1.5; for (let x = 0; x <= w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
      const pm = mat(0xffffff, { map: pt, roughness: 0.25, metalness: 0.4, clearcoat: 1 });
      [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.8), pm); p.position.x = s * 1.5; g.add(p); g.add(tube([[s * 0.45, 0, 0], [s * 0.75, 0, 0]], 0.04, gold)); });
      const d = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide })); d.position.set(0, 0.7, 0); g.add(d); g.add(tube([[0, 0.45, 0], [0, 0.95, 0]], 0.03, gold));
      return pose(g, 0.35, -0.6, 0.2);
    },
    () => { // rocket
      const b = lathe([[0, -1.1], [0.38, -1.0], [0.52, -0.2], [0.5, 0.5], [0.3, 1.0], [0.1, 1.35], [0, 1.4]], mat(0xf2f2f5, { roughness: 0.18, metalness: 0.3, clearcoat: 1 }));
      const g = G(b), red = mat(0xd42a2a, { roughness: 0.2, clearcoat: 1 });
      const nose = lathe([[0, 0.9], [0.31, 1.0], [0.12, 1.33], [0, 1.4]], red); nose.scale.set(1.02, 1.02, 1.02); g.add(nose);
      for (let i = 0; i < 3; i++) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.6, -0.5); sh.lineTo(0.6, -1.0); sh.lineTo(0, -0.4); const f = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }), red); f.position.set(0.45, -0.3, -0.03); const k = G(f); k.rotation.y = i * 2.094; g.add(k); }
      g.add(sph(0.2, mat(0x6ac0f0, { roughness: 0.05, clearcoat: 1 }), 0, 0.35, 0.46, 1, 1, 0.5));
      const fl = cone(0.26, 0.8, new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.85 })); fl.rotation.z = Math.PI; fl.position.y = -1.5; g.add(fl);
      g.rotation.set(0.2, -0.5, -0.7); return G(g);
    },
    () => { // alien
      const m = mat(0x7ac838, { roughness: 0.3, clearcoat: 0.8 }), head = lathe([[0, -1.1], [0.35, -1.0], [0.75, -0.5], [0.95, 0.3], [0.85, 0.85], [0.4, 1.1], [0, 1.15]], m);
      const g = G(head), em = mat(0x050505, { roughness: 0.02, clearcoat: 1, envMapIntensity: 2 });
      [-1, 1].forEach(s => { const e = sph(0.3, em, s * 0.42, 0.1, 0.62, 1, 1.7, 0.55); e.rotation.z = s * -0.5; g.add(e); });
      g.add(sph(0.05, mat(0x3a6a18), 0, -0.35, 0.82, 1, 0.5, 0.5));
      return pose(g, 0.1, -0.35, 0);
    },
    () => { // galaxy
      const t = tex(512, 512, (g, w, h) => {
        g.clearRect(0, 0, w, h); const bg = g.createRadialGradient(256, 256, 0, 256, 256, 256); bg.addColorStop(0, 'rgba(10,8,40,.95)'); bg.addColorStop(0.75, 'rgba(10,8,40,.8)'); bg.addColorStop(1, 'rgba(10,8,40,0)'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 9000; i++) { const arm = (i % 2) * Math.PI, d = Math.pow(rnd(), 0.6) * 230, a = d * 0.028 + arm + (rnd() - 0.5) * (0.5 + 1.2 * (1 - d / 230) * 0.3); const x = 256 + Math.cos(a) * d + (rnd() - 0.5) * 22, y = 256 + Math.sin(a) * d + (rnd() - 0.5) * 22; const c = d < 60 ? '255,225,170' : (rnd() < 0.5 ? '170,200,255' : '230,170,255'); g.fillStyle = `rgba(${c},${0.25 + rnd() * 0.6})`; g.fillRect(x, y, 2.4, 2.4); }
        const gr = g.createRadialGradient(256, 256, 0, 256, 256, 70); gr.addColorStop(0, 'rgba(255,240,200,.95)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); p.rotation.x = -1.0; p.rotation.z = 0.5; return G(p);
    },
    () => { // trophy
      const gold = new THREE.MeshStandardMaterial({ color: 0xf0b820, metalness: 1, roughness: 0.18 });
      const cup = lathe([[0, -0.3], [0.2, -0.25], [0.28, 0.1], [0.8, 0.9], [0.9, 1.3], [0.82, 1.3], [0.7, 0.95], [0.1, 0.1]], gold); cup.material.side = THREE.DoubleSide;
      const g = G(cup);
      [-1, 1].forEach(s => { const h = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 12, 24, Math.PI * 1.2), gold); h.position.set(s * 0.88, 0.95, 0); h.rotation.z = s > 0 ? -1.9 : 1.3 + Math.PI * 0.1; g.add(h); });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.18, 32), gold); base.position.y = -0.5; g.add(base);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.9), new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.4, metalness: 0.1 })); b2.position.y = -0.74; g.add(b2);
      g.add(sph(0.14, gold, 0, -0.2, 0));
      return pose(g, 0.2, -0.5, 0);
    }
  ];

  const S = (root.SET3D = root.SET3D || {});
  S.fruits = fruits; S.veg = veg; S.stones = stones; S.space = space;
})(this);
