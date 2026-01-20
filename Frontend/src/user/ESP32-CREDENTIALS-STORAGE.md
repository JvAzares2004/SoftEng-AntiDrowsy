# ESP32 Persistent Credentials Storage

## Overview
The ESP32 now uses the **Preferences library** to store all credentials persistently in flash memory. This means that any changes you make to passwords, usernames, or network credentials will be automatically saved and retained even after the ESP32 is powered off or restarted.

## What Gets Stored Persistently

### 1. WiFi Network Credentials
- **WiFi SSID**: The name of the WiFi access point created by the ESP32
- **WiFi Password**: The password required to connect to the ESP32's WiFi network

### 2. User Authentication Credentials
- **Username**: The admin username for logging into the system
- **Password**: The admin password for authentication

## How It Works

### Storage Technology
The ESP32 uses the **Preferences library** which stores data in the ESP32's NVS (Non-Volatile Storage) partition. This is a dedicated flash memory area that persists across:
- Power cycles (turning the device off and on)
- Software resets
- ESP.restart() calls
- Firmware updates (unless explicitly cleared)

### Storage Namespace
All credentials are stored under the namespace `"credentials"` with the following keys:
- `wifi_ssid` - WiFi network name
- `wifi_pass` - WiFi password
- `username` - Admin username
- `password` - Admin password

## Automatic Behavior

### On First Boot (or after reset to defaults)
If no stored credentials are found, the ESP32 will use default values:
```cpp
WiFi SSID:    "ESP32-Network"
WiFi Password: "Esp32-Password"
Username:      "admin"
Password:      "Admin@123"
```

### On Subsequent Boots
The ESP32 automatically loads saved credentials from storage on startup, so your changes are immediately active.

## API Endpoints with Persistent Storage

### 1. Change Password (`POST /api/change-password`)
**What happens:**
1. Validates current password
2. Updates password in memory
3. **Saves new password to flash storage**
4. Returns success confirmation

**Request Body:**
```
currentPassword=oldPass&newPassword=newPass
```

**Storage Action:** `preferences.putString("password", newPassword)`

---

### 2. Change Username (`POST /api/change-username`)
**What happens:**
1. Validates current password
2. Updates username in memory
3. **Saves new username to flash storage**
4. Returns success confirmation

**Request Body:**
```
currentPassword=verifyPass&newUsername=newUser
```

**Storage Action:** `preferences.putString("username", newUsername)`

---

### 3. Update WiFi Settings (`POST /api/wifi-config`)
**What happens:**
1. Validates authentication
2. Saves new WiFi credentials to flash storage
3. **Automatically restarts ESP32**
4. ESP32 boots up with new WiFi credentials

**Request Body:**
```
ssid=MyNewNetwork&password=MyNewPassword
```

**Storage Actions:** 
- `preferences.putString("wifi_ssid", newSSID)`
- `preferences.putString("wifi_pass", newPassword)`
- `ESP.restart()`

**⚠️ Important:** After changing WiFi settings, the ESP32 will restart automatically. You'll need to reconnect to the new WiFi network name.

---

## Testing the Persistent Storage

### Test 1: Change and Verify Password
1. Change your password through the Settings page
2. Power off the ESP32 completely
3. Power it back on
4. Try logging in with the NEW password - it should work!

### Test 2: Change and Verify Username
1. Change your username through the Settings page
2. Restart the ESP32
3. Log in with the NEW username - it should work!

### Test 3: Change and Verify WiFi Settings
1. Change WiFi SSID and password through Settings
2. ESP32 will automatically restart
3. Search for WiFi networks - you should see your NEW SSID
4. Connect using your NEW password

---

## Troubleshooting

### Problem: Lost access due to forgotten credentials
**Solution:** Reset to factory defaults by calling `resetToDefaults()` function.

