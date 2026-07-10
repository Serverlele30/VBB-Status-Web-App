// Transitous-Adapter: Normalisierung MOTIS -> HAFAS-Form testen
const fs = require('fs');
const path = require('path');
const api = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');
const adapter = fs.readFileSync(path.join(__dirname, '..', 'js', 'transitous.js'), 'utf8');

// Minimale Umgebung
global.document = { getElementById: () => null, createElement: () => ({ style: {}, setAttribute(){}, prepend(){} }), body: { prepend(){} } };
global.localStorage = { _d: {}, getItem(k){ return this._d[k] ?? null; }, setItem(k,v){ this._d[k]=v; }, };
global.AbortController = class { constructor(){ this.signal = {}; } abort(){} };

// MOTIS-Fixtures (Struktur laut OpenAPI v2.10.2)
const fixtures = {
    geocode: [{ type: 'STOP', name: 'S+U Alexanderplatz', id: 'de-DELFI_de:11000:900100003', lat: 52.5215, lon: 13.4112, tokens: [], areas: [], score: 1 }],
    stoptimes: { stopTimes: [{
        place: { name: 'S+U Alexanderplatz', stopId: 'de-DELFI_de:11000:900100003', lat: 52.52, lon: 13.41,
                 departure: '2026-07-06T10:05:00+02:00', scheduledDeparture: '2026-07-06T10:03:00+02:00', track: '4' },
        mode: 'SUBWAY', realTime: true, headsign: 'U Ruhleben', routeShortName: 'U2', tripId: 'trip123',
        agencyName: 'BVG', cancelled: false, tripCancelled: false
    }], place: {}, previousPageCursor: '', nextPageCursor: '' },
    plan: { previousPageCursor: 'CURSOR_PREV', nextPageCursor: 'CURSOR_NEXT', itineraries: [{
        fareTransfers: [{ effectiveFareLegProducts: [[ { product: { name: 'Einzelfahrt AB', amount: 3.80, currency: 'EUR' } } ]] }],
        duration: 1200, startTime: '2026-07-06T10:00:00+02:00', endTime: '2026-07-06T10:20:00+02:00', transfers: 0, id: 'it1',
        legs: [
            { mode: 'WALK', from: { name: 'Start', lat: 0, lon: 0 }, to: { name: 'S Südkreuz', lat: 0, lon: 0 },
              startTime: '2026-07-06T10:00:00+02:00', endTime: '2026-07-06T10:04:00+02:00',
              scheduledStartTime: '2026-07-06T10:00:00+02:00', scheduledEndTime: '2026-07-06T10:04:00+02:00',
              realTime: false, scheduled: true, duration: 240, legGeometry: {} },
            { mode: 'SUBURBAN', from: { name: 'S Südkreuz', track: '2', lat: 0, lon: 0 }, to: { name: 'S+U Alexanderplatz', lat: 0, lon: 0 },
              startTime: '2026-07-06T10:06:00+02:00', endTime: '2026-07-06T10:20:00+02:00',
              scheduledStartTime: '2026-07-06T10:05:00+02:00', scheduledEndTime: '2026-07-06T10:19:00+02:00',
              realTime: true, scheduled: false, duration: 840, routeShortName: 'S2', headsign: 'S Bernau', legGeometry: {},
              intermediateStops: [
                  { name: 'S Yorckstr.', stopId: 'Y1', arrival: '2026-07-06T10:09:00+02:00', scheduledArrival: '2026-07-06T10:08:00+02:00' },
                  { name: 'S Anhalter Bf', stopId: 'A1', arrival: '2026-07-06T10:12:00+02:00', scheduledArrival: '2026-07-06T10:11:00+02:00' }
              ] }
        ]
    }] }
};

function encodePolyline5(points) {
    let out = '', prevLat = 0, prevLon = 0;
    const enc = (v) => {
        let x = v < 0 ? ~(v << 1) : (v << 1), s = '';
        while (x >= 0x20) { s += String.fromCharCode((0x20 | (x & 0x1f)) + 63); x >>= 5; }
        return s + String.fromCharCode(x + 63);
    };
    for (const [lat, lon] of points) {
        const la = Math.round(lat * 1e5), lo = Math.round(lon * 1e5);
        out += enc(la - prevLat) + enc(lo - prevLon);
        prevLat = la; prevLon = lo;
    }
    return out;
}

