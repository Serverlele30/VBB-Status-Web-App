# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [37.5.0] - 2026-07-08

### Klickbare Kacheln + die restlichen Feature-Ideen

#### Added - Routenplaner
- **Via-Station**: Optionales Feld "Über" mit Autocomplete - Verbindungen laufen dann über diese Zwischenstation (API akzeptiert nur Stop-IDs, der Adapter löst Namen automatisch auf).
- **Barrierefrei-Modus** (♿): nutzt das Rollstuhl-Profil für Fußwege und Umstiege.
- **Fahrrad-Mitnahme** (🚲): nur Verbindungen, in denen alle Fahrten Radmitnahme erlauben.
- **Ticketpreise (experimentell)**: withFares ist aktiviert; liefert der Feed Preisdaten, erscheint ein grünes Preis-Badge an der Verbindung. Defensiv gebaut - ohne Daten erscheint schlicht nichts. (Die MOTIS-Spec markiert das Feature selbst als experimentell.)
- **Losgeh-Erinnerung** (🔔): Button an jeder Verbindung, Notification 10 min vor Abfahrt. Ehrliche Einschränkung: funktioniert nur, solange die App/der Tab offen ist - echte Push-Benachrichtigungen bräuchten einen Server.

#### Changed
- **Alle vier Home-Kacheln sind jetzt klickbar** und öffnen ihre View (vorher nur die Entwickler-Kachel); einheitlich über data-view gelöst, der Spezial-Handler der Dev-Kachel ist raus.
- **API-Budget-Anzeige im Entwickler-Tab**: zeigt live "X/90 Requests frei (letzte 60s)".

## [37.4.0] - 2026-07-08

### Favoriten-Routen, Standort auf der Karte, smarterer Geocode

#### Added
- **Favoriten-Routen für Pendler**: Nach einer Suche merkt "☆ Route merken" die Verbindung (max. 5). Gespeicherte Routen erscheinen als Chips über dem Routenplaner-Formular - 1 Tap füllt Start/Ziel und sucht sofort. Chips zeigen Kurznamen ("Alexanderplatz → Zoolog. Garten" statt der vollen Stationsnamen).
- **Eigener Standort auf der Live-Map**: 📍-Button in der Filterleiste setzt einen blauen Punkt auf die eigene Position und zentriert die Karte (Marker wird bei erneutem Tap bewegt, nicht neu erzeugt).
- **Geocode-Bias per GPS**: Die Stationssuche sortiert Treffer jetzt nach der letzten bekannten Position (aus GPS-Nutzung, max. 1h alt, lokal gespeichert) statt hart nach Berlin-Mitte - spürbar bessere Vorschläge in Brandenburg.

#### Fixed
- **localStorage räumt jetzt auf**: Abfahrten-Caches älter als 7 Tage und Geocode-Mappings älter als 30 Tage werden beim App-Start gelöscht (wuchsen bisher unbegrenzt). Alte Mapping-Einträge werden automatisch ins neue Format mit Zeitstempel migriert.

## [37.3.0] - 2026-07-07

### Blättern, Zwischenhalte, Stationen auf der Karte

#### Added
- **"Frühere / Spätere Verbindungen"**: Die Routensuche blättert jetzt per pageCursor durch Alternativverbindungen - Buttons oberhalb und unterhalb der Ergebnisliste, mit sanftem Scroll nach oben beim Blättern.
- **Zwischenhalte ausklappbar**: In der Routen-Detailansicht zeigt jeder Fahrt-Abschnitt "🔄 N Zwischenhalte anzeigen" (natives details-Element, tastaturbedienbar) mit Haltestellenliste inkl. Ankunftszeiten. Die Daten kamen schon immer mit der plan-Antwort - der alte Platzhalter ("N Halte") bekam sie nur nie.
- **Stationen auf der Live-Map**: Ab Zoom 15 erscheinen die Haltestellen im Ausschnitt als gelbe Punkte (map/stops, 5min-Cache). Tap -> Popup mit den nächsten 3 Abfahrten (1 Request, 15s-Cache) und "Alle Abfahrten →" springt direkt in die Abfahrten-View mit dieser Station. Im Fokus-Modus werden die Punkte automatisch ausgeblendet.

## [37.2.0] - 2026-07-07

### Favoriten-Chips in der Abfahrten-View

#### Changed
- **Favoriten wohnen jetzt in der Abfahrten-View**: Über dem Suchfeld sitzt eine wischbare Chip-Reihe (Pillenform) mit ALLEN Favoriten - die aktive Station ist gelb markiert, ein Tap wechselt die Station ohne Umweg über die Startseite. Auf Mobile gleiche Wisch-Mechanik wie die Filter-Chips.
- **Startseite aufgeräumt**: zeigt nur noch kompakt die Top 3 Favoriten plus "Alle N Stationen anzeigen" (springt in die Abfahrten-View), statt bis zu 10 Einträge zu stapeln.
- Stationswechsel frischt die Aktiv-Markierung der Chips automatisch auf.

## [37.1.1] - 2026-07-07

### Komplette Route + Fokus-Modus, Entwickler-Tab, eine Versionsnummer

#### Added - Live-Map
- **Komplette Route beim Fahrzeug-Tap**: map/trips liefert nur das Segment im Kartenausschnitt - beim Antippen wird jetzt sofort das lokale Segment gezeichnet und im Hintergrund die GANZE Strecke über /v6/trip nachgeladen (gleicher 60s-Cache wie die Abfahrts-Details: Details + Route = maximal 1 Request).
- **Fokus-Modus**: Solange das Popup offen ist, werden alle anderen Fahrzeuge ausgeblendet - nur die angetippte Fahrt mit ihrer Route bleibt sichtbar. Der Zähler zeigt "🎯 [Linie] im Fokus". Popup schließen stellt alles wieder her.
- Polyline-Decoder generalisiert (Precision 5/6/7 je Endpoint, legGeometry liefert precision als Feld).

#### Fixed - Filter auf Mobile
- **Alle Filtergruppen vereinheitlicht** (Abfahrten, Routenplaner, Live-Map): Label auf eigener Zeile, Buttons als EINE horizontal wischbare Chip-Reihe statt zerklüftetem Umbruch. Die Routenplaner-Buttons hatten zudem eine 20px-Sondergröße (doppelt so groß wie alle anderen Filter) - jetzt Einheitsgröße mit 40px-Touch-Zielen.

