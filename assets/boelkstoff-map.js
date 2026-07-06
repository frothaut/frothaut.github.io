(function () {
  var statusEl = document.getElementById('map-status');
  var isEn = document.documentElement.classList.contains('lang-en');

  var map = L.map('map', { preferCanvas: true }).setView([51.1657, 10.4515], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var layers = {
    rewe: L.layerGroup().addTo(map),
    edeka: L.layerGroup().addTo(map),
    getraenke: L.layerGroup().addTo(map)
  };

  document.querySelectorAll('.legend button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.dataset.cat;
      var layer = layers[cat];
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
        btn.classList.add('off');
      } else {
        map.addLayer(layer);
        btn.classList.remove('off');
      }
    });
  });

  fetch('assets/data/boelkstoff-standorte.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var bounds = [];
      data.forEach(function (place) {
        if (typeof place.lat !== 'number' || typeof place.lon !== 'number') return;
        var layer = layers[place.category] || layers.getraenke;
        var marker = L.circleMarker([place.lat, place.lon], {
          radius: 5,
          color: place.color,
          fillColor: place.color,
          fillOpacity: 0.85,
          weight: 1
        });
        marker.bindPopup('<b>' + escapeHtml(place.name) + '</b><br>' + escapeHtml(place.address));
        marker.addTo(layer);
        bounds.push([place.lat, place.lon]);
      });
      if (bounds.length) map.fitBounds(bounds, { padding: [20, 20] });
      statusEl.textContent = (isEn ? data.length + ' locations loaded.' : data.length + ' Standorte geladen.');
    })
    .catch(function () {
      statusEl.textContent = isEn
        ? 'Could not load location data.'
        : 'Standortdaten konnten nicht geladen werden.';
    });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
