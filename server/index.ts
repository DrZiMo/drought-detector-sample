import express from 'express'
import 'dotenv/config'
import { predictFn } from './controllers/predict'

const app = express()

app.get('/api/predict', predictFn)

const PORT = process.env.PORT
app.listen(PORT, () => console.log('Listening on PORT: 3002'))