fixtures.mapStops = [
    { name: 'U Amrumer Str.', stopId: 'de-DELFI_de:11000:900009202', lat: 52.5423, lon: 13.3495 },
    { name: 'S Westhafen', stopId: 'de-DELFI_de:11000:900001201', lat: 52.5360, lon: 13.3430 }
];
fixtures.trip = { duration: 600, startTime: 'x', endTime: 'x', transfers: 0, id: 't', legs: [{
    mode: 'SUBWAY', realTime: true, scheduled: true, duration: 600, legGeometry: {},
    startTime: 'x', endTime: 'x', scheduledStartTime: 'x', scheduledEndTime: 'x',
    from: { name: 'U Ruhleben', stopId: 'A', scheduledDeparture: '2026-07-06T10:00:00+02:00', departure: '2026-07-06T10:01:00+02:00' },
    to: { name: 'S+U Pankow', stopId: 'B', scheduledArrival: '2026-07-06T10:40:00+02:00', arrival: '2026-07-06T10:41:00+02:00' },
    intermediateStops: [
        { name: 'U Theodor-Heuss-Platz', stopId: 'C', scheduledDeparture: '2026-07-06T10:05:00+02:00', departure: '2026-07-06T10:06:30+02:00' }
    ]
}] };
// Segment: 2 Punkte, Fahrt läuft JETZT (Start vor 30s, Ende in 30s)
const segNow = Date.now();
fixtures.mapTrips = [{
    trips: [{ tripId: 'RT1', routeShortName: 'M10', displayName: 'M10' }],
    mode: 'TRAM', distance: 1000,
    from: { name: 'A', lat: 52.5, lon: 13.3 }, to: { name: 'B Endstation', lat: 52.6, lon: 13.4 },
    departure: new Date(segNow - 30000).toISOString(),
    arrival: new Date(segNow + 30000).toISOString(),
    scheduledDeparture: new Date(segNow - 90000).toISOString(),
    scheduledArrival: new Date(segNow - 30000).toISOString(),
    realTime: true,
    polyline: encodePolyline5([[52.5, 13.3], [52.6, 13.4]])
}];

const requestedUrls = [];
global.fetch = async (url) => {
    requestedUrls.push(url);
    const body = url.includes('/geocode') ? fixtures.geocode
               : url.includes('/stoptimes') ? fixtures.stoptimes
               : url.includes('/plan') ? fixtures.plan
               : url.includes('/map/stops') ? fixtures.mapStops
               : url.includes('/map/trips') ? fixtures.mapTrips
               : url.includes('/trip') ? fixtures.trip : {};
    return { ok: true, json: async () => body };
};

// api.js-Ausschnitte + Adapter in EINEM Scope evaluieren
const combined =
      'let lastKnownLat = null, lastKnownLon = null;'
    + api.slice(api.indexOf('const STORAGE_KEYS'), api.indexOf('function storageGet'))
    + api.slice(api.indexOf('const API_SOFT_LIMIT'), api.indexOf('/**'))
    + api.slice(api.indexOf('async function apiFetch'), api.indexOf('// ==========================================\n        // GLOBALES'))
    + api.slice(api.indexOf('function showApiOutageBanner'), api.indexOf('// HTML-Escaping'))
    + api.slice(api.indexOf('function storageGet'), api.indexOf('// --- Favoriten ---'))
    + adapter
    + ';global.__a = { transitousLocations, transitousDepartures, transitousJourneys, motisModeToProduct, productsToMotisModes, transitousNearby, transitousTrip, transitousRadarSegments, segmentPositionAt, decodePolyline5, apiCache, transitousMapStops };global.__t = (c) => eval(c);';
eval(combined);
const A = global.__a;

