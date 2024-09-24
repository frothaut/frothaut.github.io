import { map } from "./map";

import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import { Draw, Modify, Snap } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import { v4 as uuidv4 } from 'uuid';
import { LineString, Point } from "ol/geom";
import { Feature } from "ol";


const source = new VectorSource();
const styleFunction = function (feature, resolution) {
  const geometry = feature.getGeometry();
  const zoom = Math.log2(156543.03392 / resolution);
  const width = Math.max(0.5, zoom); 
  const arrowSize = Math.max(1, zoom); 
  const styles = [
    // Line style
    new Style({
      stroke: new Stroke({
        color: '#c70303',
        width: width / 10, 
      }),
    }),
  ];

  geometry.forEachSegment(function (start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);

    styles.push(
      new Style({
        geometry: new Point(end),
        image: new Icon({
          src: './images/arrow.png',
          anchor: [0.75, 0.5],
          rotateWithView: true,
          rotation: -rotation,
          scale: arrowSize / 500, 
        }),
      }),
    );
  });

  return styles;
};
export const draw_wechsel_layer = new VectorLayer({
    source: source,
    style: styleFunction,
})
const modify = new Modify({
    source: source
})



let draw = null, snap = null;

function addInteractions() {
  if (draw || snap) return;

  draw = new Draw({
    source: source,
    type: "LineString"
  });
  map.addInteraction(draw);
  snap = new Snap({
    source: source
  });
  map.addInteraction(snap);

  draw.on('drawend', function (event) {
    let feature = event.feature;
    let coord = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
    let popup = document.getElementById('popup2-form');
    popup.style.display = 'block';
    popup.style.left = coord[0] + 'px';
    popup.style.top = (coord[1] - 30) + 'px';
    let content = '<form id="path-form"><label for="path-art">Wildart: </label><select id="path-art"><option value="Reh">Reh</option><option value="Schwarz">Schwarzwild</option><option value="Rot">Rotwild</option><option value="Damm">Dammwild</option></select><button type="submit">Save Point</button></form>'
    popup.innerHTML = content;
    let form = document.getElementById('path-form');
    
    form.onsubmit = function (e) {
      e.preventDefault();
      removeInteractions();
      document.getElementById('edit').classList.remove('active');
      let art = document.getElementById('path-art').value;
      feature.set('art', art);
      feature.setId(uuidv4());
      popup.style.display = 'none';
      saveFeature(feature);
      document.getElementById('path-art').value = '';
    };
  });
}
document.getElementById('edit2').addEventListener('click', function () {
  if (!this.classList.contains('active')) {
    this.classList.add('active');
    addInteractions();
    console.log(draw)
  } else {
    this.classList.remove('active');
    removeInteractions();
  }
});
function removeInteractions() {
  if (draw) {
    map.removeInteraction(draw);
    draw = null;
  }
  if (snap) {
    map.removeInteraction(snap);
    snap = null;
  }
}
  const toggle = document.getElementById('toggleSidebar').addEventListener('click', removeInteractions)

  function saveFeature(feature) {
    const formatGeoJSON = new GeoJSON();
    const featureGeoJSON = formatGeoJSON.writeFeature(feature, {
      dataProjection: 'EPSG4326',
      featureProjection: 'EPSG:3857'
    });
    const data = JSON.parse(featureGeoJSON);
    fetch('http://localhost:8083/create-path', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uuid: feature.getId(),
        geometry: data.geometry,
        art: feature.get('art')
      })
    }).then(response => response.json())
      .then(data => console.log("Success:", data))
      .catch(error => console.error("Error:", error));
      removeInteractions();
  }


const path_source = new VectorSource({
    loader: function(extent, resolution, projection) {
    fetch('http://localhost:8083/get_paths')
        .then(response => response.json())
        .then(data => {

        data.features.forEach(item => {
            const coordinates = item.geometry.coordinates;
            const feature = new Feature({
            geometry: new LineString(coordinates),
            uuid: item.properties.uuid
            });
            feature.setId(item.properties.uuid);
            path_source.addFeature(feature);
        });
        })
        .catch(error => {
        console.error("Error loading features:", error);
        });
    }
});

export const pathsLayer = new VectorLayer({
    title: "Paths",
    source: path_source,
    style: styleFunction,
        }
);