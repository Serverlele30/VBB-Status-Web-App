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
            const isMobile = window.innerWidth < 768;
            
            // Map zentriert auf Berlin
            liveMap = L.map('liveMap', {
                center: [52.52, 13.405],
                zoom: 12,
                zoomControl: !isMobile  // Nur auf Desktop!
            });

            // Tile Layer (CartoDB Dark Matter - Dark Mode!)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors, © CartoDB',
                maxZoom: 19,
                minZoom: 10,
                subdomains: 'abcd'
            }).addTo(liveMap);

            // Fahrzeuge initial laden
            loadVehicles();
            
            // Auto-Update alle 15 Sekunden
            // Pausiert automatisch, wenn Tab im Hintergrund oder andere View aktiv
            liveMapUpdateInterval = setInterval(() => {
                if (document.hidden) return;
                if (currentView !== 'livemap') return;
                loadVehicles();
            }, 15000);
            
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
                
                const bounds = {
                    north: Math.min(52.70, mapBounds.getNorth() + latPadding),  // Max: Berlin Nord
                    south: Math.max(52.35, mapBounds.getSouth() - latPadding),  // Min: Berlin Süd
                    west: Math.max(13.08, mapBounds.getWest() - lngPadding),    // Min: Berlin West
                    east: Math.min(13.76, mapBounds.getEast() + lngPadding)     // Max: Berlin Ost
                };


                // Ergebnisanzahl an Zoom koppeln: nah dran reichen wenige Fahrzeuge,
                // weit rausgezoomt begrenzen wir auf 200 (kleinere API-Responses)
                const zoom = liveMap.getZoom ? liveMap.getZoom() : 12;
                const maxResults = zoom >= 15 ? 80 : zoom >= 13 ? 140 : 200;

                // Koordinaten runden -> stabile Cache-Keys bei minimalen Kartenbewegungen
                const url = `${API_BASE}/radar?` +
                    `north=${bounds.north.toFixed(3)}&south=${bounds.south.toFixed(3)}&` +
                    `west=${bounds.west.toFixed(3)}&east=${bounds.east.toFixed(3)}&` +
                    `results=${maxResults}&duration=60&` +
                    `subway=true&bus=true&tram=true&suburban=true&regional=true`;

                // 10s Cache: schnelles Hin- und Herzoomen kostet keine Extra-Requests
                const data = await apiFetch(url, { ttl: 10000 });
                lastVehicleMovements = data.movements || [];
                displayVehicles(lastVehicleMovements);

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

            // Update Counter
            const countEl = document.getElementById('vehicleCount');
            if (countEl) {
                countEl.innerHTML =
                    `🚇 <span style="color: #fff;">${filteredMovements.length}</span> Fahrzeuge aktiv`;
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
                const lineColor = getBVGLineColor(lineName);
                const isLightBg = lineColor === '#F0D722' || lineColor === '#FFFFFF' || lineColor === '#55A823';
                const textColor = isLightBg ? '#000' : '#FFF';
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
                if (lastVehicleMovements.length > 0) {
                    displayVehicles(lastVehicleMovements);
                } else {
                    loadVehicles();
                }
                
                if (navigator.vibrate) navigator.vibrate(5);
            }
        });


