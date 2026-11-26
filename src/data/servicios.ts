/**
 * SERVICIOS DE VENZO — único archivo con textos, estados y destinos.
 *
 * Cada entrada genera automáticamente:
 *   · su acceso en la portada («¿En qué podemos ayudarte?»),
 *   · su tarjeta en la sección de servicios y su nombre en la navegación lateral,
 *   · su entrada en el menú desplegable de la cabecera y en el pie,
 *   · su capa en la composición de la sección «Qué es Venzo».
 *
 * Campos:
 *   id          Identificador corto (ancla #servicio-<id>).
 *   nombre      Nombre del área: accesos de portada, navegación lateral, menú y pie.
 *   subtitulo   Opcional. Línea secundaria del acceso de portada.
 *   titulo      Opcional. Encabezado de la tarjeta (si falta, se usa `nombre`).
 *   frase       Opcional. Frase destacada bajo el encabezado de la tarjeta.
 *   descripcion Texto principal de la tarjeta.
 *   estado      'disponible' | 'proximamente'. «Próximamente» se muestra solo con
 *               'proximamente'; no depende de que exista o no un destino.
 *   opciones    Opcional. Selector interno de la tarjeta con dos o más opciones de igual
 *               peso. Inicialmente ninguna está desplegada y se puede cambiar de opción.
 *   selector    Opcional. Texto que encabeza el selector (por defecto, «Elige tu caso:»).
 *   consulta    Opcional. Botón que despliega, dentro de la propia tarjeta, un panel con
 *               el selector, información común y un aviso de disponibilidad. No envía
 *               ni reserva nada: solo muestra información.
 *   enlaces     Opcional. Botones externos de la tarjeta. Sin enlaces, la tarjeta
 *               muestra solo su descripción (sin botones vacíos).
 *   alFinal     true fija el servicio en la última posición, pase lo que pase.
 *
 * Los accesos de portada nunca abren webs externas: siempre desplazan a la tarjeta.
 */

export interface Boton {
  texto: string;
  url: string;
  variante?: 'primario' | 'secundario';
}

export interface Opcion {
  id: string;
  etiqueta: string;
  intro: string;
  lista: string[];
  botones: Boton[];
}

export interface Consulta {
  /** Texto del botón que abre el panel (p. ej. «Consultar mi situación»). */
  boton: string;
  /** Información común a todas las opciones; se muestra al elegir cualquiera de ellas. */
  comun: {
    titulo: string;
    parrafos: string[];
    modalidad: string;
    aclaracion: string;
  };
  /** Estado del canal de solicitudes, mostrado tras la información. */
  aviso: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  subtitulo?: string;
  titulo?: string;
  frase?: string;
  descripcion: string;
  estado: 'disponible' | 'proximamente';
  opciones?: Opcion[];
  selector?: string;
  consulta?: Consulta;
  enlaces?: Boton[];
  alFinal?: boolean;
}

