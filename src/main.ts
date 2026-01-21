import { mount } from "ripple";
import { App } from "./App.ripple";

const target = document.getElementById("app");

if (!target) {
  throw new Error("Missing #app element");
}

mount(App, { target });
