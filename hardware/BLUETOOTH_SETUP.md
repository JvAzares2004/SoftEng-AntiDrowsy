# ESP32 Drowsiness Detection - Bluetooth Setup Guide

## 📱 Overview
The system now uses **Bluetooth Low Energy (BLE)** instead of WiFi for communication between the web browser and ESP32 controller.

## 🔧 Hardware Setup

### Required Components:
- ESP32 Development Board
- Buzzer (connected to GPIO 25)
- Vibration Motor (connected to GPIO 26)
- Appropriate resistors/transistors as needed

### Wiring:
```
ESP32 GPIO 25 → Buzzer
ESP32 GPIO 26 → Vibration Motor
ESP32 GND     → Common Ground
```

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
     ```

### Frontend (Web Browser):

⚠️ **Important**: Web Bluetooth only works on:
- ✅ Chrome (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Opera (Desktop)
- ❌ Firefox (Not supported)
- ❌ Safari (Not supported on macOS, limited on iOS)

## 🚀 Usage

### Connecting to ESP32:

1. Make sure your ESP32 is powered on and the Serial Monitor shows "Waiting for connections..."

2. Open the Dashboard in your web browser (Chrome/Edge/Opera)

3. Click the **"Connect to ESP32"** button at the top of the dashboard

4. A popup will appear showing available Bluetooth devices

5. Select your device (should show as "ESP32-Drowsiness")

6. Once connected, you'll see a green "Connected" indicator

### Testing Devices:

1. **Adjust Volume/Intensity**: 
   - Use the sliders to set the intensity (0-100%)
   - This scales the test duration (0-3 seconds)

2. **Click Test**:
   - Click the "Test" button for either Motor Vibration or Buzzer
   - The ESP32 will receive the command via Bluetooth
   - Check the Serial Monitor to see the output

### Serial Monitor Output:

When you click "Test", you'll see in the Serial Monitor:
```
=================================
[COMMAND RECEIVED]
=================================
Raw command: TEST:buzzer:2000
Test Type: buzzer
Duration: 2000 ms
---------------------------------
Testing BUZZER...
  > Buzzer ON for 2000 ms
  > Buzzer OFF
Test completed!
=================================
```

## 🔌 Command Protocol

The system uses simple text commands over BLE:

| Command | Format | Example | Description |
|---------|--------|---------|-------------|
| Test Buzzer | `TEST:buzzer:duration` | `TEST:buzzer:2000` | Test buzzer for 2000ms |
| Test Vibrator | `TEST:vibrator:duration` | `TEST:vibrator:1500` | Test vibrator for 1500ms |
| Test Both | `TEST:both:duration` | `TEST:both:2000` | Test both devices |
| Control | `CONTROL:device:state` | `CONTROL:buzzer:on` | Turn device on/off |
| Alert | `ALERT:level` | `ALERT:high` | Trigger alert (low/medium/high) |
| Stop All | `STOP` | `STOP` | Stop all devices immediately |
| Status | `STATUS` | `STATUS` | Request current status |

## 🐛 Troubleshooting

### "Web Bluetooth is not supported"
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

✅ **No WiFi Required** - Direct Bluetooth connection  
✅ **Browser-based Control** - No mobile app installation needed  
✅ **Real-time Communication** - Instant command execution  
✅ **Serial Monitor Logging** - All commands visible for debugging  
✅ **Auto-reconnection** - Automatic advertising restart after disconnect  
✅ **Volume Scaling** - Test duration scales with intensity slider  

## 🔐 Security Notes

- Bluetooth range is limited to ~10 meters
- No pairing/PIN required (uses BLE GATT)
- Connection is one-to-one (only one browser can connect at a time)
- Commands are sent as plain text (sufficient for this use case)

## 📝 Next Steps

You can extend this system to:
- Add drowsiness detection algorithm integration
- Implement automatic alerts based on eye closure detection
- Add data logging to track alert history
- Create notification system for prolonged drowsiness
- Add emergency contact alerts

---

**Need Help?** Check the Serial Monitor output - it logs all commands and responses!
