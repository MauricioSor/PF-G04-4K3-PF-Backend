import express from 'express'
import cors    from 'cors'
import distributionsRouter from './src/routes/distributions.js'
import simulationRouter   from './src/routes/simulation.js'

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin:      '*',
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
