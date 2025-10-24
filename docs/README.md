# IUB Rec Pro+ Chrome Extension v3.0.0 🚀

**The most powerful, privacy-focused screenshot and documentation tool for Chrome in 2025**

Ultra-modern AI-powered screen capture and documentation platform with full-page capture, screen recording, privacy mode, and professional editing tools.

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/iub-rec-pro)
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
- **Visual Indicator** - Prominent REC indicator

### ⌨️ **Keyboard Shortcuts**

- **Alt+Shift+P** - Capture full page screenshot
- **Alt+Shift+V** - Capture visible area
- **Alt+Shift+R** - Start/Stop recording
- **Ctrl+Shift+E** - Open editor (Cmd+Shift+E on Mac)

### 🎨 **Professional Editing**

- **TUI Image Editor** - 12+ professional tools:
  - Crop, Flip, Rotate
  - Draw, Shape, Text, Icon
  - Filters (Grayscale, Sepia, Blur, Sharpen, etc.)
  - Mask filters (Blur/Pixelate sensitive areas)
- **Zoom Controls** - 50%-300% zoom with smooth animations
- **Full Screen Mode** - View screenshots in fullscreen
- **Quick Actions** - Save, Copy, Share, Delete

### 📄 **Beautiful PDF Export**

- **Modern Cover Page** - Gradient design with metadata
- **Table of Contents** - Auto-generated with page numbers
- **Styled Step Pages** - Professional typography and layout
- **Footer Page** - Completion summary
- **High Quality** - 98% JPEG quality, 2x scale

### 🤖 **AI Features**

- **AI Chat Export** - Export conversations from:
  - ChatGPT
  - Google Gemini
  - DeepSeek
  - Microsoft Copilot
- **Auto-generate Descriptions** - AI-powered step descriptions (coming soon)
- **Smart Suggestions** - Context-aware recommendations (coming soon)

### 🌐 **Multi-language Support**

- **English** - Full translation
- **Norwegian (Norsk)** - Complete translation
- **Extensible** - Easy to add more languages

### 🎯 **Additional Features**

- **Rich Text Notes** - Formatted notes with Quill.js editor
- **Drag & Drop** - Intuitive reordering with SortableJS
- **Ultra-Modern Design** - Gradient backgrounds, glassmorphism
- **Smooth Animations** - Premium feel with Animate.css & AOS
- **Session Management** - Save and manage multiple sessions
- **Markdown Export** - Export as Markdown files

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the project directory

## Setup

### Configure OpenAI API Key

To use AI-powered features, you need an OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click the extension icon in Chrome
3. Click "Options"
4. Enter your API key in the "OpenAI API Key" field
5. Click "Apply Changes"

**Note:** Your API key is stored locally and never shared.

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

## 📖 Detailed Usage

### Full-Page Screenshot Capture

**Capture entire scrollable pages:**

```
1. Press Alt+Shift+P (or click Full Page button)
2. See progress indicator
3. Wait for stitching
4. Get complete page screenshot!
```

**Features:**

- Smart scroll detection
- Auto-stitching algorithm
- Progress feedback
- Original scroll position restored

### Privacy Mode

**Protect sensitive information:**

```
1. Enable Privacy Mode in settings
2. Take screenshots normally
3. Sensitive data auto-blurred:
   - Credit cards
   - Emails
   - Phone numbers
   - Passwords
```

**How it works:**

- Pattern matching (regex)
- Element detection (input fields)
- Blur + Pixelation
- No data sent externally

### Screen Recording

**Record HD videos:**

```
1. Click "Record Screen"
2. Choose source:
   - Current Tab
   - Window
   - Entire Screen
3. Enable audio (optional)
4. Click Stop when done
5. Video saves as .webm
```

**Settings:**

- Resolution: Up to 1920x1080
- Frame rate: 30fps
- Bitrate: 2.5 Mbps
- Format: WebM

### Image Editing

**Professional editing tools:**

```
1. Double-click any screenshot
2. TUI Image Editor opens
3. Use tools:
   - Crop, Flip, Rotate
   - Draw, Shape, Text
   - Filters, Masks
4. Save when done
```

**Quick Actions:**

- 💾 Save - Download image
- 📋 Copy - Copy to clipboard
- 🔗 Share - Native share dialog
- 🗑️ Delete - Remove screenshot

### PDF Export

**Create beautiful PDFs:**

```
1. Complete your recording
2. Click "Export PDF"
3. Wait for generation
4. PDF downloads with:
   - Cover page
   - Table of contents
   - Step-by-step pages
   - Footer page
```

**PDF Features:**

- Gradient cover design
- Auto-generated TOC
- Professional typography
- Page numbers
- High-quality images

### AI Chat Export

**Export AI conversations:**

```
1. Visit ChatGPT/Gemini/DeepSeek/Copilot
2. See export button appear
3. Click to export as:
   - Markdown
   - PDF (coming soon)
4. File downloads automatically
```

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut         | Action           | Description                    |
| ---------------- | ---------------- | ------------------------------ |
| **Alt+Shift+P**  | Full Page        | Capture entire scrollable page |
| **Alt+Shift+V**  | Visible Area     | Capture current viewport       |
| **Alt+Shift+R**  | Toggle Recording | Start/Stop click recording     |
| **Ctrl+Shift+E** | Open Editor      | Direct editor access           |
| **ESC**          | Close            | Close modals/fullscreen        |
| **Ctrl+Z**       | Undo             | Undo in image editor           |

_Mac users: Use Cmd instead of Ctrl_

---

## 🎨 UI Features

### Modern Design

- **Gradient Backgrounds** - Purple to violet gradients
- **Glassmorphism** - Frosted glass effects
- **Smooth Animations** - Animate.css & AOS
- **Hover Effects** - Interactive feedback
- **Responsive** - Works on all screen sizes

