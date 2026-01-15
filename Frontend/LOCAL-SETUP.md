# 📱 Local PWA Setup Guide

## How to Run PWA Locally on Your Phone

### Step 1: Install Dependencies

```bash
cd Frontend
npm install
npm install -g express
```

### Step 2: Build the PWA

```bash
npm run build
```

This creates optimized production files in the `dist` folder.

### Step 3: Connect Computer to ESP32

1. On your **computer**, connect to ESP32 WiFi:
   - **Network:** ESP32-Network
   - **Password:** Esp32-Password

2. Wait for connection to establish

### Step 4: Start Local Server

```bash
node serve-local.js
```

You'll see output like:
```
🚀 PWA Server is running!

📱 Access from your phone:
   http://192.168.4.2:8080
   
💡 Instructions:
   1. Connect your computer to ESP32-Network WiFi
   2. Connect your phone to ESP32-Network WiFi
   3. Open the URL above in your phone browser
   4. Add to Home Screen to install the PWA
```

### Step 5: Connect Phone to ESP32

1. On your **phone**, connect to the same ESP32 WiFi:
   - **Network:** ESP32-Network
   - **Password:** Esp32-Password

### Step 6: Open PWA on Phone

1. Open your phone's browser (Chrome/Safari)
2. Enter the URL shown in the terminal (e.g., `http://192.168.4.2:8080`)
3. The PWA should load!

### Step 7: Install PWA (Optional but Recommended)

**Android (Chrome):**
1. Tap menu (⋮)
2. Tap "Install app" or "Add to Home Screen"
3. Name it and tap "Add"

**iOS (Safari):**
1. Tap Share button (square with arrow)
2. Tap "Add to Home Screen"
3. Name it and tap "Add"

---

## Network Architecture

```
┌─────────────┐
│   ESP32     │  (192.168.4.1)
│  WiFi AP    │  Handles: Auth, Motor, Buzzer Control
└──────┬──────┘
       │
       │  ESP32-Network WiFi
       │
    ┌──┴───────────────────┐
    │                      │
┌───┴────┐          ┌──────┴──────┐
│Computer│          │    Phone    │
│        │          │             │
│Hosts PWA│         │Accesses PWA │
│on :8080│          │& ESP32 API  │
└────────┘          └─────────────┘
```

---

## Important Notes

### ⚠️ HTTPS Limitations
- Service Workers require HTTPS (except localhost)
- Some PWA features may be limited over HTTP
- Install prompt might not appear automatically
- Manual "Add to Home Screen" still works!

### ✅ What Works Without HTTPS
- ✅ All app functionality
- ✅ ESP32 authentication
- ✅ Motor & buzzer control
- ✅ Camera access
- ✅ Settings management
- ✅ Manual installation to home screen

### ❌ What Requires HTTPS
- ❌ Automatic install prompt
- ❌ Advanced service worker features
- ❌ Push notifications (if implemented)

---

## Troubleshooting

### Can't Access PWA from Phone

1. **Check WiFi Connection:**
   - Both devices on ESP32-Network?
   - Check phone WiFi settings

2. **Verify Server is Running:**
   - Is `serve-local.js` still running?
   - Any error messages in terminal?

3. **Check IP Address:**
   - IP shown in terminal correct?
   - Try accessing from computer first: `http://localhost:8080`

4. **Firewall Issues:**
   - Windows Firewall might block port 8080
   - Allow Node.js through firewall when prompted

### Login Not Working

- Make sure ESP32 is powered on
- Default credentials: `admin` / `Admin@123`
- Check Serial Monitor for ESP32 logs

### Motor/Buzzer Not Responding

- Verify authentication successful
- Check ESP32 serial output for errors
- Ensure GPIO pins 16 & 17 are connected properly

---

## Alternative: Development Mode

For development with hot-reload:

```bash
npm run dev -- --host
```

Access via: `http://[YOUR_IP]:5173`

Note: Less stable for production use.

---

## Quick Start Script

**Windows PowerShell:**
```powershell
# Build and serve
npm run build; node serve-local.js
```

**Mac/Linux:**
```bash
# Build and serve
npm run build && node serve-local.js
```

---

## Production Deployment

For permanent access without computer:

See [PWA-README.md](PWA-README.md) for deployment to:
- Netlify (Free, HTTPS, CDN)
- Vercel (Free, HTTPS, Fast)
- GitHub Pages (Free, HTTPS)

Deployed PWAs work from any network and support all PWA features!
