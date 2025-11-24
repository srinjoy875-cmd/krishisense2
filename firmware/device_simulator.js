const axios = require('axios');

// --- CONFIGURATION ---
const SERVER_URL = 'https://krishisense-backend-2.onrender.com/api/sensor/upload';
const DEVICE_ID = 'KS-001';
const ZONE = 1;
const INTERVAL_MS = 5000; // Send data every 5 seconds

// --- STATE ---
let pumpStatus = 'OFF';

// --- SIMULATION LOOP ---
console.log(`🚀 Starting Device Simulator: ${DEVICE_ID}`);
console.log(`📡 Connecting to: ${SERVER_URL}`);

setInterval(async () => {
  try {
    // 1. Simulate Sensor Readings
    // Moisture: Random value between 30% and 70%
    const moisture = Math.floor(Math.random() * (70 - 30 + 1) + 30);

    // Temperature: Random value between 20°C and 35°C
    const temperature = parseFloat((Math.random() * (35 - 20) + 20).toFixed(1));

    // Humidity: Random value between 40% and 80%
    const humidity = Math.floor(Math.random() * (80 - 40 + 1) + 40);

    // Sunlight: Random value between 0 (Bright) and 4095 (Dark)
    const sunlight = Math.floor(Math.random() * (1000 - 100 + 1) + 100);

    // 2. Prepare Payload
    const payload = {
      device_id: DEVICE_ID,
      moisture: moisture,
      temperature: temperature,
      humidity: humidity,
      sunlight: sunlight,
      zone: ZONE
    };

    // 3. Send Data
    console.log(`\n📤 Sending Data: Moisture=${moisture}%, Temp=${temperature}°C, Light=${sunlight}`);
    const response = await axios.post(SERVER_URL, payload);

    // 4. Handle Server Command
    const command = response.data.command;
    if (command === 'ON' && pumpStatus === 'OFF') {
      pumpStatus = 'ON';
      console.log('💦 COMMAND RECEIVED: Pump turned ON');
    } else if (command === 'OFF' && pumpStatus === 'ON') {
      pumpStatus = 'OFF';
      console.log('🛑 COMMAND RECEIVED: Pump turned OFF');
    } else {
      console.log(`✅ Server Response: ${response.data.message} | Pump is ${pumpStatus}`);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection Failed: Is the backend server running?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}, INTERVAL_MS);
