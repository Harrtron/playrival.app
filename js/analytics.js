(function () {
  var STORAGE_KEY = "rival_analytics_consent";

  function updateConsent(granted) {
    if (typeof gtag !== "function") return;
    gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
    });
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function readChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function removeBanner() {
    var banner = document.getElementById("cookie-consent");
    if (banner) banner.remove();
  }

  function showBanner() {
    if (document.getElementById("cookie-consent")) return;

    var banner = document.createElement("aside");
    banner.id = "cookie-consent";
    banner.className = "cookie-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.setAttribute("aria-live", "polite");

    banner.innerHTML =
      '<p class="cookie-consent__text">We use cookies to understand how visitors use <strong>playrival.app</strong>. ' +
      '<a href="/privacy.html#cookies">Learn more</a>.</p>' +
      '<div class="cookie-consent__actions">' +
      '<button type="button" class="cookie-consent__btn cookie-consent__btn--secondary" data-consent="denied">Reject</button>' +
      '<button type="button" class="cookie-consent__btn cookie-consent__btn--primary" data-consent="granted">Accept</button>' +
      "</div>";

    banner.addEventListener("click", function (event) {
      var button = event.target.closest("[data-consent]");
      if (!button) return;
      var granted = button.getAttribute("data-consent") === "granted";
      saveChoice(granted ? "granted" : "denied");
      updateConsent(granted);
      removeBanner();
    });

    document.body.appendChild(banner);
  }

  var saved = readChoice();
  if (saved === "granted") {
    updateConsent(true);
  } else if (saved === "denied") {
    updateConsent(false);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showBanner);
  } else {
    showBanner();
  }
})();
