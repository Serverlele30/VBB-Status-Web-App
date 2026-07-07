// VBB Netz Status - API-Schicht, Rate-Limiting, Cache, Persistenz, Favoriten

// ==========================================
// VBB NETZ STATUS - Haupt-Script
// ==========================================

        // ZENTRALE VERSIONSNUMMER - einzige Stelle, die bei Releases
        // angepasst wird. Alle Anzeigen (Startseite, Entwickler-Tab)
        // lesen von hier; package.json + SW-Cache-Name manuell mitziehen.
        const APP_VERSION = '37.2.0';
        const APP_RELEASE_DATE = '07.07.2026';

        // Seit v35: Transitous (api.transitous.org) ist die einzige
        // Datenquelle. transport.rest (VBB/BVG) wurde komplett entfernt.
        // Die konkreten Endpoints kapselt js/transitous.js.
        let currentStationId = null;
        let currentStationName = null;
        let searchTimeout = null;
        let touchStartY = 0;
        let isPulling = false;
        let autoRefreshInterval = null;

        // --- Geteilter App-Zustand (von mehreren Modulen genutzt) ---
        // Zentral hier deklariert, damit KEIN Modul auf Variablen aus
        // später geladenen Dateien angewiesen ist.
        let currentView = 'home';
        let departuresCount = 20;       // Wie viele Abfahrten laden ("Mehr laden" erhöht)
        let currentStationLat = null;   // Koordinaten der gewählten Station
        let currentStationLon = null;   // (für Transitous-Fallback ohne ID-Mapping)
        let liveMap = null;
        let liveMapUpdateInterval = null;
        let activeVehicleTypes = new Set(['all']);
        let debounceTimer = null;
        let liveMapSegments = [];        // Fahrt-Segmente von Transitous (für lokale Animation)
        let liveMapAnimationInterval = null; // 1s-Loop: Positionen lokal interpolieren
        const vehicleMarkerMap = new Map(); // tripId -> { marker, lineName }
        let activeTransportModes = new Set(['subway', 'suburban', 'tram', 'bus', 'regional', 'express']);

        // ==========================================
        // ZENTRALE API-SCHICHT
        // - Rate-Limit: max. 90 Requests/Minute (API erlaubt 100, wir lassen Puffer)
        // - Response-Cache mit TTL pro Endpoint (spart massiv Requests)
        // - Dedupe: identische parallele Requests werden nur 1x gefeuert
        // ==========================================
        const API_SOFT_LIMIT = 90;          // Max. Requests pro Minute (Budget)
        const apiCallTimestamps = [];       // Zeitstempel echter Requests
        const apiCache = new Map();         // url -> { data, time, ttl }
        const apiInflight = new Map();      // url -> Promise (laufende Requests)
        const API_CACHE_MAX_ENTRIES = 300;  // Speicher begrenzen

        function pruneApiTimestamps() {
            const cutoff = Date.now() - 60000;
            while (apiCallTimestamps.length && apiCallTimestamps[0] <= cutoff) {
                apiCallTimestamps.shift();
            }
        }

        // Wie viele Requests sind in der aktuellen Minute noch frei?
        function apiBudgetLeft() {
            pruneApiTimestamps();
            return API_SOFT_LIMIT - apiCallTimestamps.length;
        }

        // Nicht-verbrauchende Prüfung (für UI-Vorabchecks)
        function canMakeApiCall() {
            return apiBudgetLeft() > 0;
        }

        /**
         * Zentraler API-Aufruf.
         * @param {string} url - vollständige URL
         * @param {object} opts - { ttl: Cache-Dauer in ms (0 = kein Cache) }
         * @returns {Promise<any>} JSON-Daten
         * Wirft Error('RATE_LIMIT') wenn Budget aufgebraucht (Cache wird trotzdem genutzt).
         */
        /**
         * Zentraler API-Aufruf.
         * - Budget: max. 90 Requests/Minute (Selbstschutz gegenüber Transitous)
         * - Response-Cache mit TTL, Dedupe paralleler identischer Requests
         * - Timeout 12s pro Request
         * - Störungs-Banner bei Ausfall, automatisches Ausblenden bei Erholung
         * - Bei Fehler oder leerem Budget wird notfalls abgelaufener Cache geliefert
         *
         * @param {string} url - vollständige URL
         * @param {object} opts - { ttl: Cache-Dauer in ms (0 = kein Cache) }
         */
        async function apiFetch(url, { ttl = 0 } = {}) {
            // 1) Frischer Cache-Treffer? -> kein Request nötig
            const cached = apiCache.get(url);
            if (cached && (Date.now() - cached.time) < cached.ttl) {
                return cached.data;
            }

            // 2) Läuft derselbe Request bereits? -> Promise wiederverwenden
            if (apiInflight.has(url)) {
                return apiInflight.get(url);
            }

            // 3) Budget prüfen; wenn leer, notfalls abgelaufenen Cache liefern
            if (apiBudgetLeft() <= 0) {
                if (cached) {
                    console.warn('Rate-Limit erreicht – liefere veraltete Cache-Daten für', url);
                    return cached.data;
                }
                throw new Error('RATE_LIMIT');
            }

            apiCallTimestamps.push(Date.now());

            const promise = (async () => {
                try {
                    const response = await fetchWithTimeout(url, 12000);

                    if (!response.ok) {
                        const err = new Error('HTTP ' + response.status);
                        // 4xx = Anfragefehler, kein API-Ausfall -> kein Banner
                        if (response.status >= 500) showApiOutageBanner();
                        throw err;
                    }

                    const data = await response.json();

                    if (ttl > 0) {
                        // Cache-Größe begrenzen (ältesten Eintrag entfernen)
                        if (apiCache.size >= API_CACHE_MAX_ENTRIES) {
                            const oldestKey = apiCache.keys().next().value;
                            apiCache.delete(oldestKey);
                        }
                        apiCache.set(url, { data, time: Date.now(), ttl });
                    }
                    hideApiOutageBanner(); // API antwortet -> alles gut
                    return data;

                } catch (e) {
                    if (!/^HTTP 4/.test(e.message || '')) {
                        // Netzwerkfehler/Timeout/5xx -> Störung anzeigen,
                        // notfalls alten Cache liefern
                        showApiOutageBanner();
                        if (cached) {
                            console.warn('API nicht erreichbar – liefere veraltete Cache-Daten');
                            return cached.data;
                        }
                    }
                    throw e;
                }
            })().finally(() => apiInflight.delete(url));

            apiInflight.set(url, promise);
            return promise;
        }

        // fetch mit hartem Timeout (hängende Verbindungen brechen sauber ab)
        async function fetchWithTimeout(realUrl, ms) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), ms);
            try {
                return await fetch(realUrl, { signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        }

        // ==========================================
        // GLOBALES STÖRUNGS-BANNER
        // Erscheint, wenn primäre UND Fallback-API versagen
        // (z.B. Wartung/Ausfall bei Transitous).
        // Verschwindet automatisch beim nächsten erfolgreichen Request.
        // ==========================================
        function showApiOutageBanner() {
            let banner = document.getElementById('apiOutageBanner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'apiOutageBanner';
                banner.className = 'api-outage-banner';
                banner.setAttribute('role', 'alert');
                banner.innerHTML =
                    '⚠️ <strong>Datenanbieter gestört</strong> – Transitous ' +
                    '(transitous.org) ist aktuell nicht erreichbar. ' +
                    'Die App versucht es automatisch weiter.';
                document.body.prepend(banner);
            }
            banner.style.display = '';
        }

        function hideApiOutageBanner() {
            const banner = document.getElementById('apiOutageBanner');
            if (banner) banner.style.display = 'none';
        }

        // HTML-Escaping für alle Strings aus der API (XSS-Schutz)
        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // ==========================================
        // LOKALE PERSISTENZ (localStorage)
        // ==========================================
        const STORAGE_KEYS = {
            favorites: 'vbb_favorites',
            lastStation: 'vbb_last_station',
            lastJourney: 'vbb_last_journey',
            depCachePrefix: 'vbb_dep_cache_'
        };

        function storageGet(key, fallback = null) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (e) {
                return fallback;
            }
        }

        function storageSet(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                // Quota voll oder localStorage blockiert -> App läuft ohne Persistenz weiter
                console.warn('localStorage nicht verfügbar:', e.message);
            }
        }

        // --- Favoriten ---
        const MAX_FAVORITES = 10;

        function getFavorites() {
            return storageGet(STORAGE_KEYS.favorites, []);
        }

        function isFavorite(stationId) {
            return getFavorites().some(f => f.id === stationId);
        }

        function toggleFavorite(stationId, stationName) {
            let favorites = getFavorites();
            if (favorites.some(f => f.id === stationId)) {
                favorites = favorites.filter(f => f.id !== stationId);
            } else {
                favorites.unshift({
                    id: stationId, name: stationName,
                    lat: currentStationLat, lon: currentStationLon
                });
                favorites = favorites.slice(0, MAX_FAVORITES);
            }
            storageSet(STORAGE_KEYS.favorites, favorites);
            renderFavorites();
            updateFavoriteButton();
            return isFavorite(stationId);
        }

        // Favoriten rendern - an ZWEI Stellen:
        // 1) Abfahrten-View: ALLE Favoriten als wischbare Chip-Reihe
        //    (1-Tap-Wechsel zwischen Stationen, aktive Station markiert)
        // 2) Startseite: kompakt nur die Top 3 + "Alle anzeigen"
        function renderFavorites() {
            const favorites = getFavorites();

            // --- Abfahrten-View: Chips ---
            const chipsContainer = document.getElementById('departureFavorites');
            if (chipsContainer) {
                if (favorites.length === 0) {
                    chipsContainer.innerHTML = '';
                    chipsContainer.style.display = 'none';
                } else {
                    chipsContainer.style.display = 'block';
                    chipsContainer.innerHTML = `
                        <div class="filter-label">⭐ Deine Stationen</div>
                        <div class="filter-chips">
                            ${favorites.map(f => `
                                <button class="fav-chip ${f.id === currentStationId ? 'active' : ''}"
                                        data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}"
                                        data-lat="${f.lat != null ? f.lat : ''}" data-lon="${f.lon != null ? f.lon : ''}"
                                        aria-label="Abfahrten für ${escapeHtml(f.name)} anzeigen">
                                    ${escapeHtml(f.name)}
                                </button>
                            `).join('')}
                        </div>
                    `;
                }
            }

            // --- Startseite: kompakte Top 3 ---
            const container = document.getElementById('homeFavorites');
            if (!container) return;

            if (favorites.length === 0) {
                container.innerHTML = '';
                container.style.display = 'none';
                return;
            }

            const top = favorites.slice(0, 3);
            const rest = favorites.length - top.length;

            container.style.display = '';
            container.innerHTML = `
                <div class="home-favorites-title">⭐ Deine Stationen</div>
                <div class="home-favorites-list">
                    ${top.map(f => `
                        <button class="home-favorite-item" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}"
                                data-lat="${f.lat != null ? f.lat : ''}" data-lon="${f.lon != null ? f.lon : ''}"
                                aria-label="Abfahrten für ${escapeHtml(f.name)} anzeigen">
                            <span class="home-favorite-name">${escapeHtml(f.name)}</span>
                            <span class="home-favorite-arrow" aria-hidden="true">→</span>
                        </button>
                    `).join('')}
                    ${rest > 0 ? `
                        <button class="home-favorite-item home-favorites-more" id="homeShowAllFavs"
                                aria-label="Alle Favoriten in der Abfahrten-Ansicht zeigen">
                            <span class="home-favorite-name">Alle ${favorites.length} Stationen anzeigen</span>
                            <span class="home-favorite-arrow" aria-hidden="true">→</span>
                        </button>` : ''}
                </div>
            `;
        }

        // Stern-Button in der Abfahrten-View aktualisieren
        function updateFavoriteButton() {
            const btn = document.getElementById('favoriteBtn');
            if (!btn) return;
            if (!currentStationId) {
                btn.style.display = 'none';
                return;
            }
            btn.style.display = '';
            const fav = isFavorite(currentStationId);
            btn.textContent = fav ? '⭐' : '☆';
            btn.setAttribute('aria-pressed', String(fav));
            btn.title = fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen';
        }

        // --- Abfahrten-Cache für Offline-Modus ---
        function saveDeparturesCache(stationId, departures) {
            storageSet(STORAGE_KEYS.depCachePrefix + stationId, {
                departures,
                time: Date.now()
            });
        }

        function loadDeparturesCache(stationId) {
            return storageGet(STORAGE_KEYS.depCachePrefix + stationId, null);
        }

        function formatAge(timestamp) {
            const mins = Math.round((Date.now() - timestamp) / 60000);
            if (mins < 1) return 'gerade eben';
            if (mins === 1) return 'vor 1 Minute';
            if (mins < 60) return `vor ${mins} Minuten`;
            const hours = Math.round(mins / 60);
            return hours === 1 ? 'vor 1 Stunde' : `vor ${hours} Stunden`;
        }

