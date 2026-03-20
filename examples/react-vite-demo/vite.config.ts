import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { piSourceBinderReact } from "../../packages/source-binder-react/src/index";

export default defineConfig({
  plugins: [piSourceBinderReact(), react()]
});
