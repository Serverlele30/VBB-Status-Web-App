// VBB Netz Status - Filter, Tabs, App-Start-Restore, Hover-Extras

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

// Reine Filterfunktion - wird von displayDepartures (app.js) beim
// Rendern angewendet. Der Filter-Zustand lebt hier.
function applyDepartureFilter(departures) {
    if (activeDepartureFilters.has('all')) return departures;
    return departures.filter(dep => {
        const product = dep.line?.product?.toLowerCase() || '';
        return activeDepartureFilters.has(product);
    });
}

// Filter geändert -> mit der vollen Liste neu rendern
// (displayDepartures filtert selbst; so geht nie Datenbestand verloren)
function filterDepartures() {
    if (!allDepartures || allDepartures.length === 0) return;
    displayDepartures(allDepartures);
}

// ==========================================
// VERKEHRSMITTEL-FILTER (Routenplaner)
// ==========================================

// (activeTransportModes ist zentral in js/api.js deklariert)

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


// HINWEIS: Der frühere "searchJourneys"-Patch wurde entfernt.
// Die Funktion existierte nie und verursachte einen ReferenceError,
// der das restliche Script abgebrochen hat.
// Der ebenfalls entfernte navigator.geolocation-Override war fragil
// (wirft in manchen Browsern) - GPS-Buttons werden auf Desktop
// bereits per CSS/display:none versteckt, das genügt.


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

    }
});

// (Parallax-Effekt entfernt: Der Header inkl. Menü-Button bewegte sich
//  mit der Maus mit - wirkte unruhig und hatte keinen Nutzen.)

// ==========================================
// LIVE-MAP VORINITIALISIERUNG
// Nach App-Start im Leerlauf: Leaflet-Map schon anlegen (Setup + erste
// Kacheln laden im Hintergrund). Beim ersten Öffnen der Live-Map ist
// dann alles da - gefühlt sofortiges Laden. Kostet KEINE API-Requests
// (Daten-Polling startet erst beim Öffnen der View).
// ==========================================
window.addEventListener('load', () => {
    const warmup = () => {
        // 1) Leaflet-Objekt vorbauen (Setup-Kosten aus dem ersten Öffnen raus)
        if (typeof L !== 'undefined' && typeof initLiveMap === 'function' && !liveMap) {
            try { initLiveMap(); } catch (e) { /* Karte lädt dann eben beim Öffnen */ }
        }

        // 2) Kacheln des Standard-Ausschnitts vorladen. Im versteckten
        //    Container lädt Leaflet nichts - also holen wir die exakt
        //    gleichen URLs selbst als <img>; der Browser-Cache liefert
        //    sie beim Öffnen dann sofort. (3x3-Raster um Berlin-Mitte,
        //    Zoom 12, gleiche Subdomain-Wahl und Retina-Logik wie Leaflet.)
        const zoom = 12, lat = 52.52, lon = 13.405;
        const n = Math.pow(2, zoom);
        const cx = Math.floor((lon + 180) / 360 * n);
        const latRad = lat * Math.PI / 180;
        const cy = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
        const r = (window.devicePixelRatio > 1) ? '@2x' : '';
        const subs = 'abcd';

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = cx + dx, y = cy + dy;
                const s = subs[Math.abs(x + y) % subs.length]; // wie Leaflet
                const img = new Image();
                img.src = `https://${s}.basemaps.cartocdn.com/dark_all/${zoom}/${x}/${y}${r}.png`;
            }
        }
    };
    if ('requestIdleCallback' in window) {
        requestIdleCallback(warmup, { timeout: 5000 });
    } else {
        setTimeout(warmup, 3000);
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
// APP-START: GESPEICHERTEN ZUSTAND WIEDERHERSTELLEN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Versionsnummer überall aus der EINEN Quelle (APP_VERSION) befüllen
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    setText('homeVersion', 'v' + APP_VERSION);
    setText('homeDevVersion', 'v' + APP_VERSION);
    setText('devVersion', APP_VERSION);
    setText('devRelease', APP_RELEASE_DATE);
    setText('devCacheName', 'vbb-status-v' + APP_VERSION);

    // Entwickler-Karte auf der Startseite -> Entwickler-View
    const devCard = document.getElementById('homeDevCard');
    if (devCard) {
        devCard.addEventListener('click', () => switchView('developer'));
    }

    // Favoriten auf dem Home-Screen anzeigen
    renderFavorites();

    // Letzte Station wiederherstellen (OHNE sofortigen API-Call -
    // geladen wird erst, wenn die Abfahrten-View geöffnet wird)
    const lastStation = storageGet(STORAGE_KEYS.lastStation);
    if (lastStation && lastStation.id) {
        currentStationId = lastStation.id;
        currentStationName = lastStation.name;
        currentStationLat = lastStation.lat ?? null;
        currentStationLon = lastStation.lon ?? null;
        stationSearch.value = lastStation.name;
        refreshBtn.disabled = false;
        updateFavoriteButton();
    }

    // Letzte Route wiederherstellen
    const lastJourney = storageGet(STORAGE_KEYS.lastJourney);
    if (lastJourney && lastJourney.from && lastJourney.to) {
        journeyFromStation = lastJourney.from;
        journeyToStation = lastJourney.to;
        journeyFrom.value = lastJourney.from.name;
        journeyTo.value = lastJourney.to.name;
        checkJourneySearchReady();
    }

    // Klick auf Favorit:
    // - "Alle anzeigen" (Home) -> nur zur Abfahrten-View wechseln
    // - Favorit auf Home -> Abfahrten-View + Station laden
    // - Favoriten-Chip in der Abfahrten-View -> Station direkt wechseln
    document.addEventListener('click', (e) => {
        if (e.target.closest('#homeShowAllFavs')) {
            switchView('departures');
            return;
        }

        const chip = e.target.closest('.fav-chip');
        if (chip) {
            if (chip.dataset.id === currentStationId) return; // schon aktiv
            selectStation(
                chip.dataset.id, chip.dataset.name,
                chip.dataset.lat ? parseFloat(chip.dataset.lat) : null,
                chip.dataset.lon ? parseFloat(chip.dataset.lon) : null
            );
            return;
        }

        const favItem = e.target.closest('.home-favorite-item');
        if (favItem) {
            switchView('departures');
            selectStation(
                favItem.dataset.id, favItem.dataset.name,
                favItem.dataset.lat ? parseFloat(favItem.dataset.lat) : null,
                favItem.dataset.lon ? parseFloat(favItem.dataset.lon) : null
            );
        }
    });

    // Mindestzeit für die Zeitwahl: jetzt (keine Suche in der Vergangenheit)
    const timeInput = document.getElementById('journeyTimeInput');
    if (timeInput) {
        const pad = n => String(n).padStart(2, '0');
        const d = new Date();
        timeInput.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    // Zeitwahl zurücksetzen (= jetzt abfahren)
    const timeClear = document.getElementById('journeyTimeClear');
    if (timeClear && timeInput) {
        timeClear.addEventListener('click', () => {
            timeInput.value = '';
            if (navigator.vibrate) navigator.vibrate(5);
        });
    }
});

