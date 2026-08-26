import { TipoCategoria503020 } from './presupuesto.interface';

export interface Categoria {    
        "id":string,
        "nombre": string; 
        "descripcion": string;
        "public": boolean;
        "userId"?: string;
        /** Clasificación para la regla 50/30/20 (opcional, por defecto 'necesidades') */
        "tipo503020"?: TipoCategoria503020;
}
