const { query } = require('../config/db');

// @desc    Register a new device
// @route   POST /api/device/register
// @access  Private (Admin/User)
const registerDevice = async (req, res) => {
  const { device_id, name, zone, location } = req.body;

  try {
    const deviceExists = await query('SELECT * FROM devices WHERE device_id = $1', [device_id]);
    if (deviceExists.rows.length > 0) {
      return res.status(400).json({ message: 'Device already registered' });
    }

    const newDevice = await query(
      'INSERT INTO devices (device_id, name, zone, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [device_id, name, zone, location]
    );

    res.status(201).json(newDevice.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    List all devices
// @route   GET /api/device/list
// @access  Private
const listDevices = async (req, res) => {
  try {
    const devices = await query('SELECT * FROM devices ORDER BY created_at DESC');
    res.json(devices.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerDevice, listDevices };
