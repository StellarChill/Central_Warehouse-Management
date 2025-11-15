/// <reference types="vite/client" />

import type { Liff } from "@liff/liff-types";

declare global {
  // Make LIFF available on globalThis for browser and test environments
  var liff: Liff;
}

export {};
