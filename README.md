# VBB Netz Status
*by Aaron K.*

Progressive Web App für Echtzeit-Abfahrten im VBB (Berlin-Brandenburg).

## Features

- 📍 **GPS-Standortsuche** - Findet automatisch die nächste Station
- 🔍 **Stationssuche** - Autocomplete für alle VBB-Stationen
- ⏱️ **Echtzeit-Updates** - Smart Refresh alle 30s (nur Werte, kein Flackern)
- 📱 **PWA** - Installierbar als native App (iOS/Android/Desktop)
- 🔄 **Pull-to-Refresh** - Intuitive Aktualisierung
- 📊 **Detaillierte Infos** - Alle Halte, Verspätungen, Störungen
- 🎨 **VBB Design** - Authentische Farben & DotMatrix Font
- ⚡ **Performance** - Minimalistisch, keine Animationen
- 📵 **Offline** - Service Worker Support
- 🔒 **Rate-Limiting** - Max 100 API-Anfragen/Min

## Installation

```bash
# Repository klonen
git clone https://github.com/Serverlele30/VBB-Status-Web-App/.git

# Mit lokalem Server starten
python3 -m http.server 8000
# oder: npx serve

# Browser öffnen
open http://localhost:8000
```

**Benötigt:**
- HTTPS (für GPS & Service Worker)
- `DotMatrix.ttf` im Root ([Download](https://github.com/NikBLN/weilSieDichLieben))
- `images/favicon.png`

## Als App installieren

- **iOS**: Safari → Teilen → "Zum Home-Bildschirm"
- **Android**: Chrome → Menü → "App installieren"
- **Desktop**: Adressleiste → Install-Symbol

## Tech Stack

- Vanilla JavaScript (kein Framework)
- [VBB Transport REST API v6](https://v6.vbb.transport.rest)
- Service Worker (Offline)
- PWA (Web Manifest)
- [DotMatrix Font](https://github.com/NikBLN/weilSieDichLieben) by NikBLN


## Browser-Support

- ✅ iOS Safari 11.3+
- ✅ Android Chrome 72+
- ✅ Desktop (Chrome, Firefox, Safari, Edge)

## Troubleshooting

**GPS funktioniert nicht?**
- HTTPS erforderlich
- Standortdienste aktivieren
- Browser-Berechtigung erteilen

**API-Fehler?**
- Rate-Limit (100/Min) erreicht
- Keine Internetverbindung

## Lizenz

MIT License - siehe [LICENSE](LICENSE)

## Credits & Danksagung

- **[VBB Transport REST API](https://v6.vbb.transport.rest)** - Echtzeit-Verkehrsdaten
- **[DotMatrix Font](https://github.com/NikBLN/weilSieDichLieben)** by [@NikBLN](https://github.com/NikBLN) - Authentisches VBB-Feeling

## Autor

Aaron K.

---

*Inoffizielles Projekt - Keine Verbindung zum VBB*
