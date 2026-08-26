import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Categoria } from '../interface/categoria';

export interface FilaExcel {
  descripcion: string;
  monto: number;
  date: string;
  categoriaId?: string;
  categoriaNombre?: string;
}

const LEARNING_KEY = 'pf_merchant_categories';

@Injectable({ providedIn: 'root' })
export class OpenaiService {
  private readonly endpoint = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  /** Devuelve el mapa aprendido: descripcion.lower → categoriaId */
  getAprendizaje(): Map<string, string> {
    try {
      const raw = localStorage.getItem(LEARNING_KEY);
      return raw ? new Map(Object.entries(JSON.parse(raw))) : new Map();
    } catch {
      return new Map();
    }
  }

  /** Persiste nuevas asociaciones descripcion → categoriaId */
  guardarAprendizaje(nuevas: Map<string, string>): void {
    const actual = this.getAprendizaje();
    nuevas.forEach((v, k) => actual.set(k.toLowerCase(), v));
    localStorage.setItem(LEARNING_KEY, JSON.stringify(Object.fromEntries(actual)));
  }

  /**
   * Clasifica filas de Excel usando el aprendizaje local primero y
   * enviando solo las desconocidas a OpenAI.
   */
  clasificar(filas: FilaExcel[], categorias: Categoria[]): Observable<FilaExcel[]> {
    const aprendizaje = this.getAprendizaje();

    // Aplicar aprendizaje local
    const conCache = filas.map(f => {
      const catId = aprendizaje.get(f.descripcion.toLowerCase());
      if (catId) {
        const cat = categorias.find(c => c.id === catId);
        return { ...f, categoriaId: catId, categoriaNombre: cat?.nombre ?? '' };
      }
      return { ...f };
    });

    // Filas que necesitan clasificación de IA
    const sinClasificar = conCache.filter(f => !f.categoriaId);
    if (!sinClasificar.length || !environment.openaiApiKey) {
      return of(conCache);
    }

    const nombresCategoria = categorias.map(c => c.nombre).join(', ');
    const listaGastos = sinClasificar
      .map((f, i) => `${i}. "${f.descripcion}" (${f.monto}€)`)
      .join('\n');

    const prompt = `Clasifica cada gasto en UNA de estas categorías: ${nombresCategoria}.
Responde SOLO con JSON válido (array sin texto extra): [{"i":0,"cat":"NombreCategoria"}, ...]

Gastos:
${listaGastos}`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    };

    return this.http.post<any>(this.endpoint, body, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${environment.openaiApiKey}`,
        'Content-Type': 'application/json'
      })
    }).pipe(
      map(resp => {
        const raw = resp.choices?.[0]?.message?.content ?? '{}';
        let lista: { i: number; cat: string }[] = [];
        try {
          const parsed = JSON.parse(raw);
          lista = Array.isArray(parsed) ? parsed : (parsed.result ?? parsed.data ?? []);
        } catch { lista = []; }

        lista.forEach(({ i, cat }) => {
          const fila = sinClasificar[i];
          if (!fila) return;
          const categoria = categorias.find(c => c.nombre.toLowerCase() === cat.toLowerCase());
          if (categoria) {
            fila.categoriaId = categoria.id;
            fila.categoriaNombre = categoria.nombre;
          }
        });

        // Asignar "Otros" a las que no se clasificaron
        const catOtros = categorias.find(c => c.nombre.toLowerCase() === 'otros');
        sinClasificar.forEach(f => {
          if (!f.categoriaId && catOtros) {
            f.categoriaId = catOtros.id;
            f.categoriaNombre = catOtros.nombre;
          }
        });

        return conCache;
      }),
      catchError(() => of(conCache))
    );
  }
}
