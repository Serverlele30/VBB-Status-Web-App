# VBB Netz Status

> **Live-Nahverkehr für Berlin & Brandenburg**  
> Eine Progressive Web App (PWA) für Echtzeit-Abfahrten, Routenplanung und Live-Fahrzeugverfolgung im VBB-Gebiet

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-29.0-blue.svg)](https://github.com/Serverlele30/VBB-Status-Web-App)

**Live-Demo:** [VBB-Status-Web-App](https://github.com/Serverlele30/VBB-Status-Web-App)

---

## 📱 Features

### 🚇 **Echtzeit-Abfahrten**
- **Live-Daten** für alle Stationen im VBB-Netz (Berlin + Brandenburg)
- **GPS-Standort** - Automatische Stationserkennung
- **Intelligente Suche** mit Autocomplete
- **Detaillierte Infos** - Verspätungen, Ausfälle, Gleis/Steig
- **Auto-Refresh** - Alle 30 Sekunden (optional)
- **Offline-Modus** - Gespeicherte Daten anzeigen

### 🗺️ **Intelligenter Routenplaner**
- **Start/Ziel-Suche** mit GPS-Unterstützung
- **5 Min. Umstiegszeit** garantiert
- **Detaillierte Fußwege** mit Gehzeit
- **Alternative Routen** - Mehrere Optionen
- **Robuste Stationserkennung** - Funktioniert auch bei unvollständigen Eingaben

### 🌍 **Live-Map**
- **Echtzeit-Fahrzeugverfolgung** auf Dark-Mode Karte
- **Authentische BVG-Farben** für alle Linien (U-Bahn, S-Bahn, Tram, Bus)
- **Dynamische Bounds** - Nur sichtbare Fahrzeuge laden (bis zu 69% weniger Daten)
- **Filter nach Fahrzeugtyp** - U-Bahn, S-Bahn, Tram, Bus, Fähre
- **API-optimiert** - Intelligentes Caching

### 📱 **Progressive Web App (PWA)**
- **Installierbar** - Als App auf Home-Screen
- **Offline-Fähig** - Service Worker mit Caching
- **Touch-optimiert** - Pull-to-Refresh, Wischgesten
- **Responsive** - Funktioniert auf Mobile & Desktop
- **Dark-Mode** - Schont die Augen

---

## 🚀 Quick Start

### **Option 1: Direkt nutzen**
Öffne die App einfach im Browser - keine Installation nötig!

### **Option 2: Als PWA installieren**

**Mobile (iOS/Android):**
1. Öffne die App im Browser
2. Tippe auf "Teilen" → "Zum Home-Bildschirm"
3. Fertig! App ist jetzt auf deinem Home-Screen

**Desktop (Chrome/Edge):**
1. Öffne die App im Browser
2. Klicke auf das Install-Icon in der Adressleiste
3. Fertig! App ist jetzt in deinen Apps

---

## 🛠️ Installation (für Entwickler)

### **Voraussetzungen**
- Node.js (v16+)
- npm oder yarn
- HTTPS-Server (für PWA-Features)

### **Setup**

```bash
# Repository klonen
git clone https://github.com/Serverlele30/VBB-Status-Web-App.git
cd VBB-Status-Web-App

# Dependencies installieren
npm install

# HTTPS-Server starten
npm start
```

Die App ist jetzt verfügbar unter: `https://localhost:3000`

### **HTTPS-Server**

Die App benötigt HTTPS für PWA-Features (Service Worker, GPS, etc.).

**Server-Skript (`server.js`):**
```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mimeTypes = require('mime-types');

// Auto-generiert SSL-Zertifikate falls nicht vorhanden
// Nutzt OpenSSL für self-signed certificates
```

**SSL-Zertifikate werden automatisch generiert!**

---

## 📂 Projekt-Struktur

```
VBB-Status-Web-App/
├── index.html              # Haupt-HTML (Single-Page App)
├── service-worker.js       # PWA Service Worker
├── manifest.json           # PWA Manifest
├── server.js               # HTTPS Development Server
├── package.json            # Node.js Dependencies
├── icons/                  # App-Icons (verschiedene Größen)
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable.png
├── fonts/                  # Custom Fonts
│   └── DotMatrix.ttf       # BVG-Schriftart
└── data/                   # Statische Daten
    └── station_lines.json  # Station-zu-Linie Mappings
```

---

## 🎨 Design

### **Farbschema**
- **Primär:** `#FFED00` (BVG-Gelb)
- **Background:** `#000000` (Schwarz)
- **Sekundär:** `#1a1a1a` (Dunkelgrau)
- **Text:** `#ffffff` / `#cccccc`
- **Borders:** `#333333`

### **Typografie**
- **Haupt-Font:** DotMatrix (BVG-Stil)
- **Fallback:** Courier New, monospace

### **Icons & Emojis**
- 🚇 U-Bahn
- 🚊 S-Bahn
- 🚋 Tram
- 🚌 Bus
- ⛴️ Fähre

### **BVG-Linienfarben**
Authentische Farben für alle 40+ Linien:
- **U-Bahnen:** U1-U9 mit Original-Farben
- **S-Bahnen:** S-Bahn Grün + Ringbahn Orange
- **Trams:** Metro-Tram Rot + Tram Gelb
- **Busse:** Gelb + Metro-Bus Rot

---

## 🔧 Technische Details

### **APIs**
- **VBB Transport REST API v6**
  - Endpoint: `https://v6.vbb.transport.rest`
  - Rate Limit: 100 Requests/Minute
  - [Dokumentation](https://v6.vbb.transport.rest/api.html)

### **Libraries**
- **Leaflet.js** - Interaktive Karten
- **CartoDB Dark Matter** - Karten-Tiles (Dark-Mode)
- Vanilla JavaScript (kein Framework!)

### **Browser-Support**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Browser (iOS Safari, Chrome Mobile)

### **Performance**
- **First Contentful Paint:** < 1s
- **Time to Interactive:** < 2s
- **Lighthouse Score:** 95+
- **Bundle Size:** ~150KB (unkomprimiert)

---

## 🗺️ Datenquellen

### **Station-Line Mappings**
Präzise Station-zu-Linie Zuordnungen für 1000+ Stationen:
- Extrahiert via custom Node.js Script
- Analysiert echte Trip-Routen statt generische Location-Searches
- Deckt alle U-Bahn, S-Bahn, Tram und Metro-Linien ab

**Extraktion:**
```bash
node extract_station_lines.js
```

Generiert `data/station_lines.json` mit Format:
```json
{
  "900000017101": {
    "name": "U Spichernstr.",
    "lines": ["U3", "U9"]
  }
}
```

---

## 📱 PWA-Features

### **Manifest.json**
```json
{
  "name": "VBB Netz Status",
  "short_name": "VBB Status",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#FFED00",
  "background_color": "#000000",
  "icons": [...]
}
```

### **Service Worker**
- **Cache-First-Strategie** für statische Assets
- **Network-First** für API-Calls
- **Offline-Fallback** für alle Seiten
- **Auto-Update** bei neuer Version

**Cache-Versioning:**
```javascript
const CACHE_NAME = 'vbb-status-v27';
```

### **Offline-Features**
- ✅ Gespeicherte Abfahrten anzeigen
- ✅ Letzte Suchanfragen speichern
- ✅ Offline-Indikator
- ✅ Cached Karten-Tiles

---

## 🎯 Features im Detail

### **GPS-Standort**
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    findNearbyStops(latitude, longitude);
  }
);
```

### **Auto-Refresh**
- **Standard:** 30 Sekunden
- **Togglebar:** An/Aus im Header
- **Smart:** Nur sichtbare Values aktualisieren (kein Re-Render)

### **Pull-to-Refresh**
```javascript
// Touch-basiert, nur auf Mobile
// Haptic Feedback via navigator.vibrate()
```

### **Autocomplete-Suche**
- **Debounced:** 300ms Verzögerung
- **Min. 2 Zeichen** für Suche
- **Keyboard-Navigation:** ↑↓ + Enter
- **Touch-optimiert:** Große Tap-Targets

### **Modal-Details**
- **Trip-Details** per Tap auf Abfahrt
- **Route-Details** mit Zwischenstopps
- **Fußweg-Anleitung** mit Distanz/Zeit
- **Swipe-to-Close** auf Mobile

---

## 🔒 Datenschutz

- ✅ **Keine Cookies**
- ✅ **Kein Tracking**
- ✅ **Keine Werbung**
- ✅ **Kein Analytics**
- ✅ **GPS nur auf Anfrage** (Browser-Permission)
- ✅ **Lokale Speicherung** (localStorage, keine Server)

**Alle Daten bleiben auf deinem Gerät!**

---

## 🐛 Bekannte Probleme

### **API-Limits**
- VBB API: 100 Requests/Minute
- Bei Überschreitung: 429 Error → Retry nach 60s

### **GPS-Genauigkeit**
- Abhängig von Gerät & Standort
- Indoor oft ungenau
- Fallback: Manuelle Suche

### **Browser-Kompatibilität**
- Service Worker: Nur HTTPS
- GPS: Nur Secure Context (HTTPS oder localhost)
- Ältere Browser: Eingeschränkte Features

---

## 🤝 Contributing

Contributions sind willkommen! 🎉

### **Workflow**
1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### **Code-Style**
- **Vanilla JavaScript** (kein TypeScript)
- **Kommentare** für komplexe Logik
- **Konsistente Formatierung** (2 Spaces, Semikolons)
- **BVG-Farbschema** beibehalten

---

## 📝 Changelog

Siehe [CHANGELOG.md](CHANGELOG.md) für Details zu allen Updates.

**Latest:** v27.0 - Credits & Header Update

---

## 📄 Lizenz

Dieses Projekt ist unter der **MIT License** lizenziert - siehe [LICENSE](LICENSE) für Details.

**Das bedeutet:**
- ✅ Kostenlos nutzbar
- ✅ Für private & kommerzielle Projekte
- ✅ Modifizierbar
- ✅ Weitergabe erlaubt

**Aber:**
- ⚠️ Ohne Garantie
- ⚠️ Auf eigene Verantwortung

---

## 🙏 Credits

### **Entwicklung**
- **Aaron K.** - Initial Development & Design
- **Claude (Anthropic)** - AI-Assisted Development

### **Daten & APIs**
- **VBB Transport REST API v6** - [v6.vbb.transport.rest](https://v6.vbb.transport.rest)
- **OpenStreetMap Contributors** - Kartendaten
- **CartoDB** - Dark Matter Map Tiles

### **Schriftart**
- **DotMatrix** by [@NikBLN](https://github.com/NikBLN)

### **Inspiration**
- **BVG** - Design & Farbschema
- **VBB** - Verkehrsverbund Berlin-Brandenburg

---

## 📬 Kontakt

**Repository:** [github.com/Serverlele30/VBB-Status-Web-App](https://github.com/Serverlele30/VBB-Status-Web-App)

**Issues:** [GitHub Issues](https://github.com/Serverlele30/VBB-Status-Web-App/issues)

---

## ⚠️ Disclaimer

Diese App ist ein **inoffizielles Projekt** und wird **nicht** von VBB oder BVG betrieben oder unterstützt.

Alle Daten stammen von der öffentlichen VBB Transport REST API.

**Keine Garantie für:**
- Richtigkeit der Daten
- Verfügbarkeit der API
- Fehlerfreien Betrieb

**Nutze die App auf eigene Verantwortung!**

---

<div align="center">

Made with ❤️ for Berlin & Brandenburg

**[⬆ Back to Top](#vbb-netz-status)**

</div>
