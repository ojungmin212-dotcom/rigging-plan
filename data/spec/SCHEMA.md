# Crane JSON schema (data/cranes/<id>.json)

Accuracy is safety-critical: NEVER invent, estimate, or recall numbers from memory. Every number must come from a document downloaded in this session. Use null when not found.

```jsonc
{
  "id": "liebherr-lr1300.1sx",              // lowercase manufacturer-model, dots/dashes ok
  "manufacturer": "Liebherr",
  "model": "LR 1300.1 SX",
  "type": "CR",            // AT=all-terrain, RT=rough-terrain, TC=truck crane (road chassis), CR=lattice crawler, TCR=telescopic crawler
  "boomType": "lattice",   // "telescopic" | "lattice"
  "maxCapacity_t": 300,     // headline rating
  "axles": null,            // number of axles (wheeled), null for crawler
  "operatingWeight_t": null,
  "maxBoom_m": 84,          // max MAIN boom length
  "maxHookHeight_m": null,
  "counterweight_t": 100,   // counterweight used for the chart below
  "outriggerSpan_m": [8.8, 8.3],  // [longitudinal, transverse] pad centres, wheeled only; null for crawler
  "maxOutriggerForce_t": null,
  "groundPressure_kPa": null,     // crawler average ground pressure if given
  "dims": {                       // from the DIMENSION DRAWING page (side view). metres. null if absent.
    "overallLength_m": null,      // carrier/transport length (wheeled) or crawler track overall length
    "overallWidth_m": null,
    "transportHeight_m": null,
    "axlePositions_m": null,      // wheeled: distance of each axle centre from FRONT of carrier, e.g. [1.9, 3.55, 6.2, 7.85, 9.5]
    "wheelDiameter_m": null,      // tyre outer diameter if derivable (e.g. 1.4 for 16.00R25 ≈ 1.45)
    "tyreSize": null,             // e.g. "14.00 R 25"
    "slewCentreFromFront_m": null,// wheeled: horizontal distance from carrier front to slewing centre
    "trackLength_m": null,        // crawler: overall track length (side view)
    "trackHeight_m": null,
    "trackGauge_m": null,         // crawler: track centre distance / width over tracks
    "tailSwingRadius_m": null,    // superstructure/counterweight rear radius
    "boomPivotHeight_m": null,    // boom foot pin height above ground (drawings often show it)
    "boomPivotOffset_m": null,    // horizontal distance slewing centre → boom foot pin (positive = toward boom tip side, negative = behind)
    "telescopicSections": null,   // telescopic boom: number of sections incl. base
    "dimsPage": null
  },
  "chartConfig": "Main boom, 100 t counterweight, 360°, no superlift",
  "chartIncludesHookBlock": false,  // true = hook block weight must be counted as load (usual)
  "boomLengths_m": [..],            // ≤ 12 columns; include shortest & longest, spread evenly
  "radii_m": [..],                  // all rows, ascending
  "capacity_t": [[..]],             // rows = radii, cols = boom lengths, null for empty
  "source": { "url": "", "title": "", "page": "", "retrieved": "2026-09-24" },
  "notes": ""
}
```

Chart selection rules
- Wheeled (AT/RT/TC): MAIN telescopic boom, outriggers FULLY extended, 360°, max standard counterweight. Exclude over-rear-only columns.
- Crawler (CR): MAIN lattice boom (heavy/standard main boom "H" or "S"), standard full counterweight, NO superlift/derrick/luffing jib, 360°.
- Telescopic crawler (TCR): main boom, full counterweight, 360°, on crawlers, level ground.
- Imperial charts: convert exactly (1 lb = 0.00045359237 t, 1 ft = 0.3048 m), round capacity to 0.1 t, note it.

Extraction tips
- Download: `curl -L -A "Mozilla/5.0" -o <file> <url>` into the scratchpad pdf/ folder.
- Python venv with pypdf + pdfplumber: /private/tmp/claude-501/-Users-jodeon-----/ffa9590f-8f02-4ccc-a829-c9c722947061/scratchpad/venv/bin/python
- Place cells by x-position (pdfplumber words) — plain text drops empty cells. Sanity-check: capacities fall with radius within a column; row/col counts match.
- Where possible render a page to PNG (pdfplumber page.to_image) and look at it with the Read tool to verify.
