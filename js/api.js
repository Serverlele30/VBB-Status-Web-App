// VBB Netz Status - API-Schicht, Rate-Limiting, Cache, Persistenz, Favoriten

// ==========================================
// VBB NETZ STATUS - Haupt-Script
// ==========================================

        // Primäre API + baugleicher Fallback (gleicher Betreiber, gleiche
        // Routen/Stop-IDs, andere Upstream-Quelle - siehe apiFetch)
        const API_BASES = [
            'https://v6.vbb.transport.rest',
            'https://v6.bvg.transport.rest'
        ];
        const API_BASE = API_BASES[0];   // Call-Sites bauen URLs immer mit der primären Basis
        let activeApiBaseIndex = 0;      // 0 = VBB, 1 = BVG-Fallback
        let apiFallbackSince = 0;        // Zeitpunkt des Failovers (für Recovery)
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
        let liveMap = null;
        let liveMapUpdateInterval = null;
        let activeVehicleTypes = new Set(['all']);
        let debounceTimer = null;
        let lastVehicleMovements = [];  // Letzte Radar-Daten für lokales Filtern
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
         * Zentraler API-Aufruf mit automatischem Failover.
         *
         * Primär:   v6.vbb.transport.rest
         * Fallback: v6.bvg.transport.rest (gleicher Betreiber, identische
         *           Routen & Stop-IDs, deckt ebenfalls ganz Berlin/Brandenburg
         *           ab - nutzt aber eine ANDERE Upstream-Quelle. Fällt VBB
         *           aus, läuft die App über BVG weiter.)
         *
         * - Timeout 12s pro Versuch (hängende Requests blockieren nichts)
         * - Failover bei Netzwerkfehler, Timeout oder HTTP 5xx
         *   (NICHT bei 4xx - das ist ein Anfragefehler, kein API-Ausfall)
         * - Nach 10 Minuten auf dem Fallback wird die primäre API erneut probiert
         * - Cache-Keys basieren auf der primären URL -> Cache übersteht Failover
         *
         * @param {string} url - vollständige URL (mit API_BASE gebaut)
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

            const promise = (async () => {
                // Recovery: Nach 10 min auf dem Fallback wieder primär versuchen
                if (activeApiBaseIndex !== 0 &&
                    Date.now() - apiFallbackSince > 10 * 60 * 1000) {
                    activeApiBaseIndex = 0;
                    console.warn('API-Failover: Versuche wieder die primäre VBB-API');
                }

                const tryOrder = activeApiBaseIndex === 0 ? [0, 1] : [1, 0];
                let lastError = null;

                for (const idx of tryOrder) {
                    const realUrl = url.replace(API_BASES[0], API_BASES[idx]);
                    apiCallTimestamps.push(Date.now()); // jeder echte Versuch zählt

                    try {
                        const response = await fetchWithTimeout(realUrl, 12000);

                        if (!response.ok) {
                            if (response.status >= 500) {
                                // Serverfehler -> Failover lohnt sich
                                throw new Error('HTTP ' + response.status);
                            }
                            // 4xx: Anfrage ist falsch - andere API würde genauso antworten
                            const err = new Error('HTTP ' + response.status);
                            err.noFailover = true;
                            throw err;
                        }

                        const data = await response.json();

                        // Basis-Wechsel dokumentieren
                        if (idx !== activeApiBaseIndex) {
                            activeApiBaseIndex = idx;
                            if (idx !== 0) {
                                apiFallbackSince = Date.now();
                                console.warn(`API-Failover aktiv: ${API_BASES[idx]} (VBB-API antwortet nicht)`);
                            } else {
                                console.warn('API-Failover beendet: primäre VBB-API antwortet wieder');
                            }
                        }

                        if (ttl > 0) {
                            // Cache-Größe begrenzen (ältesten Eintrag entfernen)
                            if (apiCache.size >= API_CACHE_MAX_ENTRIES) {
                                const oldestKey = apiCache.keys().next().value;
                                apiCache.delete(oldestKey);
                            }
                            apiCache.set(url, { data, time: Date.now(), ttl });
                        }
                        return data;

                    } catch (e) {
                        if (e.noFailover) throw e;
                        lastError = e;
                        // Budget für den zweiten Versuch noch da?
                        if (apiBudgetLeft() <= 0) break;
                        // -> nächste Basis probieren
                    }
                }

                // Beide APIs down: notfalls abgelaufenen Cache liefern
                if (cached) {
                    console.warn('Beide APIs nicht erreichbar – liefere veraltete Cache-Daten');
                    return cached.data;
                }
                throw lastError || new Error('API nicht erreichbar');
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
                favorites.unshift({ id: stationId, name: stationName });
                favorites = favorites.slice(0, MAX_FAVORITES);
            }
            storageSet(STORAGE_KEYS.favorites, favorites);
            renderFavorites();
            updateFavoriteButton();
            return isFavorite(stationId);
        }

        // Favoriten auf dem Home-Screen rendern
        function renderFavorites() {
            const container = document.getElementById('homeFavorites');
            if (!container) return;
            const favorites = getFavorites();

            if (favorites.length === 0) {
                container.innerHTML = '';
                container.style.display = 'none';
                return;
            }

            container.style.display = '';
            container.innerHTML = `
                <div class="home-favorites-title">⭐ Deine Stationen</div>
                <div class="home-favorites-list">
                    ${favorites.map(f => `
                        <button class="home-favorite-item" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}"
                                aria-label="Abfahrten für ${escapeHtml(f.name)} anzeigen">
                            <span class="home-favorite-name">${escapeHtml(f.name)}</span>
                            <span class="home-favorite-arrow" aria-hidden="true">→</span>
                        </button>
                    `).join('')}
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

