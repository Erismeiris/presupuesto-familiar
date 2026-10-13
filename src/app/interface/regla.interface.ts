export interface Regla {
  id?: string;
  patron: string;
  categoria: string;
  tipo: 'gasto' | 'ingreso';
  confirmada: boolean;
  userId?: string;
}
