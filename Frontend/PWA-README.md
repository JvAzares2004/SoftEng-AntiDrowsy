# Anti Drowsy Car Seat Sensor - PWA

A Progressive Web App (PWA) for controlling ESP32-based drowsiness detection system with buzzer and motor vibration alerts.

## 🚀 Features

- **Progressive Web App** - Install on mobile/desktop, works offline
- **ESP32 Authentication** - Secure login system with session management
- **Real-time Control** - Control buzzer and motor vibration remotely
- **Camera Integration** - Live drowsiness detection monitoring
- **Responsive Design** - Works on all devices

## 📋 Prerequisites

- Node.js 18+ and npm
- ESP32 device configured with the provided firmware
- WiFi-capable device (phone/tablet/laptop)

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate PWA Icons (if needed)

```bash
npm run generate-icons
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## 📱 Using the PWA

### Initial Setup

1. **Connect to ESP32 WiFi Network**
   - Network Name: `ESP32-Network`
   - Password: `Esp32-Password`

2. **Open the PWA**
   - In your browser, navigate to the app URL
   - For local development: `http://localhost:5173`
   - For production: Your deployed URL

3. **Install the App** (Optional but Recommended)
   - On **Android/Chrome**: Click the "Install" button in the browser
   - On **iOS/Safari**: 
     - Tap the Share button
     - Select "Add to Home Screen"
   - On **Desktop**: Click the install icon in the address bar

### Default Login Credentials

- **Username**: `admin`
- **Password**: `Admin@123`

> ⚠️ **Important**: Change the default password after first login in Settings

## 🔐 Authentication

The PWA communicates with ESP32 REST API endpoints:

- `POST /api/login` - Authenticate user
- `GET /api/auth/status` - Check authentication status
- `POST /api/logout` - Logout user
- `POST /api/change-password` - Change password

Sessions expire after 1 hour of inactivity.

## 🎛️ Controls

### Motor Vibration
- Adjust intensity: 0-100%
- Test motor via PWA dashboard
- API: `GET /api/motor/test?value=X`

### Buzzer Alert
- Adjust volume: 0-100%
- Test buzzer via PWA dashboard
- API: `GET /api/buzzer/test?value=X`

## 📂 Project Structure

```
Frontend/
├── public/                      # Static assets
│   ├── pwa-192x192.png         # PWA icon (192x192)
│   ├── pwa-512x512.png         # PWA icon (512x512)
│   └── apple-touch-icon.png    # iOS icon (180x180)
├── src/
│   ├── components/             # Reusable components
│   │   ├── ProtectedRoute.tsx  # Route authentication guard
│   │   └── PWAInstallPrompt.tsx # PWA install prompt
│   ├── services/               # API services
│   │   └── authService.ts      # ESP32 authentication
│   ├── user/                   # User pages
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Settings.tsx        # Settings page
│   │   └── MainLayout.tsx      # Layout wrapper
│   └── App.tsx                 # Main app component
├── vite.config.ts              # Vite + PWA configuration
└── package.json
```

## 🔧 ESP32 Configuration

Upload the `esp.cpp` firmware to your ESP32 device. The firmware provides:

- WiFi Access Point (AP) mode
- RESTful API endpoints
- Authentication system
- Motor and buzzer control

### ESP32 Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/login` | POST | No | User login |
| `/api/logout` | POST | No | User logout |
| `/api/auth/status` | GET | No | Check auth status |
| `/api/change-password` | POST | Yes | Change password |
| `/api/motor/test?value=X` | GET | Yes | Test motor (0-100%) |
| `/api/buzzer/test?value=X` | GET | Yes | Test buzzer (0-100%) |

## 🌐 Network Configuration

The PWA is configured to work with ESP32's default IP address: `192.168.4.1`

To change the IP address, edit `src/services/authService.ts`:

```typescript
const ESP32_IP = '192.168.4.1'; // Change this to your ESP32 IP
```

## 📱 PWA Features

### Offline Functionality
- Service Worker caches app assets
- Works without internet connection
- API calls cached for 5 minutes

### Install to Home Screen
- Appears like a native app
- No browser chrome
- Faster launch time
- Push notifications ready (future feature)

### Responsive Design
- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly controls

## 🐛 Troubleshooting

### Cannot Connect to ESP32

1. Verify you're connected to `ESP32-Network` WiFi
2. Check ESP32 is powered on and running
3. Confirm ESP32 IP address is `192.168.4.1`
4. Try disabling mobile data (use WiFi only)

### Login Failed

1. Verify credentials: `admin` / `Admin@123`
2. Check ESP32 serial monitor for error messages
3. Restart ESP32 device
4. Clear browser cache and try again

### PWA Not Installing

1. **Chrome/Android**: Ensure HTTPS or localhost
2. **iOS/Safari**: Use "Add to Home Screen" manually
3. Clear browser data and reload
4. Check browser supports PWA (Chrome, Edge, Safari 11.3+)

### Session Expired

- Sessions last 1 hour
- Any user activity extends the session
- Re-login when prompted

## 🚀 Deployment

### Deploy to Netlify/Vercel

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service

3. Ensure the hosting supports:
   - Service Workers
   - HTTPS (required for PWA)
   - SPA routing (redirect all to index.html)

### Local Network Deployment

1. Build the project
2. Serve the `dist` folder:
   ```bash
   npx serve dist
   ```
3. Access from any device on the same network

## 📄 License

This project is for educational purposes.

## 👥 Contributors

Software Engineering Team - Drowsiness Detection Project

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review ESP32 serial monitor output
3. Verify network connectivity
4. Check browser console for errors