(async () => {
    let fails = 0;
    const t = (name, ok) => { console.log((ok ? '✅' : '❌'), name); if (!ok) fails++; };

    // 1) Locations-Normalisierung
    const locs = await A.transitousLocations('alex');
    t('geocode -> hafas locations', locs[0].type === 'stop'
        && locs[0].id === 'transitous:de-DELFI_de:11000:900100003'
        && locs[0].name === 'S+U Alexanderplatz'
        && locs[0].location.latitude === 52.5215);

    // 2) Departures über Transitous-ID
    const deps = await A.transitousDepartures({ id: 'transitous:de-DELFI_de:11000:900100003', name: 'Alex' });
    const d = deps.departures[0];
    t('stoptimes -> hafas departure (Linie/Richtung)', d.line.name === 'U2' && d.line.product === 'subway' && d.direction === 'U Ruhleben');
    t('Verspätung korrekt (120s)', d.delay === 120);
    t('when/plannedWhen/Gleis', d.when.includes('10:05') && d.plannedWhen.includes('10:03') && d.platform === '4');

    // 3) Departures über Koordinaten (kein ID-Mapping nötig)
    requestedUrls.length = 0;
    await A.transitousDepartures({ id: '900100003', name: 'Alex', lat: 52.52, lon: 13.41 });
    t('HAFAS-ID + Koordinaten -> center-Query statt Geocode', requestedUrls.length === 1 && requestedUrls[0].includes('center=52.52,13.41'));

    // 4) Departures nur mit Name (alter Favorit) -> Geocode + Cache
    A.apiCache.clear();
    requestedUrls.length = 0;
    await A.transitousDepartures({ id: '900xyz', name: 'S Südkreuz' });
    t('Nur Name -> geocode + stoptimes (2 Requests)', requestedUrls.length === 2 && requestedUrls[0].includes('/geocode'));
    A.apiCache.clear();
    requestedUrls.length = 0;
    await A.transitousDepartures({ id: '900xyz', name: 'S Südkreuz' });
    t('ID-Mapping gecacht (nur noch 1 Request)', requestedUrls.length === 1);

    // 5) Journeys-Normalisierung inkl. Filter und Zeit
    requestedUrls.length = 0;
    const j = await A.transitousJourneys(
        { id: 'x', name: 'Start', lat: 52.47, lon: 13.36 },
        { id: 'y', name: 'Ziel', lat: 52.52, lon: 13.41 },
        { timeISO: '2026-07-06T08:00:00.000Z', arriveBy: true, products: new Set(['suburban', 'subway']) }
    );
    const leg = j.journeys[0].legs[1];
    t('plan -> hafas journey (Leg-Felder)', leg.line.name === 'S2' && leg.line.product === 'suburban'
        && leg.origin.name === 'S Südkreuz' && leg.departurePlatform === '2');
    t('Walk-Leg markiert', j.journeys[0].legs[0].walking === true && j.journeys[0].legs[0].line === undefined);
    const planUrl = requestedUrls.find(u => u.includes('/plan'));
    t('Koordinaten als fromPlace', planUrl.includes('fromPlace=52.47%2C13.36'));
    t('arriveBy + Zeit in URL', planUrl.includes('arriveBy=true') && planUrl.includes('time='));
    t('transitModes mit Fähre', planUrl.includes('SUBURBAN') && planUrl.includes('SUBWAY') && planUrl.includes('FERRY') && !planUrl.includes('TRAM'));

    // 6) Nearby: map/stops -> sortiert nach Distanz
    const near = await A.transitousNearby(52.5423, 13.3495);
    t('Nearby: nächste Station zuerst + Distanz', near[0].name === 'U Amrumer Str.' && near[0].distance < near[1].distance);

    // 7) Trip-Details: stopovers in hafas-Form
    const tripRes = await A.transitousTrip('transitous:RT1');
    const so = tripRes.trip.stopovers;
    t('Trip: from + intermediate + to = 3 Stopovers', so.length === 3 && so[1].stop.name === 'U Theodor-Heuss-Platz');
    t('Trip: Verspätung am Zwischenhalt (90s)', so[1].departureDelay === 90);

    // 8) Polyline-Decoder (Roundtrip-Referenzwerte)
    const pts = A.decodePolyline5('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    t('Polyline-Decoder (Google-Referenzbeispiel)', 
      Math.abs(pts[0][0] - 38.5) < 1e-9 && Math.abs(pts[0][1] + 120.2) < 1e-9 && pts.length === 3);

    // 9) Radar-Segmente + Interpolation: Fahrt zur Hälfte -> Mittelpunkt
    const segs = await A.transitousRadarSegments({ north: 52.7, south: 52.4, west: 13.2, east: 13.6 }, 12);
    t('Radar: Segment normalisiert', segs.length === 1 && segs[0].lineName === 'M10' && segs[0].product === 'tram');
    const pos = A.segmentPositionAt(segs[0], Date.now());
    t('Interpolation: Position ~Mittelpunkt der Strecke',
      pos && Math.abs(pos.latitude - 52.55) < 0.01 && Math.abs(pos.longitude - 13.35) < 0.01);
    t('Interpolation: außerhalb des Zeitfensters -> null',
      A.segmentPositionAt(segs[0], Date.now() + 120000) === null);

    // 10) Blätter-Cursor: rein in die URL, raus aus der Antwort
    A.apiCache.clear();
    requestedUrls.length = 0;
    const jPage = await A.transitousJourneys(
        { id: 'x', name: 'Start', lat: 52.47, lon: 13.36 },
        { id: 'y', name: 'Ziel', lat: 52.52, lon: 13.41 },
        { pageCursor: 'CURSOR_NEXT' }
    );
    const pagedUrl = requestedUrls.find(u => u.includes('/plan'));
    t('pageCursor in plan-URL', pagedUrl.includes('pageCursor=CURSOR_NEXT'));
    t('Cursor aus Antwort normalisiert', jPage.previousPageCursor === 'CURSOR_PREV' && jPage.nextPageCursor === 'CURSOR_NEXT');

    // 11) Zwischenhalte im Leg
    const legWithStops = jPage.journeys[0].legs[1];
    t('Zwischenhalte gemappt (2 Stück, Name + Zeit)',
      legWithStops.stopovers.length === 2 &&
      legWithStops.stopovers[0].stop.name === 'S Yorckstr.' &&
      legWithStops.stopovers[0].arrival.includes('10:09'));

    // 12) map/stops normalisiert (transitous:-Präfix + Koordinaten)
    const mapStops = await A.transitousMapStops({ north: 52.55, south: 52.53, west: 13.33, east: 13.36 });
    t('map/stops -> id-Präfix + Koordinaten',
      mapStops.length === 2 && mapStops[0].id.startsWith('transitous:') && mapStops[0].lat > 52);

    // 13) Geocode-Bias: ohne Position Berlin-Mitte, mit Position deren Koordinaten
    A.apiCache.clear();
    requestedUrls.length = 0;
    await A.transitousLocations('teststr');
    t('Bias-Default Berlin-Mitte', requestedUrls[0].includes('place=52.52,13.41'));
    global.__t('lastKnownLat = 52.401; lastKnownLon = 13.052;'); // Potsdam
    A.apiCache.clear();
    requestedUrls.length = 0;
    await A.transitousLocations('teststr2');
    t('Bias nutzt letzte GPS-Position', requestedUrls[0].includes('place=52.401,13.052'));

    // 14) Routing-Optionen + Via + Preis
    A.apiCache.clear();
    requestedUrls.length = 0;
    const jOpt = await A.transitousJourneys(
        { id: 'x', name: 'Start', lat: 52.47, lon: 13.36 },
        { id: 'y', name: 'Ziel', lat: 52.52, lon: 13.41 },
        { wheelchair: true, bike: true, via: { id: 'transitous:VIA_STOP_1', name: 'Via' } }
    );
    const optUrl = requestedUrls.find(u => u.includes('/plan'));
    t('Barrierefrei in URL', optUrl.includes('pedestrianProfile=WHEELCHAIR'));
    t('Fahrrad in URL', optUrl.includes('requireBikeTransport=true'));
    t('Via-Stop-ID in URL (ohne Präfix)', optUrl.includes('via=VIA_STOP_1'));
    t('withFares immer an', optUrl.includes('withFares=true'));
    t('Preis defensiv extrahiert (3,80 EUR)',
      jOpt.journeys[0].fare && jOpt.journeys[0].fare.amount === 3.8 && jOpt.journeys[0].fare.currency === 'EUR');

    // 15) Fehlende Fare-Daten -> fare ist null (keine UI-Anzeige)
    A.apiCache.clear();
    const noFare = JSON.parse(JSON.stringify(fixtures.plan));
    delete noFare.itineraries[0].fareTransfers;
    const origPlan = fixtures.plan;
    fixtures.plan = noFare;
    const jNoFare = await A.transitousJourneys(
        { id: 'x2', name: 'S2', lat: 52.4, lon: 13.3 },
        { id: 'y2', name: 'Z2', lat: 52.5, lon: 13.4 }, {}
    );
    fixtures.plan = origPlan;
    t('Ohne Fare-Daten: fare === null', jNoFare.journeys[0].fare === null);

    console.log(fails === 0 ? '\n🎉 TRANSITOUS-ADAPTER-TESTS BESTANDEN' : `\n❌ ${fails} fehlgeschlagen`);
    process.exit(fails ? 1 : 0);
})();
