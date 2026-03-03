#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// WiFi Access Point credentials (ESP32 creates its own network)
const char* ap_ssid = "ESP32-Drowsiness-AP";
const char* ap_password = "drowsy123";  // Minimum 8 characters

// Pin definitions (adjust based on your wiring)
// 2 Buzzer pins (will scale like vibrators)
const int BUZZER_PINS[2] = {25, 33};  // GPIO pins for 2 buzzers

// 6 Vibrator motor pins
const int VIBRATOR_PINS[6] = {26, 27, 14, 12, 13, 15};  // GPIO pins for 6 vibrator motors

// LED Status Indicators
const int GREEN_LED_PIN = 2;    // GPIO pin for GREEN LED (connected)
const int RED_LED_PIN = 4;      // GPIO pin for RED LED (disconnected)

// PWM settings for intensity control
const int PWM_FREQUENCY = 5000;  // 5 KHz
const int PWM_RESOLUTION = 8;    // 8-bit resolution (0-255)

// Device information
String deviceName = "ESP32-Drowsiness";
bool deviceConnected = false;
unsigned long lastClientPing = 0;
const unsigned long CLIENT_TIMEOUT = 30000;  // 30 seconds timeout

// Web Server
WebServer server(80);

// Control states
bool buzzerStates[2] = {false, false};
bool vibratorStates[6] = {false, false, false, false, false, false};

// Forward declarations
void handleCommand(String command);
String getStatus();
void activateBuzzer(int intensity, int duration);
void activateVibrators(int intensity, int duration);
void setBuzzerIntensity(int intensity);
void setVibratorIntensity(int intensity);

// HTTP endpoint handlers
void handleRoot() {
  String html = "<html><body>";
  html += "<h1>ESP32 Drowsiness Detection Controller</h1>";
  html += "<h2>WiFi Mode</h2>";
  html += "<p>Device: " + deviceName + "</p>";
  html += "<p>Status: " + (deviceConnected ? "Connected" : "Waiting for connection") + "</p>";
  html += "<h3>Available Endpoints:</h3>";
  html += "<ul>";
  html += "<li>POST /connect - Establish connection</li>";
  html += "<li>POST /disconnect - Close connection</li>";
  html += "<li>POST /command - Send commands (body: {\"command\":\"string\"})</li>";
  html += "<li>GET /status - Get device status</li>";
  html += "</ul>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleConnect() {
  if (!deviceConnected) {
    deviceConnected = true;
    lastClientPing = millis();
    
    Serial.println("\n=================================");
    Serial.println("[WiFi] Client connected!");
    Serial.println("=================================\n");
    
    // Turn on GREEN LED, turn off RED LED
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(RED_LED_PIN, LOW);
    Serial.println("[LED] Status: GREEN ON (Connected)");
    
    server.send(200, "application/json", "{\"status\":\"connected\",\"message\":\"Connection established\"}");
  } else {
    lastClientPing = millis();
    server.send(200, "application/json", "{\"status\":\"already_connected\",\"message\":\"Already connected\"}");
  }
}

void handleDisconnect() {
  if (deviceConnected) {
    deviceConnected = false;
    
    Serial.println("\n=================================");
    Serial.println("[WiFi] Client disconnected!");
    Serial.println("=================================\n");
    
    // Turn off GREEN LED, turn on RED LED
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(RED_LED_PIN, HIGH);
    Serial.println("[LED] Status: RED ON (Disconnected)");
    
    // Stop all outputs when disconnected
    for (int i = 0; i < 2; i++) {
      ledcWrite(BUZZER_PINS[i], 0);
      buzzerStates[i] = false;
    }
    for (int i = 0; i < 6; i++) {
      ledcWrite(VIBRATOR_PINS[i], 0);
      vibratorStates[i] = false;
    }
    
    server.send(200, "application/json", "{\"status\":\"disconnected\",\"message\":\"Connection closed\"}");
  } else {
    server.send(200, "application/json", "{\"status\":\"not_connected\",\"message\":\"No active connection\"}");
  }
}

