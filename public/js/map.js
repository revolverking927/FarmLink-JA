import checkUser from "./helpers/user-log.js";

let map;
let adm1Layer;
let currentParish = null;
let isGray = true;
let markers = [];

(async () => {
  const user = await checkUser();
  if (user === null) throw new Error("Invalid user");

  // Initialize map
  map = L.map("map").setView([18.1096, -77.2975], 8);

  // Start with gray map
  const grayLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; CARTO",
    maxZoom: 19,
  }).addTo(map);

  // Normal map layer (hidden initially)
  const normalLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 19,
  });

  await loadParishes(map);

  // Switch map styles when zoom changes
  map.on("zoomend", () => {
    const zoom = map.getZoom();
    if (zoom >= 10 && isGray) {
      map.removeLayer(grayLayer);
      normalLayer.addTo(map);
      isGray = false;
    } else if (zoom < 10 && !isGray) {
      map.removeLayer(normalLayer);
      grayLayer.addTo(map);
      isGray = true;
    }
  });

  
})();

function styleParish(feature) {
  return {
    color: "#666",
    weight: 1,
    fillColor: "#ccc",
    fillOpacity: 0.6,
  };
}

function highlightParish(layer) {
  layer.setStyle({
    fillColor: "#fff",
    color: "#000",
    weight: 2,
  });
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
        mouseover: () => {
          if (currentParish && currentParish !== layer) {
            resetParish(currentParish);
          }
          highlightParish(layer)
        },
        mouseout: () => {
          if (currentParish !== layer) resetParish(layer);
        },
        click: () => {
          if (currentParish && currentParish !== layer) {
            resetParish(currentParish);
          }

          currentParish = layer;
          map.fitBounds(layer.getBounds());
          highlightParish(layer);
        },
      });
    },
  }).addTo(map);
}



export const plotGoodsOnMap = (goods) => {
    // 1. Remove old markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // 2. Group goods by location
    const grouped = {};
    goods.forEach(good => {
        if (!good.lat || !good.lon) return;

        const key = `${good.lat},${good.lon}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(good);
    });

    // 3. Create markers (one per location)
    Object.keys(grouped).forEach(key => {
        const [lat, lon] = key.split(',').map(Number);
        const goodsAtLocation = grouped[key];

        // Build popup content: multiple goods in one place
        let popupContent = `<div><b>Seller:</b> ${goodsAtLocation[0].firstname} ${goodsAtLocation[0].lastname}<br><br>`;
        popupContent += `<b>Goods sold here:</b><br><ul>`;
        
        goodsAtLocation.forEach(item => {
            popupContent += `
                <li>
                    <b>${item.item_name}</b> - $${item.price}
                    ${item.description ? `<br><i>${item.description}</i>` : ""}
                </li><br>`;
        });

        popupContent += "</ul></div>";

        const marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(popupContent);

        markers.push(marker);
    });
};

export {map};