#### Changed - Entwickler-Bereich & Version
- **Eine Versionsnummer für alles**: APP_VERSION (js/api.js) ist die einzige Quelle; Startseite, Entwickler-Tab und Cache-Anzeige werden daraus befüllt. Ein neuer Smoke-Test erzwingt, dass package.json, APP_VERSION und SW-Cache-Name übereinstimmen - Versions-Drift wie bisher (v30/v33 auf der Website) fällt ab jetzt in der CI auf.
- **Entwickler-Tab aktualisiert**: veraltete Angaben korrigiert (15s-Radar -> 30s+Animation, HAFAS-Endpoints -> MOTIS, BVG-Farbtabelle -> GTFS-Farben, "Push geplant" -> Favoriten/Offline), Statistik-Box durch Architektur-Fakten ersetzt.
- **Entwickler-Kachel auf der Startseite**: vierte Kachel im Feature-Raster (neben Live-Map) mit Versionsnummer, öffnet den Entwickler-Bereich. Füllt nebenbei die leere Rasterlücke im 2-Spalten-Layout.

## [37.1.0] - 2026-07-07

### Desktop-Aufräumaktion (nach Screenshots)

#### Fixed
- **Doppelte Beschriftung im Menü**: Die per JS injizierten "Nav-Quick-Infos" standen ohne CSS als zweites Label neben jedem Menüpunkt ("Start | Startseite"). Komplett entfernt - ebenso die Search-Hints ("Tippe mindestens 2 Zeichen"), die als permanenter Rohtext unter den Suchfeldern klebten, und tote data-tooltip-Attribute ohne CSS.
- **Abfahrten auf Desktop unsymmetrisch**: Das 2-Spalten- (ab 768px) bzw. 3-Spalten-Grid (ab 1600px) erzeugte ungleich hohe, unruhige Karten. Jetzt überall eine ruhige einspaltige Liste; die Breite regelt der zentrierte Container. Die 1600px-Stufe nutzt Lesebreite (820px) statt 1400px Riesenfläche.
- **Detail-Modal auf Desktop kaputt**: Eine alte Regel machte das Vollbild-Overlay selbst 600px schmal und links verankert - die Seite schaute rechts durch, mit eigener Scrollbar in der Mitte. Jetzt: Overlay bleibt Vollbild (nichts scheint durch), nur der Inhalt ist auf Lesebreite zentriert.

#### Hinweis zur OS-Frage
Layout-Anpassung läuft bewusst über Viewport-Breite und hover/pointer-Media-Queries statt User-Agent/OS-Erkennung: Touch-Laptops und große Tablets brechen jede OS-Annahme, und Browser reduzieren den User-Agent zunehmend. Die Media-Queries waren richtig - nur an drei Stellen kaputt.

## [37.0.0] - 2026-07-07

### Tests im Repo, funktionierender Abfahrten-Filter, Strecken-Anzeige, Mehr-laden

#### Added
- **Tests + CI im Repo**: 19 Adapter-Tests und der komplette Smoke-Test liegen jetzt unter tests/ (`npm test`), plus GitHub Action (.github/workflows/test.yml), die bei jedem Push Syntax-Checks und beide Test-Suiten ausführt.
- **Strecken-Anzeige auf der Live-Map**: Fahrzeug antippen -> die komplette Route der Fahrt wird in der Linienfarbe eingezeichnet (Popup schließen -> Linie verschwindet). Die Polylines liegen bereits im Speicher - kostet null API-Requests.
- **"Mehr Abfahrten laden"**: Button unter der Abfahrtsliste erhöht die Anzahl schrittweise (20 -> 40 -> 60). Bewusst über den n-Parameter statt Cursor gelöst: die erweiterte Liste bleibt so auch beim 30s-Auto-Refresh erhalten. Stationswechsel setzt auf 20 zurück.

#### Fixed
- **Abfahrten-Filter repariert und entpatcht**: Der Filter (U-Bahn/S-Bahn/Tram/Bus/Regional über den Abfahrten) hing an fragilen Monkey-Patches, die loadDepartures/displayDepartures zur Laufzeit überschrieben - und hatte einen echten Bug: Bei aktivem Filter hat der Auto-Refresh alle 30 Sekunden die UNGEFILTERTE Liste gerendert (der tripId-Vergleich lief gegen die gefilterte DOM-Sicht und schlug immer fehl). Jetzt: displayDepartures merkt sich die volle Liste und filtert intern, der Auto-Refresh vergleicht gegen die gefilterte Sicht, die Monkey-Patches sind entfernt.

## [36.0.0] - 2026-07-06

### Schnellere Karte, offizielle Linienfarben, Desktop-Layout

#### Added - Offizielle VBB-Linienfarben
- **Linienfarben kommen jetzt direkt aus der API**: MOTIS liefert routeColor/routeTextColor aus dem GTFS-Feed bei Abfahrten, Routen UND Live-Map mit - das sind die offiziellen VBB-Farben (U1 grün, U2 rot, S1, S2, ... jeweils korrekt), ohne einen einzigen Extra-Request. Lokale Farbtabellen bleiben nur als Fallback.
- **Textfarbe per Luminanz**: Ob Schwarz oder Weiß auf einem Linien-Badge, wird jetzt aus der Hintergrundfarbe berechnet statt über eine hartcodierte Liste.

#### Changed - Karten-Ladegeschwindigkeit
- **Vorinitialisierung im Leerlauf**: Nach dem App-Start wird die Leaflet-Karte im Hintergrund angelegt und die 9 Kacheln des Standard-Ausschnitts werden vorgeladen (exakt dieselben URLs inkl. Subdomain-/Retina-Logik wie Leaflet). Beim ersten Öffnen der Live-Map ist alles im Browser-Cache - gefühlt sofort. Kostet keine API-Requests.
- **Preconnect/DNS-Prefetch** für api.transitous.org, Karten-CDN und unpkg: spart DNS+TLS-Zeit beim ersten Zugriff.
- **Leaflet mit defer** geladen: blockiert das Rendern der App nicht mehr.
- **Leaflet-Dateien im Service Worker gecacht** (cache-first, versioniert = unveränderlich): ab dem zweiten Besuch null Netzwerk für die Bibliothek.
- **Tile-Tuning**: keepBuffer 4 (Randkacheln bleiben geladen -> flüssigeres Pannen), Kacheln laden schon während der Bewegung, minZoom 8 (ganz Brandenburg sichtbar).

