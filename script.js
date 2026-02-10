        const API_BASE = 'https://v6.vbb.transport.rest';
        let currentStationId = null;
        let currentStationName = null;
        let searchTimeout = null;
        let touchStartY = 0;
        let isPulling = false;
        let autoRefreshInterval = null;
        let apiCallTimestamps = []; // Track API calls for rate limiting

        // DOM Elements - Departures View
        const stationSearch = document.getElementById('stationSearch');
        const clearBtn = document.getElementById('clearBtn');
        const locationBtn = document.getElementById('locationBtn');
        const suggestions = document.getElementById('suggestions');
        const refreshBtn = document.getElementById('refreshBtn');
        const departuresContainer = document.getElementById('departuresContainer');
        const offlineIndicator = document.getElementById('offlineIndicator');
        const ptrContainer = document.getElementById('ptrContainer');
        const detailModal = document.getElementById('detailModal');
        const detailBackBtn = document.getElementById('detailBackBtn');
        const detailTitle = document.getElementById('detailTitle');
        const detailContent = document.getElementById('detailContent');

        // DOM Elements - Journey Detail Modal
        const journeyDetailModal = document.getElementById('journeyDetailModal');
        const journeyDetailBackBtn = document.getElementById('journeyDetailBackBtn');
        const journeyDetailTitle = document.getElementById('journeyDetailTitle');
        const journeyDetailContent = document.getElementById('journeyDetailContent');

        // DOM Elements - Navigation
        const menuBtn = document.getElementById('menuBtn');
        const navMenu = document.getElementById('navMenu');
        const navClose = document.getElementById('navClose');
        const navOverlay = document.getElementById('navOverlay');
        const navItems = document.querySelectorAll('.nav-item');
        const viewHome = document.getElementById('view-home');
        const viewDepartures = document.getElementById('view-departures');
        const viewJourney = document.getElementById('view-journey');

        // DOM Elements - Journey View
        const journeyFrom = document.getElementById('journeyFrom');
        const journeyTo = document.getElementById('journeyTo');
        const clearFromBtn = document.getElementById('clearFromBtn');
        const clearToBtn = document.getElementById('clearToBtn');
        const locationFromBtn = document.getElementById('locationFromBtn');
        const suggestionsFrom = document.getElementById('suggestionsFrom');
        const suggestionsTo = document.getElementById('suggestionsTo');
        const swapBtn = document.getElementById('swapBtn');
        const searchJourneyBtn = document.getElementById('searchJourneyBtn');
        const journeyContainer = document.getElementById('journeyContainer');

        // Service Worker registrieren
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registriert'))
                .catch(err => console.error('Service Worker Fehler:', err));
        }

        // Offline-Status überwachen
        window.addEventListener('online', () => {
            offlineIndicator.classList.remove('show');
        });

        window.addEventListener('offline', () => {
            offlineIndicator.classList.add('show');
        });

        // Menu Navigation
        function openMenu() {
            navMenu.classList.add('active');
            navOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            navMenu.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        menuBtn.addEventListener('click', openMenu);
        navClose.addEventListener('click', closeMenu);
        navOverlay.addEventListener('click', closeMenu);

        // View Switching
        let currentView = 'home';

        function switchView(viewName) {
            // Update active nav item
            navItems.forEach(item => {
                if (item.dataset.view === viewName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Update Page Title dynamisch
            const titles = {
                'home': 'VBB Netz Status',
                'departures': 'VBB Netz Status - Abfahrten',
                'journey': 'VBB Netz Status - Route',
                'livemap': 'VBB Netz Status - Live-Map'
            };
            document.title = titles[viewName] || 'VBB Netz Status';

            // Switch views
            const viewLiveMap = document.getElementById('view-livemap');
            
            // Alle Views deaktivieren
            viewHome.classList.remove('active');
            viewDepartures.classList.remove('active');
            viewJourney.classList.remove('active');
            viewLiveMap.classList.remove('active');
            
            // Stop Live-Map Updates wenn wir View wechseln
            if (viewName !== 'livemap' && liveMapUpdateInterval) {
                clearInterval(liveMapUpdateInterval);
                liveMapUpdateInterval = null;
            }
            
            // Gewünschte View aktivieren
            if (viewName === 'home') {
                viewHome.classList.add('active');
            } else if (viewName === 'departures') {
                viewDepartures.classList.add('active');
            } else if (viewName === 'journey') {
                viewJourney.classList.add('active');
            } else if (viewName === 'livemap') {
                viewLiveMap.classList.add('active');
                
                // Initialize Live-Map wenn noch nicht geschehen
                setTimeout(() => {
                    initLiveMap();
                    if (liveMap) {
                        liveMap.invalidateSize();
                    }
                }, 100);
            }

            currentView = viewName;
            closeMenu();

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                switchView(view);
            });
        });

        // Initialen Title setzen (für default View 'home')
        document.title = 'VBB Netz Status';

        // Pull-to-refresh
        let startY = 0;
        let pulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0 && !detailModal.classList.contains('active')) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0 && pullDistance < 100) {
                ptrContainer.style.transform = `translateY(${pullDistance - 60}px)`;
            }
        });

        document.addEventListener('touchend', async (e) => {
            if (!pulling) return;
            pulling = false;
            
            const currentY = e.changedTouches[0].pageY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 60 && currentStationId) {
                ptrContainer.classList.add('pulling');
                await loadDepartures();
                setTimeout(() => {
                    ptrContainer.classList.remove('pulling');
                    ptrContainer.style.transform = '';
                }, 300);
            } else {
                ptrContainer.style.transform = '';
            }
        });

        // Swipe to close detail modal
        let modalStartY = 0;
        let modalPulling = false;

        detailModal.addEventListener('touchstart', (e) => {
            if (e.target.closest('.detail-content') && detailModal.scrollTop === 0) {
                modalStartY = e.touches[0].pageY;
                modalPulling = true;
            }
        });

        detailModal.addEventListener('touchmove', (e) => {
            if (!modalPulling) return;
            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - modalStartY;
            
            if (pullDistance > 0 && pullDistance < 200) {
                detailModal.style.transform = `translateY(${pullDistance}px)`;
            }
        });

        detailModal.addEventListener('touchend', (e) => {
            if (!modalPulling) return;
            modalPulling = false;
            
            const currentY = e.changedTouches[0].pageY;
            const pullDistance = currentY - modalStartY;
            
            if (pullDistance > 100) {
                closeDetailModal();
            } else {
                detailModal.style.transform = '';
            }
        });

        // Swipe-to-close für Journey Detail Modal
        let journeyModalStartY = 0;
        let journeyModalPulling = false;

        journeyDetailModal.addEventListener('touchstart', (e) => {
            if (e.target.closest('.detail-content') && journeyDetailModal.scrollTop === 0) {
                journeyModalStartY = e.touches[0].pageY;
                journeyModalPulling = true;
            }
        });

        journeyDetailModal.addEventListener('touchmove', (e) => {
            if (!journeyModalPulling) return;
            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - journeyModalStartY;
            
            if (pullDistance > 0 && pullDistance < 200) {
                journeyDetailModal.style.transform = `translateY(${pullDistance}px)`;
            }
        });

        journeyDetailModal.addEventListener('touchend', (e) => {
            if (!journeyModalPulling) return;
            journeyModalPulling = false;
            
            const currentY = e.changedTouches[0].pageY;
            const pullDistance = currentY - journeyModalStartY;
            
            if (pullDistance > 100) {
                closeJourneyDetailModal();
            } else {
                journeyDetailModal.style.transform = '';
            }
        });

        // Station suchen mit Autocomplete
        stationSearch.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                suggestions.classList.remove('active');
                suggestions.innerHTML = '';
                return;
            }

            // Stop auto-refresh during search
            stopAutoRefresh();

            searchTimeout = setTimeout(async () => {
                if (!canMakeApiCall()) {
                    console.warn('Rate limit reached, skipping search');
                    return;
                }
                
                try {
                    const response = await fetch(`${API_BASE}/locations?query=${encodeURIComponent(query)}&results=10`);
                    const locations = await response.json();
                    
                    const stations = locations.filter(loc => 
                        loc.type === 'stop' || loc.type === 'station'
                    );
                    
                    displaySuggestions(stations);
                } catch (error) {
                    console.error('Suchfehler:', error);
                }
            }, 300);
        });

        // Clear button
        clearBtn.addEventListener('click', () => {
            stationSearch.value = '';
            suggestions.classList.remove('active');
            suggestions.innerHTML = '';
            stationSearch.focus();
        });

        // Location button - Find nearest station
        locationBtn.addEventListener('click', async () => {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                showLocationError('⚠️ Dein Browser unterstützt keine Standortdienste');
                return;
            }

            // Check if HTTPS (required for geolocation in most browsers)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                showLocationError('⚠️ Standortdienste benötigen HTTPS. Bitte nutze eine sichere Verbindung.');
                return;
            }

            // Check rate limit before starting
            if (!canMakeApiCall()) {
                showLocationError('⚠️ Rate-Limit erreicht. Bitte warte kurz.');
                return;
            }

            locationBtn.disabled = true;
            locationBtn.textContent = '⌛'; // Emoji wechseln während Loading
            
            // Show loading in search field
            const originalPlaceholder = stationSearch.placeholder;
            stationSearch.placeholder = '📍 Suche nächste Station...';

            try {
                // Try to check permission state first (if available)
                if (navigator.permissions) {
                    try {
                        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                        
                        if (permissionStatus.state === 'denied') {
                            throw new Error('PERMISSION_DENIED');
                        }
                    } catch (e) {
                        // Permissions API might not be available, continue anyway
                        console.log('Permissions API not available, trying geolocation directly');
                    }
                }

                // Get current position with better options
                const position = await new Promise((resolve, reject) => {
                    const options = {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 30000 // Cache for 30 seconds
                    };

                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                });

                const { latitude, longitude } = position.coords;
                
                stationSearch.placeholder = '📍 Suche Stationen in der Nähe...';

                // Search nearby stations - VBB API endpoint
                const nearbyUrl = `${API_BASE}/locations/nearby?latitude=${latitude}&longitude=${longitude}&results=10`;
                
                console.log('Searching nearby stations:', nearbyUrl);
                
                const response = await fetch(nearbyUrl);

                if (!response.ok) {
                    console.error('API Response status:', response.status);
                    throw new Error('API_ERROR');
                }

                const locations = await response.json();
                
                // Filter for stops/stations only
                const stations = locations.filter(loc => 
                    loc.type === 'stop' || loc.type === 'station'
                );

                if (!stations || stations.length === 0) {
                    throw new Error('NO_STATIONS');
                }

                // Select nearest station
                const nearest = stations[0];
                const distance = nearest.distance ? Math.round(nearest.distance) : '?';
                
                selectStation(nearest.id, nearest.name);

                // Show success feedback
                if (navigator.vibrate) {
                    navigator.vibrate([50, 100, 50]);
                }

                stationSearch.placeholder = `✅ ${nearest.name} (${distance}m entfernt)`;
                setTimeout(() => {
                    stationSearch.placeholder = originalPlaceholder;
                }, 4000);

            } catch (error) {
                console.error('Standortfehler:', error);
                
                let errorMsg = '';
                let errorDetail = '';
                
                if (error.message === 'PERMISSION_DENIED' || error.code === 1) {
                    errorMsg = '📍 Standortzugriff verweigert';
                    errorDetail = 'Bitte erlaube den Standortzugriff in deinen Browser-Einstellungen:\n\n' +
                                '• iOS: Einstellungen → Safari → Standort\n' +
                                '• Android: Chrome → Einstellungen → Website-Einstellungen → Standort\n' +
                                '• Desktop: Adresszeile → 🔒 Symbol → Berechtigungen';
                } else if (error.code === 2) {
                    errorMsg = '📍 Standort nicht verfügbar';
                    errorDetail = 'Dein Gerät konnte deinen Standort nicht ermitteln. Stelle sicher, dass:\n\n' +
                                '• GPS/Standortdienste aktiviert sind\n' +
                                '• Du dich nicht im Flugmodus befindest\n' +
                                '• Du eine gute Verbindung hast';
                } else if (error.code === 3) {
                    errorMsg = '⏱️ Zeitüberschreitung';
                    errorDetail = 'Die Standortermittlung hat zu lange gedauert. Bitte versuche es erneut.';
                } else if (error.message === 'NO_STATIONS') {
                    errorMsg = '🚉 Keine Stationen in der Nähe';
                    errorDetail = 'Im Umkreis von 1km wurden keine VBB-Stationen gefunden.\n\nBitte nutze die manuelle Suche.';
                } else if (error.message === 'API_ERROR') {
                    errorMsg = '⚠️ Verbindungsfehler';
                    errorDetail = 'Die Station konnte nicht gefunden werden.\n\nMögliche Ursachen:\n• Keine Internetverbindung\n• VBB-API vorübergehend nicht erreichbar\n\nBitte versuche es erneut oder nutze die manuelle Suche.';
                } else {
                    errorMsg = '⚠️ Unbekannter Fehler';
                    errorDetail = error.message || 'Bitte versuche es erneut oder nutze die manuelle Suche.';
                }
                
                showLocationError(errorMsg, errorDetail);
                stationSearch.placeholder = originalPlaceholder;
            } finally {
                locationBtn.disabled = false;
                locationBtn.textContent = '📍'; // Zurück zum Pin-Emoji
            }
        });

        function showLocationError(message, detail = '') {
            if (detail) {
                alert(message + '\n\n' + detail);
            } else {
                alert(message);
            }
        }

        // Click außerhalb schließt Vorschläge
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                suggestions.classList.remove('active');
            }
        });

        function displaySuggestions(stations) {
            if (stations.length === 0) {
                suggestions.innerHTML = '<div class="suggestion-item">Keine Stationen gefunden</div>';
                suggestions.classList.add('active');
                return;
            }

            suggestions.innerHTML = stations.map(station => {
                const products = station.products ? 
                    Object.entries(station.products)
                        .filter(([_, available]) => available)
                        .map(([type]) => type.toUpperCase())
                        .join(', ') : '';

                return `
                    <div class="suggestion-item" data-id="${station.id}" data-name="${station.name}">
                        <div class="suggestion-name">${station.name}</div>
                        ${products ? `<div class="suggestion-products">${products}</div>` : ''}
                    </div>
                `;
            }).join('');

            suggestions.classList.add('active');

            // Event-Listener für Vorschläge
            suggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const stationId = item.dataset.id;
                    const stationName = item.dataset.name;
                    
                    if (stationId && stationName) {
                        selectStation(stationId, stationName);
                    }
                });
            });
        }

        function selectStation(stationId, stationName) {
            currentStationId = stationId;
            currentStationName = stationName;
            
            stationSearch.value = stationName;
            suggestions.classList.remove('active');
            refreshBtn.disabled = false;
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            
            loadDepartures();
        }

        // Rate Limiting: Max 100 requests per minute
        function canMakeApiCall() {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            
            // Remove timestamps older than 1 minute
            apiCallTimestamps = apiCallTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
            
            // Check if we're under the limit
            if (apiCallTimestamps.length >= 100) {
                console.warn('Rate limit reached: 100 requests per minute');
                return false;
            }
            
            // Add current timestamp
            apiCallTimestamps.push(now);
            return true;
        }

        // Start/Stop Auto-Refresh
        function startAutoRefresh() {
            stopAutoRefresh(); // Clear any existing interval
            autoRefreshInterval = setInterval(() => {
                if (currentStationId && canMakeApiCall()) {
                    updateDeparturesValues(); // Nur Werte updaten, nicht neu rendern
                }
            }, 30000); // 30 seconds
        }

        function stopAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }

        async function loadDepartures() {
            if (!currentStationId) return;

            if (!canMakeApiCall()) {
                console.warn('Skipping API call due to rate limit');
                return;
            }

            departuresContainer.innerHTML = '<div class="loading">⏳ Lade Abfahrten...</div>';

            try {
                const response = await fetch(
                    `${API_BASE}/stops/${currentStationId}/departures?duration=60&results=20`
                );
                
                if (!response.ok) throw new Error('API-Fehler');
                
                const data = await response.json();
                displayDepartures(data.departures || []);
                
                // Start auto-refresh after successful load
                startAutoRefresh();
                
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            } catch (error) {
                console.error('Fehler beim Laden:', error);
                departuresContainer.innerHTML = `
                    <div class="error">
                        ⚠️ Fehler beim Laden der Abfahrten<br>
                        <small>${error.message}</small>
                    </div>
                `;
                // Stop auto-refresh on error
                stopAutoRefresh();
            }
        }

        // Update nur die Werte (Zeiten, Verspätungen) ohne DOM neu zu rendern
        async function updateDeparturesValues() {
            if (!currentStationId) return;

            try {
                const response = await fetch(
                    `${API_BASE}/stops/${currentStationId}/departures?duration=60&results=20`
                );
                
                if (!response.ok) throw new Error('API-Fehler');
                
                const data = await response.json();
                const departures = data.departures || [];
                
                // Aktualisiere nur die Zeitanzeigen
                const now = new Date();
                const departureItems = departuresContainer.querySelectorAll('.departure-item');
                
                departures.forEach((dep, index) => {
                    if (index >= departureItems.length) return;
                    
                    const item = departureItems[index];
                    const when = new Date(dep.when);
                    const minutes = Math.round((when - now) / 60000);
                    const timeDisplay = minutes <= 0 ? 'Jetzt' : `${minutes} min`;
                    
                    const delay = dep.delay ? Math.round(dep.delay / 60) : 0;
                    
                    // Update Zeit
                    const timeElement = item.querySelector('.departure-time');
                    if (timeElement) {
                        const delayHTML = delay > 0 ? 
                            `<div class="departure-delay">+${delay} min Verspätung</div>` : '';
                        timeElement.innerHTML = timeDisplay + delayHTML;
                    }
                });
                
                // Update Timestamp in Station Info
                const lastUpdateElement = departuresContainer.querySelector('.last-update');
                if (lastUpdateElement) {
                    lastUpdateElement.textContent = `Aktualisiert: ${now.toLocaleTimeString('de-DE')} • Auto-Refresh alle 30s`;
                }
                
            } catch (error) {
                console.error('Fehler beim Aktualisieren:', error);
                // Bei Fehler nicht stoppen, nächster Versuch in 30s
            }
        }

        function displayDepartures(departures) {
            if (departures.length === 0) {
                departuresContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚉</div>
                        <div>Keine Abfahrten in den nächsten 60 Minuten</div>
                    </div>
                `;
                return;
            }

            const now = new Date();
            const stationInfoHTML = `
                <div class="station-info">
                    <div class="station-name">${currentStationName}</div>
                    <div class="last-update">Aktualisiert: ${now.toLocaleTimeString('de-DE')} • Auto-Refresh alle 30s</div>
                </div>
            `;

            const departuresHTML = departures.map((dep, index) => {
                const when = new Date(dep.when);
                const minutes = Math.round((when - now) / 60000);
                const timeDisplay = minutes <= 0 ? 'Jetzt' : `${minutes} min`;
                
                const delay = dep.delay ? Math.round(dep.delay / 60) : 0;
                const delayHTML = delay > 0 ? 
                    `<div class="departure-delay">+${delay} min Verspätung</div>` : '';

                const lineColor = getLineColor(dep.line);
                const platformHTML = dep.platform ? 
                    `<div class="departure-platform">
                        <span class="platform-icon">🚉</span>
                        <span class="platform-text">Gleis ${dep.platform}</span>
                    </div>` : '';

                const cancelled = dep.cancelled ? '<span class="status-badge status-cancelled">FÄLLT AUS</span>' : '';

                return `
                    <div class="departure-item" style="border-left-color: ${lineColor}" data-trip-id="${dep.tripId}" data-index="${index}">
                        <div class="departure-info">
                            <div class="departure-header">
                                <div class="line-badge" style="background-color: ${lineColor}; color: #000;">
                                    ${dep.line.name}${cancelled}
                                </div>
                                ${platformHTML}
                            </div>
                            <div class="departure-destination">→ ${dep.direction}</div>
                        </div>
                        <div class="departure-time">
                            ${timeDisplay}
                            ${delayHTML}
                        </div>
                    </div>
                `;
            }).join('');

            departuresContainer.innerHTML = stationInfoHTML + departuresHTML;

            // Event-Listener für Departure-Items
            departuresContainer.querySelectorAll('.departure-item').forEach(item => {
                item.addEventListener('click', () => {
                    const tripId = item.dataset.tripId;
                    const index = item.dataset.index;
                    if (tripId) {
                        showDepartureDetails(departures[index]);
                    }
                });
            });
        }

        async function showDepartureDetails(departure) {
            detailModal.classList.add('active');
            detailTitle.textContent = departure.line.name;
            detailContent.innerHTML = '<div class="loading-detail">⏳ Lade Details...</div>';
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Pause auto-refresh while viewing details
            stopAutoRefresh();

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(15);
            }

            try {
                let tripDetails = null;
                
                // Versuche Trip-Details zu laden
                if (departure.tripId && canMakeApiCall()) {
                    try {
                        const response = await fetch(`${API_BASE}/trips/${departure.tripId}`);
                        if (response.ok) {
                            const data = await response.json();
                            tripDetails = data.trip;
                        }
                    } catch (e) {
                        console.log('Keine Trip-Details verfügbar');
                    }
                }

                displayDepartureDetails(departure, tripDetails);
            } catch (error) {
                console.error('Fehler beim Laden der Details:', error);
                detailContent.innerHTML = `
                    <div class="error">
                        ⚠️ Fehler beim Laden der Details<br>
                        <small>${error.message}</small>
                    </div>
                `;
            }
        }

        function displayDepartureDetails(departure, tripDetails) {
            const when = new Date(departure.when);
            const plannedWhen = departure.plannedWhen ? new Date(departure.plannedWhen) : when;
            const delay = departure.delay ? Math.round(departure.delay / 60) : 0;
            const lineColor = getLineColor(departure.line);

            let html = `
                <!-- Linie & Richtung -->
                <div class="detail-section" style="border-left-color: ${lineColor}">
                    <div class="line-badge" style="background-color: ${lineColor}; color: #000; margin-bottom: 10px;">
                        ${departure.line.name}
                    </div>
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                        → ${departure.direction}
                    </div>
                    ${departure.cancelled ? '<div class="status-badge status-cancelled">FÄLLT AUS</div>' : ''}
                </div>

                <!-- Abfahrt -->
                <div class="detail-section">
                    <div class="detail-section-title">⏱️ Abfahrt</div>
                    <div class="detail-row">
                        <div class="detail-label">Geplant</div>
                        <div class="detail-value">${plannedWhen.toLocaleTimeString('de-DE')}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Aktuell</div>
                        <div class="detail-value">${when.toLocaleTimeString('de-DE')}</div>
                    </div>
                    ${delay > 0 ? `
                        <div class="detail-row">
                            <div class="detail-label">Verspätung</div>
                            <div class="detail-value" style="color: #ff4444;">+${delay} min</div>
                        </div>
                    ` : ''}
                    ${departure.platform ? `
                        <div class="detail-row">
                            <div class="detail-label">Gleis/Steig</div>
                            <div class="detail-value">${departure.platform}</div>
                        </div>
                    ` : ''}
                </div>

                <!-- Fahrzeug-Info -->
                <div class="detail-section">
                    <div class="detail-section-title">🚊 Fahrzeug</div>
                    ${departure.line.product ? `
                        <div class="detail-row">
                            <div class="detail-label">Verkehrsmittel</div>
                            <div class="detail-value">${departure.line.product}</div>
                        </div>
                    ` : ''}
                    ${departure.line.operator ? `
                        <div class="detail-row">
                            <div class="detail-label">Betreiber</div>
                            <div class="detail-value">${departure.line.operator.name || departure.line.operator.id}</div>
                        </div>
                    ` : ''}
                    ${departure.line.mode ? `
                        <div class="detail-row">
                            <div class="detail-label">Modus</div>
                            <div class="detail-value">${departure.line.mode}</div>
                        </div>
                    ` : ''}
                    ${departure.tripId ? `
                        <div class="detail-row">
                            <div class="detail-label">Fahrt-ID</div>
                            <div class="detail-value" style="font-size: 10px; word-break: break-all;">${departure.tripId}</div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Halte anzeigen wenn verfügbar
            if (tripDetails && tripDetails.stopovers && tripDetails.stopovers.length > 0) {
                const currentStopIndex = tripDetails.stopovers.findIndex(stop => 
                    stop.stop.id === currentStationId
                );

                html += `
                    <div class="detail-section">
                        <div class="detail-section-title">🚏 Weitere Halte (${tripDetails.stopovers.length})</div>
                        <div class="stop-list">
                            ${tripDetails.stopovers.map((stop, index) => {
                                const stopWhen = stop.departure || stop.arrival;
                                const stopPlannedWhen = stop.plannedDeparture || stop.plannedArrival;
                                const stopTime = stopWhen ? new Date(stopWhen) : null;
                                const stopPlannedTime = stopPlannedWhen ? new Date(stopPlannedWhen) : null;
                                const stopDelay = stop.departureDelay || stop.arrivalDelay || 0;
                                const stopDelayMin = Math.round(stopDelay / 60);
                                const isCurrent = index === currentStopIndex;
                                const isPassed = index < currentStopIndex;

                                return `
                                    <div class="stop-item ${isCurrent ? 'current' : ''}" style="opacity: ${isPassed ? '0.5' : '1'}">
                                        <div class="stop-name">
                                            ${isCurrent ? '📍 ' : ''}${stop.stop.name}
                                        </div>
                                        <div class="stop-time">
                                            ${stopPlannedTime ? stopPlannedTime.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : '—'}
                                            ${stopDelayMin > 0 ? `<span class="stop-delay">+${stopDelayMin}'</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            // Hinweise anzeigen
            if (departure.remarks && departure.remarks.length > 0) {
                html += `
                    <div class="detail-section">
                        <div class="detail-section-title">ℹ️ Hinweise</div>
                        ${departure.remarks.map(remark => `
                            <div class="remark-item">
                                ${remark.type ? `<div class="remark-type">${remark.type}</div>` : ''}
                                <div class="remark-text">${remark.text || remark.summary || 'Keine Details'}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Zusätzliche Trip-Details
            if (tripDetails) {
                if (tripDetails.cycle) {
                    html += `
                        <div class="detail-section">
                            <div class="detail-section-title">🔄 Umlauf</div>
                            ${tripDetails.cycle.min ? `
                                <div class="detail-row">
                                    <div class="detail-label">Min. Takt</div>
                                    <div class="detail-value">${tripDetails.cycle.min} min</div>
                                </div>
                            ` : ''}
                            ${tripDetails.cycle.max ? `
                                <div class="detail-row">
                                    <div class="detail-label">Max. Takt</div>
                                    <div class="detail-value">${tripDetails.cycle.max} min</div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }

                if (tripDetails.direction) {
                    html += `
                        <div class="detail-section">
                            <div class="detail-row">
                                <div class="detail-label">Ziel-Richtung</div>
                                <div class="detail-value">${tripDetails.direction}</div>
                            </div>
                        </div>
                    `;
                }
            }

            detailContent.innerHTML = html;
        }

        function closeDetailModal() {
            detailModal.classList.remove('active');
            detailModal.style.transform = '';
            document.body.style.overflow = '';
            
            // Resume auto-refresh
            if (currentStationId) {
                startAutoRefresh();
            }
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }

        // Detail Modal schließen
        detailBackBtn.addEventListener('click', closeDetailModal);

        // ESC-Taste schließt Modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && detailModal.classList.contains('active')) {
                closeDetailModal();
            }
            if (e.key === 'Escape' && journeyDetailModal.classList.contains('active')) {
                closeJourneyDetailModal();
            }
        });

        // Journey Detail Modal schließen
        journeyDetailBackBtn.addEventListener('click', closeJourneyDetailModal);

        function closeJourneyDetailModal() {
            journeyDetailModal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function getLineColor(line) {
            if (!line || !line.product) return '#666';
            
            const product = line.product.toLowerCase();
            const name = line.name ? line.name.toUpperCase() : '';

            // U-Bahn Linien
            if (product === 'subway' || name.startsWith('U')) {
                const ubahnColors = {
                    'U1': '#55a838', 'U2': '#da421e', 'U3': '#16683d',
                    'U4': '#f0d722', 'U5': '#7e5330', 'U6': '#8c6dab',
                    'U7': '#528dba', 'U8': '#224f86', 'U9': '#f3791d'
                };
                return ubahnColors[name] || '#0066CC';
            }

            // S-Bahn
            if (product === 'suburban' || name.startsWith('S')) {
                return '#5D871E';
            }

            // Tram
            if (product === 'tram') {
                return '#CC0000';
            }

            // Bus
            if (product === 'bus') {
                return '#993399';
            }

            // Regional
            if (product === 'regional' || product === 'regionalexp') {
                return '#DC281E';
            }

            return '#666';
        }

        // Refresh button
        refreshBtn.addEventListener('click', loadDepartures);

        // Journey Planner State
        let journeyFromStation = null;
        let journeyToStation = null;

        // Journey Autocomplete
        let journeyFromTimeout = null;
        let journeyToTimeout = null;

        function setupJourneyAutocomplete(inputField, suggestionsContainer, onSelect) {
            let timeout = null;

            inputField.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                clearTimeout(timeout);
                
                if (query.length < 2) {
                    suggestionsContainer.classList.remove('active');
                    suggestionsContainer.innerHTML = '';
                    return;
                }

                timeout = setTimeout(async () => {
                    if (!canMakeApiCall()) {
                        console.warn('Rate limit reached, skipping search');
                        return;
                    }
                    
                    try {
                        const response = await fetch(`${API_BASE}/locations?query=${encodeURIComponent(query)}&results=10`);
                        const locations = await response.json();
                        
                        const stops = locations.filter(loc => 
                            loc.type === 'stop' || loc.type === 'station'
                        );
                        
                        if (stops.length > 0) {
                            suggestionsContainer.innerHTML = stops.map(stop => `
                                <div class="suggestion-item" data-id="${stop.id}" data-name="${stop.name}">
                                    ${stop.name}
                                </div>
                            `).join('');
                            
                            suggestionsContainer.classList.add('active');
                            
                            suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                                item.addEventListener('click', () => {
                                    const id = item.dataset.id;
                                    const name = item.dataset.name;
                                    onSelect(id, name);
                                    inputField.value = name;
                                    suggestionsContainer.classList.remove('active');
                                    
                                    if (navigator.vibrate) navigator.vibrate(10);
                                });
                            });
                        }
                    } catch (error) {
                        console.error('Autocomplete error:', error);
                    }
                }, 300);
            });
        }

        // Setup Journey From
        setupJourneyAutocomplete(journeyFrom, suggestionsFrom, (id, name) => {
            journeyFromStation = { id, name };
            checkJourneySearchReady();
        });

        // Setup Journey To
        setupJourneyAutocomplete(journeyTo, suggestionsTo, (id, name) => {
            journeyToStation = { id, name };
            checkJourneySearchReady();
        });

        // Clear buttons
        clearFromBtn.addEventListener('click', () => {
            journeyFrom.value = '';
            journeyFromStation = null;
            suggestionsFrom.classList.remove('active');
            checkJourneySearchReady();
        });

        clearToBtn.addEventListener('click', () => {
            journeyTo.value = '';
            journeyToStation = null;
            suggestionsTo.classList.remove('active');
            checkJourneySearchReady();
        });

        // Swap button
        swapBtn.addEventListener('click', () => {
            const tempStation = journeyFromStation;
            const tempValue = journeyFrom.value;
            
            journeyFromStation = journeyToStation;
            journeyFrom.value = journeyTo.value;
            
            journeyToStation = tempStation;
            journeyTo.value = tempValue;
            
            checkJourneySearchReady();
            
            if (navigator.vibrate) navigator.vibrate(15);
        });

        // Location From Button
        locationFromBtn.addEventListener('click', async () => {
            if (!navigator.geolocation) {
                alert('⚠️ Standortdienste nicht verfügbar');
                return;
            }

            if (!canMakeApiCall()) {
                alert('⚠️ Rate-Limit erreicht');
                return;
            }

            locationFromBtn.disabled = true;
            locationFromBtn.textContent = '⌛';

            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 30000
                    });
                });

                const { latitude, longitude } = position.coords;
                
                const response = await fetch(
                    `${API_BASE}/locations/nearby?latitude=${latitude}&longitude=${longitude}&results=10`
                );

                if (!response.ok) throw new Error('API_ERROR');

                const locations = await response.json();
                const stations = locations.filter(loc => 
                    loc.type === 'stop' || loc.type === 'station'
                );

                if (stations.length === 0) throw new Error('NO_STATIONS');

                const nearest = stations[0];
                journeyFromStation = { id: nearest.id, name: nearest.name };
                journeyFrom.value = nearest.name;
                checkJourneySearchReady();

                if (navigator.vibrate) navigator.vibrate([50, 100, 50]);

            } catch (error) {
                console.error('Location error:', error);
                alert('⚠️ Standort konnte nicht ermittelt werden');
            } finally {
                locationFromBtn.disabled = false;
                locationFromBtn.textContent = '📍';
            }
        });

        // Check if search is ready
        function checkJourneySearchReady() {
            if (journeyFromStation && journeyToStation) {
                searchJourneyBtn.disabled = false;
            } else {
                searchJourneyBtn.disabled = true;
            }
        }

        // Search Journey
        searchJourneyBtn.addEventListener('click', async () => {
            if (!journeyFromStation || !journeyToStation) return;

            if (!canMakeApiCall()) {
                alert('⚠️ Rate-Limit erreicht. Bitte warte kurz.');
                return;
            }

            journeyContainer.innerHTML = '<div class="loading">⏳ Suche Verbindungen...</div>';

            try {
                const url = `${API_BASE}/journeys?from=${journeyFromStation.id}&to=${journeyToStation.id}&results=5&transfers=3&transferTime=5`;
                
                const response = await fetch(url);
                if (!response.ok) throw new Error('API-Fehler');

                const data = await response.json();
                displayJourneys(data.journeys || []);

                if (navigator.vibrate) navigator.vibrate(10);

            } catch (error) {
                console.error('Journey search error:', error);
                journeyContainer.innerHTML = `
                    <div class="error">
                        ⚠️ Fehler bei der Routensuche<br>
                        <small>${error.message}</small>
                    </div>
                `;
            }
        });

        // Display Journeys
        let currentJourneys = []; // Speichert aktuelle Journeys für Detail-Ansicht

        function displayJourneys(journeys) {
            currentJourneys = journeys; // Speichern für später
            
            if (!journeys || journeys.length === 0) {
                journeyContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚫</div>
                        Keine Verbindungen gefunden
                    </div>
                `;
                return;
            }

            const html = journeys.map((journey, journeyIndex) => {
                const departure = new Date(journey.legs[0].plannedDeparture || journey.legs[0].departure);
                const arrival = new Date(journey.legs[journey.legs.length - 1].plannedArrival || journey.legs[journey.legs.length - 1].arrival);
                
                const durationMs = arrival - departure;
                const durationMin = Math.round(durationMs / 60000);
                const hours = Math.floor(durationMin / 60);
                const minutes = durationMin % 60;
                const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

                // Normalisierungs-Funktion definieren (wird mehrfach gebraucht)
                function normalizeStationName(name) {
                    if (!name) return '';
                    return name
                        .replace(/^(S\+U|U|S)\s+/i, '')
                        .replace(/\s*\(.*?\)\s*/g, '')
                        .replace(/^Berlin\s+/i, '')
                        .toLowerCase()
                        .trim();
                }
                
                // SCHRITT 1: Filtere Same-Place-Walks VORHER aus dem Array
                const filteredLegs = journey.legs.filter((leg) => {
                    // Behalte alle Fahrzeuge
                    if (leg.line) return true;
                    
                    // Prüfe Fußwege: Nur behalten wenn verschiedene Orte
                    const originNorm = normalizeStationName(leg.origin?.name);
                    const destNorm = normalizeStationName(leg.destination?.name);
                    
                    const samePlace = originNorm && destNorm && (
                        originNorm === destNorm || 
                        originNorm.includes(destNorm) || 
                        destNorm.includes(originNorm)
                    );
                    
                    return !samePlace; // NUR Fußwege zwischen verschiedenen Orten behalten
                });
                
                // SCHRITT 2: Zeige gefilterte Legs an
                const legsHtml = filteredLegs.map((leg, index) => {
                    const icon = getTransportIcon(leg);
                    const lineColor = leg.line ? getLineColor(leg.line) : '#666';
                    
                    const depTime = new Date(leg.plannedDeparture || leg.departure).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                    const arrTime = new Date(leg.plannedArrival || leg.arrival).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                    
                    // Fahrtdauer dieses Legs
                    const legDuration = Math.round((new Date(leg.plannedArrival || leg.arrival) - new Date(leg.plannedDeparture || leg.departure)) / 60000);
                    
                    // Gleisangaben
                    const depPlatform = leg.departurePlatform ? `Gleis ${leg.departurePlatform}` : '';
                    const arrPlatform = leg.arrivalPlatform ? `Gleis ${leg.arrivalPlatform}` : '';
                    
                    let transferHtml = '';
                    // Transfer-Zeit zum NÄCHSTEN gefilterten Leg
                    if (index < filteredLegs.length - 1) {
                        const nextLeg = filteredLegs[index + 1];
                        
                        const arrivalTime = new Date(leg.plannedArrival || leg.arrival);
                        const nextDepartureTime = new Date(nextLeg.plannedDeparture || nextLeg.departure);
                        const transferTime = Math.round((nextDepartureTime - arrivalTime) / 60000);
                        
                        // Bestimme Art des Übergangs
                        let transferType = '';
                        let transferIcon = '';
                        
                        // Prüfe ob gleicher Bahnhof
                        const destName = normalizeStationName(leg.destination?.name);
                        const originName = normalizeStationName(nextLeg.origin?.name);
                        
                        const sameStation = destName && originName && (
                            destName === originName || 
                            destName.includes(originName) || 
                            originName.includes(destName)
                        );
                        
                        if (leg.line && nextLeg.line) {
                            // Beide sind Fahrzeuge
                            if (sameStation) {
                                transferType = 'Umstieg';
                                transferIcon = '🔄';
                            } else {
                                transferType = 'Fußweg';
                                transferIcon = '🚶';
                            }
                        } else if (!leg.line || !nextLeg.line) {
                            // Mindestens eines ist Fußweg
                            transferType = 'Fußweg';
                            transferIcon = '🚶';
                        }
                        
                        const platformInfo = arrPlatform && nextLeg.departurePlatform ? 
                            ` • ${arrPlatform} → Gleis ${nextLeg.departurePlatform}` : '';
                        
                        // Berechne Anzeige-Zeit
                        let displayTime = transferTime >= 0 ? transferTime : 0;
                        
                        // Mindestens 2 Min bei Umstieg am gleichen Bahnhof
                        if (transferType === 'Umstieg' && sameStation && displayTime < 2) {
                            displayTime = Math.max(2, displayTime);
                        }
                        
                        // Warnung bei kurzen Umstiegszeiten
                        let warningClass = '';
                        if (transferType === 'Umstieg' && displayTime < 3) {
                            warningClass = ' very-tight';
                        } else if (transferType === 'Umstieg' && displayTime < 5) {
                            warningClass = ' tight';
                        }
                        
                        transferHtml = `
                            <div class="journey-transfer${warningClass}">
                                <span>${transferIcon} ${transferType}${platformInfo}</span>
                                <span class="journey-transfer-time">${displayTime} min</span>
                            </div>
                        `;
                    }
                    
                    // Zeige Dauer bei Fußwegen in der Leg-Zeile
                    const durationBadge = !leg.line ? ` <span style="opacity:0.7;font-size:0.9em">(${legDuration} min)</span>` : '';
                    
                    return `
                        <div class="journey-leg" style="border-left-color: ${lineColor}" data-leg-index="${index}">
                            <div class="journey-leg-header">
                                <div class="journey-leg-icon">${icon}</div>
                                <div class="journey-leg-line">${leg.line ? leg.line.name : 'Fußweg'}${durationBadge}</div>
                                <div class="journey-leg-duration">${legDuration} min</div>
                            </div>
                            
                            <div class="journey-leg-stop">
                                <div class="journey-leg-station">${leg.origin.name}</div>
                                <div class="journey-leg-platform">${depPlatform || ''}</div>
                                <div class="journey-leg-time">${depTime}</div>
                            </div>
                            
                            <div class="journey-leg-stop">
                                <div class="journey-leg-station">${leg.destination.name}</div>
                                <div class="journey-leg-platform">${arrPlatform || ''}</div>
                                <div class="journey-leg-time">${arrTime}</div>
                            </div>
                        </div>
                        ${transferHtml}
                    `;
                }).join('');

                return `
                    <div class="journey-result" data-journey-index="${journeyIndex}" style="cursor: pointer;">
                        <div class="journey-header">
                            <div class="journey-time">
                                ${departure.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} 
                                → 
                                ${arrival.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div class="journey-duration">${durationText}</div>
                        </div>
                        <div class="journey-legs">
                            ${legsHtml}
                        </div>
                    </div>
                `;
            }).join('');

            journeyContainer.innerHTML = html;

            // Click-Handler für Journey Results
            journeyContainer.querySelectorAll('.journey-result').forEach(item => {
                item.addEventListener('click', () => {
                    const journeyIndex = parseInt(item.dataset.journeyIndex);
                    showJourneyDetails(currentJourneys[journeyIndex], journeyIndex);
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(10);
                    }
                });
            });
        }

        // Show Journey Details
        function showJourneyDetails(journey, journeyIndex) {
            journeyDetailModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            const departure = new Date(journey.legs[0].plannedDeparture || journey.legs[0].departure);
            const arrival = new Date(journey.legs[journey.legs.length - 1].plannedArrival || journey.legs[journey.legs.length - 1].arrival);
            
            const durationMs = arrival - departure;
            const durationMin = Math.round(durationMs / 60000);
            const hours = Math.floor(durationMin / 60);
            const minutes = durationMin % 60;
            const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

            journeyDetailTitle.textContent = `Verbindung ${journeyIndex + 1}`;

            let contentHTML = `
                <div class="detail-section">
                    <div class="detail-section-title">📍 Übersicht</div>
                    <div class="detail-row">
                        <span class="detail-label">Von:</span>
                        <span class="detail-value">${journey.legs[0].origin.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nach:</span>
                        <span class="detail-value">${journey.legs[journey.legs.length - 1].destination.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Abfahrt:</span>
                        <span class="detail-value">${departure.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Ankunft:</span>
                        <span class="detail-value">${arrival.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dauer:</span>
                        <span class="detail-value">${durationText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Umstiege:</span>
                        <span class="detail-value">${journey.legs.filter(leg => leg.line).length - 1} Umstiege</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">🚉 Fahrtabschnitte</div>
            `;

            // Normalisierungs-Funktion
            function normalizeStationName(name) {
                if (!name) return '';
                return name
                    .replace(/^(S\+U|U|S)\s+/i, '')
                    .replace(/\s*\(.*?\)\s*/g, '')
                    .replace(/^Berlin\s+/i, '')
                    .toLowerCase()
                    .trim();
            }

            // Filtere Same-Place-Walks VORHER
            const filteredLegs = journey.legs.filter((leg) => {
                if (leg.line) return true;
                
                const originNorm = normalizeStationName(leg.origin?.name);
                const destNorm = normalizeStationName(leg.destination?.name);
                
                const samePlace = originNorm && destNorm && (
                    originNorm === destNorm || 
                    originNorm.includes(destNorm) || 
                    destNorm.includes(originNorm)
                );
                
                return !samePlace;
            });

            filteredLegs.forEach((leg, index) => {
                const icon = getTransportIcon(leg);
                const lineColor = leg.line ? getLineColor(leg.line) : '#666';
                const depTime = new Date(leg.plannedDeparture || leg.departure).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                const arrTime = new Date(leg.plannedArrival || leg.arrival).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                
                const depPlatform = leg.departurePlatform ? `Gleis ${leg.departurePlatform}` : '';
                const arrPlatform = leg.arrivalPlatform ? `Gleis ${leg.arrivalPlatform}` : '';

                const legDuration = Math.round((new Date(leg.plannedArrival || leg.arrival) - new Date(leg.plannedDeparture || leg.departure)) / 60000);

                contentHTML += `
                    <div class="journey-detail-leg" style="border-left: 4px solid ${lineColor}">
                        <div class="journey-detail-leg-header">
                            <span style="font-size: 20px;">${icon}</span>
                            <span style="font-weight: bold; font-size: 16px;">${leg.line ? leg.line.name : 'Fußweg'}</span>
                            <span style="opacity: 0.7; font-size: 13px;">${legDuration} min</span>
                        </div>
                        
                        <div class="journey-detail-stop">
                            <div class="journey-detail-stop-time">${depTime}</div>
                            <div class="journey-detail-stop-name">${leg.origin.name}</div>
                            ${depPlatform ? `<div class="journey-detail-platform">${depPlatform}</div>` : ''}
                        </div>

                        ${leg.stopovers && leg.stopovers.length > 0 ? `
                            <div class="journey-detail-intermediate">
                                <span style="opacity: 0.6; font-size: 12px;">🔄 ${leg.stopovers.length} Halte</span>
                            </div>
                        ` : ''}

                        <div class="journey-detail-stop">
                            <div class="journey-detail-stop-time">${arrTime}</div>
                            <div class="journey-detail-stop-name">${leg.destination.name}</div>
                            ${arrPlatform ? `<div class="journey-detail-platform">${arrPlatform}</div>` : ''}
                        </div>
                    </div>
                `;

                // Transfer-Zeit zum NÄCHSTEN gefilterten Leg
                if (index < filteredLegs.length - 1) {
                    const nextLeg = filteredLegs[index + 1];
                    
                    const arrivalTime = new Date(leg.plannedArrival || leg.arrival);
                    const nextDepartureTime = new Date(nextLeg.plannedDeparture || nextLeg.departure);
                    const transferTime = Math.round((nextDepartureTime - arrivalTime) / 60000);
                    
                    // Bestimme Art des Übergangs
                    let transferType = '';
                    let transferIcon = '';
                    
                    const destName = normalizeStationName(leg.destination?.name);
                    const originName = normalizeStationName(nextLeg.origin?.name);
                    
                    const sameStation = destName && originName && (
                        destName === originName || 
                        destName.includes(originName) || 
                        originName.includes(destName)
                    );
                    
                    if (leg.line && nextLeg.line) {
                        // Beide sind Fahrzeuge
                        if (sameStation) {
                            transferType = 'Umstieg';
                            transferIcon = '🔄';
                        } else {
                            transferType = 'Fußweg';
                            transferIcon = '🚶';
                        }
                    } else if (leg.walking || nextLeg.walking || !leg.line || !nextLeg.line) {
                        transferType = 'Fußweg';
                        transferIcon = '🚶';
                    }
                    
                    const platformInfo = arrPlatform && nextLeg.departurePlatform ? 
                        `<span style="font-size: 11px; opacity: 0.7;">${arrPlatform} → Gleis ${nextLeg.departurePlatform}</span>` 
                        : '';
                    
                    let displayTime = transferTime >= 0 ? transferTime : 0;
                    
                    if (transferType === 'Umstieg' && sameStation && displayTime < 2) {
                        displayTime = Math.max(2, displayTime);
                    }
                    
                    let warningClass = '';
                    if (transferType === 'Umstieg' && displayTime < 3) {
                        warningClass = ' very-tight';
                    } else if (transferType === 'Umstieg' && displayTime < 5) {
                        warningClass = ' tight';
                    }
                    
                    contentHTML += `
                        <div class="journey-detail-transfer${warningClass}">
                            <span>${transferIcon} ${transferType} • ${displayTime} min</span>
                            ${platformInfo}
                        </div>
                    `;
                }
            });

            contentHTML += `</div>`;

            // Hinweise wenn vorhanden
            if (journey.remarks && journey.remarks.length > 0) {
                contentHTML += `
                    <div class="detail-section">
                        <div class="detail-section-title">ℹ️ Hinweise</div>
                `;
                
                journey.remarks.forEach(remark => {
                    if (remark.text) {
                        contentHTML += `
                            <div class="remark-item">
                                <div class="remark-text">${remark.text}</div>
                            </div>
                        `;
                    }
                });
                
                contentHTML += `</div>`;
            }

            journeyDetailContent.innerHTML = contentHTML;

            if (navigator.vibrate) {
                navigator.vibrate(15);
            }
        }

        // Get Transport Icon
        function getTransportIcon(leg) {
            if (leg.walking) return '🚶';
            if (!leg.line) return '🚶';
            
            const product = leg.line.product;
            if (product === 'subway') return '🚇';
            if (product === 'suburban') return '🚊';
            if (product === 'tram') return '🚋';
            if (product === 'bus') return '🚌';
            if (product === 'regional' || product === 'regionalExp') return '🚆';
            if (product === 'ferry') return '⛴️';
            
            return '🚉';
        }

        // Initial state
        if (!navigator.onLine) {
            offlineIndicator.classList.add('show');
        }

        // ==========================================
        // LIVE-MAP FUNCTIONALITY
        // ==========================================
        
        let liveMap = null;
        let vehicleMarkers = [];
        let liveMapUpdateInterval = null;
        let activeVehicleTypes = new Set(['all']);
        let debounceTimer = null;

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
            
            // Auto-Update alle 15 Sekunden (erhöht von 10s)
            liveMapUpdateInterval = setInterval(loadVehicles, 15000);
            
            // Event-Listener: Neu laden wenn Karte bewegt/gezoomt wird
            // Mit Debouncing (1 Sekunde Verzögerung) um API zu schonen
            liveMap.on('moveend', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    console.log('Map moved/zoomed, reloading vehicles...');
                    loadVehicles();
                }, 1000);  // 1 Sekunde warten nach Bewegung
            });
            
            console.log('Live-Map initialisiert mit dynamischen Bounds');
        }

        // Fahrzeuge von API laden
        async function loadVehicles() {
            // Sicherheitsabfrage: Map muss existieren
            if (!liveMap) {
                console.log('Live-Map noch nicht initialisiert');
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

                console.log('Loading vehicles for bounds:', bounds);

                const url = `${API_BASE}/radar?` +
                    `north=${bounds.north}&south=${bounds.south}&` +
                    `west=${bounds.west}&east=${bounds.east}&` +
                    `results=200&duration=60&` +
                    `subway=true&bus=true&tram=true&suburban=true&regional=true`;

                const response = await fetch(url);
                if (!response.ok) throw new Error('Radar API Error');

                const data = await response.json();
                console.log('API returned', data.movements?.length || 0, 'vehicles');
                displayVehicles(data.movements || []);

            } catch (error) {
                console.error('Load vehicles error:', error);
                const counterEl = document.getElementById('vehicleCount');
                if (counterEl) {
                    counterEl.textContent = '⚠️ Fehler beim Laden der Fahrzeuge';
                }
            }
        }

        // Fahrzeuge auf Map anzeigen
        function displayVehicles(movements) {
            // Alte Marker entfernen
            vehicleMarkers.forEach(marker => marker.remove());
            vehicleMarkers = [];

            console.log('displayVehicles called with', movements.length, 'movements');
            console.log('Active vehicle types:', Array.from(activeVehicleTypes));

            // Filtern nach aktiven Typen
            const filteredMovements = movements.filter(m => {
                if (activeVehicleTypes.has('all')) return true;
                const vehicleType = getVehicleType(m.line?.product, m.line?.name);
                return activeVehicleTypes.has(vehicleType);
            });

            console.log('Filtered to', filteredMovements.length, 'vehicles');

            // Update Counter
            document.getElementById('vehicleCount').innerHTML = 
                `🚇 <span style="color: #fff;">${filteredMovements.length}</span> Fahrzeuge aktiv`;

            // Marker erstellen
            filteredMovements.forEach(movement => {
                if (!movement.location || !movement.location.latitude || !movement.location.longitude) {
                    return;
                }

                const lat = movement.location.latitude;
                const lon = movement.location.longitude;
                const lineName = movement.line?.name || 'Unbekannt';
                const emoji = getVehicleEmoji(movement.line?.product, lineName);
                
                // Echte BVG-Linienfarbe!
                const lineColor = getBVGLineColor(lineName);
                
                // Textfarbe anpassen (weiß oder schwarz je nach Hintergrund)
                const isLightBg = lineColor === '#F0D722' || lineColor === '#FFFFFF' || lineColor === '#55A823';
                const textColor = isLightBg ? '#000' : '#FFF';
                
                // Custom Icon: Emoji OBEN, Linie UNTEN
                const icon = L.divIcon({
                    html: `
                        <div class="vehicle-marker-container">
                            <div class="vehicle-emoji">${emoji}</div>
                            <div class="vehicle-line" style="
                                background: ${lineColor};
                                color: ${textColor};
                            ">${lineName}</div>
                        </div>
                    `,
                    className: 'custom-marker',
                    iconSize: [50, 60],
                    iconAnchor: [25, 30]
                });

                // Marker erstellen
                const marker = L.marker([lat, lon], { icon: icon });

                // Popup mit Fahrzeuginfos
                const direction = movement.direction || 'Keine Angabe';
                const delay = movement.delay ? `+${Math.round(movement.delay / 60)} min Verspätung` : 'Pünktlich';
                
                const popupContent = `
                    <div class="vehicle-popup">
                        <div class="popup-line" style="background: ${lineColor}; color: ${textColor}; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px;">
                            ${emoji} ${lineName}
                        </div>
                        <div class="popup-direction">→ ${direction}</div>
                        <div class="popup-delay">${delay}</div>
                    </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(liveMap);
                vehicleMarkers.push(marker);
            });
        }

        // Filter Buttons mit Event Delegation
        document.addEventListener('click', function(e) {
            // Prüfen ob es ein Filter-Button ist
            if (e.target.closest('.filter-btn')) {
                const btn = e.target.closest('.filter-btn');
                const type = btn.dataset.type;
                
                console.log('Filter button clicked:', type);
                
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
                        console.log('Removed filter:', type);
                    } else {
                        activeVehicleTypes.add(type);
                        btn.classList.add('active');
                        console.log('Added filter:', type);
                    }
                    
                    // Falls keine Filter aktiv, "Alle" wieder aktivieren
                    if (activeVehicleTypes.size === 0) {
                        activeVehicleTypes.add('all');
                        const allBtn = document.querySelector('.filter-btn[data-type="all"]');
                        if (allBtn) allBtn.classList.add('active');
                        console.log('No filters active, reset to all');
                    }
                }
                
                console.log('Active filters after click:', Array.from(activeVehicleTypes));
                
                // Fahrzeuge neu laden mit Filter
                loadVehicles();
                
                if (navigator.vibrate) navigator.vibrate(5);
            }
        });


// ==========================================
// UPDATES VIEW - CHANGELOG LOADER
// ==========================================

async function loadChangelog() {
    const container = document.getElementById('changelogContent');
    
    try {
        const response = await fetch('CHANGELOG.md');
        if (!response.ok) throw new Error('CHANGELOG nicht gefunden');
        
        const markdown = await response.text();
        const html = parseChangelog(markdown);
        container.innerHTML = html;
        
        // Accordion-Funktionalität
        document.querySelectorAll('.version-header').forEach(header => {
            header.addEventListener('click', () => {
                const versionBox = header.parentElement;
                versionBox.classList.toggle('open');
                
                // Vibration Feedback
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
        
    } catch (error) {
        console.error('Changelog Fehler:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #ff5555;">
                <p style="font-size: 18px; margin-bottom: 10px;">⚠️ Changelog konnte nicht geladen werden</p>
                <p style="font-size: 14px; opacity: 0.7;">${error.message}</p>
            </div>
        `;
    }
}

function parseChangelog(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    let currentVersion = null;
    let currentCategory = null;
    let changes = {};
    
    // Parse Markdown
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Version Header: ## [30.0.0] - 2026-02-10
        if (line.match(/^## \[(\d+\.\d+\.\d+)\] - (.+)$/)) {
            // Speichere vorherige Version
            if (currentVersion) {
                html += renderVersion(currentVersion, changes);
                changes = {};
            }
            
            const match = line.match(/^## \[(\d+\.\d+\.\d+)\] - (.+)$/);
            currentVersion = {
                number: match[1],
                date: match[2]
            };
        }
        
        // Kategorie: ### Added
        else if (line.match(/^### (.+)$/)) {
            const match = line.match(/^### (.+)$/);
            currentCategory = match[1];
            if (!changes[currentCategory]) {
                changes[currentCategory] = [];
            }
        }
        
        // Change Item: - Feature xyz
        else if (line.match(/^[-*] (.+)$/) && currentCategory) {
            const match = line.match(/^[-*] (.+)$/);
            changes[currentCategory].push(match[1]);
        }
    }
    
    // Speichere letzte Version
    if (currentVersion) {
        html += renderVersion(currentVersion, changes);
    }
    
    // GitHub Link Button
    html += `
        <a href="https://github.com/Serverlele30/VBB-Status-Web-App" 
           target="_blank" 
           class="github-link-btn">
            💻 Alle Updates & Code auf GitHub
        </a>
    `;
    
    return html;
}

function renderVersion(version, changes) {
    const categoryIcons = {
        'Added': '✨',
        'Changed': '🔄',
        'Fixed': '🐛',
        'Removed': '🗑️',
        'Deprecated': '⚠️',
        'Security': '🔒'
    };
    
    let categoriesHtml = '';
    
    for (const [category, items] of Object.entries(changes)) {
        if (items.length === 0) continue;
        
        const icon = categoryIcons[category] || '📝';
        const itemsHtml = items.map(item => `<li class="change-item">${item}</li>`).join('');
        
        categoriesHtml += `
            <div class="change-category">
                <div class="change-category-title">${icon} ${category}</div>
                <ul class="change-list">
                    ${itemsHtml}
                </ul>
            </div>
        `;
    }
    
    return `
        <div class="version-box">
            <div class="version-header">
                <div class="version-title">
                    <span class="version-number">v${version.number}</span>
                    <span class="version-date">${version.date}</span>
                </div>
                <span class="version-toggle">▼</span>
            </div>
            <div class="version-content">
                <div class="version-content-inner">
                    ${categoriesHtml}
                </div>
            </div>
        </div>
    `;
}

// Changelog laden wenn Updates-View geöffnet wird
document.addEventListener('DOMContentLoaded', () => {
    // Wenn direkt Updates-View aktiv ist
    if (document.getElementById('view-updates')?.classList.contains('active')) {
        loadChangelog();
    }
    
    // Beim View-Wechsel
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'view-updates' && 
                mutation.target.classList.contains('active')) {
                // Nur laden wenn noch nicht geladen
                const content = document.getElementById('changelogContent');
                if (content.innerHTML.includes('Lade Changelog')) {
                    loadChangelog();
                }
            }
        });
    });
    
    const updatesView = document.getElementById('view-updates');
    if (updatesView) {
        observer.observe(updatesView, { attributes: true, attributeFilter: ['class'] });
    }
});
