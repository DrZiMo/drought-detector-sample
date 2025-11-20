from datetime import datetime, timedelta
import requests
import pandas as pd

LAT = 9.5612
LON = 44.0669

number_of_days = 5
end_date = "2025101"

PARAMETERS = [
    "PRECTOTCORR",        # Corrected precipitation
    "T2M",                # Temperature
    "TS_MAX", "TS_MIN",   # Surface temp extremes
    "RH2M",               # Relative humidity
    "QV2M",               # Specific humidity
    "WS2M",               # Wind speed
    "ALLSKY_SFC_SW_DWN",  # Solar radiation
    "EVPTRNS", "EVLAND",  # Evapotranspiration
    "CDD0",               # Consecutive dry days
]

# fetch data from nasa power api


def fetch_nasa():
    end = datetime.strptime(end_date, "%Y%m%d")
    start = end - timedelta(days=number_of_days)

    url = (
        f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters={','.join(PARAMETERS)}&community=AG&longitude={LON}&latitude={LAT}&start={start.strftime('%Y%m%d')}&end={end.strftime('%Y%m%d')}&format=JSON")

    r = requests.get(url)
    data = r.json()

    return data


def classify(row):
    risk_score = 0

    # --- Precipitation ---
    if row.get("PRECTOTCORR", 0) < 1:
        risk_score += 3
    elif row.get("PRECTOTCORR", 0) < 3:
        risk_score += 2

    # --- Temperature ---
    if row.get("T2M", 0) > 30:
        risk_score += 2
    if row.get("TS_MAX", 0) > 32:
        risk_score += 1
    if row.get("TS_MIN", 0) > 25:
        risk_score += 1

    # --- Humidity ---
    if row.get("RH2M", 100) < 40:
        risk_score += 2
    if row.get("QV2M", 100) < 5:
        risk_score += 1

    # --- Wind Speed ---
    if row.get("WS2M", 0) > 5:
        risk_score += 1

    # --- Solar Radiation ---
    if row.get("ALLSKY_SFC_SW_DWN", 0) > 20:
        risk_score += 1

    # --- Evapotranspiration ---
    if row.get("EVPTRNS", 0) > 4:
        risk_score += 2
    if row.get("EVLAND", 0) > 4:
        risk_score += 1

    # --- Consecutive Dry Days ---
    if row.get("CDD0", 0) > 15:
        risk_score += 2

    # --- Convert to label ---
    if risk_score >= 8:
        return 2  # High risk
    elif risk_score >= 4:
        return 1  # Medium risk
    else:
        return 0  # Low risk


data = fetch_nasa()['properties']['parameter']

df = pd.DataFrame({param: list(values.values())
                  for param, values in data.items()})
df.replace(-999.0, pd.NA, inplace=True)

x = df[PARAMETERS]

df['label'] = df.apply(classify, axis=1)
y = df['label']

print(df)

# print(data)
