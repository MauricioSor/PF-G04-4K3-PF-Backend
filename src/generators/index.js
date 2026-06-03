import { createMixedCongruential } from './mixedCongruential.js'

export const GENERATOR_METHODS = {
  mixedCongruential: 'Congruencial Mixto',
}

function requireParams(params, keys, methodName) {
  const missing = []
  for (const key of keys) {
    const val = params[key]
    if (val === undefined || val === null || isNaN(Number(val))) {
      missing.push(key)
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `El método "${methodName}" requiere los parámetros: ${missing.join(', ')}. ` +
      `Ninguno puede estar vacío o ser inválido.`
    )
  }
}

/**
 * Crea un generador de números pseudoaleatorios (Congruencial Mixto).
 *
 * @param {string} method   - Debe ser 'mixedCongruential'
 * @param {number} seed     - Semilla inicial
 * @param {object} [params] - { a, c, m }
 * @returns {{ next: () => number, generate: (n: number) => number[], name: string }}
 */
export function createGenerator(method, seed, params = {}) {
  if (method !== 'mixedCongruential') {
    throw new Error(
      `Método desconocido: "${method}". El único método disponible es: mixedCongruential`
    )
  }

  requireParams(params, ['a', 'c', 'm'], 'Congruencial Mixto')
  return createMixedCongruential(seed, Number(params.a), Number(params.c), Number(params.m))
}
