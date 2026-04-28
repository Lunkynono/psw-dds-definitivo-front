export type UserRole = 'admin' | 'juez' | 'participante';
export type SurveyState = 'borrador' | 'abierta' | 'programada' | 'cerrada';
export type VoterType = 'juez' | 'publico' | 'ambos';
export type CriterionType = 'numerico' | 'radio' | 'checklist' | 'rubrica' | 'comentario';

export interface Persona {
  id: string;
  nombre: string;
  correo: string;
}

export interface EventSummary {
  id: number;
  organizador_id?: string;
  nombre: string;
  lugar?: string | null;
  descripcion?: string | null;
  imagen_url?: string | null;
  created_at?: string;
}

export interface Competition {
  id: number;
  evento_id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Criterion {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: CriterionType;
  peso: number;
  rango_min?: number | null;
  rango_max?: number | null;
  max_selecciones?: number | null;
  criterio_opcion?: Array<{
    id: number;
    texto: string;
    orden: number;
    peso?: number | null;
    aspecto?: string | null;
    nivel?: string | null;
    descriptor?: string | null;
  }>;
}

export interface Survey {
  id: number;
  competicion_id?: number;
  nombre: string;
  descripcion?: string | null;
  estado: SurveyState;
  tipo_votante: VoterType;
  codigo_sala?: string | null;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  hora_reapertura?: string | null;
  competicion?: { id?: number; nombre?: string; evento_id?: number; evento?: { id?: number; nombre?: string } };
}

export interface ResultRow {
  id: number;
  encuesta_id: number;
  proyecto_id: number;
  puntaje_calculado: number;
  puntaje_manual?: number | null;
  posicion_final: number;
  votos?: number;
  proyecto?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    equipo?: { nombre: string };
  };
}
