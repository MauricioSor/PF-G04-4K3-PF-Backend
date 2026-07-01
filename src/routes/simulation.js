import { Router } from 'express'
import { createGenerator, GENERATOR_METHODS, DEFAULT_LCG_PARAMS } from '../generators/index.js'
import { runSimulation } from '../simulation/naveTierra.js'
import { runPruebasEstadisticas } from '../generators/estadisticas.js'

const router = Router()

router.get('/methods', (req, res) => {
  res.json({ methods: GENERATOR_METHODS })
})

/**
 * POST /naveTierra
 * Body: { method, seed, seedWasRandom?, params? }
 *
 * Los parámetros a, c, m son opcionales. Si no se envían se usan
 * los valores fijos recomendados (DEFAULT_LCG_PARAMS) que garantizan
 * período máximo según el Teorema de Hull-Dobell.
 */
router.post('/naveTierra', (req, res) => {
  try {
    const { method, seed, seedWasRandom = false, params = {} } = req.body

    if (!method) {
      return res.status(400).json({ error: 'El campo "method" es requerido.' })
    }
    if (seed === undefined || seed === null) {
      return res.status(400).json({ error: 'El campo "seed" es requerido.' })
    }

    const generador = createGenerator(method, Number(seed), params)
    const resultado = runSimulation(generador)

    const { grilla, rng, ...rest } = resultado
    const pruebasEstadisticas = runPruebasEstadisticas(grilla)

    // Incluir los parámetros efectivamente usados en la respuesta para trazabilidad
    const paramsUsados = generador.params ?? DEFAULT_LCG_PARAMS

    res.json({
      method,
      methodName:    generador.name,
      seed:          Number(seed),
      seedWasRandom: Boolean(seedWasRandom),
      params:        paramsUsados,
      ...rest,
      grilla,
      rng: {
        ...rng,
        type:   generador.name,
        seed:   Number(seed),
        params: paramsUsados,
      },
      pruebasEstadisticas,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
