const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

//const __dirname = path.resolve();
const adm1Path = path.join("public", "data", "geoBoundaries-JAM-ADM1.geojson");
const adm3Path = path.join("public", "data", "geoBoundaries-JAM-ADM3.geojson");
const outputPath = path.join("public", "data", "geoBoundaries-JAM-ADM3-tagged.geojson");

console.log("🗺️  Adding parish names to ADM3 features...");

const adm1Data = JSON.parse(fs.readFileSync(adm1Path, "utf8"));
const adm3Data = JSON.parse(fs.readFileSync(adm3Path, "utf8"));

let matched = 0;
let unmatched = 0;

adm3Data.features.forEach((town) => {
  const townPoint = turf.center(town); // use center for accuracy

  // find which parish contains it
  const parish = adm1Data.features.find((p) =>
    turf.booleanPointInPolygon(townPoint, p)
  );

  if (parish) {
    town.properties.parish = parish.properties.shapeName;
    matched++;
  } else {
    unmatched++;
    town.properties.parish = "Unknown";
  }
});

fs.writeFileSync(outputPath, JSON.stringify(adm3Data, null, 2));

console.log(`✅ Done! ${matched} features matched, ${unmatched} unmatched.`);
console.log(`📁 Saved as: ${outputPath}`);
