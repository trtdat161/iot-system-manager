
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <EEPROM.h>

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= MQTT =================
const char* mqtt_broker = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ================= SENSOR =================
#define DHT_PIN D5
#define DHT_TYPE DHT11
#define GAS_PIN A0

// ================= MQ-2 CONFIG =================
#define GAS_THRESHOLD 500
#define GAS_DANGER 800
#define GAS_RECOVERY 450

#define GAS_CONFIRM_COUNT 2
#define GAS_CLEAR_COUNT 2

#define EEPROM_CLAIMED_ADDR 0

// ================= DHT11 ALERT =================
#define TEMP_THRESHOLD 35
#define HUMID_DRY_LOW 30
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

unsigned long claimedAt = 0;

// ================= TIMER =================
unsigned long lastSensor = 0;
unsigned long lastAnnounce = 0;

const unsigned long SENSOR_INTERVAL = 5000;
const unsigned long ANNOUNCE_INTERVAL = 10000;

// Thời gian chờ sau khi claim, không phải MQ-2 warmup
const unsigned long WARMUP_TIME = 5000;

// ================= DHT STATE =================
float lastTemp = 0;
float lastHumid = 0;

bool hasValidDht = false;

// ================= MQ-2 ALERT STATE =================
int gasWarningCount = 0;
int gasDangerCount = 0;
int gasNormalCount = 0;

bool gasAlertState = false;
bool gasDangerState = false;

// ================= LCD DISPLAY =================
unsigned long lastLcdUpdate = 0;

const unsigned long LCD_INTERVAL = 2000;

int lcdPage = -1;

float currentTemp = 0;
float currentHumid = 0;

int currentGas = 0;

bool currentGasAlert = false;
bool currentGasDanger = false;

String currentSystemStatus = "normal";

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

    topicData = "devices/" + deviceMac + "/data";
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

    for (unsigned int i = 0; i < length; i++)
    {
        msg += (char)payload[i];
    }

    Serial.print(">>> MQTT CMD received: ");
    Serial.println(msg);

    if (msg == "claimed")
    {
        if (!isClaimed)
        {
            isClaimed = true;
            claimedAt = millis();

            EEPROM.write(EEPROM_CLAIMED_ADDR, 1);
            EEPROM.commit();

            Serial.println("DEVICE CLAIMED SUCCESSFULLY");
        }

        lastAnnounce = 0;

        lcd.setCursor(0, 1);
        lcd.print("STATUS: CLAIMED ");
    }
    else if (msg == "unclaim")
    {
        isClaimed = false;

        EEPROM.write(EEPROM_CLAIMED_ADDR, 0);
        EEPROM.commit();

        lastAnnounce = 0;

        lcd.setCursor(0, 1);
        lcd.print("STATUS: UNCLAIM ");
    }
    else if (msg == "on")
    {
        deviceEnabled = true;
        Serial.println("DEVICE ENABLED");
    }
    else if (msg == "off")
    {
        deviceEnabled = false;
        Serial.println("DEVICE DISABLED");
    }
}

