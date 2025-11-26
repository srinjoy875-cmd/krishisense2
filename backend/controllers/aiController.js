const { query } = require("../config/db");
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
});

async function getAIAnalysis(req, res) {
  try {
    // 1. Fetch recent sensor data (last 10 readings)
    const sensorData = await query(`
            SELECT 
                d.name as device_name,
                d.zone,
                s.moisture,
                s.temperature,
                s.humidity,
                s.sunlight,
                s.created_at
            FROM sensor_data s
            JOIN devices d ON s.device_id = d.device_id
            ORDER BY s.created_at DESC
            LIMIT 10
        `);

    if (sensorData.rows.length === 0) {
      return res.status(404).json({ message: 'No sensor data available for analysis.' });
    }

    // 2. Prepare prompt for Groq
    const dataString = JSON.stringify(sensorData.rows, null, 2);
    const prompt = `
            You are an expert agricultural AI advisor for KrishiSense. 
            Analyze the following recent sensor data from our IoT devices:
            ${dataString}

            Provide a concise, actionable report in Markdown format.
            Focus on:
            1. **Current Status**: Are conditions optimal? (Moisture, Temp, Light)
            2. **Anomalies**: Any sudden drops or spikes?
            3. **Recommendations**: Specific actions (e.g., "Turn on irrigation in Zone 1", "Check sensor X").
            
            Keep the tone professional yet encouraging. Use emojis where appropriate.
        `;

    // 3. Call Groq API
    // Check if this is a chat request (has messages) or a fresh analysis
    let messages;
    let sessionId = req.body.sessionId;

    if (req.body.messages) {
      // Chat mode: Append system context + user messages
      messages = [
        {
          role: "system",
          content: `You are an expert agricultural AI advisor for KrishiSense. 
                Here is the latest sensor data context: ${dataString}.
                Answer the user's questions based on this data and general agricultural knowledge.
                Keep answers concise and helpful.`
        },
        ...req.body.messages
      ];
    } else {
      // Analysis mode: Use the prompt
      messages = [{ role: "user", content: prompt }];
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const analysis = chatCompletion.choices[0]?.message?.content || "Could not generate analysis.";

    // 4. Save to Chat History (if sessionId is provided)
    if (sessionId) {
      // Save User Message (last one)
      if (req.body.messages && req.body.messages.length > 0) {
        const lastUserMsg = req.body.messages[req.body.messages.length - 1];
        if (lastUserMsg.role === 'user') {
          await query('INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'user', lastUserMsg.content]);
        }
      } else {
        // Initial Analysis Prompt (if we want to save it as a user message, optional)
        // await query('INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'user', 'Analyze current sensor data']);
      }

      // Save AI Response
      await query('INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)', [sessionId, 'assistant', analysis]);

      // Update session timestamp
      await query('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);
    }

    res.json({ analysis });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ message: 'Failed to generate AI analysis.' });
  }
};

module.exports = { getAIAnalysis };
