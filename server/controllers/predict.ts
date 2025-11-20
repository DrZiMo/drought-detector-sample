import { Request, Response } from 'express'
import { predictDrought } from '../lib/predictDrought'

export const predictFn = async (req: Request, res: Response) => {
  try {
    const inputData = {
      GWETROOT: 0.3,
      GWETTOP: 0.25,
      PRECTOTCORR: 1,
      EVPTRNS: 5,
      CDD0: 10,
      T2M: 20,
      TS_MAX: 2,
      TS_MIN: 1,
      ALLSKY_SFC_SW_DWN: 1,
      RH2M: 1,
      WS10M: 1,
      QV2M: 1,
      GWETPROF: 0.5,
      EVLAND: 0,
      PS: 1,
    }

    const pred = await predictDrought(inputData)

    res.status(200).json({
      ok: true,
      prediction: pred,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      ok: false,
      message: 'Something went wrong!',
    })
  }
}
