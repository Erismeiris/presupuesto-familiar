# Encargo al backend: arrastre del saldo inicial

Especificación para implementar en el repo `backenpresupuesto`
(`C:\Users\erismeiris.hidalgo\Documents\backenpresupuesto`). Todo el trabajo está
en `controllers/presupuestoController.js`, `models/Presupuesto.js`,
`routes/presupuestoRoutes.js` y un fichero nuevo en `utils/`.

El esquema se sincroniza con `sequelize.sync({ alter: true })` en `src/index.js:198`,
así que las columnas nuevas se crean al arrancar. No hay migraciones versionadas;
`sql/` son scripts sueltos de un solo uso.

## Estado actual

El arrastre **ya existe**, mal hecho. `obtenerOCrear`
(`controllers/presupuestoController.js:168-222`) al crear un mes:

- busca el presupuesto de `mesAnterior(mes)` y, si existe, escribe
  `saldoInicial = resumenAnterior.saldoFinal` (líneas 172-180);
- arrastra también los `previsto` de las líneas del mes anterior (líneas 190-195);
- `calcularResumen` cierra con `saldoFinal = saldoInicial + ahorroMes` (línea 275).

Cuatro defectos a corregir:

1. **Es una foto fija.** El valor se escribe una sola vez, al crear el mes, y no se
   revisa nunca. Los meses pasados cambian a diario (importación de Excel, sync
   IMAP), así que el saldo inicial de los meses siguientes queda desfasado sin
   ninguna señal.
2. **Solo mira un mes atrás.** Si falta el mes intermedio (saltar de `2026-04` a
   `2026-09`), el saldo arranca en 0 y la cadena se rompe. Crear el mes que faltaba
   después no corrige los posteriores: **el orden de visita decide el número**.
3. **No distingue heredado de escrito a mano.** Por eso no se puede recalcular sin
   pisar la corrección del usuario, y un `saldoInicial = 0` confunde «primer mes,
   sin poner» con «heredado, y da cero».
4. **Coste innecesario.** Línea 177 llama a `calcularResumen(anterior)` completo
   —todas las líneas, movimientos, categorías y los porcentajes 50/30/20— para
   sacar un único número.

## Regla a implementar

El saldo inicial de un mes es el saldo final del anterior, **calculado en cada
lectura**, y **siempre editable a mano**. Un valor escrito a mano se respeta y
**re-ancla la cadena**: los meses posteriores heredan a partir de él.

Con `M` el mes pedido (`YYYY-MM`):

- **Ancla** = el presupuesto más reciente del usuario con
  `saldoInicialOrigen = 'manual'` y `mes < M`. Si no hay ninguno, el presupuesto
  **más antiguo** del usuario con `mes < M` (su saldo inicial es el de apertura,
  sea cual sea su origen).
- Si no existe ningún presupuesto con `mes < M` → no hay nada que heredar:
  `saldoInicialHeredado = null` y `esPrimerMes = true`.
- Si existe:
  `saldoInicialHeredado = redondear(ancla.saldoInicial + Σingresos − Σgastos)`,
  sumando por **rango de fechas** desde `<ancla.mes>-01` (incluido) hasta
  `<M>-01` (excluido), **exista o no** una fila `Presupuesto` en los meses
  intermedios.
- **Saldo inicial efectivo de `M`**: el valor guardado si
  `saldoInicialOrigen = 'manual'`; si no, `saldoInicialHeredado`, y el valor
  guardado cuando este sea `null`.

La comparación de meses es directa: `mes` es `STRING(7)` en formato `YYYY-MM`, y
su orden lexicográfico coincide con el cronológico. `date` es `DATEONLY` en
`Gastos` e `Ingreso`, así que el rango se compara con strings `YYYY-MM-DD`.

## Cambios

### 1. `models/Presupuesto.js`: dos campos

| Campo | Tipo | Notas |
|---|---|---|
| `saldoInicialOrigen` | `STRING(10)`, `allowNull: false`, `defaultValue: 'heredado'` | valores `'heredado'` \| `'manual'`, con `validate: { isIn: [['heredado', 'manual']] }` |
| `saldoInicialAjustadoEn` | `DATE`, `allowNull: true` | último ajuste manual |

