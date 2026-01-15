const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 8080;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - return index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  return addresses;
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  
  console.log('\n🚀 PWA Server is running!\n');
  console.log('📱 Access from your phone:\n');
  
  ips.forEach(ip => {
    console.log(`   http://${ip}:${PORT}`);
  });
  
  console.log('\n💡 Instructions:');
  console.log('   1. Connect your computer to ESP32-Network WiFi');
  console.log('   2. Connect your phone to ESP32-Network WiFi');
  console.log('   3. Open one of the URLs above in your phone browser');
  console.log('   4. Add to Home Screen to install the PWA\n');
  console.log('⚠️  Note: Some PWA features require HTTPS (not available locally)');
  console.log('   But the app will still work!\n');
});
