const PRIMEICONS_STYLESHEET_ID = "app-primeicons-stylesheet";
const PRIMEICONS_STYLESHEET_HREF =
  "/assets/styles/vendor/primeicons/primeicons.css";

export function ensurePrimeIconsStylesheet(): HTMLLinkElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const existingLink = document.getElementById(PRIMEICONS_STYLESHEET_ID);
  if (existingLink instanceof HTMLLinkElement) {
    return existingLink;
  }

  const link = document.createElement("link");
  link.id = PRIMEICONS_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = PRIMEICONS_STYLESHEET_HREF;
  document.head.appendChild(link);

  return link;
}