void handleCommandEndpoint() {
  if (!deviceConnected) {
    server.send(403, "application/json", "{\"error\":\"Not connected. Use /connect first.\"}");
    return;
  }
  
  lastClientPing = millis();  // Update last ping time
  
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    
    Serial.println("\n=================================");
    Serial.println("[COMMAND RECEIVED]");
    Serial.println("=================================");
    Serial.printf("Raw body: %s\n", body.c_str());
    
    // Parse JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, body);
    
    if (error) {
      Serial.printf("JSON parse error: %s\n", error.c_str());
      Serial.println("=================================\n");
      server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      return;
    }
    
    String command = doc["command"].as<String>();
    Serial.printf("Parsed command: %s\n", command.c_str());
    Serial.println("---------------------------------");
    
    handleCommand(command);
    
    Serial.println("=================================\n");
    
    server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Command executed\"}");
  } else {
    server.send(400, "application/json", "{\"error\":\"No command provided\"}");
  }
}

void handleStatus() {
  lastClientPing = millis();  // Update last ping time
  String status = getStatus();
  server.send(200, "application/json", status);
}

void handleNotFound() {
  server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
}

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=================================");
  Serial.println("ESP32 Drowsiness Detection Controller");
  Serial.println("WiFi AP Mode");
  Serial.println("=================================\n");
  
  // Initialize WiFi Access Point
  Serial.println("Starting WiFi Access Point...");
  WiFi.mode(WIFI_AP);
  
  bool apStarted = WiFi.softAP(ap_ssid, ap_password);
  
  if (apStarted) {
    Serial.println("[WiFi AP] Access Point started successfully!");
    Serial.printf("Network Name (SSID): %s\n", ap_ssid);
    Serial.printf("Password: %s\n", ap_password);
    Serial.printf("IP Address: %s\n", WiFi.softAPIP().toString().c_str());
    Serial.printf("MAC Address: %s\n", WiFi.softAPmacAddress().c_str());
    Serial.println("Devices can now connect to this network!");
  } else {
    Serial.println("[WiFi AP] Failed to start Access Point!");
  }
  
  Serial.println();
  
  // CRITICAL: Set pin modes FIRST before PWM
  for (int i = 0; i < 2; i++) {
    pinMode(BUZZER_PINS[i], OUTPUT);
    digitalWrite(BUZZER_PINS[i], LOW);
  }
  
  for (int i = 0; i < 6; i++) {
    pinMode(VIBRATOR_PINS[i], OUTPUT);
    digitalWrite(VIBRATOR_PINS[i], LOW);
  }
  
  // Initialize LED status pins
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  digitalWrite(GREEN_LED_PIN, LOW);  // Start with GREEN off
  digitalWrite(RED_LED_PIN, HIGH);   // Start with RED on (disconnected)
  
  Serial.println("GPIO pins set as OUTPUT");
  Serial.println("[LED] Initial state: RED ON (waiting for connection)");
  
  // Initialize PWM - ESP32 Arduino Core 3.0+ API
  for (int i = 0; i < 2; i++) {
    ledcAttach(BUZZER_PINS[i], PWM_FREQUENCY, PWM_RESOLUTION);
    ledcWrite(BUZZER_PINS[i], 0);
  }
  
  for (int i = 0; i < 6; i++) {
    ledcAttach(VIBRATOR_PINS[i], PWM_FREQUENCY, PWM_RESOLUTION);
    ledcWrite(VIBRATOR_PINS[i], 0);
  }
  
  Serial.println("GPIO pins initialized with PWM:");
  Serial.println("  - Buzzers:");
  for (int i = 0; i < 2; i++) {
    Serial.printf("    - Buzzer %d: GPIO %d\n", i + 1, BUZZER_PINS[i]);
  }
  Serial.println("  - Vibrators:");
  for (int i = 0; i < 6; i++) {
    Serial.printf("    - Vibrator %d: GPIO %d\n", i + 1, VIBRATOR_PINS[i]);
  }
  Serial.println("  - LED Status Indicators:");
  Serial.printf("    - GREEN LED (Connected): GPIO %d\n", GREEN_LED_PIN);
  Serial.printf("    - RED LED (Disconnected): GPIO %d\n", RED_LED_PIN);
  Serial.printf("  - PWM Frequency: %d Hz\n", PWM_FREQUENCY);
  Serial.printf("  - PWM Resolution: %d-bit (0-255)\n\n", PWM_RESOLUTION);
  
  // === IMMEDIATE HARDWARE TEST ===
  Serial.println("=== HARDWARE TEST ===");
  Serial.println("Testing all 2 buzzers sequentially...");
  for (int i = 0; i < 2; i++) {
    Serial.printf("Testing Buzzer %d on GPIO %d...\n", i + 1, BUZZER_PINS[i]);
    ledcWrite(BUZZER_PINS[i], 200);
    delay(500);
    ledcWrite(BUZZER_PINS[i], 0);
    delay(200);
  }
  
  Serial.println("Testing all 6 vibrators sequentially...");
  for (int i = 0; i < 6; i++) {
    Serial.printf("Testing Vibrator %d on GPIO %d...\n", i + 1, VIBRATOR_PINS[i]);
    ledcWrite(VIBRATOR_PINS[i], 200);
    delay(500);
    ledcWrite(VIBRATOR_PINS[i], 0);
    delay(200);
  }
  Serial.println("=== HARDWARE TEST COMPLETE ===\n");
  
  // Setup HTTP server endpoints
  Serial.println("Initializing HTTP Web Server...");
  server.on("/", HTTP_GET, handleRoot);
  server.on("/connect", HTTP_POST, handleConnect);
  server.on("/disconnect", HTTP_POST, handleDisconnect);
  server.on("/command", HTTP_POST, handleCommandEndpoint);
  server.on("/status", HTTP_GET, handleStatus);
  server.onNotFound(handleNotFound);
  
  // Enable CORS for web access
  server.enableCORS(true);
  
  server.begin();
  
  Serial.println("\n=================================");
  Serial.println("HTTP Web Server started!");
  Serial.printf("Server URL: http://%s\n", WiFi.softAPIP().toString().c_str());
  Serial.printf("Device Name: %s\n", deviceName.c_str());
  Serial.println("Waiting for connections...");
  Serial.println("=================================\n");
}

