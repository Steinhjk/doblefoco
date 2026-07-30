// @ts-check
import { useState } from 'react';
import { getStoryImage } from '../services/imageEngineService';
import './StoryImage.css';

/**
 * La imagen de una noticia, o nada.
 *
 * TRES REGLAS, y las tres vienen de lo que había antes:
 *
 *   1. Si el medio no publicó imagen, NO SE PINTA NADA. Antes se rellenaba con
 *      una foto de archivo de Unsplash elegida por hash del titular, así que
 *      «Condenan a Carlos Caicedo a cerca de 10 años de cárcel» se ilustraba con
 *      la foto etiquetada «Indicadores Económicos». Una imagen junto a un titular
 *      se lee como documental.
 *
 *   2. Si la imagen falla al cargar, tampoco se sustituye. Un hueco es honesto;
 *      una foto que no es de esta noticia, no.
 *
 *   3. Se acredita al medio. La foto es suya, y mostrarla sin decirlo es usar
 *      material ajeno como si fuera nuestro.
 *
 * `referrerPolicy="no-referrer"` porque la foto se pide al servidor del medio:
 * sin eso, el referer le diría qué página de DobleFoco la está mostrando. No
 * elimina que vea una petición —para eso habría que servir las imágenes desde
 * nuestro dominio—, pero le quita el contexto.
 *
 * @param {{
 *   story: any,
 *   className?: string,
 *   width?: number,
 *   height?: number,
 *   eager?: boolean,
 *   showCredit?: boolean,
 *   children?: import('react').ReactNode,
 * }} props
 */
const StoryImage = ({
    story,
    className = '',
    width = 400,
    height = 300,
    eager = false,
    showCredit = true,
    children,
}) => {
    const [fallida, setFallida] = useState(false);
    const image = getStoryImage(story);

    if (!image || fallida) return null;

    return (
        <>
            <img
                src={image.url}
                alt=""
                width={width}
                height={height}
                loading={eager ? 'eager' : 'lazy'}
                className={className}
                referrerPolicy="no-referrer"
                onError={() => setFallida(true)}
            />
            {children}
            {showCredit && image.outlet && (
                <span className="story-image-credit">Foto: {image.outlet}</span>
            )}
        </>
    );
};

export default StoryImage;
