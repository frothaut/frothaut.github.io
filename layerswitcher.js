
import { areaLayer, draw_area_Layer } from "./area";
import { bufferLayer, draw_hochsitz_Layer, seatsLayer } from "./hochsitze";
import { LOCATION } from "./location";
import { map } from "./map";
import { draw_sights_Layer, sightsLayer } from "./sights";
import { draw_wechsel_layer, pathsLayer } from "./wildwechsel";

// Function to toggle layer visibility
function toggleLayerVisibility(layer, checkbox) {
    layer.setVisible(checkbox.checked);
  }

function buildLayerList() {
    const layers = [
      { name: 'Revierflächen', layer: areaLayer },
      { name: 'Wildwechsel', layer: pathsLayer },
      { name: 'Sichtungen', layer: sightsLayer },
      { name: 'Hochsitze', layer: seatsLayer },

    ];
  
    const layerListDiv = document.getElementById('layerList');
    layerListDiv.innerHTML = '';
    layerListDiv.innerHTML = '<select id="layer-select"><option value="osm">OpenStreetMap</option><option value="wms">Sentinel WMS</option></select>'
  
    layers.forEach(({ name, layer }) => {
      const layerItem = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = layer.getVisible();
  
      checkbox.onchange = () => toggleLayerVisibility(layer, checkbox);
  
      const label = document.createElement('label');
      label.textContent = name;
  
      layerItem.appendChild(checkbox);
      layerItem.appendChild(label);
      layerListDiv.appendChild(layerItem);
    });
  }
  
  document.addEventListener("DOMContentLoaded", function() {
    buildLayerList();
    document.getElementById('layer-select').addEventListener('change', (event) => {
      const selectedLayer = event.target.value;
      toggleLayers(selectedLayer);
    });
  });
  
  document.getElementById('toggleLayerButton').addEventListener('click', () => {
    const layerListDiv = document.getElementById('layerList');
    if (layerListDiv.style.display === 'none') {
      layerListDiv.style.display = 'block';
    } else {
      layerListDiv.style.display = 'none';
    }
  });
  function toggleLayers(layer) {
    const osmLayer = map.getLayers().item(0); // OSM layer
    const wmsLayer = map.getLayers().item(1); // WMS layer
    if (layer === 'osm') {
      osmLayer.setVisible(true);
      wmsLayer.setVisible(false);
    } else if (layer === 'wms') {
      osmLayer.setVisible(false);
      wmsLayer.setVisible(true);
    }
  }
    