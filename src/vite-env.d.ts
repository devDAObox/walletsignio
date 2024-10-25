/// <reference types="vite/client" />

interface Window {
  ethereum: {
    request: (args: { method: string; params: any[] }) => Promise<any>;
    selectedAddress: string;
    isMetaMask?: boolean;
    on?: (event: string, callback: (params: any) => void) => void;
    removeListener?: (event: string, callback: (params: any) => void) => void;
  };
  Buffer: typeof Buffer;
  process: any;
}

declare module 'crypto-browserify';
declare module 'stream-browserify';
declare module 'assert';
declare module 'util';
declare module 'process/browser';
declare module '@esbuild-plugins/node-globals-polyfill';
declare module '@esbuild-plugins/node-modules-polyfill';

declare module 'pdfjs-dist' {
  export * from 'pdfjs-dist/types/src/display/api';
}