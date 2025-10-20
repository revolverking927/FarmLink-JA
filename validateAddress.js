// server/routes/verify-address.js  (or in server.js)
const axios = require('axios');
const express = require('express');
const router = express.Router();

/**
 * Normalize strings for comparison
 */
function normalize(s = '') {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check whether candidateName matches one of expected names (fuzzy, normalized)
 */
function matches(expected, candidate) {
  if (!candidate) return false;
  const e = normalize(expected);
  const c = normalize(candidate);
  if (!e || !c) return false;
  // exact normalized match OR candidate contains expected OR expected contains candidate
  return c === e || c.includes(e) || e.includes(c);
}

/**
 * /verify-address
 * Body: { street, city, parish, country }  (country optional, default "Jamaica")
 */
router.post('/verify-address', async (req, res) => {
  try {
    const { street = '', city = '', parish = '', country = 'Jamaica' } = req.body || {};
    if (!street && !city && !parish) {
      return res.status(400).json({ valid: false, message: 'Provide at least street, city or parish' });
    }

    const q = [street, city, parish, country].filter(Boolean).join(', ');

    // --- Nominatim forward geocode ---
    // See usage policy: https://operations.osmfoundation.org/policies/nominatim/
    // Use a custom user-agent & email as required by policy.
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    const nominatimParams = {
      q,
      format: 'json',
      addressdetails: 1,
      limit: 5,
      countrycodes: 'jm' // optional: restrict to Jamaica (jm)
    };

    const nomRes = await axios.get(nominatimUrl, {
      params: nominatimParams,
      headers: {
        'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
      },
      timeout: 8000
    });

    const results = nomRes.data || [];

    if (!results.length) {
      // Optional fallback: try OpenCage if you have API key (uncomment below)
      // return res.json({ valid: false, message: 'Address not found' });
    } else {
      // Inspect top result (best match) and also try to find a result inside Jamaica
      let best = results[0];
      // prefer a result whose address.country_code == 'jm'
      const jmCandidate = results.find(r => r.address && (r.address.country_code === 'jm' || normalize(r.address.country) === 'jamaica'));
      if (jmCandidate) best = jmCandidate;

      const addr = best.address || {};
      const formatted = best.display_name;
      const lat = parseFloat(best.lat);
      const lon = parseFloat(best.lon);

      // Check country is Jamaica
      const countryMatches = addr.country && normalize(addr.country) === 'jamaica';
      if (!countryMatches) {
        // Not Jamaica -> invalid for your use case
        return res.json({ valid: false, reason: 'Not in Jamaica', found: formatted, location: { lat, lon }, address: addr });
      }

      // Now check parish (ADM1) — GeoBoundaries uses 'state' or 'county' fields sometimes.
      // Try common properties: county, state, state_district, region, parish
      const parishCandidates = [
        addr.county,
        addr.state,
        addr.region,
        addr.state_district,
        addr.parish,
        addr.suburb // sometimes smaller unit
      ].filter(Boolean);

      // city candidates
      const cityCandidates = [
        addr.city,
        addr.town,
        addr.village,
        addr.hamlet,
        addr.suburb,
        addr.locality
      ].filter(Boolean);

      // If user provided parish, require match
      let parishOk = true;
      if (parish) {
        parishOk = parishCandidates.some(p => matches(parish, p));
      }

      // If user provided city, require match
      let cityOk = true;
      if (city) {
        cityOk = cityCandidates.some(c => matches(city, c));
      }

      // Final decision
      const valid = parishOk && cityOk;

      return res.json({
        valid,
        reason: valid ? 'ok' : 'mismatch',
        requested: { street, city, parish, country },
        found: { formatted, lat, lon, address: addr, raw: best },
        checks: { parishOk, cityOk, parishCandidates, cityCandidates }
      });
    }

    // --- Optional OpenCage fallback (uncomment if you have key) ---
    // Example:
    // const OPENCAGE_KEY = process.env.OPENCAGE_KEY;
    // if (OPENCAGE_KEY) {
    //   const oc = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
    //     params: { q, key: OPENCAGE_KEY, countrycode: 'jm', limit: 5 }
    //   });
    //   // ...apply similar checking logic as above
    // }

    // If we reach here, no match
    return res.json({ valid: false, message: 'Address not validated (no results)' });
  } catch (err) {
    console.error('verify-address error:', err.message || err);
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
});

module.exports = router;
