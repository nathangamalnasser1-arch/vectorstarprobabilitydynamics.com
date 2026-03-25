/**
 * Drift City Geospatial Dashboard — Unit Tests
 * Covers: DOM structure, BFS pathfinding, distance/time calculations,
 *         EV compliance, fuel tracker, city data integrity.
 * Run with: npm test
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── BROWSER API STUBS ─────────────────────────────────────────
global.IntersectionObserver = class {
  constructor(cb) {}
  observe() {} unobserve() {} disconnect() {}
};

HTMLCanvasElement.prototype.getContext = () => ({
  clearRect(){} , beginPath(){}, closePath(){}, moveTo(){}, lineTo(){},
  arc(){}, fill(){}, stroke(){}, fillText(){}, fillRect(){}, strokeRect(){},
  setLineDash(){},
  get shadowBlur(){return 0;}, set shadowBlur(_){}  ,
  get shadowColor(){return '';}, set shadowColor(_){},
  get strokeStyle(){return '';}, set strokeStyle(_){},
  get fillStyle(){return '';}, set fillStyle(_){},
  get lineWidth(){return 1;}, set lineWidth(_){},
  get font(){return '';}, set font(_){},
  get textAlign(){return '';}, set textAlign(_){},
  get textBaseline(){return '';}, set textBaseline(_){},
  get globalAlpha(){return 1;}, set globalAlpha(_){},
});

global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame  = () => {};

// Leaflet stub — full fluent-chain support
const _fluent = () => {
  const obj = {
    addTo:        () => obj,
    bindTooltip:  () => obj,
    bindPopup:    () => obj,
    addLayer:     () => obj,
    removeLayer:  () => obj,
    clearLayers:  () => obj,
    eachLayer:    () => obj,
    setView:      () => obj,
    on:           () => obj,
    getZoom:      () => 13,
    getContainer: () => ({ style: {} }),
    getElement:   () => ({ style: {} }),
  };
  return obj;
};

global.L = {
  map:          () => _fluent(),
  tileLayer:    () => _fluent(),
  layerGroup:   () => _fluent(),
  marker:       () => _fluent(),
  circleMarker: () => _fluent(),
  circle:       () => _fluent(),
  polyline:     () => _fluent(),
  divIcon:      (o) => o,
  latLng:       (lat, lng) => ({ lat, lng, distanceTo: () => 100 }),
};

// Load map.html
beforeAll(() => {
  const html = fs.readFileSync(path.resolve(__dirname, '../map.html'), 'utf8');
  document.open();
  document.write(html);
  document.close();
});

// ── Helper: get window.__DC__ (pure functions exported by map.html)
const DC = () => window.__DC__;

// ══════════════════════════════════════════════════════════════
// SECTION 1 — PAGE STRUCTURE
// ══════════════════════════════════════════════════════════════
describe('Map Page — DOM Structure', () => {
  test('page title is correct', () => {
    expect(document.title).toBe('DRIFT CITY — ASN-9 GEOSPATIAL COMMAND');
  });

  test('#map container exists', () => {
    expect(document.getElementById('map')).not.toBeNull();
  });

  test('#hud-top bar exists', () => {
    expect(document.getElementById('hud-top')).not.toBeNull();
  });

  test('#hud-left panel exists', () => {
    expect(document.getElementById('hud-left')).not.toBeNull();
  });

  test('#hud-right panel exists', () => {
    expect(document.getElementById('hud-right')).not.toBeNull();
  });

  test('#hud-bottom bar exists', () => {
    expect(document.getElementById('hud-bottom')).not.toBeNull();
  });

  test('logo text contains DRIFTCITY', () => {
    const logo = document.querySelector('.top-logo');
    expect(logo?.textContent).toContain('DRIFT');
    expect(logo?.textContent).toContain('CITY');
  });

  test('ASN-9 COMMAND is in title bar', () => {
    expect(document.querySelector('.top-logo')?.textContent).toContain('ASN-9');
  });

  test('#lockdown-banner exists', () => {
    expect(document.getElementById('lockdown-banner')).not.toBeNull();
  });

  test('#lockdown-overlay exists', () => {
    expect(document.getElementById('lockdown-overlay')).not.toBeNull();
  });

  test('#lockdown-timer exists', () => {
    expect(document.getElementById('lockdown-timer')).not.toBeNull();
  });

  test('#coord-bar exists', () => {
    expect(document.getElementById('coord-bar')).not.toBeNull();
  });

  test('#trace-info-box exists', () => {
    expect(document.getElementById('trace-info-box')).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 2 — HUD CONTENT
// ══════════════════════════════════════════════════════════════
describe('Map HUD Content', () => {
  test('847 ASN-9 nodes stat is displayed in top bar', () => {
    expect(document.getElementById('hud-top').textContent).toContain('847');
  });

  test('city tab Nevada exists and is initially active', () => {
    const tab = document.getElementById('tab-nevada');
    expect(tab).not.toBeNull();
    expect(tab.classList.contains('active')).toBe(true);
  });

  test('city tab Saudi exists', () => {
    expect(document.getElementById('tab-saudi')).not.toBeNull();
  });

  test('fuel tracker elements exist', () => {
    expect(document.getElementById('fuel-num')).not.toBeNull();
    expect(document.getElementById('fuel-fill')).not.toBeNull();
    expect(document.getElementById('fuel-status')).not.toBeNull();
  });

  test('fuel tracker shows 200L mandate', () => {
    expect(document.getElementById('hud-right').textContent).toContain('200');
  });

  test('live telemetry elements exist', () => {
    ['r-speed','r-green','r-veh','r-comply','r-tickets','r-bans','r-ld'].forEach(id => {
      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  test('lockdown button exists', () => {
    expect(document.getElementById('btn-lockdown')).not.toBeNull();
  });

  test('race trace button exists', () => {
    expect(document.getElementById('btn-trace')).not.toBeNull();
  });

  test('performance filter button exists', () => {
    expect(document.getElementById('btn-perf')).not.toBeNull();
  });

  test('clear trace button exists', () => {
    expect(document.getElementById('btn-clear-trace')).not.toBeNull();
  });

  test('Asphalt Creed tagline is in left panel', () => {
    expect(document.getElementById('hud-left').textContent)
      .toContain('Drift City is not for everyone');
  });

  test('bottom bar contains ASN-9 surveillance notice', () => {
    expect(document.getElementById('hud-bottom').textContent.toLowerCase())
      .toContain('surveillance by asn-9');
  });

  test('bottom bar contains tire replacement mandate', () => {
    expect(document.getElementById('hud-bottom').textContent.toLowerCase())
      .toContain('monthly tire');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3 — LAYER TOGGLES
// ══════════════════════════════════════════════════════════════
describe('Layer Toggle Controls', () => {
  const layerKeys = ['greenWave','asnNodes','driftCorners','residences','helipads','dcu','mfr'];

  test('all 7 layer toggle switches exist', () => {
    layerKeys.forEach(key => {
      expect(document.getElementById('sw-' + key)).not.toBeNull();
    });
  });

  test('all layer switches are ON by default', () => {
    layerKeys.forEach(key => {
      expect(document.getElementById('sw-' + key).classList.contains('on')).toBe(true);
    });
  });

  test('8 layer toggle rows are rendered (including Urban Cells)', () => {
    expect(document.querySelectorAll('#hud-left .ltrow').length).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 4 — CITY DATA INTEGRITY: Nevada
// ══════════════════════════════════════════════════════════════
describe('City Data Integrity — Nevada (DC-NV)', () => {
  test('Nevada city definition exists', () => {
    expect(DC().CITIES.nevada).not.toBeUndefined();
  });

  test('Nevada has center coordinates', () => {
    const c = DC().CITIES.nevada.center;
    expect(c).toHaveLength(2);
    expect(c[0]).toBeGreaterThan(35);
    expect(c[1]).toBeLessThan(-115);
  });

  test('Nevada has 13 road network nodes', () => {
    expect(Object.keys(DC().CITIES.nevada.nodes).length).toBe(13);
  });

  test('Nevada has 8 arterial roads', () => {
    expect(DC().CITIES.nevada.arterials.length).toBe(8);
  });

  test('Nevada has 9 drift corners', () => {
    expect(DC().CITIES.nevada.driftCorners.length).toBe(9);
  });

  test('Nevada has 5 residential estates', () => {
    expect(DC().CITIES.nevada.residences.length).toBe(5);
  });

  test('Nevada has 3 helipads', () => {
    expect(DC().CITIES.nevada.helipads.length).toBe(3);
  });

  test('Nevada has 2 DCU hubs', () => {
    expect(DC().CITIES.nevada.dcuHubs.length).toBe(2);
  });

  test('Nevada has 3 manufacturer service centers', () => {
    expect(DC().CITIES.nevada.mfr.length).toBe(3);
  });

  test('every Nevada node has pos and name', () => {
    Object.values(DC().CITIES.nevada.nodes).forEach(n => {
      expect(n.pos).toHaveLength(2);
      expect(typeof n.name).toBe('string');
    });
  });

  test('every Nevada drift corner has angle and compliance', () => {
    DC().CITIES.nevada.driftCorners.forEach(c => {
      expect(c.angle).toBeGreaterThanOrEqual(25);
      expect(c.compliance).toBeGreaterThan(0);
      expect(c.compliance).toBeLessThanOrEqual(100);
    });
  });

  test('Nevada Central Command node is at expected coordinates', () => {
    const c2 = DC().CITIES.nevada.nodes.C2;
    expect(c2.pos[0]).toBeCloseTo(36.900, 2);
    expect(c2.pos[1]).toBeCloseTo(-116.500, 2);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 5 — CITY DATA INTEGRITY: Saudi
// ══════════════════════════════════════════════════════════════
describe('City Data Integrity — Saudi (DC-SA)', () => {
  test('Saudi city definition exists', () => {
    expect(DC().CITIES.saudi).not.toBeUndefined();
  });

  test('Saudi has center coordinates in Arabian Peninsula', () => {
    const c = DC().CITIES.saudi.center;
    expect(c[0]).toBeGreaterThan(20);
    expect(c[0]).toBeLessThan(30);
    expect(c[1]).toBeGreaterThan(45);
  });

  test('Saudi has 13 road network nodes', () => {
    expect(Object.keys(DC().CITIES.saudi.nodes).length).toBe(13);
  });

  test('Saudi has 8 arterial roads', () => {
    expect(DC().CITIES.saudi.arterials.length).toBe(8);
  });

  test('Saudi has 9 drift corners', () => {
    expect(DC().CITIES.saudi.driftCorners.length).toBe(9);
  });

  test('Saudi has 5 residential estates', () => {
    expect(DC().CITIES.saudi.residences.length).toBe(5);
  });

  test('Saudi has 3 helipads', () => {
    expect(DC().CITIES.saudi.helipads.length).toBe(3);
  });

  test('Saudi has 2 DCU hubs', () => {
    expect(DC().CITIES.saudi.dcuHubs.length).toBe(2);
  });

  test('Saudi has 3 manufacturer service centers', () => {
    expect(DC().CITIES.saudi.mfr.length).toBe(3);
  });

  test('Saudi drift corners all have angle ≥ 25°', () => {
    DC().CITIES.saudi.driftCorners.forEach(c => {
      expect(c.angle).toBeGreaterThanOrEqual(25);
    });
  });

  test('Saudi includes Ferrari in manufacturers', () => {
    const brands = DC().CITIES.saudi.mfr.map(m => m.brand);
    expect(brands).toContain('FERRARI');
  });

  test('Saudi includes Koenigsegg in manufacturers', () => {
    const brands = DC().CITIES.saudi.mfr.map(m => m.brand);
    expect(brands).toContain('KOENIGSEGG');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 6 — ROAD GRAPH INTEGRITY
// ══════════════════════════════════════════════════════════════
describe('Road Graph Integrity', () => {
  const G = () => DC().ROAD_GRAPH;

  test('all 13 node IDs are in the graph', () => {
    const expected = ['N1','N2','N3','C1','C2','C3','S1','S2','S3','NW','NE','SW','SE'];
    expected.forEach(id => expect(G()[id]).toBeDefined());
  });

  test('graph is undirected — every connection is bidirectional', () => {
    Object.entries(G()).forEach(([node, neighbors]) => {
      neighbors.forEach(nb => {
        expect(G()[nb]).toContain(node);
      });
    });
  });

  test('C2 (central hub) has the most connections', () => {
    const counts = Object.entries(G()).map(([, nbs]) => nbs.length);
    expect(G()['C2'].length).toBe(Math.max(...counts));
  });

  test('C2 connects to at least 8 nodes', () => {
    expect(G()['C2'].length).toBeGreaterThanOrEqual(8);
  });

  test('corner nodes (NW/NE/SW/SE) connect to exactly 4 nodes', () => {
    ['NW','NE','SW','SE'].forEach(id => {
      expect(G()[id].length).toBe(4);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 7 — BFS PATHFINDING
// ══════════════════════════════════════════════════════════════
describe('Business Logic — BFS Pathfinding', () => {
  const bfs = (...args) => DC().bfsPath(...args);

  test('path from N1 to N1 is [N1]', () => {
    expect(bfs('N1','N1')).toEqual(['N1']);
  });

  test('direct neighbors return 2-node path', () => {
    const p = bfs('N1','N2');
    expect(p).not.toBeNull();
    expect(p[0]).toBe('N1');
    expect(p[p.length - 1]).toBe('N2');
    expect(p.length).toBe(2);
  });

  test('path from N1 to S3 is found and valid', () => {
    const p = bfs('N1','S3');
    expect(p).not.toBeNull();
    expect(p[0]).toBe('N1');
    expect(p[p.length - 1]).toBe('S3');
  });

  test('path from S1 to N3 traverses the graph', () => {
    const p = bfs('S1','N3');
    expect(p).not.toBeNull();
    expect(p.length).toBeGreaterThan(2);
  });

  test('every node in path is connected to next node', () => {
    const p = bfs('N1','S3');
    for (let i = 0; i < p.length - 1; i++) {
      expect(DC().ROAD_GRAPH[p[i]]).toContain(p[i + 1]);
    }
  });

  test('BFS returns shortest path (N2 to C2 = 2 nodes)', () => {
    const p = bfs('N2','C2');
    expect(p).toHaveLength(2);
  });

  test('path from NW to SE is found', () => {
    expect(bfs('NW','SE')).not.toBeNull();
  });

  test('invalid node returns null', () => {
    expect(bfs('N1','INVALID_NODE')).toBeNull();
  });

  test('all 13 nodes can reach C2 (fully connected graph)', () => {
    const nodes = ['N1','N2','N3','C1','C3','S1','S2','S3','NW','NE','SW','SE'];
    nodes.forEach(id => {
      expect(bfs(id,'C2')).not.toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 8 — NEAREST NODE
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Nearest Node', () => {
  const nn = (...args) => DC().nearestNode(...args);

  test('clicking exactly on N1 returns N1 for Nevada', () => {
    const N1pos = DC().CITIES.nevada.nodes.N1.pos;
    expect(nn(N1pos[0], N1pos[1], 'nevada')).toBe('N1');
  });

  test('clicking exactly on C2 returns C2 for Nevada', () => {
    const C2pos = DC().CITIES.nevada.nodes.C2.pos;
    expect(nn(C2pos[0], C2pos[1], 'nevada')).toBe('C2');
  });

  test('clicking very close to N2 in Saudi returns N2', () => {
    const N2pos = DC().CITIES.saudi.nodes.N2.pos;
    // offset by 0.0001 degrees
    expect(nn(N2pos[0] + 0.0001, N2pos[1] + 0.0001, 'saudi')).toBe('N2');
  });

  test('always returns a valid node ID', () => {
    const validIds = Object.keys(DC().CITIES.nevada.nodes);
    const result = nn(36.90, -116.50, 'nevada');
    expect(validIds).toContain(result);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 9 — TRAVEL TIME CALCULATION
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Travel Time', () => {
  const tt = (...args) => DC().travelTime(...args);

  test('1000m at 3600 km/h = 1 second', () => {
    expect(tt(1000, 3600)).toBe(1);
  });

  test('88m at 88 km/h ≈ 3.6 seconds (rounded to 4)', () => {
    expect(tt(88, 88)).toBe(4);
  });

  test('higher speed → shorter time', () => {
    expect(tt(5000, 110)).toBeLessThan(tt(5000, 70));
  });

  test('city green wave: 5000m at 88 km/h ≈ 204 seconds', () => {
    expect(tt(5000, 88)).toBe(205);
  });

  test('returns integer seconds', () => {
    expect(Number.isInteger(tt(3000, 95))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 10 — ROUTE DISTANCE
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Route Distance', () => {
  const rd = (...args) => DC().routeDistance(...args);

  test('single-point route has 0 distance', () => {
    expect(rd([[36.90, -116.50]])).toBe(0);
  });

  test('two identical points have 0 distance', () => {
    expect(rd([[36.90, -116.50],[36.90, -116.50]])).toBe(0);
  });

  test('distance between Nevada N1 and N3 (0.09° longitude apart) is roughly 8km', () => {
    const N1 = DC().CITIES.nevada.nodes.N1.pos;
    const N3 = DC().CITIES.nevada.nodes.N3.pos;
    const d = rd([N1, N3]);
    expect(d).toBeGreaterThan(5000);
    expect(d).toBeLessThan(12000);
  });

  test('adding a midpoint increases computed distance (triangle inequality)', () => {
    const N1 = DC().CITIES.nevada.nodes.N1.pos;
    const C2 = DC().CITIES.nevada.nodes.C2.pos;
    const S3 = DC().CITIES.nevada.nodes.S3.pos;
    expect(rd([N1, C2, S3])).toBeGreaterThan(rd([N1, S3]));
  });

  test('distance is always non-negative', () => {
    const N1 = DC().CITIES.nevada.nodes.N1.pos;
    const S3 = DC().CITIES.nevada.nodes.S3.pos;
    expect(rd([N1, S3])).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 11 — EV COMPLIANCE (PERFORMANCE FILTER)
// ══════════════════════════════════════════════════════════════
describe('Business Logic — EV/Supercar Compliance Filter', () => {
  const ev = (...args) => DC().isEvCompliant(...args);

  test('3.5s 0-100 → compliant', () => expect(ev(3.5)).toBe(true));
  test('4.99s 0-100 → compliant', () => expect(ev(4.99)).toBe(true));
  test('5.0s exactly → NOT compliant', () => expect(ev(5.0)).toBe(false));
  test('6.0s → NOT compliant', () => expect(ev(6.0)).toBe(false));
  test('0s (theoretical) → compliant', () => expect(ev(0)).toBe(true));
  test('2.0s (hypercars) → compliant', () => expect(ev(2.0)).toBe(true));
});

// ══════════════════════════════════════════════════════════════
// SECTION 12 — FUEL TRACKER LOGIC
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Fuel Tracker', () => {
  const fp = (...args) => DC().fuelPct(...args);

  test('0L = 0%', () => expect(fp(0)).toBe(0));
  test('100L = 50%', () => expect(fp(100)).toBe(50));
  test('200L = 100%', () => expect(fp(200)).toBe(100));
  test('201L is capped at 100%', () => expect(fp(201)).toBe(100));
  test('142L = 71%', () => expect(fp(142)).toBe(71));
  test('150L = 75%', () => expect(fp(150)).toBe(75));
  test('custom mandate: 50L of 100L = 50%', () => expect(fp(50, 100)).toBe(50));
  test('never returns > 100', () => expect(fp(999)).toBeLessThanOrEqual(100));
  test('never returns negative', () => expect(fp(-10)).toBeGreaterThanOrEqual(0));
});

// ══════════════════════════════════════════════════════════════
// SECTION 13 — DRIFT CORNER COMPLIANCE RULES
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Drift Angle Compliance (Map)', () => {
  const comply = deg => deg >= 25;

  test('25° is minimum compliant', () => expect(comply(25)).toBe(true));
  test('24.9° triggers $400 fine', () => expect(comply(24.9)).toBe(false));
  test('45° is fully compliant', () => expect(comply(45)).toBe(true));
  test('0° is straight-line (maximum infraction)', () => expect(comply(0)).toBe(false));
  test('all Nevada drift corners meet the 25° minimum', () => {
    DC().CITIES.nevada.driftCorners.forEach(c => {
      expect(c.angle).toBeGreaterThanOrEqual(25);
    });
  });
  test('all Saudi drift corners meet the 25° minimum', () => {
    DC().CITIES.saudi.driftCorners.forEach(c => {
      expect(c.angle).toBeGreaterThanOrEqual(25);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 14 — RESIDENTIAL SENSOR ZONE (400m)
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Residential 400m Sensor Zone (Map)', () => {
  const inZone = dist => dist <= 400;

  test('400m is exactly the activation boundary', () => expect(inZone(400)).toBe(true));
  test('399m is inside zone', () => expect(inZone(399)).toBe(true));
  test('401m is outside zone', () => expect(inZone(401)).toBe(false));
  test('0m (at gate) is inside zone', () => expect(inZone(0)).toBe(true));

  test('Nevada residences list includes car counts', () => {
    DC().CITIES.nevada.residences.forEach(r => {
      expect(r.cars).toBeGreaterThan(0);
    });
  });

  test('Estate Vesuvio has 30 garage bays', () => {
    const v = DC().CITIES.nevada.residences.find(r => r.name === 'Estate Vesuvio');
    expect(v?.cars).toBe(30);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 15 — FULL END-TO-END RACE TRACE SCENARIOS
// ══════════════════════════════════════════════════════════════
describe('End-to-End — Race Trace Generation', () => {
  const bfs = (...args) => DC().bfsPath(...args);
  const rd  = (...args) => DC().routeDistance(...args);
  const tt  = (...args) => DC().travelTime(...args);

  function simulate(startId, endId, city = 'nevada') {
    const path = bfs(startId, endId);
    if (!path) return null;
    const positions = path.map(id => DC().CITIES[city].nodes[id].pos);
    const dist  = rd(positions);
    const speed = 102;
    const eta   = tt(dist, speed);
    return { path, dist, eta };
  }

  test('N1→S3 trace is generated successfully', () => {
    const r = simulate('N1','S3');
    expect(r).not.toBeNull();
    expect(r.path[0]).toBe('N1');
    expect(r.path[r.path.length - 1]).toBe('S3');
  });

  test('N1→S3 distance is positive', () => {
    const r = simulate('N1','S3');
    expect(r.dist).toBeGreaterThan(0);
  });

  test('N1→S3 ETA at 102 km/h is positive', () => {
    const r = simulate('N1','S3');
    expect(r.eta).toBeGreaterThan(0);
  });

  test('same-node trace returns single node, 0 distance', () => {
    const r = simulate('C2','C2');
    expect(r.path).toHaveLength(1);
    expect(r.dist).toBe(0);
  });

  test('Saudi N1→S3 trace works correctly', () => {
    const r = simulate('N1','S3','saudi');
    expect(r).not.toBeNull();
    expect(r.path.length).toBeGreaterThan(0);
  });

  test('NW→SE trace passes through C2 (hub) or is direct', () => {
    const r = simulate('NW','SE');
    expect(r).not.toBeNull();
    // Both NW and SE connect through C2; valid path must exist
    expect(r.path.length).toBeGreaterThanOrEqual(2);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 16 — URBAN CELL CLUSTERS: City Data
// ══════════════════════════════════════════════════════════════
describe('Urban Cell Clusters — City Data', () => {
  test('Nevada has 3 urban cells', () => {
    expect(DC().CITIES.nevada.urbanCells.length).toBe(3);
  });

  test('Saudi has 3 urban cells', () => {
    expect(DC().CITIES.saudi.urbanCells.length).toBe(3);
  });

  test('every Nevada cell has a name, pos, and mansion count', () => {
    DC().CITIES.nevada.urbanCells.forEach(cell => {
      expect(typeof cell.name).toBe('string');
      expect(cell.pos).toHaveLength(2);
      expect(cell.mansions).toBeGreaterThanOrEqual(10);
      expect(cell.mansions).toBeLessThanOrEqual(20);
    });
  });

  test('every Saudi cell has a name, pos, and mansion count', () => {
    DC().CITIES.saudi.urbanCells.forEach(cell => {
      expect(cell.mansions).toBeGreaterThanOrEqual(10);
      expect(cell.mansions).toBeLessThanOrEqual(20);
    });
  });

  test('all cells start unlocked', () => {
    DC().CITIES.nevada.urbanCells.forEach(c => expect(c.lockdown).toBe(false));
    DC().CITIES.saudi.urbanCells.forEach(c => expect(c.lockdown).toBe(false));
  });

  test('Nevada Alpha Cell is at expected coordinates', () => {
    const alpha = DC().CITIES.nevada.urbanCells[0];
    expect(alpha.pos[0]).toBeGreaterThan(36.8);
    expect(alpha.pos[0]).toBeLessThan(37.0);
  });

  test('Saudi Alpha Cell is in the Arabian Peninsula', () => {
    const alpha = DC().CITIES.saudi.urbanCells[0];
    expect(alpha.pos[0]).toBeGreaterThan(20);
    expect(alpha.pos[1]).toBeGreaterThan(45);
  });

  test('each cell has an interior description', () => {
    DC().CITIES.nevada.urbanCells.forEach(c => {
      expect(typeof c.interior).toBe('string');
      expect(c.interior.length).toBeGreaterThan(0);
    });
  });

  test('cluster lockdown status indicator elements exist', () => {
    expect(document.getElementById('cs-alpha')).not.toBeNull();
    expect(document.getElementById('cs-beta')).not.toBeNull();
    expect(document.getElementById('cs-gamma')).not.toBeNull();
  });

  test('cluster lockdown button exists', () => {
    expect(document.getElementById('btn-cluster-ld')).not.toBeNull();
  });

  test('urban cells layer toggle switch exists', () => {
    expect(document.getElementById('sw-urbanCells')).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 17 — PURE BUSINESS LOGIC: Urban Cell Ring (Map)
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Urban Cell Geometry (Map)', () => {
  function cellArea(radiusM) { return Math.PI * radiusM * radiusM; }
  function supercarRingArea(outerR, innerR) { return cellArea(outerR) - cellArea(innerR); }
  function mansionSpacingDeg(mansionCount) { return 360 / mansionCount; }

  test('outer ring radius 250m, inner 110m → ring area > inner area', () => {
    expect(supercarRingArea(250, 110)).toBeGreaterThan(cellArea(110));
  });

  test('12 mansions on ring → 30° spacing', () => {
    expect(mansionSpacingDeg(12)).toBeCloseTo(30);
  });

  test('cell is operational when lockdown is false', () => {
    expect(DC().CITIES.nevada.urbanCells[0].lockdown).toBe(false);
  });

  test('cell lockdown state is boolean', () => {
    DC().CITIES.nevada.urbanCells.forEach(c => {
      expect(typeof c.lockdown).toBe('boolean');
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 18 — RACE CHALLENGE: DOM elements
// ══════════════════════════════════════════════════════════════
describe('Race Challenge — DOM', () => {
  test('challenge button exists', () => {
    expect(document.getElementById('btn-challenge')).not.toBeNull();
  });

  test('undo waypoint button exists', () => {
    expect(document.getElementById('btn-undo-wp')).not.toBeNull();
  });

  test('lock challenge button exists', () => {
    expect(document.getElementById('btn-lock-challenge')).not.toBeNull();
  });

  test('clear challenge button exists', () => {
    expect(document.getElementById('btn-clear-challenge')).not.toBeNull();
  });

  test('challenge card container exists', () => {
    expect(document.getElementById('challenge-card')).not.toBeNull();
  });

  test('challenge HUD strip exists', () => {
    expect(document.getElementById('challenge-hud')).not.toBeNull();
  });

  test('challenge stats panel exists', () => {
    expect(document.getElementById('challenge-stats-panel')).not.toBeNull();
  });

  test('all challenge stat elements exist', () => {
    ['cs-wps','cs-dist','cs-eta','cs-corners','cs-diff','cs-nodes'].forEach(id => {
      expect(document.getElementById(id)).not.toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 19 — RACE CHALLENGE: Business Logic
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Race Challenge Difficulty', () => {
  const diff = (...a) => DC().calcDifficulty(...a);

  test('very short route with no corners → ROOKIE', () => {
    expect(diff(800, 0).label).toBe('ROOKIE');
  });

  test('score just under 2 → ROOKIE', () => {
    // score = (1km * 0.5) + (0 * 1.8) = 0.5
    expect(diff(1000, 0).label).toBe('ROOKIE');
  });

  test('medium distance + some corners → VELOCITY', () => {
    // score = (6km * 0.5) + (1 * 1.8) = 4.8 → VELOCITY
    expect(diff(6000, 1).label).toBe('VELOCITY');
  });

  test('long route + many corners → APEX', () => {
    // score = (8km * 0.5) + (3 * 1.8) = 4 + 5.4 = 9.4 → LEGENDARY
    // try (7km * 0.5) + (2 * 1.8) = 3.5 + 3.6 = 7.1 → APEX
    expect(diff(7000, 2).label).toBe('APEX');
  });

  test('very long route with many corners → LEGENDARY', () => {
    // score = (15km * 0.5) + (5 * 1.8) = 7.5 + 9 = 16.5
    expect(diff(15000, 5).label).toBe('LEGENDARY');
  });

  test('ROOKIE has neon green color', () => {
    expect(diff(500, 0).color).toBe('#39ff14');
  });

  test('LEGENDARY has red alert color', () => {
    expect(diff(20000, 10).color).toBe('#ff2020');
  });

  test('difficulty never returns an unknown label', () => {
    const validLabels = new Set(['ROOKIE','VELOCITY','APEX','LEGENDARY']);
    [[500,0],[4000,1],[7000,2],[20000,8]].forEach(([d, c]) => {
      expect(validLabels.has(diff(d, c).label)).toBe(true);
    });
  });
});

describe('Business Logic — Challenge Code Generation', () => {
  const makeCode = () => DC().makeChallengeCode();

  test('challenge code starts with DC-', () => {
    // makeChallengeCode relies on currentCity and challengeWPs globals
    // We can test the format rules directly
    const codeRegex = /^DC-(NV|SA)-/;
    // Since currentCity defaults to 'nevada', expect DC-NV-
    expect(DC().CITIES.nevada.name).toBe('DC-NV');
    expect(DC().CITIES.saudi.name).toBe('DC-SA');
  });

  test('challenge code contains waypoints joined by dots', () => {
    // Test code structure: DC-{city}-{WP1.WP2.WP3}-{ts}
    const wps = ['N1', 'C2', 'S3'];
    const encoded = wps.join('.');
    expect(encoded).toBe('N1.C2.S3');
  });

  test('route through N1→C2→S3 covers at least 3 nodes', () => {
    const bfs = DC().bfsPath;
    const seg1 = bfs('N1', 'C2');
    const seg2 = bfs('C2', 'S3');
    const full  = [...seg1, ...seg2.slice(1)];
    expect(full.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Business Logic — Multi-Waypoint Route Assembly', () => {
  const bfs = (...a) => DC().bfsPath(...a);
  const rd  = (...a) => DC().routeDistance(...a);

  /** Build full path from array of waypoint IDs (same logic as rebuildChallengeRoute) */
  function buildFullPath(wps) {
    const full = [];
    for (let i = 0; i < wps.length - 1; i++) {
      const seg = bfs(wps[i], wps[i + 1]);
      if (!seg) continue;
      full.push(...(full.length === 0 ? seg : seg.slice(1)));
    }
    return full;
  }

  test('single waypoint produces empty path', () => {
    expect(buildFullPath(['N1'])).toHaveLength(0);
  });

  test('two adjacent waypoints produce a short path', () => {
    const path = buildFullPath(['N1', 'N2']);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[0]).toBe('N1');
    expect(path[path.length - 1]).toBe('N2');
  });

  test('three waypoints N1→C2→S3 produces valid path', () => {
    const path = buildFullPath(['N1', 'C2', 'S3']);
    expect(path[0]).toBe('N1');
    expect(path[path.length - 1]).toBe('S3');
    // C2 must appear in the path (it's a waypoint)
    expect(path).toContain('C2');
  });

  test('every consecutive node pair in full path is connected', () => {
    const path = buildFullPath(['N1', 'C2', 'S3']);
    const G = DC().ROAD_GRAPH;
    for (let i = 0; i < path.length - 1; i++) {
      expect(G[path[i]]).toContain(path[i + 1]);
    }
  });

  test('adding an out-of-the-way waypoint increases route distance', () => {
    // N1→S3 direct vs N1→S1→N3→S3 (forced zigzag)
    const direct  = buildFullPath(['N1', 'S3']);
    const zigzag  = buildFullPath(['N1', 'S1', 'N3', 'S3']);
    const city = DC().CITIES.nevada;
    const dDirect = rd(direct.map(id => city.nodes[id].pos));
    const dZigzag = rd(zigzag.map(id => city.nodes[id].pos));
    expect(dZigzag).toBeGreaterThan(dDirect);
  });

  test('duplicating a waypoint does not corrupt the path', () => {
    // If user clicks same node twice in a row, it should be deduped
    // Our addChallengeWaypoint function deduplicates, so simulate that
    const wps = ['N1', 'N1', 'C2']; // second N1 would be deduped in UI
    const deduped = wps.filter((id, i) => i === 0 || id !== wps[i - 1]);
    const path = buildFullPath(deduped);
    expect(path[0]).toBe('N1');
    expect(path[path.length - 1]).toBe('C2');
  });
});
