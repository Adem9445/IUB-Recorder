const region = document.getElementById("feedback-region");

function createBanner(kind, message, dismissible = true, duration = 6000) {
  if (!region) {
    console.warn("feedback region missing", { kind, message });
    return;
  }

  const banner = document.createElement("div");
  banner.className = "feedback-banner";
  banner.dataset.kind = kind;
  banner.role = "status";
  banner.tabIndex = -1;
  banner.innerHTML = `<span>${message}</span>`;

  if (dismissible) {
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Dismiss";
    closeBtn.addEventListener("click", () => banner.remove());
    banner.appendChild(closeBtn);
  }

  region.appendChild(banner);
  banner.focus({ preventScroll: true });

  if (duration > 0) {
    setTimeout(() => {
      if (banner.isConnected) banner.remove();
    }, duration);
  }
}

export function showInfo(message, options = {}) {
  createBanner("info", message, options.dismissible ?? true, options.duration ?? 6000);
}

export function showWarning(message, options = {}) {
  createBanner("warning", message, options.dismissible ?? true, options.duration ?? 8000);
}

export function showError(message, options = {}) {
  createBanner("error", message, options.dismissible ?? true, options.duration ?? 10000);
}

export function showBanner(kind, message, options = {}) {
  switch (kind) {
    case "warning":
      return showWarning(message, options);
    case "error":
      return showError(message, options);
    default:
      return showInfo(message, options);
  }
}
