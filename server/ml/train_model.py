from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import requests
import pandas as pd
import joblib


class DroughtPredict:
    def __init__(self):
        self.LAT = 9.5612
        self.LON = 44.0669

        self.number_of_days = 10950
        self.end_date = "20251001"

        self.drought_labels = {0: 'No Drought',
                               1: "Moderate", 2: 'Severe', 3: 'Extreme'}

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

    def calculate_water_balance(self, df):
        df['water_balance'] = df['PRECTOTCORR'] - df['EVPTRNS']
        df['water_deficit'] = (
            df['EVPTRNS'] - df['PRECTOTCORR']).clip(lower=0)
        df['evap_ratio'] = df['PRECTOTCORR'] / \
            (df['EVPTRNS'] + 0.001)  # Avoiding division by zero
        return df

    def calculate_vapor_pressure_deficit(self, df):
        es = 6.11 * 10**((7.5 * df['T2M']) / (237.3 + df['T2M']))
        ea = es * (df['RH2M'] / 100)
        df['vpd'] = es - ea
        return df

    def classify(self, row):
        risk_score = 0

        if row.get("GWETROOT", 1.0) < 0.25:
            risk_score += 4
        elif row.get("GWETROOT", 1.0) < 0.35:
            risk_score += 3
        elif row.get("GWETROOT", 1.0) < 0.45:
            risk_score += 1

        if row.get("GWETTOP", 1.0) < 0.2:
            risk_score += 2

        if row.get("PRECTOTCORR", 5) < 1.0:
            risk_score += 3
        elif row.get("PRECTOTCORR", 5) < 3.0:
            risk_score += 2
        elif row.get("PRECTOTCORR", 5) < 5.0:
            risk_score += 1

        water_balance = row.get("PRECTOTCORR", 0) - row.get("EVPTRNS", 0)
        if water_balance < -2.0:
            risk_score += 3
        elif water_balance < -1.0:
            risk_score += 2

        cdd = row.get("CDD0", 0)
        if cdd > 25:
            risk_score += 4
        elif cdd > 15:
            risk_score += 3
        elif cdd > 10:
            risk_score += 2
        elif cdd > 5:
            risk_score += 1

        if row.get("T2M", 20) > 33:
            risk_score += 3
        elif row.get("T2M", 20) > 30:
            risk_score += 2
        elif row.get("T2M", 20) > 25:
            risk_score += 1

        if row.get("TS_MAX", 25) > 36:
            risk_score += 2
        if row.get("TS_MIN", 15) > 27:
            risk_score += 2

        if row.get("ALLSKY_SFC_SW_DWN", 15) > 23:
            risk_score += 2
        elif row.get("ALLSKY_SFC_SW_DWN", 15) > 18:
            risk_score += 1

        if row.get("RH2M", 50) < 30:
            risk_score += 2
        elif row.get("RH2M", 50) < 40:
            risk_score += 1

        if 'vpd' in row and row['vpd'] > 20:
            risk_score += 2

        if row.get("WS10M", 2) > 7:
            risk_score += 1
        elif row.get("WS10M", 2) > 5:
            risk_score += 1

        if row.get("EVPTRNS", 3) > 5:
            risk_score += 2
        elif row.get("EVPTRNS", 3) > 4:
            risk_score += 1

        if risk_score >= 12:
            return 3
        elif risk_score >= 8:
            return 2
        elif risk_score >= 5:
            return 1
        else:
            return 0

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

            current_risk = self.classify(row)
            risk_score += current_risk * 0.6

            if i > 0:
                prev_soil_moisture = df.loc[i-1, 'GWETROOT']
                if row['GWETROOT'] < prev_soil_moisture * 0.9:
                    risk_score += 2

                prev_precip = df.loc[i-1, 'PRECTOTCORR']
                if row['PRECTOTCORR'] < prev_precip * 0.5:
                    risk_score += 1

            if row['precip_7day_avg'] < 1.0:
                risk_score += 2
            if row['soil_moisture_7day_avg'] < 0.25:
                risk_score += 2

            if risk_score >= 4:
                drought_categories.append(3)
            elif risk_score >= 2.5:
                drought_categories.append(2)
            elif risk_score >= 1.5:
                drought_categories.append(1)
            else:
                drought_categories.append(0)

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

        df['drought_label'] = df['drought_category_advanced'].map(
            self.drought_labels)

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

        # print("\nRecent Conditions:")
        # recent = df[['PRECTOTCORR', 'GWETROOT',
        #              'T2M', 'drought_label']]
        # print(recent.to_string(index=False))

        print(f"\nDrought Distribution:")
        print(df['drought_label'].value_counts().sort_index())

        print(f"\nKey Statistics:")
        print(
            f"Drought: {self.drought_labels[round(int(df['drought_category_basic'].mean()))]}")
        print(
            f"Average Precipitation: {df['PRECTOTCORR'].mean():.2f} mm/day")
        print(f"Average Soil Moisture: {df['GWETROOT'].mean():.3f}")
        print(f"Average Temperature: {df['T2M'].mean():.1f}°C")

    def train(self, df):
        X = df[self.PARAMETERS]
        y = df['drought_category_basic']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42)

        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.fit_transform(X_test)

        model = RandomForestClassifier(
            n_estimators=200, max_depth=12, random_state=42)
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        print(classification_report(y_test, preds))

        joblib.dump(model, "dought_model.pkl")
        joblib.dump(scaler, 'scaler.pkl')


if __name__ == "__main__":
    state = 'Training ...'
    predictor = DroughtPredict()
    results_df = predictor.run_prediction()

    if results_df is not None:
        predictor.print_results(results_df)
        predictor.train(results_df)
        state = 'Done'

    else:
        print("Failed to get prediction results")
