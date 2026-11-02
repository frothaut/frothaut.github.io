(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- Cursor-Position (geglättet) ---------- */
  var W = window.innerWidth, H = window.innerHeight;
  var mouse = { x: W * 0.5, y: H * 0.4, vx: 0, vy: 0, active: false, last: 0 };
  var smooth = { x: mouse.x, y: mouse.y };

  window.addEventListener('pointermove', function (e) {
    mouse.vx = e.clientX - mouse.x;
    mouse.vy = e.clientY - mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    mouse.last = performance.now();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.active = false; });

  /* ---------- Partikelfeld ---------- */
  var canvas = document.getElementById('field');
  var ctx = canvas.getContext('2d');
  var dpr = 1, pts = [], waves = [];
  var GAP = 24;

  function build() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    GAP = W < 760 ? 20 : 24;
    pts = [];
    var cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1;
    var ox = (W - (cols - 1) * GAP) / 2, oy = (H - (rows - 1) * GAP) / 2;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var x = ox + i * GAP, y = oy + j * GAP;
        pts.push({ bx: x, by: y, x: x, y: y, vx: 0, vy: 0, seed: Math.random() * 6.28 });
      }
    }
  }

  // Farbe zwischen Pink (#FF3D7F) und Orange (#FF9F40) bzw. Violett bei starker Auslenkung
  function color(t, a) {
    t = Math.min(1, t);
    var r, g, b;
    if (t < 0.5) { var k = t * 2; r = 255; g = 159 + (61 - 159) * k; b = 64 + (127 - 64) * k; }
    else { var k2 = (t - 0.5) * 2; r = 255 + (122 - 255) * k2; g = 61 + (108 - 61) * k2; b = 127 + (255 - 127) * k2; }
    return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a.toFixed(3) + ')';
  }

  // Klick / Tippen: Schockwelle
  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a,button')) return;
    waves.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 });
  });

  var t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000;

    // Ohne Maus wandert ein "Geist" über die Seite
    var idle = !mouse.active || now - mouse.last > 2500;
    var tx = mouse.x, ty = mouse.y;
    if (idle) {
      tx = W * (0.5 + 0.34 * Math.sin(t * 0.33) * Math.cos(t * 0.11));
      ty = H * (0.5 + 0.30 * Math.sin(t * 0.21 + 1.3));
    }
    smooth.x += (tx - smooth.x) * (idle ? 0.03 : 0.18);
    smooth.y += (ty - smooth.y) * (idle ? 0.03 : 0.18);
    body.style.setProperty('--mx', smooth.x + 'px');
    body.style.setProperty('--my', smooth.y + 'px');

    // Geschwindigkeit des Cursors verstärkt den Wirbel
    var speed = Math.min(60, Math.hypot(mouse.vx, mouse.vy));
    mouse.vx *= 0.9; mouse.vy *= 0.9;
    var R = (idle ? 150 : 190) + speed * 2.2;
    var R2 = R * R;
    var power = idle ? 0.55 : 1 + speed * 0.04;

    for (var w = waves.length - 1; w >= 0; w--) {
      waves[w].r += 14; waves[w].life -= 0.016;
      if (waves[w].life <= 0) waves.splice(w, 1);
    }

    ctx.clearRect(0, 0, W, H);

    // Erst die ruhigen Punkte in einem Rutsch
    ctx.fillStyle = 'rgba(255,240,230,0.09)';
    var hot = [];
    for (var p = 0; p < pts.length; p++) {
      var q = pts[p];
      var dx = q.x - smooth.x, dy = q.y - smooth.y;
      var d2 = dx * dx + dy * dy;

      if (d2 < R2) {
        var d = Math.sqrt(d2) || 1;
        var f = (1 - d / R);
        f = f * f * power;
        // Abstoßen + Wirbel (tangential)
        q.vx += (dx / d) * f * 2.2 + (-dy / d) * f * 3.4;
        q.vy += (dy / d) * f * 2.2 + (dx / d) * f * 3.4;
      }

      for (var k = 0; k < waves.length; k++) {
        var wv = waves[k];
        var wx = q.x - wv.x, wy = q.y - wv.y;
        var wd = Math.sqrt(wx * wx + wy * wy) || 1;
        var band = Math.abs(wd - wv.r);
        if (band < 40) {
          var wf = (1 - band / 40) * wv.life * 4;
          q.vx += (wx / wd) * wf; q.vy += (wy / wd) * wf;
        }
      }

      // Leichtes Atmen in Ruhe
      var ax = q.bx + Math.sin(t * 0.8 + q.seed) * 1.2;
      var ay = q.by + Math.cos(t * 0.7 + q.seed) * 1.2;
      q.vx += (ax - q.x) * 0.045;
      q.vy += (ay - q.y) * 0.045;
      q.vx *= 0.86; q.vy *= 0.86;
      q.x += q.vx; q.y += q.vy;

      var off = Math.abs(q.x - q.bx) + Math.abs(q.y - q.by);
      if (off > 3) hot.push(q, off);
      else ctx.fillRect(q.x - 0.75, q.y - 0.75, 1.5, 1.5);
    }

    // Dann die ausgelenkten Punkte: farbig, größer, mit Schweif
    ctx.lineCap = 'round';
    for (var h = 0; h < hot.length; h += 2) {
      var hp = hot[h], o = hot[h + 1];
      var n = Math.min(1, o / 60);
      var c = color(n, 0.25 + n * 0.75);
      ctx.strokeStyle = c;
      ctx.lineWidth = 1 + n * 1.8;
      ctx.beginPath();
      ctx.moveTo(hp.x - hp.vx * 3, hp.y - hp.vy * 3);
      ctx.lineTo(hp.x, hp.y);
      ctx.stroke();
      if (n > 0.55) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 1 + n * 1.6, 0, 6.283);
        ctx.fill();
      }
    }

    // Feine Verbindungslinien zwischen stark ausgelenkten Nachbarn
    ctx.lineWidth = 0.6;
    for (var a = 0; a < hot.length && a < 400; a += 2) {
      if (hot[a + 1] < 25) continue;
      for (var b = a + 2; b < hot.length && b < a + 40; b += 2) {
        if (hot[b + 1] < 25) continue;
        var lx = hot[a].x - hot[b].x, ly = hot[a].y - hot[b].y;
        var ld = lx * lx + ly * ly;
        if (ld < 900) {
          ctx.strokeStyle = 'rgba(255,140,110,' + (0.35 * (1 - ld / 900)).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(hot[a].x, hot[a].y);
          ctx.lineTo(hot[b].x, hot[b].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  build();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 120); });

  if (reduce) {
    ctx.fillStyle = 'rgba(255,240,230,0.09)';
    pts.forEach(function (q) { ctx.fillRect(q.x - 0.75, q.y - 0.75, 1.5, 1.5); });
    window.addEventListener('pointermove', function () {
      body.style.setProperty('--mx', mouse.x + 'px');
      body.style.setProperty('--my', mouse.y + 'px');
    }, { passive: true });
  } else {
    requestAnimationFrame(frame);
  }

  /* ---------- Text entschlüsseln ---------- */
  var GLYPHS = '!<>-_\\/[]{}—=+*^?#░▒▓█01';
  function scramble(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      if (n.parentNode.classList && n.parentNode.classList.contains('caret')) continue;
      if (n._orig == null) n._orig = n.nodeValue;
      nodes.push(n);
    }
    var start = performance.now(), dur = 1100;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur);
      nodes.forEach(function (node) {
        var s = node._orig, out = '';
        for (var i = 0; i < s.length; i++) {
          var reveal = (i / s.length) * 0.7 + 0.3;
          if (s[i] === ' ' || p >= reveal) out += s[i];
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        node.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  function runScramble() {
    if (reduce) return;
    document.querySelectorAll('.scramble').forEach(scramble);
  }
  runScramble();
  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', runScramble);
  });

  /* ---------- Kacheln kippen + Spiegelung ---------- */
  document.querySelectorAll('.tile').forEach(function (tile) {
    tile.addEventListener('pointermove', function (e) {
      if (reduce || e.pointerType === 'touch') return;
      var r = tile.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tile.classList.add('hot');
      tile.style.setProperty('--ry', ((px - 0.5) * 28).toFixed(2) + 'deg');
      tile.style.setProperty('--rx', ((0.5 - py) * 28).toFixed(2) + 'deg');
      tile.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      tile.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    });
    tile.addEventListener('pointerleave', function () {
      tile.classList.remove('hot');
      tile.style.setProperty('--rx', '0deg');
      tile.style.setProperty('--ry', '0deg');
    });
  });
})();
