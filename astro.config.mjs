import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://thomas-portfolio-ruby.vercel.app",
  vite: { plugins: [tailwindcss()] },
});
