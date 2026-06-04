# 🛠️ Nave Tierra — API Backend

> **Proyecto Final — Simulación** | Grupo 04 · 4K3

API REST construida con **Express + Node.js** que expone el motor de simulación de Monte Carlo de la planta de reciclaje Nave Tierra. Consume un generador de números pseudoaleatorios (Congruencial Mixto) para producir resultados estocásticos reproducibles.

---

## Índice

1. [Endpoints](#1-endpoints)
2. [Motor de simulación](#2-motor-de-simulación)
3. [Generador de números pseudoaleatorios](#3-generador-de-números-pseudoaleatorios)
4. [Distribuciones implementadas](#4-distribuciones-implementadas)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Instalación y ejecución](#6-instalación-y-ejecución)
7. [Despliegue en Render](#7-despliegue-en-render)

---

## 1. Endpoints

### `GET /api/health`

Verifica que el servidor esté en línea.

**Respuesta:**
```json
{ "status": "ok", "timestamp": "2026-06-04T19:00:00.000Z" }
```

---

### `POST /api/simulate/naveTierra`

Ejecuta la simulación completa de 30 días y devuelve todos los resultados.

**Body (JSON):**
```json
{
  "method": "mixedCongruential",
  "seed": 12345,
  "seedWasRandom": false,
  "params": {
    "a": 1664525,
    "c": 1013904223,
    "m": 4294967296
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `method` | string | Siempre `"mixedCongruential"` |
| `seed` | number | Semilla inicial. Debe cumplir `0 ≤ seed < m` |
| `seedWasRandom` | boolean | `true` si la semilla fue generada automáticamente |
| `params.a` | number | Multiplicador del LCG |
| `params.c` | number | Incremento del LCG |
| `params.m` | number | Módulo del LCG |

**Respuesta (JSON):**
```json
{
  "method": "mixedCongruential",
  "methodName": "Congruencial Mixto",
  "seed": 12345,
  "seedWasRandom": false,
  "params": { "a": 1664525, "c": 1013904223, "m": 4294967296 },

  "dias": [ /* Array de 30 objetos, uno por día */ ],
  "resumen": { /* Totales del mes */ },
  "decisiones": { /* Umbrales superados */ },
  "grilla": [ /* Un registro por equipo procesado */ ],
  "rng": { "totalUConsumidos": 45821 }
}
```

#### Estructura de `dias[d]`

```json
{
  "dia": 1,
  "lotes": 5,
  "CS": 12, "CR": 21, "ER": 14,
  "equipos": 47,
  "PT": 423.50,
  "EF": 5, "ED": 35, "EI": 7,
  "PE": 0,
  "TA": 285000,
  "TTR": 94.3,
  "TTD": 312.0,
  "TTDD": 1042.5,
  "TT": 1354.5
}
```

#### Estructura de `resumen`

```json
{
  "TEP": 1405,
  "CS": 351, "CR": 632, "ER": 422,
  "PT": 12841.50,
  "EF": 140, "ED": 1053, "EI": 212,
  "PE": 13,
  "TA": 8520000,
  "TTR": 2810.0,
  "TTD": 9135.0,
  "TTDD": 31590.0,
  "TT": 40725.0,
  "TTR_hs": 46.83,
  "TT_hs": 678.75
}
```

#### Estructura de `decisiones`

```json
{
  "nuevoRecepcionista": false,
  "nuevoOperario": true,
  "segundoTurno": true
}
```

#### Estructura de cada registro en `grilla`

```json
{
  "idx": 1,
  "dia": 1,
  "lote": 1,
  "equipoEnLote": 1,
  "uTipo": 0.342187,
  "tipoLabel": "Switch/Router",
  "uPeso": 0.781234,
  "peso": 15.34,
  "uTR1": 0.523411,
  "uTR2": 0.198234,
  "tr": 1.92,
  "uTD": 0.612340,
  "td": 10.35,
  "uDestino": 0.734512,
  "destino": "ED",
  "destinoLabel": "Desarme",
  "uTDD": 0.445123,
  "tdd": 29.48,
  "uEficacia": 0.031247,
  "ok": true,
  "agua": 15000
}
```

**Errores posibles:**

| HTTP | Mensaje |
|------|---------|
| 400 | `"El campo 'method' es requerido."` |
| 400 | `"El campo 'seed' es requerido."` |
| 400 | `"El método 'mixedCongruential' requiere los parámetros: a, c, m."` |
| 400 | `"Método desconocido: '...'."` |

---

## 2. Motor de simulación

El motor (`src/simulation/naveTierra.js`) implementa la simulación de eventos discretos:

### Parámetros fijos del modelo

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `DIAS_LABORABLES` | 30 | Días que dura la simulación |
| `MINUTOS_POR_DIA` | 480 | Horas por turno (8 hs × 60 min) |
| `MEDIA_ENTRE_LOTES` | 80 min | Parámetro de la distribución exponencial |

### Algoritmo principal

```
Para cada día d = 1..30:
  tiempoAcum = 0
  Mientras tiempoAcum < 480:
    uArribo → exponential(80)        → tiempoEntreArribo
    tiempoAcum += tiempoEntreArribo
    Si tiempoAcum >= 480: break

    uCE → uniformInt(5, 15)          → CE equipos en este lote

    Para cada equipo e = 1..CE:
      uTR1, uTR2 → normal(2, 0.5)   → TR (recepción)
      uTipo → binomialTabla(TIPOS)   → tipo de equipo
      uPeso → uniform(0.5, 20)       → P (peso)
      uTD → uniform(3, 15)           → TD (diagnóstico)
      uDestino → binomialTabla(DEST) → destino
      Si destino == 'ED':
        uTDD → uniform(5, 60)        → TDD (desarme)
      uEficacia → binomialTabla(EFIC)→ ok / incidente
      Si ok: agua = AGUA_POR_TIPO[tipo]

  Guardar resultadosDia[d]

Calcular resumen, decisiones, grilla
```

---

## 3. Generador de números pseudoaleatorios

### Congruencial Mixto (LCG)

Implementado en `src/generators/mixedCongruential.js`.

**Fórmula recurrente:**
```
Xₙ₊₁ = (a · Xₙ + c) mod m
uₙ = Xₙ / m
```

**Parámetros:**

| Variable | Rol |
|----------|-----|
| `X₀` (seed) | Estado inicial. Debe cumplir `0 ≤ X₀ < m` |
| `a` | Multiplicador. Condiciona el "salto" entre estados |
| `c` | Incremento. Evita que el generador se atasque en 0 |
| `m` | Módulo. Define el período máximo y el rango de estados |

**Efecto de la semilla:**
- Misma semilla + mismos parámetros = misma secuencia de números → mismos resultados de simulación (reproducibilidad).
- Semilla distinta = secuencia diferente desde el primer paso → resultados distintos.

### Función `mulmod` — Multiplicación modular exacta

La multiplicación `a · Xₙ` puede superar el límite de precisión de JavaScript (`Number.MAX_SAFE_INTEGER ≈ 9 × 10¹⁵`) cuando `a` y `m` son del orden de 10⁹. Para evitar errores de redondeo sin usar `BigInt` (incompatible con `babel-preset-env`):

```javascript
// Algoritmo binary double-and-add
function mulmod(a, b, m) {
  let result = 0
  while (b > 0) {
    if (b % 2 === 1) result = (result + a) % m
    a = (a * 2) % m
    b = Math.floor(b / 2)
  }
  return result
}
```

Complejidad: O(log b). Exacto para cualquier `a, b, m ≤ 2⁵³`.

---

## 4. Distribuciones implementadas

Todas en `src/simulation/distribution.js`:

```javascript
// Exponencial: T = -media * ln(u)
exponential(media, u)

// Uniforme continua: a + (b - a) * u
uniform(a, b, u)

// Uniforme discreta: floor(a + (b - a) * u)
uniformInt(a, b, u)

// Normal por Box-Muller (consume 2 valores u):
// Z = sqrt(-2 * ln(u1)) * cos(2π * u2)
// resultado = μ + σ * Z
normal(mu, sigma, u)

// Empírica por tabla acumulada (inversión FDA):
binomialTabla(tabla, u)
```

---

## 5. Estructura del proyecto

```
PF-G04-4K3-PF-Backend/
├── index.js                      # Servidor Express: PORT, CORS, rutas
│
└── src/
    ├── .babelrc                  # babel-preset-env (transpilación ES Modules)
    │
    ├── generators/
    │   ├── index.js              # createGenerator() — factory del LCG
    │   └── mixedCongruential.js  # mulmod + algoritmo LCG
    │
    ├── simulation/
    │   ├── distribution.js       # exponential, uniform, normal, binomialTabla + tablas
    │   └── naveTierra.js         # runSimulation() — motor principal
    │
    └── routes/
        ├── simulation.js         # POST /api/simulate/naveTierra
        └── distributions.js     # Rutas auxiliares
```

---

## 6. Instalación y ejecución

```bash
# Clonar e instalar
git clone https://github.com/MauricioSor/PF-G04-4K3-PF-Backend.git
cd PF-G04-4K3-PF-Backend
npm install

# Desarrollo (con hot-reload)
npm run dev         # → http://localhost:3001

# Producción
npm start
```

**Verificar que funciona:**
```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"..."}
```

**Ejemplo de petición:**
```bash
curl -X POST http://localhost:3001/api/simulate/naveTierra \
  -H "Content-Type: application/json" \
  -d '{
    "method": "mixedCongruential",
    "seed": 12345,
    "seedWasRandom": false,
    "params": { "a": 1664525, "c": 1013904223, "m": 4294967296 }
  }'
```

---

## 7. Despliegue en Render

| Campo | Valor |
|-------|-------|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Variable de entorno** | `NODE_ENV=production` |

El servidor usa `process.env.PORT` (asignado dinámicamente por Render) con fallback a `3001` para desarrollo local.

**CORS**: configurado con `origin: '*'` (API pública sin datos sensibles). Si se necesita restringir, se puede agregar la variable `FRONTEND_URL` y ajustar la lógica en `index.js`.

> **Nota sobre el plan Free de Render**: el servicio hiberna después de 15 minutos de inactividad. La primera petición puede tardar ~30 segundos en despertar el servicio.

---

*Proyecto Final — Simulación · Grupo 04 · 4K3*