**`STRING(10)` y no `ENUM`**: `sync({ alter: true })` sobre tipos ENUM de
PostgreSQL falla con frecuencia al arrancar. No uses ENUM aquí.

Cambia además `saldoInicial` de `FLOAT` a `DECIMAL(12,2)`: el arrastre suma mes
sobre mes y `FLOAT` acumula error. **Antes de darlo por bueno, arranca contra la
base real y comprueba que el `ALTER` con cast ha pasado**; si Postgres lo rechaza,
deja `FLOAT`, redondea el acumulado (no cada término) y avísalo.
`DECIMAL` vuelve de Sequelize como *string*: pasa siempre por `Number()`.

### 2. `utils/arrastreSaldo.js`: nuevo, la regla vive aquí y solo aquí

```js
/**
 * Saldo inicial heredado de un mes, según la regla del ancla.
 * @returns {Promise<{ valor: number|null, anclaMes: string|null, esPrimerMes: boolean }>}
 */
async function saldoInicialHeredado(userId, mes) { /* ... */ }
```

Dos consultas agregadas (`SUM(monto)` sobre `Gastos` y sobre `Ingreso` con
`Op.gte` / `Op.lt` en `date`), **independientes de cuántos meses haya en medio**.
No llames a `calcularResumen` desde aquí.

### 3. `getResumen`: recalcular en lectura

En `exports.getResumen` (línea 290), después de `obtenerOCrear`:

- llama a `saldoInicialHeredado(userId, mes)`;
- si `saldoInicialOrigen === 'heredado'` y el valor heredado no es `null` y
  difiere del guardado, **persiste el nuevo valor** en la fila antes de calcular
  el resumen (la columna queda como caché coherente para cualquier otro lector);
- pasa a `calcularResumen` los datos del arrastre para que rellene los campos
  nuevos de la respuesta.

Recalcular en lectura significa que **no hace falta cron, ni invalidación, ni
ganchos en los controladores de gastos e ingresos**. No los añadas.

### 4. `obtenerOCrear`: quitar el cálculo caro y cerrar la carrera

- Sustituye `calcularResumen(anterior)` (líneas 172-180) por
  `saldoInicialHeredado(userId, mes)`. La moneda se sigue copiando del mes
  anterior si existe.
- Usa `findOrCreate`, o captura `SequelizeUniqueConstraintError` y relee: hoy hace
  `findOne` y luego `create` sin protección, y dos `GET /resumen` simultáneos sobre
  un mes inexistente insertan los dos, el índice único `(userId, mes)` rechaza uno
  y sale un 500.
- **No toques el arrastre de los `previsto`** (líneas 190-195): funciona bien.

### 5. `update` (`PUT /api/presupuestos/:id`, línea 327)

- Llega `saldoInicial` → guarda el valor, `saldoInicialOrigen = 'manual'`,
  `saldoInicialAjustadoEn = new Date()`.
- Llega `saldoInicialOrigen: 'heredado'` **solo** → «restablecer al heredado»:
  recalcula con el helper, guarda el valor y pone `saldoInicialAjustadoEn = null`.
- Llegan **los dos** → `400`, es ambiguo.
- La validación numérica que ya hay (líneas 334-340) se mantiene.

### 6. Campos nuevos en la respuesta

`GET /presupuestos/resumen` y `PUT /presupuestos/:id` devuelven el mismo objeto de
`calcularResumen`. Añade estos campos **de forma aditiva**, sin tocar los que ya
hay (el frontend en producción depende de ellos):

| Campo | Tipo | Valor |
|---|---|---|
| `saldoInicialOrigen` | `'heredado' \| 'manual'` | el de la fila |
| `saldoInicialHeredado` | `number \| null` | lo que dice la cadena. **Se calcula también cuando el origen es `'manual'`** |
| `saldoInicialAjustadoEn` | `string \| null` | fecha ISO |
| `descuadre` | `number \| null` | `saldoInicial − saldoInicialHeredado`; `0` si el origen es heredado; `null` si `saldoInicialHeredado` es `null` |
| `esPrimerMes` | `boolean` | no existe ningún presupuesto del usuario con `mes < M` |

`saldoInicialHeredado` y `descuadre` son la razón de la regla del ancla con `<` en
vez de `<=`: cuando el usuario corrige un saldo heredado, la diferencia contra la
cadena **es el dinero que no ha registrado**, y el frontend lo va a mostrar.

