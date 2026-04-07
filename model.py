import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

def load_and_prepare_data():
    url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
    columns = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 
               'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']
    df = pd.read_csv(url, names=columns)

    cols_to_fix = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for col in cols_to_fix:
        median_val = df[col].median()
        df[col] = df[col].replace(0, median_val)
    
    X = df.drop(columns=['Outcome'])
    y = df['Outcome']
    
    return train_test_split(X, y, test_size=0.2, random_state=42)

def build_pipeline():
    pipe = Pipeline([
        ('scaler', StandardScaler()), 
        ('model', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    return pipe

if __name__ == "__main__":
    X_train, X_test, y_train, y_test = load_and_prepare_data()

    diabetes_pipeline = build_pipeline()
    diabetes_pipeline.fit(X_train, y_train)

    with open('model.pkl', 'wb') as f:
        pickle.dump(diabetes_pipeline, f)