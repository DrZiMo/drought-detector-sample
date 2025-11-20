import pandas as pd
import joblib
import json
import sys

model = joblib.load('drought_model.pkl')
scaler = joblib.load('scaler.pkl')

input_data = json.loads(sys.stdin.read())
df = pd.DataFrame([input_data])

feature_order = list(scaler.feature_names_in_)

# Ensure all features exist (fill missing ones with 0)
for feature in feature_order:
    if feature not in df.columns:
        df[feature] = 0  # or another default value

# Reorder columns to match scaler
df = df[feature_order]
df_scaled = scaler.transform(df)

pred = model.predict(df_scaled)[0]

print("Predicted drought class:", pred)
