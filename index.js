import express from 'express'
import cors from 'cors'
import distributionsRouter from './src/routes/distributions.js'
import simulateRouter from './src/routes/simulate.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/distributions', distributionsRouter)
app.use('/api/simulate', simulateRouter)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})