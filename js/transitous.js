// VBB Netz Status - Transitous-Daten-Layer (EINZIGE Datenquelle)
//
// Transitous (https://transitous.org) ist ein community-betriebener,
// kostenloser Routing-Dienst auf MOTIS-2-Basis. Seit v35 ist er die
// alleinige Datenquelle der App (transport.rest wurde entfernt).
//
// Nutzungsrichtlinie von Transitous (Freiwilligen-Projekt, begrenzte
// Ressourcen, https://transitous.org/api/):
//  - Eigenes Budget-Limit (90 Req/min) + aggressive Caches als Selbstschutz
//  - Radar-Polling gedrosselt auf 30s, nur bei sichtbarer Live-Map
//  - Quellenangabe: sichtbarer Link auf transitous.org/sources
//    (siehe Entwickler-View)
//
// Dieser Adapter übersetzt die MOTIS-Endpoints (geocode, stoptimes,
// plan, trip, map/stops, map/trips) in die HAFAS-Form, die die App
// überall erwartet.

const TRANSITOUS_BASE = 'https://api.transitous.org/api';
const TRANSITOUS_ID_PREFIX = 'transitous:';

// Budget-gezählter, gecachter, deduplizierter, timeout-gesicherter Request
// (nutzt die zentrale apiFetch-Maschinerie aus js/api.js)
async function transitousFetch(path, ttl = 0) {
    return apiFetch(TRANSITOUS_BASE + path, { ttl });
}

// MOTIS-Mode -> HAFAS-Produktname (für Farben, Icons, Filter)
function motisModeToProduct(mode) {
    switch (mode) {
        case 'SUBWAY': return 'subway';
        case 'TRAM': return 'tram';
        case 'BUS':
        case 'COACH': return 'bus';
        case 'SUBURBAN': return 'suburban';
        case 'FERRY': return 'ferry';
        case 'REGIONAL_RAIL':
        case 'REGIONAL_FAST_RAIL': return 'regional';
        case 'LONG_DISTANCE':
        case 'HIGHSPEED_RAIL':
        case 'NIGHT_RAIL': return 'express';
        default: return 'bus';
    }
}

// HAFAS-Produkt -> MOTIS-transitModes (für die Routensuche)
function productsToMotisModes(activeProducts) {
    const map = {
        suburban: ['SUBURBAN'],
        subway: ['SUBWAY'],
        tram: ['TRAM'],
        bus: ['BUS', 'COACH'],
        regional: ['REGIONAL_RAIL'],
        express: ['LONG_DISTANCE', 'HIGHSPEED_RAIL', 'NIGHT_RAIL']
    };
    const modes = new Set(['FERRY']); // Fähre hat keinen UI-Button -> immer an
    for (const p of activeProducts) {
        (map[p] || []).forEach(m => modes.add(m));
    }
    return Array.from(modes).join(',');
}

// Verspätung in Sekunden aus Ist-/Sollzeit (HAFAS liefert delay in Sekunden)
function motisDelaySeconds(actual, scheduled) {
    if (!actual || !scheduled) return null;
    const diff = (new Date(actual) - new Date(scheduled)) / 1000;
    return Number.isFinite(diff) ? Math.round(diff) : null;
}

// Geocode-Bias: letzte bekannte GPS-Position bevorzugen (bessere
// Trefferreihenfolge in Brandenburg), sonst Berlin-Mitte als Default
function geocodeBias() {
    if (lastKnownLat != null && lastKnownLon != null) {
        return `${lastKnownLat.toFixed(3)},${lastKnownLon.toFixed(3)}`;
    }
    return '52.52,13.41';
}

// GTFS-Farbe aus der API normalisieren ('DA421E' -> '#DA421E')
// Das sind die OFFIZIELLEN VBB-Linienfarben aus dem GTFS-Feed -
// kein Extra-Request nötig, sie stecken in stoptimes/plan/map-trips.
function motisColor(hex) {
    if (!hex || typeof hex !== 'string') return null;
    const clean = hex.replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    return '#' + clean.toUpperCase();
}

