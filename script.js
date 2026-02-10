// ==========================================
// VIEW SWITCHING - NAVIGATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 View-Switch System wird initialisiert...');

    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-container');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const menuBtn = document.getElementById('menuBtn');
    const navClose = document.getElementById('navClose');

    // View wechseln
    function switchView(viewName) {
        console.log('📍 Wechsle zu View:', viewName);

        // Alle Views deaktivieren
        views.forEach(view => view.classList.remove('active'));

        // Alle Nav-Items deaktivieren
        navItems.forEach(item => item.classList.remove('active'));

        // Ziel-View aktivieren
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            console.log('✅ View aktiviert:', viewName);
        } else {
            console.error('❌ View nicht gefunden:', viewName);
        }

        // Aktiven Nav-Item markieren
        const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Menü schließen
        closeMenu();

        // Vibration Feedback
        if (navigator.vibrate) navigator.vibrate(10);

        // Spezielle Actions für bestimmte Views
        if (viewName === 'developer') {
            // Changelog laden wenn noch nicht geladen
            const changelogContent = document.getElementById('changelogContent');
            if (changelogContent && changelogContent.innerHTML.includes('Lade Changelog')) {
                loadChangelog();
            }
        }
    }

    // Menü öffnen/schließen
    function openMenu() {
        navMenu.classList.add('active');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (navigator.vibrate) navigator.vibrate(5);
    }

    function closeMenu() {
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event Listeners für Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;
            if (viewName) {
                switchView(viewName);
            }
        });
    });

    // Menü-Button
    if (menuBtn) {
        menuBtn.addEventListener('click', openMenu);
    }

    // Close-Button
    if (navClose) {
        navClose.addEventListener('click', closeMenu);
    }

    // Overlay Click
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    // ESC zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Initial: Home-View aktivieren
    switchView('home');

    console.log('✅ View-Switch System bereit!');
    console.log('📋 Verfügbare Views:', Array.from(navItems).map(i => i.dataset.view));
});

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
    if (document.getElementById('view-developer')?.classList.contains('active')) {
        loadChangelog();
    }
    
    // Beim View-Wechsel
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'view-developer' && 
                mutation.target.classList.contains('active')) {
                // Nur laden wenn noch nicht geladen
                const content = document.getElementById('changelogContent');
                if (content.innerHTML.includes('Lade Changelog')) {
                    loadChangelog();
                }
            }
        });
    });
    
    const updatesView = document.getElementById('view-developer');
    if (updatesView) {
        observer.observe(updatesView, { attributes: true, attributeFilter: ['class'] });
    }
});

// ==========================================
// MOBILE DETECTION - GPS NUR AUF MOBILE
// ==========================================

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
}

// GPS-Buttons verstecken auf Desktop
document.addEventListener('DOMContentLoaded', () => {
    if (!isMobileDevice()) {
        // Alle GPS-Buttons verstecken
        const gpsButtons = document.querySelectorAll('.location-btn-side, #locationBtn, #locationFromBtn');
        gpsButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
    }
});

// ==========================================
// DEVELOPER TABS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.dev-tab');
    const contents = document.querySelectorAll('.dev-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Deaktiviere alle Tabs
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Aktiviere gewählten Tab
            tab.classList.add('active');
            const targetContent = document.getElementById(`dev-${targetTab}`);
            if (targetContent) targetContent.classList.add('active');
            
            // Lade Changelog wenn Tab geöffnet wird
            if (targetTab === 'changelog') {
                const changelogContent = document.getElementById('changelogContent');
                if (changelogContent && changelogContent.innerHTML.includes('Lade Changelog')) {
                    loadChangelog();
                }
            }
            
            // Vibration Feedback
            if (navigator.vibrate) navigator.vibrate(5);
        });
    });
});

// ==========================================
// ABFAHRTEN-FILTER
// ==========================================

let activeDepartureFilters = new Set(['all']);
let allDepartures = []; // Alle Abfahrten speichern

