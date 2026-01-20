# Quick Reference: ESP32 Credential Changes

## Summary of Changes Made

### ✅ What Was Implemented

1. **Added Preferences Library**
   - Enables persistent storage in ESP32's NVS (Non-Volatile Storage)
   - Credentials survive power cycles and resets

2. **Changed String Types**
   - WiFi SSID: `const char*` → `String`
   - WiFi Password: `const char*` → `String`
   - Allows dynamic credential loading

3. **Added Storage Functions**
   - `loadCredentials()` - Loads saved credentials on startup
   - `saveWiFiCredentials()` - Saves WiFi SSID and password
   - `saveUsername()` - Saves admin username
   - `savePassword()` - Saves admin password
   - `resetToDefaults()` - Factory reset function

4. **Modified Setup**
   - Calls `loadCredentials()` on boot
   - Uses loaded credentials to start WiFi AP

5. **Updated API Endpoints**
   - `/api/change-password` - Now saves to storage
   - `/api/change-username` - Now saves to storage
   - `/api/wifi-config` - Now saves to storage + auto-restarts ESP32

---

## How It Works Now

### On ESP32 Startup
```
1. ESP32 boots up
2. loadCredentials() runs
3. Checks NVS storage for saved credentials
4. If found: loads saved credentials
5. If not found: uses defaults
6. Starts WiFi with loaded credentials
```

### When User Changes Password
```
1. User submits new password via web UI
2. ESP32 receives request
3. Validates current password
4. Updates password in RAM
5. ✨ Saves to NVS storage ✨
6. Returns success
7. Next boot: loads new password
```

### When User Changes WiFi Settings
```
1. User submits new WiFi SSID/password
2. ESP32 receives request
3. ✨ Saves to NVS storage ✨
4. Sends success response
5. ✨ Automatically restarts ✨
6. On boot: loads new WiFi credentials
7. Creates AP with new SSID/password
```

---

## Storage Locations

All credentials are stored in ESP32's NVS partition under namespace `"credentials"`:

| Setting | Storage Key | Default Value |
|---------|------------|---------------|
| WiFi SSID | `wifi_ssid` | `ESP32-Network` |
| WiFi Password | `wifi_pass` | `Esp32-Password` |
| Username | `username` | `admin` |
| Password | `password` | `Admin@123` |

---

## Testing Checklist

### ✓ Test 1: First Boot
- [ ] Upload code to ESP32
- [ ] Check Serial Monitor
- [ ] Should see: "Loaded Credentials" with defaults
- [ ] WiFi "ESP32-Network" should be visible

### ✓ Test 2: Change Password
- [ ] Connect to ESP32 WiFi
- [ ] Login at http://192.168.4.1
- [ ] Go to Settings → Change Password
- [ ] Submit new password
- [ ] Should see success message
- [ ] Power cycle ESP32
- [ ] Login with NEW password ✅

### ✓ Test 3: Change Username
- [ ] Login to ESP32
- [ ] Go to Settings → Change Username
- [ ] Submit new username
- [ ] Should see success message
- [ ] Logout and login
- [ ] Login with NEW username ✅

### ✓ Test 4: Change WiFi Settings
- [ ] Login to ESP32
- [ ] Go to Settings → WiFi Settings
- [ ] Enter new SSID: "MyNetwork"
- [ ] Enter new password (must meet criteria)
- [ ] Submit
- [ ] ESP32 will restart automatically
- [ ] Look for WiFi "MyNetwork" ✅
- [ ] Connect with new password ✅

---

## Code Changes Summary

### File Modified: `esp.cpp`

#### Added at top (line 3):
```cpp
#include <Preferences.h>
```

#### Added after includes:
```cpp
Preferences preferences;
```

#### Changed WiFi credential types:
```cpp
// OLD:
const char* ssid = "ESP32-Network";
const char* password = "Esp32-Password";

// NEW:
String ssid = "ESP32-Network";
String password = "Esp32-Password";
```

#### Added new functions (after checkSessionTimeout):
```cpp
void loadCredentials() { ... }
void saveWiFiCredentials(String newSSID, String newPassword) { ... }
void saveUsername(String newUsername) { ... }
void savePassword(String newPassword) { ... }
void resetToDefaults() { ... }
```

