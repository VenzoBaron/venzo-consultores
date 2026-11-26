// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL / BASE_PATH los define el flujo de GitHub Pages.
// Para el dominio definitivo, sustituye 'https://example.com' por la dirección real.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  base: process.env.BASE_PATH ?? '/',
});
