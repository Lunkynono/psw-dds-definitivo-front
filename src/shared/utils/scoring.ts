import { Criterion } from '../types/domain';

export const TIPOS_CON_OPCIONES = ['radio', 'checklist', 'rubrica'] as const;
export const TIPOS_PUNTUABLES = ['numerico', ...TIPOS_CON_OPCIONES] as const;

export const RUBRICA_NIVELES = [
  { key: 'excelente', label: 'Excelente', factor: 1, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'bien', label: 'Bien', factor: 2 / 3, color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { key: 'regular', label: 'Regular', factor: 1 / 3, color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'mal', label: 'Mal', factor: 0, color: 'bg-red-50 border-red-200 text-red-700' }
] as const;

export type RubricaNivelKey = (typeof RUBRICA_NIVELES)[number]['key'];

export interface OpcionCriterio {
  id: number;
  texto: string;
  orden?: number;
  peso?: number | null;
  aspecto?: string | null;
  nivel?: string | null;
  descriptor?: string | null;
}

export interface AspectoRubrica {
  texto: string;
  peso?: number;
  descriptores?: Partial<Record<RubricaNivelKey, string>>;
}

const redondearPeso = (valor: number) => Math.round((Number(valor) || 0) * 10000) / 10000;

export const pesoOpcion = (opcion: OpcionCriterio | null | undefined): number => {
  const peso = Number(opcion?.peso);
  return Number.isFinite(peso) ? peso : 0;
};

export const opcionesConTexto = (opciones: OpcionCriterio[] = []) =>
  opciones.filter((o) => o.texto?.trim());

export const sumaPesosOpciones = (opciones: OpcionCriterio[] = []) =>
  opcionesConTexto(opciones).reduce((sum, opcion) => sum + pesoOpcion(opcion), 0);

export const pesosOpcionesValidos = (pesoPregunta: number, opciones: OpcionCriterio[] = []) => {
  const peso = Number(pesoPregunta);
  if (!Number.isFinite(peso) || peso <= 0) return false;
  return Math.abs(sumaPesosOpciones(opciones) - peso) < 0.0001;
};

export const ajustarPesoOpcion = (
  opciones: OpcionCriterio[],
  index: number,
  nuevoPeso: number,
  pesoPregunta: number
): OpcionCriterio[] => {
  const total = Math.max(Number(pesoPregunta) || 0, 0);
  const pesoActualizado = Math.min(Math.max(Number(nuevoPeso) || 0, 0), total);
  const indicesRestantes = opciones.map((_, i) => i).filter((i) => i !== index);
  const ultimoRestante = indicesRestantes[indicesRestantes.length - 1];
  const restantes = indicesRestantes.map((i) => opciones[i]);
  const totalRestante = Math.max(total - pesoActualizado, 0);
  const sumaRestantes = restantes.reduce((sum, opcion) => sum + pesoOpcion(opcion), 0);

  let usados = 0;
  return opciones.map((opcion, i) => {
    if (i === index) return { ...opcion, peso: redondearPeso(pesoActualizado) };
    const peso =
      i === ultimoRestante
        ? totalRestante - usados
        : sumaRestantes > 0
          ? (pesoOpcion(opcion) / sumaRestantes) * totalRestante
          : totalRestante / Math.max(restantes.length, 1);
    usados += peso;
    return { ...opcion, peso: redondearPeso(peso) };
  });
};

export const reescalarPesosOpciones = (
  opciones: OpcionCriterio[],
  nuevoPesoPregunta: number
): OpcionCriterio[] => {
  const total = Math.max(Number(nuevoPesoPregunta) || 0, 0);
  if (opciones.length === 0) return opciones;
  const sumaActual = opciones.reduce((sum, opcion) => sum + pesoOpcion(opcion), 0);
  let usados = 0;
  return opciones.map((opcion, index) => {
    const peso =
      index === opciones.length - 1
        ? total - usados
        : sumaActual > 0
          ? (pesoOpcion(opcion) / sumaActual) * total
          : total / opciones.length;
    usados += peso;
    return { ...opcion, peso: redondearPeso(peso) };
  });
};

export const construirOpcionesRubrica = (
  aspectos: AspectoRubrica[],
  pesoPregunta = 1
): OpcionCriterio[] => {
  const aspectosValidos = aspectos.filter((a) => a.texto?.trim());
  const pesoPorAspecto =
    aspectosValidos.length > 0 ? (Number(pesoPregunta) || 0) / aspectosValidos.length : 0;

  return aspectosValidos.flatMap((aspecto, aspectoIndex) =>
    RUBRICA_NIVELES.map((nivel, nivelIndex) => ({
      id: 0,
      texto: nivel.label,
      aspecto: aspecto.texto.trim(),
      nivel: nivel.key,
      descriptor: aspecto.descriptores?.[nivel.key]?.trim() || null,
      peso: redondearPeso((Number(aspecto.peso) || pesoPorAspecto) * nivel.factor),
      orden: aspectoIndex * RUBRICA_NIVELES.length + nivelIndex
    }))
  );
};

export const agruparRubrica = (opciones: OpcionCriterio[] = []) => {
  const ordenadasOriginales = [...opciones].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const faltaEstructura = ordenadasOriginales.some((op) => !op.aspecto || !op.nivel);

  const ordenadas = ordenadasOriginales.map((opcion, index) => {
    const nivelPorTexto = RUBRICA_NIVELES.find(
      (nivel) => opcion.texto?.toLowerCase() === nivel.label.toLowerCase()
    );
    return {
      ...opcion,
      aspecto: faltaEstructura
        ? `Aspecto ${Math.floor(index / RUBRICA_NIVELES.length) + 1}`
        : opcion.aspecto,
      nivel: faltaEstructura
        ? RUBRICA_NIVELES[index % RUBRICA_NIVELES.length]?.key
        : opcion.nivel || nivelPorTexto?.key
    };
  });

  const grupos = ordenadas.reduce<Record<string, typeof ordenadas>>((acc, opcion) => {
    const aspecto = opcion.aspecto ?? '';
    if (!acc[aspecto]) acc[aspecto] = [];
    acc[aspecto].push(opcion);
    return acc;
  }, {});

  return Object.entries(grupos).map(([aspecto, opcionesAspecto]) => ({
    aspecto,
    opciones: RUBRICA_NIVELES.map(
      (nivel) =>
        opcionesAspecto.find((op) => op.nivel === nivel.key) ||
        opcionesAspecto.find((op) => op.texto?.toLowerCase() === nivel.label.toLowerCase())
    ).filter(Boolean) as OpcionCriterio[]
  }));
};

export const calcularValorOpciones = (
  criterio: Pick<Criterion, 'tipo' | 'criterio_opcion'> | null | undefined,
  opcionIds: number[] = []
): number | null => {
  const ids = Array.isArray(opcionIds) ? opcionIds.map(Number) : [];
  if (ids.length === 0) return null;

  const opciones = criterio?.criterio_opcion ?? [];
  const seleccionadas = opciones.filter((op) => ids.includes(Number(op.id)));
  if (seleccionadas.length === 0) return null;

  const total = seleccionadas.reduce((sum, op) => sum + pesoOpcion(op), 0);
  return ['checklist', 'rubrica'].includes(criterio?.tipo ?? '') ? total : total / seleccionadas.length;
};

export const calcularPuntajePonderado = (
  criterios: Criterion[],
  respuestas: Array<{ criterio_id: number; valor_numerico?: number | null; opciones_ids?: number[] }>
): number | null => {
  const criteriosPuntuables = (criterios ?? []).filter((c) =>
    (TIPOS_PUNTUABLES as readonly string[]).includes(c?.tipo)
  );
  const sumaPesos = criteriosPuntuables.reduce((sum, c) => sum + (Number(c.peso) || 0), 0);

  if (criteriosPuntuables.length === 0 || sumaPesos <= 0) return null;

  let suma = 0;

  criteriosPuntuables.forEach((c) => {
    const vals = (respuestas ?? []).filter((r) => r.criterio_id === c.id);
    if (vals.length === 0) return;

    const valores = vals
      .map((r) => {
        if (c.tipo === 'numerico') {
          const valor = Number(r.valor_numerico);
          return Number.isFinite(valor) ? valor : null;
        }
        return calcularValorOpciones(c, r.opciones_ids ?? []);
      })
      .filter((v): v is number => v != null);

    if (valores.length > 0) {
      const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
      suma += media * (Number(c.peso) || 0);
    }
  });

  return suma / sumaPesos;
};
