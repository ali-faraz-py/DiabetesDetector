import streamlit as st
import pickle
import pandas as pd
import plotly.express as px

with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

st.set_page_config(page_title="Diabetes Detector", page_icon="🩺")

st.title("🏥 Diabetes Risk Diagnostic Tool")
with st.expander("ℹ️ How to Use & Input Guide"):
    st.info("""
    **Enter the patient's details in the sidebar:**
    * **Glucose:** Plasma glucose concentration (2 hours in an oral glucose tolerance test).
    * **BMI:** Body Mass Index (weight in kg/(height in m)^2).
    * **Insulin:** 2-Hour serum insulin (mu U/ml).
    * **Age:** Age in years.
    * **Pedigree Function:** A score that determines the risk based on family history.
    """)
st.markdown("---")

st.sidebar.header("Model Performance")
st.sidebar.metric("Prediction Accuracy", "80.5%") 
st.sidebar.write("Based on a Random Forest Classifier trained on 768 patient records.")

Pregnancies = st.sidebar.number_input("Number of Pregnancies", min_value=0, max_value=17, value=3)

glucose = st.sidebar.number_input("Glucose Level", min_value=0, max_value=300, value=120)

blood_pressure = st.sidebar.slider("Blood Pressure", min_value=24.0, max_value=122.0, value=70.0)

skin_thickness = st.sidebar.slider("Skin Thickness", min_value=7.0, max_value=99.0, value=20.0)

insulin = st.sidebar.slider("Insulin Level", min_value=14.0, max_value=846.0, value=79.0)

bmi = st.sidebar.slider("BMI", min_value=18.20, max_value=67.1, value=32.0)

DiabetesPedigreeFunction = st.sidebar.slider("Diabetes Pedigree Function", min_value=0.078, max_value=2.42, value=0.5)

age = st.sidebar.slider("Age", min_value=21, max_value=81, value=33) 

st.write("### Diagnostic Result")
st.info("Adjust the patient data in the sidebar to see the AI prediction.")

if st.button("Predict Diabetes Risk"):
    input_df = pd.DataFrame({
        'Pregnancies': [Pregnancies],
        'Glucose': [glucose],
        'BloodPressure': [blood_pressure],
        'SkinThickness': [skin_thickness],
        'Insulin': [insulin],
        'BMI': [bmi],
        'DiabetesPedigreeFunction': [DiabetesPedigreeFunction],
        'Age': [age]
    })

    probability = model.predict_proba(input_df)
    risk_percent = probability[0][1]
    
    if risk_percent > 0.5:
        st.error(f"⚠️ Prediction: High Risk of Diabetes ({risk_percent:.2%})")
    else:
        st.success(f"✅ Prediction: Low Risk of Diabetes ({risk_percent:.2%})")

    report_text = f"""
    Diabetes Risk Assessment Report
    -------------------------------
    - Pregnancies: {Pregnancies}
    - Glucose Level: {glucose}
    - Blood Pressure: {blood_pressure}
    - Skin Thickness: {skin_thickness}
    - Insulin Level: {insulin}
    - BMI: {bmi}
    - Pedigree Function: {DiabetesPedigreeFunction}
    - Age: {age}

    -------------------------------
    FINAL RESULT: {'High Risk' if risk_percent > 0.5 else 'Low Risk'}
    PROBABILITY: {risk_percent:.2%}
    """
    st.download_button(
        label="📥 Download Full Diagnostic Report",
        data=report_text,
        file_name="diabetes_full_report.txt",
        mime="text/plain"
    )

st.caption("⚠️ Note: This model has an 80% accuracy rate based on historical data. Always consult a doctor.")


st.markdown("---")

st.subheader("📊 Training Data Overview")
data_counts = {
    "Diagnosis": ["Healthy", "Diabetic"],
    "Total Patients": [500, 268]
}

fig = px.pie(
    data_counts, 
    values='Total Patients', 
    names='Diagnosis',
    color_discrete_sequence=['#2ecc71', '#e74c3c'],
    hole=0.4
)

st.plotly_chart(fig)

st.info("The dataset used for training is the Pima Indians Diabetes Database.")