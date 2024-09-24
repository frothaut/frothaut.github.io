import { bufferLayer, ftlist, seatsLayer } from "./hochsitze";
import { map } from "./map";
import { Overlay } from "ol";
import { sightsLayer } from "./sights";
import { areaLayer } from "./area";
import { pathsLayer } from "./wildwechsel";
import { getRoute } from "./route";
var container = document.getElementById('popup');
var content = document.getElementById('popup-form');

// ändern, dass nur für bestimmte layer
// andere texte für andere layer
var seatsOverlay = new Overlay({
  element: document.createElement('div'),
  positioning: 'bottom-center',
  offset: [0, -10]
});

var layerlist = [seatsLayer, sightsLayer, areaLayer, pathsLayer];
map.addOverlay(seatsOverlay);

map.on('singleclick', function(event) {
  map.forEachFeatureAtPixel(event.pixel, function(feature, layer) {
    if (layerlist.includes(layer)) {
      if (feature.get('buffer')) {
        return;
      }
      var coord = event.coordinate;
      var content = '';
      if (layer === seatsLayer) {
        var seated = feature.get('seated');
        var seat_txt = seated ? "Besetzt" : "Frei";
        var name = feature.get('nametag')
        var geometry = feature.getGeometry();
        content = `<div style="min-width: 200px; background: white;">
                      <h3>${seat_txt}</h3>
                      <button id="routebtn">Route</button>
                      <div>${name}</div>
                      <select id="use-form">
                        <option value="null"><Auswählen></option>
                        <option value="false">Frei</option>
                        <option value="true">Besetzt</option>
                      </select>
                      <button id="savebtn">Speichern</button>
                      <button id="delbtn">Löschen</button>
                   </div>`;
      } else if (layer === sightsLayer) {
        var art = feature.get('art');

        content = `<div style="min-width: 200px; background: white;">
                      <h3>${art}wild</h3>
                      <button id="delbtn">Löschen</button>
                   </div>`;
      } else if (layer == pathsLayer){
        content = `<div style="min-width: 100px; padding: 15px; background: white;">
                      <h3>Wildwechsel</h3>
                      <button id="delbtn">Löschen</button>
                   </div>`;
      }else if (layer === areaLayer) {
        var id = feature.get('uuid');
        var geometry = feature.getGeometry();
        var area = geometry.getArea();
        var areaInSqKm = area/30000; //erklärung finden warum faktor 3000
        content = `<div style="min-width: 200px; background: white;">
                      <h3>${id}</h3>
                      <div>${areaInSqKm.toFixed(2)} ha</div>
                      <button id="savebtn">Speichern</button>
                      <button id="delbtn">Löschen</button>
                   </div>`;
      }
      

      seatsOverlay.getElement().innerHTML = content;
      seatsOverlay.setPosition(coord);
      if (layer === seatsLayer){
      document.getElementById('routebtn').onclick = function() {
        const R = 6378137;
        let longitude = (geometry.getCoordinates()[0]/R) * (180 / Math.PI);
        let latitude = (Math.PI / 2-2 * Math.atan(Math.exp(-geometry.getCoordinates()[1] / R))) * (180 / Math.PI);
        let lonLat = [longitude, latitude]  
        getRoute(lonLat)
      };}
      if(document.getElementById('savebtn')){
      document.getElementById('savebtn').onclick = function() {
        saveSeats(feature, layer);
        seatsOverlay.setPosition(undefined);
      };}
      document.getElementById('delbtn').onclick = function() {
        deleteFeature(feature);
        seatsOverlay.setPosition(undefined);
      };

      if (layer === seatsLayer) {
        document.getElementById('use-form').onchange = function() {
          var use = document.getElementById('use-form');
          feature.set('seated', use.value === 'true');
        };
      }
      return true;
    }
  }, { hitTolerance: 5 });
});


map.on('click', function(e) {
if (!map.hasFeatureAtPixel(e.pixel)) {
    seatsOverlay.setPosition(undefined); 
}
});

function saveSeats(feature, layer){
    console.log(feature.get('geometry'))
    const data = {
        "uuid": feature.get('uuid'),
        "seated": feature.get('seated')
    };
    console.log(data)
    // API endpoint for updating the database
    const apiEndpoint = 'http://localhost:8083/update_seat';

    fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type':'application/json; charset=utf-8',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      console.log("Success: ", data);
    })
    .catch( (error) => {
      console.error("Error:", error)
    })
    map.removeLayer(bufferLayer)
    map.removeLayer(layer);
    map.addLayer(bufferLayer)
    map.addLayer(layer);
}

function deleteFeature(feature) {
    const uuid = feature.getId();
    if (feature.get('nametag')){
      var layer = seatsLayer
    }else if (feature.get('art')){
      var layer = sightsLayer
    }else if(feature.getGeometry().getType() === 'Polygon'){
      var layer = areaLayer
    }else{
      var layer = pathsLayer
    }
    let title = layer.get('title')
    const apiEndpoint = 'http://localhost:8083/delete_seat'; 
    fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: uuid, title: title }) 
    })
    .then(response => {
        if (response.ok) {
            console.log("Feature deleted successfully");
            alert("Feature deletion successful!");
            
            var source = layer.getSource(); 
            source.removeFeature(feature);
            seatsOverlay.setPosition(undefined); 
        } else {
            throw new Error('Failed to delete the feature');
        }
    })
    .catch(error => {
        console.error("Error deleting feature:", error);
        alert("Feature deletion failed.");
    });
    map.removeLayer(bufferLayer);
    map.addLayer(bufferLayer); 
}