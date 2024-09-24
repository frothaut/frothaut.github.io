import { Feature } from "ol";
import { LineString } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Stroke, Style } from "ol/style";
import { map } from "./map";
let btn = document.getElementById("rtbtn")
const routeSource = new VectorSource();
const routeLayer = new VectorLayer({
    source: routeSource,
    style: new Style({
        stroke: new Stroke({
            width: 6, color: [40, 40, 40, 0.8]
        })
    })
});
map.addLayer(routeLayer);

async function fetchRoute(start, end) {
    const apiKey = '5b3ce3597851110001cf6248051ee924d9094ce18b2db74b940464c1'; 
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start.join(',')}&end=${end.join(',')}`;

    try {
        const response = await fetch(url);
        const json = await response.json();
        console.log(json);
        return json.features[0].geometry.coordinates;
    } catch (error) {
        console.error('Error fetching the route:', error);
    }
}

function displayRoute(coordinates) {
    routeSource.clear(); 
    const route = new LineString(coordinates).transform('EPSG:4326', 'EPSG:3857');
    const routeFeature = new Feature({
        geometry: route,
        name: 'Route'
    });
    routeSource.addFeature(routeFeature); 
    map.removeLayer(routeLayer)
    map.addLayer(routeLayer)
}

export function getRoute(point2){
    navigator.geolocation.getCurrentPosition(function(position) {
        const point1 = [position.coords.longitude, position.coords.latitude];
        fetchRoute(point1, point2)
            .then(coordinates => displayRoute(coordinates))
            .catch(error => console.error('Failed to display the route:', error));
    });
    btn.style.display = 'block';
    btn.onclick = function() {
        map.removeLayer(routeLayer)
        btn.style.display = "none";
      };
}
