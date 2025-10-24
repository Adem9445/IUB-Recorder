// Open Settings/Options page when gear button is clicked

const openSettingsBtn = document.getElementById('open-settings-btn');

if (openSettingsBtn) {
  openSettingsBtn.addEventListener('click', () => {
    // Open the options page in a new tab
    chrome.runtime.openOptionsPage();
  });
}
