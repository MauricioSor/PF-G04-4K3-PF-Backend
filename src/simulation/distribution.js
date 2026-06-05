export function exponential(media, u) {
  const val = u()
  if (val <= 0) return 0
  return -media * Math.log(val)
}

export function uniform(a, b, u) {
  return a + (b - a) * u()
}

export function uniformInt(a, b, u) {
  return Math.floor(a + (b - a) * u())
}

export function normal(mu, sigma, u) {
  let u1, u2
  // Evitar log(0)
  do { u1 = u() } while (u1 <= 0)
  do { u2 = u() } while (u2 <= 0)
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mu + sigma * z
}

export function binomialTabla(tabla, u) {
  const val = u()
  for (const fila of tabla) {
    if (val <= fila.cumulative) return fila.value
  }
  return tabla[tabla.length - 1].value
}

/** Tabla para tipo de dispositivo */
export const TABLA_TIPO_DISPOSITIVO = [
  { value: 1, label: 'Servidor (Rack/Blade)',      cumulative: 0.25 },
  { value: 2, label: 'Switch / Router Industrial', cumulative: 0.70 },
  { value: 3, label: 'Equipo de Red Hogareño',     cumulative: 1.00 },
]

/**
 * Calcula el peso de un equipo según su tipo y el/los números aleatorios u.
 * Fórmulas del DFD V2:
 *   Tipo 1 (Servidor):      PS  = 15 + 15·u        → Uniform(15, 30)
 *   Tipo 2 (Switch/Router): PR  = 3  +  5·u        → Uniform(3, 8)
 *   Tipo 3 (Hogareño):      PER = Normal(0.5, 0.2) → se necesitan 2 u's (Box-Muller)
 *
 * @param {number} tipo - 1, 2 o 3
 * @param {function} u  - función que devuelve el próximo número aleatorio en [0,1)
 * @returns {{ peso: number, u1: number, u2: number|null }}
 */
export function pesoEquipo(tipo, u) {
  const u1 = u()
  if (tipo === 1) {
    // PS = 15 + 15·u  → Uniform(15, 30)
    return { peso: 15 + 15 * u1, u1, u2: null }
  } else if (tipo === 2) {
    // PR = 3 + 5·u  → Uniform(3, 8)
    return { peso: 3 + 5 * u1, u1, u2: null }
  } else {
    // PER = Normal(0.5, 0.2)  
    const u2 = u()
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2)
    const peso = Math.max(0.01, 0.5 + 0.2 * z)
    return { peso, u1, u2 }
  }
}

/** Tabla para destino del equipo */
export const TABLA_DESTINO = [
  { value: 'EF', label: 'Reutilización (Funcional)',  cumulative: 0.10 },
  { value: 'ED', label: 'Desarme',                    cumulative: 0.85 },
  { value: 'EI', label: 'Disposición Final',          cumulative: 1.00 },
]

/** Tabla para eficacia del procesamiento */
export const TABLA_EFICACIA = [
  { value: 'OK',        label: 'Procesado Correctamente',     cumulative: 0.9905 },
  { value: 'INCIDENTE', label: 'Incidente de Contaminación',  cumulative: 1.0000 },
]

/** Litros de agua evitados por tipo de equipo procesado correctamente */
export const AGUA_POR_TIPO = {
  1: 50000,  // Servidor
  2: 15000,  // Switch/Router
  3: 3000,   // Hogareño
}