void loop() {
  server.handleClient();
  
  // Check for client timeout
  if (deviceConnected && (millis() - lastClientPing > CLIENT_TIMEOUT)) {
    Serial.println("\n[WiFi] Client timeout - disconnecting...");
    deviceConnected = false;
    
    // Turn off GREEN LED, turn on RED LED
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(RED_LED_PIN, HIGH);
    Serial.println("[LED] Status: RED ON (Disconnected)");
    
    // Stop all outputs
    for (int i = 0; i < 2; i++) {
      ledcWrite(BUZZER_PINS[i], 0);
      buzzerStates[i] = false;
    }
    for (int i = 0; i < 6; i++) {
      ledcWrite(VIBRATOR_PINS[i], 0);
      vibratorStates[i] = false;
    }
  }
  
  delay(10);
}

// Command handler - parses and executes commands from HTTP
void handleCommand(String command) {
  command.trim();
  
  // Command format: "TEST:buzzer:100" (intensity 0-100%) or "CONTROL:vibrator:on" or "ALERT:high"
  
  if (command.startsWith("TEST:")) {
    // Extract test parameters
    int firstColon = command.indexOf(':');
    int secondColon = command.indexOf(':', firstColon + 1);
    
    String testType = command.substring(firstColon + 1, secondColon);
    int intensity = command.substring(secondColon + 1).toInt();
    
    // Clamp intensity to 0-100%
    if (intensity < 0) intensity = 0;
    if (intensity > 100) intensity = 100;
    
    // Fixed duration of 3 seconds
    int duration = 3000;
    
    Serial.printf("Test Type: %s\n", testType.c_str());
    Serial.printf("Intensity: %d%% (PWM: %d/255)\n", intensity, map(intensity, 0, 100, 0, 255));
    Serial.printf("Duration: %d ms (fixed)\n", duration);
    Serial.println("---------------------------------");
    
    if (testType == "buzzer") {
      Serial.println("Testing BUZZER...");
      activateBuzzer(intensity, duration);
    }
    else if (testType == "vibrator") {
      Serial.println("Testing VIBRATORS...");
      activateVibrators(intensity, duration);
    }
    else if (testType == "both" || testType == "full") {
      Serial.println("Testing ALL devices...");
      activateBuzzer(intensity, duration);
      delay(100);
      activateVibrators(intensity, duration);
    }
    
    Serial.println("Test completed!");
  }
  else if (command.startsWith("CONTROL:")) {
    int firstColon = command.indexOf(':');
    int secondColon = command.indexOf(':', firstColon + 1);
    
    String device = command.substring(firstColon + 1, secondColon);
    String state = command.substring(secondColon + 1);
    
    bool turnOn = (state == "on" || state == "1" || state == "true");
    
    Serial.printf("Device: %s, State: %s\n", device.c_str(), turnOn ? "ON" : "OFF");
    
    if (device == "buzzer") {
      int intensity = turnOn ? 100 : 0;
      setBuzzerIntensity(intensity);
      Serial.printf("All buzzers turned %s\n", turnOn ? "ON" : "OFF");
    }
    else if (device == "vibrator") {
      int intensity = turnOn ? 100 : 0;
      setVibratorIntensity(intensity);
      Serial.printf("All vibrators turned %s\n", turnOn ? "ON" : "OFF");
    }
  }
  else if (command.startsWith("ALERT:")) {
    String level = command.substring(6);
    level.trim();
    
    Serial.printf("Alert Level: %s\n", level.c_str());
    Serial.println("---------------------------------");
    
    if (level == "low") {
      Serial.println("Low alert: Brief vibration");
      activateVibrators(50, 500);
    }
    else if (level == "medium") {
      Serial.println("Medium alert: Vibration + Buzzer");
      activateVibrators(75, 1000);
      delay(200);
      activateBuzzer(75, 500);
    }
    else if (level == "high") {
      Serial.println("High alert: Strong pattern");
      for (int i = 0; i < 3; i++) {
        activateVibrators(100, 500);
        activateBuzzer(100, 500);
        delay(200);
      }
    }
    
    Serial.println("Alert completed!");
  }
  else if (command == "STOP") {
    Serial.println("Stopping all devices...");
    for (int i = 0; i < 2; i++) {
      ledcWrite(BUZZER_PINS[i], 0);
      buzzerStates[i] = false;
    }
    for (int i = 0; i < 6; i++) {
      ledcWrite(VIBRATOR_PINS[i], 0);
      vibratorStates[i] = false;
    }
    Serial.println("All devices stopped");
  }
  else if (command == "STATUS") {
    Serial.println("Status requested");
  }
  else {
    Serial.printf("Unknown command: %s\n", command.c_str());
  }
}