#### Removed
- **Zoom-Tasten (+/-) auf der Karte entfernt** (vorher auf Desktop sichtbar). Zoomen weiterhin per Scrollrad, Doppelklick und Pinch-Geste.

#### Changed - Desktop-Layout (Mobile First bleibt)
- Header-Inhalt und Pull-to-Refresh richten sich am zentrierten Layout aus.
- Home: Info-Karten und Favoriten als 2-Spalten-Raster ab 768px.
- Live-Map bekommt auf dem Desktop deutlich mehr Höhe.
- Ab 1100px: breiterer Inhalt (780px), luftigere Abfahrtszeilen, größere Linien-Badges, breiteres Detail-Modal.
- Konflikt bereinigt: neue Regeln ergänzen den bestehenden 768px-Block (Journey-Grid, Header-Größen) statt ihn zu doppeln.

## [35.0.0] - 2026-07-06

### Transitous als einzige Datenquelle + animierte Live-Map

#### Breaking / Changed
- **transport.rest komplett entfernt**: Alle Funktionen (Stationssuche, Abfahrten, GPS-Nearby, Trip-Details, Routensuche, Live-Map) laufen jetzt ausschließlich über Transitous (api.transitous.org, MOTIS 2). Der VBB->BVG-Failover und alle HAFAS-Codepfade sind raus - js/api.js ist dadurch deutlich schlanker (nur noch Budget, Cache, Dedupe, Timeout, Störungs-Banner).
- **Datenverarbeitung effizienter**: Fahrt-Segmente werden pro API-Poll EINMAL normalisiert (Polyline einmal dekodiert, Zeiten als ms vorberechnet); Positionen werden daraus lokal interpoliert. Abfahrten-Auto-Refresh aktualisiert Zeiten/Verspätungen in-place im DOM (kein Flackern, Scroll bleibt) und rendert nur bei geänderter Fahrten-Menge komplett neu.

#### Added - Live-Map 2.0
- **Flüssig animierte Fahrzeuge**: MOTIS liefert Fahrt-Segmente mit Polyline + Zeiten statt Punkt-Positionen. Ein lokaler 1s-Loop interpoliert die Position linear entlang der Strecke - die Fahrzeuge GLEITEN über die Karte (CSS-Transition passend zum Takt) statt alle 15s zu springen. Kostet null zusätzliche API-Requests.
- **API-Poll auf 30s gedrosselt** (Rücksicht auf das Freiwilligen-Projekt Transitous); die Bewegung kommt aus der lokalen Animation.
- **Berlin-Klemmung der Bounding-Box entfernt**: schnitt bisher Potsdam und ganz Brandenburg ab.
- **Live-Indikator** (pulsierender Punkt) am Fahrzeugzähler.

#### Added - GUI-Politur
- Tabellarische Ziffern und feste Breite bei Abfahrtszeiten (keine Layout-Sprünge bei "9 min" -> "10 min").
- Sanftes Einblenden der Vorschlags-Dropdowns, dezenteres Verspätungs-Badge.
- `prefers-reduced-motion` wird respektiert (alle Animationen abschaltbar per Systemeinstellung).

#### Removed
- Dreistufiger API-Failover (obsolet - eine Quelle), shouldTryTransitous-Wrapper, Transitous-Direktpfade, HAFAS-URL-Bau.

## [34.0.0] - 2026-07-06

### Transitous als dritte, unabhängige Failover-Stufe

#### Added
- **Transitous-Adapter (js/transitous.js)**: Übersetzt die MOTIS-2-API von https://api.transitous.org in die HAFAS-Form der App. Transitous ist ein community-betriebener Dienst mit KOMPLETT eigener Infrastruktur - unabhängig von transport.rest. Beim Totalausfall von VBB+BVG (wie am 03.07.) übernimmt jetzt Stufe 3 für: Stationssuche (geocode), Abfahrten (stoptimes) und Routensuche (plan, inkl. Verkehrsmittel-Filter und Zeitwahl).
- **Koordinaten-basierte Stationsidentität**: Bei Stationsauswahl werden jetzt Koordinaten mitgespeichert (Suggestions, Favoriten, letzte Station). Damit funktionieren Abfahrten und Routen über Transitous OHNE Stop-ID-Mapping (stoptimes per center=lat,lon; plan per Koordinaten-fromPlace). Alte Favoriten ohne Koordinaten werden einmalig per Name geocodet und das Mapping gecacht.
- **Direktpfade für Transitous-Stationen**: Wird während eines Ausfalls eine Station aus Transitous-Vorschlägen gewählt (ID-Präfix "transitous:"), gehen Abfahrten/Routen direkt an Transitous statt sinnlos die HAFAS-APIs zu fragen.
- **Pflicht-Attribution**: Sichtbarer Link auf transitous.org/sources (inkl. OpenStreetMap-Hinweis) in der Entwickler-View, wie von der Transitous-Nutzungsrichtlinie verlangt.

#### Ressourcen-Rücksicht (Transitous ist ein Freiwilligen-Projekt)
- Transitous wird NUR kontaktiert, wenn transport.rest (beide Endpoints) nicht antwortet.
- Bewusst KEIN Radar-Polling über Transitous - die Live-Map bleibt zweistufig (VBB->BVG) und zeigt bei Totalausfall die Störungsmeldung.
- 4xx-Fehler und eigenes Rate-Limit lösen keinen Transitous-Versuch aus.

## [33.2.0] - 2026-07-03

### Sichtbare Störungsanzeige bei Anbieter-Totalausfall

#### Context
Am 03.07.2026 lieferten sowohl v6.vbb.transport.rest als auch der Fallback v6.bvg.transport.rest HTTP 503 - beide laufen auf derselben Infrastruktur des Anbieters transport.rest. Gegen einen Totalausfall des Anbieters kann die App keine Livedaten beschaffen, aber sie zeigt ihn jetzt klar an.