// Lesbare Textfarbe für einen Hintergrund per Luminanz berechnen
// (ersetzt die alte hartcodierte "helle Hintergründe"-Liste)
function bestTextColor(hexBg) {
    if (!hexBg) return '#FFF';
    const c = hexBg.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    // Relative Luminanz (vereinfachte sRGB-Gewichtung)
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#000' : '#FFF';
}

// ==========================================
// STATIONSSUCHE  (geocode -> HAFAS-locations-Form)
// ==========================================
async function transitousLocations(query) {
    // place=Berlin-Mitte als Bias, damit VBB-Gebiet zuerst kommt
    // 6h Cache: Stationsnamen ändern sich praktisch nie
    const matches = await transitousFetch(
        `/v1/geocode?text=${encodeURIComponent(query)}&type=STOP&place=${geocodeBias()}&numResults=10`,
        6 * 60 * 60 * 1000
    );

    return (matches || []).map(m => ({
        type: 'stop',
        id: TRANSITOUS_ID_PREFIX + m.id,
        name: m.name,
        location: { latitude: m.lat, longitude: m.lon },
        products: {} // MOTIS liefert modes-Array; App braucht products nur optional
    }));
}

// Station für Transitous auflösen: Stop-ID / Koordinaten / Name
// Rückgabe: Query-Fragment für stoptimes (stopId=... oder center=...&radius=...)
async function transitousStopQuery({ id, name, lat, lon }) {
    if (id && id.startsWith(TRANSITOUS_ID_PREFIX)) {
        return 'stopId=' + encodeURIComponent(id.slice(TRANSITOUS_ID_PREFIX.length));
    }
    if (lat != null && lon != null) {
        // Koordinaten reichen: stoptimes bündelt Stops im Radius
        return `center=${lat},${lon}&radius=250`;
    }
    // Nur Name bekannt (alte Favoriten): einmalig geocoden, Mapping cachen
    const cacheKey = STORAGE_KEYS.stopMapPrefix + name;
    const cached = storageGet(cacheKey);
    // Neues Format {id, time}; altes Format (String) wird von
    // cleanupStorage beim Start migriert, hier zur Sicherheit beides lesen
    const cachedId = cached && (typeof cached === 'string' ? cached : cached.id);
    if (cachedId) return 'stopId=' + encodeURIComponent(cachedId);

    const matches = await transitousFetch(
        `/v1/geocode?text=${encodeURIComponent(name)}&type=STOP&place=${geocodeBias()}&numResults=1`,
        6 * 60 * 60 * 1000
    );
    if (!matches || matches.length === 0) throw new Error('Station bei Transitous nicht gefunden');
    storageSet(cacheKey, { id: matches[0].id, time: Date.now() });
    return 'stopId=' + encodeURIComponent(matches[0].id);
}

// ==========================================
// ABFAHRTEN  (stoptimes -> HAFAS-departures-Form)
// ==========================================
async function transitousDepartures(station, n = 20) {
    const stopQuery = await transitousStopQuery(station);
    // 15s Cache: schützt vor Refresh-Spam
    const data = await transitousFetch(`/v6/stoptimes?${stopQuery}&n=${n}`, 15000);

    const departures = (data.stopTimes || []).map(st => {
        const p = st.place || {};
        return {
            tripId: st.tripId,
            direction: st.headsign || '',
            line: {
                name: st.routeShortName || st.displayName || '?',
                product: motisModeToProduct(st.mode),
                mode: st.mode === 'BUS' ? 'bus' : 'train',
                color: motisColor(st.routeColor),
                textColor: motisColor(st.routeTextColor),
                operator: st.agencyName ? { name: st.agencyName } : undefined
            },
            when: p.departure || p.arrival || null,
            plannedWhen: p.scheduledDeparture || p.scheduledArrival || null,
            delay: motisDelaySeconds(
                p.departure || p.arrival,
                p.scheduledDeparture || p.scheduledArrival
            ),
            platform: p.track || null,
            plannedPlatform: p.scheduledTrack || null,
            cancelled: st.cancelled || st.tripCancelled || p.cancelled || false
        };
    });

    return { departures };
}

