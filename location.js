import Group from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { Fill, Icon, Stroke, Text } from 'ol/style';
import { Circle as CircleStyle} from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Control, defaults as defaultControls} from 'ol/control.js';
import { map } from './map';
import { get_light } from './licht';


export const LOCATION = new Group({
    id: 'location',
    title: 'Standort',
    layers: [
        new VectorLayer({
            id: 'location',
            title: 'Location',
            visible: true,
            source: new VectorSource(),
            style: new Style({
              image: new CircleStyle({
                  radius: 6,
                  fill: new Fill({color: '#FF00FF'}),
                  stroke: new Stroke({
                      color: 'white', 
                      width: 2
                  })
              })
          })
          }),
    ]
});

// Location 
export function trackLocation() {
    const locationLayer = LOCATION.getLayers().getArray().find(layer => layer.get('id') === 'location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lon = position.coords.longitude;
            const lat = position.coords.latitude;
            const pos = fromLonLat([lon, lat]);
  
            const pointFeature = new Feature({
                geometry: new Point(pos),
            });
            locationLayer.getSource().clear();
            locationLayer.getSource().addFeature(pointFeature);
            get_light();
        }, function(error) {
            alert('Error occurred: ' + error.message);
        }, {
            enableHighAccuracy: true
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}


 let intervalld = setInterval(trackLocation, 1000000)
 export class panToLoc extends Control {
    /**
     * @param {Object} [opt_options] Control options.
     */
    constructor(opt_options) {
      const options = opt_options || {};
  
      const locbutton = document.createElement('locbutton');
      locbutton.innerHTML = '<img src="./images/pin.png" style="width: 25px;">';
      locbutton.style = "position: absolute;z-index:15; right:10px; top: 20px width:35px; padding: 5px;background:#006c2d; border-radius: 15px;"
  
      const locelement = document.createElement('div');
      locelement.appendChild(locbutton);
      super({
        element: locelement,
        target: options.target,
      });
      locbutton.addEventListener('click', this.handlepanToLoc.bind(this), false);
    }
    handlepanToLoc() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lon = position.coords.longitude;
                const lat = position.coords.latitude;
                const pos = fromLonLat([lon, lat]);
        map.getView().setCenter(pos)
        map.getView().setZoom(17)
            }
            )}
    }
}

document.addEventListener("DOMContentLoaded", function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lon = position.coords.longitude;
            const lat = position.coords.latitude;
            const pos = fromLonLat([lon, lat]);
    map.getView().setCenter(pos)
        }
        )}
  });

