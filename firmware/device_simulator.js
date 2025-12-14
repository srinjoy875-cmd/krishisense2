const axios = require('axios');
const io = require('socket.io-client');

// --- CONFIGURATION ---
const SERVER_URL = 'https://krishisense2-backend.onrender.com';
const API_URL = `${SERVER_URL}/api/sensor/upload`;
const DEVICE_ID = 'KS-001';
const ZONE = 1;
const INTERVAL_MS = 5000;

// --- STATE ---
let pumpStatus = 'OFF';
let moisture = 60; // Start with decent moisture

// --- SOCKET CONNECTION ---
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  socket.emit('join_device', DEVICE_ID); // Ensure backend supports joining rooms if implemented, otherwise this is harmless
});

socket.on(`command_${DEVICE_ID}`, (data) => {
  console.log(`\n🔔 MANUAL COMMAND RECEIVED: ${data.command}`);
  if (data.command === 'ON') {
    pumpStatus = 'ON';
    console.log('💦 Pump turned ON (Manual Override)');
  } else if (data.command === 'OFF') {
    pumpStatus = 'OFF';
    console.log('🛑 Pump turned OFF (Manual Override)');
  }
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from Socket.IO server');
});

// --- SIMULATION LOOP ---
console.log(`🚀 Starting Device Simulator: ${DEVICE_ID}`);
console.log(`📡 Connecting to: ${SERVER_URL}`);

setInterval(async () => {
  try {
    // 1. Simulate Dynamic Physics
    // If pump is ON, moisture increases. If OFF, it dries out.
    if (pumpStatus === 'ON') {
      moisture = Math.min(100, moisture + 5);
    } else {
      moisture = Math.max(0, moisture - 1);
    }

    // Temperature: Random fluctuation around 28°C
    const temperature = parseFloat((28 + Math.random() * 4 - 2).toFixed(1));

    // Humidity: Random fluctuation around 60%
    const humidity = Math.floor(60 + Math.random() * 10 - 5);

    // Sunlight: Simulate Day/Night cycle or random clouds (Digital LDR logic: < 500 is Bright)
    const sunlight = Math.random() > 0.5 ? 200 : 800;

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
    console.log(`\n📤 Sending Data (Pump: ${pumpStatus}): Moist=${moisture}%, Temp=${temperature}°C, Light=${sunlight < 500 ? 'Bright' : 'Dark'}`);
    const response = await axios.post(API_URL, payload);

    // 4. Handle Server Auto-Command (Backup to Sockets)
    const command = response.data.command;
    if (command === 'ON' && pumpStatus === 'OFF') {
      pumpStatus = 'ON';
      console.log('💦 AUTO-COMMAND: Pump turned ON');
    } else if (command === 'OFF' && pumpStatus === 'ON') {
      pumpStatus = 'OFF';
      console.log('🛑 AUTO-COMMAND: Pump turned OFF');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.error(`❌ Connection Failed to ${API_URL}`);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}, INTERVAL_MS);
