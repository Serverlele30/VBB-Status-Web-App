# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [29.0] - 2025-12-31

### ✨ Added
- **GitHub-Integration:** Links zur Repository auf der Home-Page
- **Changelog GitHub-Link:** "📖 Alle Updates & Code auf GitHub" Button nach neuesten Updates
- **Footer GitHub-Link:** "⭐ Star on GitHub" unter "Made with ❤️"
- **Hover-Effekte:** Interaktive Buttons mit Animations

### 🎨 Changed
- GitHub-Links mit BVG-Farbschema (Gelb/Schwarz)
- Responsive Buttons für Mobile & Desktop

---

## [28.0] - 2025-12-31

### 🐛 Fixed
- **Bug-Fix:** Abfahrten-View nicht mehr beim ersten Laden sichtbar
- Home-View ist jetzt korrekt die einzige aktive View beim Start

### ✨ Changed
- **Header-Title:** "Live-Nahverkehr für Berlin & Brandenburg" statt "ECHTZEIT-ABFAHRTSMONITOR"
- **Credits:** Aaron K. & Claude (Anthropic) im Header erwähnt
- **Navigation-Hinweis:** Pfeil entfernt für klareren Text
- **Font-Credit:** Nur @NikBLN gelb und verlinkt (nicht "DotMatrix by")

### 📝 Added
- Vollständige README.md für GitHub
- GitHub-formatiertes CHANGELOG.md

---

## [26.0] - 2025-12-31

### ✨ Added
- **Kombinierte Hero-Box:** Navigation + Hero in einer Box
- **Pfeil zeigt nach rechts:** Richtung zum Menü-Button

### 🎨 Changed
- Kompakteres Design durch kombinierte Box
- Text "oben rechts" statt "hier oben"

---

## [25.0] - 2025-12-31

### ✨ Added
- **Home/Landing-Page:** Neue Startseite beim App-Load
- **Navigation-Hinweis:** Pfeil zeigt zum Menü-Button
- **Quick-Info Cards:** 3 Feature-Cards (Desktop nebeneinander, Mobile untereinander)
- **Features-Box:** Detaillierte technische Features
- **Two-Column Layout:** Updates | Info nebeneinander (Desktop)

### 🎨 Changed
- "Info" statt "Credits" als Box-Titel
- VBB-Gebiet korrekt: "Berlin & Brandenburg"
- Kompaktere Paddings und Fonts (~20% kleiner)

---

## [24.0] - 2025-12-31

### ✨ Added
- **Two-Column Layout:** Changelog und Credits nebeneinander

### 🎨 Changed
- Verbesserte Home-Page mit kompakterem Design
- Intro-Text statt Feature-Cards

---

## [23.0] - 2025-12-31

### ✨ Added
- **Home-Screen:** Erste Version der Landing-Page
- **Feature-Übersicht:** 4 Feature-Cards mit Icons
- **Changelog:** Integriert auf Home-Page
- **Credits:** Vollständige Attribution

---

## [22.0] - 2025-12-31

### ✨ Added
- **Dynamischer Page-Title:** Browser-Tab zeigt aktive View
  - "VBB Netz Status - Abfahrten"
  - "VBB Netz Status - Route"
  - "VBB Netz Status - Live-Map"

---

## [21.0] - 2025-12-31

### ✨ Added
- **Dynamische Bounds:** Live-Map lädt nur sichtbare Fahrzeuge
- **API-Optimierung:** Bis zu 69% weniger Daten bei Zoom-in
- **Auto-Reload beim Map-Bewegen:** Immer aktuelle Fahrzeuge im Sichtbereich

### 🎯 Changed
- 15% Puffer-Zone um Map-Bounds für smooth UX
- Effizientere API-Calls

---

## [20.0] - 2025-12-31

### ✨ Added
- **Leaflet Map Integration:** Interaktive Karte statt statischer Einbettung
- **Custom Marker:** Fahrzeuge als Custom Icons mit Linienfarben

