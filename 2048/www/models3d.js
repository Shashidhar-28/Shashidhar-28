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
  // a fruit cut in half: rind dome + flat flesh face (faces +z)
  function cutHalf(r, rindMat, discMat, sx, sy, sz) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), rindMat); dome.rotation.x = -Math.PI / 2;
    rindMat.side = THREE.DoubleSide;
    g.add(dome, new THREE.Mesh(new THREE.CircleGeometry(r, 56), discMat));
    g.scale.set(sx || 1, sy || 1, sz || 1); return g;
  }
  const cs = (fn) => tex(256, 256, fn);
  const citrusDisc = (rind, flesh, n, gap) => mat(0xffffff, { roughness: 0.3, clearcoat: 0.5, map: cs((g, w, h) => {
    g.fillStyle = rind; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    g.fillStyle = '#fff3d8'; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill();
    for (let i = 0; i < n; i++) { const a0 = i / n * 6.283 + 0.04, a1 = (i + 1) / n * 6.283 - 0.04; const gr = g.createRadialGradient(128, 128, 10, 128, 128, 112); gr.addColorStop(0, flesh[0]); gr.addColorStop(1, flesh[1]); g.fillStyle = gr; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 112, a0, a1); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const a = a0 + (a1 - a0) * (0.2 + 0.6 * rnd()); g.beginPath(); g.moveTo(128 + Math.cos(a) * 20, 128 + Math.sin(a) * 20); g.lineTo(128 + Math.cos(a) * 105, 128 + Math.sin(a) * 105); g.stroke(); } }
    g.fillStyle = '#fff3d8'; g.beginPath(); g.arc(128, 128, 9, 0, 7); g.fill();
  }) });
  const fruits = [
    () => { // cherries
      const m = mat(0x8a0818, { roughness: 0.1, clearcoat: 1, envMapIntensity: 1.4 });
      const a = sph(0.55, m, -0.55, -0.55, 0, 1, 0.95, 1), b = sph(0.55, m, 0.6, -0.65, 0.15, 1, 0.95, 1), c = sph(0.5, m, 0.05, -0.85, 0.4, 1, 0.95, 1);
      const s1 = tube([[-0.5, -0.05, 0], [-0.3, 0.5, 0], [0, 1.1, 0]], 0.04, STEM()), s2 = tube([[0.55, -0.15, 0.1], [0.4, 0.5, 0], [0, 1.1, 0]], 0.04, STEM()), s3 = tube([[0.05, -0.4, 0.4], [0.05, 0.4, 0.2], [0, 1.1, 0]], 0.04, STEM());
      const l = leaf(GREEN(), 0.9, 0.3); l.position.set(0, 1.1, 0); l.rotation.set(-1.2, 0.5, 0.9);
      const l2 = leaf(GREEN(), 0.7, 0.25); l2.position.set(0, 1.1, 0); l2.rotation.set(-1.0, -0.8, -0.9);
      return pose(G(a, b, c, s1, s2, s3, l, l2));
    },
    () => { // strawberries
      const t = cs((g, w, h) => {
        const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#b3121c'); gr.addColorStop(1, '#e0222e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 110; i++) { const x = rnd() * w, y = rnd() * h * 0.9 + h * 0.05; g.fillStyle = '#6b0a10'; g.beginPath(); g.ellipse(x + 1, y + 1.5, 2.4, 3.4, 0, 0, 7); g.fill(); g.fillStyle = '#f2d56b'; g.beginPath(); g.ellipse(x, y, 2, 3, 0, 0, 7); g.fill(); }
      });
      const sm = mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.6 }), g = new THREE.Group();
      [[0, 0, 0, 1, 0], [0.95, -0.25, 0.1, 0.85, -0.5], [-0.85, -0.3, 0.2, 0.8, 0.5]].forEach(o => {
        const body = lathe([[0, -1], [0.3, -0.85], [0.7, -0.35], [0.85, 0.15], [0.72, 0.6], [0.3, 0.78], [0, 0.78]], sm), b = G(body);
        for (let i = 0; i < 8; i++) { const c = cone(0.14, 0.6, GREEN()); c.scale.z = 0.35; const a = i / 8 * Math.PI * 2; c.position.set(Math.cos(a) * 0.3, 0.84, Math.sin(a) * 0.3); c.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3); b.add(c); }
        b.add(tube([[0, 0.8, 0], [0.05, 1.05, 0], [0.2, 1.25, 0]], 0.05, GREEN()));
        b.position.set(o[0], o[1], o[2]); b.scale.setScalar(o[3]); b.rotation.z = o[4]; g.add(b);
      });
      return pose(g);
    },
    () => { // lemon whole + half
      const lm = mat(0xf4d21a, { roughness: 0.35, bumpMap: noiseBump(2, 700), bumpScale: 0.1, map: grad([[0, '#e8b800'], [0.5, '#ffe53a'], [1, '#e8b800']], { speck: 300, speckColor: 'rgba(255,255,255,.2)' }) });
      const w = lathe([[0, -1.05], [0.14, -0.98], [0.55, -0.72], [0.85, -0.2], [0.85, 0.2], [0.55, 0.72], [0.14, 0.98], [0, 1.05]], lm);
      const wg = G(w); wg.rotation.set(0.3, -0.3, 1.45); wg.position.set(-0.6, -0.2, 0);
      const lf = leaf(GREEN(), 0.8, 0.28); lf.position.set(-1.6, -0.1, 0); lf.rotation.set(0.3, 0.4, 1.5); 
      const h = cutHalf(0.85, mat(0xf4d21a, { roughness: 0.35 }), citrusDisc('#f4d21a', ['#fff06a', '#f7da30'], 9), 1, 1, 0.9); h.position.set(0.9, 0.05, 0.2);
      return pose(G(wg, lf, h), 0.2, -0.35, 0);
    },
    () => { // bananas: pentagonal, tapered, curved
      const g = new THREE.Group(), arc = 1.9, R = 1.5, TS = 48, RS = 5;
      const bm = mat(0xffffff, { roughness: 0.4, clearcoat: 0.35, flatShading: true, map: grad([[0, '#6a8a20'], [0.06, '#e8c818'], [0.5, '#ffe238'], [0.94, '#eec214'], [1, '#5a3a0c']], { streaks: 6, streakColor: 'rgba(150,100,0,.25)' }) });
      const one = () => {
        const geo = new THREE.TorusGeometry(R, 0.34, RS, TS, arc), p = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
        for (let j = 0; j <= RS; j++) for (let i = 0; i <= TS; i++) {
          const k = j * (TS + 1) + i, u = i / TS * arc, t = i / TS;
          c.set(Math.cos(u) * R, Math.sin(u) * R, 0); v.fromBufferAttribute(p, k).sub(c);
          const f = 0.32 + 0.68 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * t)), 0.6); v.multiplyScalar(f);
          p.setXYZ(k, c.x + v.x, c.y + v.y, c.z + v.z);
        }
        geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, bm); m.rotation.z = -Math.PI / 2 - arc / 2;
        const tip = sph(0.09, mat(0x2a1808), Math.cos(arc) * R, Math.sin(arc) * R, 0); tip.position.applyEuler(m.rotation);
        const end = sph(0.13, mat(0x4a5a1a), R, 0, 0); end.position.applyEuler(m.rotation);
        return G(m, tip, end);
      };
      [[-0.5, 0.25, 0.1, 0], [0, 0, 0, 0.05], [0.5, -0.25, -0.1, 0.1], [1.0, -0.5, -0.2, 0.15]].forEach((o, i) => { const b = one(); b.position.set(0, o[0] * 0.55, o[2]); b.rotation.z = o[3]; g.add(b); });
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 12), mat(0x6a7a28, { roughness: 0.8 })); st.position.set(-1.2, -0.05, 0); st.rotation.z = 0.9; g.add(st);
      return pose(g, 0.2, -0.3, 0);
    },
    () => { // apple + half
      const am = mat(0xffffff, { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, map: grad([[0, '#a80d14'], [0.55, '#d3161e'], [0.9, '#d9a02a'], [1, '#9db83a']], { streaks: 14, streakColor: 'rgba(90,0,0,.1)' }) });
      const a = lathe([[0, -0.85], [0.45, -0.82], [0.88, -0.5], [1.0, 0.05], [0.88, 0.55], [0.5, 0.82], [0.14, 0.76], [0, 0.6]], am); a.position.x = -0.55;
      const st = tube([[-0.55, 0.55, 0], [-0.53, 0.85, 0], [-0.43, 1.1, 0]], 0.05, STEM()), l = leaf(GREEN(), 0.8, 0.28); l.position.set(-0.5, 0.9, 0); l.rotation.set(-0.8, 0.3, -1.1);
      const dm = mat(0xffffff, { roughness: 0.4, map: cs((g, w, h) => { g.fillStyle = '#c4121a'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill(); g.fillStyle = '#f8f0c8'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.fillStyle = '#e8dca0'; g.beginPath(); g.ellipse(128, 120, 34, 50, 0, 0, 7); g.fill(); g.fillStyle = '#6a3a14'; [[112, 120], [144, 120], [118, 140], [138, 140]].forEach(p => { g.beginPath(); g.ellipse(p[0], p[1], 5, 9, 0, 0, 7); g.fill(); }); }) });
      const half = cutHalf(0.95, mat(0xc4121a, { roughness: 0.2, clearcoat: 1 }), dm, 1, 0.95, 0.9); half.position.set(1.05, -0.05, -0.1);
      return pose(G(a, st, l, half), 0.25, -0.4, 0);
    },
    () => { // orange + half
      const om = mat(0xf28a12, { roughness: 0.4, bumpMap: noiseBump(2.4, 900), bumpScale: 0.15, map: grad([[0, '#d86a08'], [0.5, '#ff9a1f'], [1, '#e87a10']], { speck: 200, speckColor: 'rgba(255,200,100,.25)' }) });
      const o = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), om); o.position.x = -0.55;
      const l = leaf(GREEN(), 0.9, 0.3); l.position.set(-0.55, 0.98, 0); l.rotation.set(-1.0, 0.2, 0.3); const nub = sph(0.12, mat(0x3f6a1a), -0.55, 1.0, 0, 1, 0.5, 1);
      const half = cutHalf(0.95, mat(0xf28a12, { roughness: 0.4 }), citrusDisc('#f28a12', ['#ffb43a', '#ff8a10'], 10), 1, 1, 0.9); half.position.set(1.15, -0.1, 0);
      return pose(G(o, l, nub, half), 0.25, -0.4, 0);
    },
    () => { // pomegranate + half
      const pm = mat(0xffffff, { roughness: 0.3, clearcoat: 0.6, map: grad([[0, '#8a0a18'], [0.6, '#c4162a'], [1, '#e04a3a']], { speck: 300, speckColor: 'rgba(255,200,150,.2)' }) });
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.95, 56, 40), pm); p.position.x = -0.6;
      const g = G(p); for (let i = 0; i < 6; i++) { const c = cone(0.1, 0.4, mat(0x9a1020)); c.scale.z = 0.4; const a = i / 6 * 6.28; c.position.set(-0.6 + Math.cos(a) * 0.17, 0.98, Math.sin(a) * 0.17); c.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(c); }
      const dm = mat(0xffffff, { roughness: 0.25, clearcoat: 0.6, map: cs((c, w, h) => { c.fillStyle = '#7a1018'; c.beginPath(); c.arc(128, 128, 128, 0, 7); c.fill(); c.fillStyle = '#f2e0b0'; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill(); for (let i = 0; i < 520; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 108, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d; const gr = c.createRadialGradient(x - 2, y - 2, 1, x, y, 9); gr.addColorStop(0, '#ff6a78'); gr.addColorStop(1, '#a8102a'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); } c.strokeStyle = '#f2e0b0'; c.lineWidth = 5; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); c.stroke(); } }) });
      const half = cutHalf(0.92, pm.clone(), dm, 1, 1, 0.9); half.position.set(1.1, -0.05, 0);
      return pose(G(g, half), 0.25, -0.4, 0);
    },
    () => { // mango + leaf
      const mm = mat(0xffffff, { roughness: 0.3, clearcoat: 0.6, map: grad([[0, '#6aa82a'], [0.4, '#e8b020'], [0.75, '#f07a1c'], [1, '#d83a2a']], { speck: 300, speckColor: 'rgba(255,240,180,.35)' }) });
      const g = new THREE.Group();
      [[-0.45, 0, 0.25, 1], [0.7, -0.15, -0.3, 0.85]].forEach((o, i) => {
        const b = lathe([[0, -0.9], [0.32, -0.82], [0.7, -0.4], [0.82, 0.1], [0.62, 0.62], [0.25, 0.88], [0, 0.88]], mm); b.scale.set(1.05, 1, 0.78);
        const m = G(b); const l = leaf(GREEN(), 1.2, 0.34); l.position.set(0, 0.85, 0); l.rotation.set(-0.7, 0.2, -1.0); m.add(l, tube([[0, 0.85, 0], [0.04, 1.05, 0]], 0.045, STEM()));
        m.position.set(o[0], o[1], 0); m.rotation.z = o[2]; m.scale.setScalar(o[3]); g.add(m);
      });
      return pose(g, 0.25, -0.5, 0);
    },
    () => { // pineapple
      const t = tex(256, 256, (g, w, h) => {
        g.fillStyle = '#e4a21a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a4a0c'; g.lineWidth = 3;
        for (let i = -8; i < 20; i++) { g.beginPath(); g.moveTo(i * 22, 0); g.lineTo(i * 22 + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i * 22 + 256, 0); g.lineTo(i * 22, 256); g.stroke(); }
      }, [2, 1]);
      const b = lathe([[0, -1], [0.55, -0.92], [0.78, -0.4], [0.8, 0.2], [0.62, 0.8], [0.3, 0.98], [0, 1]], mat(0xffffff, { map: t, roughness: 0.55, bumpMap: t, bumpScale: 1.0 }));
      const g = G(b), lm = mat(0x2f7a24, { roughness: 0.5 });
      for (let i = 0; i < 16; i++) { const c = cone(0.1, 1.2 - (i % 3) * 0.18, lm); c.scale.z = 0.4; const a = i / 16 * Math.PI * 2; c.position.set(Math.cos(a) * 0.15, 1.35, Math.sin(a) * 0.15); c.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55); g.add(c); }
      return pose(g);
    },
    () => { // watermelon + slice
      const t = tex(256, 256, (g, w, h) => {
        g.fillStyle = '#2f9a3a'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 9; i++) { g.strokeStyle = '#124a1c'; g.lineWidth = 9 + rnd() * 6; g.beginPath(); const x = i * 28 + 8; g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.1 + i) * 6, y); g.stroke(); }
      });
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.5 })); m.scale.set(1.2, 0.95, 0.95); m.position.set(-0.75, -0.1, -0.2);
      const ft = cs((g, w, h) => {
        g.fillStyle = '#2f9a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8f0c0'; g.beginPath(); g.arc(128, 128, 116, 0, 7); g.fill();
        const gr = g.createRadialGradient(128, 128, 0, 128, 128, 104); gr.addColorStop(0, '#ff4a5a'); gr.addColorStop(1, '#f2304a'); g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 104, 0, 7); g.fill();
        for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, d = 20 + rnd() * 70; g.fillStyle = '#1a0a0a'; g.beginPath(); g.ellipse(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 3, 6, a, 0, 7); g.fill(); }
      });
      const fm = mat(0xffffff, { map: ft, roughness: 0.25, clearcoat: 0.7 });
      const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.4, 56, 1, false, 0, Math.PI), [mat(0xffffff, { map: t, roughness: 0.3 }), fm, fm]);
      slice.rotation.x = Math.PI / 2; slice.rotation.z = Math.PI; slice.position.set(1.0, -0.15, 0.2);
      return pose(G(m, slice, tube([[-0.75, 0.82, -0.2], [-0.7, 1.0, -0.2]], 0.05, STEM())), 0.25, -0.35, 0);
    },
    () => { // grapes
      const m = mat(0x4a1a6a, { roughness: 0.25, clearcoat: 1, envMapIntensity: 1.3 }), gm = mat(0x9acb3a, { roughness: 0.25, clearcoat: 1 }), g = new THREE.Group();
      const bunch = (mm, ox, sc) => { const b = new THREE.Group(); [4, 4, 3, 2, 1].forEach((n, r) => { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 0.62, y = 0.7 - r * 0.52; b.add(sph(0.33, mm, x + (rnd() - 0.5) * 0.06, y, (rnd() - 0.5) * 0.35)); b.add(sph(0.3, mm, x * 0.9, y - 0.1, -0.35 + rnd() * 0.1)); } }); b.add(tube([[0, 0.85, 0], [0.05, 1.2, 0], [0.2, 1.4, 0]], 0.06, STEM())); b.position.x = ox; b.scale.setScalar(sc); return b; };
      g.add(bunch(m, -0.6, 1)); g.add(bunch(gm, 1.3, 0.75));
      const l = leaf(GREEN(), 1.0, 0.45); l.position.set(-0.4, 1.15, 0.1); l.rotation.set(-0.5, 0.3, -1.2); g.add(l);
      return pose(g, 0.15, -0.4, 0);
    }
  ];

  // ---------- vegetables ----------
  // tube along a curve whose radius varies along its length
  function taperTube(pts, rFn, m, flat) {
    const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), segs = 48, rad = 14;
    const geo = new THREE.TubeGeometry(cv, segs, 1, rad, false), pos = geo.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const ring = Math.floor(i / (rad + 1)), t = ring / segs;
      cv.getPointAt(Math.min(t, 1), c); v.fromBufferAttribute(pos, i).sub(c).multiplyScalar(rFn(t));
      if (flat) v.y *= flat;
      pos.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
    }
    geo.computeVertexNormals(); return new THREE.Mesh(geo, m);
  }
  const veg = [
    () => { // green chillies (with one red)
      const g = new THREE.Group(), gm = mat(0x2a9a1c, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }), rm = mat(0xd4140c, { roughness: 0.15, clearcoat: 1 }), cap = mat(0x2f7a24, { roughness: 0.5 });
      [[gm, 0, 0, 1.0, 0], [gm, 0.5, -0.3, 0.85, 0.35], [rm, -0.45, -0.5, 0.75, -0.45]].forEach(c => {
        const cur = [[-0.9, 0.9, 0], [-0.4, 0.2, 0.05], [0.2, -0.5, 0], [0.9, -1.2, -0.05], [1.2, -1.5, 0]];
        const ch = taperTube(cur, t => 0.34 * Math.pow(1 - t, 0.55) + 0.02, c[0]);
        const k = G(ch); const stem = tube([[-0.9, 0.9, 0], [-1.05, 1.15, 0], [-1.2, 1.4, 0.05]], 0.06, cap); k.add(stem);
        const cp = sph(0.2, cap, -0.92, 0.9, 0, 1, 0.6, 1); k.add(cp);
        k.position.set(c[1], c[2], 0); k.scale.setScalar(c[3]); k.rotation.z = c[4]; g.add(k);
      });
      return pose(g, 0.2, -0.4, 0.1);
    },
    () => { // pea pods with loose peas
      const g = new THREE.Group(), pm = mat(0x6fb82a, { roughness: 0.3, clearcoat: 0.6 }), pea = mat(0x8ad02a, { roughness: 0.2, clearcoat: 1 });
      [[0, 0.1, 0], [0.5, -0.3, 0.15]].forEach((o, j) => {
        const cur = [[-1.3, -0.6, 0], [-0.4, -0.15, 0], [0.5, 0.1, 0], [1.3, 0.5, 0]], pod = new THREE.Group();
        pod.add(taperTube(cur, t => 0.28 + 0.1 * Math.sin(Math.PI * Math.min(t * 1.1, 1)) - 0.12 * t * t, pm, 0.7));
        const cv = new THREE.CatmullRomCurve3(cur.map(p => new THREE.Vector3(...p)));
        for (let i = 0; i < 7; i++) { const p = cv.getPointAt(0.1 + i * 0.13); pod.add(sph(0.2, pea, p.x, p.y + 0.12, p.z + 0.09)); }
        pod.add(tube([[1.3, 0.5, 0], [1.55, 0.75, 0], [1.7, 1.0, 0]], 0.04, mat(0x4a8a1c)));
        pod.position.set(o[0], o[1], o[2]); pod.rotation.z = j ? -0.15 : 0.1; g.add(pod);
      });
      [[-0.8, -1.1, 0.6], [-0.35, -1.2, 0.8], [-1.2, -0.95, 0.9]].forEach(p => g.add(sph(0.19, pea, ...p)));
      return pose(g, 0.5, -0.35, 0);
    },
    () => { // okra / lady finger
      const g = new THREE.Group(), okM = mat(0xffffff, { roughness: 0.4, clearcoat: 0.3, map: grad([[0, '#4a8a2a'], [0.5, '#6aae3a'], [1, '#4a8a2a']], { streaks: 20, streakColor: 'rgba(230,250,170,.22)' }) });
      const one = (len) => {
        const prof = [[0, -len], [0.04, -len * 0.92], [0.17, -len * 0.5], [0.27, len * 0.2], [0.3, len * 0.8], [0.26, len * 0.95], [0.12, len * 1.0], [0, len * 1.0]];
        const o = lathe(prof, okM, 40); lobes(o, 5, 0.14); const cp = lathe([[0, len * 0.97], [0.26, len * 0.97], [0.2, len * 1.05], [0, len * 1.08]], mat(0x4a7a2a, { roughness: 0.6 }), 20);
        lobes(cp, 5, 0.1); return G(o, cp);
      };
      [[0, 0, 0, 0.0, 1.3], [0.8, -0.1, 0.15, 0.3, 1.2], [-0.8, -0.1, -0.1, -0.3, 1.15], [0.3, -0.35, 0.6, 0.12, 1.0]].forEach(c => { const o = one(c[4]); o.position.set(c[0], c[1], c[2]); o.rotation.z = c[3]; g.add(o); });
      return pose(G(g), 0.25, -0.45, 0.55);
    },
    () => { // carrots with leaves
      const g = new THREE.Group(), cm = mat(0xffffff, { roughness: 0.4, map: grad([[0, '#d9560a'], [1, '#f58a1f']], { streaks: 6 }), bumpMap: tex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { c.fillStyle = rnd() < 0.5 ? '#606060' : '#a0a0a0'; c.fillRect(0, rnd() * h, w, 2); } }), bumpScale: 1.5 }), lm = mat(0x2f8a2a, { roughness: 0.6 });
      [[0, 0, 0, 0], [0.45, -0.1, 0.1, 0.15], [-0.45, -0.1, -0.1, -0.15]].forEach((o, j) => {
        const c = G(lathe([[0, -1.5], [0.05, -1.35], [0.18, -0.6], [0.34, 0.3], [0.4, 0.85], [0, 0.88]], cm));
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; c.add(tube([[0, 0.85, 0], [Math.cos(a) * 0.2, 1.3, Math.sin(a) * 0.2], [Math.cos(a) * 0.45, 1.8, Math.sin(a) * 0.45]], 0.035, lm)); const lf = leaf(lm, 0.5, 0.1); lf.position.set(Math.cos(a) * 0.45, 1.8, Math.sin(a) * 0.45); lf.rotation.set(0.4, a, 0); c.add(lf); }
        c.position.set(o[0], o[1], o[2]); c.rotation.z = o[3]; g.add(c);
      });
      g.rotation.set(0.25, -0.5, 1.0); return G(g);
    },
    () => { // tomatoes
      const g = new THREE.Group(), tm = mat(0xffffff, { roughness: 0.15, clearcoat: 1, map: grad([[0, '#c01a14'], [0.7, '#e83222'], [1, '#c8301a']]) }), lm = mat(0x2f8a2a, { side: THREE.DoubleSide });
      [[0, 0, 0, 1], [0.95, -0.15, -0.3, 0.8]].forEach(o => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), tm); b.scale.set(1.05, 0.88, 1.05); lobes(b, 5, 0.02);
        const t = G(b); for (let i = 0; i < 6; i++) { const k = cone(0.13, 0.55, lm); k.scale.z = 0.3; const a = i / 6 * 6.28; k.position.set(Math.cos(a) * 0.3, 0.86, Math.sin(a) * 0.3); k.rotation.set(Math.sin(a) * 1.35, 0, -Math.cos(a) * 1.35); t.add(k); }
        t.add(tube([[0, 0.84, 0], [0, 1.05, 0]], 0.05, lm)); t.position.set(o[0], o[1], o[2]); t.scale.setScalar(o[3]); g.add(t);
      });
      return pose(g, 0.3, -0.4, 0);
    },
    () => { // red onions with a cut half
      const t = tex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#7a1f4a'); gr.addColorStop(0.6, '#a83a72'); gr.addColorStop(1, '#c89aa0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(i * 18 + 4, 0, 3, h); } });
      const g = new THREE.Group(), b = lathe([[0, -0.82], [0.4, -0.8], [0.92, -0.3], [0.98, 0.2], [0.62, 0.72], [0.22, 1.02], [0.05, 1.3], [0, 1.3]], mat(0xffffff, { map: t, roughness: 0.3, clearcoat: 0.5 }));
      b.position.x = -0.5; g.add(b);
      const half = new THREE.Mesh(new THREE.SphereGeometry(0.9, 40, 28, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa83a72, { roughness: 0.4, side: THREE.DoubleSide })); half.rotation.x = -Math.PI / 2; half.position.set(1.0, -0.1, -0.2); g.add(half);
      const ct = tex(256, 256, (c, w, h) => { c.fillStyle = '#f4e8f0'; c.fillRect(0, 0, w, h); for (let i = 1; i < 9; i++) { c.strokeStyle = i % 2 ? '#a83a72' : '#d9a0c0'; c.lineWidth = 6; c.beginPath(); c.arc(128, 128, i * 15, 0, 7); c.stroke(); } });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), mat(0xffffff, { map: ct, roughness: 0.3, clearcoat: 0.6 })); disc.position.set(1.0, -0.1, -0.2); g.add(disc);
      return pose(g, 0.3, -0.4, 0);
    },
    () => { // long brinjals
      const g = new THREE.Group(), bm = mat(0x2a0a40, { roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 }), lm = mat(0x2f7a24, { side: THREE.DoubleSide });
      [[0, 0, 0, 0.05], [0.7, -0.15, 0.1, 0.3]].forEach(o => {
        const e = G(lathe([[0, -1.6], [0.18, -1.5], [0.4, -0.8], [0.45, 0.2], [0.36, 0.9], [0.25, 1.15], [0, 1.15]], bm));
        for (let i = 0; i < 7; i++) { const k = cone(0.17, 0.5, lm); k.scale.z = 0.3; const a = i / 7 * 6.28; k.position.set(Math.cos(a) * 0.28, 1.1, Math.sin(a) * 0.28); k.rotation.set(Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5); e.add(k); }
        e.add(tube([[0, 1.15, 0], [0.04, 1.45, 0], [0.18, 1.7, 0]], 0.08, lm));
        e.position.set(o[0], o[1], o[2]); e.rotation.z = o[3]; g.add(e);
      });
      g.rotation.set(0.25, -0.5, 1.15); return G(g);
    },
    () => { // bitter gourd
      const g = new THREE.Group(), bt = tex(256, 256, (c, w, h) => { c.fillStyle = '#3a8a2a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { c.fillStyle = rnd() < 0.5 ? '#4a9a38' : '#1f6a1a'; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 2 + rnd() * 5, 0, 0, 7); c.fill(); } });
      const gm = mat(0xffffff, { map: bt, roughness: 0.35, clearcoat: 0.5, bumpMap: bt, bumpScale: 1.2 });
      [[-0.6, 0.3, 0, 0.1], [0.7, -0.5, 0.3, -0.2]].forEach(o => {
        const b = lathe([[0, -1.6], [0.1, -1.5], [0.4, -0.9], [0.5, 0], [0.42, 0.9], [0.22, 1.4], [0.08, 1.55], [0, 1.55]], gm, 48); lobes(b, 8, 0.14);
        b.scale.set(0.78, 1, 0.78); b.position.set(o[0], o[1], o[2]); b.rotation.z = o[3]; g.add(b);
      });
      g.rotation.set(0.3, -0.4, 1.35); return G(g);
    },
    () => { // cauliflower
      const g = new THREE.Group(), fm = mat(0xf4f0de, { roughness: 0.95 }), lm = mat(0x4a8a3a, { roughness: 0.5, side: THREE.DoubleSide });
      for (let i = 0; i < 160; i++) { const u = rnd() * 6.28, v = Math.acos(1 - rnd() * 1.55), r = 0.88 + rnd() * 0.1, s = sph(0.1 + rnd() * 0.09, fm, Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r * 0.9 - 0.05, Math.sin(v) * Math.sin(u) * r); g.add(s); }
      g.add(sph(0.88, fm, 0, -0.05, 0));
      for (let i = 0; i < 7; i++) { const sh = new THREE.Mesh(new THREE.SphereGeometry(1.0 + i * 0.012, 32, 20, i / 7 * 6.28, 1.3, 1.95, 1.2), mat(0x5a9a3a, { roughness: 0.5, side: THREE.DoubleSide, color: new THREE.Color().setHSL(0.27 + rnd() * 0.03, 0.45, 0.38 + rnd() * 0.1) })); g.add(sh); }
      return pose(g, 0.3, -0.4, 0);
    },
    () => { // cabbage
      const g = new THREE.Group();
      const vt = tex(256, 256, (c, w, h) => { c.fillStyle = '#9fd070'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d8eeb8'; c.lineWidth = 3; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(w / 2, h); c.quadraticCurveTo(w * (0.15 + i * 0.12), h * 0.5, w * (0.1 + i * 0.13), 0); c.stroke(); } });
      g.add(sph(0.95, mat(0xcfe8a8, { roughness: 0.6 }))); g.add(sph(0.34, mat(0xb8dc8a, { roughness: 0.6 }), 0, 0.97, 0, 1, 0.4, 1));
      for (let i = 0; i < 12; i++) { const sh = new THREE.Mesh(new THREE.SphereGeometry(1.0 + i * 0.012, 36, 24, rnd() * 6.28, 1.7 + rnd() * 0.6, i < 4 ? 0 : 0.25 + rnd() * 0.3, i < 4 ? 2.1 : 1.8 + rnd() * 0.5), mat(0xffffff, { map: vt, roughness: 0.55, color: new THREE.Color().setHSL(0.24 + rnd() * 0.04, 0.5, 0.62 + rnd() * 0.12), side: THREE.DoubleSide })); g.add(sh); }
      return pose(g, 0.3, -0.4, 0);
    },
    () => { // pumpkin
      const pm = mat(0xffffff, { roughness: 0.4, clearcoat: 0.4, map: grad([[0, '#d86a0a'], [0.5, '#f58a1a'], [1, '#e87a10']], { streaks: 24, streakColor: 'rgba(120,40,0,.18)' }) });
      const b = lathe([[0, -0.78], [0.55, -0.74], [1.05, -0.35], [1.2, 0.08], [0.95, 0.55], [0.4, 0.72], [0.15, 0.66], [0, 0.55]], pm, 80); lobes(b, 10, 0.07);
      const g = G(b); g.add(tube([[0, 0.55, 0], [0.04, 0.9, 0], [0.22, 1.18, 0]], 0.13, mat(0x5a6a1a, { roughness: 0.8 })));
      const lf = leaf(mat(0x3a8a24, { side: THREE.DoubleSide }), 0.9, 0.35); lf.position.set(0.08, 0.8, 0); lf.rotation.set(-0.9, 0.6, -1.0); g.add(lf);
      return pose(g, 0.25, -0.45, 0);
    }
  ];

  // ---------- stones ----------
  function gemMat(color, op) {
    return new THREE.MeshPhysicalMaterial({ color, metalness: 0.15, roughness: 0.03, flatShading: true, transparent: true, opacity: op || 0.93, envMapIntensity: 1.5, clearcoat: 1, side: THREE.DoubleSide });
  }
  function cutShape(shape, color, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: o.depth || 0.5, bevelEnabled: true, bevelSize: o.bs || 0.16, bevelThickness: o.bt || 0.22, bevelSegments: o.seg || 1, curveSegments: o.cs || 10 }), gemMat(color, o.op));
    m.position.z = -(o.depth || 0.5) / 2;
    return m;
  }
  const stones = [
    () => { const r = new THREE.Mesh(wobble(new THREE.IcosahedronGeometry(1, 3), 0.28, 1.8, 2.1), mat(0x7b7b7f, { roughness: 0.9, flatShading: true, bumpMap: noiseBump(4, 400), bumpScale: 1 })); r.scale.set(1.3, 0.85, 1); return pose(G(r), 0.3, -0.4, 0.1); },
    () => { // gold nugget
      const n = new THREE.Mesh(wobble(new THREE.IcosahedronGeometry(1, 3), 0.3, 2.4, 5.3), new THREE.MeshStandardMaterial({ color: 0xe6a81c, metalness: 1, roughness: 0.28 })); n.scale.set(1.2, 0.85, 0.9);
      return pose(G(n), 0.3, -0.4, 0.1);
    },
    () => { // pearl
      const t = grad([[0, '#e8d6dc'], [0.5, '#fff8fa'], [1, '#dfe8f4']]);
      return pose(G(sph(0.95, mat(0xffffff, { map: t, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 }))));
    },
    () => crystal(0xf4f6ff, 0.55),
    () => { // emerald cut
      const s = new THREE.Shape(), w = 0.75, h = 1.0, c = 0.3;
      s.moveTo(-w + c, -h); s.lineTo(w - c, -h); s.lineTo(w, -h + c); s.lineTo(w, h - c); s.lineTo(w - c, h); s.lineTo(-w + c, h); s.lineTo(-w, h - c); s.lineTo(-w, -h + c); s.closePath();
      return pose(G(cutShape(s, 0x0d8a4a, { depth: 0.5, bs: 0.22, bt: 0.28, seg: 2, op: 0.95 })), 0.7, -0.45, 0.15);
    },
    () => { // amethyst geode
      const g = new THREE.Group(), shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x6a625c, { roughness: 0.95, side: THREE.DoubleSide, bumpMap: noiseBump(4, 400), bumpScale: 1.5 }));
      g.add(shell);
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.88, 1.04, 48), mat(0xc8b8a0, { roughness: 0.7, side: THREE.DoubleSide })); rim.rotation.x = Math.PI / 2; g.add(rim);
      const cm = gemMat(0x8a3ad0, 0.95);
      for (let i = 0; i < 70; i++) { const u = rnd() * 6.28, v = rnd() * 1.05, d = new THREE.Vector3(Math.sin(v) * Math.cos(u), -Math.cos(v), Math.sin(v) * Math.sin(u)); const k = new THREE.Mesh(new THREE.ConeGeometry(0.09 + rnd() * 0.05, 0.3 + rnd() * 0.25, 6), cm); k.position.copy(d.clone().multiplyScalar(0.85)); k.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().negate()); g.add(k); }
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x3a1a60, { roughness: 0.5, side: THREE.BackSide })));
      return pose(g, 0.95, -0.3, 0);
    },
    () => { // turquoise cabochon
      const t = tex(256, 256, (g, w, h) => { g.fillStyle = '#25b8b0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,70,60,.6)'; g.lineWidth = 2; for (let i = 0; i < 24; i++) { g.beginPath(); let x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rnd() * 40 - 20; y += rnd() * 40 - 20; g.lineTo(x, y); } g.stroke(); } });
      const s = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), mat(0xffffff, { map: t, roughness: 0.35, clearcoat: 0.6 })); s.scale.set(1.1, 0.8, 1); return pose(G(s));
    },
    () => { // ruby heart
      const s = new THREE.Shape(); s.moveTo(0, -1); s.bezierCurveTo(-0.3, -0.7, -1.1, -0.2, -1.1, 0.4); s.bezierCurveTo(-1.1, 0.95, -0.4, 1.1, 0, 0.6); s.bezierCurveTo(0.4, 1.1, 1.1, 0.95, 1.1, 0.4); s.bezierCurveTo(1.1, -0.2, 0.3, -0.7, 0, -1);
      return pose(G(cutShape(s, 0xc4082a, { depth: 0.4, bs: 0.18, bt: 0.22, seg: 1, cs: 7, op: 0.95 })), 0.5, -0.4, 0);
    },
    () => { // sapphire teardrop
      const s = new THREE.Shape(); s.moveTo(0, 1.15); s.bezierCurveTo(0.3, 0.5, 0.8, 0.1, 0.8, -0.3); s.bezierCurveTo(0.8, -0.85, -0.8, -0.85, -0.8, -0.3); s.bezierCurveTo(-0.8, 0.1, -0.3, 0.5, 0, 1.15);
      return pose(G(cutShape(s, 0x1432b8, { depth: 0.4, bs: 0.2, bt: 0.24, seg: 2, cs: 8, op: 0.95 })), 0.65, -0.45, -0.2);
    },
    () => gem(0xd8ecff, { seg: 12, opacity: 0.7 }),
    () => { // diamond ring
      const gold = new THREE.MeshStandardMaterial({ color: 0xf0c030, metalness: 1, roughness: 0.18 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.14, 20, 64), gold);
      const stone = gem(0xe8f4ff, { seg: 12, opacity: 0.75 }); stone.rotation.set(0, 0, 0); stone.scale.setScalar(0.5); stone.position.y = 1.25;
      const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.2, 12), gold); prong.position.y = 1.05;
      return pose(G(band, prong, stone), 0.25, -0.5, 0);
    }
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

  // ---------- eyewear variety (spectacles set) ----------
  function rr(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function hole(shape, w, h, r, cx, cy) { const p = rr(w, h, r); const pts = p.getPoints(12).map(v => new THREE.Vector2(v.x + cx, v.y + cy)); shape.holes.push(new THREE.Path(pts)); }
  const goldM = () => new THREE.MeshStandardMaterial({ color: 0xf0c030, metalness: 1, roughness: 0.2 });
  const glassM = (c, op) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.03, transparent: true, opacity: op, clearcoat: 1, envMapIntensity: 1.6, side: THREE.DoubleSide });

  const monocle = () => {
    const g = new THREE.Group(), gm = goldM();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.1, 18, 64), gm));
    g.add(new THREE.Mesh(new THREE.CircleGeometry(0.9, 48), glassM(0xdbeeff, 0.4)));
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 20), gm); hook.position.set(0.95, -0.2, 0); g.add(hook);
    g.add(tube([[0.95, -0.28, 0], [1.2, -1.0, 0.05], [0.7, -1.7, 0.15], [0.9, -2.3, 0.05], [1.3, -2.8, 0]], 0.025, gm));
    for (let i = 0; i < 7; i++) { const t = i / 6, l = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 12), gm); l.position.set(1.0 + Math.sin(t * 4) * 0.2, -1.0 - t * 1.6, 0.05); l.rotation.x = i * 1.2; g.add(l); }
    return pose(g, 0.15, -0.4, 0);
  };
  const threeD = () => {
    const g = new THREE.Group(), card = mat(0x1d1d22, { roughness: 0.75 });
    const o = rr(3.4, 1.35, 0.25); hole(o, 1.25, 0.85, 0.12, -0.9, 0); hole(o, 1.25, 0.85, 0.12, 0.9, 0);
    const f = new THREE.Mesh(new THREE.ExtrudeGeometry(o, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), card); f.position.z = -0.025; g.add(f);
    [[-0.9, 0xff2a20], [0.9, 0x20d8ff]].forEach(a => { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), glassM(a[1], 0.7)); l.position.set(a[0], 0, 0.01); g.add(l); });
    [-1, 1].forEach(s => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 2.6), card); t.position.set(s * 1.7, 0.1, -1.3); g.add(t); });
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), mat(0xffffff)); w.position.set(0, -0.45, 0.04); g.add(w);
    return pose(g, 0.2, -0.45, 0.05);
  };
  const goggles = () => {
    const g = new THREE.Group(), sil = mat(0x1a60d0, { roughness: 0.25, clearcoat: 1 });
    [-1, 1].forEach(s => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 18, 48), sil); rim.scale.set(1, 0.78, 1); rim.position.x = s * 1.05; g.add(rim);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.85, 40, 20, 0, Math.PI * 2, 0, 0.9), glassM(0x6ad0ff, 0.55)); l.rotation.x = Math.PI / 2; l.scale.set(1, 1, 0.78); l.position.set(s * 1.05, 0, -0.1); l.scale.set(1, 0.7, 0.8); g.add(l);
    });
    g.add(tube([[-0.25, 0.1, 0], [0, 0.18, 0.03], [0.25, 0.1, 0]], 0.07, sil));
    const strap = mat(0x15151a, { roughness: 0.8 });
    g.add(tube([[-1.95, 0.05, 0], [-2.25, 0.05, -1.0], [-1.2, 0.1, -2.5], [0, 0.1, -2.8], [1.2, 0.1, -2.5], [2.25, 0.05, -1.0], [1.95, 0.05, 0]], 0.1, strap));
    return pose(g, 0.35, -0.5, 0);
  };
  const ski = () => {
    const g = new THREE.Group(), frame = mat(0xe04a10, { roughness: 0.3, clearcoat: 0.8 });
    const o = rr(3.6, 1.7, 0.6); hole(o, 3.2, 1.35, 0.5, 0, 0);
    const f = new THREE.Mesh(new THREE.ExtrudeGeometry(o, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 3 }), frame); f.position.z = -0.17; g.add(f);
    const lens = new THREE.Mesh(new THREE.ShapeGeometry(rr(3.25, 1.4, 0.5)), new THREE.MeshPhysicalMaterial({ color: 0xf0a030, metalness: 0.7, roughness: 0.06, transparent: true, opacity: 0.88, envMapIntensity: 2.2, clearcoat: 1, side: THREE.DoubleSide })); lens.position.z = 0.0; g.add(lens);
    const nose = mat(0x15151a, { roughness: 0.8 }); const n = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.3), nose); n.position.set(0, -0.8, 0.0); g.add(n);
    const band = mat(0x20242c, { roughness: 0.8 });
    [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 2.6), band); b.position.set(s * 1.95, 0, -1.3); b.rotation.y = s * -0.12; g.add(b); const st = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 2.4), mat(0xe04a10)); st.position.set(s * 1.95, 0, -1.3); st.rotation.y = s * -0.12; g.add(st); });
    return pose(g, 0.2, -0.5, 0);
  };
  const caseItem = () => {
    const g = new THREE.Group(), tt = tex(256, 256, (c, w, h) => { c.fillStyle = '#b8742a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${60 + rnd() * 40 | 0},${30 + rnd() * 20 | 0},0,.22)`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 1.4, 0, 7); c.fill(); } });
    const leather = mat(0xffffff, { map: tt, roughness: 0.5, clearcoat: 0.25, bumpMap: tt, bumpScale: 1.2 });
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(3.4, 1.5, 0.35), { depth: 0.6, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.12, bevelSegments: 4, curveSegments: 16 }), leather); body.position.z = -0.3; g.add(body);
    const fl = new THREE.Shape(); fl.moveTo(-1.7, 0.75); fl.lineTo(1.7, 0.75); fl.lineTo(1.7, -0.05); fl.lineTo(0.0, -0.75); fl.lineTo(-1.7, -0.05); fl.closePath();
    const flap = new THREE.Mesh(new THREE.ExtrudeGeometry(fl, { depth: 0.04, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 2 }), leather); flap.position.z = 0.5; g.add(flap);
    const gm = new THREE.MeshStandardMaterial({ color: 0xc89a60, metalness: 0.8, roughness: 0.3 });
    const snap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.12, 24), gm); snap.rotation.x = Math.PI / 2; snap.position.set(0, -0.5, 0.7); g.add(snap);
    const st = new THREE.LineCurve3 ? null : null;
    for (let i = 0; i < 26; i++) { const t = i / 25, x = -1.55 + t * 3.1, y = x < 0 ? -0.05 - (x + 1.55) * (0.62 / 1.55) + 0.0 : -0.05 - (1.55 - x) * (0.62 / 1.55) + 0.0; const d = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.014), mat(0x7a4a1a)); d.position.set(x, -0.62 + (x < 0 ? (x + 1.55) * 0.4 : (1.55 - x) * 0.4) - 0.0, 0.62); d.rotation.z = x < 0 ? 0.4 : -0.4; g.add(d); }
    return pose(g, 0.6, -0.4, 0.05);
  };
  const FR = (root.SET3D || {}).specs;
  if (FR && FR.length === 11 && root.makeGlasses3D) {
    const mk = f => () => root.makeGlasses3D(f);
    const browline = mk(['brow', 'metal', 0xe8b858, 0xeaf0f4, 0.2, false, 0x0e0e10]);
    const hexRose = mk(['hex', 'metal', 0xe9a98f, 0xf4e0e6, 0.2]);
    const butterfly = mk(['butterfly', 'metal', 0xf0b8a8, 0xf8e8ee, 0.18]);
    (root.SET3D = root.SET3D || {}).specs = [threeD, goggles, monocle, ski, caseItem, FR[0], FR[2], FR[3], browline, hexRose, FR[10]];
  }

  const S = (root.SET3D = root.SET3D || {});
  S.fruits = fruits; S.veg = veg; S.stones = stones; S.space = space;
})(this);