// Get status as JSON string
String getStatus() {
  bool anyBuzzerOn = false;
  for (int i = 0; i < 2; i++) {
    if (buzzerStates[i]) {
      anyBuzzerOn = true;
      break;
    }
  }
  bool anyVibratorOn = false;
  for (int i = 0; i < 6; i++) {
    if (vibratorStates[i]) {
      anyVibratorOn = true;
      break;
    }
  }
  
  StaticJsonDocument<200> doc;
  doc["connected"] = deviceConnected;
  doc["buzzer"] = anyBuzzerOn ? "on" : "off";
  doc["vibrator"] = anyVibratorOn ? "on" : "off";
  doc["device_name"] = deviceName;
  doc["ip_address"] = WiFi.softAPIP().toString();
  
  String output;
  serializeJson(doc, output);
  
  Serial.printf("[STATUS] Buzzers=%s, Vibrators=%s\n", 
                anyBuzzerOn ? "ON" : "OFF", 
                anyVibratorOn ? "ON" : "OFF");
  
  return output;
}

// Helper functions for device control with PWM intensity
void activateBuzzer(int intensity, int duration) {
  setBuzzerIntensity(intensity);
  Serial.printf("  > Buzzers activated for %d ms\n", duration);
  delay(duration);
  setBuzzerIntensity(0);
  Serial.println("  > Buzzers OFF");
}

