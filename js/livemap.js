// VBB Netz Status - Live-Map (Leaflet, Fahrzeug-Radar)

        // ==========================================
        // LIVE-MAP FUNCTIONALITY
        // ==========================================
        
        // (Geteilter Live-Map-Zustand ist zentral in js/api.js deklariert)

        // Fahrzeug-Icons nach Typ
        function getVehicleEmoji(product, lineName) {
            const type = product?.mode || product?.name || '';
            const line = lineName || '';
            
            // U-Bahn - verschiedene Icons je nach Linie
            if (type.includes('subway') || type.includes('U-Bahn') || type.match(/^U\d/)) {
                return '🚇';
            } 
            // S-Bahn
            else if (type.includes('suburban') || type.includes('S-Bahn') || type.match(/^S\d/)) {
                return '🚆';
            } 
            // Tram/Straßenbahn
            else if (type.includes('tram') || type.includes('Tram') || line.match(/^M\d/) || line.match(/^\d{2}$/)) {
                return '🚊';
            } 
            // Bus
            else if (type.includes('bus') || type.includes('Bus')) {
                // Express-Bus
                if (line.includes('X') || line.includes('TXL')) {
                    return '🚌';
                }
                // Nacht-Bus
                else if (line.startsWith('N')) {
                    return '🌙';
                }
                // Normal-Bus
                return '🚌';
            } 
            // Regional-Bahn
            else if (type.includes('regional') || line.includes('RE') || line.includes('RB')) {
                return '🚉';
            } 
            // Express-Züge
            else if (type.includes('express') || line.includes('ICE') || line.includes('IC')) {
                return '🚅';
            }
            // Fähre
            else if (type.includes('ferry') || type.includes('Fähre')) {
                return '⛴️';
            }
            
            return '🚍'; // Default
        }


        // BVG-Linienfarben (authentische Farben!)
        function getBVGLineColor(lineName) {
            const line = lineName?.toUpperCase() || '';
            
            // U-Bahn Farben (offiziell)
            const ubahnColors = {
                'U1': '#55A823',  // Grün
                'U2': '#DA421E',  // Rot
                'U3': '#16683D',  // Türkis
                'U4': '#F0D722',  // Gelb
                'U5': '#7E5330',  // Braun
                'U6': '#8C6DAB',  // Lila
                'U7': '#528DBA',  // Hellblau
                'U8': '#224F86',  // Dunkelblau
                'U9': '#F3791D'   // Orange
            };
            
            // S-Bahn Farben (offiziell)
            const sbahnColors = {
                'S1': '#DE4DA4',   // Pink/Magenta
                'S2': '#076D3D',   // Dunkelgrün
                'S25': '#55A823',  // Grün
                'S26': '#7E5330',  // Braun
                'S3': '#1E5BA8',   // Blau
                'S41': '#A65A28',  // Braun/Orange (Ring)
                'S42': '#A65A28',  // Braun/Orange (Ring)
                'S45': '#F0D722',  // Gelb
                'S46': '#DA421E',  // Rot
                'S47': '#8C6DAB',  // Lila
                'S5': '#F3791D',   // Orange
                'S7': '#BA7AB5',   // Lila/Magenta
                'S75': '#6F7072',  // Grau
                'S8': '#55A823',   // Grün
                'S85': '#FFFFFF',  // Weiß
                'S9': '#DA421E'    // Rot
            };
            
            // Tram Farben (Metro = Rot, andere = Gelb)
            const tramColors = {
                'M1': '#DA421E', 'M2': '#DA421E', 'M4': '#DA421E',
                'M5': '#DA421E', 'M6': '#DA421E', 'M8': '#DA421E',
                'M10': '#DA421E', 'M13': '#DA421E', 'M17': '#DA421E'
            };
            
            // Bus Farben (Metro = Gelb, Express = Blau, Normal = Lila)
            if (line.startsWith('M') && !line.match(/M\d{1,2}$/)) {
                return '#F0D722'; // Metro-Bus: Gelb
            }
            if (line.startsWith('X') || line.includes('TXL')) {
                return '#1E5BA8'; // Express-Bus: Blau
            }
            if (line.startsWith('N')) {
                return '#000000'; // Nacht-Bus: Schwarz mit weißer Schrift
            }
            
            // Farbe zurückgeben
            return ubahnColors[line] || sbahnColors[line] || tramColors[line] || '#993399'; // Default: Lila
        }

        // Fahrzeugtyp bestimmen
        function getVehicleType(product, lineName) {
            const type = product?.mode || product?.name || '';
            const line = lineName?.toUpperCase() || '';
            
            // Prüfung nach Liniennamen (zuverlässiger!)
            if (line.match(/^U\d/)) {
                return 'subway';
            } else if (line.match(/^S\d/) || line.match(/^S\d{2}/)) {
                return 'suburban';
            } else if (line.match(/^M\d/) || line.match(/^\d{2}$/)) {
                return 'tram';
            } else if (line.startsWith('N') || line.startsWith('X') || line.match(/^\d{3}$/)) {
                return 'bus';
            }
            
            // Fallback: Prüfung nach product.mode
            if (type.includes('subway') || type.includes('U-Bahn')) {
                return 'subway';
            } else if (type.includes('suburban') || type.includes('S-Bahn')) {
                return 'suburban';
            } else if (type.includes('tram') || type.includes('Tram')) {
                return 'tram';
            } else if (type.includes('bus') || type.includes('Bus')) {
                return 'bus';
            }
            
            return 'other';
        }

        // Live-Map initialisieren
        function initLiveMap() {
            if (liveMap) return; // Bereits initialisiert

            // Zoom-Control nur auf Desktop
            
            // Map zentriert auf Berlin
            liveMap = L.map('liveMap', {
                center: [52.52, 13.405],
                zoom: 12,
                zoomControl: false  // Keine +/- Tasten (Zoomen per Geste/Scrollrad)
            });

            // Tile Layer (CartoDB Dark Matter - Dark Mode!)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors, © CartoDB',
                maxZoom: 19,
                minZoom: 8,
                subdomains: 'abcd',
                keepBuffer: 4,          // Rand-Kacheln behalten -> flüssigeres Pannen
                updateWhenIdle: false   // Kacheln schon WÄHREND der Bewegung laden
            }).addTo(liveMap);

            // HINWEIS: Daten-Polling startet NICHT hier, sondern beim Öffnen
            // der View (switchView). Dadurch kann die Karte selbst schon im
            // Hintergrund vorinitialisiert werden (Leaflet-Setup + erste
            // Kacheln), ohne einen einzigen API-Request zu verursachen.

            // Lokaler Animations-Loop (1s-Takt, kostet keine API-Requests)
            if (!liveMapAnimationInterval) {
                liveMapAnimationInterval = setInterval(() => {
                    if (document.hidden) return;
                    if (currentView !== 'livemap') return;
                    renderVehiclesFromSegments();
                }, 1000);
            }
            
            // Event-Listener: Neu laden wenn Karte bewegt/gezoomt wird
            // Mit Debouncing (1 Sekunde Verzögerung) um API zu schonen
            liveMap.on('moveend', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    loadVehicles();
                }, 1000);  // 1 Sekunde warten nach Bewegung
            });
            
        }

        // Fahrzeuge von API laden
        async function loadVehicles() {
            // Sicherheitsabfrage: Map muss existieren
            if (!liveMap) {
                return;
            }
            
            try {
                // Loading-State anzeigen
                const counterEl = document.getElementById('vehicleCount');
                if (counterEl) {
                    counterEl.innerHTML = '⏳ <span style="color: #fff;">Lade...</span>';
                }
                
                // Dynamische Bounding Box vom aktuellen Kartenausschnitt
                const mapBounds = liveMap.getBounds();
                
                // Puffer hinzufügen (15% größer) damit Fahrzeuge nicht sofort verschwinden
                const latDiff = mapBounds.getNorth() - mapBounds.getSouth();
                const lngDiff = mapBounds.getEast() - mapBounds.getWest();
                const latPadding = latDiff * 0.15;
                const lngPadding = lngDiff * 0.15;
                
                // Keine Berlin-Klemmung mehr: Transitous deckt ganz
                // Brandenburg (und darüber hinaus) ab - die alte Klemmung
                // schnitt z.B. Potsdam ab.
                const bounds = {
                    north: mapBounds.getNorth() + latPadding,
                    south: mapBounds.getSouth() - latPadding,
                    west: mapBounds.getWest() - lngPadding,
                    east: mapBounds.getEast() + lngPadding
                };


                const zoom = liveMap.getZoom ? liveMap.getZoom() : 12;

                // Fahrt-Segmente von Transitous holen (map/trips) und für
                // die lokale Animation zwischenspeichern
                liveMapSegments = await transitousRadarSegments(bounds, zoom);
                renderVehiclesFromSegments();
                updateMapStops(); // Stations-Punkte im selben Takt pflegen

            } catch (error) {
                console.error('Load vehicles error:', error);
                const counterEl = document.getElementById('vehicleCount');
                if (counterEl) {
                    counterEl.textContent = error.message === 'RATE_LIMIT'
                        ? '⏳ API-Limit erreicht – kurz warten'
                        : '⚠️ Fehler beim Laden der Fahrzeuge';
                }
            }
        }

        // ==========================================
        // EIGENER STANDORT AUF DER KARTE
        // 📍-Button: blauer Punkt + Karte zentrieren
        // ==========================================
        let userLocationMarker = null;

        document.addEventListener('DOMContentLoaded', () => {
            const locateBtn = document.getElementById('locateBtn');
            if (!locateBtn) return;

            locateBtn.addEventListener('click', () => {
                if (!navigator.geolocation || !liveMap) return;
                locateBtn.textContent = '⏳';

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        rememberPosition(latitude, longitude);

                        // Blauer Punkt (wird bei erneutem Tap nur bewegt)
                        if (userLocationMarker) {
                            userLocationMarker.setLatLng([latitude, longitude]);
                        } else {
                            userLocationMarker = L.circleMarker([latitude, longitude], {
                                radius: 8,
                                color: '#FFFFFF',
                                weight: 3,
                                fillColor: '#2A93EE',
                                fillOpacity: 1
                            }).addTo(liveMap);
                        }

                        liveMap.setView([latitude, longitude], Math.max(liveMap.getZoom(), 15));
                        locateBtn.textContent = '📍';
                        if (navigator.vibrate) navigator.vibrate(10);
                    },
                    (error) => {
                        console.warn('Standort nicht verfügbar:', error.message);
                        locateBtn.textContent = '📍';
                        const countEl = document.getElementById('vehicleCount');
                        if (countEl) countEl.textContent = '⚠️ Standort nicht verfügbar';
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            });
        });

        // ==========================================
        // STATIONS-PUNKTE AUF DER KARTE (ab Zoom 15)
        // Tap auf einen Punkt -> Popup mit den nächsten 3 Abfahrten
        // (1 stoptimes-Request, 15s-Cache) + Sprung zur Abfahrten-View.
        // ==========================================
        const STOPS_MIN_ZOOM = 15;
        let stopMarkerMap = new Map(); // stopId -> marker

        async function updateMapStops() {
            if (!liveMap) return;

            // Bei niedrigem Zoom oder im Fokus-Modus: Punkte ausblenden
            const zoom = liveMap.getZoom ? liveMap.getZoom() : 12;
            if (zoom < STOPS_MIN_ZOOM || focusedVehicleTripId) {
                clearMapStops();
                return;
            }

            const b = liveMap.getBounds();
            let stops;
            try {
                stops = await transitousMapStops({
                    north: b.getNorth(), south: b.getSouth(),
                    west: b.getWest(), east: b.getEast()
                });
            } catch (e) {
                return; // Punkte sind nice-to-have - Fehler still schlucken
            }

            const seen = new Set();
            for (const stop of stops) {
                seen.add(stop.id);
                if (stopMarkerMap.has(stop.id)) continue;

                const marker = L.circleMarker([stop.lat, stop.lon], {
                    radius: 6,
                    color: '#FFED00',
                    weight: 2,
                    fillColor: '#111',
                    fillOpacity: 0.9
                });
                marker.bindPopup(stopPopupHTML(stop, null), { minWidth: 220 });
                marker.on('popupopen', () => loadStopPopupDepartures(stop, marker));
                marker.addTo(liveMap);
                stopMarkerMap.set(stop.id, marker);
            }

            // Punkte außerhalb des Ausschnitts entfernen
            for (const [id, marker] of stopMarkerMap) {
                if (!seen.has(id)) {
                    marker.remove();
                    stopMarkerMap.delete(id);
                }
            }
        }

        function clearMapStops() {
            for (const [, marker] of stopMarkerMap) marker.remove();
            stopMarkerMap.clear();
        }

        function stopPopupHTML(stop, departures) {
            let depsHTML = '<div class="stop-popup-loading">⏳ Lade Abfahrten…</div>';
            if (departures) {
                depsHTML = departures.length === 0
                    ? '<div class="stop-popup-loading">Keine Abfahrten in Kürze</div>'
                    : departures.map(dep => {
                        const mins = Math.max(0, Math.round((new Date(dep.when) - Date.now()) / 60000));
                        const color = dep.line?.color || getBVGLineColor(dep.line?.name || '');
                        return `
                            <div class="stop-popup-dep">
                                <span class="stop-popup-line" style="background:${color};color:${bestTextColor(color)}">${escapeHtml(dep.line?.name || '?')}</span>
                                <span class="stop-popup-dir">${escapeHtml(dep.direction || '')}</span>
                                <span class="stop-popup-min">${mins === 0 ? 'Jetzt' : mins + ' min'}</span>
                            </div>`;
                    }).join('');
            }
            return `
                <div class="stop-popup">
                    <div class="stop-popup-name">🚏 ${escapeHtml(stop.name)}</div>
                    ${depsHTML}
                    <button class="map-stop-open" data-id="${escapeHtml(stop.id)}" data-name="${escapeHtml(stop.name)}"
                            data-lat="${stop.lat}" data-lon="${stop.lon}">
                        Alle Abfahrten →
                    </button>
                </div>`;
        }

        async function loadStopPopupDepartures(stop, marker) {
            try {
                const data = await transitousDepartures(
                    { id: stop.id, name: stop.name, lat: stop.lat, lon: stop.lon }, 3
                );
                marker.setPopupContent(stopPopupHTML(stop, (data.departures || []).slice(0, 3)));
            } catch (e) {
                marker.setPopupContent(stopPopupHTML(stop, []));
            }
        }

        // "Alle Abfahrten" im Stations-Popup -> Abfahrten-View
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.map-stop-open');
            if (!btn) return;
            switchView('departures');
            selectStation(
                btn.dataset.id, btn.dataset.name,
                btn.dataset.lat ? parseFloat(btn.dataset.lat) : null,
                btn.dataset.lon ? parseFloat(btn.dataset.lon) : null
            );
        });

        // ==========================================
        // STRECKEN-ANZEIGE BEIM FAHRZEUG-KLICK
        // Die Polylines liegen bereits dekodiert in liveMapSegments -
        // die Route zu zeichnen kostet also NULL API-Requests.
        // ==========================================
        let activeRouteLine = null;
        let focusedVehicleTripId = null; // Fokus-Modus: nur diese Fahrt zeigen

        async function showVehicleRoute(tripId) {
            hideVehicleRoute();
            focusedVehicleTripId = tripId;

            const seg = liveMapSegments.find(s => s.tripId === tripId);
            const color = seg?.color || getBVGLineColor(seg?.lineName || '');

            // 1) SOFORT das lokale Segment zeichnen (null Wartezeit)...
            if (seg && seg.points && seg.points.length >= 2) {
                activeRouteLine = L.polyline(seg.points, {
                    color, weight: 5, opacity: 0.75,
                    lineCap: 'round', interactive: false
                }).addTo(liveMap);
            }

            // Fokus-Modus aktivieren: andere Fahrzeuge + Stations-Punkte ausblenden
            renderVehiclesFromSegments();
            clearMapStops();

            // 2) ...dann die KOMPLETTE Route nachladen (map/trips liefert nur
            // das Segment im Ausschnitt; die ganze Strecke steckt in /trip).
            // Gleicher Cache wie die Abfahrts-Details -> max. 1 Request.
            try {
                const route = await transitousTripGeometry(tripId);
                // Nutzer könnte inzwischen woanders geklickt haben
                if (route && focusedVehicleTripId === tripId) {
                    if (activeRouteLine) activeRouteLine.remove();
                    activeRouteLine = L.polyline(route.points, {
                        color: route.color || color, weight: 5, opacity: 0.75,
                        lineCap: 'round', interactive: false
                    }).addTo(liveMap);
                }
            } catch (e) {
                // Volle Route nicht verfügbar -> Segment bleibt stehen
                console.warn('Komplette Route nicht ladbar:', e.message);
            }
        }

        function hideVehicleRoute() {
            if (activeRouteLine) {
                activeRouteLine.remove();
                activeRouteLine = null;
            }
            if (focusedVehicleTripId) {
                focusedVehicleTripId = null;
                renderVehiclesFromSegments(); // alle Fahrzeuge wieder zeigen
                updateMapStops();             // Stations-Punkte wiederherstellen
            }
        }

        // Aus den gespeicherten Segmenten die AKTUELLEN Positionen berechnen
        // und rendern. Läuft jede Sekunde lokal - null API-Kosten.
        function renderVehiclesFromSegments() {
            if (!liveMap) return;
            const nowMs = Date.now();
            const movements = [];

            for (const seg of liveMapSegments) {
                // Fokus-Modus: nur die angetippte Fahrt rendern
                if (focusedVehicleTripId && seg.tripId !== focusedVehicleTripId) continue;
                const pos = segmentPositionAt(seg, nowMs);
                if (!pos) continue; // Fahrzeug (noch) nicht auf diesem Segment unterwegs
                movements.push({
                    tripId: seg.tripId,
                    direction: seg.direction,
                    delay: seg.delay,
                    line: { name: seg.lineName, product: seg.product, color: seg.color },
                    location: pos
                });
            }

            displayVehicles(movements);
        }

        // Fahrzeuge auf Map anzeigen
        // Marker werden per tripId wiederverwendet und nur BEWEGT (setLatLng),
        // statt bei jedem Update alle zu zerstören und neu zu erzeugen.
        // -> flüssigere Karte, offene Popups bleiben offen, weniger DOM-Arbeit.
        // (vehicleMarkerMap ist zentral in js/api.js deklariert)

        function displayVehicles(movements) {
            // Filtern nach aktiven Typen
            const filteredMovements = movements.filter(m => {
                if (activeVehicleTypes.has('all')) return true;
                const vehicleType = getVehicleType(m.line?.product, m.line?.name);
                return activeVehicleTypes.has(vehicleType);
            });

            // Update Counter mit Live-Indikator (bzw. Fokus-Hinweis)
            const countEl = document.getElementById('vehicleCount');
            if (countEl) {
                if (focusedVehicleTripId) {
                    const focusName = filteredMovements[0]?.line?.name || '';
                    countEl.innerHTML =
                        `🎯 <span style="color: #fff;">${escapeHtml(focusName)}</span> im Fokus – Popup schließen zum Beenden`;
                } else {
                    countEl.innerHTML =
                        `<span class="live-dot" aria-hidden="true"></span> ` +
                        `<span style="color: #fff;">${filteredMovements.length}</span> Fahrzeuge live`;
                }
            }

            const seenTripIds = new Set();

            filteredMovements.forEach(movement => {
                if (!movement.location || !movement.location.latitude || !movement.location.longitude) {
                    return;
                }

                const lat = movement.location.latitude;
                const lon = movement.location.longitude;
                const lineName = movement.line?.name || 'Unbekannt';
                const tripId = movement.tripId || `${lineName}|${movement.direction || ''}`;
                seenTripIds.add(tripId);

                const direction = movement.direction || 'Keine Angabe';
                const delay = movement.delay ? `+${Math.round(movement.delay / 60)} min Verspätung` : 'Pünktlich';
                // Offizielle GTFS-Farbe aus der API, lokale Tabelle als Fallback
                const lineColor = movement.line?.color || getBVGLineColor(lineName);
                const textColor = bestTextColor(lineColor);
                const emoji = getVehicleEmoji(movement.line?.product, lineName);

                const popupContent = `
                    <div class="vehicle-popup">
                        <div class="popup-line" style="background: ${lineColor}; color: ${textColor}; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px;">
                            ${emoji} ${escapeHtml(lineName)}
                        </div>
                        <div class="popup-direction">→ ${escapeHtml(direction)}</div>
                        <div class="popup-delay">${escapeHtml(delay)}</div>
                    </div>
                `;

                const existing = vehicleMarkerMap.get(tripId);
                if (existing) {
                    // Marker existiert bereits -> nur bewegen und Popup-Inhalt auffrischen
                    existing.marker.setLatLng([lat, lon]);
                    existing.marker.setPopupContent(popupContent);
                    return;
                }

                // Neues Fahrzeug -> Marker erzeugen
                const icon = L.divIcon({
                    html: `
                        <div class="vehicle-marker-container">
                            <div class="vehicle-emoji">${emoji}</div>
                            <div class="vehicle-line" style="
                                background: ${lineColor};
                                color: ${textColor};
                            ">${escapeHtml(lineName)}</div>
                        </div>
                    `,
                    className: 'custom-marker',
                    iconSize: [50, 60],
                    iconAnchor: [25, 30]
                });

                const marker = L.marker([lat, lon], { icon: icon });
                marker.bindPopup(popupContent);
                // Popup auf = Strecke dieser Fahrt einzeichnen (in Linienfarbe)
                marker.on('popupopen', () => showVehicleRoute(tripId));
                marker.on('popupclose', hideVehicleRoute);
                marker.addTo(liveMap);
                vehicleMarkerMap.set(tripId, { marker, lineName });
            });

            // Fahrzeuge entfernen, die nicht mehr in den Daten sind
            // (außer Sichtbereich, Fahrt beendet, oder vom Filter ausgeblendet)
            for (const [tripId, entry] of vehicleMarkerMap) {
                if (!seenTripIds.has(tripId)) {
                    entry.marker.remove();
                    vehicleMarkerMap.delete(tripId);
                }
            }

            // Route eines nicht mehr existierenden Fahrzeugs mit aufräumen
            if (activeRouteLine && ![...vehicleMarkerMap.values()]
                    .some(e => e.marker.isPopupOpen && e.marker.isPopupOpen())) {
                hideVehicleRoute();
            }
        }

        // Filter Buttons mit Event Delegation
        document.addEventListener('click', function(e) {
            // Prüfen ob es ein Filter-Button ist
            if (e.target.closest('.filter-btn')) {
                const btn = e.target.closest('.filter-btn');
                const type = btn.dataset.type;
                
                
                if (type === 'all') {
                    // Alle Filter deaktivieren, nur "Alle" aktiv
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeVehicleTypes.clear();
                    activeVehicleTypes.add('all');
                } else {
                    // "Alle" deaktivieren
                    const allBtn = document.querySelector('.filter-btn[data-type="all"]');
                    if (allBtn) allBtn.classList.remove('active');
                    activeVehicleTypes.delete('all');
                    
                    // Toggle Filter
                    if (activeVehicleTypes.has(type)) {
                        activeVehicleTypes.delete(type);
                        btn.classList.remove('active');
                    } else {
                        activeVehicleTypes.add(type);
                        btn.classList.add('active');
                    }
                    
                    // Falls keine Filter aktiv, "Alle" wieder aktivieren
                    if (activeVehicleTypes.size === 0) {
                        activeVehicleTypes.add('all');
                        const allBtn = document.querySelector('.filter-btn[data-type="all"]');
                        if (allBtn) allBtn.classList.add('active');
                    }
                }
                
                
                // Lokal filtern - Daten sind bereits da, KEIN neuer API-Call nötig!
                if (liveMapSegments.length > 0) {
                    renderVehiclesFromSegments();
                } else {
                    loadVehicles();
                }
                
                if (navigator.vibrate) navigator.vibrate(5);
            }
        });