// ==========================================
// TASTATUR-NAVIGATION FÜR STATIONSVORSCHLÄGE (Barrierefreiheit)
// Pfeil hoch/runter wählt, Enter bestätigt, Escape schließt
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.search-container').forEach(container => {
        const input = container.querySelector('.search-input');
        const list = container.querySelector('.suggestions');
        if (!input || !list) return;

        input.addEventListener('keydown', (e) => {
            const items = Array.from(list.querySelectorAll('.suggestion-item'));
            if (items.length === 0) return;

            const activeIdx = items.findIndex(i => i.classList.contains('kb-active'));

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const dir = e.key === 'ArrowDown' ? 1 : -1;
                const next = (activeIdx + dir + items.length) % items.length;
                items.forEach(i => i.classList.remove('kb-active'));
                items[next].classList.add('kb-active');
                items[next].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter' && activeIdx >= 0) {
                e.preventDefault();
                items[activeIdx].click();
            } else if (e.key === 'Escape') {
                list.classList.remove('active');
            }
        });
    });
});

// ==========================================
// HOVER-EXTRAS: KOMPLETT ENTFERNT (v37.1)
// - Nav-Quick-Infos: standen als doppelte Beschriftung im Menü
// - Search-Hints ("Tippe mindestens 2 Zeichen"): hatten kein CSS und
//   klebten als permanenter Rohtext unter den Suchfeldern
// - data-tooltip-Attribute: hatten ebenfalls kein CSS -> tote Attribute
// Die title-Attribute der Buttons liefern native Browser-Tooltips.
// ==========================================

// Quick Actions an Abfahrten: ECHTE Funktionen statt Alert-Attrappen
// (Event-Delegation statt MutationObserver - robuster und günstiger)
document.addEventListener('click', async (e) => {
    const favBtn = e.target.closest('.qa-favorite');
    if (favBtn && currentStationId) {
        toggleFavorite(currentStationId, currentStationName);
        favBtn.textContent = isFavorite(currentStationId) ? '⭐ Favorit ✓' : '☆ Favorit';
        if (navigator.vibrate) navigator.vibrate(10);
        return;
    }

    const shareBtn = e.target.closest('.qa-share');
    if (shareBtn && currentStationName) {
        const shareData = {
            title: 'VBB Netz Status',
            text: `Abfahrten für ${currentStationName}`,
            url: location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
                shareBtn.textContent = '✓ Kopiert';
                setTimeout(() => { shareBtn.textContent = '🔗 Teilen'; }, 2000);
            }
        } catch (err) {
            // Nutzer hat Share-Dialog abgebrochen - kein Fehler
        }
    }
});