### Drag & Drop

- **Reorder Screenshots** - Drag to rearrange
- **Reorder Steps** - Drag step items
- **Visual Feedback** - Smooth transitions
- **Touch Support** - Works on tablets

---

## 🔧 Configuration

### Privacy Settings

```javascript
// Enable/disable privacy mode
chrome.storage.local.set({ privacyMode: true });

// Configure blur intensity
chrome.storage.local.set({ blurIntensity: 10 });
```

### Recording Settings

```javascript
// Set video quality
chrome.storage.local.set({
  videoQuality: {
    width: 1920,
    height: 1080,
    frameRate: 30
  }
});
```

### Language Settings

```javascript
// Change language
chrome.storage.local.set({ language: "no" }); // Norwegian
chrome.storage.local.set({ language: "en" }); // English
```

### During Recording

- **Pause** - Temporarily pause capturing
- **Stop** - End the session and open the editor

### In the Editor

- **Drag & Drop Reordering** - Simply drag images and steps to reorder (NEW!)
- **Edit Steps** - Click the edit (✎) button to modify step text
- **Add Comments** - Click the comment (💬) button to add notes
- **Add Rich Notes** - Click "📝 Add Rich Note" for formatted documentation
- **Export** - Choose PDF or Markdown export
- **Modern UI** - Enjoy gradient backgrounds and smooth animations

### Modern Design Features

The ultra-modern editor includes:

- **Glassmorphism** - Frosted glass effects with backdrop blur
- **Gradient Backgrounds** - Beautiful purple/violet gradients
- **Smooth Animations** - Hover effects, lift animations, transitions
- **Drag & Drop** - Powered by SortableJS for intuitive reordering
- **DaisyUI Components** - Professional UI component library
- **Tailwind Utilities** - Rapid styling with utility classes
- **Touch Support** - Works on tablets and touch devices

### Rich Text Editor Features

The integrated Quill.js editor provides:

- **Text Formatting** - Bold, italic, underline, strikethrough
- **Headers** - H1, H2, H3 for structure
- **Lists** - Ordered and bullet lists
- **Colors** - Text and background colors
- **Code Blocks** - For technical documentation
- **Links** - Add reference URLs
- **Clean Interface** - Modern, intuitive toolbar

## File Structure

```
windsurf-project-2/
├── manifest.json              # Extension configuration
├── sidepanel.html            # Main sidepanel UI
├── sidepanel-styles.css      # Sidepanel styling
├── assets/
│   ├── icon.png             # Extension icon
│   └── style.css            # Global styles
├── src/
│   ├── background/
│   │   └── background.js    # Service worker (handles API calls)
│   ├── content/
│   │   ├── page-click-listener.js    # Click event handler
│   │   └── content-script-blur.js    # Privacy blur feature
│   ├── editor/
│   │   ├── editor.html      # Editor page
│   │   └── editor.js        # Editor logic
│   ├── options/
│   │   ├── options.html     # Settings page
│   │   ├── options.js       # Settings logic
│   │   └── options.css      # Settings styling
│   ├── popup/
│   │   ├── popup.html       # Extension popup
│   │   ├── popup.js         # Popup logic
│   │   └── popup.css        # Popup styling
│   └── sidepanel/
│       ├── sidepanel.html   # Sidepanel HTML
│       ├── main.js          # Main orchestration
│       ├── recorder.js      # Recording logic
│       ├── chat-ui.js       # Chat UI components
│       ├── start-recording.js  # Recording controls
│       └── open-workspace.js   # Workspace handler
└── README.md
```

## Permissions

The extension requires the following permissions:

- **storage** - Save captures and settings
- **activeTab** - Capture screenshots of active tab
- **sidePanel** - Display side panel interface
- **downloads** - Export files
- **scripting** - Inject content scripts
- **tabs** - Manage tab interactions
- **desktopCapture** - Screen capture functionality

## Privacy & Security

- API keys are stored locally in Chrome's storage
- Screenshots are stored locally on your device
- No data is sent to external servers except OpenAI API calls
- You can delete all data at any time from the editor

## Troubleshooting

### Screenshots not capturing

- Ensure you've granted all required permissions
- Chrome:// pages cannot be captured (browser limitation)
- Try refreshing the page and restarting the recording

### AI features not working

- Verify your API key is correctly set in Options
- Check your OpenAI account has available credits
- Check browser console for error messages

### Extension not loading

- Ensure all files are present in the directory
- Check for JavaScript errors in `chrome://extensions/`
- Try reloading the extension

## Development

### Prerequisites

- Chrome browser (version 88+)
- Node.js (for development tools, optional)

### Making Changes

1. Edit source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Support

For issues or questions:

- Check the troubleshooting section above
- Review browser console for errors
- Contact: support@iub-rec.com

## License

Copyright © 2024 IUB Rec Pro+. All rights reserved.

## Version History

### v2.0.1 (Current) - Modern Edition + UX Update

- **One-click access** - Sidepanel opens directly when clicking icon
- **Ultra-modern design** with gradient backgrounds
- **Glassmorphism** effects throughout
- **Drag & Drop** reordering with SortableJS
- **DaisyUI + Tailwind CSS** integration
- **Smooth animations** with Animate.css and AOS
- **Rich text notes** with Quill.js
- **Markdown export** functionality
- **Touch support** for tablets

### v2.0 - Modern Edition

- Initial modern redesign
- Gradient backgrounds and glassmorphism
- Animation libraries integrated
- Rich text editor added

### v1.0

- Initial release
- Click-based recording
- AI-powered step generation
- PDF export
- Session management
- Basic editor
