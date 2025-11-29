export const sanitizeData = (rawData: any) => {
  if (!rawData || !rawData.GWETTOP) return []

  const dates = Object.keys(rawData.GWETTOP)

  const cleaned: any[] = []

  for (const date of dates) {
    const GWETROOT = rawData.GWETROOT?.[date]
    const GWETTOP = rawData.GWETTOP?.[date]
    const PRECTOTCORR = rawData.PRECTOTCORR?.[date]
    const EVPTRNS = rawData.EVPTRNS?.[date]
    const CDD0 = rawData.CDD0?.[date]
    const T2M = rawData.T2M?.[date]
    const TS_MAX = rawData.TS_MAX?.[date]
    const TS_MIN = rawData.TS_MIN?.[date]
    const ALLSKY_SFC_SW_DWN = rawData.ALLSKY_SFC_SW_DWN?.[date]
    const RH2M = rawData.RH2M?.[date]
    const WS10M = rawData.WS10M?.[date]
    const QV2M = rawData.QV2M?.[date]
    const GWETPROF = rawData.GWETPROF?.[date]
    const EVLAND = rawData.EVLAND?.[date]
    const PS = rawData.PS?.[date]

    if (
      GWETROOT === -999 ||
      GWETTOP === -999 ||
      PRECTOTCORR === -999 ||
      EVPTRNS === -999 ||
      CDD0 === -999 ||
      T2M === -999 ||
      TS_MAX === -999 ||
      TS_MIN === -999 ||
      ALLSKY_SFC_SW_DWN === -999 ||
      RH2M === -999 ||
      WS10M === -999 ||
      QV2M === -999 ||
      GWETPROF === -999 ||
      EVLAND === -999 ||
      PS === -999
    )
      continue

    const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(
      6,
      8
    )}`

    cleaned.push({
      date: formattedDate,
      GWETROOT,
      GWETTOP,
      PRECTOTCORR,
      EVPTRNS,
      CDD0,
      T2M,
      TS_MAX,
      TS_MIN,
      ALLSKY_SFC_SW_DWN,
      RH2M,
      WS10M,
      QV2M,
      GWETPROF,
      EVLAND,
      PS,
    })
  }

  return cleaned
}
