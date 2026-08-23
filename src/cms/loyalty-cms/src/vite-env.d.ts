/// <reference types="vite/client" />
declare module 'locale-includes';

interface Window {
  __ENV__?: {
    VITE_MODE?: string;
    VITE_API_URL?: string;
    VITE_API_AUTH_URL?: string;
    VITE_IMAGE_URL?: string;
    VITE_ACCESS_TOKEN?: string;
    VITE_CONTEXT_PATH?: string;
  };
}

