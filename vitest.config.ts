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
        "src/lib/sentence-slicer.ts",
        "src/lib/offsets.ts",
        "src/lib/cefr.ts",
        "src/lib/rate-limit.ts",
        "src/lib/audit-log.ts",
        "src/lib/search.ts",
        "src/lib/queries/user-stats.ts",
        "src/lib/actions/reading-history.ts",
        "src/lib/actions/vocabulary.ts",
        "src/lib/actions/favorites.ts",
        "src/validations/**/*.ts",
        "src/components/ui/button.tsx",
        "src/components/ui/badge.tsx",
        "src/components/ui/cefr-badge.tsx",
        "src/components/public/empty-state.tsx",
        "src/components/public/article-card-skeleton.tsx",
        "src/components/public/pagination.tsx",
        "src/components/search/search-highlight.tsx",
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
