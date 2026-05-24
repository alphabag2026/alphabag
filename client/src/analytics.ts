const ANALYTICS_SCRIPT_ID = "umami-analytics-script";

export function injectAnalyticsScript() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId || typeof document === "undefined") {
    return;
  }

  if (document.getElementById(ANALYTICS_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID;
  script.defer = true;
  script.src = `${endpoint.replace(/\/+$/, "")}/umami`;
  script.dataset.websiteId = websiteId;

  document.body.appendChild(script);
}
