#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pin definitions (adjust based on your wiring)
const int BUZZER_PIN = 25;      // GPIO pin for buzzer
const int VIBRATOR_PIN = 26;    // GPIO pin for vibrator motor

// PWM settings for intensity control
const int BUZZER_PWM_CHANNEL = 0;
const int VIBRATOR_PWM_CHANNEL = 1;
const int PWM_FREQUENCY = 5000;  // 5 KHz
const int PWM_RESOLUTION = 8;    // 8-bit resolution (0-255)

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define COMMAND_CHAR_UUID   "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define STATUS_CHAR_UUID    "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// Device information
String deviceName = "ESP32-Drowsiness";
bool deviceConnected = false;
bool oldDeviceConnected = false;

// BLE objects
BLEServer* pServer = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;
BLECharacteristic* pStatusCharacteristic = NULL;

// Control states
bool buzzerState = false;
bool vibratorState = false;

// Forward declarations
void handleCommand(String command);
void updateStatus();
void activateBuzzer(int intensity, int duration);
void activateVibrator(int intensity, int duration);

// BLE Server Callbacks
class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("\n=================================");
    Serial.println("[BLE] Client connected!");
    Serial.println("=================================\n");
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("\n=================================");
    Serial.println("[BLE] Client disconnected!");
    Serial.println("=================================\n");
    
    // Stop all outputs when disconnected
    ledcWrite(BUZZER_PIN, 0);
    ledcWrite(VIBRATOR_PIN, 0);
    buzzerState = false;
    vibratorState = false;
    
    // Restart advertising
    BLEDevice::startAdvertising();
    Serial.println("[BLE] Advertising restarted");
  }
};

// BLE Characteristic Callbacks - Handle incoming commands
class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String command = pCharacteristic->getValue().c_str();
    
    if (command.length() > 0) {
      Serial.println("\n=================================");
      Serial.println("[COMMAND RECEIVED]");
      Serial.println("=================================");
      Serial.printf("Raw command: %s\n", command.c_str());
      Serial.println("---------------------------------");
      
      handleCommand(command);
      
      Serial.println("=================================\n");
    }
  }
};

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=================================");
  Serial.println("ESP32 Drowsiness Detection Controller");
  Serial.println("Bluetooth Low Energy (BLE) Mode");
  Serial.println("=================================\n");
  
  // CRITICAL: Set pin modes FIRST before PWM
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(VIBRATOR_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(VIBRATOR_PIN, LOW);
  
  Serial.println("GPIO pins set as OUTPUT");
  
  // Initialize PWM - ESP32 Arduino Core 3.0+ API
  ledcAttach(BUZZER_PIN, PWM_FREQUENCY, PWM_RESOLUTION);
  ledcWrite(BUZZER_PIN, 0);
  
  ledcAttach(VIBRATOR_PIN, PWM_FREQUENCY, PWM_RESOLUTION);
  ledcWrite(VIBRATOR_PIN, 0);
  
  Serial.println("GPIO pins initialized with PWM:");
  Serial.printf("  - Buzzer: GPIO %d (PWM Channel %d)\n", BUZZER_PIN, BUZZER_PWM_CHANNEL);
  Serial.printf("  - Vibrator: GPIO %d (PWM Channel %d)\n", VIBRATOR_PIN, VIBRATOR_PWM_CHANNEL);
  Serial.printf("  - PWM Frequency: %d Hz\n", PWM_FREQUENCY);
  Serial.printf("  - PWM Resolution: %d-bit (0-255)\n\n", PWM_RESOLUTION);
  
  // === IMMEDIATE HARDWARE TEST ===
  Serial.println("=== HARDWARE TEST ===");
  Serial.println("Testing GPIO 25 with digitalWrite (should light LED)...");
  digitalWrite(BUZZER_PIN, HIGH);
  delay(2000);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("GPIO 25 test done");
  
  Serial.println("Testing GPIO 26 with digitalWrite...");
  digitalWrite(VIBRATOR_PIN, HIGH);
  delay(2000);
  digitalWrite(VIBRATOR_PIN, LOW);
  Serial.println("GPIO 26 test done");
  
  Serial.println("Testing GPIO 25 with PWM at 255 (100%)...");
  ledcWrite(BUZZER_PIN, 255);
  delay(2000);
  ledcWrite(BUZZER_PIN, 0);
  Serial.println("PWM test done");
  
  Serial.println("Testing GPIO 26 with PWM at 128 (50%)...");
  ledcWrite(VIBRATOR_PIN, 128);
  delay(2000);
  ledcWrite(VIBRATOR_PIN, 0);
  Serial.println("=== HARDWARE TEST COMPLETE ===\n");
  
  // Initialize BLE
  Serial.println("Initializing BLE...");
  BLEDevice::init(deviceName.c_str());
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create Command Characteristic (Write)
  pCommandCharacteristic = pService->createCharacteristic(
    COMMAND_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCommandCharacteristic->setCallbacks(new CommandCallbacks());
  
  // Create Status Characteristic (Read & Notify)
  pStatusCharacteristic = pService->createCharacteristic(
    STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusCharacteristic->addDescriptor(new BLE2902());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("\n=================================");
  Serial.println("BLE Server started!");
  Serial.printf("Device Name: %s\n", deviceName.c_str());
  Serial.println("Waiting for connections...");
  Serial.println("=================================\n");
}

void loop() {
  // Handle connection state changes
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
    // Send initial status when connected
    updateStatus();
  }
  
  if (!deviceConnected && oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  delay(20);
}

// Command handler - parses and executes commands from BLE
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
      Serial.println("Testing VIBRATOR...");
      activateVibrator(intensity, duration);
    }
    else if (testType == "both" || testType == "full") {
      Serial.println("Testing BOTH devices...");
      activateBuzzer(intensity, duration);
      delay(100);
      activateVibrator(intensity, duration);
    }
    
    Serial.println("Test completed!");
    updateStatus();
  }
  else if (command.startsWith("CONTROL:")) {
    int firstColon = command.indexOf(':');
    int secondColon = command.indexOf(':', firstColon + 1);
    
    String device = command.substring(firstColon + 1, secondColon);
    String state = command.substring(secondColon + 1);
    
    bool turnOn = (state == "on" || state == "1" || state == "true");
    
    Serial.printf("Device: %s, State: %s\n", device.c_str(), turnOn ? "ON" : "OFF");
    
    if (device == "buzzer") {
      ledcWrite(BUZZER_PIN, turnOn ? 255 : 0);
      buzzerState = turnOn;
      Serial.printf("Buzzer turned %s\n", turnOn ? "ON" : "OFF");
    }
    else if (device == "vibrator") {
      ledcWrite(VIBRATOR_PIN, turnOn ? 255 : 0);
      vibratorState = turnOn;
      Serial.printf("Vibrator turned %s\n", turnOn ? "ON" : "OFF");
    }
    
    updateStatus();
  }
  else if (command.startsWith("ALERT:")) {
    String level = command.substring(6);
    level.trim();
    
    Serial.printf("Alert Level: %s\n", level.c_str());
    Serial.println("---------------------------------");
    
    if (level == "low") {
      Serial.println("Low alert: Brief vibration");
      activateVibrator(50, 500);
    }
    else if (level == "medium") {
      Serial.println("Medium alert: Vibration + Buzzer");
      activateVibrator(75, 1000);
      delay(200);
      activateBuzzer(75, 500);
    }
    else if (level == "high") {
      Serial.println("High alert: Strong pattern");
      for (int i = 0; i < 3; i++) {
        activateVibrator(100, 500);
        activateBuzzer(100, 500);
        delay(200);
      }
    }
    
    Serial.println("Alert completed!");
    updateStatus();
  }
  else if (command == "STOP") {
    Serial.println("Stopping all devices...");
    ledcWrite(BUZZER_PIN, 0);
    ledcWrite(VIBRATOR_PIN, 0);
    buzzerState = false;
    vibratorState = false;
    Serial.println("All devices stopped");
    updateStatus();
  }
  else if (command == "STATUS") {
    Serial.println("Status requested");
    updateStatus();
  }
  else {
    Serial.printf("Unknown command: %s\n", command.c_str());
  }
}

