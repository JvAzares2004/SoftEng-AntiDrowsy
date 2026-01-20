# ESP32 Arduino IDE Setup for Persistent Storage

## Required Libraries

To compile and upload the esp.cpp code to your ESP32, you need the following libraries:

### 1. ESP32 Board Support
If you haven't already installed ESP32 support in Arduino IDE:

**Step 1:** Open Arduino IDE
**Step 2:** Go to `File` → `Preferences`
**Step 3:** Add this URL to "Additional Board Manager URLs":
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```
**Step 4:** Go to `Tools` → `Board` → `Boards Manager`
**Step 5:** Search for "ESP32" and install "ESP32 by Espressif Systems"

### 2. Required Libraries (Built-in with ESP32)

The following libraries are **automatically included** when you install ESP32 board support:
- ✅ `WiFi.h` - WiFi functionality
- ✅ `DNSServer.h` - Captive portal DNS
- ✅ `Preferences.h` - **Persistent storage (NVS)**

**No additional installation needed!** These are core ESP32 libraries.

---

## Uploading the Code

### Step 1: Open the .ino File
Since Arduino IDE works with `.ino` files, you need to either:

**Option A - Create New Sketch:**
1. Create a new folder: `ESP32_Drowsiness_Detection`
2. Create file: `ESP32_Drowsiness_Detection.ino`
3. Copy all contents from `esp.cpp` into the `.ino` file

**Option B - Rename:**
1. Copy `esp.cpp` to a new folder
2. Rename it to match the folder name with `.ino` extension
   - Example: `AntiDrowsy/AntiDrowsy.ino`

### Step 2: Configure Board Settings
1. Connect your ESP32 to your computer via USB
2. Go to `Tools` → `Board` → `ESP32 Arduino` → Select your ESP32 board
   - Common options: "ESP32 Dev Module", "ESP32-WROOM-DA Module", "NodeMCU-32S"
3. Set the following:
   - **Upload Speed:** 115200
   - **Flash Frequency:** 80MHz
   - **Flash Mode:** QIO
   - **Flash Size:** 4MB (or your board's flash size)
   - **Partition Scheme:** "Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"
   - **Port:** Select the COM port where ESP32 is connected

### Step 3: Verify & Upload
1. Click the ✓ (Verify) button to compile
2. If no errors, click the → (Upload) button
3. Wait for upload to complete

### Step 4: Monitor Serial Output
1. Go to `Tools` → `Serial Monitor`
2. Set baud rate to **115200**
3. You should see:
```
========== Loaded Credentials ==========
WiFi SSID: ESP32-Network
WiFi Password: [HIDDEN]
Username: admin
Password: [HIDDEN]
========================================
ESP32 AP Started
IP Address: 192.168.4.1
SSID: ESP32-Network
```

---

## Understanding Partition Scheme

The partition scheme determines how the ESP32's flash memory is divided:

### Recommended: "Default 4MB with spiffs"
```
APP (1.2MB)   - Your program code
SPIFFS (1.5MB) - File system
NVS (20KB)    - Preferences/Credentials storage ✅
```

The **NVS (Non-Volatile Storage)** partition is where Preferences library stores your credentials.

### Alternative Schemes
If you have a different flash size:
- **4MB:** Use "Default 4MB with spiffs"
- **8MB:** Use "8MB with spiffs"
- **16MB:** Use "16MB with spiffs"

**All schemes include NVS partition**, so persistent storage will work!

---

## Compilation Tips

### Common Errors & Solutions

#### Error: "Preferences.h: No such file or directory"
**Solution:** Make sure ESP32 board support is installed (v2.0.0 or higher)
- Go to `Tools` → `Board` → `Boards Manager`
- Update "ESP32 by Espressif Systems" to latest version

#### Error: "'Preferences' was not declared in this scope"
**Solution:** Add this at the top of your code:
```cpp
#include <Preferences.h>
```

#### Error: "A fatal error occurred: Failed to connect"
**Solution:** 
1. Hold the "BOOT" button on ESP32
2. Click Upload in Arduino IDE
3. Keep holding BOOT until "Connecting..." appears
4. Release BOOT button

#### Error: Board not detected / Port not available
**Solution:**
1. Install CH340/CP2102 USB drivers (Google your ESP32 model)
2. Try different USB cable (must be data cable, not charge-only)
3. Try different USB port

---

## Testing Persistent Storage

### Test 1: First Upload
1. Upload the code
2. Open Serial Monitor
3. You should see default credentials loaded

### Test 2: Change Credentials via Web
1. Connect to WiFi "ESP32-Network" with password "Esp32-Password"
2. Open browser: `http://192.168.4.1`
3. Login with username: `admin`, password: `Admin@123`
4. Change credentials through Settings page

