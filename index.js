import express from 'express'
import cors    from 'cors'
import distributionsRouter from './src/routes/distributions.js'
import simulationRouter   from './src/routes/simulation.js'

const app  = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
    ]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return callback(null, true)
    callback(new Error(`CORS: origen no permitido → ${origin}`))
  },
  methods:     ['GET', 'POST', 'OPTIONS'],
  credentials: false,
}))

app.use(express.json())

app.use('/api/distributions', distributionsRouter)
app.use('/api/simulate',      simulationRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor Nave Tierra corriendo en http://localhost:${PORT}`)
})