Add this temporary endpoint to your ESP32 code:
```cpp
// Add to loop() in the endpoint handling section:
if (header.indexOf("GET /api/reset-to-defaults") >= 0) {
  resetToDefaults();
  
  client.println("HTTP/1.1 200 OK");
  client.println("Content-type:application/json");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.println();
  client.println("{\"success\":true,\"message\":\"Reset to defaults. ESP32 will restart.\"}");
  client.println();
  client.stop();
  
  delay(1000);
  ESP.restart();
  break;
}
```

Then access: `http://192.168.4.1/api/reset-to-defaults`

---

### Problem: ESP32 keeps restarting after WiFi change
**Possible causes:**
- New WiFi SSID or password contains special characters that aren't properly encoded
- WiFi password doesn't meet security requirements

**Solution:**
- Use simple alphanumeric characters for testing
- Ensure password meets criteria (uppercase, lowercase, number, special character)

---

### Problem: Credentials not persisting
**Check:**
1. Preferences library is included: `#include <Preferences.h>`
2. Flash partition table has NVS space (default ESP32 partitions include this)
3. No flash memory corruption (try erasing flash: `esptool.py erase_flash`)

---

## Security Considerations

### Storage Security
- Credentials are stored in **plain text** in the ESP32's flash memory
- Physical access to the ESP32 could allow credential extraction
- Consider encryption for production environments

### Recommendations for Production
1. Implement credential encryption before storage
2. Add rate limiting to prevent brute force attacks
3. Implement secure password reset mechanism
4. Use HTTPS/TLS if possible (ESP32 supports it)
5. Add audit logging for credential changes

---

## Developer Functions

### Load Credentials from Storage
```cpp
void loadCredentials() {
  preferences.begin("credentials", false);
  ssid = preferences.getString("wifi_ssid", "ESP32-Network");
  password = preferences.getString("wifi_pass", "Esp32-Password");
  currentUsername = preferences.getString("username", "admin");
  currentPassword = preferences.getString("password", "Admin@123");
  preferences.end();
}
```

### Save WiFi Credentials
```cpp
void saveWiFiCredentials(String newSSID, String newPassword) {
  preferences.begin("credentials", false);
  preferences.putString("wifi_ssid", newSSID);
  preferences.putString("wifi_pass", newPassword);
  preferences.end();
}
```

### Save Username
```cpp
void saveUsername(String newUsername) {
  preferences.begin("credentials", false);
  preferences.putString("username", newUsername);
  preferences.end();
}
```

### Save Password
```cpp
void savePassword(String newPassword) {
  preferences.begin("credentials", false);
  preferences.putString("password", newPassword);
  preferences.end();
}
```

### Reset to Factory Defaults
```cpp
void resetToDefaults() {
  preferences.begin("credentials", false);
  preferences.clear(); // Clear all stored credentials
  preferences.end();
  
  // Reset to default values
  ssid = "ESP32-Network";
  password = "Esp32-Password";
  currentUsername = "admin";
  currentPassword = "Admin@123";
}
```

---

## Summary

✅ **All credentials are now stored persistently**
- WiFi SSID and Password
- Admin Username and Password

✅ **Automatic persistence**
- No manual save operation needed
- Changes take effect immediately
- Survive power cycles and resets

✅ **Easy recovery**
- Factory reset function available
- Default credentials known

✅ **Restart behavior**
- WiFi changes trigger automatic restart
- User/password changes don't require restart
- All changes persist after restart

---

## Quick Reference

| Change Type | Persists? | Requires Restart? | Takes Effect |
|------------|-----------|-------------------|--------------|
| Password   | ✅ Yes    | ❌ No             | Immediately  |
| Username   | ✅ Yes    | ❌ No             | Immediately  |
| WiFi SSID  | ✅ Yes    | ✅ Yes (Auto)     | After restart |
| WiFi Pass  | ✅ Yes    | ✅ Yes (Auto)     | After restart |

---

**Last Updated:** January 2026
**ESP32 Firmware Version:** Compatible with esp.cpp implementation
