# ESP8266 Firmware

This folder contains the embedded device source at [`src/device.cpp`](./src/device.cpp). It connects an ESP8266 to Wi-Fi, announces the device over MQTT, reads environmental sensors after the device is claimed, and displays its state on an LCD.

## Hardware referenced by the source

| Component | Connection in source | Notes |
|---|---|---|
| ESP8266 development board | — | The exact board variant is not specified. |
| DHT11 temperature/humidity sensor | DATA → `D5` | Firmware uses the DHT11 sensor type. |
| Analog gas sensor/module | Analog output → `A0` | The sensor model is not specified; readings are raw ADC values. |
| 16x4 I2C LCD | SDA → `D2`, SCL → `D1` | I2C address is `0x27`. |

Use a common ground between the board and peripherals. Confirm the board's `A0` input range, sensor supply voltage, and LCD logic-level requirements before connecting hardware; ESP8266 board variants do not all expose the same analog-input range. The repository has no schematic or bill of materials.

## Firmware behavior

- On first Wi-Fi setup, WiFiManager opens a configuration access point named `ESP_SETUP`.
- The device identifier is its Wi-Fi MAC address with colons removed.
- While unclaimed, the device publishes an announcement every 10 seconds.
- After receiving `claimed`, it waits 5 seconds, then publishes sensor readings every 5 seconds while enabled.
- Claim state is persisted in EEPROM. MQTT commands on the device command topic are `claimed`, `unclaim`, `on`, and `off`.
- Gas readings above `70` are reported as `gas`; readings above `100` are reported as `gas_danger`. Otherwise the gas type is `heartbeat`.
- Temperature at or above `35°C`, humidity below `30%`, and humidity above `70%` set separate environmental alert fields.
- If a DHT11 read fails after a valid reading, the last valid temperature and humidity are reused.

Gas thresholds are raw ADC values, not calibrated concentration units. Calibrate them for the selected sensor and board before relying on alerts.

## MQTT interface

The current source uses `broker.hivemq.com:1883`.

| Direction | Topic | Payload |
|---|---|---|
| Device → broker | `devices/announce` | `{"mac":"<MAC-without-colons>"}` |
| Device → broker | `devices/<MAC>/data` | JSON containing `temperature`, `humidity`, `gas`, `tempAlert`, `humidLowAlert`, `humidHighAlert`, `type`, `alert`, and `systemStatus` |
| Firmware subscribes to | `devices/<MAC>/command` | Recognizes `claimed`, `unclaim`, `on`, and `off`. The backend currently publishes `claimed` during the initial claim flow; publishing the other commands is not implemented there. |

`type` is `gas`, `gas_danger`, or `heartbeat`; the `alert` boolean describes gas alerts. Environmental alerts are conveyed by the three DHT-related boolean fields. The backend subscribes to the announcement and data topics.

## Dependencies and build status

The source includes these Arduino/ESP8266 libraries:

- ESP8266 Arduino core (`ESP8266WiFi`, `EEPROM`)
- PubSubClient
- WiFiManager
- ArduinoJson
- LiquidCrystal_I2C
- DHT sensor library (`DHT`)
- Wire (provided by the Arduino core)

The repository currently contains only `src/device.cpp`; it does not contain an Arduino sketch entry point, `platformio.ini`, or other board/build configuration. In addition, `device.cpp` currently declares the globals `isClaimed`, `deviceEnabled`, and `claimedAt` twice, which prevents compilation until the duplicate declarations are removed. A reproducible build and flash command cannot yet be provided from this folder alone. Add the source to a configured ESP8266 Arduino project, resolve the duplicate declarations, and select the board and required libraries before compiling.

The broker address, port, and thresholds are hard-coded in the source. The public broker connection uses plain MQTT without authentication or TLS, so it should not be treated as a production-ready configuration.
