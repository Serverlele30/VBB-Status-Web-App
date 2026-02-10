# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [30.0.0] - 2026-02-10

### 🎉 Major Release - Code-Trennung & Desktop-Optimierung

### Added
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

### Changed
- **Dateistruktur**: 
  - `index.html`: Von 4.698 auf 390 Zeilen reduziert
  - `styles.css`: 2.467 Zeilen (vorher inline)
  - `script.js`: 1.992 Zeilen (vorher inline)
- **Container-Breiten**: Desktop-optimierte max-widths
  - Vorher: 1200px (zu breit)
  - Jetzt: 900px (Tablet), 1100px (Desktop), 1400px (XL)
- **Navigation-Menü**: Von 280px auf 320px verbreitert
- **Header-Schrift**: Desktop-Größen erhöht (36px → 38px)
- **Detail-Modal**: Responsive Breiten je nach Bildschirmgröße
  - Tablet: 900px
  - Desktop: 1100px
  - Extra Large: 1300px

### Fixed
- **Z-Index Issue**: Popups und Modals werden jetzt korrekt über dem Header angezeigt
  - Header: z-index 10000
  - Detail-Modal: z-index 10005
  - Detail-Header: z-index 10006
  - Leaflet-Popups: z-index 10010
- **Desktop-Layout**: Fehlende Optimierungen für große Bildschirme korrigiert
- **Live-Map Controls**: Bessere Positionierung auf Desktop

### Technical Details
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

### Features (bereits vorhanden)
- ✅ Echtzeit-Abfahrten VBB/BVG
- ✅ Routenplanung
- ✅ Live-Fahrzeugverfolgung (Radar)
- ✅ Service Worker (Offline-Fähigkeit)
- ✅ PWA Manifest (Installierbar)
- ✅ HTTPS Development Server
- ✅ DotMatrix Font Integration
- ✅ Dark Mode Design
- ✅ Touch-optimiert für Mobile
- ✅ Pull-to-Refresh
- ✅ Leaflet.js Karten-Integration
- ✅ BVG-Linienfarben
- ✅ Fahrzeug-Filter (U-Bahn, Bus, Tram, S-Bahn, Regional)

---

## Projektinformationen

**Entwickelt von:** Aaron K. & Claude (Anthropic)  
**Lizenz:** MIT  
**Repository:** https://github.com/Serverlele30/VBB-Status-Web-App

### Mitwirkende
- Aaron K. - Projektleitung, Konzept, Testing
- Claude (Anthropic) - Entwicklung, Code-Optimierung

---

## Geplante Features / Roadmap

### v31.0.0 (geplant)
- [ ] API-Error Handling verbessern
- [ ] Favoriten-Stationen speichern
- [ ] Benachrichtigungen bei Verspätungen
- [ ] Dunkles/Helles Theme umschaltbar
- [ ] Historische Daten und Statistiken

### v32.0.0 (Ideen)
- [ ] Barrierefreiheit (A11y) Audit
- [ ] Mehrsprachigkeit (Englisch)
- [ ] Export von Routen als iCal/PDF
- [ ] Teilen-Funktion für Verbindungen
- [ ] Integration mit Kalender-Apps

---

## Versionsschema

Dieses Projekt verwendet [Semantic Versioning](https://semver.org/lang/de/):

- **MAJOR** (X.0.0): Breaking Changes, große Architekturänderungen
- **MINOR** (0.X.0): Neue Features, abwärtskompatibel
- **PATCH** (0.0.X): Bugfixes, kleine Verbesserungen

---

## Support & Feedback

Bei Fragen oder Problemen:
1. GitHub Issues: https://github.com/Serverlele30/VBB-Status-Web-App/issues
2. README konsultieren
3. Code-Kommentare lesen

**Viel Erfolg mit der VBB Netz Status App! 🚇🚌🚊**