// ==========================================
// ROUTENSUCHE  (plan -> HAFAS-journeys-Form)
// ==========================================

// fromPlace/toPlace: MOTIS akzeptiert "lat,lon" ODER Stop-ID
async function transitousPlace(station) {
    if (station.id && station.id.startsWith(TRANSITOUS_ID_PREFIX)) {
        return station.id.slice(TRANSITOUS_ID_PREFIX.length);
    }
    if (station.lat != null && station.lon != null) {
        return `${station.lat},${station.lon}`;
    }
    const matches = await transitousFetch(
        `/v1/geocode?text=${encodeURIComponent(station.name)}&type=STOP&place=${geocodeBias()}&numResults=1`,
        6 * 60 * 60 * 1000
    );
    if (!matches || matches.length === 0) throw new Error('Station bei Transitous nicht gefunden');
    return matches[0].id;
}

async function transitousJourneys(fromStation, toStation, { timeISO = null, arriveBy = false, products = null, pageCursor = null } = {}) {
    const fromPlace = await transitousPlace(fromStation);
    const toPlace = await transitousPlace(toStation);

    let url = `/v6/plan?fromPlace=${encodeURIComponent(fromPlace)}` +
              `&toPlace=${encodeURIComponent(toPlace)}` +
              `&maxTransfers=3&minTransferTime=5`;
    if (timeISO) url += `&time=${encodeURIComponent(timeISO)}&arriveBy=${arriveBy}`;
    if (products) url += `&transitModes=${productsToMotisModes(products)}`;
    // Blättern: Cursor aus der vorherigen Antwort ("Früher"/"Später")
    if (pageCursor) url += `&pageCursor=${encodeURIComponent(pageCursor)}`;

    // 30s Cache: identische Suche direkt hintereinander = 1 Request
    const data = await transitousFetch(url, 30000);

    const journeys = (data.itineraries || []).map(it => ({
        legs: (it.legs || []).map(leg => {
            const isWalk = leg.mode === 'WALK' || leg.mode === 'BIKE';
            return {
                walking: isWalk,
                line: isWalk ? undefined : {
                    name: leg.routeShortName || leg.displayName || leg.mode,
                    product: motisModeToProduct(leg.mode),
                    color: motisColor(leg.routeColor),
                    textColor: motisColor(leg.routeTextColor)
                },
                direction: leg.headsign || '',
                origin: { name: leg.from?.name || '?' },
                destination: { name: leg.to?.name || '?' },
                departure: leg.startTime,
                plannedDeparture: leg.scheduledStartTime,
                arrival: leg.endTime,
                plannedArrival: leg.scheduledEndTime,
                departurePlatform: leg.from?.track || null,
                arrivalPlatform: leg.to?.track || null,
                // Zwischenhalte (kamen bisher mit und wurden weggeworfen)
                stopovers: (leg.intermediateStops || []).map(s => ({
                    stop: { name: s.name },
                    arrival: s.arrival || s.departure || null,
                    plannedArrival: s.scheduledArrival || s.scheduledDeparture || null
                }))
            };
        })
    }));

    return {
        journeys,
        previousPageCursor: data.previousPageCursor || null,
        nextPageCursor: data.nextPageCursor || null
    };
}


