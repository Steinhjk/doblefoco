// @ts-check
import { describe, it, expect } from 'vitest';
import { MEDIA_REGISTRY, getIngestFeeds } from './mediaRegistry.js';
import { clasificarAmbito } from './topicClassifier.js';

describe('getIngestFeeds', () => {
    it('un feed secundario puede declarar su propio país, y manda sobre el del medio', () => {
        /*
         * QUÉ PROTEGE, Y POR QUÉ NO ES TEÓRICO.
         *
         * El clasificador de ámbito desempata por país cuando el titular no trae
         * marca geográfica: sin marca y medio extranjero, la pieza va a
         * Internacional. Eso es correcto para la portada de El País y **falso
         * para su edición Colombia**, que es toda colombiana.
         *
         * Medido el 2026-08-18 antes de arreglarlo: de 19 piezas de
         * `america-colombia` guardadas, **8 estaban en Internacional** — el
         * incendio de Andrés Carne de Res y los afectados del terremoto entre
         * ellas. Noticias de Bogotá catalogadas como extranjeras, que es lo
         * contrario de lo que este sitio existe para hacer.
         *
         * Si alguien devuelve `country: media.country` en `getIngestFeeds`, el
         * defecto vuelve sin hacer ruido: no falla nada, solo se vacía la
         * portada nacional de un medio. Por eso hay prueba.
         */
        const feeds = getIngestFeeds();
        const colombia = feeds.find((f) => f.url.includes('america-colombia'));

        expect(colombia, 'falta el feed de la edición Colombia de El País').toBeDefined();
        expect(colombia?.country).toBe('CO');

        // Y el medio sigue siendo español: esto corrige un feed, no reescribe
        // la nacionalidad de la casa.
        const portada = feeds.find((f) => f.mediaId === 'el-pais-es' && !f.url.includes('america-colombia'));
        expect(portada?.country).toBe('ES');
    });

    it('el techo propio de un feed llega al motor, y los demás van sin techo', () => {
        // Decisión del 2026-09-02 (punto 4, opción B): 15 por defecto y valor
        // propio para quien publique más de 15 en media hora. Hoy es Infobae.
        const feeds = getIngestFeeds();
        const infobae = feeds.find((f) => f.mediaId === 'infobae-co');
        expect(infobae?.techo).toBe(60);

        const conTecho = feeds.filter((f) => f.techo !== null);
        expect(conTecho.map((f) => f.mediaId)).toEqual(['infobae-co']);
    });

    it('sin país propio, el feed secundario hereda el del medio', () => {
        const feeds = getIngestFeeds();
        for (const media of MEDIA_REGISTRY) {
            for (const extra of media.extraFeeds ?? []) {
                if (extra.country) continue;
                const feed = feeds.find((f) => f.url === extra.url);
                expect(feed?.country, `«${media.id}» debería heredar el país`).toBe(media.country);
            }
        }
    });

    it('el arreglo se nota en la clasificación, que es lo que importa', () => {
        // Un titular real de la edición Colombia, sin ninguna marca geográfica
        // que el clasificador reconozca.
        const texto = 'Los afectados del terremoto ponen su fe en las aseguradoras';

        expect(clasificarAmbito({ texto, paisDelMedio: 'ES' })).toBe('internacional');
        expect(clasificarAmbito({ texto, paisDelMedio: 'CO' })).toBe('nacional');
    });
});
