import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.github.freeasvab",
  appName: "FreeASVAB",
  webDir: "dist",
  backgroundColor: "#262d1b",
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "DARK",
    },
  },
};

export default config;
