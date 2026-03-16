import { defineConfig } from "vite";

export default defineConfig({
  base: "./",

  publicDir: "game-assets",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
          "matter-js": ["matter-js"],
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },

  server: {
    host: true,
    port: 3000,
    open: true,
    strictPort: false,
    hmr: {},
  },

  preview: {
    port: 4173,
    strictPort: true,
  },
});
