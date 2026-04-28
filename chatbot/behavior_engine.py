import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score
import joblib

MODEL_PATH = 'sensory_risk_model.joblib'
_model_instance = None

def _train_and_save_model():
    """Internal function to generate data and train the model."""
    print("Training new Behavioral ML Model...")
    np.random.seed(42)
    n_samples = 1500
    
    hours_slept = np.random.normal(7.5, 1.5, n_samples)
    overwhelmed_count = np.random.poisson(1.2, n_samples)
    tasks_abandoned = np.random.poisson(0.8, n_samples)
    tasks_completed = np.random.poisson(3.5, n_samples)
    
    risk_labels = []
    for i in range(n_samples):
        score = 0
        if hours_slept[i] < 6: score += 2
        elif hours_slept[i] < 7.5: score += 1
        score += overwhelmed_count[i] * 1.5
        score += tasks_abandoned[i] * 1.5
        
        if score < 3: risk_labels.append(0)
        elif score < 5.5: risk_labels.append(1)
        else: risk_labels.append(2)
            
    X = pd.DataFrame({
        'sleep': hours_slept,
        'overwhelmed': overwhelmed_count,
        'abandoned': tasks_abandoned,
        'completed': tasks_completed
    })
    y = np.array(risk_labels)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    joblib.dump(model, MODEL_PATH)
    print("Behavioral ML Model trained and saved.")
    return model

def load_model():
    """Loads the model into memory. Trains a new one if it doesn't exist."""
    global _model_instance
    if _model_instance is not None:
        return _model_instance

    if os.path.exists(MODEL_PATH):
        try:
            _model_instance = joblib.load(MODEL_PATH)
            print("Loaded existing Behavioral ML Model.")
        except Exception as e:
            print(f"Failed to load model, retraining... Error: {e}")
            _model_instance = _train_and_save_model()
    else:
        _model_instance = _train_and_save_model()
        
    return _model_instance

def calculate_overload_risk(hours_slept: float, overwhelmed_count: int, tasks_abandoned: int, tasks_completed: int):
    """Processes real-time telemetry and returns a risk assessment."""
    model = load_model()
    
    features = np.array([[hours_slept, overwhelmed_count, tasks_abandoned, tasks_completed]])
    prediction_val = model.predict(features)[0]
    
    risk_map = {0: "Low", 1: "Medium", 2: "Elevated"}
    advice_map = {
        "Low": "Baseline regulation is strong today. Standard routines and task loads are perfectly fine.",
        "Medium": "Slight signs of friction. Consider adding a short sensory break before starting new tasks.",
        "Elevated": "Telemetry indicates a higher risk of overload today. We recommend reducing non-essential demands and prioritizing a quiet, low-demand evening."
    }

    risk_level = risk_map[prediction_val]

    return {
        "risk_level": risk_level,
        "advisory_text": advice_map[risk_level]
    }