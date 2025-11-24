const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  // 1. Connect to default 'postgres' database to create the new DB
  const defaultClient = new Client({
    connectionString: process.env.DATABASE_URL.replace('/krishisense', '/postgres')
  });

  try {
    await defaultClient.connect();
    console.log('Connected to PostgreSQL...');

    // Check if database exists
    const res = await defaultClient.query("SELECT 1 FROM pg_database WHERE datname = 'krishisense'");
    if (res.rows.length === 0) {
      console.log('Creating database "krishisense"...');
      await defaultClient.query('CREATE DATABASE krishisense');
      console.log('Database created!');
    } else {
      console.log('Database "krishisense" already exists.');
    }
    await defaultClient.end();

    // 2. Connect to the new 'krishisense' database
    const dbClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await dbClient.connect();

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run schema
    console.log('Running schema.sql...');
    await dbClient.query(schemaSql);
    console.log('Tables created successfully!');

    await dbClient.end();
    console.log('✅ Database setup complete!');

  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    console.log('Hint: Make sure PostgreSQL is installed and running, and your .env password is correct.');
  }
};

setupDatabase();
