import { Request, Response } from 'express'
import { catchError } from '../lib/catchError'
import { getPastData } from '../lib/getPastData'
import { getFutureData } from '../lib/getFutureData'

export const getFullData = async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat)
    const lon = Number(req.query.lon)

    const pastData = await getPastData(lat, lon)
    const futureData = await getFutureData(lat, lon)

    if (isNaN(lat) || isNaN(lon)) {
      res
        .status(400)
        .json({ ok: false, message: 'Invalid latitude or longitude' })

      return
    }

    if (!pastData || !futureData) {
      res.status(500).json({
        ok: false,
        message: 'Failed to fetch weather data',
      })

      return
    }

    const data = pastData.concat(futureData)

    res.status(200).json({
      ok: true,
      data,
    })
  } catch (error) {
    catchError(res, error as Error)
  }
}
