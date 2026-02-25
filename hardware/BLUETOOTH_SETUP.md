# ESP32 Drowsiness Detection - Connectivity Setup Guide

## 📱 Overview
The system supports **BOTH WiFi and Bluetooth Low Energy (BLE)** for communication with the ESP32 controller.

### Connection Options:
- **WiFi Access Point**: Creates a WiFi network that Raspberry Pi and other devices can connect to
- **Bluetooth LE**: Direct Bluetooth connection from compatible browsers (Chrome, Edge, Opera)

## 🔧 Hardware Setup

### Required Components:
- ESP32 Development Board
- Buzzer (connected to GPIO 25)
- 6 Vibration Motors (connected to GPIO 26, 27, 14, 12, 13, 15)
- 2 LEDs for status indication:
  - GREEN LED (connected to GPIO 2) - Connection status
  - RED LED (connected to GPIO 4) - Disconnection status
- Appropriate resistors (220Ω-330Ω for LEDs) and transistors as needed

### Wiring:
```
ESP32 GPIO 25 → Buzzer
ESP32 GPIO 26 → Vibration Motor 1
ESP32 GPIO 27 → Vibration Motor 2
ESP32 GPIO 14 → Vibration Motor 3
ESP32 GPIO 12 → Vibration Motor 4
ESP32 GPIO 13 → Vibration Motor 5
ESP32 GPIO 15 → Vibration Motor 6

LED Status Indicators:
ESP32 GPIO 2  → GREEN LED (+) → 220Ω Resistor → GND  (Connected)
ESP32 GPIO 4  → RED LED (+) → 220Ω Resistor → GND    (Disconnected)

ESP32 GND     → Common Ground
```

### LED Status Indicators:
- **RED LED (GPIO 4)**: Lights up when NO device is connected (waiting for connection)
- **GREEN LED (GPIO 2)**: Lights up when a device is successfully connected via Bluetooth
- Initial state: RED LED ON (waiting for connection)

## 💻 Software Setup

### ESP32 (Arduino IDE):

1. **Install Arduino IDE** if not already installed

2. **Install ESP32 Board**:
   - Go to: File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Go to: Tools → Board → Boards Manager
   - Search for "ESP32" and install

3. **Upload the Code**:
   - Open `hardware/drowsiness_controller.ino`
   - Select: Tools → Board → ESP32 Dev Module
   - Select your COM port: Tools → Port
   - Click Upload (➡️)

4. **Open Serial Monitor**:
   - Set baud rate to **115200**
   - You should see:
     ```
     =================================
     ESP32 Drowsiness Detection Controller
     Bluetooth Low Energy (BLE) Mode
     =================================
     BLE Server started!
     Device Name: ESP32-Drowsiness
     Waiting for connections...
     =================================
     
     =================================
     Setting up WiFi Access Point...
     =================================
     ✓ WiFi AP started successfully!
       SSID: ESP32-Drowsiness-AP
       Password: drowsy123
       IP Address: 192.168.4.1
     
     Raspberry Pi can now connect to this network
     =================================
     ```

## 🌐 WiFi Access Point

### WiFi Network Details:

