function applyBlur() {
  document.body.style.filter = "blur(8px)";
  document.body.style.webkitFilter = "blur(8px)";

  const sensitiveSelectors = [
    'input[type="password"]',
    'input[type="email"]',
    ".credit-card",
    ".sensitive",
    '[aria-label*="password"]',
    '[aria-label*="email"]'
  ];

  sensitiveSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.style.filter = "blur(5px)";
      el.style.webkitFilter = "blur(5px)";
    });
  });
}

applyBlur();