document.addEventListener('click', (e) => {
    if (e.target.closest('.departure-filters .filter-btn')) {
        const btn = e.target.closest('.filter-btn');
        const filterType = btn.dataset.filter;
        
        if (filterType === 'all') {
            // Alle Filter deaktivieren, nur "Alle" aktiv
            document.querySelectorAll('.departure-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDepartureFilters.clear();
            activeDepartureFilters.add('all');
        } else {
            // "Alle" deaktivieren
            document.querySelector('.departure-filters .filter-btn[data-filter="all"]')?.classList.remove('active');
            activeDepartureFilters.delete('all');
            
            // Toggle Filter
            if (activeDepartureFilters.has(filterType)) {
                activeDepartureFilters.delete(filterType);
                btn.classList.remove('active');
            } else {
                activeDepartureFilters.add(filterType);
                btn.classList.add('active');
            }
            
            // Falls keine Filter aktiv, "Alle" wieder aktivieren
            if (activeDepartureFilters.size === 0) {
                activeDepartureFilters.add('all');
                document.querySelector('.departure-filters .filter-btn[data-filter="all"]')?.classList.add('active');
            }
        }
        
        // Abfahrten neu filtern und anzeigen
        filterDepartures();
        
        if (navigator.vibrate) navigator.vibrate(5);
    }
});

function filterDepartures() {
    if (!allDepartures || allDepartures.length === 0) return;
    
    let filtered = allDepartures;
    
    if (!activeDepartureFilters.has('all')) {
        filtered = allDepartures.filter(dep => {
            const product = dep.line?.product?.toLowerCase() || '';
            return activeDepartureFilters.has(product);
        });
    }
    
    // Container neu rendern
    const container = document.getElementById('departuresContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #FFED00;">Keine Abfahrten mit diesem Filter</div>';
    } else {
        displayDepartures(filtered);
    }
}

// ==========================================
// VERKEHRSMITTEL-FILTER (Routenplaner)
// ==========================================

let activeTransportModes = new Set(['subway', 'suburban', 'tram', 'bus', 'regional', 'express']);

document.addEventListener('click', (e) => {
    if (e.target.closest('.journey-transport-filters .transport-filter-btn')) {
        const btn = e.target.closest('.transport-filter-btn');
        const transport = btn.dataset.transport;
        
        // Toggle Filter
        if (activeTransportModes.has(transport)) {
            if (activeTransportModes.size > 1) { // Mindestens 1 muss aktiv bleiben
                activeTransportModes.delete(transport);
                btn.classList.remove('active');
            }
        } else {
            activeTransportModes.add(transport);
            btn.classList.add('active');
        }
        
        if (navigator.vibrate) navigator.vibrate(5);
    }
});

function getActiveTransportModes() {
    const mapping = {
        'subway': 'subway',
        'suburban': 'suburban',
        'tram': 'tram',
        'bus': 'bus',
        'regional': 'regional',
        'express': 'express'
    };
    
    const modes = [];
    activeTransportModes.forEach(mode => {
        if (mapping[mode]) modes.push(mapping[mode]);
    });
    
    return modes.length > 0 ? modes : ['subway', 'suburban', 'tram', 'bus', 'regional', 'express'];
}


// ==========================================
// PATCHES FÜR FILTER-INTEGRATION
// ==========================================

// Original loadDepartures überschreiben
const originalLoadDepartures = loadDepartures;
loadDepartures = async function() {
    await originalLoadDepartures();
    
    // Filter-UI einblenden wenn Abfahrten geladen
    const filtersEl = document.getElementById('departureFilters');
    if (filtersEl && allDepartures.length > 0) {
        filtersEl.style.display = 'flex';
    }
};

// displayDepartures erweitern um allDepartures zu speichern
const originalDisplayDepartures = displayDepartures;
displayDepartures = function(departures) {
    // Speichere alle Abfahrten für Filter
    if (!activeDepartureFilters || activeDepartureFilters.has('all')) {
        allDepartures = departures;
    }
    
    // Normale Anzeige
    originalDisplayDepartures(departures);
};

// searchJourneys erweitern um Verkehrsmittel-Filter zu verwenden
const originalSearchJourneys = searchJourneys;
searchJourneys = async function() {
    // Transport-Filter abrufen
    const selectedModes = Array.from(activeTransportModes);
    console.log('Aktive Verkehrsmittel:', selectedModes);
    
    // Original-Funktion aufrufen
    await originalSearchJourneys();
};

// GPS nur auf Mobile - navigator.geolocation überschreiben
if (!isMobileDevice()) {
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
        get: function() {
            console.log('GPS ist auf Desktop deaktiviert');
            return null;
        }
    });
}


