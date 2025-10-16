export const jamaicaGeo = {
  "type": "FeatureCollection",
  "features": [
    // Parishes (polygons)
    {
      "type": "Feature",
      "properties": {
        "type": "parish",
        "name": "Kingston"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-76.85, 17.95],
            [-76.75, 17.95],
            [-76.75, 18.05],
            [-76.85, 18.05],
            [-76.85, 17.95]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "type": "parish",
        "name": "Saint Andrew"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-76.90, 17.90],
            [-76.70, 17.90],
            [-76.70, 18.10],
            [-76.90, 18.10],
            [-76.90, 17.90]
          ]
        ]
      }
    },
    // Town / City points
    {
      "type": "Feature",
      "properties": {
        "type": "town",
        "name": "Kingston"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-76.7936, 17.9714]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "type": "town",
        "name": "Montego Bay"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-77.9188, 18.4712]
      }
    }
    // ... add more parishes, more towns
  ]
};
