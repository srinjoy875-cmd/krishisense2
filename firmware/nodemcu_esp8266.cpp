#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// --- CONFIGURATION ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://krishisense-backend.onrender.com/api/sensor/upload";
const char* deviceId = "KS-001";
const int zone = 1;

// --- PINS (NodeMCU ESP8266) ---
const int MOISTURE_PIN = D2;    // Digital Input (Soil Moisture Module DO pin)
const int RELAY_PIN = D1;       // Digital Output (Pump Relay)
const int DHT_PIN = D4;         // Digital Input (DHT22 Temp/Humidity sensor)
const int LDR_PIN = A0;         // Analog Input (LDR/Sunlight sensor) - ONLY analog pin!

// --- VARIABLES ---
unsigned long lastTime = 0;
unsigned long timerDelay = 10000; // 10 seconds

void setup() {
  Serial.begin(115200);
  
  pinMode(MOISTURE_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump OFF initially

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Send data every 10 seconds
  if ((millis() - lastTime) > timerDelay) {
    if(WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;

      // 1. Read Sensors
      
      // Read Soil Moisture Module (Digital: HIGH = Dry, LOW = Wet)
      int moistureDigital = digitalRead(MOISTURE_PIN);
      // Convert to percentage: LOW (0) = Wet (100%), HIGH (1) = Dry (0%)
      int moisturePercent = (moistureDigital == LOW) ? 100 : 0;
      // If your module has inverted logic, swap the values above
      
      // Read LDR (Analog 10-bit: 0-1023)
      int sunlightRaw = analogRead(LDR_PIN);
      // Map to percentage: 0 (dark) to 100 (bright)
      int sunlightPercent = map(sunlightRaw, 0, 1023, 0, 100);
      sunlightPercent = constrain(sunlightPercent, 0, 100);

      // Mock Temp/Humidity for now (add DHT library later)
      float temperature = 25.5 + (random(-20, 20) / 10.0);
      float humidity = 60.0 + (random(-50, 50) / 10.0);

      // 2. Prepare JSON Payload
      StaticJsonDocument<200> doc;
      doc["device_id"] = deviceId;
      doc["moisture"] = moisturePercent;
      doc["temperature"] = temperature;
      doc["humidity"] = humidity;
      doc["sunlight"] = sunlightPercent;
      doc["zone"] = zone;

      String requestBody;
      serializeJson(doc, requestBody);

      // 3. Send POST Request
      http.begin(client, serverUrl);
      http.addHeader("Content-Type", "application/json");
      
      int httpResponseCode = http.POST(requestBody);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println(httpResponseCode);
        Serial.println(response);

        // 4. Handle Response (Pump Control)
        StaticJsonDocument<200> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);

        if (!error) {
          const char* command = responseDoc["command"];
          if (strcmp(command, "ON") == 0) {
            digitalWrite(RELAY_PIN, HIGH);
            Serial.println("Pump turned ON");
          } else if (strcmp(command, "OFF") == 0) {
            digitalWrite(RELAY_PIN, LOW);
            Serial.println("Pump turned OFF");
          }
        }
      } else {
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}
