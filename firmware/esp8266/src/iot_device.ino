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

#define GAS_THRESHOLD 70
#define GAS_DANGER 100

#define EEPROM_CLAIMED_ADDR 0

// ------ DHT11 ALERT ------
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

const unsigned long WARMUP_TIME = 5000;

// ================= DHT STATE =================

float lastTemp = 0;
float lastHumid = 0;

bool hasValidDht = false;

// ================= MQ2 WARMUP =================

unsigned long mq2StartedAt = 0;

const unsigned long MQ2_WARMUP_TIME = 120000; // 2 phút

bool mq2Ready = false;

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
    }
    else if (msg == "off")
    {
        deviceEnabled = false;
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

            if (!mq2Ready)
            {
                printLCDLine(0, "MQ2 WARMING UP");

                printLCDLine(1, "Please wait...");
            }
            else
            {
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
            }

            break;
    }
}

// ================= SENSOR =================

void sendSensor()
{
    float t = dht.readTemperature();

    float h = dht.readHumidity();

    int gas = analogRead(GAS_PIN);

    // ================= DHT VALIDATION =================

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

    currentTemp = t;

    currentHumid = h;

    currentGas = gas;

    // ================= MQ2 WARMUP =================

    mq2Ready = (
        millis() - mq2StartedAt >= MQ2_WARMUP_TIME
    );

    // ================= DHT ALERT =================

    bool tempAlert =
        hasValidDht && (t >= TEMP_THRESHOLD);

    bool humidLowAlert =
        hasValidDht && (h < HUMID_DRY_LOW);

    bool humidHighAlert =
        hasValidDht && (h > HUMID_WET_HIGH);

    bool envAlert =
        tempAlert || humidLowAlert || humidHighAlert;

    // ================= GAS ALERT =================

    bool gasAlert =
        mq2Ready && (gas > GAS_THRESHOLD);

    bool gasDanger =
        mq2Ready && (gas > GAS_DANGER);

    currentGasAlert = gasAlert;

    currentGasDanger = gasDanger;

    // ================= SYSTEM STATUS =================

    String systemStatus = "normal";

    if (gasDanger)
    {
        systemStatus = "gas_danger";
    }
    else if (gasAlert)
    {
        systemStatus = "gas_alert";
    }
    else if (envAlert)
    {
        systemStatus = "env_warning";
    }

    currentSystemStatus = systemStatus;

    // ================= DEBUG SERIAL =================

    Serial.println();

    Serial.println("===== SENSOR DATA =====");

    Serial.print("Temperature: ");

    Serial.println(t);

    Serial.print("Humidity: ");

    Serial.println(h);

    Serial.print("Gas ADC: ");

    Serial.println(gas);

    Serial.print("MQ2 Ready: ");

    Serial.println(mq2Ready);

    Serial.print("Gas Alert: ");

    Serial.println(gasAlert);

    Serial.print("Gas Danger: ");

    Serial.println(gasDanger);

    Serial.print("Environment Alert: ");

    Serial.println(envAlert);

    Serial.print("System Status: ");

    Serial.println(systemStatus);

    // ================= MQTT PUBLISH =================

    // NO ALERT -> SKIP PUBLISH

    if (!gasAlert && !envAlert)
    {
        Serial.println("MQTT: No alert - Skip publishing");

        return;
    }

    // ================= JSON PAYLOAD =================

    String type;

    if (gasDanger)
    {
        type = "gas_danger";
    }
    else if (gasAlert)
    {
        type = "gas";
    }
    else
    {
        type = "heartbeat";
    }

    StaticJsonDocument<256> doc;

    doc["temperature"] = t;

    doc["humidity"] = h;

    // Chỉ gửi ADC gas khi MQ2 đã qua warmup
    if (mq2Ready)
    {
        doc["gas"] = gas;
    }

    doc["tempAlert"] = tempAlert;

    doc["humidLowAlert"] = humidLowAlert;

    doc["humidHighAlert"] = humidHighAlert;

    doc["type"] = type;

    // Giữ nguyên logic alert gas như firmware ban đầu
    doc["alert"] = gasAlert;

    doc["systemStatus"] = systemStatus;

    char buf[256];

    serializeJson(doc, buf);

    bool published = mqttClient.publish(
        topicData.c_str(),
        buf
    );

    Serial.print("MQTT PUBLISH: ");

    Serial.println(published ? "SUCCESS" : "FAILED");

    Serial.println(buf);
}

// ================= SETUP =================

void setup()
{
    Serial.begin(115200);

    Serial.println();

    // MQ2 START TIME
    mq2StartedAt = millis();

    Wire.begin(D2, D1);

    lcd.init();

    lcd.backlight();

    lcd.setCursor(0, 0);

    lcd.print("DTECH IOT SYSTEM");

    dht.begin();

    setupWiFi();

    // ================= EEPROM =================

    EEPROM.begin(4);

    isClaimed = EEPROM.read(EEPROM_CLAIMED_ADDR) == 1;

    if (isClaimed)
    {
        claimedAt = millis() - WARMUP_TIME - 1000;

        Serial.println("EEPROM: already claimed, skip warmup");

        lcd.setCursor(0, 1);

        lcd.print("STATUS: CLAIMED ");
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