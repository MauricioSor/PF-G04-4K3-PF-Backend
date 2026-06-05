// Valor crítico Z para alpha=0.05 (bilateral)
const Z_CRITICO = 1.96

// Tabla Chi-cuadrado: chi2Critico[gl] para alpha=0.05
const CHI2_CRITICO = {
  9:   16.919,  // prueba frecuencia (10 intervalos → 9 gl)
  90:  113.145, // prueba serie (10x10 celdas → 99 gl, approx con 90)
  99:  123.225,
  5:   11.070,  // corridas (6 longitudes → 5 gl)
}

/**
 * Extrae todos los u's de la grilla de simulación.
 * @param {Array} grilla
 * @returns {number[]}
 */
export function extraerUs(grilla) {
  const us = []
  for (const r of grilla) {
    us.push(r.uTipo, r.uPeso, r.uTR1, r.uTR2, r.uTD, r.uDestino, r.uEficacia)
    if (r.uTDD != null) us.push(r.uTDD)
    if (r.uPeso2 != null) us.push(r.uPeso2)
  }
  return us.filter(v => typeof v === 'number' && !isNaN(v))
}

/** Prueba de Promedios: H0: μ = 0.5 */
export function pruebaPromedios(us) {
  const n = us.length
  const media = us.reduce((a, b) => a + b, 0) / n
  const z0 = ((media - 0.5) * Math.sqrt(n)) / Math.sqrt(1 / 12)
  const aprueba = Math.abs(z0) < Z_CRITICO
  return {
    nombre: 'Prueba de Promedios',
    n,
    media: parseFloat(media.toFixed(6)),
    z0: parseFloat(z0.toFixed(4)),
    zCritico: Z_CRITICO,
    aprueba,
    detalle: `|Z₀| = ${Math.abs(z0).toFixed(4)} ${aprueba ? '<' : '≥'} Z_c = ${Z_CRITICO}`,
  }
}

/** Prueba de Frecuencia (Chi-cuadrado): uniformidad en 10 subintervalos */
export function pruebaFrecuencia(us, k = 10) {
  const n = us.length
  const fo = new Array(k).fill(0)
  for (const u of us) {
    const i = Math.min(k - 1, Math.floor(u * k))
    fo[i]++
  }
  const fe = n / k
  const chi2 = fo.reduce((acc, f) => acc + Math.pow(f - fe, 2) / fe, 0)
  const gl = k - 1
  const chi2Critico = CHI2_CRITICO[gl] ?? 16.919
  const aprueba = chi2 < chi2Critico
  return {
    nombre: 'Prueba de Frecuencia (χ²)',
    n,
    k,
    frecuenciasObservadas: fo,
    frecuenciaEsperada: parseFloat(fe.toFixed(2)),
    chi2: parseFloat(chi2.toFixed(4)),
    chi2Critico,
    gl,
    aprueba,
    detalle: `χ² = ${chi2.toFixed(4)} ${aprueba ? '<' : '≥'} χ²_c(${gl}) = ${chi2Critico}`,
  }
}

/** Prueba de Kolmogorov-Smirnov: compara F_n(x) con la uniforme */
export function pruebaKS(us) {
  const n = us.length
  const ordenados = [...us].sort((a, b) => a - b)
  let Dmas = 0
  let Dmenos = 0
  for (let i = 0; i < n; i++) {
    const Fn = (i + 1) / n
    const FnPrev = i / n
    Dmas   = Math.max(Dmas,   Fn - ordenados[i])
    Dmenos = Math.max(Dmenos, ordenados[i] - FnPrev)
  }
  const D = Math.max(Dmas, Dmenos)
  // Para n > 100: d_critico ≈ 1.36 / sqrt(n)
  const dCritico = n > 100 ? 1.36 / Math.sqrt(n) : 0.136
  const aprueba = D < dCritico
  return {
    nombre: 'Prueba de Kolmogorov-Smirnov',
    n,
    D: parseFloat(D.toFixed(6)),
    dCritico: parseFloat(dCritico.toFixed(6)),
    aprueba,
    detalle: `D = ${D.toFixed(6)} ${aprueba ? '<' : '≥'} d_c = ${dCritico.toFixed(6)}`,
  }
}

/** Prueba de Corridas arriba/abajo de la media */
export function pruebaCorridas(us) {
  const n = us.length
  // Construir secuencia binaria (1 si u >= 0.5, 0 si u < 0.5)
  const seq = us.map(u => (u >= 0.5 ? 1 : 0))

  // Contar corridas por longitud (máx. longitud 6)
  const MAX_L = 6
  const fo = new Array(MAX_L).fill(0)
  let i = 0
  while (i < n) {
    let len = 1
    while (i + len < n && seq[i + len] === seq[i]) len++
    fo[Math.min(len, MAX_L) - 1]++
    i += len
  }

  // Frecuencias esperadas: Fe(l) = (n - l + 3) / 2^(l+1)
  const fe = Array.from({ length: MAX_L }, (_, l) => (n - (l + 1) + 3) / Math.pow(2, l + 2))

  // Chi-cuadrado (solo celdas con Fe >= 5 para validez)
  let chi2 = 0
  for (let l = 0; l < MAX_L; l++) {
    if (fe[l] >= 1) chi2 += Math.pow(fo[l] - fe[l], 2) / fe[l]
  }

  const gl = MAX_L - 1
  const chi2Critico = CHI2_CRITICO[gl] ?? 11.070
  const aprueba = chi2 < chi2Critico
  return {
    nombre: 'Prueba de Corridas',
    n,
    frecuenciasObservadas: fo,
    frecuenciasEsperadas: fe.map(v => parseFloat(v.toFixed(2))),
    chi2: parseFloat(chi2.toFixed(4)),
    chi2Critico,
    gl,
    aprueba,
    detalle: `χ² = ${chi2.toFixed(4)} ${aprueba ? '<' : '≥'} χ²_c(${gl}) = ${chi2Critico}`,
  }
}

/**
 * Ejecuta todas las pruebas y devuelve un resumen.
 * @param {Array} grilla - Grilla de simulación con los u's
 * @returns {{ pruebas: object[], aprobadas: number, total: number, us: number[] }}
 */
export function runPruebasEstadisticas(grilla) {
  const us = extraerUs(grilla)
  if (us.length < 30) {
    return { error: 'Muestra insuficiente para ejecutar pruebas estadísticas.', us: [] }
  }

  const pruebas = [
    pruebaPromedios(us),
    pruebaFrecuencia(us),
    pruebaKS(us),
    pruebaCorridas(us),
  ]

  const aprobadas = pruebas.filter(p => p.aprueba).length

  return {
    n: us.length,
    aprobadas,
    total: pruebas.length,
    pruebas,
  }
}