### 7. `variacionAhorroPct` (línea 279)

Hoy es `null` salvo que `saldoInicial > 0`. Con el arrastre vivo un saldo inicial
negativo pasa a ser normal (un mes que cierra en rojo lo arrastra), y el
porcentaje se quedaría en `null` para siempre. Divide por
`Math.abs(saldoInicial)` y deja `null` solo cuando sea exactamente `0`.

### 8. Swagger

`routes/presupuestoRoutes.js` documenta hoy en `/resumen` que el mes se crea «con
el saldo final del mes anterior». Actualiza esa descripción y el `requestBody` de
`PUT /{id}` con `saldoInicialOrigen`.

## Datos existentes

Las dos columnas nuevas se crean con los valores por defecto correctos, y como el
ancla cae en el presupuesto más antiguo cuando no hay ninguno manual, **el mes más
antiguo conserva su saldo guardado sin necesidad de migración**. No hace falta
script.

Excepción: los meses **intermedios** en los que el usuario hubiera escrito el
saldo a mano se recalcularán, perdiendo esa corrección. Antes de dar el cambio por
terminado, lista los meses del usuario (`GET /api/presupuestos/meses`) y comprueba
si alguno tiene un `saldoInicial` que la cadena no reproduzca. Si aparece alguno,
**pregunta antes de sobrescribirlo**: la alternativa es marcar esas filas como
`'manual'` con un `UPDATE` en `sql/`.

## Verificación

`test-presupuesto.js` en la raíz del backend es el sitio. Datos reales cargados:
usuario `erismeiris` (`27258d29-6729-4d37-8412-029bd976631b`), mes `2026-04` con
53 gastos (3.285,35 €) y 3 ingresos (2.102,47 €), o sea `ahorroMes = -1.182,88 €`.
Llamando `S` al saldo inicial de `2026-04`:

1. `2026-05` heredado → `S − 1.182,88`.
2. `2026-09`, sin meses en medio → **también** `S − 1.182,88`, y el mismo número se
   pida septiembre antes o después de mayo. Es el defecto 2.
3. Pedir `2026-09`, importar después movimientos en `2026-06`, volver a pedir
   `2026-09` → el saldo inicial **ha cambiado**. Es el defecto 1.
4. Fijar a mano el saldo de `2026-07` → cambian `2026-08` y `2026-09`; **no**
   cambian `2026-05` ni `2026-06`. Y `descuadre` de `2026-07` sale distinto de 0.
5. Restablecer `2026-07` al heredado → vuelve al valor de la cadena y
   `saldoInicialAjustadoEn` queda a `null`.
6. El mes más antiguo del usuario → `esPrimerMes: true`,
   `saldoInicialHeredado: null`, `descuadre: null`.

## Autorización, en la misma pasada

Estos endpoints tienen agujeros preexistentes que este cambio agrava, y son el
mismo código que vas a tocar:

- `getResumen` toma `userId` de `req.query` **sin contrastarlo con `req.user.id`**.
  Ya permitía leer el presupuesto de otro; ahora ese endpoint además **crea filas y
  reescribe saldos** de un usuario arbitrario. Contrasta ambos y responde `403` si
  no coinciden.
- `update`, `getLineas`, `createLinea`, `updateLinea` y `deleteLinea` **no
  comprueban que el presupuesto o la línea sean del usuario del token**. Con la
  regla del ancla, un `PUT /api/presupuestos/:id` con un UUID ajeno no altera un
  mes: **re-ancla la cadena y cambia todos los meses siguientes** de esa persona.
  Verifica la propiedad antes de escribir.

## Fuera de alcance

- **El frontend no se toca.** Vive en otro repo (`presupuesto-familiar`) y consume
  estos campos por su cuenta. Basta con que la respuesta cumpla el punto 6.
- No calcules el saldo inicial a partir de los ingresos: el saldo es un *stock* y
  los ingresos un *flujo*; mezclarlos cuenta el mismo dinero dos veces en
  `saldoFinal = saldoInicial + ingresos − gastos`.
- No añadas un ajuste de usuario tipo «¿calcular el saldo automáticamente?». Es un
  solo campo, heredado por defecto y siempre sobrescribible.
