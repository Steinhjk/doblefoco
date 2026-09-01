import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  // Código de navegador
  {
    files: ['src/**/*.{js,jsx}', 'shared/**/*.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      // La huella que incrusta el `define` de vite.config.js (el handshake de
      // version). Sin declararla, cada uso seria un no-undef.
      globals: { ...globals.browser, __REGISTRO_HASH_ESPERADO__: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
    },
  },

  // Código de servidor. Antes no existía esta sección, así que `process` se
  // reportaba como no definido en server/index.js.
  //
  // `scripts/**` se añadió el 2026-07-28 por una razón concreta: no estaba
  // cubierto, y al recortar comprobaciones de checkRegistry quedó una
  // referencia a una variable borrada. `npm run lint` pasó en verde y el fallo
  // solo apareció al EJECUTAR el script, en CI. Un identificador inexistente es
  // lo más elemental que detecta un linter; lo único que hacía falta era
  // mirarlo. Ahí viven el verificador del catálogo, el runner de migraciones y
  // la creación de cuentas: código con consecuencias.
  {
    files: ['server/**/*.js', 'scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // `scripts/mirar.mjs` y `scripts/generarOgImage.mjs` corren en Node PERO
  // llevan dentro código que se ejecuta en el navegador, vía `page.evaluate`.
  // Ahí `document`, `window` y `getComputedStyle` son legítimos y el linter los
  // daba por indefinidos.
  //
  // Se les dan los dos juegos de globales en vez de silenciar `no-undef` en el
  // archivo: silenciarlo taparía también un identificador escrito mal, que es
  // justo lo que la sección de arriba existe para cazar.
  {
    files: ['scripts/mirar.mjs', 'scripts/generarOgImage.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // La URL que escribe Vite viene con códigos ANSI dentro, y quitarlos
      // exige nombrar el carácter de escape. Es la razón de ser de la línea.
      'no-control-regex': 'off',
    },
  },
])
