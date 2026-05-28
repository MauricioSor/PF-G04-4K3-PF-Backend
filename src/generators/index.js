import { createCentralSquare }              from './centralSquare.js'
import { createLehmer }                     from './lehmer.js'
import { createMixedCongruential }          from './mixedCongruential.js'
import { createMultiplicativeCongruential } from './multiplicativeCongruential.js'
import { createAdditiveCongruential }       from './additiveCongruential.js'

export const GENERATOR_METHODS = {
  centralSquare:               'Parte Central del Cuadrado',
  lehmer:                      'Lehmer',
  mixedCongruential:           'Congruencial Mixto',
  multiplicativeCongruential:  'Congruencial Multiplicativo',
  additiveCongruential:        'Congruencial Aditivo',
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
 * Crea un generador de números pseudoaleatorios.
 *
 * @param {string} method   - Clave del método (ver GENERATOR_METHODS)
 * @param {number} seed     - Semilla inicial
 * @param {object} [params] - Parámetros del método (sin valores por defecto)
 * @returns {{ next: () => number, generate: (n: number) => number[], name: string }}
 */
export function createGenerator(method, seed, params = {}) {
  switch (method) {

    case 'centralSquare':
      // No requiere parámetros adicionales; la semilla actúa como valor inicial
      return createCentralSquare(seed)

    case 'lehmer':
      requireParams(params, ['a', 'm'], 'Lehmer')
      return createLehmer(seed, Number(params.a), Number(params.m))

    case 'mixedCongruential':
      requireParams(params, ['a', 'c', 'm'], 'Congruencial Mixto')
      return createMixedCongruential(seed, Number(params.a), Number(params.c), Number(params.m))

    case 'multiplicativeCongruential':
      requireParams(params, ['a', 'm'], 'Congruencial Multiplicativo')
      return createMultiplicativeCongruential(seed, Number(params.a), Number(params.m))

    case 'additiveCongruential':
      requireParams(params, ['k', 'm'], 'Congruencial Aditivo')
      return createAdditiveCongruential(seed, Number(params.k), Number(params.m))

    default:
      throw new Error(
        `Método de generador desconocido: "${method}". ` +
        `Opciones válidas: ${Object.keys(GENERATOR_METHODS).join(', ')}`
      )
  }
}
