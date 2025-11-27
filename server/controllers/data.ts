import { Request, Response } from 'express'
import { catchError } from '../lib/catchError'
import { sanitizeData } from '../lib/sanitizeData'

export const getData = async (req: Request, res: Response) => {
  try {
    const numberOfDays = 21
    const lon = req.query.lon
    const lat = req.query.lat
    const end = new Date()
    const start = new Date(end.getTime() - numberOfDays * 24 * 60 * 60 * 1000)

    const formatDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}${month}${day}`
    }

    const formattedStart = formatDate(start)
    const formattedEnd = formatDate(end)
    const PARAMETERS = [
      'PRECTOTCORR',
      'EVPTRNS',
      'EVLAND',
      'GWETROOT',
      'GWETTOP',
      'GWETPROF',
      'T2M',
      'TS_MAX',
      'TS_MIN',
      'ALLSKY_SFC_SW_DWN',
      'RH2M',
      'QV2M',
      'CDD0',
      'WS10M',
      'PS',
    ]

    if (!lon || !lat || !formattedStart || !formattedEnd) {
      res.status(400).json({
        ok: true,
        message: 'Fill all the neccesry inputs',
      })

      return
    }

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${PARAMETERS.join(
      ','
    )}&community=AG&longitude=${lon}&latitude=${lat}&start=${formattedStart}&end=${formattedEnd}&format=JSON`

    const response = await fetch(url)
    const data = await response.json()

    const sanitizedData = sanitizeData(data.properties?.parameter)

    res.status(200).json({
      ok: true,
      data: sanitizedData,
    })
  } catch (error) {
    catchError(res, error as Error)
  }
}
