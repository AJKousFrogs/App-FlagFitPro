/// <reference types="vitest" />
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";
import { resolve } from "path";

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.spec.ts"],
    },
    // Increase timeout for Angular compilation
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@core": resolve(__dirname, "./src/app/core"),
      "@shared": resolve(__dirname, "./src/app/shared"),
      "@features": resolve(__dirname, "./src/app/features"),
      "@environments": resolve(__dirname, "./src/environments"),
      "@assets": resolve(__dirname, "./src/assets"),
    },
  },
});