The ESP32 creates its own WiFi network that devices can connect to:
- **Network Name (SSID)**: `ESP32-Drowsiness-AP`
- **Password**: `drowsy123`
- **IP Address**: `192.168.4.1` (ESP32's IP on the network)

### Purpose:
- Allows Raspberry Pi to connect to the ESP32 over WiFi
- Provides network connectivity for your frontend application
- Works simultaneously with Bluetooth
- No internet access - this is a local network only

### Connecting Devices:
1. On your Raspberry Pi or any device, go to WiFi settings
2. Look for network: **ESP32-Drowsiness-AP**
3. Enter password: **drowsy123**
4. Device is now on the same network as the ESP32
5. The frontend application on Raspberry Pi can now communicate with ESP32

### Frontend (Web Browser):

**WiFi Network** - Used for Raspberry Pi connection
- The ESP32 creates a WiFi network: `ESP32-Drowsiness-AP`
- Raspberry Pi connects to this network
- Frontend runs on Raspberry Pi (not on ESP32)

**Bluetooth Connection** - For direct browser control
⚠️ **Important**: Web Bluetooth only works on:
- ✅ Chrome (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Opera (Desktop)
- ❌ Firefox (Not supported)
- ❌ Safari (Not supported on macOS, limited on iOS)

## 🚀 Usage

### WiFi Network Usage

The ESP32 WiFi network is for connecting your Raspberry Pi or other devices:

1. **Connect Raspberry Pi to ESP32 WiFi**:
   - On Raspberry Pi, connect to WiFi network: `ESP32-Drowsiness-AP`
   - Enter password: `drowsy123`
   - Raspberry Pi is now on the same network as ESP32 (192.168.4.x)

2. **Frontend on Raspberry Pi**:
   - Your frontend application runs on the Raspberry Pi
   - It can communicate with ESP32 over the WiFi network
   - Use ESP32's IP (192.168.4.1) or Bluetooth to send commands

### Bluetooth Connection (From Browser)

1. Make sure your ESP32 is powered on and the Serial Monitor shows "Waiting for connections..."

2. Open the Dashboard in your web browser (Chrome/Edge/Opera)

3. Click the **"Connect to ESP32"** button at the top of the dashboard

4. A popup will appear showing available Bluetooth devices

5. Select your device (should show as "ESP32-Drowsiness")

6. Once connected, you'll see a green "Connected" indicator

### Testing Devices:

1. **Adjust Intensity**: 
   - Use the sliders to set the intensity (0-100%)
   - This controls the actual power/volume output using PWM
   - Duration is fixed at 3 seconds for all tests

2. **Click Test**:
   - Click the "Test" button for either Motor Vibration or Buzzer
   - The ESP32 will receive the command via Bluetooth
   - The device will run at the specified intensity for 3 seconds
   - Check the Serial Monitor to see the output

### Serial Monitor Output:

When you click "Test", you'll see in the Serial Monitor:
```
=================================
[COMMAND RECEIVED]
=================================
Raw command: TEST:buzzer:75
Test Type: buzzer
Intensity: 75% (PWM: 191/255)
Duration: 3000 ms (fixed)
---------------------------------
Testing BUZZER...
  > Buzzer ON at 75% intensity (PWM: 191/255) for 3000 ms
  > Buzzer OFF
Test completed!
=================================
```

## 🔌 Command Protocol

The system uses simple text commands over BLE:

| Command | Format | Example | Description |
|---------|--------|---------intensity` | `TEST:buzzer:75` | Test buzzer at 75% intensity for 3s |
| Test Vibrator | `TEST:vibrator:intensity` | `TEST:vibrator:100` | Test vibrator at 100% intensity for 3s |
| Test Both | `TEST:both:intensity` | `TEST:both:50` | Test both at 50% intensity for 3s |
| Control | `CONTROL:device:state` | `CONTROL:buzzer:on` | Turn device on/off at full power |
| Alert | `ALERT:level` | `ALERT:high` | Trigger alert (low/medium/high) |
| Stop All | `STOP` | `STOP` | Stop all devices immediately |
| Status | `STATUS` | `STATUS` | Request current status |

**Note:** The intensity parameter ranges from 0-100% and controls the actual power output using PWM. All test commands run for a fixed duration of 3 seconds.ly |
| Status | `STATUS` | `STATUS` | Request current status |

## 🐛 Troubleshooting

### WiFi Issues

**"Can't find ESP32-Drowsiness-AP network"**
- Make sure ESP32 is powered on
- Check Serial Monitor - should show "WiFi AP started successfully!"
- Try resetting the ESP32 (press the EN button)
- Move closer to the ESP32 (within 10-20 meters)
- Check if another device is already using that network name

**"Connected to WiFi but can't communicate with ESP32"**
- Make sure you're connected to the correct WiFi network (ESP32-Drowsiness-AP)
- Check that the ESP32 IP is 192.168.4.1 (shown in Serial Monitor)
- Verify your Raspberry Pi has correct network configuration
- Try pinging the ESP32: `ping 192.168.4.1`

**"Wrong password" when connecting to WiFi**
- Default password is: `drowsy123` (all lowercase, no spaces)
- Password is case-sensitive
- If you changed it in the code, use your custom password

### Bluetooth Issues

**"Web Bluetooth is not supported"**
- Use Chrome, Edge, or Opera browser
- Make sure you're using HTTPS (or localhost)
- Check if Bluetooth is enabled on your computer

### Device not appearing in Bluetooth list
- Make sure ESP32 is powered on
- Check Serial Monitor - should show "Waiting for connections..."
- Try resetting the ESP32 (press the EN button)
- Make sure no other device is connected to the ESP32

### Connection drops frequently
- Keep ESP32 within range (< 10 meters)
- Avoid physical obstructions between devices
- Check power supply to ESP32 (USB should provide stable 5V)

### Test button not working
- Make sure you're connected (green indicator showing)
- Check Serial Monitor for error messages
- Try disconnecting and reconnecting

## 📊 Features

### WiFi Features:
✅ **WiFi Access Point Mode** - Creates its own network  
✅ **Network for Raspberry Pi** - Allows Pi to connect and communicate  
✅ **No Internet Dependency** - Works standalone  
✅ **Simple Password Protection** - WPA2 secured  
✅ **192.168.4.1 IP** - Static, predictable address  

### Bluetooth Features:
✅ **Direct BLE Connection** - No WiFi required  
✅ **PWM Intensity Control** - Precise power output control (0-100%)  
✅ **Fixed 3-Second Duration** - Consistent test duration for all devices  
✅ **Serial Monitor Logging** - All commands visible for debugging  
✅ **Auto-reconnection** - Automatic advertising restart after disconnect  

### General Features:
✅ **Dual Connectivity** - Both WiFi and Bluetooth simultaneously  
✅ **Hardware PWM** - Smooth intensity control  
✅ **6 Vibration Motors** - Progressive activation based on intensity  
✅ **Flexible Communication** - Choose WiFi or BLE based on your needs  

## 🔐 Security Notes

### WiFi Security:
- WiFi network uses WPA2 encryption
- Default password: `drowsy123` (change in code for production)
- Access Point range limited to ~20 meters
- Only devices with the password can connect
- No web server running on ESP32 - just provides network connectivity
- Recommended: Change the password in the Arduino code for production use

### Bluetooth Security:
- Bluetooth range is limited to ~10 meters
- No pairing/PIN required (uses BLE GATT)
- Connection is one-to-one (only one browser can connect at a time)
- Commands are sent as plain text (sufficient for this use case)

### Network Isolation:
- The ESP32 WiFi network is isolated (not connected to the internet)
- This is an Access Point (AP), not a regular WiFi connection
- Devices connected to this network can communicate with each other and the ESP32
- No internet access available on this network

## 📝 Next Steps

You can extend this system to:
- Add drowsiness detection algorithm integration
- Implement automatic alerts based on eye closure detection
- Add data logging to track alert history
- Create notification system for prolonged drowsiness
- Add emergency contact alerts

---

**Need Help?** Check the Serial Monitor output - it logs all commands and responses!
