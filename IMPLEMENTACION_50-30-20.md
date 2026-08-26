# Implementación de la Regla 50/30/20

Este documento explica cómo implementar el cálculo de la regla 50/30/20 en el backend.

## 1. Base de Datos - Agregar campo a Categorías

Agrega un campo `tipo503020` a la tabla de categorías:

```sql
ALTER TABLE categorias 
ADD COLUMN tipo503020 VARCHAR(20) DEFAULT 'necesidades' 
CHECK (tipo503020 IN ('necesidades', 'deseos', 'ahorro'));
```

### Ejemplos de clasificación:

**Necesidades (50%):**
- Vivienda (alquiler/hipoteca)
- Servicios básicos (agua, luz, gas)
- Alimentación
- Transporte
- Seguros
- Salud básica

**Deseos (30%):**
- Entretenimiento
- Restaurantes
- Streaming
- Hobbies
- Viajes
- Compras no esenciales
- Gym

**Ahorro (20%):**
- Ahorro general
- Inversiones
- Fondo de emergencia
- Jubilación

## 2. Backend - Modificar el endpoint de resumen

En el endpoint `GET /presupuestos/resumen`, agrega el cálculo de los porcentajes:

```typescript
// Ejemplo en TypeScript/Node.js

interface ResumenMensual {
  presupuestoId: string;
  mes: string;
  moneda: string;
  saldoInicial: number;
  saldoFinal: number;
  ahorroMes: number;
  ahorroPrevisto: number;
  variacionAhorroPct: number | null;
  gastos: BloqueResumen;
  ingresos: BloqueResumen;
  // Nuevos campos
  porcentajeNecesidades: number;
  porcentajeDeseos: number;
  porcentajeAhorro: number;
}

async function calcularResumen(userId: string, mes: string): Promise<ResumenMensual> {
  // ... código existente para calcular gastos e ingresos ...
  
  // Obtener todas las líneas de gasto con su tipo503020
  const lineasGastos = await obtenerLineasGastos(presupuestoId);
  
  // Agrupar gastos reales por tipo
  const gastosPorTipo = {
    necesidades: 0,
    deseos: 0,
    ahorro: 0
  };
  
  for (const linea of lineasGastos) {
    const tipo = linea.tipo503020 || 'necesidades'; // Por defecto necesidades
    gastosPorTipo[tipo] += linea.real; // Usar el gasto REAL del mes
  }
  
  // Calcular total de gastos
  const totalGastos = gastosPorTipo.necesidades + gastosPorTipo.deseos + gastosPorTipo.ahorro;
  
  // Calcular porcentajes
  const porcentajeNecesidades = totalGastos > 0 
    ? (gastosPorTipo.necesidades / totalGastos) * 100 
    : 0;
  const porcentajeDeseos = totalGastos > 0 
    ? (gastosPorTipo.deseos / totalGastos) * 100 
    : 0;
  const porcentajeAhorro = totalGastos > 0 
    ? (gastosPorTipo.ahorro / totalGastos) * 100 
    : 0;
  
  return {
    // ... campos existentes ...
    porcentajeNecesidades,
    porcentajeDeseos,
    porcentajeAhorro
  };
}
```

## 3. Backend - Incluir tipo503020 en LineaResumen

Cuando construyas cada `LineaResumen`, incluye el campo `tipo503020`:

```typescript
interface LineaResumen {
  lineaId: string | null;
  categoriaId: string | null;
  nombre: string;
  previsto: number;
  real: number;
  diferencia: number;
  presupuestada: boolean;
  tipo503020?: 'necesidades' | 'deseos' | 'ahorro'; // Nuevo campo
}

// Al construir las líneas:
const linea: LineaResumen = {
  lineaId: categoria.lineaId,
  categoriaId: categoria.id,
  nombre: categoria.nombre,
  previsto: categoria.previsto,
  real: calcularGastoReal(categoria.id, mes),
  diferencia: categoria.previsto - real,
  presupuestada: categoria.previsto > 0,
  tipo503020: categoria.tipo503020 || 'necesidades' // Incluir desde la BD
};
```

## 4. UI - Permitir clasificar categorías

Necesitarás crear una interfaz donde el usuario pueda asignar cada categoría a uno de los tres tipos:

```typescript
// En el componente de ajustes o categorías
guardarClasificacion(categoriaId: string, tipo503020: 'necesidades' | 'deseos' | 'ahorro') {
  this.http.put(`/api/categorias/${categoriaId}`, { tipo503020 }).subscribe(
    () => this.recargarCategorias()
  );
}
```

## 5. Migración de datos existentes

Para clasificar las categorías existentes, puedes ejecutar:

```sql
-- Clasificar categorías comunes como necesidades
UPDATE categorias SET tipo503020 = 'necesidades' 
WHERE nombre IN ('Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Seguros', 'Servicios');

-- Clasificar como deseos
UPDATE categorias SET tipo503020 = 'deseos' 
WHERE nombre IN ('Entretenimiento', 'Restaurantes', 'Compras', 'Ocio', 'Streaming');

-- Clasificar como ahorro
UPDATE categorias SET tipo503020 = 'ahorro' 
WHERE nombre IN ('Ahorro', 'Inversiones', 'Jubilación');
```

## 6. Validación

Para verificar que funciona correctamente:

1. Los porcentajes deberían sumar aproximadamente 100%
2. Los porcentajes solo incluyen gastos (no ingresos)
3. Se usa el gasto REAL del mes, no el previsto

## Frontend ya actualizado ✅

El frontend ya está preparado para:
- Mostrar los porcentajes en la sección "Distribución 50/30/20"
- Recibir el campo `tipo503020` en las interfaces
- Manejar valores opcionales (mostrará 0% si el backend no los envía aún)
