import { Router } from 'express'
import { createGenerator, GENERATOR_METHODS } from '../generators/index.js'
import { runSimulation } from '../simulation/naveTierra.js'
import { runPruebasEstadisticas } from '../generators/estadisticas.js'

const router = Router()

router.get('/methods', (req, res) => {
  res.json({ methods: GENERATOR_METHODS })
})

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

    res.json({
      method,
      methodName:    generador.name,
      seed:          Number(seed),
      seedWasRandom: Boolean(seedWasRandom),
      params,
      ...rest,
      grilla,
      rng: {
        ...rng,
        type: generador.name,
        seed: Number(seed),
      },
      pruebasEstadisticas,
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router

