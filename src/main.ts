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
  // Use Vite's BASE_URL to get the base path (works in both dev and production)
  const baseUrl = import.meta.env.BASE_URL;
  favicon.href = isDarkMode
    ? `${baseUrl}logo-inverted.svg`
    : `${baseUrl}logo.svg`;
}

// Set initial favicon
updateFavicon();

// Listen for changes in color scheme preference
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateFavicon);

mount(App, { target });
