#!/bin/bash
echo "===================================="
echo "  Anti Drowsy PWA - Local Server"
echo "===================================="
echo ""
echo "[1/3] Building PWA..."
npm run build
echo ""
echo "[2/3] Starting local server..."
echo ""
echo "===================================="
echo "  INSTRUCTIONS:"
echo "===================================="
echo "1. Connect COMPUTER to ESP32-Network"
echo "2. Connect PHONE to ESP32-Network"
echo "3. Open the URL below on your phone"
echo "===================================="
echo ""
node serve-local.js