// ================= MQTT RECONNECT =================
void reconnectMQTT()
{
    while (!mqttClient.connected())
    {
        String clientId = "ESP_" + deviceMac;

        Serial.print("Connecting MQTT... ");

        lcd.setCursor(0, 1);
        lcd.print("MQTT CONNECTING ");

        if (mqttClient.connect(clientId.c_str()))
        {
            Serial.println("OK");

            mqttClient.subscribe(topicCommand.c_str());

            lcd.setCursor(0, 1);
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

// ================= LCD HELPER =================
void printLCDLine(int row, String content)
{
    lcd.setCursor(0, row);

    if (content.length() > 16)
    {
        content = content.substring(0, 16);
    }

    lcd.print(content);

    for (int i = content.length(); i < 16; i++)
    {
        lcd.print(" ");
    }
}

// ================= LCD DISPLAY =================
void updateLCD()
{
    unsigned long now = millis();

    if (now - lastLcdUpdate < LCD_INTERVAL)
        return;

    lastLcdUpdate = now;

    // DEVICE NOT CLAIMED
    if (!isClaimed)
    {
        printLCDLine(0, "DTECH IOT SYSTEM");
        printLCDLine(1, "WAITING CLAIM");
        return;
    }

    // DEVICE DISABLED
    if (!deviceEnabled)
    {
        printLCDLine(0, "DTECH IOT SYSTEM");
        printLCDLine(1, "DEVICE OFF");
        return;
    }

    // DEVICE WARMUP AFTER CLAIM
    if (now - claimedAt <= WARMUP_TIME)
    {
        printLCDLine(0, "DTECH IOT SYSTEM");
        printLCDLine(1, "DEVICE WARMUP...");
        return;
    }

    // ROTATE LCD PAGE
    lcdPage = (lcdPage + 1) % 3;

    switch (lcdPage)
    {
        // ================= PAGE 1 =================
        case 0:

            printLCDLine(0, "DTECH IOT SYSTEM");

            printLCDLine(
                1,
                "Status: " + currentSystemStatus
            );

            break;

        // ================= PAGE 2 =================
        case 1:

            if (hasValidDht)
            {
                printLCDLine(
                    0,
                    "TEMP: " + String(currentTemp, 1) + " C"
                );

                printLCDLine(
                    1,
                    "HUMID: " + String(currentHumid, 1) + "%"
                );
            }
            else
            {
                printLCDLine(0, "DHT11");
                printLCDLine(1, "READING...");
            }

            break;

        // ================= PAGE 3 =================
        case 2:

            if (currentGasDanger)
            {
                printLCDLine(0, "GAS: DANGER!");
            }
            else if (currentGasAlert)
            {
                printLCDLine(0, "GAS: WARNING!");
            }
            else
            {
                printLCDLine(0, "GAS: NORMAL");
            }

            printLCDLine(
                1,
                "ADC: " + String(currentGas)
            );

            break;
    }
}

// ================= MQ-2 FILTER =================
int readGasFiltered()
{
    int samples[5];

    // Read 5 samples
    for (int i = 0; i < 5; i++)
    {
        samples[i] = analogRead(GAS_PIN);
        delay(20);
    }

    // Sort samples ascending
    for (int i = 0; i < 5; i++)
    {
        for (int j = i + 1; j < 5; j++)
        {
            if (samples[i] > samples[j])
            {
                int temp = samples[i];
                samples[i] = samples[j];
                samples[j] = temp;
            }
        }
    }

    // Return median value
    return samples[2];
}

// ================= SENSOR =================
void sendSensor()
{
    // ================= DHT11 =================

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    // Keep the latest valid values if DHT11 read fails
    if (!isnan(t) && !isnan(h))
    {
        lastTemp = t;
        lastHumid = h;
        hasValidDht = true;
    }
    else if (hasValidDht)
    {
        t = lastTemp;
        h = lastHumid;
    }

    currentTemp = t;
    currentHumid = h;

    // ================= MQ-2 =================

    int gas = readGasFiltered();

    // GAS DANGER
    if (gas >= GAS_DANGER)
    {
        gasDangerCount++;
        gasWarningCount = 0;
        gasNormalCount = 0;

        if (gasDangerCount >= GAS_CONFIRM_COUNT)
        {
            gasDangerState = true;
            gasAlertState = true;
        }
    }

    // GAS WARNING
    else if (gas >= GAS_THRESHOLD)
    {
        gasWarningCount++;
        gasDangerCount = 0;
        gasNormalCount = 0;

        if (gasWarningCount >= GAS_CONFIRM_COUNT)
        {
            gasAlertState = true;
            gasDangerState = false;
        }
    }

    // GAS NORMAL - HYSTERESIS
    else if (gas < GAS_RECOVERY)
    {
        gasNormalCount++;
        gasWarningCount = 0;
        gasDangerCount = 0;

        if (gasNormalCount >= GAS_CLEAR_COUNT)
        {
            gasAlertState = false;
            gasDangerState = false;
        }
    }

    // HOLD CURRENT STATE: 180-249
    else
    {
        gasWarningCount = 0;
        gasDangerCount = 0;
        gasNormalCount = 0;
    }

    // Final gas alert states
    bool gasAlert = gasAlertState;
    bool gasDanger = gasDangerState;

    // Update LCD data
    currentGas = gas;
    currentGasAlert = gasAlert;
    currentGasDanger = gasDanger;

    // ================= DHT11 ALERT =================

    bool tempAlert = hasValidDht && (t >= TEMP_THRESHOLD);
    bool humidLowAlert = hasValidDht && (h <= HUMID_DRY_LOW);
    bool humidHighAlert = hasValidDht && (h >= HUMID_WET_HIGH);

    bool envAlert = tempAlert || humidLowAlert || humidHighAlert;
    bool alert = gasAlert || envAlert;

    // ================= SYSTEM STATUS =================

    String systemStatus = alert ? "danger" : "normal";
    currentSystemStatus = systemStatus;

    // ================= JSON =================

    StaticJsonDocument<256> doc;

    // Send DHT11 data in every 5-second heartbeat
    if (hasValidDht)
    {
        doc["temperature"] = t;
        doc["humidity"] = h;
    }

    // Send gas value only when MQ-2 gas alert is confirmed
    if (gasAlert)
    {
        doc["gas"] = gas;
    }

    doc["tempAlert"] = tempAlert;
    doc["humidLowAlert"] = humidLowAlert;
    doc["humidHighAlert"] = humidHighAlert;

    doc["alert"] = alert;
    doc["systemStatus"] = systemStatus;

    if (gasDanger)
    {
        doc["type"] = "gas_danger";
    }
    else if (gasAlert)
    {
        doc["type"] = "gas";
    }
    else if (envAlert)
    {
        doc["type"] = "environment";
    }
    else
    {
        doc["type"] = "heartbeat";
    }

    // ================= MQTT PUBLISH =================

    char buffer[256];
    size_t n = serializeJson(doc, buffer);

    bool success = mqttClient.publish(
        topicData.c_str(),
        (const uint8_t*)buffer,
        n
    );

    Serial.println("--------------------------------");
    Serial.print("MQTT PUBLISH: ");
    Serial.println(success ? "SUCCESS" : "FAILED");

    if (hasValidDht)
    {
        Serial.print("Temperature: ");
        Serial.println(t);

        Serial.print("Humidity: ");
        Serial.println(h);
    }
    else
    {
        Serial.println("DHT11: READ FAILED");
    }

    Serial.print("Gas ADC: ");
    Serial.println(gas);

    Serial.print("Gas status: ");

    if (gasDanger)
    {
        Serial.println("DANGER");
    }
    else if (gasAlert)
    {
        Serial.println("WARNING");
    }
    else
    {
        Serial.println("NORMAL");
    }

    Serial.print("Alert: ");
    Serial.println(alert);

    Serial.print("System status: ");
    Serial.println(systemStatus);

    Serial.println("--------------------------------");
}

// ================= SETUP =================
void setup()
{
    Serial.begin(115200);

    Serial.println();

    Wire.begin(D2, D1);

    lcd.init();
    lcd.backlight();

    lcd.setCursor(0, 0);
    lcd.print("DTECH IOT SYSTEM");

    dht.begin();

    setupWiFi();

    // ================= EEPROM =================

    EEPROM.begin(4);

    byte claimedValue = EEPROM.read(EEPROM_CLAIMED_ADDR);

    isClaimed = (claimedValue == 1);

    Serial.print("EEPROM CLAIMED: ");
    Serial.println(isClaimed);

    if (isClaimed)
    {
        claimedAt = millis() - WARMUP_TIME - 1000;

        lcd.setCursor(0, 1);
        lcd.print("STATUS: CLAIMED ");
    }
    else
    {
        lcd.setCursor(0, 1);
        lcd.print("WAITING CLAIM   ");
    }

    // ================= MQTT =================

    mqttClient.setServer(mqtt_broker, mqtt_port);
    mqttClient.setCallback(callback);

    reconnectMQTT();
}

// ================= LOOP =================
void loop()
{
    if (!mqttClient.connected())
    {
        reconnectMQTT();
    }

    mqttClient.loop();

    unsigned long now = millis();

    // ================= ANNOUNCE =================

    if (!isClaimed && now - lastAnnounce > ANNOUNCE_INTERVAL)
    {
        sendAnnounce();

        lastAnnounce = now;

        lcd.setCursor(0, 1);
        lcd.print("WAITING CLAIM   ");
    }

    // ================= SENSOR =================

    if (
        isClaimed &&
        deviceEnabled &&
        now - lastSensor > SENSOR_INTERVAL
    )
    {
        Serial.print("isClaimed=");
        Serial.print(isClaimed);

        Serial.print(" deviceEnabled=");
        Serial.print(deviceEnabled);

        Serial.print(" now=");
        Serial.print(now);

        Serial.print(" claimedAt=");
        Serial.print(claimedAt);

        Serial.print(" diff=");
        Serial.println(now - claimedAt);

        if (now - claimedAt > WARMUP_TIME)
        {
            sendSensor();

            lcd.setCursor(0, 0);
            lcd.print("SENDING DATA    ");
        }
        else
        {
            lcd.setCursor(0, 1);
            lcd.print("WARMING UP...   ");
        }

        // Reset sensor timer even during claim warmup
        lastSensor = now;
    }

    // ================= LCD UPDATE =================

    updateLCD();
}
