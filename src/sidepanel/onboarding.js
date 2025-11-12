const card = document.getElementById("onboarding-card");
const dismissBtn = document.getElementById("onboarding-dismiss");

function toggleCard(visible) {
  if (!card) return;
  card.setAttribute("aria-hidden", visible ? "false" : "true");
}

if (card) {
  chrome.storage.local.get(["hasSeenSidepanelIntro"], (res) => {
    const hasSeen = Boolean(res.hasSeenSidepanelIntro);
    toggleCard(!hasSeen);
  });
}

if (dismissBtn) {
  dismissBtn.addEventListener("click", () => {
    chrome.storage.local.set({ hasSeenSidepanelIntro: true });
    toggleCard(false);
  });
}

export function remindOnboarding() {
  toggleCard(true);
}
