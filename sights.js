import { map } from "./map";

import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from 'ol/style';
import { Draw, Modify, Snap } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import {Cluster} from 'ol/source';
import { v4 as uuidv4 } from 'uuid';
import { Circle } from "ol/geom";

const source = new VectorSource();
export const draw_sights_Layer = new VectorLayer({
  title: "Temp_Sights",
source: source,
    style: new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new Stroke({
        color: '#ffcc33',
        width: 2
    }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({
        color: '#ffcc33'
        }),
        stroke: new Stroke({
        color: '#f39c12',
        width: 1
        })
    })
    })
})

let draw = null, snap = null;

function addInteractions() {
  if (draw || snap) return;

  draw = new Draw({
    source: source,
    type: "Point"
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
    let content = '<form id="point-form"><label for="point-art">Wildart: </label><select id="point-art"><option value="Reh">Reh</option><option value="Schwarz">Schwarzwild</option><option value="Rot">Rotwild</option><option value="Damm">Dammwild</option></select><button type="submit">Save Point</button></form>'
    popup.innerHTML = content;
    let form = document.getElementById('point-form');
    
    form.onsubmit = function (e) {
      e.preventDefault();
      removeInteractions();
      console.log("interactions removed")
      document.getElementById('edit').classList.remove('active');
      let art = document.getElementById('point-art').value;
      feature.set('art', art);
      feature.setId(uuidv4());
      popup.style.display = 'none';
      saveFeature(feature);
      document.getElementById('point-art').value = '';
    };
  });
}

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

document.getElementById('edit').addEventListener('click', function () {
  if (!this.classList.contains('active')) {
    this.classList.add('active');
    addInteractions();
    console.log(draw)
  } else {
    this.classList.remove('active');
    removeInteractions();
  }
});
const toggle = document.getElementById('toggleSidebar').addEventListener('click', removeInteractions)


function saveFeature(feature) {
  const formatGeoJSON = new GeoJSON();
  const featureGeoJSON = formatGeoJSON.writeFeature(feature, {
    dataProjection: 'EPSG4326',
    featureProjection: 'EPSG:3857'
  });
  const data = JSON.parse(featureGeoJSON);
  fetch('http://localhost:8083/create-sights', {
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



function refresh_sights(){
const sight_source = new VectorSource({
  loader: function(extent, resolution, projection) {
    fetch('http://localhost:8083/get_sights')
      .then(response => response.json())
      .then(data => {

        data.features.forEach(item => {
          const coordinates = item.geometry.coordinates;
          const feature = new Feature({
            geometry: new Point(coordinates),
            art: item.properties.art,
            uuid: item.properties.uuid
          });
          feature.setId(item.properties.uuid);
          sight_source.addFeature(feature);
        });
      })
      .catch(error => {
        console.error("Error loading features:", error);
      });
  }
});
return sight_source
}
const artStyles = {
  'Reh': new Style({
    image: new Icon({
      src: 'images/deer-shape.png',
      scale: 0.1 // initial scale
    })
  }),
  'Rot': new Style({
    image: new Icon({
      src: 'images/trophy.png',
      scale: 0.1
    })
  }),
  'Schwarz': new Style({
    image: new Icon({
      src: 'images/wild-pig.png',
      scale: 0.1
    })
  }),
  'Damm': new Style({
    image: new Icon({
      src: 'images/mammal.png',
      scale: 0.1
    })
  })
};

function getIconStyle(feature, resolution) {
  const art = feature.get('art');
  const style = artStyles[art];

  if (style) {
    const baseScale = 0.08; 
    const adjustedScale = baseScale / resolution;
    const maxScale = 0.1;

    style.getImage().setScale(Math.min(adjustedScale, maxScale));
  }

  return style || new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: 'navy'
      }),
      stroke: new Stroke({
        color: 'white',
        width: 1
      })
    })
  });
}

export const sightsLayer = new VectorLayer({
  title: "Sights",
  source: refresh_sights(),
  style: function (feature, resolution) {
    return getIconStyle(feature, resolution);
  }
});