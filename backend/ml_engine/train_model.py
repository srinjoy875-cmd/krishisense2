"""
Enhanced ML Model Training with Expanded Dataset
Uses Random Forest Classifier with 1000+ samples across 30 crops
Ensures diverse, balanced training data for accurate predictions
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle
import os

# Set random seed for reproducibility
np.random.seed(42)

def generate_diverse_samples(crop_name, n_samples, param_ranges):
    """Generate diverse training samples with realistic variations"""
    samples = []
    for _ in range(n_samples):
        # Add controlled randomness for diversity
        sample = {
            'N': np.random.normal(
                (param_ranges['N'][0] + param_ranges['N'][1]) / 2,
                (param_ranges['N'][1] - param_ranges['N'][0]) / 4
            ),
            'P': np.random.normal(
                (param_ranges['P'][0] + param_ranges['P'][1]) / 2,
                (param_ranges['P'][1] - param_ranges['P'][0]) / 4
            ),
            'K': np.random.normal(
                (param_ranges['K'][0] + param_ranges['K'][1]) / 2,
                (param_ranges['K'][1] - param_ranges['K'][0]) / 4
            ),
            'temperature': np.random.normal(
                (param_ranges['temp'][0] + param_ranges['temp'][1]) / 2,
                (param_ranges['temp'][1] - param_ranges['temp'][0]) / 5
            ),
            'humidity': np.random.normal(
                (param_ranges['humidity'][0] + param_ranges['humidity'][1]) / 2,
                (param_ranges['humidity'][1] - param_ranges['humidity'][0]) / 5
            ),
            'ph': np.random.normal(
                (param_ranges['ph'][0] + param_ranges['ph'][1]) / 2,
                (param_ranges['ph'][1] - param_ranges['ph'][0]) / 6
            ),
            'rainfall': np.random.normal(
                (param_ranges['rainfall'][0] + param_ranges['rainfall'][1]) / 2,
                (param_ranges['rainfall'][1] - param_ranges['rainfall'][0]) / 5
            ),
            'label': crop_name
        }
        
        # Clip to valid ranges
        sample['N'] = np.clip(sample['N'], param_ranges['N'][0], param_ranges['N'][1])
        sample['P'] = np.clip(sample['P'], param_ranges['P'][0], param_ranges['P'][1])
        sample['K'] = np.clip(sample['K'], param_ranges['K'][0], param_ranges['K'][1])
        sample['temperature'] = np.clip(sample['temperature'], param_ranges['temp'][0], param_ranges['temp'][1])
        sample['humidity'] = np.clip(sample['humidity'], param_ranges['humidity'][0], param_ranges['humidity'][1])
        sample['ph'] = np.clip(sample['ph'], param_ranges['ph'][0], param_ranges['ph'][1])
        sample['rainfall'] = np.clip(sample['rainfall'], param_ranges['rainfall'][0], param_ranges['rainfall'][1])
        
        samples.append(sample)
    return samples

# Comprehensive crop parameters (30 crops)
crop_parameters = {
    'rice': {'N': (80, 120), 'P': (35, 60), 'K': (35, 60), 'temp': (20, 35), 
             'humidity': (70, 90), 'ph': (5.5, 7.0), 'rainfall': (1000, 2500)},
    'wheat': {'N': (100, 150), 'P': (30, 50), 'K': (30, 50), 'temp': (10, 25), 
              'humidity': (50, 70), 'ph': (6.0, 7.5), 'rainfall': (400, 800)},
    'maize': {'N': (120, 180), 'P': (40, 60), 'K': (40, 60), 'temp': (18, 27), 
              'humidity': (60, 80), 'ph': (5.5, 7.5), 'rainfall': (500, 900)},
    'cotton': {'N': (60, 100), 'P': (30, 50), 'K': (40, 60), 'temp': (21, 30), 
               'humidity': (50, 70), 'ph': (5.8, 8.0), 'rainfall': (600, 1200)},
    'sugarcane': {'N': (150, 250), 'P': (50, 80), 'K': (100, 150), 'temp': (20, 35), 
                  'humidity': (70, 90), 'ph': (6.5, 7.5), 'rainfall': (1200, 1800)},
    'soybean': {'N': (20, 40), 'P': (30, 50), 'K': (30, 50), 'temp': (20, 30), 
                'humidity': (60, 80), 'ph': (6.0, 7.0), 'rainfall': (450, 700)},
    'chickpea': {'N': (20, 30), 'P': (30, 50), 'K': (20, 40), 'temp': (15, 25), 
                 'humidity': (55, 75), 'ph': (6.0, 7.5), 'rainfall': (400, 650)},
    'potato': {'N': (80, 120), 'P': (40, 60), 'K': (80, 120), 'temp': (15, 25), 
               'humidity': (65, 85), 'ph': (4.8, 6.5), 'rainfall': (500, 750)},
    'groundnut': {'N': (20, 40), 'P': (40, 60), 'K': (60, 80), 'temp': (20, 30), 
                  'humidity': (60, 80), 'ph': (5.5, 6.5), 'rainfall': (500, 900)},
    'tomato': {'N': (50, 80), 'P': (25, 40), 'K': (40, 60), 'temp': (18, 27), 
               'humidity': (60, 80), 'ph': (6.0, 6.8), 'rainfall': (500, 800)},
    'onion': {'N': (100, 150), 'P': (50, 75), 'K': (50, 75), 'temp': (15, 25), 
              'humidity': (65, 85), 'ph': (6.0, 7.0), 'rainfall': (350, 500)},
    'banana': {'N': (200, 300), 'P': (100, 150), 'K': (300, 500), 'temp': (25, 35), 
               'humidity': (75, 95), 'ph': (6.0, 7.5), 'rainfall': (1500, 3000)},
    'mango': {'N': (100, 150), 'P': (50, 80), 'K': (100, 150), 'temp': (24, 35), 
              'humidity': (50, 70), 'ph': (5.5, 7.5), 'rainfall': (750, 2500)},
    'grapes': {'N': (100, 150), 'P': (60, 90), 'K': (120, 180), 'temp': (15, 30), 
               'humidity': (50, 70), 'ph': (6.0, 7.5), 'rainfall': (650, 900)},
    'papaya': {'N': (100, 150), 'P': (60, 90), 'K': (120, 180), 'temp': (22, 32), 
               'humidity': (60, 85), 'ph': (6.0, 7.0), 'rainfall': (1000, 2000)},
    'coffee': {'N': (100, 150), 'P': (40, 60), 'K': (80, 120), 'temp': (15, 28), 
               'humidity': (70, 90), 'ph': (5.0, 6.5), 'rainfall': (1500, 2500)},
    'tea': {'N': (150, 250), 'P': (50, 80), 'K': (100, 150), 'temp': (20, 30), 
            'humidity': (75, 95), 'ph': (4.5, 6.0), 'rainfall': (1500, 3000)},
    'mustard': {'N': (80, 120), 'P': (30, 50), 'K': (30, 50), 'temp': (10, 20), 
                'humidity': (55, 75), 'ph': (6.0, 7.5), 'rainfall': (250, 500)},
    'barley': {'N': (60, 100), 'P': (25, 40), 'K': (25, 40), 'temp': (12, 22), 
               'humidity': (50, 70), 'ph': (6.5, 7.5), 'rainfall': (300, 600)},
    'cabbage': {'N': (120, 180), 'P': (50, 70), 'K': (80, 120), 'temp': (15, 20), 
                'humidity': (65, 85), 'ph': (6.0, 7.0), 'rainfall': (400, 600)},
    'cauliflower': {'N': (150, 200), 'P': (60, 80), 'K': (100, 140), 'temp': (15, 22), 
                    'humidity': (70, 90), 'ph': (6.0, 7.0), 'rainfall': (400, 600)},
    'carrot': {'N': (60, 100), 'P': (40, 60), 'K': (80, 120), 'temp': (15, 20), 
               'humidity': (60, 80), 'ph': (5.5, 6.5), 'rainfall': (300, 500)},
    'chilli': {'N': (80, 120), 'P': (40, 60), 'K': (60, 90), 'temp': (20, 30), 
               'humidity': (60, 80), 'ph': (6.0, 7.0), 'rainfall': (600, 1200)},
    'garlic': {'N': (80, 120), 'P': (50, 75), 'K': (50, 75), 'temp': (12, 25), 
               'humidity': (55, 75), 'ph': (6.0, 7.0), 'rainfall': (300, 450)},
    'ginger': {'N': (120, 180), 'P': (60, 90), 'K': (120, 180), 'temp': (20, 30), 
               'humidity': (70, 90), 'ph': (5.5, 6.5), 'rainfall': (1500, 3000)},
    'turmeric': {'N': (100, 150), 'P': (50, 75), 'K': (100, 150), 'temp': (20, 30), 
                 'humidity': (65, 85), 'ph': (5.0, 7.5), 'rainfall': (1500, 2500)},
    'millets': {'N': (40, 60), 'P': (20, 30), 'K': (20, 30), 'temp': (25, 35), 
                'humidity': (40, 60), 'ph': (6.0, 8.0), 'rainfall': (400, 600)},
    'sorghum': {'N': (60, 90), 'P': (30, 40), 'K': (30, 40), 'temp': (25, 35), 
                'humidity': (45, 65), 'ph': (6.0, 8.0), 'rainfall': (450, 650)},
    'sunflower': {'N': (60, 80), 'P': (40, 60), 'K': (40, 60), 'temp': (20, 27), 
                  'humidity': (55, 75), 'ph': (6.0, 7.5), 'rainfall': (400, 600)},
    'cucumber': {'N': (100, 150), 'P': (50, 75), 'K': (80, 120), 'temp': (20, 30), 
                 'humidity': (65, 85), 'ph': (6.0, 7.0), 'rainfall': (500, 800)},
}

# Generate LARGE balanced dataset
print("=" * 70)
print("GENERATING COMPREHENSIVE TRAINING DATASET")
print("=" * 70)

all_samples = []
samples_per_crop = 35  # Increased from 20 to 35

for crop_name, params in crop_parameters.items():
    crop_samples = generate_diverse_samples(crop_name, samples_per_crop, params)
    all_samples.extend(crop_samples)
    print(f"✓ Generated {samples_per_crop} samples for {crop_name}")

df = pd.DataFrame(all_samples)

print(f"\n{'=' * 70}")
print("DATASET SUMMARY")
print("=" * 70)
print(f"Total samples: {len(df)}")
print(f"Total crops: {df['label'].nunique()}")
print(f"Samples per crop: {samples_per_crop}")
print(f"Features: {list(df.columns[:-1])}")

# Prepare data
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label']

# Split with stratification
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining set: {len(X_train)} samples")
print(f"Testing set: {len(X_test)} samples")

# Feature Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train ADVANCED Random Forest
print(f"\n{'=' * 70}")
print("TRAINING ADVANCED RANDOM FOREST CLASSIFIER")
print("=" * 70)

model = RandomForestClassifier(
    n_estimators=300,        # Increased trees
    max_depth=25,            # Deeper trees
    min_samples_split=2,     # More sensitive
    min_samples_leaf=1,      
    max_features='sqrt',     
    bootstrap=True,
    random_state=42,
    n_jobs=-1,
    verbose=1,
    class_weight='balanced'  # Handle any class imbalance
)

model.fit(X_train_scaled, y_train)

# Comprehensive Evaluation
train_accuracy = model.score(X_train_scaled, y_train)
test_accuracy = model.score(X_test_scaled, y_test)

print(f"\n{'=' * 70}")
print("MODEL PERFORMANCE")
print("=" * 70)
print(f"Training Accuracy: {train_accuracy * 100:.2f}%")
print(f"Testing Accuracy: {test_accuracy * 100:.2f}%")

# Cross-validation
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
print(f"Cross-Validation Scores: {cv_scores}")
print(f"Mean CV Accuracy: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 2 * 100:.2f}%)")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\nFeature Importance:")
print(feature_importance.to_string(index=False))

# Save model
model_path = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

with open(model_path, 'wb') as f:
    pickle.dump(model, f)
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)

print(f"\n{'=' * 70}")
print("MODEL SAVED SUCCESSFULLY")
print("=" * 70)
print(f"✅ Model: {model_path}")
print(f"✅ Scaler: {scaler_path}")
print(f"✅ Crops: {len(crop_parameters)}")
print(f"✅ Trees: 300")
print(f"✅ Samples: {len(df)}")

# Test various scenarios
print(f"\n{'=' * 70}")
print("TESTING PREDICTIONS ON DIVERSE SCENARIOS")
print("=" * 70)

test_scenarios = [
    {"name": "High Rainfall Tropical", "data": [90, 42, 43, 27, 80, 6.5, 1500]},
    {"name": "Cool Moderate Climate", "data": [110, 35, 35, 18, 60, 6.8, 450]},
    {"name": "Hot Dry Region", "data": [50, 30, 30, 32, 45, 7.0, 400]},
    {"name": "Balanced Conditions", "data": [80, 45, 50, 24, 65, 6.5, 800]},
    {"name": "High NPK Rich Soil", "data": [200, 100, 300, 28, 75, 6.8, 1800]},
]

for scenario in test_scenarios:
    test_input = pd.DataFrame([scenario["data"]], columns=X.columns)
    test_scaled = scaler.transform(test_input)
    prediction = model.predict(test_scaled)[0]
    probabilities = model.predict_proba(test_scaled)[0]
    top_3_idx = np.argsort(probabilities)[-3:][::-1]
    
    print(f"\n{scenario['name']}:")
    print(f"  Input: N={scenario['data'][0]}, P={scenario['data'][1]}, K={scenario['data'][2]}")
    print(f"         Temp={scenario['data'][3]}°C, Humidity={scenario['data'][4]}%")
    print(f"         pH={scenario['data'][5]}, Rainfall={scenario['data'][6]}mm")
    print(f"  🌾 Top Prediction: {prediction.upper()} ({max(probabilities)*100:.1f}%)")
    print(f"  📊 Top 3:")
    for idx in top_3_idx:
        print(f"      {model.classes_[idx]}: {probabilities[idx]*100:.1f}%")

print(f"\n{'=' * 70}")
print("🎉 TRAINING COMPLETE - ADVANCED ML MODEL READY!")
print("=" * 70 + "\n")
