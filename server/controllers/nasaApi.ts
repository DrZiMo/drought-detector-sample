import type { Request, Response } from 'express'
import axios from 'axios'

// TEST LOCATIONS
const LAT = 9.562389
const LON = 44.077011

export const getNasaApiData = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOT,TS,RH2M&community=AG&longitude=${LON}&latitude=${LAT}&start=20251020&end=20251101&format=JSON`
    )

    res.status(200).json({
      ok: true,
      source: 'NASA POWER',
      data: response.data,
    })

    return
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      message: 'Something went wrong',
    })
  }
}
