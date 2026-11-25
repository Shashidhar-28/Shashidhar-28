// Shared offscreen 3D renderer: turns model builders into PNG data URLs.
(function (root) {
  function buildEnv(renderer) {
    const sc = new THREE.Scene();
    const geo = new THREE.SphereGeometry(50, 32, 16), cols = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 50, c = new THREE.Color();
      const u = Math.max(y, 0) * 0.55; c.setRGB(0.07 + u, 0.08 + u, 0.11 + u);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const panel = (w, h, x, y, z, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m);
    };
    panel(26, 12, -22, 20, 25, 2.2); panel(8, 24, 30, 6, 18, 1.6); panel(36, 5, 0, 35, -10, 1.2);
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(sc, 0.02).texture; pm.dispose();
    return tex;
  }


  root.renderSet3D = function (key) {
    const builders = root.SET3D && root.SET3D[key];
    if (!root.THREE || !builders) return null;
    const W = 360, H = 260;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); } catch (e) { return null; }
    renderer.setPixelRatio(1); renderer.setSize(W, H);
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.NoToneMapping;
    const env = buildEnv(renderer);
    const scene = new THREE.Scene(); scene.environment = env;
    const key1 = new THREE.DirectionalLight(0xffffff, 0.6); key1.position.set(-3, 5, 6); scene.add(key1);
    const cam = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
    const out = [];
    builders.forEach(build => {
      const g = build();
      scene.add(g);
      const box = new THREE.Box3().setFromObject(g), ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const t = 2 * Math.tan(cam.fov * Math.PI / 360);
      const dist = Math.max(size.x / (t * (W / H)), size.y / t) * 1.08 + size.z * 0.5;
      cam.position.set(ctr.x, ctr.y, ctr.z + dist); cam.lookAt(ctr);
      renderer.render(scene, cam);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      const pv = new THREE.Vector3(ctr.x, box.min.y, ctr.z).project(cam), sy = Math.min(H - 10, (1 - pv.y) / 2 * H + 6), sw = Math.min(W * 0.42, Math.max(60, size.x * W / (dist * t * (W / H)) * 0.5));
      const sg = x.createRadialGradient(W / 2, 0, 2, W / 2, 0, sw);
      sg.addColorStop(0, 'rgba(0,0,0,.38)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      x.save(); x.translate(W * 0 + (pv.x * 0.5 + 0.5) * W - W / 2, sy); x.scale(1, 0.18); x.fillStyle = sg; x.fillRect(0, -H, W, H * 2); x.restore();
      x.drawImage(renderer.domElement, 0, 0);
      out.push(c.toDataURL('image/png'));
      scene.remove(g);
      g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    });
    renderer.dispose();
    return out;
  };
})(this);