### 🎨 Changed
- Verbesserte Map-Performance
- Bessere Mobile-Unterstützung

---

## [19.0] - 2025-12-31

### ✨ Added
- **Echte BVG-Farben:** Authentische Linienfarben für 40+ Linien
  - U-Bahn: U1-U9 Original-Farben
  - S-Bahn: Grün + Ringbahn Orange
  - Tram: Metro-Tram Rot + Tram Gelb
  - Bus: Gelb + Metro-Bus Rot
- **Linienbezeichnung unter Icon:** Mit echter Farbe
- **Touch-optimiert:** Keine Zoom-Buttons auf Mobile

### 🎨 Changed
- Farbschema für alle Verkehrsmittel aktualisiert
- Bessere visuelle Unterscheidung

---

## [18.0] - 2025-12-31

### ✨ Added
- **Linien-basierte Filterung:** U-Bahn, S-Bahn, Tram, Bus separat
- **Präzise Station-Line Mappings:** Custom extrahierte Daten für 1000+ Stationen

### 🎨 Changed
- Verbesserte Filter-Funktionalität
- Genauere Linien-Zuordnungen

---

## [17.0] - 2025-12-31

### ✨ Added
- **Live-Update Intervall:** 30 Sekunden Auto-Refresh
- **Manueller Refresh-Button:** In Live-Map View

### 🎨 Changed
- Optimierte Update-Strategie
- Bessere Performance bei Live-Updates

---

## [16.0] - 2025-12-31

### ✨ Added
- **Live-Map Feature:** Echtzeit-Fahrzeugverfolgung
  - Dark-Mode Karte (CartoDB)
  - Filter nach Fahrzeugtyp
  - Live-Positions-Updates
- **3-Tab Navigation:** Abfahrten | Route | Live-Map

### 🎨 Changed
- Navigation erweitert um Live-Map Tab
- UI angepasst für 3 Views

---

## [15.0] - 2025-12-31

### ✨ Added
- **Detaillierte Fußwege:** Distanz + Gehzeit für alle Walking-Legs
- **Robuste Stationserkennung:** Funktioniert auch bei unvollständigen Namen

### 🎨 Changed
- Verbesserte Journey-Details
- Klarere Fußweg-Darstellung

---

## [14.0] - 2025-12-31

### ✨ Added
- **Garantierte 5 Min Umstiegszeit:** Alle Routen mit mindestens 5 Min Transfer
- **Intelligente Route-Berechnung:** API-Parameter optimiert

### 🎨 Changed
- Realistischere Routenplanung
- Weniger verpasste Anschlüsse

---

## [13.0] - 2025-12-31

### ✨ Added
- **Routenplaner-View:** Neue Tab für Journey-Planning
- **Start/Ziel-Suche:** Mit GPS-Unterstützung
- **Alternative Routen:** Mehrere Optionen anzeigen

### 🎨 Changed
- 2-Tab Navigation: Abfahrten | Route
- Optimierte Layout-Struktur

---

## [12.0] - 2025-12-31

### ✨ Added
- **Auto-Refresh Toggle:** An/Aus Schalter im Header
- **Smart Value Update:** Nur Values ändern, kein Re-Render

### 🎯 Changed
- Performantere Refresh-Strategie
- Weniger DOM-Manipulation

---

## [11.0] - 2025-12-31

### ✨ Added
- **30s Auto-Refresh:** Automatische Aktualisierung alle 30 Sekunden
- **Countdown-Anzeige:** "Auto-Refresh in: 28s"

### 🎨 Changed
- Immer aktuelle Abfahrten ohne manuellen Refresh

---

## [10.0] - 2025-12-31

### ✨ Added
- **Pull-to-Refresh:** Touch-basiert auf Mobile
- **Haptic Feedback:** Vibration bei Aktionen (navigator.vibrate)
- **Loading-Spinner:** Während Refresh

### 🎨 Changed
- Native App-ähnliches Verhalten
- Bessere Mobile-UX

---

## [9.0] - 2025-12-31

