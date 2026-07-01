/**
 * Parámetros recomendados por defecto para el Generador Congruencial Mixto.
 * Derivados de la implementación de glibc (GNU C Library).
 * Cumplen el Teorema de Hull-Dobell → período máximo igual a m.
 *
 *   m = 2³¹ = 2,147,483,648
 *   a = 1,103,515,245   (a−1 divisible por 4 y por todos los factores primos de m)
 *   c = 12,345           (MCD(c, m) = 1, c es impar)
 */
export const DEFAULT_LCG_PARAMS = {
  a: 1_103_515_245,
  c: 12_345,
  m: 2_147_483_648, // 2^31
}

/**
 * Calcula el MCD de dos enteros mediante el algoritmo de Euclides.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function gcd(x, y) {
  x = Math.abs(x)
  y = Math.abs(y)
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x
}

/**
 * Devuelve los factores primos únicos de n.
 * @param {number} n
 * @returns {number[]}
 */
function primeFactors(n) {
  const factors = new Set()
  let d = 2
  while (d * d <= n) {
    while (n % d === 0) { factors.add(d); n = Math.floor(n / d) }
    d++
  }
  if (n > 1) factors.add(n)
  return [...factors]
}

/**
 * Valida que los parámetros (a, c, m) cumplan:
 *   1. Rangos básicos: m >= 2, 1 <= a < m, 1 <= c < m.
 *   2. Condición 1 Hull-Dobell: MCD(c, m) = 1.
 *   3. Condición 2 Hull-Dobell: (a−1) divisible por todos los factores primos de m.
 *   4. Condición 3 Hull-Dobell: si 4 | m, entonces 4 | (a−1).
 *
 * @param {number} a - Multiplicador
 * @param {number} c - Incremento
 * @param {number} m - Módulo
 * @throws {Error} Si alguna condición no se cumple.
 */
export function validateLCGParams(a, c, m) {
  // Rangos básicos
  if (!Number.isFinite(m) || m < 2) {
    throw new Error(`Módulo inválido: m debe ser un entero ≥ 2. Se recibió m = ${m}.`)
  }
  if (!Number.isFinite(a) || a < 1 || a >= m) {
    throw new Error(`Multiplicador inválido: a debe satisfacer 1 ≤ a < m (${m}). Se recibió a = ${a}.`)
  }
  if (!Number.isFinite(c) || c < 1 || c >= m) {
    throw new Error(`Incremento inválido: c debe satisfacer 1 ≤ c < m (${m}). Se recibió c = ${c}.`)
  }

  // Condición 1 — MCD(c, m) = 1
  if (gcd(c, m) !== 1) {
    throw new Error(
      `Período no máximo: MCD(c, m) debe ser 1 (Condición 1 de Hull-Dobell). ` +
      `MCD(${c}, ${m}) = ${gcd(c, m)}.`
    )
  }

  // Condición 2 — (a−1) divisible por todos los factores primos de m
  const factors = primeFactors(m)
  for (const p of factors) {
    if ((a - 1) % p !== 0) {
      throw new Error(
        `Período no máximo: (a−1) debe ser divisible por todos los factores primos de m ` +
        `(Condición 2 de Hull-Dobell). Factor primo ${p} de m=${m} no divide a (a−1)=${a - 1}.`
      )
    }
  }

  // Condición 3 — si 4 | m, entonces 4 | (a−1)
  if (m % 4 === 0 && (a - 1) % 4 !== 0) {
    throw new Error(
      `Período no máximo: como 4 divide a m=${m}, entonces 4 debe dividir a (a−1)=${a - 1} ` +
      `(Condición 3 de Hull-Dobell).`
    )
  }
}

/**
 * Multiplicación modular segura usando BigInt para evitar pérdida de precisión
 * con módulos grandes (m > 2²⁶ ≈ 67 millones).
 *
 * @param {number} a
 * @param {number} b
 * @param {number} m
 * @returns {number}
 */
function mulmod(a, b, m) {
  return Number((BigInt(a) * BigInt(b)) % BigInt(m))
}

/**
 * Crea un Generador Congruencial Mixto (LCG).
 *
 * Fórmula: Xₙ₊₁ = (a · Xₙ + c) mod m
 *          Uₙ    = Xₙ / m   →  Uₙ ∈ [0, 1)
 *
 * @param {number} seed  - Semilla inicial X₀. Debe satisfacer 0 ≤ seed < m.
 *                         ⚠️ Semilla 0 es matemáticamente válida pero produce siempre
 *                         X₁ = c mod m como primer valor; cualquier corrida con seed=0
 *                         y los mismos parámetros generará la misma secuencia.
 * @param {number} [a]   - Multiplicador. Si se omite, usa DEFAULT_LCG_PARAMS.a.
 * @param {number} [c]   - Incremento.    Si se omite, usa DEFAULT_LCG_PARAMS.c.
 * @param {number} [m]   - Módulo.        Si se omite, usa DEFAULT_LCG_PARAMS.m.
 * @returns {{ name, seed, params, next, generate }}
 */
export function createMixedCongruential(
  seed,
  a = DEFAULT_LCG_PARAMS.a,
  c = DEFAULT_LCG_PARAMS.c,
  m = DEFAULT_LCG_PARAMS.m,
) {
  a = Math.round(Math.abs(a))
  c = Math.round(Math.abs(c))
  m = Math.round(Math.abs(m))

  // Validar parámetros antes de crear el generador
  validateLCGParams(a, c, m)

  let x = Math.abs(Math.round(seed)) % m

  return {
    name: 'Congruencial Mixto',
    seed,
    params: { a, c, m },

    next() {
      x = (mulmod(a, x, m) + c) % m
      return x / m
    },

    generate(count) {
      return Array.from({ length: count }, () => this.next())
    },
  }
}
