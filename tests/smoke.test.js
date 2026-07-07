const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const moduleFiles = ['js/api.js', 'js/transitous.js', 'js/app.js', 'js/livemap.js', 'js/changelog.js', 'js/extras.js'];

const cleanHtml = html
    .replace(/<script[^>]*src=[^>]*><\/script>/g, '')
    .replace(/<link[^>]*>/g, '');

const errors = [];
const dom = new JSDOM(cleanHtml, {
    url: 'https://localhost:3000/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
});
const { window } = dom;
window.addEventListener('error', (e) => errors.push('window.error: ' + e.message));

// --- Mocks ---
let lastJourneyUrl = null;
window.fetch = (url) => {
    const u = String(url);
    if (u.includes('/plan')) lastJourneyUrl = u;
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(
            u.includes('/geocode') ? []
            : u.includes('/stoptimes') ? { stopTimes: [], place: {} }
            : u.includes('/plan') ? { itineraries: [] }
            : u.includes('/map/') ? []
            : {}
        ),
        text: () => Promise.resolve('# Changelog\n## v35')
    });
};
window.navigator.vibrate = () => true;
const mm = () => ({ matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
window.matchMedia = mm;
const fakeLayer = {
    addTo: () => fakeLayer, remove: () => {}, bindPopup: () => fakeLayer,
    on: () => fakeLayer, setLatLng: () => fakeLayer, setPopupContent: () => fakeLayer
};
window.L = {
    polyline: () => fakeLayer,
    map: () => ({
        setView(){ return this; }, on(){ return this; }, invalidateSize(){}, getZoom: () => 12,
        getBounds: () => ({ getNorth:()=>52.6, getSouth:()=>52.4, getEast:()=>13.6, getWest:()=>13.2 })
    }),
    tileLayer: () => fakeLayer, marker: () => fakeLayer, divIcon: () => ({})
};
Object.defineProperty(window.navigator, 'serviceWorker', {
    value: { register: () => Promise.resolve({}) }, configurable: true
});

// --- Module in Ladereihenfolge ausführen ---
// Verkettet ausgeführt: entspricht dem gemeinsamen globalen Scope
// klassischer <script>-Tags. Test-Hook (__t) nutzt direktes eval,
// um auf den Modul-Scope zugreifen zu können.
const combined = moduleFiles
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n;\n') + '\n;window.__t = (c) => eval(c);';
try {
    window.eval(combined);
    console.log('✅ Alle 5 Module geladen (verketteter Scope)');
} catch (e) {
    errors.push('Module: ' + e.message);
    console.log('❌ Module:', e.message);
}

try {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
    console.log('✅ DOMContentLoaded ohne Fehler');
} catch (e) {
    errors.push('DOMContentLoaded: ' + e.message);
}

setTimeout(() => {
    const doc = window.document;

    // 1) Views durchklicken
    doc.querySelectorAll('.nav-item').forEach(item => {
        item.click();
        const target = doc.getElementById('view-' + item.dataset.view);
        if (!target?.classList.contains('active')) errors.push('View kaputt: ' + item.dataset.view);
    });
    console.log('✅ Alle 5 Views schaltbar');

    // 2) Favoriten: toggle + Rendering auf Home
    window.__t(`
        currentStationId = '900000100003';
        currentStationName = 'S+U Alexanderplatz';
        toggleFavorite(currentStationId, currentStationName);
    `);
    const favItems = doc.querySelectorAll('.home-favorite-item');
    if (favItems.length !== 1) errors.push('Favorit nicht gerendert');
    else console.log('✅ Favorit gespeichert & auf Home gerendert:', favItems[0].dataset.name);

    // 3) Persistenz: localStorage-Inhalte prüfen
    const stored = JSON.parse(window.localStorage.getItem('vbb_favorites') || '[]');
    if (stored.length !== 1 || stored[0].name !== 'S+U Alexanderplatz') errors.push('localStorage Favoriten falsch');
    else console.log('✅ localStorage enthält Favorit');

    // 4) Favorit-Klick -> Abfahrten-View + Station gesetzt
    favItems[0]?.click();
    if (!doc.getElementById('view-departures').classList.contains('active')) errors.push('Favorit-Klick öffnet Abfahrten nicht');
    else console.log('✅ Favorit-Klick öffnet Abfahrten-View');

    // 5) Journey: Filter + Zeitwahl in der URL
    window.__t(`
        journeyFromStation = { id: 'A1', name: 'Start', lat: 52.47, lon: 13.36 };
        journeyToStation = { id: 'B2', name: 'Ziel', lat: 52.52, lon: 13.41 };
        activeTransportModes.delete('bus');
        document.getElementById('journeyTimeInput').value = '2026-07-04T10:30';
        document.getElementById('journeyTimeMode').value = 'arrival';
        document.getElementById('searchJourneyBtn').disabled = false;
    `);
    doc.getElementById('searchJourneyBtn').click();

    setTimeout(async () => {
        if (!lastJourneyUrl) errors.push('Journey-Suche feuerte nicht');
        else {
            if (lastJourneyUrl.includes('BUS') || !lastJourneyUrl.includes('SUBWAY')) errors.push('Transport-Filter fehlt/falsch in plan-URL');
            else console.log('✅ Verkehrsmittel-Filter in plan-URL (ohne BUS)');
            if (!lastJourneyUrl.includes('arriveBy=true') || !lastJourneyUrl.includes('time=')) errors.push('Zeitwahl fehlt in plan-URL');
            else console.log('✅ Zeitwahl in plan-URL (arriveBy=true)');
        }

        // 6) Offline-Cache: Abfahrten-Cache in localStorage nach Fehler nutzbar?
        const cacheOk = window.__t(`
            saveDeparturesCache('TEST', [{when: new Date().toISOString(), line: {name: 'U2'}}]);
            const c = loadDeparturesCache('TEST');
            c && c.departures.length === 1;
        `);
        if (!cacheOk) errors.push('Offline-Cache defekt');
        else console.log('✅ Offline-Abfahrten-Cache funktioniert');

        // 7) Totalausfall: beide APIs down -> Banner erscheint
        const origFetch = window.fetch;
        window.fetch = () => Promise.reject(new TypeError('NetworkError'));
        window.__t(`apiCache.clear();`);
        window.__t(`apiFetch('https://v6.vbb.transport.rest/locations?query=test&results=1', { ttl: 0 }).catch(() => {})`);
        await new Promise(r => setTimeout(r, 100));
        const banner = doc.getElementById('apiOutageBanner');
        if (!banner || banner.style.display === 'none') errors.push('Outage-Banner erscheint nicht');
        else console.log('✅ Totalausfall beider APIs -> Störungs-Banner erscheint');

        // 8) API erholt sich -> Banner verschwindet
        window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        window.__t(`apiFetch('https://v6.vbb.transport.rest/locations?query=test2&results=1', { ttl: 0 }).catch(() => {})`);
        await new Promise(r => setTimeout(r, 100));
        if (doc.getElementById('apiOutageBanner').style.display !== 'none') errors.push('Banner verschwindet nicht nach Erholung');
        else console.log('✅ API-Erholung -> Banner verschwindet automatisch');
        window.fetch = origFetch;

        // 9) Abfahrten über Transitous (einzige Datenquelle)
        window.fetch = (url) => {
            const u = String(url);
            if (u.includes('api.transitous.org') && u.includes('/stoptimes')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ stopTimes: [{
                    place: { name: 'Testhalt', departure: '2026-07-06T10:05:00+02:00',
                             scheduledDeparture: '2026-07-06T10:03:00+02:00', track: '1' },
                    mode: 'TRAM', headsign: 'Testziel', routeShortName: 'M10',
                    tripId: 'tt1', realTime: true, cancelled: false, tripCancelled: false
                }], place: {} }) });
            }
            return Promise.reject(new TypeError('NetworkError'));
        };
        window.__t(`
            apiCache.clear();
            currentStationId = '900100003'; currentStationName = 'Teststation';
            currentStationLat = 52.52; currentStationLon = 13.41;
        `);
        window.__t('loadDepartures()');
        await new Promise(r => setTimeout(r, 200));
        const depHtml = doc.getElementById('departuresContainer').innerHTML;
        if (!depHtml.includes('M10') || !depHtml.includes('Testziel')) {
            errors.push('Abfahrten über Transitous werden nicht gerendert');
        } else console.log('✅ Abfahrten kommen über Transitous (stoptimes -> Renderer)');

        // 10) Stationssuche über Transitous (geocode)
        window.__t(`apiCache.clear();`);
        window.fetch = (url) => {
            const u = String(url);
            if (u.includes('/geocode')) return Promise.resolve({ ok: true, json: () => Promise.resolve([
                { type: 'STOP', name: 'Amrumer Str.', id: 'de-DELFI_de:11000:900009202', lat: 52.542, lon: 13.349, tokens: [], areas: [], score: 1 }
            ]) });
            return Promise.reject(new TypeError('NetworkError'));
        };
        doc.getElementById('stationSearch').value = 'Amrumer';
        doc.getElementById('stationSearch').dispatchEvent(new window.Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 600));
        const sugHtml = doc.getElementById('suggestions').innerHTML;
        if (!sugHtml.includes('Amrumer')) errors.push('Suche über Transitous liefert keine Vorschläge');
        else console.log('✅ Stationssuche über Transitous (geocode -> Vorschläge)');
        window.fetch = origFetch;

        // 11) Abfahrten-Filter: filtert wirklich + Auto-Refresh respektiert Filter
        window.__t(`
            allDepartures = [];
            displayDepartures([
                { tripId: 't1', direction: 'A', when: new Date(Date.now()+300000).toISOString(), line: { name: 'U2', product: 'subway' } },
                { tripId: 't2', direction: 'B', when: new Date(Date.now()+400000).toISOString(), line: { name: '100', product: 'bus' } }
            ]);
        `);
        const filterBar = doc.getElementById('departureFilters');
        if (filterBar.style.display === 'none') errors.push('Filterleiste erscheint nicht');
        else console.log('✅ Filterleiste erscheint bei Abfahrten');

        doc.querySelector('.departure-filters .filter-btn[data-filter="subway"]').click();
        await new Promise(r => setTimeout(r, 50));
        const shown = doc.querySelectorAll('#departuresContainer .departure-item');
        const onlySubway = shown.length === 1 && shown[0].dataset.tripId === 't1';
        if (!onlySubway) errors.push('Abfahrten-Filter filtert nicht (U-Bahn-Filter zeigt ' + shown.length + ' Items)');
        else console.log('✅ Abfahrten-Filter: U-Bahn-Filter zeigt nur U2');

        // Mehr-laden-Button vorhanden?
        if (!doc.getElementById('loadMoreDepartures')) errors.push('Mehr-laden-Button fehlt');
        else console.log('✅ "Mehr Abfahrten laden"-Button gerendert');

        // 12) Versions-Konsistenz: APP_VERSION == package.json == SW-Cache + Anzeigen befüllt
        const pkgVersion = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
        const appVersion = window.__t('APP_VERSION');
        const swSrc = fs.readFileSync(path.join(dir, 'service-worker.js'), 'utf8');
        if (appVersion !== pkgVersion) errors.push(`Version inkonsistent: APP_VERSION=${appVersion} vs package.json=${pkgVersion}`);
        else if (!swSrc.includes(`vbb-status-v${appVersion}`)) errors.push('SW-Cache-Name passt nicht zu APP_VERSION');
        else console.log('✅ Version konsistent überall:', appVersion);
        const hv = doc.getElementById('homeVersion');
        if (!hv || hv.textContent !== 'v' + appVersion) errors.push('homeVersion nicht befüllt');
        else console.log('✅ Versions-Anzeigen aus APP_VERSION befüllt');

        // 13) Favoriten-Chips in der Abfahrten-View + kompakte Startseite
        window.__t(`
            localStorage.setItem('vbb_favorites', JSON.stringify([
                { id: 'f1', name: 'Station Eins' }, { id: 'f2', name: 'Station Zwei' },
                { id: 'f3', name: 'Station Drei' }, { id: 'f4', name: 'Station Vier' }
            ]));
            currentStationId = 'f2';
            renderFavorites();
        `);
        const chips = doc.querySelectorAll('#departureFavorites .fav-chip');
        const activeChip = doc.querySelector('#departureFavorites .fav-chip.active');
        if (chips.length !== 4) errors.push(`Abfahrten-Chips: ${chips.length} statt 4`);
        else if (!activeChip || activeChip.dataset.id !== 'f2') errors.push('Aktiver Chip nicht markiert');
        else console.log('✅ Favoriten-Chips in Abfahrten-View (4 Chips, aktive markiert)');

        const homeItems = doc.querySelectorAll('#homeFavorites .home-favorite-item:not(.home-favorites-more)');
        const moreBtn = doc.getElementById('homeShowAllFavs');
        if (homeItems.length !== 3 || !moreBtn) errors.push('Startseite nicht kompakt (Top 3 + Alle anzeigen)');
        else console.log('✅ Startseite kompakt: Top 3 + "Alle anzeigen"-Button');

        console.log('✅ Struktur-Checks abgeschlossen');

        if (errors.length === 0) {
            console.log('\n🎉 ALLE TESTS BESTANDEN');
            process.exit(0);
        } else {
            console.log('\n❌ FEHLER:');
            errors.forEach(e => console.log('  -', e));
            process.exit(1);
        }
    }, 300);
}, 300);
