# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

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