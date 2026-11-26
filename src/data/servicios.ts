/**
 * ÁREAS DE SERVICIO — el único archivo que hay que editar para cambiarlas.
 *
 * Cada entrada genera automáticamente:
 *   · su tarjeta en la sección «Servicios»,
 *   · su enlace en el menú desplegable de la cabecera y en el pie,
 *   · su capa en la composición de la sección «Venzo».
 *
 * Campos:
 *   id          Identificador corto, sin espacios ni tildes (se usa en el ancla #servicio-<id>).
 *   nombre      Nombre visible del área.
 *   resumen     Frase breve para el menú desplegable (opcional; si falta se usa la descripción).
 *   descripcion Texto de la tarjeta (una o dos frases).
 *   url         Dirección completa de la web del área, p. ej. 'https://area.venzoconsultores.es'.
 *               Déjala en null (o '') mientras no exista: la tarjeta mostrará «Próximamente»
 *               sin ningún enlace. Solo se aceptan direcciones http:// o https://.
 *   ejemplo     true mientras el área sea provisional: muestra la etiqueta «Ejemplo».
 *               Ponlo en false (o bórralo) cuando el contenido sea definitivo.
 *   imagen      Opcional. Ruta de una fotografía en /public (p. ej. '/areas/area-1.jpg').
 *               Sin imagen, la tarjeta usa un fondo ornamental con los colores de la marca.
 *
 * Puedes añadir o quitar áreas: el diseño se adapta al número de entradas.
 */

export interface Servicio {
  id: string;
  nombre: string;
  resumen?: string;
  descripcion: string;
  url: string | null;
  ejemplo?: boolean;
  imagen?: string;
}

export const servicios: Servicio[] = [
  {
    id: 'ejemplo-1',
    nombre: 'Área de ejemplo I',
    resumen: 'Nombre y descripción provisionales.',
    descripcion:
      'Texto provisional. Aquí irá una breve presentación del área y de lo que el visitante encontrará en su web especializada.',
    url: null,
    ejemplo: true,
  },
  {
    id: 'ejemplo-2',
    nombre: 'Área de ejemplo II',
    resumen: 'Nombre y descripción provisionales.',
    descripcion:
      'Texto provisional. Sustitúyelo por el resumen definitivo del servicio cuando esté decidido.',
    url: null,
    ejemplo: true,
  },
  {
    id: 'ejemplo-3',
    nombre: 'Área de ejemplo III',
    resumen: 'Nombre y descripción provisionales.',
    descripcion:
      'Texto provisional. Una o dos frases bastan: el detalle completo vivirá en la web propia del área.',
    url: null,
    ejemplo: true,
  },
  {
    id: 'ejemplo-4',
    nombre: 'Área de ejemplo IV',
    resumen: 'Nombre y descripción provisionales.',
    descripcion:
      'Texto provisional. Cuando su web esté lista, añade la dirección y este espacio enlazará con ella.',
    url: null,
    ejemplo: true,
  },
];

/** Devuelve la URL del área solo si es una dirección web válida (http/https); si no, null. */
export function enlaceDe(s: Servicio): string | null {
  const url = (s.url ?? '').trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Numeración romana para el ornamento de cada tarjeta (I, II, III…). */
export function romano(n: number): string {
  const t: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of t) while (n >= v) { out += s; n -= v; }
  return out;
}

export const dosCifras = (i: number) => String(i + 1).padStart(2, '0');
