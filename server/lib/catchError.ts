import { Response } from 'express'

export const catchError = (res: Response, error: Error) => {
  console.log(error)
  res.status(500).json({
    ok: false,
    message: error.message,
  })
}
