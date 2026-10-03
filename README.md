# Simple IoT World 🌐

A full-stack IoT and Web Application designed for **NodeMCU ESP8266 (CP2102)** with **DHT11 Sensor**, **16x2 I2C LCD**, and **LED Actuator**, seamlessly integrated with an **Express & Node.js backend** and deployable to **Render Cloud**.

---

## 🌟 Key Features

### 🖥️ Web Application
- **Page 1: Auth Portal**:
  - Secure Sign In & Registration (Name, Email, Password).
  - Preloaded Demo User: `ashish@example.com` / `password123`.
- **Header**:
  - Dynamic Greeting: `Welcome Ashish` (or logged-in user).
  - Real-time **ONLINE / OFFLINE Status Badge** for ESP8266 (live heartbeat tracking).
  - **Light / Dark Mode Toggle** with smooth transitions and persistent memory.
  - Quick Logout.
- **Page 2: Web Dashboard Tabs**:
  - **Tab 1: Live Monitoring & Records**:
    - **Section 1**:
      - Real-time **Temperature** & **Humidity** colorful SVG semi-circular Gauges.
      - Dynamic Color Seek / Progress Bars.
      - Real-time dual-axis **Chart.js Line Graphs** (Temperature in Red, Humidity in Sky Blue).
    - **Section 2**:
      - Saved Records Table with **Pagination** controls (5, 10, 25, 50 per page).
      - Table Columns: `# | Temeprature | Humidity | Time | Date | Action (Delete)`
      - Strict **Asia/Kolkata (+05:30)** timezone formatting (`HH:MM AM/PM` and `DD-MM-YYYY`).
      - Individual Record Delete and Batch Clear options.
      - "Simulate Data" feature for quick testing before physical hardware is connected!
  - **Tab 2: LCD 16x2 Display Controller**:
    - Two text input fields (Field 1 and Field 2) with strict 16-character limits and live character counters (`x / 16`).
    - **Interactive HD44780 16x2 Virtual LCD Preview** with green and blue backlight toggles.
    - Save button that pushes custom text to the server for ESP8266 to fetch and show on LCD.
  - **Tab 3: LED Actuator Controller**:
    - **Innovative 3D Neumorphic / Glowing Power Button** with neon aura and pulse waves.
    - Virtual LED simulation pip indicating real-time hardware status.
- **Theme**:
  - Vibrant Red gradient aesthetic (`from-red-600 to-rose-600`), polished dark mode and clean light mode.
- **Footer**:
  - *"Developed with Love ❤️ by Rohit and Team. Department of ETC, SB Jain, Nagpur"* with animated heartbeat pulse.

---

## 🔌 Hardware Circuit & Pin Connections

| Component | NodeMCU ESP8266 Pin | GPIO Pin | Details |
| :--- | :--- | :--- | :--- |
| **DHT11 Data Pin** | **D5** | GPIO 14 | VCC to 3.3V/5V, GND to GND |
| **16x2 LCD I2C SCL** | **D1** | GPIO 5 | VCC to 5V (Vin), GND to GND, I2C Address `0x27` |
| **16x2 LCD I2C SDA** | **D2** | GPIO 4 | Connected to SDA pin of I2C backpack |
| **LED Actuator (+)** | **D3** | GPIO 0 | Connect via 220Ω resistor, Cathode (-) to GND |

---

## 🛠️ Arduino IDE Setup for ESP8266

1. Open **Arduino IDE**.
2. Go to **File > Preferences** and add the ESP8266 Board Manager URL:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Go to **Tools > Board > Boards Manager...**, search for `esp8266` and click **Install**.
4. Select your board: **Tools > Board > ESP8266 Boards > NodeMCU 1.0 (ESP-12E Module)**.
5. Install the required libraries via **Sketch > Include Library > Manage Libraries...**:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
   - `LiquidCrystal_I2C` by Frank de Brabander (or Marco Schwartz)
   - `ArduinoJson` (v6 or v7) by Benoit Blanchon
6. Open [`esp8266/Simple_IoT_World.ino`](esp8266/Simple_IoT_World.ino).
7. Update `ssid` and `password` if different (preset: `ESP8266` / `12345678`).
8. After deploying to Render, paste your Render URL in `serverUrl`:
   ```cpp
   String serverUrl = "https://your-service-name.onrender.com";
   ```
9. Connect your NodeMCU via USB and click **Upload**.

---

## 📟 ESP8266 LCD & Loop Behavior

### Setup Sequence:
1. `R1: MyProject` / `R2: WELCOME` for 3 seconds.
2. `R1: CONNECTING TO` / `R2: WiFi.........`
3. `R1: CONNECTED TO` / `R2: WiFi...SUCCESS`

### Loop Cycle:
- Syncs with server every 10 seconds (sends DHT11 readings, retrieves LED and LCD updates).
- Displays cycling screens:
  1. `R1: TEMPERATURE` / `R2: 38 'C` (2 seconds)
  2. `R1: HUMIDITY` / `R2: 59 %` (2 seconds)
  3. `R1: SMART DISPLAY` / `R2: <MyData>` (2 seconds, fetched from server)
  4. `R1: LED STATUS` / `R2: ON` or `OFF` (2 seconds, fetched from server)

---

## 🚀 How to Run Locally

1. Open a terminal in the project directory:
   ```bash
   cd c:\Users\PRACHI\Desktop\VAC1
   ```
2. Install dependencies (already installed):
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
5. Log in with the preloaded account:
   - **Email**: `ashish@example.com`
   - **Password**: `password123`
   *(Or click "Create Account" to register a new user)*

---

## ☁️ How to Deploy on Render (Free)

Deploying this app to **Render** takes less than 2 minutes:

### Method A: Connect GitHub Repository
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Simple IoT World"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [https://render.com](https://render.com) and log in.
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. Set the following settings:
   - **Name**: `simple-iot-world`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public URL:
   `https://simple-iot-world.onrender.com`
8. Copy this URL and paste it into [`esp8266/Simple_IoT_World.ino`](esp8266/Simple_IoT_World.ino):
   ```cpp
   String serverUrl = "https://simple-iot-world.onrender.com";
   ```

---

## 📁 Project Structure

```
VAC1/
├── data/
│   └── db.json               # Simple JSON Database (users, device state, readings)
├── esp8266/
│   └── Simple_IoT_World.ino  # Complete ESP8266 Arduino Sketch
├── public/
│   ├── css/
│   │   └── style.css         # Custom animations, 3D button, LCD screen styles
│   ├── js/
│   │   └── app.js            # Frontend logic, charts, gauges, pagination, polling
│   └── index.html            # Main HTML with Auth and 3 Dashboard Tabs
├── .gitignore                # Git ignore rules
├── package.json              # Express and CORS dependencies
├── render.yaml               # Render Cloud deployment blueprint
├── server.js                 # Express server with REST API & Asia/Kolkata timezone
└── README.md                 # Complete documentation
```

---

## 👥 Credits
**Developed with ❤️ by Rohit and Team**  
*Department of Electronics & Telecommunication Engineering (ETC)*  
*SB Jain Institute of Technology, Management and Research, Nagpur*
