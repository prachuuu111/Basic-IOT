const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder and db.json exist
function ensureDatabase() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [
        {
          id: 'user_demo',
          name: 'Ashish',
          email: 'ashish@example.com',
          password: 'password123'
        }
      ],
      deviceState: {
        lcdLine1: 'SMART DISPLAY',
        lcdLine2: 'Simple IoT World',
        led: false,
        lastPing: 0
      },
      readings: [
        {
          id: 1,
          temperature: 34,
          humidity: 50,
          time: '12:30 PM',
          date: '03-10-2026',
          timestamp: Date.now() - 60000
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

// Database helper functions
function readDB() {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { users: [], deviceState: { lcdLine1: 'SMART DISPLAY', lcdLine2: 'Simple IoT World', led: false, lastPing: 0 }, readings: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err);
    return false;
  }
}

// Format Date & Time for Asia/Kolkata (+05:30)
function getKolkataDateTime(dateObj = new Date()) {
  // Format Time: e.g. "12:30 PM"
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // Format Date: e.g. "DD-MM-YYYY"
  const partsFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const time = timeFormatter.format(dateObj); // "12:30 PM"
  const formattedDate = partsFormatter.format(dateObj).replace(/\//g, '-'); // "03-10-2026"

  return { time, date: formattedDate };
}

// ==========================================
// Authentication Endpoints
// ==========================================

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields (Name, Email, Password) are required' });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  const newUser = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password.trim()
  };

  db.users.push(newUser);
  writeDB(db);

  return res.json({
    success: true,
    message: 'Registration successful!',
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const db = readDB();
  const user = db.users.find(
    u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  return res.json({
    success: true,
    message: 'Login successful',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// ==========================================
// IoT / ESP8266 & Sensor Endpoints
// ==========================================

// Record sensor data (POST from ESP8266 or web simulator)
app.post('/api/sensor-data', (req, res) => {
  let { temperature, humidity } = req.body;

  // Support alternate keys or query params
  if (temperature === undefined) temperature = req.query.temperature || req.query.temp;
  if (humidity === undefined) humidity = req.query.humidity || req.query.hum;

  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({ success: false, message: 'Temperature and humidity are required' });
  }

  const tempNum = parseFloat(temperature);
  const humNum = parseFloat(humidity);

  if (isNaN(tempNum) || isNaN(humNum)) {
    return res.status(400).json({ success: false, message: 'Invalid temperature or humidity values' });
  }

  const db = readDB();
  const now = new Date();
  const { time, date } = getKolkataDateTime(now);

  const newId = db.readings.length > 0 ? Math.max(...db.readings.map(r => r.id || 0)) + 1 : 1;

  const newRecord = {
    id: newId,
    temperature: Math.round(tempNum * 10) / 10,
    humidity: Math.round(humNum * 10) / 10,
    time,
    date,
    timestamp: now.getTime()
  };

  db.readings.push(newRecord);

  // Update ESP8266 last ping
  db.deviceState.lastPing = now.getTime();
  writeDB(db);

  // Return current device state so ESP8266 can immediately read LED and LCD state!
  return res.json({
    status: 'success',
    message: 'Data recorded',
    record: newRecord,
    led: db.deviceState.led ? 1 : 0,
    ledStatus: db.deviceState.led ? 'ON' : 'OFF',
    lcdLine1: db.deviceState.lcdLine1,
    lcdLine2: db.deviceState.lcdLine2
  });
});

// GET support for ESP8266 (if using simple GET request)
app.get('/api/sensor-data', (req, res) => {
  const { temp, hum, temperature, humidity } = req.query;
  const t = temperature || temp;
  const h = humidity || hum;

  if (t !== undefined && h !== undefined) {
    const db = readDB();
    const now = new Date();
    const { time, date } = getKolkataDateTime(now);

    const newId = db.readings.length > 0 ? Math.max(...db.readings.map(r => r.id || 0)) + 1 : 1;
    const newRecord = {
      id: newId,
      temperature: Math.round(parseFloat(t) * 10) / 10,
      humidity: Math.round(parseFloat(h) * 10) / 10,
      time,
      date,
      timestamp: now.getTime()
    };

    db.readings.push(newRecord);
    db.deviceState.lastPing = now.getTime();
    writeDB(db);

    return res.json({
      status: 'success',
      record: newRecord,
      led: db.deviceState.led ? 1 : 0,
      ledStatus: db.deviceState.led ? 'ON' : 'OFF',
      lcdLine1: db.deviceState.lcdLine1,
      lcdLine2: db.deviceState.lcdLine2
    });
  }

  // If no params, return latest reading
  const db = readDB();
  const latest = db.readings.length > 0 ? db.readings[db.readings.length - 1] : null;
  return res.json({ latest });
});

// GET Device State (For ESP8266 or Dashboard polling)
app.get('/api/device-state', (req, res) => {
  const db = readDB();
  const isEsp = req.query.client === 'esp8266';
  
  if (isEsp) {
    db.deviceState.lastPing = Date.now();
    writeDB(db);
  }

  const now = Date.now();
  const lastPing = db.deviceState.lastPing || 0;
  // Consider online if pinged within the last 25 seconds
  const isOnline = (now - lastPing) < 25000;

  return res.json({
    led: db.deviceState.led ? 1 : 0,
    ledStatus: db.deviceState.led ? 'ON' : 'OFF',
    lcdLine1: db.deviceState.lcdLine1 || 'SMART DISPLAY',
    lcdLine2: db.deviceState.lcdLine2 || 'Simple IoT World',
    isOnline,
    lastPing,
    lastPingSecondsAgo: Math.floor((now - lastPing) / 1000)
  });
});

// Update LCD Text (Tab 2)
app.post('/api/device/lcd', (req, res) => {
  let { line1, line2 } = req.body;

  if (line1 === undefined && line2 === undefined) {
    return res.status(400).json({ success: false, message: 'line1 or line2 required' });
  }

  // Ensure max 16 characters
  line1 = (line1 || '').toString().slice(0, 16);
  line2 = (line2 || '').toString().slice(0, 16);

  const db = readDB();
  db.deviceState.lcdLine1 = line1;
  db.deviceState.lcdLine2 = line2;
  writeDB(db);

  return res.json({
    success: true,
    message: 'LCD details updated successfully',
    lcdLine1: line1,
    lcdLine2: line2
  });
});

// Toggle or Set LED Status (Tab 3)
app.post('/api/device/led', (req, res) => {
  const db = readDB();
  let newStatus;

  if (req.body && req.body.led !== undefined) {
    newStatus = Boolean(req.body.led);
  } else {
    newStatus = !db.deviceState.led;
  }

  db.deviceState.led = newStatus;
  writeDB(db);

  return res.json({
    success: true,
    led: newStatus,
    ledStatus: newStatus ? 'ON' : 'OFF',
    message: `LED turned ${newStatus ? 'ON' : 'OFF'}`
  });
});

// ==========================================
// Dashboard Readings & Pagination
// ==========================================

// Get saved records with pagination & stats
app.get('/api/readings', (req, res) => {
  const db = readDB();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Sorted latest first
  const allReadings = [...db.readings].reverse();
  const total = allReadings.length;
  const totalPages = Math.ceil(total / limit) || 1;

  const startIndex = (page - 1) * limit;
  const paginatedReadings = allReadings.slice(startIndex, startIndex + limit);

  // Latest single reading for gauge
  const latest = db.readings.length > 0 ? db.readings[db.readings.length - 1] : {
    temperature: 0,
    humidity: 0,
    time: '--:--',
    date: '--'
  };

  // Last 15 readings for graph (chronological order)
  const graphData = db.readings.slice(-15);

  const now = Date.now();
  const isOnline = (now - (db.deviceState.lastPing || 0)) < 25000;

  return res.json({
    success: true,
    page,
    limit,
    total,
    totalPages,
    readings: paginatedReadings,
    latest,
    graphData,
    deviceState: {
      ...db.deviceState,
      isOnline,
      lastPingSecondsAgo: Math.floor((now - (db.deviceState.lastPing || 0)) / 1000)
    }
  });
});

// Delete specific reading
app.delete('/api/readings/:id', (req, res) => {
  const idToDelete = parseInt(req.params.id);
  const db = readDB();

  const initialLength = db.readings.length;
  db.readings = db.readings.filter(r => r.id !== idToDelete);

  if (db.readings.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  writeDB(db);
  return res.json({ success: true, message: `Record #${idToDelete} deleted successfully` });
});

// Clear all records (Optional helper)
app.delete('/api/readings', (req, res) => {
  const db = readDB();
  db.readings = [];
  writeDB(db);
  return res.json({ success: true, message: 'All records cleared' });
});

// Seed sample data (Helper for testing)
app.post('/api/readings/seed', (req, res) => {
  const db = readDB();
  const sampleTemps = [28.5, 29.2, 31.0, 33.4, 34.0, 35.5, 36.2, 37.1, 38.0, 37.8];
  const sampleHums = [65.0, 62.5, 58.0, 55.2, 52.0, 49.5, 48.0, 46.2, 45.0, 46.5];

  const now = Date.now();
  for (let i = 0; i < sampleTemps.length; i++) {
    const timestamp = now - (sampleTemps.length - i) * 60000;
    const dateObj = new Date(timestamp);
    const { time, date } = getKolkataDateTime(dateObj);
    const newId = db.readings.length > 0 ? Math.max(...db.readings.map(r => r.id || 0)) + 1 : 1;
    db.readings.push({
      id: newId,
      temperature: sampleTemps[i],
      humidity: sampleHums[i],
      time,
      date,
      timestamp
    });
  }

  // Also simulate recent ping
  db.deviceState.lastPing = Date.now();
  writeDB(db);

  return res.json({ success: true, message: 'Sample readings generated', count: sampleTemps.length });
});

// System Status endpoint
app.get('/api/status', (req, res) => {
  const db = readDB();
  const now = Date.now();
  const lastPing = db.deviceState.lastPing || 0;
  const isOnline = (now - lastPing) < 25000;

  return res.json({
    appName: 'Simple IoT World',
    status: 'operational',
    isOnline,
    lastPing,
    lastPingSecondsAgo: Math.floor((now - lastPing) / 1000),
    deviceState: db.deviceState
  });
});

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 Simple IoT World Server running on port ${PORT}`);
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Timezone: Asia/Kolkata (+05:30)`);
  console.log(`📡 Ready for ESP8266 & Render Deployment`);
  console.log(`===============================================`);
});
