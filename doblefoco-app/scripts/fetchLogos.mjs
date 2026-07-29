/**
 * Descarga los logos de los medios para servirlos desde nuestro dominio.
 *
 *   npm run logos:fetch
 *
 * POR QUÉ
 * -------
 * Los logos se pedían en caliente a `google.com/s2/favicons?domain=…`, un icono
 * por chip. Eso significa que el navegador de CADA LECTOR hacía decenas de
 * peticiones a Google por página, y cada una revela algo peor que una IP:
 * revela QUÉ MEDIOS aparecen en la página que esa persona está leyendo.
 *
 * En un sitio sobre pluralismo informativo eso es material sensible. Saber que
 * alguien mira una historia cubierta por ciertos medios y no por otros dice
 * bastante de lo que está leyendo.
 *
 * Aquí se usa el mismo servicio UNA VEZ, desde la máquina que construye. Google
 * ve nuestro despliegue, no a los lectores. Es el intercambio correcto: una
 * petición en el build contra miles en producción.
 *
 * Los que fallen no rompen nada: MediaLogo ya pinta un monograma cuando no hay
 * imagen, que fue la decisión de F1-07 —un monograma legible comunica más que
 * un icono roto—.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA_REGISTRY } from '../shared/mediaRegistry.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(ROOT, 'public/logos');

await mkdir(DESTINO, { recursive: true });

let ok = 0;
const fallidos = [];

for (const medio of MEDIA_REGISTRY) {
    const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(medio.domain)}&sz=128`;

    try {
        const respuesta = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const datos = Buffer.from(await respuesta.arrayBuffer());

        // El servicio devuelve un icono genérico de ~100 bytes cuando no
        // encuentra nada. Guardarlo sería peor que no guardar: se vería un
        // globo terráqueo idéntico para varios medios, sugiriendo que son el
        // mismo. Mejor el monograma con sus iniciales.
        if (datos.length < 300) throw new Error('icono genérico');

        await writeFile(resolve(DESTINO, `${medio.id}.png`), datos);
        ok += 1;
    } catch (error) {
        fallidos.push(`${medio.id} (${error.message})`);
    }
}

console.log(`  ${ok} de ${MEDIA_REGISTRY.length} logos descargados en public/logos/`);
if (fallidos.length) {
    console.log(`  sin logo, se pintarán con monograma: ${fallidos.join(', ')}`);
}
