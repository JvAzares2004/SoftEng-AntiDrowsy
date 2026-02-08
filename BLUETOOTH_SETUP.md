# Bluetooth Device Connection Guide

## Overview
This system uses a simple, user-friendly approach for connecting Bluetooth devices. Instead of the website scanning for devices, **you first pair your device at the operating system level**, then the website recognizes it.

## Why This Approach?

✅ **More Reliable** - Devices paired at OS level are more stable  
✅ **More Secure** - You control pairing through your system settings  
✅ **More Familiar** - Uses the standard Bluetooth pairing you already know  
✅ **Better Battery** - No continuous scanning needed  

## Step-by-Step Connection Guide

### Step 1: Pair Your Device in Your OS

#### Windows 11/10:
1. Open **Settings** → **Bluetooth & devices**
2. Make sure Bluetooth is **ON**
3. Click **Add device** → **Bluetooth**
4. Power on your ESP32/Arduino device
5. Wait for it to appear (e.g., "ESP32-Drowsiness-001")
6. Click on it to pair
7. Wait for "Connected" status

#### macOS:
1. Open **System Preferences** → **Bluetooth**
2. Make sure Bluetooth is **On**
3. Power on your ESP32/Arduino device
4. Wait for it to appear in the device list
5. Click **Connect**
6. Wait for "Connected" status

#### Linux:
1. Open **Settings** → **Bluetooth**
2. Make sure Bluetooth is **On**
3. Power on your ESP32/Arduino device
4. Wait for it to appear
5. Click on the device and select **Pair**
6. Wait for "Connected" status

### Step 2: Connect in the Website

1. **Log in** to the Drowsiness Detection system
2. Click on the **Bluetooth device section** in the sidebar (shows "No Device" if nothing connected)
3. In the popup modal, click the blue button: **"Recognize Connected Device"**
4. Your browser will show a device picker
5. **Select your device** from the list (e.g., "ESP32-Drowsiness-001")
6. Click **Pair** in the browser popup

### Step 3: Verify Connection

✅ The device name should appear in the sidebar  
✅ A green dot indicator shows it's connected  
✅ The device is now saved to your account  

## Alternative: Manual Entry

If you prefer, you can add your device manually:

1. Open the Bluetooth modal
2. Click **"Enter Device Name Manually"**
3. Type the exact name of your device (as shown in your OS Bluetooth settings)
4. Select the device type (ESP32, Arduino, etc.)
5. Click **Add Device**

## Troubleshooting

### Device Not Appearing in Browser Picker

**Solution**: Make sure your device is:
- ✓ Powered on
- ✓ **Already paired** in your OS Bluetooth settings
- ✓ Within Bluetooth range (typically 10 meters)
- ✓ Not connected to another application
- ✓ Named with a recognizable name (e.g., "ESP32-Drowsiness")

### "Bluetooth Not Available" Error

**Solution**:
1. Check if Bluetooth is enabled in your OS settings
2. Restart your computer's Bluetooth service
3. Try using a different browser (Chrome, Edge, or Opera recommended)
4. Make sure you're using **HTTPS** (or localhost for testing)

### Browser Doesn't Support Web Bluetooth

**Solution**:
- ✅ Use **Google Chrome** (recommended)
- ✅ Use **Microsoft Edge**
- ✅ Use **Opera**
- ❌ Avoid Firefox (doesn't support Web Bluetooth)
- ❌ Avoid Safari (limited support)

### Device Keeps Disconnecting

**Solution**:
1. Check battery/power supply of your ESP32/Arduino
2. Move closer to your computer
3. Remove interference (other Bluetooth devices, WiFi routers)
4. Re-pair the device in your OS settings
5. Restart both the device and your computer

## Device Requirements

### For Your ESP32/Arduino Device:

**Naming**: Use a clear, recognizable name
- ✅ Good: `ESP32-Drowsiness-001`, `Arduino-Alert-A1`
- ❌ Bad: `Device`, `ESP32`, `Unknown`

**Bluetooth Type**: Must support Bluetooth Low Energy (BLE)
- ✅ ESP32 (has built-in BLE)
- ✅ ESP32-S2/S3/C3
- ✅ Arduino with BLE module
- ❌ Classic Bluetooth only (like old HC-05 without BLE)

**Firmware**: Should broadcast the following services for best compatibility:
- Battery Service (optional but recommended)
- Device Information Service (optional but recommended)

## How It Works Behind the Scenes

1. **OS Level Pairing**: Your computer's Bluetooth stack handles the initial pairing
2. **Browser Permission**: The website asks for permission to access Bluetooth
3. **Device Selection**: Browser shows only paired/available devices
4. **Web Connection**: Website connects to the selected device using Web Bluetooth API
5. **Backend Storage**: Device information is saved to the database
6. **Persistent Connection**: Device stays connected across page refreshes

## Backend API

The system automatically saves your connected devices to the database so they persist across sessions.


## Backend API

The system automatically saves your connected devices to the database so they persist across sessions.

### Available Endpoints (Auto-managed):

- **Device Pairing**: Automatically called when you connect a device
- **Device List**: Your devices load automatically when you open the modal
- **Device Updates**: Connection status is tracked in real-time
- **Device Removal**: Available through the device management interface

## For Developers

If you need to set up the backend:

### 1. Database Setup
```bash
cd backend
psql -U your_username -d your_database -f create_devices_table.sql
```

### 2. Start Backend
```bash
cd backend
npm install
npm start
```

The device controller is automatically registered and ready to use.

## Technical Details

**Frontend**: React + TypeScript with Web Bluetooth API  
**Backend**: NestJS + PostgreSQL  
**Security**: HTTPS required (except localhost), user authentication  
**Compatibility**: Chrome, Edge, Opera on Windows/Mac/Linux  

## Quick Reference

| Action | What to Do |
|--------|-----------|
| First time setup | Pair device in OS Bluetooth settings |
| Connect to website | Click "Recognize Connected Device" |
| Add another device | Pair in OS, then click "Recognize Connected Device" |
| Switch devices | Click device name in sidebar, select different device |
| Device not showing | Check OS Bluetooth settings, ensure device is paired |
| Remove device | Use device management interface in settings |

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify device is paired in OS Bluetooth settings
3. Try a different supported browser
4. Ensure Bluetooth is enabled at OS level
5. Check device battery/power supply

---

**Remember**: Always pair your device in your computer's Bluetooth settings FIRST, then use the website to recognize it!
