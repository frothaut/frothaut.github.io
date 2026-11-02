(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var style = document.body.style;

  /* Lichtkegel folgt dem Cursor, leicht verzögert */
  var tx = window.innerWidth / 2, ty = window.innerHeight * 0.3;
  var x = tx, y = ty, running = false;

  function step() {
    x += (tx - x) * 0.14;
    y += (ty - y) * 0.14;
    style.setProperty('--mx', x.toFixed(1) + 'px');
    style.setProperty('--my', y.toFixed(1) + 'px');
    if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(step);
    else running = false;
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    tx = e.clientX; ty = e.clientY;
    if (reduce) { x = tx - 1; y = ty - 1; }
    if (!running) { running = true; requestAnimationFrame(step); }
  }, { passive: true });

  /* Kacheln auf der Startseite kippen leicht */
  if (!reduce) {
    document.querySelectorAll('.tile').forEach(function (tile) {
      tile.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = tile.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        tile.classList.add('hot');
        tile.style.setProperty('--ry', (px * 16).toFixed(2) + 'deg');
        tile.style.setProperty('--rx', (-py * 16).toFixed(2) + 'deg');
      });
      tile.addEventListener('pointerleave', function () {
        tile.classList.remove('hot');
        tile.style.setProperty('--rx', '0deg');
        tile.style.setProperty('--ry', '0deg');
      });
    });
  }
})();
