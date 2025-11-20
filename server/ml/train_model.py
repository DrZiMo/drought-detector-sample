from datetime import datetime, timedelta
import requests
import pandas as pd


class DroughtPredict:
    def __init__(self):
        self.LAT = 9.5612
        self.LON = 44.0669

        self.number_of_days = 30
        self.end_date = "2025101"

        self.PARAMETERS = [
            "PRECTOTCORR",           # Precipitation
            "EVPTRNS", "EVLAND",     # Evapotranspiration
            "GWETROOT",              # Root zone soil wetness (0-100cm)
            "GWETTOP",               # Surface soil wetness (0-10cm)
            "GWETPROF",              # Profile soil wetness (0-200cm)
            "T2M",                   # Temperature
            "TS_MAX", "TS_MIN",      # Temp extremes
            "ALLSKY_SFC_SW_DWN",     # Solar radiation
            "RH2M",                  # Relative humidity
            "QV2M",                  # Specific humidity
            "CDD0",                  # Cooling Degree days above 0
            "WS10M",                 # Wind speed at 10m
            "PS",                    # Surface pressure
        ]

    def fetch_nasa(self):
        end = datetime.strptime(self.end_date, "%Y%m%d")
        start = end - timedelta(days=self.number_of_days)
        url = (
            f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters={','.join(self.PARAMETERS)}&community=AG&longitude={self.LON}&latitude={self.LAT}&start={start.strftime('%Y%m%d')}&end={end.strftime('%Y%m%d')}&format=JSON")

        r = requests.get(url)
        data = r.json()

        return data

    def classify(self, row):
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

    def calculate_water_balance(self, df):
        df['water_balance'] = df['PRECTOTCORR'] - df['EVPTRNS']
        df['water_deficit'] = (
            df['EVPTRNS'] - df['PRECTOTCORR']).clip(lower=0)
        df['evap_ratio'] = df['PRECTOTCORR'] / \
            (df['EVPTRNS'] + 0.001)  # Avoid division by zero
        return df

    def calculate_vapor_pressure_deficit(self, df):
        es = 6.11 * 10**((7.5 * df['T2M']) / (237.3 + df['T2M']))
        ea = es * (df['RH2M'] / 100)
        df['vpd'] = es - ea
        return df

    def classify(self, row):
        risk_score = 0

        # === SOIL MOISTURE (Highest Priority - 35% weight) ===
        # Root zone soil wetness (most critical for plants)
        if row.get("GWETROOT", 1.0) < 0.2:    # Severe soil moisture deficit
            risk_score += 4
        elif row.get("GWETROOT", 1.0) < 0.3:  # Moderate deficit
            risk_score += 3
        elif row.get("GWETROOT", 1.0) < 0.4:  # Mild deficit
            risk_score += 1

        # Surface soil wetness
        if row.get("GWETTOP", 1.0) < 0.15:    # Very dry surface
            risk_score += 2

        # === PRECIPITATION & WATER BALANCE (30% weight) ===
        # Current precipitation deficit
        if row.get("PRECTOTCORR", 5) < 0.5:   # No rain
            risk_score += 3
        elif row.get("PRECTOTCORR", 5) < 2.0:  # Very light rain
            risk_score += 2
        elif row.get("PRECTOTCORR", 5) < 5.0:  # Light rain
            risk_score += 1

        # Water balance (Precipitation - Evapotranspiration)
        water_balance = row.get("PRECTOTCORR", 0) - row.get("EVPTRNS", 0)
        if water_balance < -3.0:              # Large water deficit
            risk_score += 3
        elif water_balance < -1.0:            # Moderate deficit
            risk_score += 2

        # Consecutive Dry Days (accumulated stress)
        cdd = row.get("CDD0", 0)
        if cdd > 30:                          # Extreme dry spell
            risk_score += 4
        elif cdd > 20:                        # Severe dry spell
            risk_score += 3
        elif cdd > 10:                        # Moderate dry spell
            risk_score += 2
        elif cdd > 5:                         # Mild dry spell
            risk_score += 1

        # === TEMPERATURE & ENERGY (20% weight) ===
        # High temperatures increase evaporation
        if row.get("T2M", 20) > 35:           # Extreme heat
            risk_score += 3
        elif row.get("T2M", 20) > 30:         # High temperature
            risk_score += 2
        elif row.get("T2M", 20) > 25:         # Warm
            risk_score += 1

        # Temperature extremes
        if row.get("TS_MAX", 25) > 38:        # Very hot days
            risk_score += 2
        if row.get("TS_MIN", 15) > 28:        # Hot nights (no relief)
            risk_score += 2

        # Solar radiation (drives evaporation)
        if row.get("ALLSKY_SFC_SW_DWN", 15) > 25:  # Very high solar radiation
            risk_score += 2
        elif row.get("ALLSKY_SFC_SW_DWN", 15) > 20:  # High solar radiation
            risk_score += 1

        # === ATMOSPHERIC CONDITIONS (15% weight) ===
        # Low humidity increases evaporation
        if row.get("RH2M", 50) < 25:          # Very dry air
            risk_score += 2
        elif row.get("RH2M", 50) < 35:        # Dry air
            risk_score += 1

        # Vapor Pressure Deficit (if calculated)
        if 'vpd' in row and row['vpd'] > 25:  # High VPD - plants stressed
            risk_score += 2

        # Wind speed (increases evaporation)
        if row.get("WS10M", 2) > 8:           # High winds
            risk_score += 1
        elif row.get("WS10M", 2) > 5:         # Moderate winds
            risk_score += 1

        # Evapotranspiration rates
        if row.get("EVPTRNS", 3) > 6:         # Very high ET
            risk_score += 2
        elif row.get("EVPTRNS", 3) > 4:       # High ET
            risk_score += 1

        # === DROUGHT CATEGORIZATION ===
        if risk_score >= 15:
            return 3  # Extreme drought
        elif risk_score >= 10:
            return 2  # High risk/Severe drought
        elif risk_score >= 6:
            return 1  # Medium risk/Moderate drought
        else:
            return 0  # Low risk/No drought

    def advanced_classify_with_context(self, df):
        df['precip_7day_avg'] = df['PRECTOTCORR'].rolling(
            window=7, min_periods=1).mean()
        df['precip_30day_avg'] = df['PRECTOTCORR'].rolling(
            window=min(30, len(df)), min_periods=1).mean()
        df['soil_moisture_7day_avg'] = df['GWETROOT'].rolling(
            window=7, min_periods=1).mean()

        drought_categories = []

        for i, row in df.iterrows():
            risk_score = 0

            # Current conditions (60% weight)
            current_risk = self.classify(row)
            risk_score += current_risk * 0.6

            # Recent trends (40% weight)
            if i > 0:
                # Check if conditions are worsening
                prev_soil_moisture = df.loc[i-1, 'GWETROOT']
                if row['GWETROOT'] < prev_soil_moisture * 0.9:  # Soil drying rapidly
                    risk_score += 2

                prev_precip = df.loc[i-1, 'PRECTOTCORR']
                if row['PRECTOTCORR'] < prev_precip * 0.5:  # Precipitation decreasing
                    risk_score += 1

            # Use rolling averages for context
            if row['precip_7day_avg'] < 1.0:  # Very dry recent week
                risk_score += 2
            if row['soil_moisture_7day_avg'] < 0.25:  # Consistently dry soil
                risk_score += 2

            # Final categorization
            if risk_score >= 4:
                drought_categories.append(3)  # Extreme
            elif risk_score >= 2.5:
                drought_categories.append(2)  # Severe
            elif risk_score >= 1.5:
                drought_categories.append(1)  # Moderate
            else:
                drought_categories.append(0)  # None/Low

        return drought_categories

    def run_prediction(self):
        nasa_data = self.fetch_nasa()

        if 'properties' not in nasa_data or 'parameter' not in nasa_data['properties']:
            print('Error: No data received from NASA API')
            return None

        data_params = nasa_data['properties']['parameter']

        df = pd.DataFrame({param: list(values.values())
                           for param, values in data_params.items()})
        df.replace(-999.0, pd.NA, inplace=True)

        df = self.calculate_water_balance(df)
        df = self.calculate_vapor_pressure_deficit(df)

        df['drought_category_basic'] = df.apply(self.classify, axis=1)
        df['drought_category_advanced'] = self.advanced_classify_with_context(
            df)

        drought_labels = {0: 'No Drought',
                          1: "Moderate", 2: 'Severe', 3: 'Extreme'}
        df['drought_label'] = df['drought_category_advanced'].map(
            drought_labels)

        return df

    def print_results(self, df):
        if df is None:
            print("No data to display")
            return

        print("\n" + "="*60)
        print("DROUGHT PREDICTION RESULTS")
        print("="*60)
        print(f"Location: Lat {self.LAT}, Lon {self.LON}")
        print(f"Period: {self.number_of_days} days")
        print(f"Data Points: {len(df)}")

        print("\nRecent Conditions:")
        recent = df[['PRECTOTCORR', 'GWETROOT',
                     'T2M', 'drought_label']]
        print(recent.to_string(index=False))

        print(f"\nDrought Distribution:")
        print(df['drought_label'].value_counts().sort_index())

        print(f"\nKey Statistics:")
        print(
            f"Average Precipitation: {df['PRECTOTCORR'].mean():.2f} mm/day")
        print(f"Average Soil Moisture: {df['GWETROOT'].mean():.3f}")
        print(f"Average Temperature: {df['T2M'].mean():.1f}°C")


# Usage
if __name__ == "__main__":
    predictor = DroughtPredict()
    results_df = predictor.run_prediction()

    if results_df is not None:
        predictor.print_results(results_df)
    else:
        print("Failed to get prediction results")
