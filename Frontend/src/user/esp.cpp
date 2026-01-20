#include <WiFi.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <nvs_flash.h>

// ================= PREFERENCES (PERSISTENT STORAGE) =================
Preferences preferences;

// ================= WIFI SETTINGS =================
String ssid = "ESP32-Network";
String password = "Esp32-Password";

// ================= SERVER =================
WiFiServer server(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;

// ================= GPIO =================
const int ledPin16 = 16;
const int ledPin17 = 17;
int motorValue = 50;
int buzzerValue = 50;

// ================= AUTHENTICATION =================
String defaultUsername = "admin";
String defaultPassword = "Admin@123";
String currentUsername = "admin";
String currentPassword = "Admin@123";
String loggedInUser = "";
unsigned long sessionTimeout = 3600000; // 1 hour in milliseconds
unsigned long lastActivityTime = 0;
bool isAuthenticated = false;

// ================= TIMING =================
unsigned long currentTime = millis();
unsigned long previousTime = 0;
const long timeoutTime = 2000;

// ================= HTTP =================
String header;

// ================= HELPER FUNCTIONS =================
String urlDecode(String input) {
  String decoded = "";
  char temp[] = "0x00";
  unsigned int len = input.length();
  unsigned int i = 0;
  while (i < len) {
    char decodedChar;
    char encodedChar = input.charAt(i++);
    if ((encodedChar == '%') && (i + 1 < len)) {
      temp[2] = input.charAt(i++);
      temp[3] = input.charAt(i++);
      decodedChar = strtol(temp, NULL, 16);
    } else if (encodedChar == '+') {
      decodedChar = ' ';
    } else {
      decodedChar = encodedChar;
    }
    decoded += decodedChar;
  }
  return decoded;
}

String extractParam(String data, String param) {
  int paramStart = data.indexOf(param + "=");
  if (paramStart == -1) return "";
  paramStart += param.length() + 1;
  int paramEnd = data.indexOf("&", paramStart);
  if (paramEnd == -1) paramEnd = data.indexOf(" ", paramStart);
  if (paramEnd == -1) paramEnd = data.length();
  return urlDecode(data.substring(paramStart, paramEnd));
}

void checkSessionTimeout() {
  if (isAuthenticated && (millis() - lastActivityTime > sessionTimeout)) {
    isAuthenticated = false;
    loggedInUser = "";
    Serial.println("Session expired");
  }
}

// ================= STORAGE FUNCTIONS =================
void loadCredentials() {
  preferences.begin("credentials", false); // Read-write mode
  
  // Load WiFi credentials
  ssid = preferences.getString("wifi_ssid", "ESP32-Network");
  password = preferences.getString("wifi_pass", "Esp32-Password");
  
  // Load user credentials
  currentUsername = preferences.getString("username", "admin");
  currentPassword = preferences.getString("password", "Admin@123");
  
  preferences.end();
  
  Serial.println("========== Loaded Credentials ==========");
  Serial.println("WiFi SSID: " + ssid);
  Serial.println("WiFi Password: " + password);
  Serial.println("Username: " + currentUsername);
  Serial.println("Password: " + currentPassword);
  Serial.println("========================================");
}

void saveWiFiCredentials(String newSSID, String newPassword) {
  Serial.println("=== Saving WiFi Credentials ===");
  Serial.println("New SSID: " + newSSID);
  Serial.println("New Password: " + newPassword);
  
  preferences.begin("credentials", false);
  size_t written1 = preferences.putString("wifi_ssid", newSSID);
  delay(50);
  size_t written2 = preferences.putString("wifi_pass", newPassword);
  delay(50);
  
  // Verify by reading back
  String readBackSSID = preferences.getString("wifi_ssid", "");
  String readBackPass = preferences.getString("wifi_pass", "");
  
  preferences.end();
  delay(100);
  
  Serial.println("SSID bytes written: " + String(written1));
  Serial.println("Password bytes written: " + String(written2));
  Serial.println("Read back SSID: " + readBackSSID);
  Serial.println("Read back Password: " + readBackPass);
  
  if (readBackSSID == newSSID && readBackPass == newPassword) {
    Serial.println("✓ VERIFICATION SUCCESS: WiFi credentials saved correctly!");
  } else {
    Serial.println("✗ VERIFICATION FAILED: WiFi credentials NOT saved correctly!");
  }
  Serial.println("===============================");
}

void saveUsername(String newUsername) {
  Serial.println("=== Saving Username ===");
  Serial.println("New Username: " + newUsername);
  
  preferences.begin("credentials", false);
  
  // Clear old value first
  preferences.remove("username");
  delay(10);
  
  // Write new value
  size_t written = preferences.putString("username", newUsername);
  delay(50);
  
  // Verify by reading back immediately
  String readBack = preferences.getString("username", "");
  
  // Close and auto-save
  preferences.end();
  delay(100);
  
  Serial.println("Bytes written: " + String(written));
  Serial.println("Read back from storage: " + readBack);
  
  if (written > 0 && readBack == newUsername) {
    Serial.println("✓ VERIFICATION SUCCESS: Username saved correctly!");
  } else {
    Serial.println("✗ VERIFICATION FAILED: Username NOT saved correctly!");
    Serial.println("Expected: " + newUsername);
    Serial.println("Got: " + readBack);
    Serial.println("Bytes written: " + String(written));
  }
  Serial.println("=======================");
}

void savePassword(String newPassword) {
  Serial.println("=== Saving Password ===");
  Serial.println("New Password: " + newPassword);
  
  preferences.begin("credentials", false);
  
  // Clear old value first
  preferences.remove("password");
  delay(10);
  
  // Write new value
  size_t written = preferences.putString("password", newPassword);
  delay(50);
  
  // Verify by reading back immediately
  String readBack = preferences.getString("password", "");
  
  // Close and auto-save
  preferences.end();
  delay(100);
  
  Serial.println("Bytes written: " + String(written));
  Serial.println("Read back from storage: " + readBack);
  
  if (written > 0 && readBack == newPassword) {
    Serial.println("✓ VERIFICATION SUCCESS: Password saved correctly!");
  } else {
    Serial.println("✗ VERIFICATION FAILED: Password NOT saved correctly!");
    Serial.println("Expected: " + newPassword);
    Serial.println("Got: " + readBack);
    Serial.println("Bytes written: " + String(written));
  }
  Serial.println("=======================");
}

void resetToDefaults() {
  preferences.begin("credentials", false);
  preferences.clear(); // Clear all stored credentials
  preferences.end();
  
  // Reset to default values
  ssid = "ESP32-Network";
  password = "Esp32-Password";
  currentUsername = "admin";
  currentPassword = "Admin@123";
  
  Serial.println("All credentials reset to defaults");
}

// Function to verify all stored credentials
void verifyAllStoredCredentials() {
  Serial.println("\n========== Verifying All Stored Credentials ==========");
  
  preferences.begin("credentials", true); // Read-only mode
  
  String stored_ssid = preferences.getString("wifi_ssid", "[NOT FOUND]");
  String stored_pass = preferences.getString("wifi_pass", "[NOT FOUND]");
  String stored_user = preferences.getString("username", "[NOT FOUND]");
  String stored_pwd = preferences.getString("password", "[NOT FOUND]");
  
  preferences.end();
  
  Serial.println("Stored in NVS Flash:");
  Serial.println("  WiFi SSID: " + stored_ssid);
  Serial.println("  WiFi Pass: " + stored_pass);
  Serial.println("  Username: " + stored_user);
  Serial.println("  Password: " + stored_pwd);
  Serial.println("");
  Serial.println("Currently in RAM:");
  Serial.println("  WiFi SSID: " + ssid);
  Serial.println("  WiFi Pass: " + password);
  Serial.println("  Username: " + currentUsername);
  Serial.println("  Password: " + currentPassword);
  Serial.println("====================================================\n");
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== ESP32 Drowsiness Detection Starting ===");
  
  // Initialize NVS
  esp_err_t err = nvs_flash_init();
  if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
    Serial.println("NVS partition was truncated, erasing and re-initializing...");
    ESP_ERROR_CHECK(nvs_flash_erase());
    err = nvs_flash_init();
  }
  
  if (err == ESP_OK) {
    Serial.println("✓ NVS Flash initialized successfully");
  } else {
    Serial.println("✗ NVS Flash initialization FAILED!");
    Serial.println("Error code: " + String(err));
  }
  
  // Load stored credentials from NVS
  loadCredentials();
  
  Serial.println("\n*** ACTIVE CREDENTIALS (loaded from NVS) ***");
  Serial.println("Login Username: " + currentUsername);
  Serial.println("Login Password: " + currentPassword);
  Serial.println("*******************************************\n");

  Serial.println("\n=== GPIO Setup ===");
  pinMode(ledPin16, OUTPUT);
  pinMode(ledPin17, OUTPUT);
  digitalWrite(ledPin16, LOW);
  digitalWrite(ledPin17, LOW);
  Serial.println("✓ GPIO pins configured");

  Serial.println("\n=== Starting WiFi Access Point ===");
  // Start Access Point with loaded credentials
  WiFi.softAP(ssid.c_str(), password.c_str());
  IPAddress IP = WiFi.softAPIP();

  Serial.println("✓ ESP32 AP Started");
  Serial.print("  IP Address: ");
  Serial.println(IP);
  Serial.print("  SSID: ");
  Serial.println(ssid);
  Serial.print("  Password: ");
  Serial.println(password);

  // Start DNS server (redirect all domains to ESP IP)
  dnsServer.start(DNS_PORT, "*", IP);

  server.begin();
  
  Serial.println("\n✓✓✓ System Ready! ✓✓✓");
  Serial.println(">>> Use these credentials to login:");
  Serial.println("    Username: " + currentUsername);
  Serial.println("    Password: " + currentPassword);
  Serial.println("\nType 'HELP' for available commands\n");
}

