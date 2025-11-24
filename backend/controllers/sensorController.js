const { query } = require('../config/db');

// @desc    Upload sensor data
// @route   POST /api/sensor/upload
// @access  Public (Device)
const uploadData = async (req, res) => {
  const { device_id, moisture, temperature, humidity, sunlight, zone } = req.body;

  if (!device_id || moisture === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // 1. Check if device exists (Auto-Discovery)
    const device = await query('SELECT * FROM devices WHERE device_id = $1', [device_id]);
    if (device.rows.length === 0) {
      await query(
        'INSERT INTO devices (device_id, name, zone, status) VALUES ($1, $2, $3, $4)',
        [device_id, `Device ${device_id}`, zone || 'Unassigned', 'ONLINE']
      );
    } else {
      await query('UPDATE devices SET status = $1 WHERE device_id = $2', ['ONLINE', device_id]);
    }

    // 2. Insert Sensor Data
    const newData = await query(
      'INSERT INTO sensor_data (device_id, moisture, temperature, humidity, sunlight) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [device_id, moisture, temperature, humidity, sunlight || 0]
    );

    // 3. Automation Logic
    const MOISTURE_THRESHOLD = 40;
    let command = 'NONE';

    if (moisture < MOISTURE_THRESHOLD) {
      command = 'ON';
      await query('INSERT INTO irrigation_logs (device_id, command, trigger_source) VALUES ($1, $2, $3)', [device_id, 'ON', 'AUTO']);
    } else if (moisture > MOISTURE_THRESHOLD + 20) {
      command = 'OFF';
      await query('INSERT INTO irrigation_logs (device_id, command, trigger_source) VALUES ($1, $2, $3)', [device_id, 'OFF', 'AUTO']);
    }

    res.status(201).json({
      message: 'Data uploaded successfully',
      data: newData.rows[0],
      command: command
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get latest sensor data for a device
// @route   GET /api/sensor/latest/:device_id
// @access  Private
const getLatestData = async (req, res) => {
  const { device_id } = req.params;
  try {
    const data = await query(
      'SELECT * FROM sensor_data WHERE device_id = $1 ORDER BY created_at DESC LIMIT 1',
      [device_id]
    );
    res.json(data.rows[0] || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get history sensor data
// @route   GET /api/sensor/history/:device_id
// @access  Private
const getHistoryData = async (req, res) => {
  const { device_id } = req.params;
  try {
    const data = await query(
      'SELECT * FROM sensor_data WHERE device_id = $1 ORDER BY created_at DESC LIMIT 50',
      [device_id]
    );
    res.json(data.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadData, getLatestData, getHistoryData };
