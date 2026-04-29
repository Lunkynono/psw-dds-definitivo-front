const pad = (value: number) => String(value).padStart(2, '0');
const YEAR_RE = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

export const normalizarDatetimeLocalYear = (value: string): string => {
  if (!value) return '';
  const match = value.match(YEAR_RE);
  if (!match) return value;
  return `${match[1].slice(0, 4)}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
};

export const isoToDatetimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const nowDatetimeLocal = (): string => {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 1);
  return isoToDatetimeLocal(date.toISOString());
};

export const datetimeLocalMasMinutos = (value: string, minutes = 1): string => {
  if (!value) return nowDatetimeLocal();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowDatetimeLocal();
  date.setMinutes(date.getMinutes() + minutes);
  return isoToDatetimeLocal(date.toISOString());
};

export const limitarDatetimeLocal = (value: string, min: string): string => {
  const normalizado = normalizarDatetimeLocalYear(value);
  if (!normalizado) return '';
  if (!min) return normalizado;
  return normalizado < min ? min : normalizado;
};

export const DATETIME_INPUT_CLASS =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 invalid:text-gray-400 invalid:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export const datetimeLocalToIso = (value: string): string | null => {
  const normalizado = normalizarDatetimeLocalYear(value);
  if (!normalizado) return null;
  const date = new Date(normalizado);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const validarHorarioEncuesta = ({
  apertura,
  cierre,
  editarApertura = true
}: {
  apertura: string;
  cierre: string;
  editarApertura?: boolean;
}): string => {
  const ahora = new Date();
  const aperturaNormalizada = normalizarDatetimeLocalYear(apertura);
  const cierreNormalizado = normalizarDatetimeLocalYear(cierre);
  const aperturaDate = aperturaNormalizada ? new Date(aperturaNormalizada) : null;
  const cierreDate = cierreNormalizado ? new Date(cierreNormalizado) : null;

  if (apertura && aperturaDate && Number.isNaN(aperturaDate.getTime())) {
    return 'La hora de apertura no es válida.';
  }
  if (cierre && cierreDate && Number.isNaN(cierreDate.getTime())) {
    return 'La hora de cierre no es válida.';
  }
  if (editarApertura && aperturaDate && aperturaDate <= ahora) {
    return 'La hora de apertura debe ser futura. Déjala vacía si quieres abrir ahora.';
  }
  if (cierreDate && cierreDate <= ahora) {
    return 'La hora de cierre debe ser futura.';
  }
  if (editarApertura && aperturaDate && cierreDate && cierreDate <= aperturaDate) {
    return 'El cierre debe ser posterior a la apertura.';
  }
  return '';
};

export const formatFechaLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const etiquetaApertura = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso) <= new Date() ? 'Abierta' : 'Abre';
};

export const etiquetaAperturaEncuesta = (encuesta: {
  hora_apertura?: string | null;
  hora_reapertura?: string | null;
}): string => {
  if (encuesta.hora_reapertura) return 'Reabierta';
  return encuesta.hora_apertura ? etiquetaApertura(encuesta.hora_apertura) : 'Abre';
};

export const etiquetaCierre = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso) <= new Date() ? 'Cerrada' : 'Cierra';
};
