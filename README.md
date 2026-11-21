# IoT Environmental Monitoring and Alert System (One Device, Multiple Users)

A web-based IoT platform for monitoring environmental sensor data, receiving real-time alerts, and managing connected devices and user accounts.

## Overview

IoT System Manager connects ESP8266-based sensor devices to a centralized web application. It collects gas, temperature, and humidity readings through MQTT, processes sensor events on the backend, and delivers real-time updates to user dashboards.

The system also provides notification history, independent read-status tracking, and administrative tools for managing users, devices, and alert activity.

**Key capabilities:**

- Real-time sensor monitoring and alert delivery.
- Device discovery, claiming, connection, and disconnection.
- Notification history with individual read-status tracking.
- Email notifications for associated users when sensor alerts occur.
- Role-based user and administrator management.
- Dashboard analytics for account, device, and alert activity.

## Features

### User

- Live sensor dashboard with SignalR updates.
- Device claiming and connection management.
- Notification history with date, type, and read-status filters.
- Individual notification acknowledgement.
- Profile management.

### Administrator

- Dashboard with account/device statistics and alert trends.
- User management, including search, lock/unlock, and removal.
- Device and account administration.
- Notification history with recipient-level read-status details.
- Profile management.

### Device & Notification Workflow

- Multiple user accounts can be associated with one device; each account can have one assigned device at a time.
- Sensor alerts are recorded for associated users.
- Duplicate unread notifications are prevented during the same active alert incident.
- Alert emails are queued independently of notification read status.
- Live device events are distributed through SignalR.

## Technology Stack

| Area                    | Technologies                                     |
| ----------------------- | ------------------------------------------------ |
| Frontend                | React 19, Vite 8, React Router, Axios            |
| Backend                 | ASP.NET Core Web API, .NET 10, C#                |
| Database                | SQL Server, Entity Framework Core                |
| Authentication          | JWT, HTTP-only Cookies, Role-based Authorization |
| Real-time Communication | SignalR                                          |
| IoT Communication       | MQTT, MQTTnet                                    |
| Email                   | MailKit, SMTP with STARTTLS                      |
| Localization            | i18next, English, Vietnamese                     |
| Embedded                | ESP8266, Arduino Libraries                       |
| Sensors & Display       | DHT11, MQ-2, 16x2 I2C LCD                        |

## System Architecture

```text
ESP8266 + Sensors
       │
       │ MQTT
       ▼
   MQTT Broker
       │
       │ MQTT Subscription
       ▼
 ASP.NET Core Backend
       │
       ├── Process sensor readings
       ├── Manage device activity
       ├── Store notifications
       ├── Queue alert emails
       │
       ├──────────► SQL Server
       │
       ├──────────► SMTP (Email)
       │
       ▼
   SignalR Hub
       │
       ▼
   React Frontend
       │
       ├── User Dashboard
       └── Admin Dashboard
```

### Data Flow

1. **Device → MQTT Broker:** ESP8266 publishes device announcements, sensor readings, and alert states.
2. **MQTT Broker → Backend:** ASP.NET Core subscribes to device topics and processes incoming messages.
3. **Backend Processing:** Updates device activity, stores notifications, and queues alert emails.
4. **Backend → Frontend:** SignalR delivers real-time sensor data and alert events to connected dashboards.
5. **Email Delivery:** A background worker sends alert emails through SMTP with STARTTLS.
6. **Notification Management:** Users review and acknowledge notifications through their history pages.

## Hardware & Firmware

The ESP8266 firmware integrates:

- DHT11 temperature and humidity sensor.
- MQ-2 gas sensor.
- 16x2 I2C LCD.
- MQTT-based communication with the backend.

Hardware connections, pin mapping, firmware dependencies, and setup instructions are documented in [firmware/esp8266/README.md](./firmware/esp8266/README.md).

## Project Structure

```text
.
├── firmware/
│   └── esp8266/
│       ├── README.md
│       └── src/
│           └── iot_device.ino
│
├── iot-system-backend/
│   └── IoT-system/
│       ├── Configurations/
│       ├── Controllers/
│       ├── DTOS/
│       ├── Hubs/
│       ├── Models/
│       ├── Services/
│       ├── Profiles/
│       ├── Helper/
│       └── Program.cs
│
└── iot-system-frontend/
    └── src/
        ├── api/
        ├── assets/
        ├── components/
        ├── hooks/
        ├── locales/
        ├── pages/
        ├── routes/
        ├── utils/
        └── App.jsx
```

## Technical Notes

- Gas sensor readings are raw ADC values, not calibrated gas concentration measurements.
- The public landing page contains an illustrative dashboard preview, not live device data.
- The current implementation does not include household/group management or automatic device-disconnection alerts.
- The MQTT broker configuration is intended for development and should be secured before production deployment.
