export const mapWeatherbitToModel = (weatherbitResponse: any) => {
  if (!weatherbitResponse || !Array.isArray(weatherbitResponse.data)) return []

  //   const modelFormattedData: any = {
  //     GWETROOT: {},
  //     GWETTOP: {},
  //     PRECTOTCORR: {},
  //     EVPTRNS: {},
  //     CDD0: {},
  //     T2M: {},
  //     TS_MAX: {},
  //     TS_MIN: {},
  //     ALLSKY_SFC_SW_DWN: {},
  //     RH2M: {},
  //     WS10M: {},
  //     QV2M: {},
  //     GWETPROF: {},
  //     EVLAND: {},
  //     PS: {},
  //   }

  const data = []

  for (const item of weatherbitResponse.data) {
    const date = item.valid_date

    data.push({
      date: date.replace(/-/g, ''),
      GWETROOT: item.soilm_40_100cm,
      GWETTOP: item.soilm_0_10cm,
      PRECTOTCORR: item.precip,
      EVPTRNS: item.evapotranspiration,
      CDD0: item.temp_2m_max,
      T2M: item.temp_2m_avg,
      TS_MAX: item.skin_temp_max,
      TS_MIN: item.skin_temp_min,
      ALLSKY_SFC_SW_DWN: item.dswrf_avg,
      RH2M: item.relative_humidity,
      WS10M: item.wind_10m_spd_avg,
      QV2M: item.specific_humidity,
      GWETPROF: item.soilm_10_40cm,
      EVLAND: item.evapotranspiration * 0.9,
      PS: item.pres_avg,
    })

    // modelFormattedData.GWETROOT[date] = item.soilm_40_100cm
    // modelFormattedData.GWETTOP[date] = item.soilm_0_10cm
    // modelFormattedData.PRECTOTCORR[date] = item.precip
    // modelFormattedData.EVPTRNS[date] = item.evapotranspiration
    // modelFormattedData.CDD0[date] = item.temp_2m_max
    // modelFormattedData.T2M[date] = item.temp_2m_avg
    // modelFormattedData.TS_MAX[date] = item.skin_temp_max
    // modelFormattedData.TS_MIN[date] = item.skin_temp_min
    // modelFormattedData.ALLSKY_SFC_SW_DWN[date] = item.dswrf_avg
    // modelFormattedData.RH2M[date] = item.relative_humidity
    // modelFormattedData.WS10M[date] = item.wind_10m_spd_avg
    // modelFormattedData.QV2M[date] = item.specific_humidity
    // modelFormattedData.GWETPROF[date] = item.soilm_10_40cm
    // modelFormattedData.EVLAND[date] = item.evapotranspiration * 0.9
    // modelFormattedData.PS[date] = item.pres_avg
  }

  return data
}
