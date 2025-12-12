const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user exists
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'user']
    );

    // Generate Token
    const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET || 'krishisense_secret_key_123', {
      expiresIn: '30d',
    });

    res.status(201).json({
      id: newUser.rows[0].id,
      name: newUser.rows[0].name,
      email: newUser.rows[0].email,
      role: newUser.rows[0].role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user
    const user = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Account not registered. Please sign up instead.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET || 'krishisense_secret_key_123', {
      expiresIn: '30d',
    });

    res.json({
      id: user.rows[0].id,
      name: user.rows[0].name,
      email: user.rows[0].email,
      role: user.rows[0].role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login };
