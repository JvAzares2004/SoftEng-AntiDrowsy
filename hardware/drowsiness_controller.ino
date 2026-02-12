#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pin definitions (adjust based on your wiring)
const int BUZZER_PIN = 25;      // GPIO pin for buzzer
const int VIBRATOR_PIN = 26;    // GPIO pin for vibrator motor

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
void activateBuzzer(int duration);
void activateVibrator(int duration);

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
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(VIBRATOR_PIN, LOW);
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
  
  // Initialize GPIO pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(VIBRATOR_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(VIBRATOR_PIN, LOW);
  
  Serial.println("GPIO pins initialized:");
  Serial.printf("  - Buzzer: GPIO %d\n", BUZZER_PIN);
  Serial.printf("  - Vibrator: GPIO %d\n\n", VIBRATOR_PIN);
  
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
  
  // Command format: "TEST:buzzer:2000" or "CONTROL:vibrator:on" or "ALERT:high"
  
  if (command.startsWith("TEST:")) {
    // Extract test parameters
    int firstColon = command.indexOf(':');
    int secondColon = command.indexOf(':', firstColon + 1);
    
    String testType = command.substring(firstColon + 1, secondColon);
    int duration = command.substring(secondColon + 1).toInt();
    
    if (duration == 0) duration = 2000; // Default 2 seconds
    
    Serial.printf("Test Type: %s\n", testType.c_str());
    Serial.printf("Duration: %d ms\n", duration);
    Serial.println("---------------------------------");
    
    if (testType == "buzzer") {
      Serial.println("Testing BUZZER...");
      activateBuzzer(duration);
    }
    else if (testType == "vibrator") {
      Serial.println("Testing VIBRATOR...");
      activateVibrator(duration);
    }
    else if (testType == "both" || testType == "full") {
      Serial.println("Testing BOTH devices...");
      activateBuzzer(duration);
      delay(100);
      activateVibrator(duration);
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
      digitalWrite(BUZZER_PIN, turnOn ? HIGH : LOW);
      buzzerState = turnOn;
      Serial.printf("Buzzer turned %s\n", turnOn ? "ON" : "OFF");
    }
    else if (device == "vibrator") {
      digitalWrite(VIBRATOR_PIN, turnOn ? HIGH : LOW);
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
      activateVibrator(500);
    }
    else if (level == "medium") {
      Serial.println("Medium alert: Vibration + Buzzer");
      activateVibrator(1000);
      delay(200);
      activateBuzzer(500);
    }
    else if (level == "high") {
      Serial.println("High alert: Strong pattern");
      for (int i = 0; i < 3; i++) {
        activateVibrator(500);
        activateBuzzer(500);
        delay(200);
      }
    }
    
    Serial.println("Alert completed!");
    updateStatus();
  }
  else if (command == "STOP") {
    Serial.println("Stopping all devices...");
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(VIBRATOR_PIN, LOW);
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

// Helper functions for device control
void activateBuzzer(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  buzzerState = true;
  Serial.printf("  > Buzzer ON for %d ms\n", duration);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
  buzzerState = false;
  Serial.println("  > Buzzer OFF");
}

void activateVibrator(int duration) {
  digitalWrite(VIBRATOR_PIN, HIGH);
  vibratorState = true;
  Serial.printf("  > Vibrator ON for %d ms\n", duration);
  delay(duration);
  digitalWrite(VIBRATOR_PIN, LOW);
  vibratorState = false;
  Serial.println("  > Vibrator OFF");
}
