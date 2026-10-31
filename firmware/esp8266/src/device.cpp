#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <EEPROM.h> //  thêm


// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 4);

// ================= MQTT =================
const char* mqtt_broker = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ================= SENSOR =================
#define DHT_PIN D5
#define DHT_TYPE DHT11
#define GAS_PIN A0
#define GAS_THRESHOLD 70      // có gas hơn 70 -> báo
#define GAS_DANGER 100         // vượt ngưỡng nguy hiểm -> báo riêng
#define EEPROM_CLAIMED_ADDR 0 // <- thêm
// ------ alert DHT-11 ------
#define TEMP_THRESHOLD 35
#define HUMID_DRY_LOW 30
#define HUMID_DRY_HIGH 40
#define HUMID_WET_LOW 60
#define HUMID_WET_HIGH 70


DHT dht(DHT_PIN, DHT_TYPE);

// ================= DEVICE INFO =================
String deviceMac;
String topicData;
String topicCommand;
const char* topicAnnounce = "devices/announce";

// ================= STATE =================
bool isClaimed = false;
bool deviceEnabled = true;
unsigned long claimedAt = 0; // thời điểm claim để tính warm-up

// ================= TIMER =================
unsigned long lastSensor = 0;
unsigned long lastAnnounce = 0;
const unsigned long SENSOR_INTERVAL = 5000;
const unsigned long ANNOUNCE_INTERVAL = 10000;
const unsigned long WARMUP_TIME = 5000; // 30s sau claim mới bắt đầu đọc

// ================= STATE =================
bool isClaimed = false;
bool deviceEnabled = true;
unsigned long claimedAt = 0;

// Giá trị DHT11 hợp lệ gần nhất (dùng khi lần đọc hiện tại bị lỗi)
float lastTemp = 0;
float lastHumid = 0;
bool hasValidDht = false;   // đã từng đọc DHT thành công chưa

// ================= WIFI =================
void setupWiFi()
{
  WiFiManager wm;
  lcd.setCursor(0, 0);
  lcd.print("WIFI SETUP...   ");

  if (!wm.autoConnect("ESP_SETUP"))
  {
    lcd.setCursor(0, 1);
    lcd.print("FAILED WIFI     ");
    delay(3000);
    ESP.restart();
  }

  deviceMac = WiFi.macAddress();
  deviceMac.replace(":", "");
  topicData    = "devices/" + deviceMac + "/data";
  topicCommand = "devices/" + deviceMac + "/command";

  lcd.setCursor(0, 0);
  lcd.print("WIFI CONNECTED  ");
  lcd.setCursor(0, 1);
  lcd.print(deviceMac.substring(0, 16));
}

// ================= MQTT CALLBACK =================
void callback(char* topic, byte* payload, unsigned int length)
{
  String msg = "";
  for (int i = 0; i < length; i++)
    msg += (char)payload[i];
    Serial.print(">>> MQTT CMD received: ");
    Serial.println(msg);

  if (msg == "claimed")
  {
    isClaimed = true;
    claimedAt = millis();
    EEPROM.write(EEPROM_CLAIMED_ADDR, 1);
    EEPROM.commit();
    lastAnnounce = 0;
    lcd.setCursor(0, 2);
    lcd.print("STATUS: CLAIMED ");
  }
  else if (msg == "unclaim")   // ← THÊM NHÁNH NÀY
  {
    isClaimed = false;
    EEPROM.write(EEPROM_CLAIMED_ADDR, 0);
    EEPROM.commit();
    lastAnnounce = 0; // reset để announce lại ngay
    lcd.setCursor(0, 2);
    lcd.print("STATUS: UNCLAIMED");
  }
  else if (msg == "on")  { deviceEnabled = true; }
  else if (msg == "off") { deviceEnabled = false; }
}

// ================= MQTT RECONNECT =================
void reconnectMQTT()
{
  while (!mqttClient.connected())
  {
    String clientId = "ESP_" + deviceMac;
    Serial.print("Connecting MQTT... ");
    lcd.setCursor(0, 3);
    lcd.print("MQTT CONNECTING ");

    if (mqttClient.connect(clientId.c_str()))
    {
      Serial.println("OK");
      mqttClient.subscribe(topicCommand.c_str());
      lcd.setCursor(0, 3);
      lcd.print("MQTT CONNECTED  ");
    }
    else
    {
      Serial.print("FAILED, rc=");
      Serial.println(mqttClient.state());
      delay(3000);
    }
  }
}

// ================= ANNOUNCE =================
void sendAnnounce()
{
  StaticJsonDocument<64> doc;
  doc["mac"] = deviceMac;
  char buf[64];
  serializeJson(doc, buf);

  bool sent = mqttClient.publish(topicAnnounce, buf);
  Serial.print("Announce sent: ");
  Serial.print(sent ? "OK -> " : "FAILED -> ");
  Serial.println(buf);
}

