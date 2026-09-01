import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * La API de producción, para el proxy de desarrollo de abajo.
 *
 * Se puede apuntar a otra con `API_DEV=http://localhost:3000 npm run dev`, que
 * es lo que hay que hacer cuando se está tocando el servidor.
 */
const API_DEV = process.env.API_DEV ?? 'https://doblefoco.fly.dev'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

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
     * `VITE_API_URL=https://doblefoco.fly.dev` el navegador pide a OTRO origen,
     * la API solo permite el de producción, y todas las llamadas mueren en la
     * CORS. Lo que se ve entonces no es el fallo que se venía a buscar: es la
     * página vacía, con sus contadores en cero. **Es un diagnóstico falso
     * esperando a que alguien lo crea**, y el 24 estuvo a punto de colar.
     *
     * Con este proxy el cliente pide a `/api/...` —su propio origen— y Vite
     * reenvía. No hay cross-origin, así que no hay nada que permitir. Para que
     * funcione, **`VITE_API_URL` tiene que valer `same-origin`**: así
     * `apiClient` construye rutas relativas. En Vercel sigue viniendo de
     * `vercel.json`, que no pasa por aquí.
     *
     * CORREGIDO EL 2026-08-31, y el error importaba. Este comentario decía que
     * la variable debía quedar **vacía**, y vacía es otra cosa: `apiBase.js`
     * declara tres estados y reserva el vacío para el MODO DEMOSTRACIÓN, en el
     * que no se intenta ninguna petición. Seguir la instrucción producía
     * exactamente la pantalla que este proxy existe para evitar —la página con
     * los contadores en cero—, y encima sin una sola petición fallida en la
     * consola que delatara por qué. Comprobado las dos veces: con la variable
     * vacía, cero historias; con `same-origin`, las 5 637 del catálogo.
     *
     * Y no es que el valor de `.env.local` esté mal. `http://localhost:5000`
     * es lo correcto cuando se levanta también `npm run dev:server`, que es
     * full-stack de verdad. Este proxy es la OTRA forma: mirar el cliente
     * contra los datos de producción sin levantar nada más.
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
