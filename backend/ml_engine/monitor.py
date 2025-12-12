import sys
import json
import os

# Load Data
try:
    with open(os.path.join(os.path.dirname(__file__), 'crop_data.json'), 'r') as f:
        crop_db = json.load(f)
except Exception as e:
    print(json.dumps({"error": f"Failed to load crop database: {str(e)}"}))
    sys.exit(1)

def monitor(data):
    crop_name = data.get('crop_name')
    if not crop_name:
        return {"error": "Crop name is required for monitoring"}

    # Find crop in DB
    crop_info = next((c for c in crop_db if c['label'].lower() == crop_name.lower()), None)
    
    if not crop_info:
        return {"error": "Crop not found in database", "status": "Unknown"}

    # Input Data
    try:
        temp = float(data.get('temperature', 25))
        moisture = float(data.get('moisture', 50))
    except:
        return {"error": "Invalid sensor numbers"}

    alerts = []
    status = "Healthy"

    # Analyze Temperature
    if temp < crop_info['min_temp']:
        alerts.append(f"Temperature ({temp}°C) is too low. Risk of cold stress. Ideal min: {crop_info['min_temp']}°C")
        status = "Warning"
    elif temp > crop_info['max_temp']:
        alerts.append(f"Temperature ({temp}°C) is too high. Risk of heat stress and water loss. Ideal max: {crop_info['max_temp']}°C")
        status = "Warning"

    # Analyze Moisture
    if moisture < crop_info['min_moisture']:
        alerts.append(f"Soil moisture ({moisture}%) is critically low. Immediate irrigation required.")
        status = "Critical" if moisture < crop_info['min_moisture'] - 10 else "Warning"
    elif moisture > crop_info['max_moisture']:
        alerts.append(f"Soil moisture ({moisture}%) is too high. Stop irrigation to prevent root rot.")
        status = "Warning"

    return {
        "crop": crop_name,
        "status": status,
        "parameters": {
            "temperature": {"value": temp, "status": "OK" if not any("Temperature" in a for a in alerts) else "Alert"},
            "moisture": {"value": moisture, "status": "OK" if not any("moisture" in a for a in alerts) else "Alert"}
        },
        "alerts": alerts,
        "recommendation": "Maintain current conditions." if status == "Healthy" else "Correct environmental factors immediately."
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data received"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        result = monitor(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