// Update status characteristic
void updateStatus() {
  if (deviceConnected && pStatusCharacteristic != NULL) {
    String status = String(buzzerState ? "1" : "0") + "," + String(vibratorState ? "1" : "0");
    pStatusCharacteristic->setValue(status.c_str());
    pStatusCharacteristic->notify();
    Serial.printf("[STATUS] Buzzer=%s, Vibrator=%s (notified)\n", 
                  buzzerState ? "ON" : "OFF", 
                  vibratorState ? "ON" : "OFF");
  }
}

// Helper functions for device control with PWM intensity
void activateBuzzer(int intensity, int duration) {
  // Map intensity (0-100%) to PWM duty cycle (0-255)
  int pwmValue = map(intensity, 0, 100, 0, 255);
  
  ledcWrite(BUZZER_PIN, pwmValue);
  buzzerState = true;
  Serial.printf("  > Buzzer ON at %d%% intensity (PWM: %d/255) for %d ms\n", intensity, pwmValue, duration);
  delay(duration);
  ledcWrite(BUZZER_PIN, 0);
  buzzerState = false;
  Serial.println("  > Buzzer OFF");
}

void activateVibrator(int intensity, int duration) {
  // Map intensity (0-100%) to PWM duty cycle (0-255)
  int pwmValue = map(intensity, 0, 100, 0, 255);
  
  ledcWrite(VIBRATOR_PIN, pwmValue);
  vibratorState = true;
  Serial.printf("  > Vibrator ON at %d%% intensity (PWM: %d/255) for %d ms\n", intensity, pwmValue, duration);
  delay(duration);
  ledcWrite(VIBRATOR_PIN, 0);
  vibratorState = false;
  Serial.println("  > Vibrator OFF");
}