#### Added
- **Globales Störungs-Banner**: Versagen primäre UND Fallback-API, erscheint oben ein deutlicher Hinweis "Datenanbieter gestört". Das Banner verschwindet automatisch beim nächsten erfolgreichen Request.
- **Fehlerhinweis in der Stationssuche**: Statt stillem Versagen zeigen die Suchvorschläge "Suche derzeit nicht möglich - API nicht erreichbar" (Abfahrten- und Routenplaner-Felder).

## [33.1.0] - 2026-07-03

### Automatischer API-Failover

#### Added
- **Failover auf v6.bvg.transport.rest**: Wenn die primäre VBB-API nicht antwortet (Netzwerkfehler, Timeout, HTTP 5xx), schaltet die App automatisch auf die baugleiche BVG-API um - gleicher Betreiber, identische Routen und Stop-IDs, deckt ebenfalls ganz Berlin/Brandenburg ab, nutzt aber eine andere Upstream-Quelle. Nach 10 Minuten wird die primäre API automatisch wieder probiert.
- **12s-Timeout pro Request** (AbortController): hängende Verbindungen blockieren die App nicht mehr und lösen den Failover aus.
- HTTP-4xx-Fehler lösen bewusst KEINEN Failover aus (fehlerhafte Anfrage, kein API-Ausfall).
- Sind beide APIs down, werden notfalls abgelaufene Cache-Daten geliefert.

## [33.0.0] - 2026-07-03

### Favoriten, Persistenz, echte Filter & Modul-Architektur

#### Added
- **Echte Favoriten**: Stern-Button an jeder Station speichert sie in localStorage; Favoriten erscheinen auf dem Home-Screen und öffnen mit einem Tap die Abfahrten. (Vorher war der Button eine Attrappe mit `alert()`.)
- **Teilen-Button**: Nutzt die native Teilen-Funktion des Geräts (Web Share API), Fallback: in Zwischenablage kopieren.
- **Persistenz über App-Starts**: Letzte Station und letzte Route werden gemerkt und beim Start wiederhergestellt - ohne API-Call; geladen wird erst beim Öffnen der jeweiligen View.
- **Zeitwahl in der Routensuche**: "Abfahrt um" / "Ankunft bis" mit Datum/Uhrzeit (leer = jetzt).
- **Offline-Modus für Abfahrten**: Letzte Daten werden lokal gespeichert; ohne Verbindung werden sie mit Banner "Stand: vor X min" angezeigt.
- **Tastatur-Navigation** in allen Stationsvorschlägen (Pfeiltasten, Enter, Escape).
- **aria-Labels** für alle Icon-Buttons und Eingabefelder, `aria-live` für Statusanzeigen, sichtbarer Tastatur-Fokus.

#### Fixed
- **Verkehrsmittel-Filter der Routensuche funktionieren jetzt wirklich**: Die Auswahl wurde vorher komplett ignoriert (kein `products`-Parameter in der API-URL). Fähren bleiben bewusst aktiv, da es keinen Button dafür gibt.
- **ReferenceError bei jedem Tastendruck behoben**: Der Search-Hint-Handler referenzierte eine Variable außerhalb ihres Scopes.
- **Fake-Daten entfernt**: Zufällige Gleisnummern, erfundene "GPS-Genauigkeit ±10m" und Alert-Attrappen (Export, Kalender) wurden angezeigt, als wären es echte Informationen.
- **Auto-Refresh bricht bei Fehlern nicht mehr permanent ab**: Exponentieller Backoff (30s → 60s → ... max 5min), automatische Erholung.

#### Changed
- **Code in 5 Module aufgeteilt** (`js/api.js`, `app.js`, `livemap.js`, `changelog.js`, `extras.js`); geteilter Zustand zentral in api.js deklariert.
- **Live-Map-Marker werden bewegt statt neu erzeugt** (per tripId wiederverwendet): flüssigere Karte, offene Popups bleiben beim Update offen.
- **Radar-Ergebnisanzahl an Zoom gekoppelt** (80/140/200): kleinere API-Responses bei hohem Zoom.
- **Parallax-Effekt komplett entfernt**: Der Header inkl. Menü-Button bewegte sich mit der Maus mit - wirkte unruhig und hatte keinen Nutzen.
- **Alle console.log-Ausgaben entfernt** (Fehler/Warnungen bleiben).

## [32.0.0] - 2026-07-02

### Stabilität, Fehlerbehebungen & API-Optimierung

#### Fixed
- **Kritisch: ReferenceError-Crash behoben**: `const originalSearchJourneys = searchJourneys` referenzierte eine nie existierende Funktion. Der Fehler brach die Ausführung des restlichen Scripts ab (Hover-System, GPS-Handling u.a. luden nie).
- **Kritisch: Service Worker installierte sich nie**: Die Cache-Liste enthielt `/DotMatrix.ttf` (Datei existiert nicht), wodurch `cache.addAll()` komplett fehlschlug. Dateien werden jetzt einzeln gecacht und Fehler toleriert.
- **Doppeltes View-Switch-System entfernt**: Zwei konkurrierende `switchView`-Implementierungen und doppelte Menü-Handler feuerten bei jedem Klick beide. Jetzt gibt es genau ein generisches System, das alle Views (inkl. Developer) kennt.
- **Doppelte `escapeHtml`-Definition entfernt**: Die zweite Version escapte keine Anführungszeichen (Risiko in HTML-Attributen).
- **Changelog wurde bis zu 13× parallel geladen**: Drei redundante Lade-Mechanismen (switchView, MutationObserver, Tab-Handler) konkurrierend. Jetzt zentraler Guard, lädt genau einmal.
- **Fragiler `navigator.geolocation`-Override entfernt**: `Object.defineProperty` auf navigator wirft in manchen Browsern. GPS-Buttons werden auf Desktop weiterhin versteckt.
- **Pull-to-Refresh** löst nur noch in der Abfahrten-View aus.
- **Endlos-Logging entfernt**: Hover-Statistiken wurden alle 30s dauerhaft in die Konsole geschrieben.

#### Removed
- **DotMatrix-Font komplett entfernt**: Font-Datei existierte nicht mehr im Projekt; alle Referenzen aus CSS (19 Stellen), HTML-Featureliste und Service Worker entfernt. Fallback ist überall 'Courier New', monospace.

