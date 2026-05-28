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
  { value: 1, label: 'Servidor (Rack/Blade)',    cumulative: 0.25 },
  { value: 2, label: 'Switch / Router Industrial', cumulative: 0.70 },
  { value: 3, label: 'Equipo de Red Hogareño',   cumulative: 1.00 },
]

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