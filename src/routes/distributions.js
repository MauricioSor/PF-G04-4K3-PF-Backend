import { Router } from 'express'
import {
  exponential,
  uniform,
  uniformInt,
  normal,
  binomial
} from '../simulation/distribution.js'

const router = Router()

// GET /api/distributions/exponential?mean=80
router.get('/exponential', (req, res) => {
  const mean = parseFloat(req.query.mean)
  if (isNaN(mean)) return res.status(400).json({ error: 'Parámetro mean requerido' })
  res.json({ result: exponential(mean) })
})

// GET /api/distributions/uniform?a=15&b=30
router.get('/uniform', (req, res) => {
  const a = parseFloat(req.query.a)
  const b = parseFloat(req.query.b)
  if (isNaN(a) || isNaN(b)) return res.status(400).json({ error: 'Parámetros a y b requeridos' })
  res.json({ result: uniform(a, b) })
})

// GET /api/distributions/uniform-int?a=5&b=15
router.get('/uniform-int', (req, res) => {
  const a = parseInt(req.query.a)
  const b = parseInt(req.query.b)
  if (isNaN(a) || isNaN(b)) return res.status(400).json({ error: 'Parámetros a y b requeridos' })
  res.json({ result: uniformInt(a, b) })
})

// GET /api/distributions/normal?mu=2&sigma=0.5
router.get('/normal', (req, res) => {
  const mu = parseFloat(req.query.mu)
  const sigma = parseFloat(req.query.sigma)
  if (isNaN(mu) || isNaN(sigma)) return res.status(400).json({ error: 'Parámetros mu y sigma requeridos' })
  res.json({ result: normal(mu, sigma) })
})

// POST /api/distributions/binomial
// Body: { "table": [{"value": "Servidor", "cumulative": 0.25}, ...], "u": 0.73 }
router.post('/binomial', (req, res) => {
  const { table, u } = req.body
  if (!table || !Array.isArray(table)) return res.status(400).json({ error: 'Tabla requerida' })
  res.json({ result: binomial(table, u) })
})

export default router