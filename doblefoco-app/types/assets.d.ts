/**
 * Declaraciones de los recursos que Vite sabe importar y TypeScript no.
 *
 * Sin esto, `import './NewsCard.css'` es un error de módulo no encontrado y
 * basta para impedir comprobar el archivo entero, aunque el CSS no tenga nada
 * que ver con los tipos.
 */

declare module '*.css';
declare module '*.svg' {
    const src: string;
    export default src;
}
declare module '*.txt?raw' {
    const content: string;
    export default content;
}