// ==========================================
// STATIONEN IN DER NÄHE  (map/stops -> HAFAS-nearby-Form)
// GPS-Button: Stops in ~600m-Box um die Position, nach Distanz sortiert
// ==========================================
async function transitousNearby(lat, lon) {
    const d = 0.006; // ~600m in Grad (Berlin-Breite)
    const stops = await transitousFetch(
        `/v6/map/stops?min=${(lat - d).toFixed(4)},${(lon - d).toFixed(4)}` +
        `&max=${(lat + d).toFixed(4)},${(lon + d).toFixed(4)}`,
        5 * 60 * 1000 // 5min Cache
    );

    const withDistance = (stops || [])
        .filter(s => s.stopId && s.lat != null && s.lon != null)
        .map(s => ({
            type: 'stop',
            id: TRANSITOUS_ID_PREFIX + s.stopId,
            name: s.name,
            location: { latitude: s.lat, longitude: s.lon },
            products: {},
            // Näherung reicht zum Sortieren (Haversine wäre Overkill für <1km)
            distance: Math.round(Math.sqrt(
                Math.pow((s.lat - lat) * 111320, 2) +
                Math.pow((s.lon - lon) * 111320 * Math.cos(lat * Math.PI / 180), 2)
            ))
        }))
        .sort((a, b) => a.distance - b.distance);

    return withDistance;
}

// ==========================================
// TRIP-DETAILS  (trip -> HAFAS-trip-Form mit stopovers)
// ==========================================
async function transitousTrip(tripId) {
    const rawId = tripId.startsWith(TRANSITOUS_ID_PREFIX)
        ? tripId.slice(TRANSITOUS_ID_PREFIX.length) : tripId;
    const itinerary = await transitousFetch(
        `/v6/trip?tripId=${encodeURIComponent(rawId)}`,
        60000 // 60s Cache
    );

    // Der Trip kommt als Itinerary mit genau einem Transit-Leg
    const leg = (itinerary.legs || []).find(l => l.mode !== 'WALK') || (itinerary.legs || [])[0];
    if (!leg) return { trip: null };

    const placeToStopover = (p) => ({
        stop: { id: TRANSITOUS_ID_PREFIX + (p.stopId || ''), name: p.name },
        arrival: p.arrival || null,
        departure: p.departure || null,
        plannedArrival: p.scheduledArrival || null,
        plannedDeparture: p.scheduledDeparture || null,
        arrivalDelay: motisDelaySeconds(p.arrival, p.scheduledArrival),
        departureDelay: motisDelaySeconds(p.departure, p.scheduledDeparture)
    });

    const stopovers = [
        placeToStopover(leg.from || {}),
        ...(leg.intermediateStops || []).map(placeToStopover),
        placeToStopover(leg.to || {})
    ];

    return { trip: { stopovers } };
}

// Stationen im Kartenausschnitt (für die Stations-Punkte auf der Live-Map).
// Koordinaten gerundet -> stabile Cache-Keys, 5min TTL.
async function transitousMapStops(bounds) {
    const stops = await transitousFetch(
        `/v6/map/stops?min=${bounds.south.toFixed(3)},${bounds.west.toFixed(3)}` +
        `&max=${bounds.north.toFixed(3)},${bounds.east.toFixed(3)}`,
        5 * 60 * 1000
    );
    return (stops || [])
        .filter(s => s.stopId && s.lat != null && s.lon != null)
        .map(s => ({
            id: TRANSITOUS_ID_PREFIX + s.stopId,
            name: s.name,
            lat: s.lat,
            lon: s.lon
        }));
}

// Kompletter Streckenverlauf einer Fahrt (für die Live-Map).
// map/trips liefert nur das Segment im Kartenausschnitt - die GANZE
// Route steckt in der legGeometry des /trip-Endpoints. Gleiche URL wie
// transitousTrip -> geteilter 60s-Cache, Details+Route = 1 Request.
async function transitousTripGeometry(tripId) {
    const rawId = tripId.startsWith(TRANSITOUS_ID_PREFIX)
        ? tripId.slice(TRANSITOUS_ID_PREFIX.length) : tripId;
    const itinerary = await transitousFetch(
        `/v6/trip?tripId=${encodeURIComponent(rawId)}`,
        60000
    );

    const leg = (itinerary.legs || []).find(l => l.mode !== 'WALK') || (itinerary.legs || [])[0];
    if (!leg || !leg.legGeometry || !leg.legGeometry.points) return null;

    const precision = leg.legGeometry.precision || 6;
    const points = decodePolyline(leg.legGeometry.points, precision);
    if (points.length < 2) return null;

    return {
        points,
        color: motisColor(leg.routeColor)
    };
}

