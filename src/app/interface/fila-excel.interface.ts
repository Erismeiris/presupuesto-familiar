/** Fila normalizada procedente de la importación de Excel/CSV. */
export interface FilaExcel {
  descripcion: string;
  monto: number;
  date: string;
  categoriaId?: string;
  categoriaNombre?: string;
}