#### Modified setup():
```cpp
void setup() {
  Serial.begin(115200);
  
  loadCredentials(); // ← ADDED THIS
  
  // ... rest of setup
  WiFi.softAP(ssid.c_str(), password.c_str()); // ← Modified to use .c_str()
}
```

#### Modified API endpoints:
- `POST /api/change-password` - Added `savePassword(newPass);`
- `POST /api/change-username` - Added `saveUsername(newUser);`
- `POST /api/wifi-config` - Added:
  ```cpp
  saveWiFiCredentials(newSSID, newWiFiPass);
  ssid = newSSID;
  password = newWiFiPass;
  // ... send response ...
  delay(1000);
  ESP.restart(); // ← Auto-restart
  ```

---

## Important Notes

### ⚠️ WiFi Changes Require Restart
When you change WiFi settings:
1. ESP32 saves the new credentials
2. Sends success response
3. **Automatically restarts** after 1 second
4. You'll be disconnected
5. Reconnect to new WiFi SSID

### ✅ Password/Username Changes Don't Require Restart
When you change password or username:
1. ESP32 saves the new credentials
2. Changes take effect immediately
3. No restart needed
4. Use new credentials on next login

### 🔒 Security Note
Credentials are stored in **plain text** in flash memory. For production:
- Consider encrypting credentials
- Implement secure key storage
- Add tamper detection

---

## Viewing Debug Output

The ESP32 logs all credential operations to Serial Monitor (115200 baud):

```
========== Loaded Credentials ==========
WiFi SSID: ESP32-Network
WiFi Password: [HIDDEN]
Username: admin
Password: [HIDDEN]
========================================

Password changed and saved successfully
Username changed and saved successfully to: newuser
WiFi credentials saved to persistent storage
```

---

## Troubleshooting

### Problem: Credentials not persisting
**Check:**
- [ ] `#include <Preferences.h>` at top of file
- [ ] `Preferences preferences;` declared globally
- [ ] `loadCredentials()` called in `setup()`
- [ ] Save functions called after updating credentials

### Problem: ESP32 won't connect after WiFi change
**Solution:**
- Connect via USB and check Serial Monitor
- ESP32 shows the loaded WiFi credentials
- Verify new SSID is visible in WiFi scan
- Check password meets security requirements

### Problem: Lost access (forgot credentials)
**Solution:**
- Upload code with reset endpoint
- Call `http://192.168.4.1/api/reset-to-defaults`
- Or reflash the ESP32 with `preferences.clear()`

---

## Factory Reset Method

Add this endpoint to reset everything:

```cpp
// Add in loop() endpoint handling section:
if (header.indexOf("GET /api/factory-reset") >= 0) {
  Serial.println("Factory reset requested");
  
  client.println("HTTP/1.1 200 OK");
  client.println("Content-type:application/json");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.println();
  client.println("{\"success\":true,\"message\":\"Factory reset complete. Restarting...\"}");
  client.println();
  client.stop();
  
  delay(500);
  resetToDefaults();
  delay(500);
  ESP.restart();
  
  break;
}
```

Access via: `http://192.168.4.1/api/factory-reset`

---

## Files Created

1. **esp.cpp** (modified)
   - Main ESP32 firmware with persistent storage

2. **ESP32-CREDENTIALS-STORAGE.md**
   - Complete documentation of storage system

3. **ARDUINO-SETUP-GUIDE.md**
   - Arduino IDE setup instructions

4. **QUICK-REFERENCE.md** (this file)
   - Quick reference for developers

---

## Next Steps

1. ✅ Upload modified esp.cpp to ESP32
2. ✅ Test all credential changes
3. ✅ Verify persistence after power cycle
4. ✅ Document any custom modifications
5. 🎉 Deploy to production!

---

**Questions?**
- Check [ESP32-CREDENTIALS-STORAGE.md](ESP32-CREDENTIALS-STORAGE.md) for detailed info
- Check [ARDUINO-SETUP-GUIDE.md](ARDUINO-SETUP-GUIDE.md) for upload help
- Review Serial Monitor output for debug messages

**Last Updated:** January 2026  
**Compatible with:** ESP32 Arduino Core 2.0.0+
