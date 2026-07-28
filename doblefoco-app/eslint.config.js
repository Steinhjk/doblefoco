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
      globals: globals.browser,
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
])