#### Changed
- **Zentrale API-Schicht (`apiFetch`)**: Alle VBB-API-Aufrufe laufen jetzt durch eine Funktion mit:
  - **Hartem Rate-Limit von 90 Requests/Minute** (API erlaubt 100 – 10 Puffer)
  - **Response-Cache mit TTL pro Endpoint** (Stationssuche 6h, Nearby 2min, Abfahrten 15s, Radar 10s, Trips 60s, Journeys 30s)
  - **Request-Deduplizierung**: identische parallele Anfragen werden nur einmal gefeuert
  - **Cache-Fallback**: bei erreichtem Limit werden notfalls leicht veraltete Daten geliefert statt Fehler
- **Polling pausiert im Hintergrund**: Abfahrten-Auto-Refresh (30s) und Live-Map-Radar (15s) laufen nur, wenn der Tab sichtbar UND die jeweilige View aktiv ist. Bei Rückkehr in den Tab wird einmalig aufgefrischt.
- **Live-Map-Filter arbeiten lokal**: Filter-Klicks rendern die bereits geladenen Fahrzeugdaten neu, statt einen neuen Radar-Request auszulösen.
- **Radar-Koordinaten werden gerundet** (3 Dezimalstellen) für stabile Cache-Treffer bei minimalen Kartenbewegungen.
- **Service Worker: Network-first für App-Shell**: Nach einem Update bekommen Nutzer sofort neues HTML/JS/CSS; offline greift der Cache. API-Requests werden vom SW bewusst nicht gecacht (macht `apiFetch`).
- **Autocomplete-Debounce** von 300ms auf 400ms erhöht (weniger Requests beim Tippen).
- **XSS-Schutz**: Stationsnamen, Liniennamen und Richtungen aus der API werden vor dem Einfügen ins HTML escaped.
- **Nutzerfreundliche Fehlermeldungen** bei erreichtem API-Limit statt kryptischer Fehler.

## [31.0.0] - 2026-02-10

### Developer View & Auto-Changelog System

#### Added
- **Developer View mit Tab-System**: Neue Entwickler-Ansicht mit 3 Tabs
  - Changelog: Automatisch geladene Versionshistorie
  - Info: App-Informationen, Statistiken, Status
  - Features: Detaillierte Feature-Beschreibungen mit Collapsibles
- **Automatisches Changelog-Loading**: CHANGELOG.md wird automatisch gefetcht und gerendert
- **Markdown-zu-HTML Konverter**: Vollständiger Parser für Markdown-Syntax
  - Überschriften (h1-h6)
  - Fettdruck (**bold**) und Kursiv (*italic*)
  - Code-Blöcke (``` ```) und Inline-Code (`code`)
  - Listen (geordnet und ungeordnet)
  - Links [text](url)
  - Blockquotes (>)
  - Horizontale Linien (---)
  - Tabellen
- **GitHub-Style Formatierung**: Changelog sieht aus wie auf GitHub
  - Hierarchische Überschriften mit Border-Bottom
  - Gelbe Highlights für wichtige Begriffe
  - Grüner Code-Text auf schwarzem Hintergrund
  - Responsive Typography
- **Mobile-Optimierungen für Developer View**:
  - Kompaktere Layouts für kleine Bildschirme
  - Touch-optimierte Tab-Navigation (min 44px)
  - Horizontal scrollbare Tabs mit Scroll-Hint Animation
  - Bessere Lesbarkeit durch angepasste Font-Größen
  - Stack-Layout für Info-Boxen
  - Full-Width GitHub-Link Button
  - Landscape-Mode Support

#### Changed
- **Changelog-Verwaltung**: Nur noch CHANGELOG.md pflegen - keine HTML-Duplikate mehr
- **Developer-Tabs Design**: Premium-Look mit Gradienten und Animationen
  - 3D-Button-Effekt mit Schatten
  - Smooth Transform-Animationen
  - Aktiver Tab hebt sich durch Gold-Gradient ab
  - Hover-Effekte auf Desktop
- **Tab-Content Animation**: Fade-in beim Tab-Wechsel (0.4s cubic-bezier)
- **Info-Boxen**: 2-Spalten-Layout auf Desktop, Stack auf Mobile
- **Typography**: Optimierte Font-Größen für alle Breakpoints
  - Mobile: 12-14px
  - Tablet: 14-16px  
  - Desktop: 15-18px

#### Fixed
- **CSS Duplikat-Fehler**: Doppelte Mobile Media Query (Zeile 2040-2130) entfernt
- **Markdown Parsing**: Korrekte Konvertierung von verschachtelten Listen
- **UTF-8 Encoding**: CHANGELOG.md ohne Zeichenfehler (ä, ö, ü)
- **Tab-Switching**: Changelog lädt nur einmal beim ersten Öffnen
- **Touch-Feedback**: Optimierte :active States für Mobile
- **Scroll-Verhalten**: Smooth horizontal scrolling für Tabs mit -webkit-overflow-scrolling

#### Technical Details
- **Neue JavaScript-Funktionen**:
  - `loadChangelog()`: Fetcht und rendert CHANGELOG.md
  - `markdownToHtml()`: Konvertiert Markdown zu HTML (230 Zeilen)
  - `parseInline()`: Konvertiert inline Markdown (bold, italic, code, links)
  - `escapeHtml()`: Sicheres HTML-Escaping für Code-Blöcke
- **CSS-Ergänzungen**: +200 Zeilen für Markdown-Formatierung
- **Responsive Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768-1023px
  - Desktop: 1024px+
  - Extra Small: < 360px
  - Landscape Mobile: < 768px & orientation: landscape
- **Performance**: Changelog cached nach erstem Load
- **Browser-Support**: Chrome 80+, Safari 12+, Firefox 75+

---

## [30.0.0] - 2026-02-10

### Major Release - Code-Trennung & Desktop-Optimierung

#### Added
- **Modulare Dateistruktur**: Projekt in separate HTML, CSS und JS Dateien aufgeteilt
- **Desktop-Optimierungen**: Responsive Layouts für verschiedene Bildschirmgrößen
  - Tablet/Desktop (768px+): 900px Container
  - Large Desktop (1200px+): 1100px Container mit 2-Spalten Layout
  - Extra Large (1600px+): 1400px Container mit 3-Spalten Layout
- **Hover-Effekte**: Desktop-optimierte Interaktionen
  - Navigation Items
  - Buttons und Filter
  - Abfahrts-Items
  - Journey Results
