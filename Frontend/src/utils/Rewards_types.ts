export interface RecompensaCatalogo {
  Id_recompensa: number;
  nombre_recompensa: string;
  descripcion: string;
  Id_icono?: number | null;
  Id_desbloqueado?: number | null;
  nombre_icono?: string;
  tipo_recompensa?: string;
  coleccion?: 'V1' | 'V2' | 'HITO';
  estaDesbloqueado: boolean;
  fecha_obtencion?: string | null;
}
