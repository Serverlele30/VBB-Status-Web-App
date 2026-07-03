// VBB Netz Status - Changelog-Loader + Markdown-Parser

// ==========================================
// UPDATES VIEW - CHANGELOG LOADER
// ==========================================


// ==========================================
// CHANGELOG LOADER - VERBESSERT
// Fetcht CHANGELOG.md und konvertiert Markdown zu HTML
// ==========================================

let changelogState = 'idle'; // 'idle' | 'loading' | 'loaded'

async function loadChangelog() {
    // Guard: verhindert parallele/mehrfache Ladungen
    if (changelogState !== 'idle') return;
    changelogState = 'loading';

    const container = document.getElementById('changelogContent');
    
    try {
        // Lade CHANGELOG.md
        const response = await fetch('CHANGELOG.md');
        if (!response.ok) throw new Error('CHANGELOG.md nicht gefunden');
        
        const markdown = await response.text();
        
        // Konvertiere Markdown zu HTML
        const html = markdownToHtml(markdown);
        
        // Wrapper mit changelog-container Klasse
        container.innerHTML = `<div class="changelog-container">${html}</div>`;
        changelogState = 'loaded';
        
    } catch (error) {
        console.error('Changelog Fehler:', error);
        changelogState = 'idle'; // erneuter Versuch möglich
        container.innerHTML = `
            <div class="changelog-container">
                <div style="text-align: center; padding: 40px 20px; color: #ff5555;">
                    <p style="font-size: 18px; margin-bottom: 10px;">⚠️ Changelog konnte nicht geladen werden</p>
                    <p style="font-size: 14px; opacity: 0.7;">${escapeHtml(error.message)}</p>
                </div>
            </div>
        `;
    }
}

// ==========================================
// MARKDOWN TO HTML CONVERTER
// ==========================================

function markdownToHtml(markdown) {
    let html = '';
    const lines = markdown.split('\n');
    let inList = false;
    let inOrderedList = false;
    let inCodeBlock = false;
    let codeBlockContent = '';
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Code-Block Start/Ende (```)
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBlockContent = '';
                continue;
            } else {
                inCodeBlock = false;
                html += `<pre><code>${escapeHtml(codeBlockContent)}</code></pre>`;
                codeBlockContent = '';
                continue;
            }
        }
        
        // Innerhalb Code-Block
        if (inCodeBlock) {
            codeBlockContent += line + '\n';
            continue;
        }
        
        // Leere Zeile - Schließe Listen
        if (line.trim() === '') {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            continue;
        }
        
        // Überschriften (# ## ### ####)
        if (line.match(/^(#{1,6})\s+(.+)$/)) {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            const level = match[1].length;
            const text = parseInline(match[2]);
            
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            
            html += `<h${level}>${text}</h${level}>`;
            continue;
        }
        
        // Horizontale Linie (--- oder ***)
        if (line.match(/^(---+|\*\*\*+)$/)) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            html += '<hr>';
            continue;
        }
        
        // Ungeordnete Liste (- oder *)
        if (line.match(/^[-*]\s+(.+)$/)) {
            const match = line.match(/^[-*]\s+(.+)$/);
            const text = parseInline(match[1]);
            
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            
            html += `<li>${text}</li>`;
            continue;
        }
        
        // Geordnete Liste (1. 2. 3.)
        if (line.match(/^\d+\.\s+(.+)$/)) {
            const match = line.match(/^\d+\.\s+(.+)$/);
            const text = parseInline(match[1]);
            
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            
            if (!inOrderedList) {
                html += '<ol>';
                inOrderedList = true;
            }
            
            html += `<li>${text}</li>`;
            continue;
        }
        
        // Blockquote (>)
        if (line.match(/^>\s+(.+)$/)) {
            const match = line.match(/^>\s+(.+)$/);
            const text = parseInline(match[1]);
            
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            
            html += `<blockquote>${text}</blockquote>`;
            continue;
        }
        
        // Normaler Paragraph
        if (line.trim() !== '') {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (inOrderedList) {
                html += '</ol>';
                inOrderedList = false;
            }
            
            const text = parseInline(line);
            html += `<p>${text}</p>`;
        }
    }
    
    // Schließe offene Listen am Ende
    if (inList) html += '</ul>';
    if (inOrderedList) html += '</ol>';
    
    return html;
}

// ==========================================
// INLINE MARKDOWN PARSER
// ==========================================

function parseInline(text) {
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Inline Code `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold **text** oder __text__
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic *text* oder _text_ (aber nicht ** oder __)
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    
    // Strikethrough ~~text~~
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    return text;
}

// HINWEIS: Die frühere zweite escapeHtml-Definition wurde entfernt.
// Sie überschrieb die zentrale Version und escapte keine Anführungszeichen
// (gefährlich in HTML-Attributen). Ebenso entfernt: der MutationObserver
// für den Changelog - switchView() und der Dev-Tab-Handler laden ihn bereits,
// der Observer führte zu mehrfachen parallelen Fetches.