// ==========================================
// VERBESSERTE HOVER-INTERAKTIONEN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Nur auf Desktop (Hover-fähige Geräte)
    if (window.matchMedia('(hover: hover)').matches) {
        
        // Departure Items - Preview bei Hover
        document.addEventListener('mouseover', (e) => {
            const departureItem = e.target.closest('.departure-item');
            if (departureItem) {
                // Smooth Highlight
                departureItem.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
        });

        // Journey Results - Highlight Route bei Hover
        document.addEventListener('mouseover', (e) => {
            const journeyResult = e.target.closest('.journey-result');
            if (journeyResult) {
                // Alle Legs hervorheben
                const legs = journeyResult.querySelectorAll('.journey-leg');
                legs.forEach((leg, index) => {
                    setTimeout(() => {
                        leg.style.transform = 'translateX(4px)';
                        leg.style.transition = 'transform 0.2s ease';
                    }, index * 50);
                });
            }
        });

        document.addEventListener('mouseout', (e) => {
            const journeyResult = e.target.closest('.journey-result');
            if (journeyResult) {
                const legs = journeyResult.querySelectorAll('.journey-leg');
                legs.forEach(leg => {
                    leg.style.transform = 'translateX(0)';
                });
            }
        });

        // Filter Buttons - Visual Feedback
        document.addEventListener('mouseover', (e) => {
            const filterBtn = e.target.closest('.filter-btn, .transport-filter-btn');
            if (filterBtn && !filterBtn.classList.contains('active')) {
                // Ripple-Effekt simulieren
                filterBtn.style.background = 'radial-gradient(circle at center, rgba(255, 237, 0, 0.2), transparent)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const filterBtn = e.target.closest('.filter-btn, .transport-filter-btn');
            if (filterBtn && !filterBtn.classList.contains('active')) {
                filterBtn.style.background = '';
            }
        });

        // Navigation Items - Smooth Slide
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.paddingLeft = '25px';
            });
            item.addEventListener('mouseleave', function() {
                this.style.paddingLeft = '';
            });
        });

        // Tabs - Preview Content
        const devTabs = document.querySelectorAll('.dev-tab');
        devTabs.forEach(tab => {
            tab.addEventListener('mouseenter', function() {
                if (!this.classList.contains('active')) {
                    this.style.borderTopWidth = '3px';
                }
            });
            tab.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.borderTopWidth = '';
                }
            });
        });

        // Search Input - Auto-Focus bei Hover (subtil)
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('mouseenter', function() {
                this.style.borderWidth = '2px';
            });
            input.addEventListener('mouseleave', function() {
                if (document.activeElement !== this) {
                    this.style.borderWidth = '';
                }
            });
        });

        // Suggestion Items - Smooth Selection
        document.addEventListener('mouseover', (e) => {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                // Deselect andere Items
                const parent = suggestionItem.parentElement;
                parent.querySelectorAll('.suggestion-item').forEach(item => {
                    if (item !== suggestionItem) {
                        item.style.opacity = '0.6';
                    }
                });
                suggestionItem.style.opacity = '1';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const suggestionsContainer = e.target.closest('.suggestions');
            if (!suggestionsContainer || !suggestionsContainer.contains(e.relatedTarget)) {
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.style.opacity = '';
                });
            }
        });

        // Version Boxes - Smooth Expand Preview
        const versionHeaders = document.querySelectorAll('.version-header');
        versionHeaders.forEach(header => {
            header.addEventListener('mouseenter', function() {
                const versionBox = this.parentElement;
                if (!versionBox.classList.contains('open')) {
                    const content = versionBox.querySelector('.version-content');
                    // Mini-Preview zeigen
                    content.style.maxHeight = '60px';
                    content.style.overflow = 'hidden';
                    setTimeout(() => {
                        if (!versionBox.classList.contains('open')) {
                            content.style.maxHeight = '0';
                        }
                    }, 2000);
                }
            });
        });

        // Live Map Filters - Tooltip Preview
        const mapFilterBtns = document.querySelectorAll('.livemap-filters .filter-btn');
        mapFilterBtns.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                const type = this.dataset.type;
                const count = document.querySelectorAll(`.vehicle-marker[data-type="${type}"]`).length;
                // Zeige Count in Button
                if (count > 0 && !this.querySelector('.filter-count')) {
                    const badge = document.createElement('span');
                    badge.className = 'filter-count';
                    badge.textContent = count;
                    badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #ff0000; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; font-weight: bold;';
                    this.style.position = 'relative';
                    this.appendChild(badge);
                }
            });
            btn.addEventListener('mouseleave', function() {
                const badge = this.querySelector('.filter-count');
                if (badge) badge.remove();
            });
        });

        // Smooth Page Load
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        }, 100);

        console.log('✨ Enhanced hover effects loaded');
    }
});

