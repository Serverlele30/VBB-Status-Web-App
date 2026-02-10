# 🚀 Installation & Setup

Diese Anleitung führt dich Schritt für Schritt durch die Installation der VBB Netz Status App.

## 📋 Voraussetzungen

### Erforderlich:
- **Node.js** v16.0.0 oder höher
- **npm** v8.0.0 oder höher
- **OpenSSL** (für HTTPS-Zertifikate)

### Optional:
- **Git** (zum Klonen des Repositories)

---

## 🔧 Installation

### Option 1: Mit Git

```bash
# Repository klonen
git clone https://github.com/Serverlele30/VBB-Status-Web-App.git

# In Projektverzeichnis wechseln
cd VBB-Status-Web-App

# Abhängigkeiten installieren
npm install
```

### Option 2: Download als ZIP

1. Repository als ZIP herunterladen
2. ZIP entpacken
3. Terminal/Kommandozeile öffnen
4. In Projektverzeichnis navigieren
5. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

---

## ▶️ Server starten

### Entwicklungsserver (HTTPS)

```bash
npm start
# oder
npm run dev
```

Der Server startet automatisch auf `https://localhost:3000`

### Beim ersten Start:

1. **SSL-Zertifikat wird generiert**
   - Der Server erstellt automatisch ein selbstsigniertes Zertifikat
   - Gespeichert in: `./certs/`

2. **Browser-Warnung akzeptieren**
   - Chrome/Edge: "Erweitert" → "Weiter zu localhost"
   - Firefox: "Erweitert" → "Ausnahme hinzufügen"
   - Safari: "Details" → "Diese Website besuchen"

3. **App öffnet sich**
   - URL: `https://localhost:3000`
   - Die App lädt automatisch

---

## 📱 Mobile Testing

### Im lokalen Netzwerk testen:

1. **IP-Adresse finden:**

   **Windows:**
   ```bash
   ipconfig
   # Suche nach "IPv4-Adresse"
   ```

   **Mac/Linux:**
   ```bash
   ifconfig
   # oder
   ip addr show
   ```

2. **Auf Mobile-Gerät öffnen:**
   ```
   https://DEINE_IP:3000
   ```
   Beispiel: `https://192.168.1.100:3000`

3. **Zertifikatswarnung akzeptieren**
   - Auf dem Smartphone die Warnung bestätigen
   - "Trotzdem fortfahren" wählen

---

## 🏗️ Projektstruktur

```
vbb-netz-status/
├── index.html              # HTML-Struktur
├── styles.css              # Alle Styles (Dark Mode, Responsive)
├── script.js               # App-Logik (Abfahrten, Routen, Live-Map)
├── server.js               # HTTPS-Development-Server
├── service-worker.js       # PWA Service Worker (Offline)
├── manifest.json           # PWA Manifest (Installation)
├── package.json            # Node.js Konfiguration
├── LICENSE                 # MIT Lizenz
├── README.md               # Projekt-Dokumentation
├── CHANGELOG.md            # Versions-Historie
├── INSTALLATION.md         # Diese Datei
├── .gitignore              # Git-Ignore-Liste
├── certs/                  # SSL-Zertifikate (auto-generiert)
│   ├── cert.pem
│   └── key.pem
└── images/                 # App-Assets (Icons, Favicons)
    └── favicon.png
```

---

## 🔐 HTTPS & SSL-Zertifikate

### Warum HTTPS?

- **PWA-Anforderung**: Service Worker benötigt HTTPS
- **Geolocation API**: Browser verlangen sichere Verbindung
- **Best Practice**: Moderne Web-Standards

### Zertifikate neu generieren:

```bash
# Alte Zertifikate löschen
rm -rf certs/

# Server neu starten (generiert automatisch neue)
npm start
```

### Manuell generieren (falls OpenSSL verfügbar):

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

---

## 🐛 Troubleshooting

### Problem: "npm: command not found"

**Lösung:** Node.js installieren
- Download: https://nodejs.org/
- Empfohlen: LTS-Version

### Problem: "Port 3000 already in use"

**Lösung 1:** Anderen Prozess beenden
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Lösung 2:** Port in `server.js` ändern
```javascript
const PORT = 3001; // Statt 3000
```

### Problem: "OpenSSL not found"

**Lösung (Windows):**
1. Git Bash verwenden (enthält OpenSSL)
2. Oder OpenSSL separat installieren: https://slproweb.com/products/Win32OpenSSL.html

**Lösung (Mac):**
```bash
brew install openssl
```

**Lösung (Linux):**
```bash
sudo apt-get install openssl
```

### Problem: "Cannot GET /"

**Lösung:** Stelle sicher, dass alle Dateien vorhanden sind:
```bash
ls -la
# Sollte index.html, styles.css, script.js enthalten
```

### Problem: Service Worker funktioniert nicht

**Lösung:**
1. Browser-Cache leeren (Ctrl+Shift+Del)
2. Service Worker deregistrieren:
   - Chrome DevTools → Application → Service Workers → Unregister
3. Seite neu laden (Ctrl+F5)

---

## 🎨 Anpassungen

### Port ändern:

In `server.js`:
```javascript
const PORT = 3001; // Dein gewünschter Port
```

### Cache-Version ändern:

In `service-worker.js`:
```javascript
const CACHE_NAME = 'vbb-status-v31'; // Neue Version
```

### Farben anpassen:

In `styles.css`:
```css
/* Hauptfarbe ändern */
--primary-color: #FFED00; /* BVG Gelb */
--background-color: #000;  /* Schwarz */
```

---

## 📦 Dependencies

### Produktions-Dependencies:
- **mime-types** (^2.1.35): MIME-Type Detection für Server

### Keine Dev-Dependencies:
- Projekt läuft ohne Build-Prozess
- Keine Transpiler oder Bundler nötig

---

## 🚀 Deployment

### Für Produktion:

1. **Statisches Hosting** (Empfohlen):
   - GitHub Pages
   - Netlify
   - Vercel
   - Cloudflare Pages

2. **Node.js Server** (Optional):
   - Heroku
   - DigitalOcean
   - AWS
   - Google Cloud

### GitHub Pages Deployment:

```bash
# Für GitHub Pages
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# Settings → Pages → Source: main branch
```

---

## 📞 Support

Bei Problemen oder Fragen:

1. **GitHub Issues**: https://github.com/Serverlele30/VBB-Status-Web-App/issues
2. **README konsultieren**: Enthält zusätzliche Infos
3. **CHANGELOG prüfen**: Bekannte Probleme und Fixes

---

## ✅ Checkliste nach Installation

- [ ] Node.js installiert (v16+)
- [ ] npm installiert (v8+)
- [ ] Repository geklont/heruntergeladen
- [ ] `npm install` ausgeführt
- [ ] Server startet ohne Fehler
- [ ] `https://localhost:3000` öffnet die App
- [ ] Zertifikatswarnung akzeptiert
- [ ] Mobile-Testing funktioniert (optional)
- [ ] PWA installiert (optional)

---

**🎉 Viel Erfolg mit der VBB Netz Status App!**

Entwickelt von Aaron K. & Claude (Anthropic)  
Lizenz: MIT
