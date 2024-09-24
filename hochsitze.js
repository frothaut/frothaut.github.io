import { map } from "./map";

import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import {Circle as CircleGeom} from 'ol/geom'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Draw, Modify, Snap } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import { v4 as uuidv4 } from 'uuid';

const save = document.getElementById("save3");
const geom = document.getElementById("geom");
const edit = document.getElementById("edit3");
const nameTag = document.getElementById("nameTag")
const source = new VectorSource();
export const draw_hochsitz_Layer = new VectorLayer({
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


let draw, snap;
function addInteractions() {
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
    popup.style.top = (coord[1] - 30) + 'px'; // Adjusted to not overlap the cursor
    let content = '<form id="point-name"><label for="name-input">Name: </label><input type="text" id="name-input"></input><button type="submit">Save Point</button></form>'
    popup.innerHTML = content;
    let form = document.getElementById('point-name');
    
    form.onsubmit = function (e) {
      e.preventDefault();
      let name = document.getElementById('name-input').value;
      console.log(name)
      feature.set('nametag', name);
      feature.setId(uuidv4());
      feature.set('seated', false);
      popup.style.display = 'none';
      saveFeature(feature);
      document.getElementById('name-input').value = '';
      map.removeLayer(seatsLayer)
      map.addLayer(seatsLayer)
      map.removeLayer(draw_hochsitz_Layer)
    };
  });
}

function removeInteractions() {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
}
document.getElementById('edit3').addEventListener('click', function () {
  if (!this.classList.contains('active')) {
    this.classList.add('active');
    addInteractions();
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
  console.log(feature.get('nametag'))
  const data = JSON.parse(featureGeoJSON);
  fetch("http://localhost:8083/create-seat", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uuid: feature.getId(),
      geometry: data.geometry,
      nametag: feature.get('nametag'),
      seated: feature.get('seated')
    })
  }).then(response => response.json())
    .then(data => console.log("Success:", data))
    .catch(error => console.error("Error:", error));
    removeInteractions();
    map.removeLayer(seatsLayer)
    map.addLayer(seatsLayer)
}



function get_seats() {
  const seat_source = new VectorSource();
  const buffer_source = new VectorSource();

  fetch('http://localhost:8083/get_seats')
    .then(response => response.json())
    .then(data => {
      data.features.forEach(item => {
        const coordinates = item.geometry.coordinates;
        const feature = new Feature({
          geometry: new Point(coordinates),
          uuid: item.properties.uuid,
          seated: item.properties.seated,
          nametag: item.properties.nametag
        });
        feature.setId(item.properties.uuid);
        seat_source.addFeature(feature);
        ftlist();

        // Add buffer feature if seated is true
        if (item.properties.seated) {
          const bufferFeature = new Feature({
            geometry: new CircleGeom(coordinates, 100), // 100m buffer
            buffer: true,
            uuid: item.properties.uuid + '-buffer'
          });
          buffer_source.addFeature(bufferFeature);
        }
      });
    })
    .catch(error => {
      console.error("Error loading features:", error);
    });
  
  // Observe changes to features
  seat_source.on('changefeature', function(event) {
    const feature = event.feature;
    const seated = feature.get('seated');
    const bufferFeatureId = feature.getId() + '-buffer';
    const bufferFeature = buffer_source.getFeatureById(bufferFeatureId);
  
    console.log("Feature ID:", feature.getId());
    console.log("Buffer Feature ID:", bufferFeatureId);
    console.log("Existing Buffer Feature:", bufferFeature);
  
    if (seated) {
      if (!bufferFeature) {
        const coordinates = feature.getGeometry().getCoordinates();
        const newBufferFeature = new Feature({
          geometry: new CircleGeom(coordinates, 100),
          buffer: true,
          uuid: bufferFeatureId
        });
        newBufferFeature.setId(bufferFeatureId);
        buffer_source.addFeature(newBufferFeature);
        console.log("Buffer Feature Created:", bufferFeatureId);
      }
    } else {
      if (bufferFeature) {
        buffer_source.removeFeature(bufferFeature);
        console.log("Buffer Feature Removed:", bufferFeatureId);
      }
    }
  });

  return { seat_source, buffer_source };
}

function bufferStyle(feature) {
  return new Style({
    stroke: new Stroke({
      color: 'rgba(255, 0, 0, 0.5)', // Semi-transparent red
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.2)' // Semi-transparent red
    })
  });
}

function seatStyle(feature) {
  const seated = feature.get('seated');
  const fillColor = seated ? 'red' : 'green';

  return new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: fillColor
      }),
      stroke: new Stroke({
        color: 'white',
        width: 1
      })
    })
  });
}



const sources = get_seats();
export const bufferLayer = new VectorLayer({
  title: "buffers",
  source: sources.buffer_source,
  style: bufferStyle
});

export const seatsLayer = new VectorLayer({
  title: "seats",
  source: sources.seat_source,
  style: seatStyle
});


export function ftlist(){
const featureList = document.getElementById('featureList');
featureList.innerHTML = ""
const features = sources.seat_source.getFeatures();
features.forEach((feature, index) => {
    const listItem = document.createElement('div');
    listItem.className = 'feature-item';
    listItem.textContent = feature.get('nametag');
    listItem.onclick = function() {
        const geometry = feature.getGeometry();
        const duration = 2000; 

        map.getView().animate({
            center: geometry.getCoordinates(),
            duration: 1000
        });

        // Flash feature
        const flashFeature = new Feature({
            geometry: geometry
        });
        const flashStyle = new Style({
            image: new CircleStyle({
                radius: 10,
                fill: new Fill({color: 'red'}),
                stroke: new Stroke({color: 'red', width: 2})
            })
        });
        flashFeature.setStyle(flashStyle);
        const flashLayer = new VectorLayer({
            source: new VectorSource({
                features: [flashFeature]
            }),
            map: map
        });

        setTimeout(() => {
            flashLayer.setSource(null);  // Remove flash feature after duration
        }, duration);
    };
    featureList.appendChild(listItem);
});
}
const listbtn = document.getElementById('toggle-seat-list')
listbtn.addEventListener('click', function () {
  if (featureList.style.display == "block"){
    featureList.style.display = "none"}
  else{
    featureList.style.display = "block"
  }
});
document.addEventListener("DOMContentLoaded", function() {
  ftlist();
});