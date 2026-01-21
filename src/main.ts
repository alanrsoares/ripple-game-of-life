import { mount } from "ripple";
import { App } from "./App.ripple";

const target = document.getElementById("app");

if (!target) {
  throw new Error("Missing #app element");
}

// Update favicon based on dark mode preference
function updateFavicon() {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!favicon) return;

  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  // Extract base path from current href to preserve base path in production
  const basePath = favicon.href.replace(/\/logo.*\.svg$/, '');
  favicon.href = isDarkMode
    ? `${basePath}/logo-inverted.svg`
    : `${basePath}/logo.svg`;
}

// Set initial favicon
updateFavicon();

// Listen for changes in color scheme preference
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateFavicon);

mount(App, { target });