// ================= SENSOR =================
void sendSensor()
{
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int gas = analogRead(GAS_PIN);

  // DHT11 hay đọc lỗi thoáng qua (trả về NaN).
  // Lỗi -> dùng lại giá trị hợp lệ gần nhất, KHÔNG gán 0:
  //   - gán 0 sẽ thành "độ ẩm 0% = không khí khô" -> báo giả
  //   - tắt cờ cảnh báo sẽ khiến backend tưởng "đã về bình thường" -> reset đợt -> báo lại user đã đọc
  if (isnan(t) || isnan(h))
  {
    t = lastTemp;
    h = lastHumid;
  }
  else
  {
    lastTemp = t;
    lastHumid = h;
    hasValidDht = true;
  }

  // =========================
  // TEMPERATURE + HUMIDITY LOGIC
  // =========================
  // Chưa từng đọc được DHT lần nào (vừa khởi động) thì không báo gì
  bool tempAlert = hasValidDht && (t >= TEMP_THRESHOLD);
  bool humidLowAlert = hasValidDht && (h < HUMID_DRY_LOW);
  bool humidHighAlert = hasValidDht && (h > HUMID_WET_HIGH);

  String envStatus = "normal";

  if (humidLowAlert)
    envStatus = "dry_alert";
  else if (humidHighAlert)
    envStatus = "humid_alert";
  else if (tempAlert)
    envStatus = "temp_warning";

  // =========================
  // GAS LOGIC (GIỮ NGUYÊN)
  // =========================
  String type;
  bool alert;

  if (gas > GAS_DANGER)
  {
    type = "gas_danger";
    alert = true;
  }
  else if (gas > GAS_THRESHOLD)
  {
    type = "gas";
    alert = true;
  }
  else
  {
    type = "heartbeat";
    alert = false;
  }

  // =========================
  // SYSTEM STATUS (tổng hợp UI)
  // =========================
  String systemStatus = "normal";

  if (gas > GAS_DANGER)
    systemStatus = "gas_danger";
  else if (gas > GAS_THRESHOLD)
    systemStatus = "gas_alert";
  else if (tempAlert || humidLowAlert || humidHighAlert)
    systemStatus = "env_warning";

  // =========================
  // LCD DISPLAY
  // =========================
  lcd.setCursor(0, 1);
  lcd.print("T:");
  lcd.print((int)t);
  lcd.print(" H:");
  lcd.print((int)h);
  lcd.print("   ");

  lcd.setCursor(0, 2);
  lcd.print(systemStatus);
  lcd.print("        ");

  lcd.setCursor(0, 3);
  lcd.print("Gas:");
  lcd.print(gas);
  lcd.print("        ");

  // =========================
  // JSON PAYLOAD
  // =========================
  StaticJsonDocument<256> doc;

  doc["temperature"] = t;
  doc["humidity"] = h;
  doc["gas"] = gas;

  doc["tempAlert"] = tempAlert;
  doc["humidLowAlert"] = humidLowAlert;
  doc["humidHighAlert"] = humidHighAlert;

  doc["type"] = type;
  doc["alert"] = alert;

  doc["systemStatus"] = systemStatus;

  char buf[256];
  serializeJson(doc, buf);

  mqttClient.publish(topicData.c_str(), buf);

  Serial.println(buf);
}

// ================= SETUP =================
void setup()
{
  Serial.begin(115200);
  Serial.println();

  Wire.begin(D2, D1);// chân lcd
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("DTECH SYSTEM    ");

  dht.begin();
  setupWiFi();

  // EEPROM phải init TRƯỚC khi connect MQTT
  EEPROM.begin(4);
  isClaimed = EEPROM.read(EEPROM_CLAIMED_ADDR) == 1;
  if (isClaimed)
  {
    claimedAt = millis() - WARMUP_TIME - 1000; // skip warm-up nếu đã claimed
    Serial.println("EEPROM: already claimed, skip warmup");
    lcd.setCursor(0, 2);
    lcd.print("STATUS: CLAIMED ");
  }

  mqttClient.setServer(mqtt_broker, mqtt_port);
  mqttClient.setCallback(callback);
  reconnectMQTT(); // ← sau EEPROM init
}

// ================= LOOP =================
void loop()
{
  if (!mqttClient.connected())
    reconnectMQTT();

  mqttClient.loop();

  unsigned long now = millis();

  // ---- ANNOUNCE ----
  if (!isClaimed && now - lastAnnounce > ANNOUNCE_INTERVAL)
  {
    sendAnnounce();
    lastAnnounce = now;
    lcd.setCursor(0, 2);
    lcd.print("WAITING CLAIM   ");
  }

  // ---- SENSOR ----
  if (isClaimed && deviceEnabled && now - lastSensor > SENSOR_INTERVAL)
  {
    Serial.print("isClaimed="); Serial.print(isClaimed);
    Serial.print(" deviceEnabled="); Serial.print(deviceEnabled);
    Serial.print(" now="); Serial.print(now);
    Serial.print(" claimedAt="); Serial.print(claimedAt);
    Serial.print(" diff="); Serial.println(now - claimedAt);
    if (now - claimedAt > WARMUP_TIME)
    {
      sendSensor();
      lastSensor = now;
      lcd.setCursor(0, 3);
      lcd.print("SENDING DATA    ");
    }
    else
    {
      lcd.setCursor(0, 2);
      lcd.print("WARMING UP...   ");
    }
  }

  
}