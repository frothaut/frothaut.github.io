import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Draw, Snap } from "ol/interaction";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import LineString from "ol/geom/LineString";
import { map } from "./map";
import { bufferLayer, draw_hochsitz_Layer, seatsLayer } from "./hochsitze";
import { draw_wechsel_layer, pathsLayer } from "./wildwechsel";
import { draw_sights_Layer, sightsLayer } from "./sights";
import { areaLayer, draw_area_Layer } from "./area";
import { remove } from "ol/array";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";

const search_source = new VectorSource();
const draw_search_Layer = new VectorLayer({
  title: "Temp_Search",
  source: search_source,
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
});

let draw, snap, lastPoint;
function removeInteractions(){
  map.removeInteraction(draw);
  map.removeInteraction(snap);
}

function addInteractions(){
  draw = new Draw({
    source: search_source,
    type: "Point"
  });

  draw.on('drawend', function(evt) {
    let point = evt.feature.getGeometry().getCoordinates();
    if (lastPoint) {
      let line = new LineString([lastPoint, point]);
      let feature = new Feature(line);
      search_source.addFeature(feature);
    }
    lastPoint = point;
  });

  map.addInteraction(draw);

  snap = new Snap({
    source: search_source
  });
  map.addInteraction(snap);
}

let editing = false;
edit.addEventListener("click", () => {
  if (!editing){
    editing = true;
    addInteractions();
  }
  else{
    editing = false;
    removeInteractions();
    lastPoint = null;  // Reset last point
  }
});
const btnContent = '<img src="./images/pin.png" style="width: 25px;">';

function activate() {
    map.removeLayer(bufferLayer);
    map.removeLayer(pathsLayer);
    map.removeLayer(sightsLayer);
    map.removeLayer(seatsLayer);
    map.removeLayer(draw_sights_Layer);
    map.removeLayer(draw_hochsitz_Layer);
    map.removeLayer(draw_area_Layer);
    map.removeLayer(draw_wechsel_layer);

    document.getElementById("toggleSidebar").style.display = "none";
    document.getElementById("toggleSight").style.display = "none";
    document.getElementById("toggle-seat-list").style.display = "none";

    map.addLayer(draw_search_Layer);

    const headerElement = document.querySelector('header'); 
    const div = document.createElement('button');
    div.class = "toggle-btn";
    div.id = 'setSearch'; 
    div.innerHTML = btnContent;
    div.style = "right: 40%; background: red; color: white; height: 35px;border: 0; border-radius: 15px;"
    const h1Element = headerElement.querySelector('h1');
    div.innerHTML = btnContent;
    headerElement.insertBefore(div, h1Element);
    document.getElementById('setSearch').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lon = position.coords.longitude;
                const lat = position.coords.latitude;
                var coordinates = [lon, lat]; 
    
                var newPoint = new Feature({
                    geometry: new Point(fromLonLat(coordinates))
                });
            
                search_source.addFeature(newPoint);})}

    });
}

function deactivate() {
    // Remove interactions
    removeInteractions();

    // Add layers back
    map.addLayer(bufferLayer);
    map.addLayer(pathsLayer);
    map.addLayer(sightsLayer);
    map.addLayer(seatsLayer);
    map.addLayer(draw_sights_Layer);
    map.addLayer(draw_hochsitz_Layer);
    map.addLayer(draw_area_Layer);
    map.addLayer(draw_wechsel_layer);

    // Show elements
    document.getElementById("toggleSidebar").style.display = "block";
    document.getElementById("toggleSight").style.display = "block";
    document.getElementById("toggle-seat-list").style.display = "block";
    
    map.removeLayer(draw_search_Layer);

    // Remove the HTML element from the header
    const buttonContainer = document.getElementById('setSearch');
    if (buttonContainer) {
        buttonContainer.parentNode.removeChild(buttonContainer);
    }
}

document.getElementById("toggleSearch").addEventListener("click",function() {
    if (document.getElementById("toggleSight").style.display == "none"){
        deactivate();
    }
    else{
        activate();
    }
});

