import 'ol/ol.css';
import './style.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import { OSM, TileWMS } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { LOCATION, panToLoc, trackLocation } from './location';
import { Draw, Modify, Snap } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import {defaults as defaultControls} from 'ol/control.js';
import { draw_sights_Layer, sightsLayer } from './sights';
import { bufferLayer, draw_hochsitz_Layer, seatsLayer } from './hochsitze';
import { areaLayer, draw_area_Layer } from './area';
import { draw_wechsel_layer, pathsLayer } from './wildwechsel';
import { get_light } from './licht';


bufferLayer.setZIndex(1);
areaLayer.setZIndex(2);
sightsLayer.setZIndex(3);
seatsLayer.setZIndex(4);
LOCATION.setZIndex(5);
draw_sights_Layer.setZIndex(6);
draw_hochsitz_Layer.setZIndex(7);
draw_area_Layer.setZIndex(8);
export const map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
        visible: true
      }),
      new TileLayer({
        source: new TileWMS({
          url: 'https://sgx.geodatenzentrum.de/wms_sentinel2_de',
          params: {
            'LAYERS': 'rgb_2019', 
            'FORMAT': 'image/png', 
            'TRANSPARENT': false
          },
          serverType: 'geoserver',
        }),
        visible: false
      })
    ],
    controls: defaultControls({ zoom: false }).extend([new panToLoc()]), // zoom buttons entfernen, nur location button anzeigen
    target: 'map',
    view: new View({
      center: fromLonLat([10.0049, 53.54025]),
      zoom: 19
    })
  });
  get_light();
  map.addLayer(areaLayer)
  map.addLayer(bufferLayer) 
  map.addLayer(pathsLayer)
  map.addLayer(sightsLayer)
  map.addLayer(seatsLayer)
  map.addLayer(LOCATION)
  map.addLayer(draw_sights_Layer)
  map.addLayer(draw_hochsitz_Layer)
  map.addLayer(draw_area_Layer)
  map.addLayer(draw_wechsel_layer)
trackLocation();