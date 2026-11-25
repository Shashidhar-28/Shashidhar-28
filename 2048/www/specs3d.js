// Renders 11 realistic 3D spectacles with three.js into PNG data URLs (once, offscreen).
(function (root) {
  const FRAMES = [
    // [shape, material, colour, lensColour, lensOpacity, tortoise?]
    ['round',    'metal',   0xd9dde3, 0xcfe6ff, 0.28],
    ['wayfarer', 'plastic', 0x6b3a18, 0xdde8ee, 0.22, true],
    ['wayfarer', 'plastic', 0x0c0c0c, 0x2d4a5e, 0.78],
    ['square',   'plastic', 0xc81e1e, 0xf2dede, 0.22],
    ['aviator',  'metal',   0xe0b030, 0x4d7a5e, 0.65],
    ['cat',      'plastic', 0x1c3f9a, 0xe6edfb, 0.22],
    ['round',    'plastic', 0x1a9a45, 0xdcf4e4, 0.25],
    ['square',   'metal',   0xd9917f, 0xf1dde4, 0.25],
    ['cat',      'plastic', 0x7a38c4, 0xeee2fb, 0.25],
    ['wayfarer', 'plastic', 0x0fa39b, 0xd6f3f1, 0.25],
    ['aviator',  'metal',   0xf3c020, 0x161616, 0.9]
  ];

  function outline(shape) {
    const s = new THREE.Shape();
    const P = {
      round: () => s.absellipse(0, 0, 1.0, 0.92, 0, Math.PI * 2, false, 0),
      square: () => { s.moveTo(-0.7, 0.8); s.lineTo(0.7, 0.8); s.quadraticCurveTo(1.0, 0.8, 1.0, 0.5); s.lineTo(1.0, -0.5); s.quadraticCurveTo(1.0, -0.8, 0.7, -0.8); s.lineTo(-0.7, -0.8); s.quadraticCurveTo(-1.0, -0.8, -1.0, -0.5); s.lineTo(-1.0, 0.5); s.quadraticCurveTo(-1.0, 0.8, -0.7, 0.8); },
      wayfarer: () => { s.moveTo(-1.0, 0.7); s.quadraticCurveTo(-1.0, 0.85, -0.8, 0.85); s.lineTo(0.85, 0.85); s.quadraticCurveTo(1.05, 0.85, 1.0, 0.65); s.lineTo(0.88, -0.35); s.quadraticCurveTo(0.8, -0.9, 0.3, -0.9); s.lineTo(-0.4, -0.9); s.quadraticCurveTo(-0.95, -0.9, -0.97, -0.3); s.lineTo(-1.0, 0.7); },
      aviator: () => { s.moveTo(-1.0, 0.55); s.bezierCurveTo(-1.0, 0.9, -0.5, 0.95, 0, 0.92); s.bezierCurveTo(0.6, 0.9, 1.05, 0.85, 1.0, 0.45); s.bezierCurveTo(0.95, -0.4, 0.45, -1.05, 0, -1.05); s.bezierCurveTo(-0.55, -1.05, -1.0, -0.3, -1.0, 0.55); },
      cat: () => { s.moveTo(-1.0, 0.1); s.quadraticCurveTo(-1.05, 0.6, -0.8, 0.75); s.lineTo(0.7, 0.95); s.quadraticCurveTo(1.15, 0.98, 1.05, 0.5); s.lineTo(0.8, -0.55); s.quadraticCurveTo(0.55, -0.95, 0.1, -0.9); s.lineTo(-0.3, -0.85); s.quadraticCurveTo(-0.9, -0.7, -1.0, 0.1); }
    };
    P[shape]();
    return s.getPoints(48);
  }
  const scaled = (pts, k) => pts.map(p => new THREE.Vector2(p.x * k, p.y * k));

  function tortoiseTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#9a5a20'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#3a1806', '#6a3410', '#24100a', '#c07a30'][i % 4];
      g.globalAlpha = 0.55; g.beginPath();
      g.ellipse(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 26, 5 + Math.random() * 16, Math.random() * 3, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.6, 0.6);
    return t;
  }

  let tort = null;
  function makeGlasses(f) {
    tort = tort || tortoiseTexture();
      const [shape, kind, col, lcol, lop, tt] = f;
      const g = new THREE.Group();
      const pts = outline(shape);
      const frameMat = kind === 'metal'
        ? new THREE.MeshStandardMaterial({ color: col, metalness: 1, roughness: 0.3 })
        : new THREE.MeshPhysicalMaterial({ color: tt ? 0xffffff : col, map: tt ? tort : null, metalness: 0, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 });
      const lensMat = new THREE.MeshPhysicalMaterial({ color: lcol, metalness: 0, roughness: 0.03, transparent: true, opacity: lop + 0.25, envMapIntensity: 1.6, clearcoat: 1, side: THREE.DoubleSide });
      const rimW = kind === 'metal' ? 0.07 : 0.17, depth = kind === 'metal' ? 0.12 : 0.26;
      const rimShape = new THREE.Shape(scaled(pts, 1.0 + (kind === 'metal' ? 0.03 : 0.05)));
      rimShape.holes.push(new THREE.Path(scaled(pts, 1.0 - rimW)));
      const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 24 }), frameMat);
      rim.position.z = -depth / 2;
      const lens = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(scaled(pts, 1.0 - rimW + 0.03))), lensMat);
      const eye = new THREE.Group(); eye.add(rim, lens);
      const L = eye, R = eye.clone(); L.position.x = -1.17; R.position.x = 1.17;
      g.add(L, R);
      // bridge
      const br = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 0.35, 0), new THREE.Vector3(0, 0.5, 0.02), new THREE.Vector3(0.2, 0.35, 0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(br, 12, kind === 'metal' ? 0.05 : 0.08, 8), frameMat));
      if (kind === 'metal') {
        const pad = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.8 });
        [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), pad); p.scale.set(0.6, 1.3, 0.6); p.position.set(s * 0.34, -0.1, 0.15); g.add(p); });
      }
      // temples
      [-1, 1].forEach(s => {
        const t = new THREE.Mesh(new THREE.BoxGeometry(kind === 'metal' ? 0.07 : 0.12, kind === 'metal' ? 0.08 : 0.19, 2.6), frameMat);
        t.position.set(s * 2.2, 0.4, -1.35); t.rotation.y = s * -0.05; g.add(t);
        const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.2), frameMat); hinge.position.set(s * 2.18, 0.4, -0.05); g.add(hinge);
      });
      g.rotation.set(0.24, -0.42, -0.02);
      return g;
  }
  (root.SET3D = root.SET3D || {}).specs = FRAMES.map(f => () => makeGlasses(f));
})(this);
