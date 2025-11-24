# KrishiSense IoT Dashboard

A full-stack IoT monitoring and control system for smart irrigation.

## Features
- **Real-time Monitoring**: Soil moisture, temperature, humidity.
- **Remote Control**: Manual pump toggle from dashboard.
- **Automation**: Auto-irrigation based on moisture thresholds.
- **Device Management**: Register and track multiple sensor nodes.
- **Role-based Auth**: Admin and User roles.

## Tech Stack
- **Backend**: Node.js, Express, PostgreSQL, Socket.io
- **Frontend**: React, Vite, Tailwind CSS, Chart.js
- **Firmware**: C++ (ESP32/Arduino)

## Prerequisites
- Node.js (v16+)
- PostgreSQL
- VS Code (recommended)

## Installation

### 1. Database Setup
1. Create a PostgreSQL database named `krishisense`.
2. Run the schema script in your database tool (pgAdmin/DBeaver):
   ```sql
   -- Copy content from backend/schema.sql
   ```

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file based on .env.example (already created)
# Update DATABASE_URL in .env
npm run dev
```
Server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://127.0.0.1:3005`.

## IoT Device Setup
1. Open `firmware/esp32_main.cpp` in Arduino IDE or PlatformIO.
2. Install libraries: `ArduinoJson`, `WiFi`.
3. Update `ssid`, `password`, and `serverUrl` in the code.
4. Flash to ESP32.

## Usage
1. Register a new account on the web app.
2. Go to **Devices** and register your device ID (e.g., `KS-001`).
3. Power on the ESP32. It will start sending data.
4. Monitor data on the **Dashboard**.