### Test 3: Verify Persistence
1. **Power off** the ESP32 completely (unplug USB)
2. Wait 10 seconds
3. **Power on** the ESP32
4. Open Serial Monitor
5. You should see **YOUR NEW credentials** being loaded!

Example Serial Output:
```
========== Loaded Credentials ==========
WiFi SSID: MyNewNetwork        ← Changed!
WiFi Password: [HIDDEN]
Username: newadmin             ← Changed!
Password: [HIDDEN]
========================================
```

---

## Memory Information

### NVS Storage Details
- **Location:** Dedicated flash partition
- **Size:** ~20KB (varies by partition scheme)
- **Endurance:** ~100,000 write cycles per sector
- **Retention:** Data survives power loss, resets, and firmware updates

### Credential Storage Size
Your credentials use minimal space:
- WiFi SSID: ~32 bytes max
- WiFi Password: ~64 bytes max
- Username: ~32 bytes max
- Password: ~64 bytes max
- **Total: ~192 bytes** out of 20KB available

You have plenty of space for future additions!

---

## Advanced: Viewing Stored Data

### Using esptool (Python)
To view raw NVS partition data:
```bash
# Read NVS partition
esptool.py --port COM3 read_flash 0x9000 0x5000 nvs_backup.bin

# Parse NVS (requires partition tools)
python $IDF_PATH/components/nvs_flash/nvs_partition_parser/nvs_read.py nvs_backup.bin
```

### Factory Reset via Code
Add a reset button or serial command:
```cpp
void loop() {
  // Check for serial input
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    if (cmd == "RESET") {
      Serial.println("Resetting to factory defaults...");
      resetToDefaults();
      ESP.restart();
    }
  }
  
  // ... rest of your code
}
```

Type "RESET" in Serial Monitor to restore defaults.

---

## Troubleshooting Upload Issues

### Issue: Upload fails consistently
**Try:**
1. Press and hold "BOOT" button
2. Press "EN" (Enable/Reset) button briefly
3. Release "EN" button
4. Click Upload
5. Release "BOOT" when upload starts

### Issue: "Brownout detector was triggered"
**Solution:**
- Use better USB cable
- Use powered USB hub
- Use external 5V power supply

### Issue: ESP32 resets during WiFi operations
**Solution:**
- Increase WiFi TX power in code:
```cpp
WiFi.setTxPower(WIFI_POWER_8_5dBm); // Reduce power consumption
```

---

## Recommended ESP32 Board Settings

For best compatibility:
```
Board:             ESP32 Dev Module
Upload Speed:      115200
CPU Frequency:     240MHz (WiFi/BT)
Flash Frequency:   80MHz
Flash Mode:        QIO
Flash Size:        4MB (32Mb)
Partition Scheme:  Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)
Core Debug Level:  None
PSRAM:             Disabled
```

---

## Next Steps

1. ✅ Upload code to ESP32
2. ✅ Verify credentials load correctly
3. ✅ Test changing credentials via web interface
4. ✅ Confirm persistence after power cycle
5. 🎉 Your ESP32 now has persistent credential storage!

---

**Need Help?**
- Check Serial Monitor for debug messages
- All credential operations are logged
- Look for "saved to persistent storage" messages

**Last Updated:** January 2026