- **Live-Map Desktop-Layout**: Controls links positioniert statt oben
- **Home View Desktop**: 3-Spalten Navigation auf großen Bildschirmen
- **README.md**: Umfassende Dokumentation der Projektstruktur
- **CHANGELOG.md**: Versionsverwaltung und Änderungsprotokoll

#### Changed
- **Dateistruktur**: 
  - `index.html`: Von 4.698 auf 390 Zeilen reduziert
  - `styles.css`: 2.467 Zeilen (vorher inline)
  - `script.js`: 1.992 Zeilen (vorher inline)
- **Container-Breiten**: Desktop-optimierte max-widths
  - Vorher: 1200px (zu breit)
  - Jetzt: 900px (Tablet), 1100px (Desktop), 1400px (XL)
- **Navigation-Menü**: Von 280px auf 320px verbreitert
- **Header-Schrift**: Desktop-Größen erhöht (36px -> 38px)
- **Detail-Modal**: Responsive Breiten je nach Bildschirmgröße
  - Tablet: 900px
  - Desktop: 1100px
  - Extra Large: 1300px

#### Fixed
- **Z-Index Issue**: Popups und Modals werden jetzt korrekt über dem Header angezeigt
  - Header: z-index 10000
  - Detail-Modal: z-index 10005
  - Detail-Header: z-index 10006
  - Leaflet-Popups: z-index 10010
- **Desktop-Layout**: Fehlende Optimierungen für große Bildschirme korrigiert
- **Live-Map Controls**: Bessere Positionierung auf Desktop

#### Technical Details
- CSS-Dateigröße: 2.467 Zeilen (inkl. Desktop-Optimierungen)
- JavaScript unverändert: 1.992 Zeilen
- HTML-Struktur: Sauber getrennt, 390 Zeilen
- Caching-Vorteile: Browser können CSS/JS separat cachen

---

## [29.0.0] - 2026-02-09

### Vorherige Version (Monolithisch)

- Alle Code in einer `index.html` Datei
- 4.698 Zeilen insgesamt
- Funktionale PWA mit allen Features
- Optimiert für Mobile

#### Features (bereits vorhanden)

- Echtzeit-Abfahrten VBB/BVG
- Routenplanung
- Live-Fahrzeugverfolgung (Radar)
- Service Worker (Offline-Fähigkeit)
- PWA Manifest (Installierbar)
- HTTPS Development Server
- DotMatrix Font Integration
- Dark Mode Design
- Touch-optimiert für Mobile
- Pull-to-Refresh
- Leaflet.js Karten-Integration
- BVG-Linienfarben
- Fahrzeug-Filter (U-Bahn, Bus, Tram, S-Bahn, Regional)

---

## [28.0.0] - 2026-02-08

### Live-Map Feature

#### Added
- **Live-Fahrzeugverfolgung**: Echtzeit-Karte mit Leaflet.js
- **Fahrzeug-Marker**: Farbcodierte Marker für verschiedene Verkehrsmittel
  - U-Bahn: Blau
  - S-Bahn: Grün
  - Bus: Rot/Rosa
  - Tram: Orange
  - Regional: Grau
- **Fahrzeug-Filter**: Toggle für verschiedene Verkehrsmitteltypen
- **Live-Updates**: Automatisches Refresh alle 10 Sekunden
- **Popup-Informationen**: Linie, Richtung, Verspätung beim Klick auf Marker
- **Map Controls**: Filter-Buttons über der Karte

#### Changed
- **Navigation**: Neuer "Radar" Menüpunkt
- **API-Calls**: Optimiert für Live-Daten (radar endpoint)
- **Performance**: Marker-Clustering für bessere Performance

#### Fixed
- **Memory Leaks**: Alte Marker werden korrekt entfernt
- **Map-Rendering**: Korrekte Tile-Layer Initialisierung

---

## [27.0.0] - 2026-02-07

### Journey Planner Enhancements

#### Added
- **Umsteigezeiten-Warnung**: Farbcodierte Hinweise bei knappen Umstiegen
  - Grün: Ausreichend Zeit (5+ Minuten)
  - Orange: Knapp (3-5 Minuten)
  - Rot: Sehr knapp (< 3 Minuten)
- **Zwischenstopps**: Anzeige aller Haltestellen auf der Route
- **Platform-Informationen**: Gleis/Steig-Anzeige für alle Stops
- **Journey-Details Modal**: Detaillierte Ansicht mit allen Informationen
- **Swap-Button**: Von/Nach Felder tauschen per Button

#### Changed
- **Journey-Layout**: Verbesserte Darstellung der Verbindungen
- **Icon-System**: Einheitliche Verkehrsmittel-Icons
- **Touch-Targets**: Größere Buttons für bessere Bedienbarkeit

#### Fixed
- **Zeitberechnung**: Korrekte Berechnung von Umsteigezeiten
- **API-Parsing**: Robusteres Parsing von Journey-Daten

---

## [26.0.0] - 2026-02-06

### Departure Filters

#### Added
- **Verkehrsmittel-Filter**: Filter nach U-Bahn, S-Bahn, Bus, Tram
- **Linien-Filter**: Filter nach spezifischen Linien (U1, U2, etc.)
- **Filter-Persistenz**: Einstellungen werden gespeichert
- **Filter-Counter**: Anzeige der gefilterten Abfahrten

#### Changed
- **Filter-UI**: Neue Filter-Leiste unter der Suche
- **Performance**: Optimiertes Filtern ohne neu zu laden

---

## [25.0.0] - 2026-02-05

### BVG Line Colors

#### Added
- **Original BVG-Farben**: Authentische Linienfarben
  - U-Bahn: Linienspezifische Farben (U1-U9)
  - S-Bahn: Grün
  - Bus: Rot/Rosa
  - Tram: Orange
  - RE/RB: Grau
- **Color-Mapping**: Vollständige Farbtabelle für alle Linien
- **Badge-Design**: Farbige Linien-Badges

#### Changed
- **Line-Badge Styling**: Größere, besser lesbare Badges
- **Contrast**: Optimierter Kontrast für alle Farben

---

## [24.0.0] - 2026-02-04

### Pull-to-Refresh

