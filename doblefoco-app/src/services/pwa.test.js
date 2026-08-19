// @ts-check
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('Configuración PWA y Service Worker offline', () => {
    const swPath = resolve(RAIZ, 'public/sw.js');
    const manifestPath = resolve(RAIZ, 'public/manifest.json');
    const htmlPath = resolve(RAIZ, 'index.html');

    it('el archivo sw.js existe y contiene listeners esenciales', () => {
        expect(existsSync(swPath)).toBe(true);
        const swContent = readFileSync(swPath, 'utf8');
        expect(swContent).toContain("addEventListener('install'");
        expect(swContent).toContain("addEventListener('activate'");
        expect(swContent).toContain("addEventListener('fetch'");
        expect(swContent).toContain('/api/');
    });

    it('el manifest.json es válido y define propiedades requeridas de PWA', () => {
        expect(existsSync(manifestPath)).toBe(true);
        const manifestRaw = readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestRaw);

        expect(manifest.name).toContain('DobleFoco');
        expect(manifest.short_name).toBe('DobleFoco');
        expect(manifest.start_url).toBe('/');
        expect(manifest.display).toBe('standalone');
        expect(manifest.theme_color).toBe('#121212');
        expect(Array.isArray(manifest.icons)).toBe(true);
        expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it('index.html enlaza el manifest.json', () => {
        const html = readFileSync(htmlPath, 'utf8');
        expect(html).toContain('rel="manifest"');
        expect(html).toContain('href="/manifest.json"');
    });
});