const lista: Servicio[] = [
  {
    id: 'efectivamente',
    nombre: 'Gestoría y consultoría',
    subtitulo: 'EfectivaMente Consultores',
    titulo: 'EfectivaMente Consultores',
    frase: 'Claridad para decidir. Apoyo para gestionar.',
    descripcion:
      'Gestoría, asesoría y consultoría para particulares, autónomos y empresas. Desde un trámite personal hasta una decisión que necesita un análisis más profundo.',
    estado: 'disponible',
    opciones: [
      {
        id: 'particulares',
        etiqueta: 'Particulares',
        intro: 'Ayuda profesional para tus trámites, obligaciones y decisiones personales.',
        lista: [
          'Renta y requerimientos tributarios.',
          'Seguridad Social, prestaciones, jubilación y gestión de deuda.',
          'Empleados del hogar.',
          'Administración digital y certificados.',
          'Propietarios y alquileres.',
          'Fiscalidad de no residentes.',
          'Préstamos, herencias y donaciones.',
          'Becas, ayudas y subvenciones.',
          'Consultoría individual.',
        ],
        botones: [
          { texto: 'Ver servicios para particulares', url: 'https://efectivamenteconsultores.com/particulares-2/', variante: 'primario' },
        ],
      },
      {
        id: 'empresas',
        etiqueta: 'Empresas y profesionales',
        intro: 'Gestión y orientación para las obligaciones, el funcionamiento y las decisiones de tu negocio.',
        lista: [
          'Fiscal y contable.',
          'Laboral y Recursos Humanos.',
          'Asesoría.',
          'Consultoría.',
        ],
        botones: [
          { texto: 'Ver servicios para mi negocio', url: 'https://efectivamenteconsultores.com/servicios/', variante: 'primario' },
          { texto: 'Conocer la consultora', url: 'https://efectivamenteconsultores.com/', variante: 'secundario' },
        ],
      },
    ],
  },
  {
    id: 'coaching',
    nombre: 'Coaching personal y profesional',
    frase: 'Cuando no sabes cómo seguir, podemos empezar por entender qué te está frenando.',
    descripcion:
      'Un espacio para ordenar tus ideas, aclarar tus objetivos y explorar cómo avanzar. Sesiones individuales, online y presenciales, para particulares, emprendedores y profesionales.',
    // El servicio está disponible; lo pendiente es el canal de solicitudes (ver `consulta.aviso`).
    estado: 'disponible',
    selector: '¿Qué te gustaría abordar?',
    opciones: [
      {
        id: 'personal',
        etiqueta: 'Una situación personal',
        intro: 'Para momentos en los que necesitas aclarar qué quieres, valorar alternativas o encontrar tu siguiente paso.',
        lista: [
          'Te sientes perdido o no sabes cómo avanzar.',
          'No sabes qué estudiar o hacia dónde orientar tu futuro.',
          'Necesitas aclarar prioridades y objetivos.',
          'Te cuesta elegir entre varias opciones.',
          'Quieres preparar una conversación difícil o abordar un desacuerdo.',
          'Estás atravesando un cambio personal o profesional.',
        ],
        botones: [],
      },
      {
        id: 'profesional',
        etiqueta: 'Una situación profesional o de negocio',
        intro: 'Para emprendedores, autónomos y profesionales que necesitan ordenar sus ideas y avanzar en las decisiones de su actividad.',
        lista: [
          'No sabes cuál debe ser el siguiente paso de tu negocio.',
          'Necesitas definir objetivos y ordenar prioridades.',
          'Tienes una decisión profesional pendiente.',
          'Quieres preparar una conversación difícil con socios, colaboradores o clientes.',
          'Buscas encajar tu actividad profesional con tu vida personal.',
          'Estás valorando un cambio de rumbo profesional.',
        ],
        botones: [],
      },
    ],
    consulta: {
      boton: 'Consultar mi situación',
      comun: {
        titulo: '¿Cómo trabajaremos?',
        parrafos: [
          'Partiremos de una situación concreta que quieras abordar. A través del diálogo socrático —preguntas que ayudan a examinar tus ideas, supuestos y alternativas— exploraremos qué necesitas, qué opciones tienes y qué puedes hacer después.',
          'Las decisiones serán tuyas. Mi papel será acompañarte en ese proceso y aportar perspectiva desde mi formación en Psicología, gestión y mediación.',
        ],
        modalidad: 'Sesiones individuales, online y presenciales.',
        aclaracion:
          'Este servicio se centra en orientación, objetivos y toma de decisiones. La atención de psicología sanitaria tendrá su propio espacio en Venzo, próximamente.',
      },
      aviso: 'Estamos preparando el acceso a las solicitudes de este servicio.',
    },
  },
  {
    id: 'mediacion',
    nombre: 'Mediación',
    descripcion:
      'Un espacio de diálogo para abordar conflictos, acercar posiciones y explorar acuerdos con la ayuda de una persona mediadora.',
    estado: 'disponible',
  },
  {
    id: 'farmacia',
    nombre: 'Asesoramiento farmacéutico',
    descripcion:
      'Resuelve tus dudas sobre medicamentos y su uso adecuado con orientación de una persona titulada y colegiada en Farmacia.',
    estado: 'disponible',
  },
  {
    id: 'psicologia',
    nombre: 'Psicología sanitaria',
    descripcion:
      'Un futuro espacio de atención psicológica para cuidar tu bienestar emocional y abordar dificultades personales.',
    estado: 'proximamente',
    alFinal: true,
  },
];

/** Servicios en su orden definitivo: los marcados con `alFinal` siempre van detrás. */
export const servicios: Servicio[] = [...lista.filter((s) => !s.alFinal), ...lista.filter((s) => s.alFinal)];

/** Devuelve la URL solo si es una dirección web válida (http/https); si no, null. */
export function urlValida(url: string | null | undefined): string | null {
  const u = (url ?? '').trim();
  if (!u) return null;
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:' ? p.href : null;
  } catch {
    return null;
  }
}

/** Botones con destino válido (los no válidos no se muestran). */
export const botonesValidos = (b: Boton[] = []) =>
  b.map((x) => ({ ...x, url: urlValida(x.url) })).filter((x): x is Boton & { url: string } => !!x.url);

export const dosCifras = (i: number) => String(i + 1).padStart(2, '0');
