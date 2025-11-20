import express from 'express'
import { predictFn } from './controllers/predict'

const app = express()

app.get('/api/predict', predictFn)

app.listen(3002, () => console.log('Listening on PORT: 3002'))
