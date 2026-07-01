import { createMixedCongruential, DEFAULT_LCG_PARAMS } from './mixedCongruential.js'

export const GENERATOR_METHODS = {
  mixedCongruential: 'Congruencial Mixto',
}

/**
 * Crea un generador de números pseudoaleatorios (Congruencial Mixto).
 *
 * Los parámetros a, c y m son opcionales: si no se proveen (o el objeto params
 * está vacío), se utilizan los valores recomendados de DEFAULT_LCG_PARAMS,
 * que cumplen el Teorema de Hull-Dobell y garantizan período máximo.
 *
 * @param {string} method   - Debe ser 'mixedCongruential'
 * @param {number} seed     - Semilla inicial (0 ≤ seed < m)
 * @param {object} [params] - { a?, c?, m? } — todos opcionales
 * @returns {{ next: () => number, generate: (n: number) => number[], name: string, params: object }}
 */
export function createGenerator(method, seed, params = {}) {
  if (method !== 'mixedCongruential') {
    throw new Error(
      `Método desconocido: "${method}". El único método disponible es: mixedCongruential`
    )
  }

  const a = params.a != null && !isNaN(Number(params.a)) ? Number(params.a) : DEFAULT_LCG_PARAMS.a
  const c = params.c != null && !isNaN(Number(params.c)) ? Number(params.c) : DEFAULT_LCG_PARAMS.c
  const m = params.m != null && !isNaN(Number(params.m)) ? Number(params.m) : DEFAULT_LCG_PARAMS.m

  return createMixedCongruential(seed, a, c, m)
}

export { DEFAULT_LCG_PARAMS }
