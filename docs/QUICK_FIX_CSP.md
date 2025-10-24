# 🔧 Quick Fix for CSP Errors

## Problem

Chrome extensions med Manifest V3 blokkerer eksterne scripts (CDN) av sikkerhetsgrunner.

## Løsning: Bruk Lokale Biblioteker

### Steg 1: Last ned biblioteker

Opprett `src/libs/` mappe og last ned:

```bash
mkdir -p src/libs

# Download libraries
curl -o src/libs/sortable.min.js https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js
curl -o src/libs/quill.min.js https://cdn.jsdelivr.net/npm/[email protected]/dist/quill.min.js
curl -o src/libs/quill.snow.css https://cdn.jsdelivr.net/npm/[email protected]/dist/quill.snow.css
curl -o src/libs/html2pdf.bundle.min.js https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
```

### Steg 2: Oppdater editor.html

Erstatt CDN links med lokale:

```html
<!-- FØR (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>

<!-- ETTER (Lokal) -->
<script src="../libs/sortable.min.js"></script>
```

### Steg 3: Alternativ - Bruk Enklere Løsning

Siden TUI Image Editor og andre biblioteker er store, kan vi:

1. **Fjerne TUI Image Editor** - Bruk enklere canvas-basert editor
2. **Fjerne SortableJS** - Bruk native drag & drop API
3. **Fjerne html2pdf** - Bruk jsPDF direkte (mindre)

## Rask Fix (Anbefalt)

### Oppdater editor.html til minimal versjon:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IUB Rec Editor</title>
    <link rel="stylesheet" href="editor-minimal.css" />
  </head>
  <body>
    <!-- Minimal HTML uten eksterne avhengigheter -->
    <div id="app"></div>

    <!-- Kun lokale scripts -->
    <script src="editor.js"></script>
  </body>
</html>
```

### Implementer Native Features:

1. **Native Drag & Drop**

```javascript
element.draggable = true;
element.addEventListener("dragstart", handleDragStart);
element.addEventListener("drop", handleDrop);
```

2. **Canvas Image Editor**

```javascript
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
// Draw, crop, resize natively
```

3. **Native PDF (jsPDF)**

```javascript
// Mindre bibliotek, kan inkluderes lokalt
import jsPDF from "./libs/jspdf.min.js";
```

## Implementering

Skal jeg:

1. ✅ Laste ned alle biblioteker lokalt (tar tid)
2. ✅ Lage minimal versjon uten eksterne avhengigheter (raskere)
3. ✅ Hybrid: Beholde viktige features, fjerne tunge biblioteker

Anbefaling: **Alternativ 2 eller 3** for raskest løsning.
