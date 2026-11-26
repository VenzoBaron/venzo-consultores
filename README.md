# Venzo Consultores — web principal

Web de **Venzo Consultores**, consultoría 360° centrada en la persona —sus gestiones, bienestar, decisiones y relaciones— y también en su negocio, si lo tiene.

Estructura: cabecera · portada con cinco accesos · servicios en detalle · «Qué es Venzo» · pie.

Construida con [Astro](https://astro.build) a partir del tema **[Northlight](https://github.com/Sv3nskie/astro-theme-northlight)** de Sven Esser (licencia MIT, ver `LICENSE`). Se conservan su composición y sus transiciones al desplazarse, con la identidad visual de Venzo.

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
| **Servicios**: textos, estados («Próximamente»), selector de EfectivaMente y destinos | `src/data/servicios.ts` |
| Nombre, título y descripción SEO, datos de contacto (vacíos = no se muestran) | `src/config.ts` |
| Textos de cada sección | `src/components/*.astro` (un archivo por sección) |
| Paleta y tipografías | `src/styles/tokens.css` |
| Maquetación y estados de animación | `src/styles/main.css` |
| Comportamiento al desplazarse y del menú | `src/scripts/main.js` |

### Servicios

Todos los textos, estados y destinos están en `src/data/servicios.ts`. Cada servicio genera su acceso en la portada, su tarjeta, su entrada en la navegación lateral, en el menú desplegable y en el pie.

- Los accesos de la portada siempre desplazan a la tarjeta del servicio dentro de Venzo; nunca abren webs externas.
- `estado: 'proximamente'` muestra «Próximamente». No depende de tener o no destino.
- `opciones` crea el selector interno de la tarjeta (solo EfectivaMente: «Particulares» / «Empresas y profesionales»), con su lista y sus botones.
- `enlaces` añade botones externos a una tarjeta; sin enlaces solo se muestra la descripción.
- `alFinal: true` fija un servicio en la última posición (Psicología sanitaria).

## Identidad

- Paleta: verde principal `#4F6B5B`, salvia `#799180`, bosque `#203E32`, profundo `#102824`, marfil `#F5F3EC`, dorado champán `#C5A977`, dorado oscuro `#806B45`, gris verdoso `#69716B`.
- Tipografías: Cormorant Garamond (títulos) y Manrope (texto), desde Google Fonts.
- Logotipos en `public/`: verde sobre fondos claros, dorado sobre oscuros. Se usan sin modificar. Los iconos (`favicon-*.png`, `apple-touch-icon.png`) y la imagen para redes (`og-venzo.png`) son el logotipo dorado colocado sobre verde profundo.

## Accesibilidad y movimiento

- Con «reducir movimiento» activado, la página se muestra completa sin animaciones y los servicios aparecen como lista directa.
- En escritorio, EfectivaMente se muestra con altura natural (su selector puede desplegarse sin recortes) y los demás servicios forman la pila animada. En móvil y tableta todo se muestra como lista.
- Enlace para saltar a los servicios, navegación por teclado con foco visible y menú móvil con el foco contenido.

## Licencia

MIT — se conserva el aviso de copyright original de Northlight en `LICENSE`.