// ==========================================
// RADAR / LIVE-MAP  (map/trips -> HAFAS-radar-Form)
//
// MOTIS liefert keine Punkt-Positionen, sondern Fahrt-SEGMENTE mit
// Polyline + Abfahrts-/Ankunftszeit. Die aktuelle Fahrzeugposition wird
// zeitlich entlang der Polyline interpoliert (so macht es die
// Transitous-Web-Karte selbst auch).
// ==========================================

// Google-Polyline dekodieren. Die Precision variiert je Endpoint:
// map/trips liefert 5, legGeometry (trip/plan) liefert precision als Feld mit.
function decodePolyline(encoded, precision = 5) {
    const factor = Math.pow(10, precision);
    const points = [];
    let index = 0, lat = 0, lon = 0;
    while (index < encoded.length) {
        for (const which of [0, 1]) {
            let result = 0, shift = 0, byte;
            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            const delta = (result & 1) ? ~(result >> 1) : (result >> 1);
            if (which === 0) lat += delta; else lon += delta;
        }
        points.push([lat / factor, lon / factor]);
    }
    return points;
}

// Kompatibilitäts-Alias (Tests + map/trips)
function decodePolyline5(encoded) {
    return decodePolyline(encoded, 5);
}

async function transitousRadarSegments(bounds, zoom) {
    const now = new Date();
    const path = `/v6/map/trips?zoom=${Math.round(zoom)}` +
        `&min=${bounds.south.toFixed(3)},${bounds.west.toFixed(3)}` +
        `&max=${bounds.north.toFixed(3)},${bounds.east.toFixed(3)}` +
        `&startTime=${encodeURIComponent(now.toISOString())}` +
        `&endTime=${encodeURIComponent(new Date(now.getTime() + 90000).toISOString())}`;

    // 25s Cache: passt zum 30s-Polling, fängt Karten-Gezappel ab
    const raw = await transitousFetch(path, 25000);

    // Normalisieren: Polyline einmal dekodieren, Zeiten als ms.
    // Die Live-Map interpoliert daraus jede Sekunde die Position LOKAL -
    // flüssige Bewegung ohne einen einzigen zusätzlichen API-Call.
    const segments = [];
    for (const seg of (raw || [])) {
        const depMs = new Date(seg.departure).getTime();
        const arrMs = new Date(seg.arrival).getTime();
        if (!Number.isFinite(depMs) || !Number.isFinite(arrMs) || !seg.polyline) continue;

        let points;
        try { points = decodePolyline5(seg.polyline); } catch (e) { continue; }
        if (points.length === 0) continue;

        const trip = (seg.trips && seg.trips[0]) || {};
        segments.push({
            tripId: trip.tripId || `${seg.mode}-${depMs}-${points[0][0].toFixed(4)}`,
            lineName: trip.routeShortName || trip.displayName || '?',
            product: motisModeToProduct(seg.mode),
            color: motisColor(seg.routeColor),
            direction: seg.to?.name || '',
            delay: motisDelaySeconds(seg.departure, seg.scheduledDeparture),
            depMs, arrMs, points
        });
    }
    return segments;
}

// Aktuelle Position eines Segments zum Zeitpunkt nowMs (lineare Interpolation
// zwischen den Polyline-Punkten - genauer als nur den nächsten Punkt zu wählen)
function segmentPositionAt(seg, nowMs) {
    if (nowMs < seg.depMs || nowMs > seg.arrMs) return null; // fährt gerade nicht
    const pts = seg.points;
    if (pts.length === 1) return { latitude: pts[0][0], longitude: pts[0][1] };

    const frac = seg.arrMs > seg.depMs ? (nowMs - seg.depMs) / (seg.arrMs - seg.depMs) : 0;
    const scaled = frac * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(scaled));
    const t = scaled - i;
    return {
        latitude: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
        longitude: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
    };
}
