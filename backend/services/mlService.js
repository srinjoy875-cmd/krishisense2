const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Ensure env vars are loaded
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

/**
 * ML Service Adapter
 * Abstract the communication with the ML Engine (Python).
 */
const mlService = {
    /**
     * Get crop recommendations
     * @param {Object} data - Schema: { N, P, K, temperature, humidity, ph, rainfall, soil_type, ... }
     * @returns {Promise<Object>} - Prediction result
     */
    async predict(data) {
        try {
            console.log(`[ML Adapter] Requesting prediction from: ${ML_API_URL}/predict`);

            const response = await axios.post(`${ML_API_URL}/predict`, data, {
                timeout: 10000, // 10s timeout
                headers: { 'Content-Type': 'application/json' }
            });

            return response.data;
        } catch (error) {
            console.error("[ML Adapter] Error:", error.message);

            if (error.code === 'ECONNREFUSED') {
                throw new Error("ML Service is offline. Please start the ML Engine.");
            }

            if (error.response) {
                throw new Error(error.response.data.error || `ML Error: ${error.response.status}`);
            }

            throw error;
        }
    },

    /**
     * Health check for ML Service
     */
    async checkHealth() {
        try {
            await axios.get(ML_API_URL);
            return true;
        } catch (e) {
            return false;
        }
    }
};

module.exports = mlService;
