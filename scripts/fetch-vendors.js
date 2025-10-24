#!/usr/bin/env node
/**
 * Fetch vendor browser bundles locally for the extension (MV3 CSP-safe).
 * Currently downloads html2pdf bundle to src/vendor/html2pdf.bundle.min.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const targets = [
  // JavaScript libraries
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'html2pdf.bundle.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'sortable.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'quill.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tui-code-snippet@1.5.2/dist/tui-code-snippet.min.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'tui-code-snippet.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tui-color-picker@2.2.7/dist/tui-color-picker.min.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'tui-color-picker.min.js')
  },
  {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'fabric.min.js')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tui-image-editor@3.15.3/dist/tui-image-editor.min.js',
    out: path.join(__dirname, '..', 'src', 'vendor', 'tui-image-editor.min.js')
  },
  // CSS files
  {
    url: 'https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css',
    out: path.join(__dirname, '..', 'src', 'vendor', 'daisyui.min.css')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css',
    out: path.join(__dirname, '..', 'src', 'vendor', 'quill.snow.css')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tui-image-editor@3.15.3/dist/tui-image-editor.min.css',
    out: path.join(__dirname, '..', 'src', 'vendor', 'tui-image-editor.min.css')
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/tui-color-picker@2.2.7/dist/tui-color-picker.min.css',
    out: path.join(__dirname, '..', 'src', 'vendor', 'tui-color-picker.min.css')
  }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fetchToFile(url, outPath) {
  return new Promise((resolve, reject) => {
    const outDir = path.dirname(outPath);
    ensureDir(outDir);

    const file = fs.createWriteStream(outPath);

    const doRequest = (u) => {
      https
        .get(u, (res) => {
          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return doRequest(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`Failed to download ${u}. Status: ${res.statusCode}`));
          }
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve()));
        })
        .on('error', (err) => {
          fs.unlink(outPath, () => reject(err));
        });
    };

    doRequest(url);
  });
}

(async () => {
  try {
    for (const t of targets) {
      console.log(`Downloading ${t.url} -> ${t.out}`);
      await fetchToFile(t.url, t.out);
      console.log(`Saved: ${t.out}`);
    }
    console.log('All vendors fetched successfully.');
  } catch (err) {
    console.error('Failed to fetch vendors:', err.message || err);
    process.exit(1);
  }
})();
