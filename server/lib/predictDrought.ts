import { spawn } from 'child_process'
import path from 'path'
import { WeatherData } from '../types/weatherInputs'

export const predictDrought = (inputData: WeatherData) => {
  return new Promise((res, rej) => {
    const py = spawn('python', [path.join(__dirname, '../ml/predict.py')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let result = ''
    let error = ''

    py.stdout.on('data', (data) => (result += data.toString()))
    py.stderr.on('data', (data) => (error += data.toString()))

    py.on('close', (code) => {
      if (code !== 0) return rej(new Error(error))
      res(result.trim())
    })

    py.stdin.write(JSON.stringify(inputData))
    py.stdin.end()
  })
}