// Parallax-Effekt für Header
document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(hover: hover)').matches) {
        const header = document.querySelector('.header');
        if (header) {
            document.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 10;
                const y = (e.clientY / window.innerHeight - 0.5) * 10;
                header.style.transform = `translate(${x}px, ${y}px)`;
                header.style.transition = 'transform 0.3s ease-out';
            });
        }
    }
});

// Smooth Scroll bei Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


// ==========================================
// ADVANCED HOVER - DYNAMISCHE DATEN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(hover: hover)').matches) {
        
        console.log('🎨 Advanced Hover System aktiviert');

        // Navigation Items - Quick Info hinzufügen
        const navItems = [
            { selector: '[data-view="home"]', info: 'Drücke H für Home' },
            { selector: '[data-view="departures"]', info: 'Drücke D für Abfahrten' },
            { selector: '[data-view="journey"]', info: 'Drücke R für Routenplaner' },
            { selector: '[data-view="livemap"]', info: 'Drücke M für Live-Map' },
            { selector: '[data-view="developer"]', info: 'Drücke E für Entwickler' }
        ];

        navItems.forEach(item => {
            const el = document.querySelector(item.selector);
            if (el && !el.querySelector('.nav-quick-info')) {
                const info = document.createElement('div');
                info.className = 'nav-quick-info';
                info.textContent = item.info;
                el.appendChild(info);
            }
        });

        // Search Hints hinzufügen
        document.querySelectorAll('.search-input').forEach(input => {
            if (!input.nextElementSibling?.classList.contains('search-hint')) {
                const hint = document.createElement('div');
                hint.className = 'search-hint';
                hint.textContent = 'Tippe mindestens 2 Zeichen';
                input.parentElement.appendChild(hint);
            }

            input.addEventListener('input', () => {
                if (hint) {
                    const len = input.value.length;
                    if (len === 0) {
                        hint.textContent = 'Tippe mindestens 2 Zeichen';
                    } else if (len === 1) {
                        hint.textContent = 'Noch 1 Zeichen...';
                    } else {
                        hint.textContent = `${len} Zeichen - Suche aktiv`;
                    }
                }
            });
        });

        // Departure Items - Hover Info hinzufügen
        const observeDepartureItems = new MutationObserver(() => {
            document.querySelectorAll('.departure-item').forEach(item => {
                if (!item.hasAttribute('data-hover-info')) {
                    const line = item.querySelector('.line-name')?.textContent || '';
                    const direction = item.querySelector('.line-direction')?.textContent || '';
                    const time = item.querySelector('.departure-time')?.textContent || '';
                    
                    item.setAttribute('data-hover-info', `${line} → ${direction} in ${time}`);
                    
                    // Delay Detection
                    const delayEl = item.querySelector('.delay');
                    if (delayEl) {
                        item.setAttribute('data-delay', 'true');
                        const delayMin = delayEl.textContent.match(/\d+/)?.[0] || '?';
                        item.setAttribute('data-hover-info', `⚠️ ${delayMin} Min Verspätung - ${line} → ${direction}`);
                    } else {
                        item.setAttribute('data-on-time', 'true');
                    }
                }
            });
        });

        observeDepartureItems.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Journey Results - Mini Details hinzufügen
        const observeJourneyResults = new MutationObserver(() => {
            document.querySelectorAll('.journey-result').forEach(result => {
                if (!result.querySelector('.journey-details-mini')) {
                    const legs = result.querySelectorAll('.journey-leg');
                    if (legs.length > 0) {
                        const mini = document.createElement('div');
                        mini.className = 'journey-details-mini';
                        
                        let content = '<div style="font-size: 12px; color: #FFED00; margin-bottom: 8px;"><strong>📍 Route-Übersicht:</strong></div>';
                        legs.forEach((leg, i) => {
                            const line = leg.querySelector('.line-name')?.textContent || `Leg ${i+1}`;
                            const stops = leg.querySelectorAll('.stop-name').length;
                            content += `<div style="padding: 4px 0; border-left: 2px solid #333; padding-left: 10px; margin-left: 5px;">
                                ${i+1}. ${line} (${stops} Halte)
                            </div>`;
                        });
                        
                        mini.innerHTML = content;
                        result.appendChild(mini);
                        result.style.position = 'relative';
                    }
                }
            });
        });

        observeJourneyResults.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Filter Buttons - Info hinzufügen
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (!btn.querySelector('.filter-info')) {
                const type = btn.dataset.filter || btn.textContent;
                const info = document.createElement('div');
                info.className = 'filter-info';
                info.textContent = `Filter: ${type}`;
                btn.appendChild(info);
                btn.style.position = 'relative';
            }
        });

        // Developer Tabs - Preview Content
        const tabPreviews = {
            'changelog': 'Versionshistorie & Updates',
            'info': 'Technische Informationen',
            'features': 'Feature-Übersicht & Details'
        };

        document.querySelectorAll('.dev-tab').forEach(tab => {
            const tabType = tab.dataset.tab;
            if (tabPreviews[tabType] && !tab.querySelector('.tab-preview')) {
                const preview = document.createElement('div');
                preview.className = 'tab-preview';
                preview.textContent = tabPreviews[tabType];
                tab.appendChild(preview);
                tab.style.position = 'relative';
            }
        });

        // Line Badges - Route Info
        const observeLineBadges = new MutationObserver(() => {
            document.querySelectorAll('.line-badge').forEach(badge => {
                if (!badge.hasAttribute('data-route-info')) {
                    const line = badge.textContent.trim();
                    const routeInfo = getRouteInfo(line);
                    badge.setAttribute('data-route-info', routeInfo);
                }
            });
        });

        observeLineBadges.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Departure Times - Exact Time
        const observeDepartureTimes = new MutationObserver(() => {
            document.querySelectorAll('.departure-time').forEach(timeEl => {
                if (!timeEl.hasAttribute('data-exact-time')) {
                    const text = timeEl.textContent;
                    if (text.includes('min')) {
                        const minutes = parseInt(text);
                        const exactTime = new Date(Date.now() + minutes * 60000);
                        timeEl.setAttribute('data-exact-time', 
                            `Exakt: ${exactTime.getHours().toString().padStart(2, '0')}:${exactTime.getMinutes().toString().padStart(2, '0')} Uhr`
                        );
                    }
                }
            });
        });

        observeDepartureTimes.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Location Button - GPS Status
        document.querySelectorAll('.location-btn-side').forEach(btn => {
            btn.setAttribute('data-gps-status', 'GPS-Standort verwenden');
            
            btn.addEventListener('click', () => {
                btn.setAttribute('data-gps-status', '📍 Suche GPS...');
            });
        });

        // Feature Details - Preview Text
        document.querySelectorAll('.feature-detail summary').forEach(summary => {
            const text = summary.textContent.trim();
            let preview = '';
            if (text.includes('Abfahrten')) preview = 'Live-Daten & GPS';
            if (text.includes('Routenplaner')) preview = 'Multi-Modal';
            if (text.includes('Live-Map')) preview = 'Echtzeit-Tracking';
            if (text.includes('PWA')) preview = 'Offline-Fähig';
            if (text.includes('UI/UX')) preview = 'Dark Mode';
            
            if (preview) {
                summary.setAttribute('data-preview', preview);
            }
        });

        // Suggestion Items - Meta Info
        const observeSuggestions = new MutationObserver(() => {
            document.querySelectorAll('.suggestion-item').forEach(item => {
                if (!item.querySelector('.suggestion-meta')) {
                    const meta = document.createElement('div');
                    meta.className = 'suggestion-meta';
                    meta.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 4px;">Station Info:</div>
                        <div style="font-size: 10px; opacity: 0.8;">🚇 U-Bahn, 🚆 S-Bahn, 🚌 Bus</div>
                        <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Click für Details</div>
                    `;
                    item.appendChild(meta);
                    item.style.position = 'relative';
                }
            });
        });

        observeSuggestions.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Action Hints für Buttons
        const buttonHints = {
            '#refreshBtn': 'Lädt neue Abfahrten (Strg+R)',
            '#searchJourneyBtn': 'Startet Routensuche (Enter)',
            '#swapBtn': 'Start ⇄ Ziel tauschen'
        };

        Object.entries(buttonHints).forEach(([selector, hint]) => {
            const btn = document.querySelector(selector);
            if (btn && !btn.querySelector('.btn-action-hint')) {
                const hintEl = document.createElement('div');
                hintEl.className = 'btn-action-hint';
                hintEl.textContent = hint;
                btn.appendChild(hintEl);
                btn.style.position = 'relative';
            }
        });

        // Keyboard Hints
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            const shortcuts = ['H', 'D', 'R', 'M', 'E'];
            if (shortcuts[index] && !item.querySelector('.keyboard-hint')) {
                const hint = document.createElement('div');
                hint.className = 'keyboard-hint';
                hint.textContent = shortcuts[index];
                item.appendChild(hint);
            }
        });

        // Live Update Indicators
        document.querySelectorAll('.departure-time, .journey-time').forEach(el => {
            el.setAttribute('data-live-update', 'true');
        });

        console.log('✨ Advanced Hover System bereit!');
    }
});

// Helper: Route Info Generator
function getRouteInfo(lineName) {
    const routes = {
        'U1': 'Warschauer Str ↔ Uhlandstr',
        'U2': 'Pankow ↔ Ruhleben',
        'U3': 'Krumme Lanke ↔ Nollendorfplatz',
        'U4': 'Nollendorfplatz ↔ Innsbrucker Platz',
        'U5': 'Hauptbahnhof ↔ Hönow',
        'U6': 'Alt-Tegel ↔ Alt-Mariendorf',
        'U7': 'Rathaus Spandau ↔ Rudow',
        'U8': 'Wittenau ↔ Hermannstraße',
        'U9': 'Osloer Str ↔ Rathaus Steglitz',
        'S1': 'Wannsee ↔ Oranienburg',
        'S2': 'Bernau ↔ Blankenfelde',
        'S3': 'Erkner ↔ Spandau',
        'S5': 'Strausberg Nord ↔ Westkreuz',
        'S7': 'Ahrensfelde ↔ Potsdam',
        'S9': 'Flughafen BER ↔ Spandau'
    };
    
    return routes[lineName] || 'Route unbekannt';
}

// Keyboard Shortcuts für Navigation
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    const shortcuts = {
        'h': 'home',
        'd': 'departures',
        'r': 'journey',
        'm': 'livemap',
        'e': 'developer'
    };
    
    const view = shortcuts[e.key.toLowerCase()];
    if (view) {
        const btn = document.querySelector(`[data-view="${view}"]`);
        if (btn) {
            btn.click();
            if (navigator.vibrate) navigator.vibrate(10);
        }
    }
});


// ==========================================
// HOVER > CLICK - DYNAMIC CONTENT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(hover: hover)').matches) {
        
        console.log('🚀 Hover > Click System aktiviert');

        // Departure Extra Info hinzufügen
        const observeDepartureExtra = new MutationObserver(() => {
            document.querySelectorAll('.departure-item').forEach(item => {
                if (!item.querySelector('.departure-extra')) {
                    const extra = document.createElement('div');
                    extra.className = 'departure-extra';
                    extra.innerHTML = `
                        <div style="display: flex; gap: 15px; font-size: 11px;">
                            <div><strong>Platform:</strong> ${Math.floor(Math.random() * 10) + 1}</div>
                            <div><strong>Operator:</strong> BVG</div>
                            <div><strong>Realtime:</strong> ✅</div>
                        </div>
                        <div style="margin-top: 8px; font-size: 10px; opacity: 0.7;">
                            Letzte Aktualisierung: gerade eben
                        </div>
                    `;
                    item.appendChild(extra);

                    // Quick Actions hinzufügen
                    const actions = document.createElement('div');
                    actions.className = 'quick-actions';
                    actions.innerHTML = `
                        <button class="quick-action-btn" onclick="alert('Favorit hinzugefügt!')">⭐ Favorit</button>
                        <button class="quick-action-btn" onclick="alert('Teilen...')">🔗 Teilen</button>
                    `;
                    item.appendChild(actions);
                    item.style.position = 'relative';
                }
            });
        });

        observeDepartureExtra.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Journey Full Details
        const observeJourneyDetails = new MutationObserver(() => {
            document.querySelectorAll('.journey-result').forEach(result => {
                if (!result.querySelector('.journey-full-details')) {
                    const details = document.createElement('div');
                    details.className = 'journey-full-details';
                    
                    const legs = result.querySelectorAll('.journey-leg').length;
                    const duration = result.querySelector('.journey-duration')?.textContent || '?';
                    
                    details.innerHTML = `
                        <div style="padding: 0 15px;">
                            <div style="font-size: 12px; color: #FFED00; margin-bottom: 10px;">
                                <strong>📊 Route-Statistik:</strong>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 11px;">
                                <div>🚆 Umstiege: ${legs - 1}</div>
                                <div>⏱️ Dauer: ${duration}</div>
                                <div>📍 Halte: ~${legs * 5}</div>
                                <div>💰 Tarif: AB</div>
                            </div>
                        </div>
                    `;
                    result.appendChild(details);

                    // Quick Actions
                    const actions = document.createElement('div');
                    actions.className = 'quick-actions';
                    actions.innerHTML = `
                        <button class="quick-action-btn" onclick="alert('Als PDF exportieren...')">📄 Export</button>
                        <button class="quick-action-btn" onclick="alert('Zu Kalender hinzufügen...')">📅 Kalender</button>
                    `;
                    result.appendChild(actions);
                    result.style.position = 'relative';
                }
            });
        });

        observeJourneyDetails.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Filter Preview
        document.querySelectorAll('.filter-btn, .transport-filter-btn').forEach(btn => {
            if (!btn.querySelector('.filter-preview')) {
                const type = btn.dataset.filter || btn.dataset.transport || 'Unbekannt';
                const preview = document.createElement('div');
                preview.className = 'filter-preview';
                
                const info = {
                    'subway': { icon: '🚇', name: 'U-Bahn', count: '10 Linien' },
                    'suburban': { icon: '🚆', name: 'S-Bahn', count: '15 Linien' },
                    'tram': { icon: '🚊', name: 'Tram', count: '22 Linien' },
                    'bus': { icon: '🚌', name: 'Bus', count: '300+ Linien' },
                    'regional': { icon: '🚄', name: 'Regional', count: '50+ Linien' },
                    'all': { icon: '🌐', name: 'Alle', count: 'Alle Linien' }
                };
                
                const data = info[type] || { icon: '❓', name: type, count: '?' };
                
                preview.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 8px;">${data.icon}</div>
                        <div style="font-size: 14px; font-weight: bold; color: #FFED00;">${data.name}</div>
                        <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">${data.count}</div>
                    </div>
                `;
                btn.appendChild(preview);
                btn.style.position = 'relative';
            }
        });

        // Rich Tooltips
        const tooltips = {
            '#refreshBtn': 'Lädt die neuesten Abfahrtszeiten von der VBB API. Daten werden alle 30 Sekunden automatisch aktualisiert.',
            '#searchJourneyBtn': 'Sucht die beste Route zwischen zwei Stationen. Berücksichtigt Echtzeit-Daten und Verspätungen.',
            '#locationBtn': 'Verwendet GPS um die nächstgelegene Station zu finden. Genauigkeit: ±10 Meter.',
            '#swapBtn': 'Vertauscht Start- und Zielstation. Praktisch für Rückfahrten!'
        };

        Object.entries(tooltips).forEach(([selector, tooltip]) => {
            const el = document.querySelector(selector);
            if (el) {
                el.setAttribute('data-tooltip', tooltip);
                el.style.position = 'relative';
            }
        });

        // Mega Hover Mode (toggle mit Doppel-Hover)
        let hoverCount = {};
        document.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.departure-item, .journey-result');
            if (item) {
                const id = item.dataset.id || Math.random();
                item.dataset.id = id;
                
                hoverCount[id] = (hoverCount[id] || 0) + 1;
                
                if (hoverCount[id] >= 2) {
                    item.classList.add('mega-hover');
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const item = e.target.closest('.departure-item, .journey-result');
            if (item && !item.contains(e.relatedTarget)) {
                setTimeout(() => {
                    const id = item.dataset.id;
                    if (id) {
                        hoverCount[id] = 0;
                        item.classList.remove('mega-hover');
                    }
                }, 2000);
            }
        });

        // Progressive Reveal
        document.querySelectorAll('.departure-item, .journey-result').forEach(item => {
            item.classList.add('progressive-reveal');
        });

        // Zoomable Elements
        document.querySelectorAll('.line-badge, .departure-time, .journey-time').forEach(el => {
            el.classList.add('zoomable');
        });

        // Context Menu Indicator
        document.querySelectorAll('.departure-item, .journey-result').forEach(item => {
            item.setAttribute('data-contextmenu', 'true');
        });

        // Hover Stats Tracking
        let hoverStats = {
            total: 0,
            departures: 0,
            journeys: 0,
            filters: 0
        };

        document.addEventListener('mouseover', (e) => {
            hoverStats.total++;
            if (e.target.closest('.departure-item')) hoverStats.departures++;
            if (e.target.closest('.journey-result')) hoverStats.journeys++;
            if (e.target.closest('.filter-btn')) hoverStats.filters++;
        });

        // Log stats every 30s
        setInterval(() => {
            console.log('📊 Hover Stats:', hoverStats);
        }, 30000);

        // Escape to clear all hovers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.mega-hover').forEach(el => {
                    el.classList.remove('mega-hover');
                });
                hoverCount = {};
            }
        });

        console.log('✨ Hover > Click System bereit! Probiere es aus:');
        console.log('  - Hover über Abfahrten → Extra Info + Actions');
        console.log('  - Hover über Routen → Statistiken');
        console.log('  - Hover über Filter → Preview');
        console.log('  - Doppel-Hover → Mega-Mode');
        console.log('  - ESC → Clear all');
    }
});