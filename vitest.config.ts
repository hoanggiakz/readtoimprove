process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = "true";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "scripts", "dist", "build"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/lib/url-utils.ts",
        "src/components/ui/cefr-badge.tsx",
      ],
      exclude: [
        "node_modules/**",
        ".next/**",
        "scripts/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
