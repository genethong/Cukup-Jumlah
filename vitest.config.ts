import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/game/**/*.test.ts", "src/game/**/*.test.tsx", "src/lib/**/*.test.ts"],
  },
});