#### Added
- **Pull-to-Refresh Gesture**: Native-ähnliche Aktualisierung
- **Refresh-Spinner**: Visuelles Feedback beim Aktualisieren
- **Touch-Events**: touchstart, touchmove, touchend Handler
- **Haptic Feedback**: Vibration bei erfolgreicher Aktualisierung

#### Changed
- **Scroll-Verhalten**: -webkit-overflow-scrolling für smoothes Scrolling
- **Performance**: Debounced Refresh-Events

---

## [23.0.0] - 2026-02-03

### Platform Information

#### Added
- **Gleis/Steig-Anzeige**: Anzeige der Abfahrtsplattform
- **Platform-Icon**: Symbol für Gleis/Steig
- **Platform-Badge**: Formatierte Darstellung

#### Changed
- **Departure-Layout**: Mehr Platz für Platform-Info
- **API-Integration**: Korrekte Platform-Daten von VBB API

---

## [22.0.0] - 2026-02-02

### Journey Planner

#### Added
- **Routenplaner**: Von/Nach Suche implementiert
- **Journey-Results**: Anzeige von Verbindungen
- **Journey-Legs**: Detaillierte Anzeige aller Teilstrecken
- **Time-Display**: Abfahrts- und Ankunftszeiten
- **Duration**: Gesamtdauer der Verbindung
- **Transfers**: Anzahl der Umstiege

#### Changed
- **Navigation**: Neuer "Route" Menüpunkt
- **API-Calls**: Integration von journeys endpoint

---

## [21.0.0] - 2026-02-01

### Departure Details Modal

#### Added
- **Detail-View**: Modal mit ausführlichen Informationen
- **Trip-Informationen**: Linie, Richtung, Betreiber
- **Stop-Sequence**: Alle folgenden Haltestellen
- **Remarks**: Hinweise und Störungen
- **Close-Button**: Einfaches Schließen des Modals

#### Changed
- **Modal-Styling**: Fullscreen-Modal mit z-index Optimierung
- **Scroll-Verhalten**: Smooth scrolling in Stop-List

---

## [20.0.0] - 2026-01-31

### Auto-Refresh

#### Added
- **Automatische Aktualisierung**: Abfahrten refreshen alle 30 Sekunden
- **Last-Update Timestamp**: Anzeige der letzten Aktualisierung
- **Pause on Background**: Refresh stoppt bei Hintergrund-Tab
- **Visual-Indicator**: Animierter Refresh-Status

#### Changed
- **Performance**: Optimierte API-Calls (nur Diffs laden)
- **Battery-Saving**: Intelligentes Refresh-Verhalten

---

## [19.0.0] - 2026-01-30

### Delay Information

#### Added
- **Verspätungsanzeige**: Rot hervorgehobene Delays
- **Delay-Badge**: Minute-genaue Verspätung
- **Cancelled-Status**: Markierung ausgefallener Fahrten
- **On-Time Badge**: Grüner Badge bei pünktlichen Fahrten

#### Changed
- **Color-Scheme**: Rot für Delays, Grün für On-Time
- **Departure-Layout**: Mehr Platz für Delay-Info

---

## [18.0.0] - 2026-01-29

### GPS Location Search

#### Added
- **GPS-Button**: Automatische Standorterkennung
- **Nearby-Stops**: Nächstgelegene Haltestellen finden
- **Distance-Display**: Entfernung in Metern
- **Permission-Handling**: Browser-Berechtigungen für Standort
- **Loading-State**: Visuelles Feedback während GPS-Suche

#### Changed
- **Search-Layout**: GPS-Button neben Suchfeld
- **API-Integration**: nearby endpoint

#### Fixed
- **Permission-Errors**: Bessere Fehlerbehandlung bei verweigerten Berechtigungen

---

## [17.0.0] - 2026-01-28

### Station Autocomplete

#### Added
- **Live-Suche**: Autocomplete während der Eingabe
- **Fuzzy-Search**: Fehlertolerante Suche
- **Product-Tags**: Anzeige verfügbarer Verkehrsmittel
- **Keyboard-Navigation**: Arrow-Keys für Auswahl
- **Click-Outside**: Schließen bei Klick außerhalb

#### Changed
- **Suggestions-UI**: Besseres Dropdown-Design
- **API-Calls**: Debounced requests (300ms)
- **Performance**: Caching von Search-Results

---

## [16.0.0] - 2026-01-27

### Real-time Departures

#### Added
- **VBB API Integration**: Anbindung an v6.vbb.transport.rest
- **Departure-List**: Chronologische Abfahrtsliste
- **Line-Badges**: Farbige Linien-Anzeige
- **Direction-Display**: Fahrtrichtung/Endhaltestelle
- **Time-Display**: Abfahrtszeit in Minuten oder absolut

#### Changed
- **API-Endpoint**: Wechsel zu VBB Transport REST API v6
- **Data-Structure**: Neue JSON-Struktur

---

## [15.0.0] - 2026-01-26

### DotMatrix Font

#### Added
- **DotMatrix Font**: Original BVG-Schriftart integriert
- **Font-Loading**: @font-face mit Fallback
- **Typography**: Einheitliche Schrift in gesamter App

#### Changed
- **Font-Stack**: 'DotMatrix', 'Courier New', monospace
- **Letter-Spacing**: Optimiert für Lesbarkeit

---

## [14.0.0] - 2026-01-25

### Dark Mode Design

