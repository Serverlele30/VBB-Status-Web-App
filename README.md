# VBB Netz Status - Getrennte Dateien

## 📁 Dateistruktur

Die App wurde jetzt in separate Dateien aufgeteilt:

```
vbb-netz-status/
├── index.html          # HTML-Struktur
├── styles.css          # Alle CSS-Styles
├── js/
│   ├── api.js          # API-Schicht, Rate-Limit, Cache, Favoriten, Persistenz
│   ├── app.js          # Views, Abfahrten, Routenplaner, Menü
│   ├── livemap.js      # Live-Map (Leaflet, Fahrzeug-Radar)
│   ├── changelog.js    # Changelog-Loader + Markdown-Parser
│   └── extras.js       # Filter, Tabs, App-Start-Restore, Hover-Extras
├── server.js           # HTTPS-Entwicklungsserver
├── service-worker.js   # PWA Service Worker
├── manifest.json       # PWA Manifest
├── package.json        # Node.js Dependencies
└── LICENSE             # MIT Lizenz
```

## 🚀 Installation & Start

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Server starten:**
   ```bash
   npm start
   ```

3. **Browser öffnen:**
   ```
   https://localhost:3000
   ```

## 📝 Änderungen

**Vorher:**
- Alles in einer `index.html` (4698 Zeilen)

**Nachher:**
- `index.html` - Nur HTML-Struktur (~380 Zeilen)
- `styles.css` - Alle CSS-Regeln (~2300 Zeilen)
- `js/` - JavaScript, aufgeteilt in 5 Module (api, app, livemap, changelog, extras)

## ✅ Vorteile der Trennung

- 📦 **Bessere Organisation** - Jede Datei hat einen klaren Zweck
- 🔧 **Einfachere Wartung** - CSS und JS können unabhängig bearbeitet werden
- ⚡ **Caching** - Browser können CSS/JS separat cachen
- 🎨 **Entwicklung** - Einfacher zu debuggen und zu bearbeiten
- 👥 **Teamarbeit** - Mehrere Entwickler können parallel arbeiten

## 🛠️ Technische Details

- **CSS**: Enthält alle Styles inkl. Dark Mode, Responsive Design, Animationen
- **JavaScript**: Enthält alle Funktionen für Abfahrten, Routen, Live-Map
- **HTML**: Referenziert CSS (`<link>`) und JS (`<script src>`)

## 📱 PWA Unterstützung

Die App funktioniert weiterhin als Progressive Web App:
- Service Worker für Offline-Funktionalität
- Manifest für Installation auf dem Homescreen
- HTTPS-Server für sichere Verbindung

---

**Entwickelt von:** Aaron K. & Claude (Anthropic)  
**Lizenz:** MIT
