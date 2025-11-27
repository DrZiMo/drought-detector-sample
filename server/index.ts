import express from 'express'
import 'dotenv/config'
import { predictFn } from './controllers/predict'
import { getData } from './controllers/data'

const app = express()

app.get('/api/predict', predictFn)
app.get('/api/data', getData)

const PORT = process.env.PORT
app.listen(PORT, () => console.log('Listening on PORT: 3002'))
