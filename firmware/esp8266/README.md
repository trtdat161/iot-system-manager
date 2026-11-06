# ESP8266 Firmware

Firmware for the DTECH IoT device. The ESP8266 connects to Wi-Fi and the MQTT broker, announces itself until claimed by the backend, then reports sensor data and displays its status on an LCD.

## Hardware

| Component | Connection | Notes |
|---|---|---|
| ESP8266 development board | — | The exact board variant is not specified. |
| DHT11 temperature/humidity sensor | DATA → `D5` | Uses the DHT11 sensor type. |
| Analog gas sensor/module | Analog output → `A0` | The model is not specified; readings are raw ADC values. |
| 16×2 I2C LCD | SDA → `D2`, SCL → `D1` | I2C address is `0x27`. |

Use a common ground. Before wiring, confirm the board's `A0` input range, sensor supply voltage, and LCD logic-level requirements. ESP8266 board variants differ, and the repository does not include a schematic or bill of materials.

## Setup and operation

1. Power on the ESP8266. If it has no saved Wi-Fi configuration, WiFiManager starts the `ESP_SETUP` access point so Wi-Fi credentials can be configured.
2. The device identifier is its Wi-Fi MAC address with colons removed.
3. Until claimed, the device publishes its MAC address every 10 seconds on `devices/announce`.
4. The backend claims the device by publishing `claimed` to its command topic. Claim state is saved in EEPROM and restored on restart. The firmware waits 5 seconds after a new claim before sending sensor data.
5. While claimed and enabled, the device reads sensors and publishes data every 5 seconds. `on` and `off` MQTT commands enable or disable reporting; `unclaim` clears the saved claim state.
6. The LCD rotates between system status, temperature/humidity, and gas status.

Gas readings are filtered using the median of five ADC samples. A warning is confirmed at or above `500`, danger at or above `800`, and the gas alert clears after readings fall below `450`. Two consecutive readings are required to confirm or clear a state. These are raw ADC values, not calibrated gas concentration units; calibrate for the selected sensor and board before relying on alerts.

Environmental alerts use these thresholds:

- Temperature: `>= 35°C`
- Low humidity: `<= 30%`
- High humidity: `>= 70%`

If a DHT11 read fails after a valid reading, the last valid temperature and humidity are reused. Until the first valid reading, those fields are omitted from the MQTT payload.

## MQTT interface

The broker is `broker.hivemq.com:1883` (plain MQTT, no authentication or TLS).

| Direction | Topic | Payload |
|---|---|---|
| Device → broker | `devices/announce` | `{"mac":"<MAC-without-colons>"}` |
| Device → broker | `devices/<MAC>/data` | JSON sensor data and alert state |
| Firmware subscribes to | `devices/<MAC>/command` | `claimed`, `unclaim`, `on`, or `off` |

The data payload can include `temperature`, `humidity`, `gas`, `tempAlert`, `humidLowAlert`, `humidHighAlert`, `alert`, `systemStatus`, and `type`. Temperature and humidity are sent after a valid DHT11 reading; `gas` is sent only while a gas alert is active. `type` is `gas_danger`, `gas`, `environment`, or `heartbeat`. Environmental alert booleans are separate from the gas `type`. The backend subscribes to `devices/announce` and `devices/+/data`.

The public broker connection is not suitable for production without appropriate broker authentication, transport security, and topic access controls.

## Build and flash

The source is [`src/iot_device.ino`](./src/iot_device.ino). This directory does not currently include an Arduino project configuration or a pinned dependency manifest, so a reproducible build command is not available.

To build in Arduino IDE, install the ESP8266 board platform and these libraries, then open the source in a sketch configured for the correct ESP8266 board:

- PubSubClient
- WiFiManager
- ArduinoJson
- LiquidCrystal_I2C
- DHT sensor library

`ESP8266WiFi`, `Wire`, and `EEPROM` are provided by the ESP8266 Arduino core. Select the correct board and upload port in Arduino IDE before compiling and flashing. The broker address, port, and sensor thresholds are currently hard-coded in the source.
