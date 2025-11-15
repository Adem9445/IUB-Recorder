# IUB Recorder - Chrome Extension 🚀

**Privacy-focused screenshot and documentation tool for Chrome**

Ultra-modern AI-powered screen capture and documentation platform with full-page capture, screen recording, privacy mode, and professional editing tools.

[![Version](https://img.shields.io/badge/version-3.0.1-blue.svg)](https://github.com/yourusername/iub-recorder)
[![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

---

## ✨ Features

### 📸 **Advanced Screenshot Capture**

- **Full-Page Capture** - Smart stitching algorithm for entire scrollable pages
- **Click-based Recording** - Automatic screenshot on element click
- **Visible Area Capture** - Quick screenshots of current viewport
- **High Quality** - Up to 2x scale for crisp images
- **Progress Indicators** - Visual feedback during capture

### 🔒 **Privacy & Security**

- **Auto-blur Sensitive Data** - Automatically detects and blurs:
  - Credit card numbers
  - Email addresses
  - Phone numbers
  - SSN/Passport numbers
  - Password fields
- **GDPR Compliant** - No tracking, no external servers
- **Local Storage Only** - Your data never leaves your device
- **Privacy Mode Toggle** - Enable/disable in settings

### 🎬 **Screen Recording**

- **HD Video Recording** - Up to 1920x1080 @ 30fps
- **Audio Support** - Optional audio recording
- **Multiple Sources** - Tab, window, or full screen
- **Live Timer** - Real-time recording duration
- **WebM Export** - Efficient video format

### ⌨️ **Keyboard Shortcuts**

- **Alt+Shift+P** - Capture full page screenshot
- **Alt+Shift+V** - Capture visible area
- **Alt+Shift+R** - Start/Stop recording
- **Ctrl+Shift+E** - Open editor (Cmd+Shift+E on Mac)

### 🎨 **Professional Editing**

- **TUI Image Editor** - 12+ professional tools
- **Zoom Controls** - 50%-300% zoom with smooth animations
- **Full Screen Mode** - View screenshots in fullscreen
- **Quick Actions** - Save, Copy, Share, Delete

### 📄 **Beautiful PDF Export**

- **Modern Cover Page** - Gradient design with metadata
- **Table of Contents** - Auto-generated with page numbers
- **Styled Step Pages** - Professional typography and layout
- **High Quality** - 98% JPEG quality, 2x scale

### 🤖 **AI Features**

- **AI Chat Export** - Export conversations from ChatGPT, Google Gemini, DeepSeek, Microsoft Copilot, Perplexity (Labs too), Claude, Grok, Meta AI, and Pi
- **Auto-generate Descriptions** - AI-powered step descriptions
- **Smart Suggestions** - Context-aware recommendations

### 🌐 **Multi-language Support**

- **English** - Full translation
- **Norwegian (Norsk)** - Complete translation
- **Extensible** - Easy to add more languages

---

## 📦 Installation

### From Source

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/iub-recorder.git
   cd iub-recorder
   ```

2. Install dependencies (optional, for development):

   ```bash
   npm install
   ```

3. Load extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the project directory

---

## 🚀 Quick Start

### Method 1: Click-based Recording

1. **Click extension icon** - Sidepanel opens automatically
2. **Click "Start Recording"**
3. **Navigate to your page**
4. **Click elements** - Each click creates a screenshot
5. **Click "Stop Recording"** - Editor opens with your guide

### Method 2: Keyboard Shortcuts (Fast!)

1. **Alt+Shift+P** - Instant full-page screenshot
2. **Alt+Shift+V** - Quick visible area capture
3. **Alt+Shift+R** - Toggle recording on/off
4. **Ctrl+Shift+E** - Open editor directly

### Method 3: Screen Recording

1. **Open sidepanel**
2. **Click "Record Screen"**
3. **Select what to share** (tab/window/screen)
4. **Click "Stop"** when done
5. **Video downloads automatically**

---

## ⚙️ Configuration

### AI API Key (Optional)

To use AI-powered features, connect one of the supported providers (OpenAI, Google Gemini, or DeepSeek):

1. Create an API key with your preferred provider:
   - [OpenAI Platform](https://platform.openai.com/api-keys)
   - [Google AI Studio](https://aistudio.google.com/app/apikey)
   - [DeepSeek Platform](https://platform.deepseek.com/api-keys)
2. Click the extension icon in Chrome
3. Click "Options"
4. Choose the provider from the "AI provider" dropdown and paste the matching API key
5. Click "Apply Changes"

**Note:** Your API key is stored locally and never shared.

---

## 🛠️ Development

### Prerequisites

- Chrome browser (version 88+)
- Node.js 14+ (for development tools)

### Setup

```bash
# Install dependencies
npm install

# Format code
npm run prettier

# Fetch vendor libraries
npm run fetch:vendors
```

### Making Changes

1. Edit source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

---

## 📁 File Structure

```
iub-recorder/
├── manifest.json              # Extension configuration
├── package.json              # Node.js dependencies
├── assets/                   # Icons and static assets
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Content scripts
│   ├── editor/              # Screenshot editor
│   ├── options/             # Settings page
│   ├── sidepanel/           # Main UI panel
│   └── vendor/              # Third-party libraries
├── _locales/                # Internationalization
│   ├── en/                  # English translations
│   └── no/                  # Norwegian translations
└── docs/                    # Documentation
```

---

## 🔐 Permissions

The extension requires the following permissions:

- **storage** - Save captures and settings
- **activeTab** - Capture screenshots of active tab
- **sidePanel** - Display side panel interface
- **downloads** - Export files
- **scripting** - Inject content scripts
- **tabs** - Manage tab interactions

Screen recording now relies on Chrome's `getDisplayMedia` prompt, so no additional desktop capture permission is required.

---

## 🐛 Troubleshooting

### Screenshots not capturing

- Ensure you've granted all required permissions
- Chrome:// pages cannot be captured (browser limitation)
- Try refreshing the page and restarting the recording

### AI features not working

- Verify your API key is correctly set in Options
- Check your AI provider account has available credits or quota
- Check browser console for error messages

### Extension not loading

- Ensure all files are present in the directory
- Check for JavaScript errors in `chrome://extensions/`
- Try reloading the extension

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues or questions:

- Open an issue on GitHub
- Check the [troubleshooting section](#-troubleshooting)
- Review browser console for errors

---

## 📝 Version History

### v3.0.1 - Standalone Edition (CSP Fixed)

- Content Security Policy fixes
- Improved stability
- Bug fixes

### v3.0.0 - Modern Edition + UX Update

- One-click access with sidepanel
- Ultra-modern design with gradients
- Glassmorphism effects
- Drag & Drop reordering
- Rich text notes with Quill.js
- Markdown export
- Touch support

---

**Made with ❤️ for better documentation**
