# 🤝 Contributing Guide

Danke, dass du zu VBB Netz Status beitragen möchtest! Diese Anleitung hilft dir, loszulegen.

## 📋 Inhaltsverzeichnis

- [Code of Conduct](#code-of-conduct)
- [Wie kann ich beitragen?](#wie-kann-ich-beitragen)
- [Entwicklungsumgebung](#entwicklungsumgebung)
- [Coding Standards](#coding-standards)
- [Pull Request Prozess](#pull-request-prozess)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

---

## 🤝 Code of Conduct

### Unsere Versprechen

- Respektvoller Umgang mit allen Contributors
- Konstruktive, freundliche Diskussionen
- Fokus auf das Beste für das Projekt und die Community
- Akzeptanz von konstruktiver Kritik

### Unerwünschtes Verhalten

- Beleidigungen oder persönliche Angriffe
- Trolling oder provozierende Kommentare
- Veröffentlichung privater Informationen
- Unprofessionelles Verhalten

---

## 💡 Wie kann ich beitragen?

### 1. Code Contributions

- **Bugfixes**: Behebe bekannte Bugs aus Issues
- **Features**: Implementiere neue Features (nach Diskussion)
- **Optimierungen**: Verbessere Performance oder Code-Qualität
- **Tests**: Füge Tests hinzu (falls vorhanden)

### 2. Dokumentation

- **README verbessern**: Ergänze fehlende Informationen
- **Code-Kommentare**: Dokumentiere komplexe Funktionen
- **Tutorials**: Erstelle Anleitungen für Nutzer
- **Übersetzungen**: Hilf bei mehrsprachiger Unterstützung

### 3. Design

- **UI/UX Verbesserungen**: Optimiere Benutzeroberfläche
- **Icons & Assets**: Erstelle/verbessere Icons
- **Responsive Design**: Verbessere Mobile/Desktop Layouts
- **Accessibility**: Erhöhe Barrierefreiheit

### 4. Testing

- **Bug Testing**: Teste auf verschiedenen Geräten
- **Browser Compatibility**: Prüfe verschiedene Browser
- **Performance Testing**: Messe Ladezeiten & Optimierungen
- **User Feedback**: Sammle Rückmeldungen von Nutzern

---

## 🔧 Entwicklungsumgebung

### Setup

1. **Repository forken**
   ```bash
   # Auf GitHub: Fork-Button klicken
   ```

2. **Dein Fork klonen**
   ```bash
   git clone https://github.com/DEIN_USERNAME/VBB-Status-Web-App.git
   cd VBB-Status-Web-App
   ```

3. **Upstream Repository hinzufügen**
   ```bash
   git remote add upstream https://github.com/Serverlele30/VBB-Status-Web-App.git
   ```

4. **Dependencies installieren**
   ```bash
   npm install
   ```

5. **Development Server starten**
   ```bash
   npm start
   ```

### Entwicklungs-Workflow

1. **Neuen Branch erstellen**
   ```bash
   git checkout -b feature/deine-feature-beschreibung
   # oder
   git checkout -b fix/bug-beschreibung
   ```

2. **Änderungen vornehmen**
   - Editiere `index.html`, `styles.css` oder die Module in `js/`
   - Teste lokal: `https://localhost:3000`

3. **Regelmäßig committen**
   ```bash
   git add .
   git commit -m "feat: Kurze Beschreibung der Änderung"
   ```

4. **Mit Upstream synchronisieren**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

5. **Push zu deinem Fork**
   ```bash
   git push origin feature/deine-feature-beschreibung
   ```

---

## 📝 Coding Standards

### HTML

```html
<!-- ✅ Gut: Saubere Struktur, semantisches HTML -->
<section class="departure-list" aria-label="Abfahrten">
    <article class="departure-item">
        <h3>Alexanderplatz</h3>
    </article>
</section>

<!-- ❌ Schlecht: Keine Semantik, unleserlich -->
<div class="dl"><div class="di"><div>Alexanderplatz</div></div></div>
```

### CSS

```css
/* ✅ Gut: BEM-ähnliche Konvention, kommentiert */
/* Departure Item Container */
.departure-item {
    padding: 15px;
    background-color: #0a0a0a;
}

.departure-item__header {
    display: flex;
    justify-content: space-between;
}

/* ❌ Schlecht: Unklar, keine Kommentare */
.di {
    padding: 15px;
}
```

### JavaScript

```javascript
// ✅ Gut: Beschreibende Namen, Kommentare, Error Handling
async function loadDepartures(stationId) {
    try {
        const response = await fetch(`${API_BASE}/stops/${stationId}/departures`);
        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        return data.departures;
    } catch (error) {
        console.error('Failed to load departures:', error);
        showErrorMessage('Abfahrten konnten nicht geladen werden');
        return [];
    }
}

// ❌ Schlecht: Kryptische Namen, kein Error Handling
async function ld(s) {
    const r = await fetch(`${API_BASE}/stops/${s}/departures`);
    return await r.json();
}
```

### Commit Messages

Folge [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

# Typen:
feat:     # Neues Feature
fix:      # Bugfix
docs:     # Dokumentation
style:    # Formatierung (kein Code-Change)
refactor: # Code-Refactoring
perf:     # Performance-Verbesserung
test:     # Tests hinzufügen
chore:    # Build, Dependencies

# Beispiele:
git commit -m "feat(live-map): Add vehicle type filter"
git commit -m "fix(departures): Handle empty API response"
git commit -m "docs(readme): Update installation instructions"
git commit -m "style(css): Format departure items"
git commit -m "perf(api): Cache API responses for 30s"
```

---

## 🔀 Pull Request Prozess

### 1. Vorbereitung

- [ ] Code funktioniert lokal
- [ ] Keine Console Errors
- [ ] Responsive Design getestet
- [ ] Code kommentiert
- [ ] CHANGELOG.md aktualisiert (bei größeren Changes)

### 2. Pull Request erstellen

1. Gehe zu deinem Fork auf GitHub
2. Klicke "Pull Request" → "New Pull Request"
3. Base: `Serverlele30/VBB-Status-Web-App` → `main`
4. Compare: `dein-username/VBB-Status-Web-App` → `dein-branch`

### 3. PR Beschreibung

```markdown
## Beschreibung
Kurze Zusammenfassung der Änderungen

## Typ der Änderung
- [ ] Bugfix
- [ ] Neues Feature
- [ ] Breaking Change
- [ ] Dokumentation

## Wie getestet?
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Mobile
- [ ] Chrome Mobile

## Screenshots (falls UI-Änderungen)
[Screenshot hier einfügen]

## Checklist
- [ ] Code folgt Style Guide
- [ ] Selbst-Review durchgeführt
- [ ] Kommentare hinzugefügt
- [ ] CHANGELOG.md aktualisiert
- [ ] Keine neuen Warnings
```

### 4. Review Prozess

- Maintainer werden deinen PR prüfen
- Möglicherweise werden Änderungen angefragt
- Nach Approval: Merge in main branch
- Branch kann gelöscht werden

---

## 🐛 Bug Reports

### Gutes Bug Report Template:

```markdown
**Beschreibung des Bugs**
Kurze, klare Beschreibung was passiert.

**Reproduktion**
Schritte um den Bug zu reproduzieren:
1. Gehe zu '...'
2. Klicke auf '...'
3. Scrolle nach '...'
4. Sieh Fehler

**Erwartetes Verhalten**
Was sollte stattdessen passieren?

**Screenshots**
Falls zutreffend, füge Screenshots hinzu.

**Umgebung:**
- Browser: [z.B. Chrome 120, Firefox 121]
- OS: [z.B. Windows 11, macOS 14, iOS 17]
- App Version: [z.B. v30.0.0]
- Mobile/Desktop: [z.B. iPhone 15 Pro]

**Zusätzlicher Kontext**
Console Errors, Network Logs, etc.
```

### Bug Issue erstellen:

1. Gehe zu: https://github.com/Serverlele30/VBB-Status-Web-App/issues
2. Klicke "New Issue"
3. Label: `bug`
4. Fülle Template aus

---

## 💡 Feature Requests

### Gutes Feature Request Template:

```markdown
**Problem/Motivation**
Welches Problem würde dieses Feature lösen?
Beispiel: "Es ist schwierig, Favoriten-Stationen zu speichern..."

**Vorgeschlagene Lösung**
Wie könnte das Feature implementiert werden?
Beispiel: "Ein 'Favoriten'-Button neben jeder Station..."

**Alternativen**
Welche anderen Lösungen hast du in Betracht gezogen?

**Mockups/Wireframes**
Falls vorhanden, füge Design-Ideen hinzu.

**Zusätzlicher Kontext**
Andere Apps die ähnliche Features haben, etc.
```

### Feature Request erstellen:

1. Gehe zu Issues
2. Label: `enhancement`
3. Diskutiere Feature mit Maintainern
4. Nach Approval: Implementierung starten

---

## 🎨 Design Guidelines

### Farbschema

```css
/* Primärfarben */
--yellow: #FFED00;      /* BVG Gelb */
--black: #000000;       /* Hintergrund */
--white: #FFFFFF;       /* Text */

/* Linienfarben (BVG Standard) */
--u1: #55A823;          /* U1 Grün */
--u2: #C00000;          /* U2 Rot */
--u3: #028D4C;          /* U3 Grün */
/* ... siehe styles.css für alle Linien */

/* Graustufen */
--gray-dark: #1a1a1a;
--gray-medium: #333333;
--gray-light: #666666;
```

### Typografie

```css
/* Hauptschrift: DotMatrix (Retro BVG-Look) */
font-family: 'DotMatrix', 'Courier New', monospace;

/* Größen */
--text-xs: 10px;
--text-sm: 12px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 32px;
```

### Spacing

```css
/* 4px Base Unit */
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
```

---

## 🧪 Testing Checklist

Vor Pull Request:

### Browser Compatibility
- [ ] Chrome (neueste Version)
- [ ] Firefox (neueste Version)
- [ ] Safari (neueste Version)
- [ ] Edge (neueste Version)

### Geräte
- [ ] Desktop (1920x1080+)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667 - iPhone SE)
- [ ] Mobile (414x896 - iPhone 11)

### Features
- [ ] Abfahrten laden funktioniert
- [ ] Routenplanung funktioniert
- [ ] Live-Map zeigt Fahrzeuge
- [ ] Service Worker cached korrekt
- [ ] PWA Installation funktioniert
- [ ] Offline-Modus funktioniert

### Performance
- [ ] Ladezeit < 3s
- [ ] Keine Memory Leaks
- [ ] Smooth Scrolling
- [ ] Keine Layout Shifts

---

## 📚 Ressourcen

### APIs
- **VBB API**: https://v6.vbb.transport.rest/api.html
- **BVG Farben**: Siehe `getBVGLineColor()` in js/livemap.js

### Libraries
- **Leaflet.js**: https://leafletjs.com/
- **Leaflet Docs**: https://leafletjs.com/reference.html

### Tools
- **Chrome DevTools**: Browser Console, Network Tab
- **Lighthouse**: Performance Audit
- **Can I Use**: Browser Compatibility Check

---

## ❓ Fragen?

Bei Fragen:

1. **GitHub Discussions**: (falls aktiviert)
2. **Issues**: Stelle Fragen als Issue mit Label `question`
3. **README/Docs**: Prüfe vorhandene Dokumentation

---

## 🎉 Danke!

Vielen Dank für dein Interesse an VBB Netz Status! Jeder Beitrag, egal wie klein, hilft das Projekt zu verbessern.

**Happy Coding! 🚇🚌🚊**

---

**Maintainer:**
- Aaron K. ([@Serverlele30](https://github.com/Serverlele30))
- Claude (Anthropic)

**Lizenz:** MIT
