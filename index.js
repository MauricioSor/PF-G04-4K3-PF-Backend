import express from 'express'
import cors from 'cors'
import distributionsRouter from './src/routes/distributions.js'
import simulationRouter   from './src/routes/simulation.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/distributions', distributionsRouter)
app.use('/api/simulate',      simulationRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Servidor Nave Tierra corriendo en http://localhost:${PORT}`)
})
