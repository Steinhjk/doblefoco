import { describe, it, expect } from 'vitest';
import {
    fraseDeCoberturaDeHistoria,
    mensajeConEnlace,
    textoDeCompartir,
    urlDeHistoria,
} from './compartir';

const historia = {
    id: 'story_1s2crko',
    title: 'Fiscalía reactiva órdenes de captura contra tres exintegrantes',
    coverage: { counts: { left: 1, center: 10, right: 11 }, total: 22 },
};

describe('compartir · la URL es la de la historia', () => {
    /*
     * ESTA ES LA PRUEBA QUE JUSTIFICA EL FICHERO. El diálogo leía
     * `window.location.href`, que en la página de la noticia acierta por
     * casualidad. El fallo solo aparece al compartir desde una tarjeta: se
     * mandaría la portada. Ninguna prueba de las 860 lo habría visto, porque el
     * defecto no está en el cálculo sino en de dónde se saca el dato.
     */
    it('sale de la historia y no de la página que se esté mirando', () => {
        expect(urlDeHistoria(historia, 'https://doblefoco.co')).toBe(
            'https://doblefoco.co/noticia/fiscalia-reactiva-ordenes-de-captura-contra-tres-1s2crko'
        );
    });

    it('no arrastra los filtros que lleve la barra de direcciones', () => {
        const url = urlDeHistoria(historia, 'https://doblefoco.co');
        expect(url).not.toContain('?');
    });
});

describe('compartir · el texto dice lo que se midió', () => {
    it('lleva el reparto por espectro', () => {
        expect(textoDeCompartir(historia)).toContain(
            '22 medios cubren este hecho: 1 de izquierda, 10 de orientación mixta, 11 de derecha.'
        );
    });

    /*
     * «Centro» es la palabra que este proyecto decidió no usar: la banda media
     * es «orientación mixta», que describe lo medido en vez de afirmar una
     * posición. El metadato de Open Graph decía «de centro» hasta el 2026-09-15
     * mientras el resto del sitio decía lo otro.
     */
    it('nunca dice «de centro»', () => {
        expect(textoDeCompartir(historia)).not.toMatch(/de centro/i);
    });

    /*
     * El texto anterior era «Cobertura contrastada: …». Un adjetivo que la
     * medición no sostiene es exactamente lo que se retiró del `twitter:title`
     * el 2026-09-01, y volvería a entrar por aquí sin que nadie lo notara.
     */
    it('no se atribuye ninguna virtud', () => {
        const virtudes = /contrastad|objetiv|imparcial|neutral|riguros|independient|veraz/i;
        expect(textoDeCompartir(historia)).not.toMatch(virtudes);
        expect(fraseDeCoberturaDeHistoria(historia)).not.toMatch(virtudes);
    });

    it('una historia archivada se cuenta en pasado', () => {
        const archivada = { ...historia, archivadaEl: '2026-09-01T10:00:00Z' };
        expect(textoDeCompartir(archivada)).toContain('22 medios cubrieron este hecho');
    });

    /*
     * Sin reparto medido no se inventa una frase: decir de una historia algo que
     * no sabemos es justo lo que el proyecto no hace.
     */
    it('sin cobertura medida manda solo el titular', () => {
        expect(textoDeCompartir({ title: 'Titular suelto' })).toBe('Titular suelto');
        expect(fraseDeCoberturaDeHistoria({ title: 'Titular suelto' })).toBe('');
    });
});

describe('compartir · el mensaje para los canales de un solo campo', () => {
    it('lleva el enlace separado del texto', () => {
        const mensaje = mensajeConEnlace(historia, 'https://doblefoco.co');
        expect(mensaje).toContain(historia.title);
        expect(mensaje).toContain('orientación mixta');
        expect(mensaje.endsWith(urlDeHistoria(historia, 'https://doblefoco.co'))).toBe(true);
    });
});
