import { map } from "./map";

import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Draw, Modify, Snap } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import { v4 as uuidv4 } from 'uuid';
import { Polygon } from "ol/geom";
import { getArea } from "ol/extent";

const save = document.getElementById("save4");
const edit = document.getElementById("edit4");

const source = new VectorSource();
export const draw_area_Layer = new VectorLayer({
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

function removeInteractions(){
  map.removeInteraction(draw);
  map.removeInteraction(snap);
}
function addInteractions(){
    // draw interaction aktivieren
    // der geometrie typ
    draw = new Draw({
      source: source,
      type: "Polygon"
    });
    map.addInteraction(draw);
  
    // snap aktivieren
    snap = new Snap({
      source: source
    });
    map.addInteraction(snap);
  }
let editing = false;
edit.addEventListener("click",() => {
    if (editing != true){
        editing = true;
        addInteractions();
    }
    else{
        editing = false;
        removeInteractions();
    }
  })

const toggle = document.getElementById('toggleSidebar').addEventListener('click', removeInteractions)


save.addEventListener("click", ()=>{
    const formatGeoJSON = new GeoJSON();
    //gezeichnete geometrien durchlaufen
    source.forEachFeature( (f) => {
      console.log(f.getGeometry());
      console.log(f.getGeometry().getCoordinates());
      console.log("ID: ", f.getId());
      if (f.getId() == undefined){
        f.setId(uuidv4());
      }
      console.log("ID: ", f.getId());
      const featureGeoJSON = formatGeoJSON.writeFeature(f, {
        dataProjection: "EPSG4326",
        featureProjection: "EPSG:3857",
        decimals: 6
      });
      const featureObj = JSON.parse(featureGeoJSON);
      console.log(featureGeoJSON)
      console.log(featureObj.geometry);
  
  
      const data = {
        "uuid": f.getId(),
        "geometry": featureObj.geometry,
      }
  
      fetch("http://localhost:8083/create-areas", {
        method: 'POST',
        headers: {
          'Content-Type':'application/json; charset=utf-8'
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
    });
  });

function get_areas(){
    const area_source = new VectorSource({
      loader: function(extent, resolution, projection) {
        fetch('http://localhost:8083/get_areas')
          .then(response => response.json())
          .then(data => {
    
            data.features.forEach(item => {
              const coordinates = item.geometry.coordinates;
              const feature = new Feature({
                geometry: new Polygon(coordinates),
                uuid: item.properties.uuid,
              });
              feature.setId(item.properties.uuid);
              area_source.addFeature(feature);
            });
          })
          .catch(error => {
            console.error("Error loading features:", error);
          });
      }}
    )
return area_source};


export const areaLayer = new VectorLayer({
    title: "areas",
    source: get_areas(),
    style: new Style({
        fill: new Fill({
            color: 'rgba(4, 146, 16, 0.2)'
        }),
        stroke: new Stroke({
            color: 'black',
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