// ================= LOOP =================
void loop() {
  // Handle captive portal DNS
  dnsServer.processNextRequest();
  
  // Check session timeout
  checkSessionTimeout();
  
  // Check for serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd == "VERIFY" || cmd == "verify") {
      Serial.println("\n--- Manual verification requested ---");
      verifyAllStoredCredentials();
    } else if (cmd == "RESET" || cmd == "reset") {
      Serial.println("\n--- Factory reset requested ---");
      resetToDefaults();
      Serial.println("Restarting ESP32...");
      delay(1000);
      ESP.restart();
    } else if (cmd == "RELOAD" || cmd == "reload") {
      Serial.println("\n--- Reloading credentials from storage ---");
      loadCredentials();
    } else if (cmd == "HELP" || cmd == "help") {
      Serial.println("\n=== Available Serial Commands ===");
      Serial.println("VERIFY - Check what's stored in NVS flash");
      Serial.println("RELOAD - Reload credentials from storage");
      Serial.println("RESET  - Factory reset and restart");
      Serial.println("HELP   - Show this help message");
      Serial.println("=================================");
    }
  }

  WiFiClient client = server.available();

  if (client) {
    currentTime = millis();
    previousTime = currentTime;
    Serial.println("New Client Connected");
    String currentLine = "";
    bool headersEnded = false;

    while (client.connected() && currentTime - previousTime <= timeoutTime) {
      currentTime = millis();

      if (client.available()) {
        char c = client.read();
        header += c;

        if (c == '\n') {
          if (currentLine.length() == 0) {
            headersEnded = true;
            
            // For POST requests, continue reading to get the body
            if (header.indexOf("POST") >= 0) {
              // Wait a bit for the body to arrive
              delay(10);
              while (client.available()) {
                header += (char)client.read();
              }
            }

            // ===== AUTHENTICATION ENDPOINTS =====
            // Login endpoint
            if (header.indexOf("POST /api/login") >= 0) {
              // Find the body of the POST request
              int bodyStart = header.indexOf("\r\n\r\n");
              if (bodyStart != -1) {
                String body = header.substring(bodyStart + 4);
                String username = extractParam(body, "username");
                String password = extractParam(body, "password");
                
                Serial.println("========== Login Attempt ==========");
                Serial.println("Raw Body: " + body);
                Serial.println("Extracted Username: '" + username + "'");
                Serial.println("Extracted Password: '" + password + "'");
                Serial.println("Expected Username: '" + currentUsername + "'");
                Serial.println("Expected Password: '" + currentPassword + "'");
                Serial.println("Username Match: " + String(username == currentUsername));
                Serial.println("Password Match: " + String(password == currentPassword));
                Serial.println("===================================");
                
                if (username == currentUsername && password == currentPassword) {
                  isAuthenticated = true;
                  loggedInUser = username;
                  lastActivityTime = millis();
                  
                  Serial.println("Login successful for: " + username);
                  
                  client.println("HTTP/1.1 200 OK");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.print("{\"success\":true,\"message\":\"Login successful\",\"user\":\"");
                  client.print(username);
                  client.println("\"}");
                } else {
                  Serial.println("Login failed - Invalid credentials");
                  
                  client.println("HTTP/1.1 401 Unauthorized");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.println("{\"success\":false,\"message\":\"Invalid username or password\"}");
                }
                client.println();
                break;
              }
            }

            // Check authentication status
            if (header.indexOf("GET /api/auth/status") >= 0) {
              lastActivityTime = millis();
              
              client.println("HTTP/1.1 200 OK");
              client.println("Content-type:application/json");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Connection: close");
              client.println();
              
              if (isAuthenticated) {
                client.print("{\"authenticated\":true,\"user\":\"");
                client.print(loggedInUser);
                client.println("\"}");
              } else {
                client.println("{\"authenticated\":false}");
              }
              client.println();
              break;
            }

            // Logout endpoint
            if (header.indexOf("POST /api/logout") >= 0) {
              Serial.println("Logout: " + loggedInUser);
              isAuthenticated = false;
              loggedInUser = "";
              
              client.println("HTTP/1.1 200 OK");
              client.println("Content-type:application/json");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Connection: close");
              client.println();
              client.println("{\"success\":true,\"message\":\"Logged out successfully\"}");
              client.println();
              break;
            }

            // Change password endpoint
            if (header.indexOf("POST /api/change-password") >= 0) {
              Serial.println("\n*** ENDPOINT HIT: /api/change-password ***");
              
              if (!isAuthenticated) {
                Serial.println("ERROR: Not authenticated");
                client.println("HTTP/1.1 401 Unauthorized");
                client.println("Content-type:application/json");
                client.println("Access-Control-Allow-Origin: *");
                client.println("Connection: close");
                client.println();
                client.println("{\"success\":false,\"message\":\"Not authenticated\"}");
                client.println();
                break;
              }
              
              Serial.println("Step 1: Authentication OK");
              
              int bodyStart = header.indexOf("\r\n\r\n");
              Serial.println("Step 2: Looking for POST body, bodyStart = " + String(bodyStart));
              
              if (bodyStart != -1) {
                String body = header.substring(bodyStart + 4);
                
                Serial.println("\n========== Password Change POST Request ==========");
                Serial.println("Raw POST Body: '" + body + "'");
                Serial.println("Body Length: " + String(body.length()));
                Serial.println("=================================================\n");
                
                Serial.println("Step 3: Extracting parameters...");
                String oldPass = extractParam(body, "currentPassword");
                String newPass = extractParam(body, "newPassword");
                Serial.println("Step 4: Parameters extracted");
                
                Serial.println("\n========== Extracted Parameters ==========");
                Serial.println("Current Password in Memory: '" + currentPassword + "'");
                Serial.println("Provided Old Password: '" + oldPass + "'");
                Serial.println("New Password: '" + newPass + "'");
                Serial.println("Old Password Length: " + String(oldPass.length()));
                Serial.println("New Password Length: " + String(newPass.length()));
                Serial.println("Passwords Match: " + String(oldPass == currentPassword));
                Serial.println("=========================================\n");
                
                Serial.println("Step 5: Checking password match...");
                if (oldPass == currentPassword) {
                  Serial.println("Step 6: Password match CONFIRMED! Proceeding to save...");
                  Serial.println("\n>>> CALLING savePassword() function <<<");
                  savePassword(newPass);
                  Serial.println(">>> savePassword() function COMPLETED <<<\n");
                  
                  Serial.println("\n✓✓✓ Password saved! ESP32 will restart to apply changes.");
                  
                  // Send success response before restarting
                  client.println("HTTP/1.1 200 OK");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.println("{\"success\":true,\"message\":\"Password changed successfully. ESP32 is restarting...\",\"restart\":true}");
                  client.println();
                  client.stop();
                  
                  Serial.println("\n>>> Waiting for NVS write to complete...");
                  delay(2000);
                  Serial.println(">>> RESTARTING ESP32 NOW <<<\n");
                  ESP.restart();
                  break;
                } else {
                  Serial.println("✗ Password change failed - incorrect current password");
                  
                  client.println("HTTP/1.1 401 Unauthorized");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.println("{\"success\":false,\"message\":\"Current password is incorrect\"}");
                }
                client.println();
                break;
              }
            }

            // Change username endpoint
            if (header.indexOf("POST /api/change-username") >= 0) {
              Serial.println("\n*** ENDPOINT HIT: /api/change-username ***");
              
              if (!isAuthenticated) {
                Serial.println("ERROR: Not authenticated");
                client.println("HTTP/1.1 401 Unauthorized");
                client.println("Content-type:application/json");
                client.println("Access-Control-Allow-Origin: *");
                client.println("Connection: close");
                client.println();
                client.println("{\"success\":false,\"message\":\"Not authenticated\"}");
                client.println();
                break;
              }
              
              Serial.println("Step 1: Authentication OK");
              
              int bodyStart = header.indexOf("\r\n\r\n");
              Serial.println("Step 2: Looking for POST body, bodyStart = " + String(bodyStart));
              
              if (bodyStart != -1) {
                String body = header.substring(bodyStart + 4);
                
                Serial.println("\n========== Username Change POST Request ==========");
                Serial.println("Raw POST Body: '" + body + "'");
                Serial.println("Body Length: " + String(body.length()));
                Serial.println("==================================================\n");
                
                Serial.println("Step 3: Extracting parameters...");
                String verifyPass = extractParam(body, "currentPassword");
                String newUser = extractParam(body, "newUsername");
                Serial.println("Step 4: Parameters extracted");
                
                Serial.println("\n========== Extracted Parameters ==========");
                Serial.println("Current Username in Memory: '" + currentUsername + "'");
                Serial.println("Current Password in Memory: '" + currentPassword + "'");
                Serial.println("Provided Password: '" + verifyPass + "'");
                Serial.println("New Username: '" + newUser + "'");
                Serial.println("Password Length: " + String(verifyPass.length()));
                Serial.println("New Username Length: " + String(newUser.length()));
                Serial.println("Passwords Match: " + String(verifyPass == currentPassword));
                Serial.println("=========================================\n");
                
                Serial.println("Step 5: Checking password match...");
                if (verifyPass == currentPassword) {
                  Serial.println("Step 6: Password match CONFIRMED! Proceeding to save...");
                  Serial.println("\n>>> CALLING saveUsername() function <<<");
                  saveUsername(newUser);
                  Serial.println(">>> saveUsername() function COMPLETED <<<\n");
                  
                  Serial.println("\n✓✓✓ Username saved! ESP32 will restart to apply changes.");
                  
                  // Send success response before restarting
                  client.println("HTTP/1.1 200 OK");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.print("{\"success\":true,\"message\":\"Username changed successfully. ESP32 is restarting...\",\"restart\":true,\"user\":\"");
                  client.print(newUser);
                  client.println("\"}");
                  client.println();
                  client.stop();
                  
                  Serial.println("\n>>> Waiting for NVS write to complete...");
                  delay(2000);
                  Serial.println(">>> RESTARTING ESP32 NOW <<<\n");
                  ESP.restart();
                  break;
                } else {
                  Serial.println("✗ Username change failed - incorrect password");
                  
                  client.println("HTTP/1.1 401 Unauthorized");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.println("{\"success\":false,\"message\":\"Current password is incorrect\"}");
                }
                client.println();
                break;
              }
            }

            // WiFi configuration endpoint
            if (header.indexOf("POST /api/wifi-config") >= 0) {
              if (!isAuthenticated) {
                client.println("HTTP/1.1 401 Unauthorized");
                client.println("Content-type:application/json");
                client.println("Access-Control-Allow-Origin: *");
                client.println("Connection: close");
                client.println();
                client.println("{\"success\":false,\"message\":\"Not authenticated\"}");
                client.println();
                break;
              }
              
              int bodyStart = header.indexOf("\r\n\r\n");
              if (bodyStart != -1) {
                String body = header.substring(bodyStart + 4);
                
                Serial.println("\n========== WiFi Config POST Request ==========");
                Serial.println("Raw POST Body: " + body);
                Serial.println("Body Length: " + String(body.length()));
                Serial.println("==============================================");
                
                String newSSID = extractParam(body, "ssid");
                String newWiFiPass = extractParam(body, "password");
                
                Serial.println("\n========== Extracted WiFi Parameters ==========");
                Serial.println("New SSID: '" + newSSID + "'");
                Serial.println("New WiFi Password: '" + newWiFiPass + "'");
                Serial.println("SSID Length: " + String(newSSID.length()));
                Serial.println("Password Length: " + String(newWiFiPass.length()));
                Serial.println("===============================================");
                
                // Save WiFi settings to persistent storage
                saveWiFiCredentials(newSSID, newWiFiPass);
                ssid = newSSID;
                password = newWiFiPass;
                
                lastActivityTime = millis();
                
                Serial.println("WiFi configuration saved. ESP32 will restart to apply changes.");
                
                client.println("HTTP/1.1 200 OK");
                client.println("Content-type:application/json");
                client.println("Access-Control-Allow-Origin: *");
                client.println("Connection: close");
                client.println();
                client.println("{\"success\":true,\"message\":\"WiFi settings saved successfully. ESP32 will restart to apply changes.\"}");
                client.println();
                client.stop();
                
                // Wait for response to be sent
                delay(1000);
                
                // Restart ESP32 to apply new WiFi settings
                Serial.println("Restarting ESP32...");
                ESP.restart();
                
                break;
              }
            }

            // Handle OPTIONS requests for CORS
            if (header.indexOf("OPTIONS") >= 0) {
              client.println("HTTP/1.1 200 OK");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Access-Control-Allow-Methods: GET, POST, OPTIONS");
              client.println("Access-Control-Allow-Headers: Content-Type");
              client.println("Connection: close");
              client.println();
              break;
            }
            
            // Test endpoint to check current credentials (for debugging)
            if (header.indexOf("GET /api/test-credentials") >= 0) {
              Serial.println("\n=== Test Credentials Request ===");
              
              // Read from NVS
              preferences.begin("credentials", true);
              String nvs_user = preferences.getString("username", "[NOT FOUND]");
              String nvs_pass = preferences.getString("password", "[NOT FOUND]");
              preferences.end();
              
              Serial.println("In RAM - Username: " + currentUsername + ", Password: " + currentPassword);
              Serial.println("In NVS - Username: " + nvs_user + ", Password: " + nvs_pass);
              
              client.println("HTTP/1.1 200 OK");
              client.println("Content-type:application/json");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Connection: close");
              client.println();
              client.print("{\"success\":true,");
              client.print("\"ram\":{\"username\":\"");
              client.print(currentUsername);
              client.print("\",\"password\":\"");
              client.print(currentPassword);
              client.print("\"},");
              client.print("\"nvs\":{\"username\":\"");
              client.print(nvs_user);
              client.print("\",\"password\":\"");
              client.print(nvs_pass);
              client.println("\"}}");
              client.println();
              break;
            }

            // ===== MOTOR AND BUZZER CONTROL =====
            // Test motor
            if (header.indexOf("GET /api/motor/test?value=") >= 0) {
              if (!isAuthenticated) {
                client.println("HTTP/1.1 401 Unauthorized");
                client.println("Content-type:application/json");
                client.println("Access-Control-Allow-Origin: *");
                client.println("Connection: close");
                client.println();
                client.println("{\"success\":false,\"message\":\"Not authenticated\"}");
                client.println();
                break;
              }
              
              lastActivityTime = millis();
              int valueIdx = header.indexOf("value=") + 6;
              int spaceIdx = header.indexOf(" ", valueIdx);
              motorValue = header.substring(valueIdx, spaceIdx).toInt();
              
              Serial.println("--- Motor Test Triggered ---");
              Serial.print("Motor Vibration Test: ");
              Serial.print(motorValue);
              Serial.println("%");
              
              // Activate motor
              analogWrite(ledPin16, map(motorValue, 0, 100, 0, 255));
              delay(1000);
              analogWrite(ledPin16, 0);
              
              Serial.println("Motor test completed");
              
              // Send success response
              client.println("HTTP/1.1 200 OK");
              client.println("Content-type:application/json");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Connection: close");
              client.println();
              client.print("{\"success\":true,\"message\":\"Motor test completed\",\"value\":");
              client.print(motorValue);
              client.println("}");
              client.println();
              break;
            }

            // Test buzzer
            if (header.indexOf("GET /api/buzzer/test?value=") >= 0) {
              if (!isAuthenticated) {
                client.println("HTTP/1.1 401 Unauthorized");
                client.println("Content-type:application/json");
                client.println("Access-Control-Allow-Origin: *");
                client.println("Connection: close");
                client.println();
                client.println("{\"success\":false,\"message\":\"Not authenticated\"}");
                client.println();
                break;
              }
              
              lastActivityTime = millis();
              int valueIdx = header.indexOf("value=") + 6;
              int spaceIdx = header.indexOf(" ", valueIdx);
              buzzerValue = header.substring(valueIdx, spaceIdx).toInt();
              
              Serial.println("--- Buzzer Test Triggered ---");
              Serial.print("Buzzer Volume Test: ");
              Serial.print(buzzerValue);
              Serial.println("%");
              
              // Activate buzzer
              analogWrite(ledPin17, map(buzzerValue, 0, 100, 0, 255));
              delay(1000);
              analogWrite(ledPin17, 0);
              
              Serial.println("Buzzer test completed");
              
              // Send success response
              client.println("HTTP/1.1 200 OK");
              client.println("Content-type:application/json");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Connection: close");
              client.println();
              client.print("{\"success\":true,\"message\":\"Buzzer test completed\",\"value\":");
              client.print(buzzerValue);
              client.println("}");
              client.println();
              break;
            }

            // ===== 404 FOR UNKNOWN ENDPOINTS =====
            client.println("HTTP/1.1 404 Not Found");
            client.println("Content-type:application/json");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("{\"success\":false,\"message\":\"Endpoint not found\"}");
            client.println();
            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }

    header = "";
    client.stop();
    Serial.println("Client Disconnected");
  }
}
