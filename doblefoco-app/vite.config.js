import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { MEDIA_REGISTRY } from './shared/mediaRegistry.js'
import { hashDelRegistro } from './shared/registroHash.js'

/**
 * La API de producción, para el proxy de desarrollo de abajo.
 *
 * Se puede apuntar a otra con `API_DEV=http://localhost:3000 npm run dev`, que
 * es lo que hay que hacer cuando se está tocando el servidor.
 */
const API_DEV = process.env.API_DEV ?? 'https://api.doblefoco.co'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  /**
   * El handshake de version (I-7 / 2-B): el cliente lleva incrustada la huella
   * del registro con el que se construyo, y el motor publica la suya en
   * /api/health. AvisoDesfase compara las dos en el navegador y avisa si el
   * sitio y su motor estan sirviendo catalogos distintos —que es el desfase
   * que ya mordio dos veces (37 feeds contra 39, tres secciones en cero)—.
   * Se calcula aqui y no en runtime porque el navegador no puede hashear lo
   * que importa: necesita saber que esperaba SU build, no lo que ve.
   */
  define: {
    __REGISTRO_HASH_ESPERADO__: JSON.stringify(hashDelRegistro(MEDIA_REGISTRY)),
  },

  server: {
    /**
     * MIRAR EN LOCAL CONTRA DATOS REALES, SIN PELEARSE CON LA CORS.
     *
     * El punto ciego de este proyecto son las costuras —JSX↔CSS, base↔memoria,
     * API↔cliente— y las pruebas apenas las tocan. La única defensa que las
     * caza es abrir la página y mirarla; el 2026-08-24 salieron así tres
     * defectos que las 629 pruebas no vieron.
     *
     * Y hasta hoy eso costaba más de lo que debería. Poniendo
     * `VITE_API_URL=https://api.doblefoco.co` el navegador pide a OTRO origen,
     * la API solo permite el de producción, y todas las llamadas mueren en la
     * CORS. Lo que se ve entonces no es el fallo que se venía a buscar: es la
     * página vacía, con sus contadores en cero. **Es un diagnóstico falso
     * esperando a que alguien lo crea**, y el 24 estuvo a punto de colar.
     *
     * Con este proxy el cliente pide a `/api/...` —su propio origen— y Vite
     * reenvía. No hay cross-origin, así que no hay nada que permitir. Para que
     * funcione, `VITE_API_URL` debe quedar VACÍA en desarrollo: así
     * `apiClient` construye rutas relativas. En Vercel sigue viniendo de
     * `vercel.json`, que no pasa por aquí.
     *
     * `changeOrigin` es obligatorio: sin él viaja `Host: localhost:5173` y Fly
     * no sabe a qué aplicación enrutar.
     */
    proxy: {
      '/api': {
        target: API_DEV,
        changeOrigin: true,
      },
    },
  },
})
