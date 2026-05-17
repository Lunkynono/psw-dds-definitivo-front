export type AwardType = 'cash' | 'trophy' | 'recognition' | 'sponsor' | 'other';

export type Award = {
  id: number;
  evento_id?: number | null;
  competicion_id?: number | null;
  tipo: AwardType;
  descripcion: string;
  posicion: number;
  condiciones_entrega?: string | null;
};

export type AwardPayload = {
  tipo: AwardType;
  descripcion: string;
  posicion: number;
  condicionesEntrega?: string | null;
};
