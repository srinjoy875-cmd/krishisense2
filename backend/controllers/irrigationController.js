const { query } = require('../config/db');

// @desc    Control irrigation pump manually
// @route   POST /api/irrigation/control
// @access  Private
const controlIrrigation = async (req, res) => {
  const { device_id, command } = req.body; // command: 'ON' or 'OFF'

  if (!device_id || !['ON', 'OFF'].includes(command)) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  try {
    // Log the command
    await query(
      'INSERT INTO irrigation_logs (device_id, command, trigger_source) VALUES ($1, $2, $3)',
      [device_id, command, 'MANUAL']
    );

    // Emit event to device via Socket.io (if connected)
    // The device would listen to 'command_DEVICEID'
    if (req.io) {
      req.io.emit(`command_${device_id}`, { command });
      console.log(`Emitted command_${device_id}: ${command}`);
    }

    res.json({ message: `Pump turned ${command}`, device_id, command });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { controlIrrigation };
