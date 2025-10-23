"use client";
import { useEffect } from "react";

export default function MockInit() {
  useEffect(() => {
    async function boot() {
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
          const { worker } = await import("../mocks/browser");
          await worker.start({ serviceWorker: { url: "/mockServiceWorker.js" } });
          console.log("[MSW] Mocking enabled.");
        } else {
          console.log("[MSW] Mocking disabled (env).");
        }
      } catch (e) {
        console.error("[MSW] Failed to start:", e);
      }
    }
    boot();
  }, []);
  return null;
}