#### Added
- **Dark Theme**: Schwarzer Hintergrund (#000)
- **BVG Yellow**: Primärfarbe #FFED00
- **Color-Scheme**: Vollständiges Farbkonzept
- **Contrast**: WCAG-konforme Kontraste

#### Changed
- **Gesamtes UI**: Umstellung auf Dark Mode
- **Button-Styles**: Gelb auf Schwarz
- **Input-Fields**: Schwarzer Hintergrund

---

## [13.0.0] - 2026-01-24

### Navigation System

#### Added
- **Sidebar-Navigation**: Slide-out Menu
- **View-Switching**: Navigation zwischen verschiedenen Ansichten
- **Active-States**: Hervorhebung aktiver View
- **Smooth-Transitions**: Animierte View-Wechsel
- **Overlay**: Backdrop beim geöffneten Menu

#### Changed
- **App-Structure**: Multi-View Architecture
- **Menu-Icon**: Hamburger-Button im Header

---

## [12.0.0] - 2026-01-23

### PWA Manifest

#### Added
- **manifest.json**: PWA Manifest-Datei
- **App-Icons**: Icons in verschiedenen Größen
- **Standalone-Mode**: App läuft ohne Browser-UI
- **Theme-Color**: #FFED00 (BVG Yellow)
- **Background-Color**: #000000 (Black)
- **Display**: standalone
- **Orientation**: portrait-primary

#### Changed
- **HTML Meta-Tags**: PWA-spezifische Meta-Tags

---

## [11.0.0] - 2026-01-22

### Service Worker

#### Added
- **Service Worker**: Offline-Fähigkeit
- **Cache-First Strategy**: Schnelle Ladezeiten
- **Offline-Page**: Custom Offline-Seite
- **Cache-Update**: Automatische Cache-Updates
- **Background-Sync**: Sync bei Netzwerk-Reconnect

#### Changed
- **Loading-Performance**: Deutlich schnellere App

---

## [10.0.0] - 2026-01-21

### HTTPS Development Server

#### Added
- **HTTPS-Server**: Node.js Server mit SSL
- **Auto-SSL**: Automatische Zertifikatserstellung
- **Mobile-Testing**: Echter HTTPS-Zugriff vom Handy
- **Hot-Reload**: Automatisches Neuladen bei Änderungen

#### Changed
- **Development-Workflow**: Einfacheres Mobile-Testing

---

## [9.0.0] - 2026-01-20

### Touch Optimizations

#### Added
- **Touch-Targets**: Minimum 44x44px für alle interaktiven Elemente
- **Tap-Highlights**: Custom Highlight-Colors
- **Touch-Feedback**: Active-States für Touch
- **Gesture-Support**: Grundlegende Touch-Gesten

#### Changed
- **Button-Sizes**: Größere Buttons für Touch
- **Spacing**: Mehr Abstand zwischen Elementen

---

## [8.0.0] - 2026-01-19

### Responsive Design

#### Added
- **Mobile-First**: Optimierung für Smartphones
- **Breakpoints**: 768px, 1024px, 1200px
- **Fluid-Typography**: Skalierbare Schriftgrößen
- **Flexible-Layouts**: CSS Grid & Flexbox

#### Changed
- **Gesamtes Layout**: Responsive für alle Bildschirmgrößen

---

## [7.0.0] - 2026-01-18

### Station Search

#### Added
- **Search-Input**: Textfeld für Stationssuche
- **Search-Button**: Suche-Button
- **Clear-Button**: X zum Leeren des Suchfelds
- **Loading-State**: Spinner während der Suche

#### Changed
- **UI-Layout**: Suchfeld prominent im Header

---

## [6.0.0] - 2026-01-17

### Error Handling

#### Added
- **Error-Messages**: Benutzerfreundliche Fehlermeldungen
- **API-Error-Handling**: Try-Catch für API-Calls
- **Network-Error-Detection**: Offline-Erkennung
- **Retry-Logic**: Automatisches Wiederholen bei Fehler

#### Changed
- **User-Experience**: Besseres Feedback bei Problemen

---

## [5.0.0] - 2026-01-16

### Loading States

#### Added
- **Loading-Spinner**: Animierter Lade-Indikator
- **Skeleton-Screens**: Platzhalter während des Ladens
- **Progressive-Loading**: Schrittweises Laden von Daten

#### Changed
- **UX**: Klares Feedback während Ladezeiten

---

## [4.0.0] - 2026-01-15

### API Integration

#### Added
- **Fetch-API**: Integration von VBB API
- **CORS-Handling**: Cross-Origin Requests
- **Rate-Limiting**: Respektierung von API-Limits
- **Error-Responses**: Handling von API-Fehlern

#### Changed
- **Data-Flow**: Asynchrone Datenverarbeitung

---

## [3.0.0] - 2026-01-14

### Basic Styling

#### Added
- **CSS-Framework**: Custom CSS ohne Framework
- **Color-Variables**: CSS Custom Properties
- **Typography**: Schrift-Hierarchie
- **Button-Styles**: Einheitliche Button-Designs

#### Changed
- **Visual-Design**: Erste Styling-Implementierung

---

## [2.0.0] - 2026-01-13

### HTML Structure

#### Added
- **Semantic-HTML**: Header, Main, Footer
- **Meta-Tags**: Viewport, Description, etc.
- **HTML5-Elements**: Article, Section, Nav
- **Accessibility**: ARIA-Labels wo nötig

#### Changed
- **Document-Structure**: Semantisches HTML

---

## [1.0.0] - 2026-01-12

### Initial Release

#### Added
- **Project-Setup**: Initiales Git-Repository
- **Basic-HTML**: Einfache HTML-Struktur
- **README**: Projekt-Dokumentation
- **License**: MIT-Lizenz

---

## Projektinformationen

**Entwickelt von:** Aaron K. & Claude (Anthropic)  
**Lizenz:** MIT  
**Repository:** [github.com/Serverlele30/VBB-Status-Web-App](https://github.com/Serverlele30/VBB-Status-Web-App)

### Mitwirkende

- **Aaron K.** - Projektleitung, Konzept, Testing, Entwicklung
- **Claude (Anthropic)** - Entwicklung, Code-Optimierung

---

## Geplante Features / Roadmap

### v32.0.0 (geplant)

- API-Error Handling verbessern
- Favoriten-Stationen speichern
- Benachrichtigungen bei Verspätungen
- Dark/Light Mode Toggle

### v33.0.0 (Ideen)

- Barrierefreiheit (A11y) Audit
- Mehrsprachigkeit (Englisch)
- Export von Routen als iCal/PDF
- Teilen-Funktion für Verbindungen
- Integration mit Kalender-Apps
- Offline-Modus mit Service Worker Cache

---

## Versionsschema

Dieses Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/):

- **MAJOR** (z.B. 31.x.x): Grundlegende Änderungen, neue Features
- **MINOR** (z.B. x.1.x): Neue Features, abwärtskompatibel
- **PATCH** (z.B. x.x.1): Bug-Fixes, kleine Verbesserungen

---

## Support & Feedback

Bei Fragen oder Problemen:

1. [GitHub Issues](https://github.com/Serverlele30/VBB-Status-Web-App/issues)
2. README konsultieren
3. Code-Kommentare lesen

**Viel Erfolg mit der VBB Netz Status App!**