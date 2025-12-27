import os
import json
import pickle
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Configuration ---
# Models are expected to be in the same directory as this script
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_PATH, 'crop_model.pkl')
SCALER_PATH = os.path.join(BASE_PATH, 'scaler.pkl')
DATA_PATH = os.path.join(BASE_PATH, 'crop_data.json')
SOIL_ENCODER_PATH = os.path.join(BASE_PATH, 'soil_encoder.pkl')

# Global State
model = None
scaler = None
crop_db = None
soil_encoder = None
crop_info_map = {}

def load_models():
    """Load all ML artifacts into memory on startup."""
    global model, scaler, crop_db, soil_encoder, crop_info_map
    
    print(" [ML Engine] Loading models...")
    try:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file missing: {MODEL_PATH}")

        with open(MODEL_PATH, 'rb') as f: model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f: scaler = pickle.load(f)
        with open(DATA_PATH, 'r') as f:
            crop_db = json.load(f)
            crop_info_map = {crop['label'].lower(): crop for crop in crop_db}
            
        if os.path.exists(SOIL_ENCODER_PATH):
            with open(SOIL_ENCODER_PATH, 'rb') as f: soil_encoder = pickle.load(f)
            
        print(" [ML Engine] ✅ Models loaded successfully!")
    except Exception as e:
        print(f" [ML Engine] ❌ Critical Error: {e}")
        # We don't exit here so the server can still start and report health=unhealthy

load_models()

# --- Heuristics ---
def calculate_yield_potential(crop_name, input_params, confidence):
    crop_info = crop_info_map.get(crop_name.lower(), {})
    base_yield = confidence
    npk_score = 0
    if crop_info:
        # Simple rule-based yield adjustment
        n_optimal = crop_info.get('min_n', 0) <= input_params['N'] <= crop_info.get('max_n', 999)
        p_optimal = crop_info.get('min_p', 0) <= input_params['P'] <= crop_info.get('max_p', 999)
        k_optimal = crop_info.get('min_k', 0) <= input_params['K'] <= crop_info.get('max_k', 999)
        npk_score = sum([n_optimal, p_optimal, k_optimal]) / 3 * 15
    return min(100, base_yield + npk_score)

def assess_risk_factors(crop_name, input_params):
    risks = []
    crop_info = crop_info_map.get(crop_name.lower(), {})
    if not crop_info: return []
    
    temp = input_params['temperature']
    if temp < crop_info.get('min_temp', -100): risks.append(f"❄️ FROST RISK: Temp {temp}°C")
    elif temp > crop_info.get('max_temp', 100): risks.append(f"🔥 HEAT STRESS: Temp {temp}°C")
    
    moisture = input_params.get('moisture', 50)
    if moisture < 30: risks.append(f"💧 DROUGHT RISK")
    elif moisture > 90: risks.append(f"🌊 WATERLOG RISK")
    
    return risks

# --- Routes ---

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint."""
    status = "healthy" if model else "unhealthy"
    return jsonify({"status": status, "service": "ML Engine"}), 200 if model else 503

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded"}), 503

    try:
        data = request.json
        # Input Validation & Parsing
        required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
        
        # Prepare Input
        soil_type = data.get('soil_type', 'Loam')
        soil_encoded = 0
        if soil_encoder:
            try: soil_encoded = soil_encoder.transform([soil_type])[0]
            except: soil_encoded = 0
            
        input_vector = [[
            float(data['N']), float(data['P']), float(data['K']),
            float(data['temperature']), float(data['humidity']), float(data['ph']),
            float(data['rainfall']), soil_encoded
        ]]
        
        # Predict
        input_scaled = scaler.transform(pd.DataFrame(input_vector, columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_type_encoded']))
        prediction = model.predict(input_scaled)[0]
        probabilities = model.predict_proba(input_scaled)[0]
        
        # Format Results
        results = []
        classes = model.classes_
        
        for crop, prob in zip(classes, probabilities):
            confidence = prob * 100
            if confidence > 5: # Threshold
                results.append({
                    "crop": crop.capitalize(),
                    "score": round(confidence, 1),
                    "yield_potential": calculate_yield_potential(crop, data, confidence),
                    "risk_factors": assess_risk_factors(crop, data)
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            "top_prediction": prediction.capitalize(),
            "model_confidence": round(max(probabilities) * 100, 2),
            "recommended": results[:5]
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/monitor', methods=['POST'])
def monitor():
    try:
        data = request.json
        crop_name = data.get('crop_name')
        if not crop_name:
            return jsonify({"error": "Crop name is required"}), 400

        # Find crop in DB
        crop_info = next((c for c in crop_db if c['label'].lower() == crop_name.lower()), None)
        
        if not crop_info:
            return jsonify({"error": "Crop not found", "status": "Unknown"}), 404

        # Input Data
        try:
            temp = float(data.get('temperature', 25))
            moisture = float(data.get('moisture', 50))
        except:
            return jsonify({"error": "Invalid sensor numbers"}), 400

        alerts = []
        status = "Healthy"

        # Analyze Temperature
        if temp < crop_info.get('min_temp', -100):
            alerts.append(f"Temperature ({temp}C) is too low. Risk of cold stress. Ideal min: {crop_info.get('min_temp')}C")
            status = "Warning"
        elif temp > crop_info.get('max_temp', 100):
            alerts.append(f"Temperature ({temp}C) is too high. Risk of heat stress. Ideal max: {crop_info.get('max_temp')}C")
            status = "Warning"

        # Analyze Moisture
        min_moisture = crop_info.get('min_moisture', 30)
        max_moisture = crop_info.get('max_moisture', 80)
        
        if moisture < min_moisture:
            alerts.append(f"Soil moisture ({moisture}%) is critically low. Immediate irrigation required.")
            status = "Critical" if moisture < min_moisture - 10 else "Warning"
        elif moisture > max_moisture:
            alerts.append(f"Soil moisture ({moisture}%) is too high. Stop irrigation.")
            status = "Warning"

        return jsonify({
            "crop": crop_name,
            "status": status,
            "parameters": {
                "temperature": {"value": temp, "status": "OK" if not any("Temperature" in a for a in alerts) else "Alert"},
                "moisture": {"value": moisture, "status": "OK" if not any("moisture" in a for a in alerts) else "Alert"}
            },
            "alerts": alerts,
            "recommendation": "Maintain current conditions." if status == "Healthy" else "Correct environmental factors immediately."
        })

    except Exception as e:
        print(f"Monitor Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f" [ML Engine] Starting on port {port}...")
    app.run(host='0.0.0.0', port=port)
