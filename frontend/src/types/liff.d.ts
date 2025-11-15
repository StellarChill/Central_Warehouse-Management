import type { Liff } from '@liff/liff-types';

declare global {
  interface Window {
    liff: Liff;
  }
  // For Node/Jest globals
  namespace NodeJS {
    interface Global {
      liff: Liff;
    }
  }
}

export {};
