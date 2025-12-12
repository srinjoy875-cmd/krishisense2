import sys
import json
import os
import pickle
import pandas as pd
import numpy as np

# Load ALL trained models
model_path = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')
ensemble_path = os.path.join(os.path.dirname(__file__), 'ensemble_model.pkl')
scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')
encoder_path = os.path.join(os.path.dirname(__file__), 'soil_encoder.pkl')
crop_data_path = os.path.join(os.path.dirname(__file__), 'crop_data.json')

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
    with open(crop_data_path, 'r') as f:
        crop_db = json.load(f)
    
    # Try to load ensemble and encoder (may not exist in older versions)
    try:
        with open(ensemble_path, 'rb') as f:
            ensemble_model = pickle.load(f)
        use_ensemble = True
    except:
        ensemble_model = None
        use_ensemble = False
    
    try:
        with open(encoder_path, 'rb') as f:
            soil_encoder = pickle.load(f)
    except:
        soil_encoder = None
        
except FileNotFoundError as e:
    print(json.dumps({
        "error": "ML model not found. Please run train_model.py first.",
        "details": str(e)
    }))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

# Create crop database lookup
crop_info_map = {crop['label'].lower(): crop for crop in crop_db}

def calculate_yield_potential(crop_name, input_params, confidence):
    """Estimate yield potential"""
    crop_info = crop_info_map.get(crop_name.lower(), {})
    base_yield = confidence
    npk_score = 0
    
    if crop_info:
        n_optimal = crop_info.get('min_n', 0) <= input_params['N'] <= crop_info.get('max_n', 999)
        p_optimal = crop_info.get('min_p', 0) <= input_params['P'] <= crop_info.get('max_p', 999)
        k_optimal = crop_info.get('min_k', 0) <= input_params['K'] <= crop_info.get('max_k', 999)
        npk_score = sum([n_optimal, p_optimal, k_optimal]) / 3 * 15
    
    yield_potential = min(100, base_yield + npk_score)
    
    if yield_potential >= 85:
        return {"rating": "Excellent", "percentage": round(yield_potential, 1), "grade": "A+"}
    elif yield_potential >= 75:
        return {"rating": "Very Good", "percentage": round(yield_potential, 1), "grade": "A"}
    elif yield_potential >= 65:
        return {"rating": "Good", "percentage": round(yield_potential, 1), "grade": "B+"}
    elif yield_potential >= 50:
        return {"rating": "Fair", "percentage": round(yield_potential, 1), "grade": "B"}
    else:
        return {"rating": "Below Average", "percentage": round(yield_potential, 1), "grade": "C"}

def assess_risk_factors(crop_name, input_params):
    """Identify risk factors"""
    risks = []
    crop_info = crop_info_map.get(crop_name.lower(), {})
    
    if not crop_info:
        return ["⚠ Limited crop data"]
    
    temp = input_params['temperature']
    if temp < crop_info.get('min_temp', -100):
        risks.append(f"❄️ FROST RISK: Temp {temp}°C below minimum")
    elif temp > crop_info.get('max_temp', 100):
        risks.append(f"🔥 HEAT STRESS: Temp {temp}°C above maximum")
    
    moisture = input_params.get('moisture', input_params.get('humidity', 50))
    if moisture < 30:
        risks.append(f"💧 DROUGHT RISK: Low moisture ({moisture}%)")
    elif moisture > 90:
        risks.append(f"🌊 WATERLOG RISK: Excessive moisture")
    
    rainfall = input_params.get('rainfall', 800)
    if rainfall < crop_info.get('min_rainfall', 0):
        risks.append(f"☔ IRRIGATION REQUIRED")
    
    ph = input_params['ph']
    if ph < crop_info.get('min_ph', 0):
        risks.append(f"🧪 ACIDIC SOIL: Apply lime")
    elif ph > crop_info.get('max_ph', 14):
        risks.append(f"🧪 ALKALINE SOIL: Add sulfur")
    
    return risks if risks else ["✅ No major risks detected"]

def analyze_feature_contribution(input_values, prediction):
    """Analyze feature contributions"""
    # Feature names (with or without soil_type_encoded)
    if len(input_values) == 8:
        feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_type']
    else:
        feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    
    contributions = []
    feature_importance = model.feature_importances_
    
    for i, (feature, importance) in enumerate(zip(feature_names[:len(input_values)], feature_importance)):
        contributions.append({
            "feature": feature.upper() if feature in ['N', 'P', 'K'] else feature.capitalize(),
            "value": input_values[i],
            "importance": round(importance * 100, 1),
            "impact": "High" if importance > 0.15 else "Medium" if importance > 0.10 else "Low"
        })
    
    contributions.sort(key=lambda x: x['importance'], reverse=True)
    return contributions[:5]