void activateVibrators(int intensity, int duration) {
  setVibratorIntensity(intensity);
  Serial.printf("  > Vibrators activated for %d ms\n", duration);
  delay(duration);
  setVibratorIntensity(0);
  Serial.println("  > Vibrators OFF");
}

// Set buzzer intensity with progressive scaling (same as vibrators but for 2 buzzers)
void setBuzzerIntensity(int intensity) {
  // intensity: 0-100%
  // Determines how many buzzers are active and their PWM level
  
  int numActiveBuzzers = 0;
  int pwmValue = 0;
  
  if (intensity == 0) {
    numActiveBuzzers = 0;
    pwmValue = 0;
  } else if (intensity <= 50) {
    // 1-50%: Only 1 buzzer active with scaled PWM
    numActiveBuzzers = 1;
    pwmValue = map(intensity, 1, 50, 64, 200);  // Low to moderate
  } else {
    // 51-100%: Both buzzers active with high PWM
    numActiveBuzzers = 2;
    pwmValue = map(intensity, 51, 100, 200, 255);  // Moderate to maximum
  }
  
  Serial.printf("  > Setting %d/%d buzzers at intensity %d%% (PWM: %d/255)\n", 
                numActiveBuzzers, 2, intensity, pwmValue);
  
  // Activate the appropriate number of buzzers
  for (int i = 0; i < 2; i++) {
    if (i < numActiveBuzzers) {
      ledcWrite(BUZZER_PINS[i], pwmValue);
      buzzerStates[i] = true;
    } else {
      ledcWrite(BUZZER_PINS[i], 0);
      buzzerStates[i] = false;
    }
  }
}

// Set vibrator intensity with progressive scaling
void setVibratorIntensity(int intensity) {
  // intensity: 0-100%
  // Determines how many vibrators are active and their PWM level
  
  int numActiveVibrators = 0;
  int pwmValue = 0;
  
  if (intensity == 0) {
    numActiveVibrators = 0;
    pwmValue = 0;
  } else if (intensity <= 16) {
    numActiveVibrators = 1;
    pwmValue = map(intensity, 1, 16, 64, 150);  // Low-moderate
  } else if (intensity <= 33) {
    numActiveVibrators = 2;
    pwmValue = map(intensity, 17, 33, 64, 150);  // Low-moderate
  } else if (intensity <= 50) {
    numActiveVibrators = 3;
    pwmValue = map(intensity, 34, 50, 150, 200);  // Moderate
  } else if (intensity <= 66) {
    numActiveVibrators = 4;
    pwmValue = map(intensity, 51, 66, 200, 230);  // Moderate-high
  } else if (intensity <= 83) {
    numActiveVibrators = 5;
    pwmValue = map(intensity, 67, 83, 230, 255);  // High
  } else {
    numActiveVibrators = 6;
    pwmValue = 255;  // Maximum
  }
  
  Serial.printf("  > Setting %d/%d vibrators at intensity %d%% (PWM: %d/255)\n", 
                numActiveVibrators, 6, intensity, pwmValue);
  
  // Activate the appropriate number of vibrators
  for (int i = 0; i < 6; i++) {
    if (i < numActiveVibrators) {
      ledcWrite(VIBRATOR_PINS[i], pwmValue);
      vibratorStates[i] = true;
    } else {
      ledcWrite(VIBRATOR_PINS[i], 0);
      vibratorStates[i] = false;
    }
  }
}
  