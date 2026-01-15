#include <WiFi.h>
#include <DNSServer.h>

// ================= WIFI SETTINGS =================
const char* ssid = "ESP32-Network";
const char* password = "Esp32-Password";

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

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(ledPin16, OUTPUT);
  pinMode(ledPin17, OUTPUT);
  digitalWrite(ledPin16, LOW);
  digitalWrite(ledPin17, LOW);

  // Start Access Point
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();

  Serial.println("ESP32 AP Started");
  Serial.print("IP Address: ");
  Serial.println(IP);

  // Start DNS server (redirect all domains to ESP IP)
  dnsServer.start(DNS_PORT, "*", IP);

  server.begin();
}

// ================= LOOP =================
void loop() {
  // Handle captive portal DNS
  dnsServer.processNextRequest();
  
  // Check session timeout
  checkSessionTimeout();

  WiFiClient client = server.available();

  if (client) {
    currentTime = millis();
    previousTime = currentTime;
    Serial.println("New Client Connected");
    String currentLine = "";

    while (client.connected() && currentTime - previousTime <= timeoutTime) {
      currentTime = millis();

      if (client.available()) {
        char c = client.read();
        header += c;

        if (c == '\n') {
          if (currentLine.length() == 0) {

            // ===== AUTHENTICATION ENDPOINTS =====
            // Login endpoint
            if (header.indexOf("POST /api/login") >= 0) {
              // Find the body of the POST request
              int bodyStart = header.indexOf("\r\n\r\n");
              if (bodyStart != -1) {
                String body = header.substring(bodyStart + 4);
                String username = extractParam(body, "username");
                String password = extractParam(body, "password");
                
                Serial.println("Login attempt:");
                Serial.println("Username: " + username);
                
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
                String oldPass = extractParam(body, "currentPassword");
                String newPass = extractParam(body, "newPassword");
                
                if (oldPass == currentPassword) {
                  currentPassword = newPass;
                  lastActivityTime = millis();
                  
                  Serial.println("Password changed successfully");
                  
                  client.println("HTTP/1.1 200 OK");
                  client.println("Content-type:application/json");
                  client.println("Access-Control-Allow-Origin: *");
                  client.println("Connection: close");
                  client.println();
                  client.println("{\"success\":true,\"message\":\"Password changed successfully\"}");
                } else {
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
