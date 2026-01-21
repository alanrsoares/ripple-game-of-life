import { defineConfig } from "vite";
import { ripple } from "@ripple-ts/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/ripple-game-of-life/",
  plugins: [ripple(), tailwindcss()],
});
