# Venzo Consultores — web principal

Página de entrada de **Venzo Consultores**, centro de servicios premium. Presenta las áreas de servicio y da acceso a la web especializada de cada una.

Construida con [Astro](https://astro.build) a partir del tema **[Northlight](https://github.com/Sv3nskie/astro-theme-northlight)** de Sven Esser (licencia MIT, ver `LICENSE`). Se conservan su composición, el orden de secciones y las transiciones al desplazarse, con la identidad visual de Venzo.

> **Estado: vista previa, no publicada.** La página incluye `noindex` y el flujo de GitHub Pages solo se ejecuta a mano.

## Ver la propuesta en local

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev        # http://localhost:4321
```

Para comprobar la versión compilada: `npm run build` y después `npm run preview`.
Añade `?intro` a la dirección para volver a ver el telón de entrada.

## Qué editar y dónde

| Qué | Dónde |
| --- | --- |
| **Áreas de servicio**: nombre, descripción, URL, etiqueta «Ejemplo», imagen | `src/data/servicios.ts` |
| Nombre, título y descripción SEO, datos de contacto (vacíos = no se muestran) | `src/config.ts` |
| Textos de cada sección | `src/components/*.astro` (un archivo por sección) |
| Paleta y tipografías | `src/styles/tokens.css` |
| Maquetación y estados de animación | `src/styles/main.css` |
| Comportamiento al desplazarse y del menú | `src/scripts/main.js` |

### Áreas de servicio

Cada área de `src/data/servicios.ts` genera su tarjeta, su entrada en el menú desplegable, en el índice de la sección y en el pie.

- Con `url: 'https://…'` el botón **«Acceder a su web»** lleva a esa dirección.
- Con `url: null` (o vacía, o una dirección no válida) se muestra **«Próximamente»**, sin enlace.
- `ejemplo: true` muestra la etiqueta «Ejemplo» y el aviso de áreas provisionales; ponlo en `false` cuando el contenido sea definitivo.
- Se pueden añadir o quitar áreas: el diseño se adapta al número de entradas.

## Identidad

- Paleta: verde principal `#4F6B5B`, salvia `#799180`, bosque `#203E32`, profundo `#102824`, marfil `#F5F3EC`, dorado champán `#C5A977`, dorado oscuro `#806B45`, gris verdoso `#69716B`.
- Tipografías: Cormorant Garamond (títulos) y Manrope (texto), desde Google Fonts.
- Logotipos en `public/`: verde sobre fondos claros, dorado sobre oscuros. Se usan sin modificar. Los iconos (`favicon-*.png`, `apple-touch-icon.png`) y la imagen para redes (`og-venzo.png`) son el logotipo dorado colocado sobre verde profundo.

## Accesibilidad y movimiento

- Con «reducir movimiento» activado, la página se muestra completa sin animaciones y los servicios aparecen como lista directa.
- En móvil y tableta los servicios se muestran siempre como lista; la pila animada solo se usa en escritorio.
- Enlace para saltar a los servicios, navegación por teclado con foco visible y menú móvil con el foco contenido.

## Licencia

MIT — se conserva el aviso de copyright original de Northlight en `LICENSE`.