def recommend(data):
    """
    ULTIMATE ML-based crop recommendation with maximum confidence.
    Uses optimized Random Forest + optional Ensemble model.
    """
    
    # Extract input params
    try:
        n = float(data.get('N', 50))
        p = float(data.get('P', 50)) 
        k = float(data.get('K', 50))
        temp = float(data.get('temperature', 25))
        humidity = float(data.get('humidity', 50))
        moisture = float(data.get('moisture', humidity))
        ph = float(data.get('ph', 6.5))
        rainfall = float(data.get('rainfall', 800))
        soil_type = data.get('soil_type', 'Loam')
    except (ValueError, TypeError):
        return {"error": "Invalid input numbers"}

    input_params = {
        'N': n, 'P': p, 'K': k, 'temperature': temp,
        'humidity': humidity, 'ph': ph, 'rainfall': rainfall,
        'moisture': moisture, 'soil_type': soil_type
    }

    # Prepare input for model
    try:
        # Encode soil type if encoder exists
        if soil_encoder is not None:
            try:
                soil_encoded = soil_encoder.transform([soil_type])[0]
                input_df = pd.DataFrame([[n, p, k, temp, humidity, ph, rainfall, soil_encoded]],
                                       columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_type_encoded'])
            except:
                # Soil type not in training data, use default
                soil_encoded = 0
                input_df = pd.DataFrame([[n, p, k, temp, humidity, ph, rainfall, soil_encoded]],
                                       columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_type_encoded'])
        else:
            # No encoder, use old format
            input_df = pd.DataFrame([[n, p, k, temp, humidity, ph, rainfall]],
                                   columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'])

        # Scale features
        input_scaled = scaler.transform(input_df)
        
        # Get predictions (use ensemble if available)
        active_model = ensemble_model if use_ensemble else model
        prediction = active_model.predict(input_scaled)[0]
        probabilities = active_model.predict_proba(input_scaled)[0]
        classes = active_model.classes_
        
        # Feature analysis
        feature_analysis = analyze_feature_contribution(input_df.values[0], prediction)
        
        # Build crop predictions
        crop_predictions = []
        for crop_name, prob in zip(classes, probabilities):
            confidence = prob * 100
            
            crop_details = crop_info_map.get(crop_name.lower(), {})
            
            if confidence >= 70:
                quality = "Excellent"
                emoji = "🌟"
            elif confidence >= 50:
                quality = "Good"
                emoji = "✅"
            elif confidence >= 30:
                quality = "Fair"
                emoji = "⚡"
            else:
                quality = "Low"
                emoji = "⚠️"
            
            yield_info = calculate_yield_potential(crop_name, input_params, confidence)
            risk_factors = assess_risk_factors(crop_name, input_params)
            
            match_reasons = []
            warnings = []
            
            if crop_details:
                if crop_details.get('min_temp', 0) <= temp <= crop_details.get('max_temp', 100):
                    match_reasons.append(f"✓ Temperature optimal ({temp}°C)")
                else:
                    warnings.append(f"⚠ Temperature outside range")
                
                n_ok = crop_details.get('min_n', 0) <= n <= crop_details.get('max_n', 999)
                p_ok = crop_details.get('min_p', 0) <= p <= crop_details.get('max_p', 999)
                k_ok = crop_details.get('min_k', 0) <= k <= crop_details.get('max_k', 999)
                
                if all([n_ok, p_ok, k_ok]):
                    match_reasons.append(f"✓ NPK perfectly balanced")
                else:
                    if not n_ok:
                        warnings.append(f"⚠ Adjust Nitrogen levels")
                
                if crop_details.get('min_rainfall', 0) <= rainfall <= crop_details.get('max_rainfall', 9999):
                    match_reasons.append(f"✓ Rainfall suitable")
            
            if confidence >= 5:
                crop_predictions.append({
                    "crop": crop_name.capitalize(),
                    "score": round(confidence, 1),
                    "quality": quality,
                    "emoji": emoji,
                    "desc": crop_details.get('desc', 'Agricultural crop'),
                    "season": crop_details.get('season', 'All Year'),
                    "growth_duration": crop_details.get('growth_duration', 'N/A'),
                    "water_requirement": crop_details.get('water_requirement', 'Moderate'),
                    "match_reasons": match_reasons[:3],
                    "warnings": warnings[:2],
                    "ml_confidence": round(confidence, 2),
                    "yield_potential": yield_info,
                    "risk_factors": risk_factors[:3],
                    "estimated_roi": "High" if confidence >= 75 else "Medium" if confidence >= 50 else "Low"
                })
        
        crop_predictions.sort(key=lambda x: x['score'], reverse=True)
        
        excellent = [c for c in crop_predictions if c['score'] >= 70]
        good = [c for c in crop_predictions if 50 <= c['score'] < 70]
        fair = [c for c in crop_predictions if 30 <= c['score'] < 50]
        
        env_quality = "Excellent" if len(excellent) >= 3 else "Good" if len(excellent) >= 1 else "Fair"
        
        model_description = "Ensemble (RF+GB+SVC, 4500 samples)" if use_ensemble else "Optimized Random Forest (4500 samples)"
        
        return {
            "recommended": crop_predictions[:7],
            "ml_method": model_description,
            "model_confidence": round(max(probabilities) * 100, 2),
            "top_prediction": prediction.capitalize(),
            "excellent_matches": len(excellent),
            "good_matches": len(good),
            "fair_matches": len(fair),
            "total_analyzed": len(crop_predictions),
            "feature_analysis": feature_analysis,
            "environmental_quality": env_quality,
            "input_summary": {
                "nitrogen": n,
                "phosphorus": p,
                "potassium": k,
                "temp": temp,
                "humidity": humidity,
                "ph": ph,
                "rainfall": rainfall,
                "soil_type": soil_type
            },
            "insights": {
                "best_crop": prediction.capitalize(),
                "confidence_level": "High" if max(probabilities) > 0.7 else "Moderate" if max(probabilities) > 0.5 else "Low",
                "npk_status": "Balanced" if all([40 <= n <= 150, 30 <= p <= 90, 30 <= k <= 150]) else "Needs Adjustment",
                "season_suitability": "Optimal" if env_quality == "Excellent" else "Acceptable"
            }
        }
        
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data received"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        result = recommend(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
