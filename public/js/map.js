import checkUser from "./helpers/user-log.js";

let adm1Layer, adm3Layer, townLayer;
let map;
let currentParish = null;

(async () => {
  const user = await checkUser();
  if (user === null) throw new Error("Invalid user");

  // Initialize map
  map = L.map("map").setView([18.1096, -77.2975], 8);

  // Base gray map
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; CARTO",
    maxZoom: 19,
  }).addTo(map);

  await loadParishes(map);

  map.on("zoomend", updateTownVisibility);
})();

function styleParish(feature) {
  return { color: "#666", weight: 1, fillColor: "#ccc", fillOpacity: 0.6 };
}

function highlightParish(layer) {
  layer.setStyle({ fillColor: "#fff", color: "#000", weight: 2 });
}

function resetParish(layer) {
  layer.setStyle(styleParish(layer.feature));
}

async function loadParishes(map) {
  const res = await fetch("/data/geoBoundaries-JAM-ADM1.geojson");
  const data = await res.json();

  adm1Layer = L.geoJSON(data, {
    style: styleParish,
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`<b>${feature.properties.shapeName}</b>`);

      layer.on({
        mouseover: () => highlightParish(layer),
        mouseout: () => {
          if (currentParish !== layer) resetParish(layer);
        },
        click: async () => {
          currentParish = layer;
          map.fitBounds(layer.getBounds());
          highlightParish(layer);

          // Remove existing town/city layer before adding new one
          if (adm3Layer) map.removeLayer(adm3Layer);

          // Load ADM3 and filter by clicked parish
          await loadTownsForParish(layer.feature.properties.shapeName);
        },
      });
    },
  }).addTo(map);
}

async function loadTownsForParish(parishName) {
  const res = await fetch("/data/geoBoundaries-JAM-ADM3.geojson");
  const data = await res.json();

  // Filter towns that belong to the clicked parish
  const filtered = {
    type: "FeatureCollection",
    features: data.features.filter(
      (f) =>
        f.properties.shapeGroup &&
        f.properties.shapeGroup.toLowerCase().includes(parishName.toLowerCase())
    ),
  };

  adm3Layer = L.geoJSON(filtered, {
    style: {
      color: "#444",
      weight: 1,
      fillColor: "#888",
      fillOpacity: 0.6,
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`<b>${feature.properties.shapeName}</b>`);
    },
  }).addTo(map);
}

function updateTownVisibility() {
  const zoom = map.getZoom();
  if (adm3Layer) {
    adm3Layer.eachLayer((layer) => {
      layer.setStyle({
        opacity: zoom >= 11 ? 1 : 0,
        fillOpacity: zoom >= 11 ? 0.7 : 0,
      });
    });
  }
}
