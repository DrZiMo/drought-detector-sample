import express from 'express'
import { getNasaApiData } from './controllers/nasaApi'

const app = express()

app.get('/api/nasa', getNasaApiData)

app.listen(3002, () => console.log('Listening on PORT: 3002'))
