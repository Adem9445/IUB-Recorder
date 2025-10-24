# Installation & Testing Guide

## Quick Start Installation

### 1. Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `windsurf-project-2` folder
6. The extension should now appear in your extensions list

### 2. Verify Installation

✅ **Check these items:**

- Extension icon appears in Chrome toolbar
- Extension shows "IUB Rec Pro+" name
- No errors in the extension card
- Status shows "Enabled"

### 3. Configure API Key (Required for AI Features)

1. Click the extension icon in Chrome toolbar
2. Click **Options**
3. Scroll to "OpenAI API Key" field
4. Enter your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
5. Click **Apply Changes**
6. You should see "Saved" confirmation

## Testing the Extension

### Test 1: Open Side Panel

**Steps:**

1. Click the extension icon
2. Click "Open Workspace"
3. Side panel should open on the right side

**Expected Result:**

- Side panel displays with "Open Workspace" and "Start Recording" buttons
- No console errors

### Test 2: Start Recording Session

**Steps:**

1. Open side panel
2. Click "Start Recording"
3. Navigate to any website (e.g., google.com)
4. Click on various elements on the page

**Expected Result:**

- "Stop Recording" button appears
- Each click creates a screenshot in the chat container
- Screenshots appear with step numbers
- Element text appears as titles (e.g., "Naviger hit Search")

### Test 3: Stop Recording & Open Editor

**Steps:**

1. After capturing 3-5 screenshots
2. Click "Stop Recording"
3. Editor page should open automatically

**Expected Result:**

- New tab opens with editor
- All captured screenshots appear in left panel
- Session appears in sidebar as "Chat 1"
- Steps editor shows on right side

### Test 4: Edit and Reorder

**Steps:**

1. In editor, click ↑ or ↓ on an image
2. Click ✎ (edit) button on a step
3. Modify the text
4. Click 💾 (save)

**Expected Result:**

- Images reorder correctly
- Step text becomes editable
- Changes persist when saved
- Step numbers update automatically

### Test 5: Export PDF

**Steps:**

1. In editor, click "Export PDF"
2. Print dialog should appear
3. Select "Save as PDF"
4. Save the file

**Expected Result:**

- Print preview shows all screenshots and steps
- PDF exports successfully
- Content is properly formatted

## Common Issues & Solutions

### Issue: Extension Won't Load

**Solutions:**

- Check for syntax errors in console
- Ensure all files are present
- Try removing and re-adding the extension
- Check Chrome version (requires 88+)

### Issue: Screenshots Not Capturing

**Solutions:**

- Ensure you're not on a `chrome://` page (not allowed)
- Check permissions are granted
- Refresh the target page
- Restart recording session

### Issue: AI Features Not Working

**Solutions:**

- Verify API key is set in Options
- Check OpenAI account has credits
- Open DevTools Console (F12) and check for errors
- Ensure internet connection is active

### Issue: Side Panel Won't Open

**Solutions:**

- Check Chrome version supports Side Panel API (v114+)
- Try closing and reopening Chrome
- Check for conflicts with other extensions
- Look for errors in `chrome://extensions/`

### Issue: Module Import Errors

**Solutions:**

- Ensure all `.js` files are in correct locations
- Check file paths in HTML files
- Verify `manifest.json` points to correct files
- Clear Chrome cache and reload extension

## File Structure Verification

Ensure these files exist:

```
windsurf-project-2/
├── manifest.json
├── sidepanel.html (root - legacy)
├── sidepanel-styles.css
├── README.md
├── INSTALLATION.md
├── assets/
│   ├── icon.png
│   └── style.css
└── src/
    ├── background/
    │   └── background.js
    ├── content/
    │   ├── page-click-listener.js
    │   └── content-script-blur.js
    ├── editor/
    │   ├── editor.html
    │   └── editor.js
    ├── options/
    │   ├── options.html
    │   ├── options.js
    │   └── options.css
    ├── popup/
    │   ├── popup.html
    │   ├── popup.js
    │   └── popup.css
    └── sidepanel/
        ├── sidepanel.html
        ├── main.js
        ├── recorder.js
        ├── chat-ui.js
        ├── start-recording.js
        └── open-workspace.js
```

## Debugging Tips

### View Console Logs

**Background Script:**

1. Go to `chrome://extensions/`
2. Find "IUB Rec Pro+"
3. Click "service worker" link
4. DevTools opens with background logs

**Side Panel:**

1. Open side panel
2. Right-click in side panel
3. Select "Inspect"
4. Console shows side panel logs

**Content Script:**

1. Open target webpage
2. Press F12 for DevTools
3. Console shows content script logs

### Check Storage

```javascript
// In DevTools Console:
chrome.storage.local.get(null, console.log); // View all local storage
chrome.storage.sync.get(null, console.log); // View all sync storage
```

### Clear All Data

```javascript
// In DevTools Console:
chrome.storage.local.clear();
chrome.storage.sync.clear();
```

## Performance Tips

1. **Limit Captures:** Keep sessions under 10 screenshots to avoid storage quota
2. **Clear Old Sessions:** Delete unused sessions from editor
3. **Optimize Images:** Use standard quality (not high quality) for faster performance
4. **Close Unused Tabs:** Extension works best with fewer tabs open

## Security Notes

- API key is stored locally, never synced
- Screenshots are stored locally on your device
- No data sent to external servers except OpenAI API
- You can delete all data anytime from editor

## Next Steps

After successful installation:

1. ✅ Test basic recording
2. ✅ Configure API key
3. ✅ Test AI features
4. ✅ Try exporting PDF
5. ✅ Explore editor features

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review browser console for errors
3. Check `README.md` for feature documentation
4. Contact: support@iub-rec.com

## Version Info

- **Current Version:** 1.0
- **Minimum Chrome Version:** 88
- **Recommended Chrome Version:** 114+
- **Manifest Version:** 3
