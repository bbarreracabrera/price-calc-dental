/** @type {import('tailwindcss').Config} */

// ============================================================================
// SISTEMA VISUAL SHININGCLOUD — "Pastel cálido"
// ----------------------------------------------------------------------------
// Dos reglas rigen esta paleta:
//
//   1. Los pasteles pintan SUPERFICIES. El texto encima es siempre tinta.
//      Un pastel es claro y poco saturado por definición, así que usarlo como
//      color de texto garantiza contraste malo. Separando los dos papeles la
//      app se ve suave y se sigue leyendo con la luz de la lámpara encima.
//
//   2. Los TAMAÑOS DE TEXTO van en px, el ESPACIADO va en rem.
//      `html.app-zoomed` reduce la raíz a 12px (ver index.css), lo que encoge
//      todo lo que esté en rem — paddings, gaps, radios — y deja la densidad
//      exactamente como está hoy. Al declarar fontSize en px, la tipografía
//      queda fuera de ese encogimiento y se lee de verdad.
//
// Todos los pares texto/fondo de aquí abajo cumplen WCAG AA (≥4.5:1); la
// mayoría supera 7:1, que es el nivel AAA. El ratio va comentado al lado.
// ============================================================================

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: { xs: '480px' },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // En px a propósito: inmunes a la reducción de la raíz.
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        xs:    ['12px', { lineHeight: '1.45' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['15px', { lineHeight: '1.55' }],
        lg:    ['17px', { lineHeight: '1.5' }],
        xl:    ['19px', { lineHeight: '1.4' }],
        '2xl': ['23px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '3xl': ['28px', { lineHeight: '1.22', letterSpacing: '-0.015em' }],
        '4xl': ['34px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '5xl': ['44px', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
      },

      colors: {
        // --- Superficies ---
        canvas:   '#FBFAF8',  // fondo de la app
        surface:  '#FFFFFF',  // tarjetas
        raised:   '#F5F2ED',  // hover, filas alternas, campos

        // --- Texto ---
        ink:      '#241F1B',  // 16.32:1 sobre blanco
        muted:    '#5E554E',  // 7.28:1 sobre blanco — reemplaza al viejo #9A8F84 (3.06:1)
        faint:    '#8A7F74',  // solo decorativo: iconos, separadores. Nunca texto.

        // --- Bordes ---
        line:     '#E6DFD5',
        'line-strong': '#D9D2C7',

        // --- Acción (oliva) ---
        accent: {
          DEFAULT: '#46523C',  // 8.29:1 sobre blanco y con blanco encima
          hover:   '#36402F',
          soft:    '#E3E9DD',  // pastel oliva — tinta encima da 13.18:1
        },

        // --- Acentos pastel de superficie ---
        rose:  { DEFAULT: '#7D4A43', soft: '#F4E2DE' },  // 7.16:1
        sand:  { DEFAULT: '#7A6A55', soft: '#EFE6DA' },
        sky:   { DEFAULT: '#3D5A80', soft: '#E0E7EC' },  // 7.06:1

        // --- Estados clínicos ---
        ok:     { DEFAULT: '#1F6F63', soft: '#DDEAE3' },  // 5.98:1
        warn:   { DEFAULT: '#8A5A00', soft: '#F6E7C8' },  // 5.93:1
        danger: { DEFAULT: '#A62B21', soft: '#F7E0DD' },  // 7.03:1
      },

      borderRadius: {
        card:  '1.25rem',
        panel: '1.75rem',
      },

      boxShadow: {
        // Sombras tintadas con oliva en vez de negro: menos sucias sobre crema.
        card:  '0 1px 2px rgba(70,82,60,.06), 0 4px 12px -4px rgba(70,82,60,.07)',
        panel: '0 2px 4px rgba(70,82,60,.05), 0 12px 32px -12px rgba(70,82,60,.12)',
        pop:   '0 8px 40px -8px rgba(36,31,27,.22)',
      },

      minHeight: { touch: '44px' },
      minWidth:  { touch: '44px' },
    },
  },
  plugins: [],
}
