from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import pandas as pd

with open("app/model.pkl", "rb") as f:
    model = pickle.load(f)

app = FastAPI(title="Diabetes Risk Diagnostic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://YOUR-FRONTEND.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientData(BaseModel):
    pregnancies: int
    glucose: float
    blood_pressure: float
    skin_thickness: float
    insulin: float
    bmi: float
    diabetes_pedigree_function: float
    age: int

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/predict")
def predict(data: PatientData):
    input_df = pd.DataFrame([{
        "Pregnancies": data.pregnancies,
        "Glucose": data.glucose,
        "BloodPressure": data.blood_pressure,
        "SkinThickness": data.skin_thickness,
        "Insulin": data.insulin,
        "BMI": data.bmi,
        "DiabetesPedigreeFunction": data.diabetes_pedigree_function,
        "Age": data.age,
    }])

    probability = model.predict_proba(input_df)[0][1]
    risk_label = "High Risk" if probability > 0.5 else "Low Risk"

    return {
        "risk_label": risk_label,
        "probability": round(float(probability), 4)
    }
