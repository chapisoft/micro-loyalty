import App from '@/app.tsx';
import { apiClient } from '@/service/config.ts';
import { MicroApp } from 'micro-sdk';

const microApp = MicroApp(<App />, apiClient);
export const bootstrap = microApp.bootstrap;
export const mount = microApp.mount;
export const unmount = microApp.unmount;
export const update = microApp.update;