### ✨ Added
- **Detaillierte Trip-Modal:** Per Tap auf Abfahrt
- **Alle Zwischenstopps:** Mit Ankunfts-/Abfahrtszeiten
- **Swipe-to-Close:** Auf Mobile

### 🎨 Changed
- Mehr Informationen pro Trip
- Bessere Detail-Ansicht

---

## [8.0] - 2025-12-31

### ✨ Added
- **Autocomplete-Suche:** Live-Vorschläge während Eingabe
- **Keyboard-Navigation:** ↑↓ + Enter
- **Touch-optimiert:** Große Tap-Targets

### 🎯 Changed
- Schnellere Stations-Suche
- Bessere UX

---

## [7.0] - 2025-12-31

### ✅ Added
- **Offline-Modus:** Gespeicherte Abfahrten anzeigen
- **Offline-Indikator:** "📵 Offline-Modus" Banner
- **localStorage Caching:** Letzte Abfahrten speichern

### 🎨 Changed
- App funktioniert auch ohne Internet
- Cached Daten als Fallback

---

## [6.0] - 2025-12-31

### ✨ Added
- **Service Worker:** PWA-Funktionalität
- **Offline-Caching:** Statische Assets cached
- **Install-Prompt:** "Als App installieren"

### 🎨 Changed
- App ist jetzt installierbar
- Funktioniert offline

---

## [5.0] - 2025-12-31

### ✨ Added
- **GPS-Standort:** Automatische Station finden
- **"Standort verwenden" Button:** Mit Loading-State
- **Fehlerbehandlung:** Wenn GPS fehlschlägt

### 🎨 Changed
- Schnellerer Zugriff auf nahegelegene Stationen
- Weniger manuelle Suche nötig

---

## [4.0] - 2025-12-31

### ✨ Added
- **Kategorie-Filter:** U-Bahn, S-Bahn, Tram, Bus, Fähre
- **Default: Alle außer Bus/Fähre:** Weniger "noise"
- **Toggle-Buttons:** An/Aus für jede Kategorie

### 🎨 Changed
- Übersichtlichere Abfahrten-Liste
- Fokus auf wichtige Linien

---

## [3.0] - 2025-12-31

### ✨ Added
- **Verspätungen:** Rot markiert mit Delay-Info
- **Ausfälle:** Durchgestrichen mit "Fällt aus"
- **Gleis/Steig:** Bei verfügbar angezeigt

### 🎨 Changed
- Mehr Informationen pro Abfahrt
- Bessere visuelle Unterscheidung

---

## [2.0] - 2025-12-31

### ✨ Added
- **Live-Abfahrten:** Echtzeit-Daten von VBB API
- **Relativer Countdown:** "in 3 Min" statt absoluter Zeit
- **Verkehrsmittel-Icons:** 🚇🚊🚋🚌⛴️

### 🎨 Changed
- Funktionale Abfahrtsanzeige
- Echte Daten statt Mockups

---

## [1.0] - 2025-12-30

### ✨ Added
- **Initial Release**
- **Basic HTML/CSS/JS Structure**
- **BVG-Styling:** DotMatrix Font + Gelb/Schwarz
- **Responsive Design:** Mobile-First

### 🎨 Changed
- Basis-Framework erstellt
- Design-System etabliert

---

## Legende

- ✨ **Added:** Neue Features
- 🎨 **Changed:** Änderungen an bestehenden Features
- 🐛 **Fixed:** Bug-Fixes
- 🎯 **Improved:** Performance/UX-Verbesserungen
- ✅ **Completed:** Fertiggestellte Features
- ⚠️ **Deprecated:** Veraltete Features
- 🗑️ **Removed:** Entfernte Features

---

## Contributing

Wenn du einen Bug findest oder ein Feature vorschlagen möchtest, öffne bitte ein [GitHub Issue](https://github.com/Serverlele30/VBB-Status-Web-App/issues).

---

Made with ❤️ for Berlin & Brandenburg
