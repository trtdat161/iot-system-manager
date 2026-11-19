# IoT System Manager

## Project Overview

IoT System Manager is a web-based platform for connecting IoT sensor devices to users and administrators. It receives device announcements and sensor readings, presents live readings and alerts, and keeps a history of notifications for review.

The current data model allows multiple user accounts to be associated with one device. Each account can be associated with one device at a time.

## Problem It Addresses

Sensor devices can generate important safety information, but users need a practical way to see that information, understand when an alert occurred, and confirm that they have reviewed it. Administrators also need visibility into registered accounts, device status, and notification activity.

The project addresses these needs by:

- Delivering sensor readings and alerts to dashboards in real time.
- Recording notifications so users and administrators can review alert history and read status.
- Providing account and device management features with role-based access.
- Bringing device, user, and notification information together in one web application.

The system supports gas, temperature, and humidity sensor payloads. It saves alerts for each recipient, lets users acknowledge them independently, and shows administrators whether any recipient still has an unread alert. The admin dashboard provides account/device summaries and alert trends for the most recent 12 months, with a daily breakdown for a selected month. The public landing page contains an illustrative dashboard preview; that preview is not connected to live device data.

Household/group management and automatic alerts for a device losing its connection are outside the current scope. Gas readings are raw ADC values and are not calibrated concentration measurements.

## Application Features

### Public and authentication

- Public landing page describing the platform.
- User registration and login with role-based access.
- Access and refresh tokens are stored in HTTP-only cookies; expired sessions are refreshed by the frontend when possible.
- English and Vietnamese interface translations.

### User

- Live device dashboard with sensor readings and alerts delivered over SignalR.
- Device claim flow and controls to connect or disconnect the account's assigned device.
- Notification history with date, type, and read-status filters; users can mark each notification as read.
- Profile management and a page for devices waiting to be connected.

### Administrator

- Dashboard with account/device totals, account status summaries, and alert trends.
- User management, including account search, lock/unlock, and removal.
- Device status and account/device administration pages.
- Notification history with date/type filters and notification detail pages listing each recipient's read status. A history card is marked unread if at least one recipient has not read it.
- Administrator profile management.

### Device and notification workflow

- Each device can be associated with multiple user accounts; each account is associated with one device at a time.
- Sensor alerts are saved per recipient. During an active alert incident, unread notifications are not repeatedly recreated for the same recipient.
- Alert emails are queued for associated users independently of whether they already have an unread notification.
- The firmware publishes readings and alert states over MQTT; the backend updates device activity and distributes live events to connected dashboards.

## Technology Stack

| Area                             | Technologies                                 |
| -------------------------------- | -------------------------------------------- |
| Frontend                         | React 19, Vite 8, React Router, Axios        |
| Backend                          | ASP.NET Core Web API, .NET 10, C#            |
| Data access and storage          | Entity Framework Core, SQL Server            |
| Authentication and authorization | JWT stored in cookies, role-based access     |
| Real-time updates                | SignalR                                      |
| Device messaging                 | MQTTnet                                      |
| Alert email                      | MailKit, SMTP with STARTTLS                  |
| Localization                     | i18next, English and Vietnamese              |
| Embedded device                  | ESP8266 Arduino libraries, MQTT              |
| Hardware referenced by firmware  | ESP8266, DHT11, MQ2 gas sensor, 16x2 I2C LCD |

## System Architecture and Workflow

```text
ESP8266 + sensors + LCD
   │  Sensor readings and device announcements (MQTT)
   ▼
MQTT Broker
   │  devices/announce, devices/{MAC}/data
   ▼
ASP.NET Core Backend
   ├── Updates device last-seen information
   ├── Stores alert notifications in SQL Server
   ├── Queues alert emails for associated users
   └── Publishes live events through SignalR
          │  ReceiveSensorData / ReceiveAlert / ReceiveAdminAlert
          ▼
React Frontend
   ├── Displays live sensor readings and alerts on the user dashboard
   └── Updates administrator notification history for new alerts

ASP.NET Core Backend ── SMTP (STARTTLS) ──► User email inboxes
```

1. **Device to broker:** An ESP8266 publishes its MAC address when announcing itself and sends sensor readings, such as gas, temperature, and humidity, over MQTT.
2. **Broker to backend:** The backend subscribes to `devices/announce` and `devices/{MAC}/data`. It registers newly announced devices, processes incoming readings, and updates the device's last-seen time.
3. **Backend processing:** Sensor readings are sent to connected dashboards in real time. When a reading indicates an alert, the backend creates notification records for users associated with the device and avoids repeating notifications for each user during the same active alert incident. Alert counts continue across incidents while an unread notification of that kind remains; after it is acknowledged, a later incident starts a new count. Counts are sent to connected dashboards in real time and saved on each user's latest notification for that kind. The backend also queues an email for each associated user once per alert kind and active incident, even if that user already has an unread notification.
4. **Backend to frontend:** The backend emits `ReceiveSensorData` and `ReceiveAlert` to device groups and `ReceiveAdminAlert` to administrators through SignalR. Connected pages update their sensor readings, alerts, or notification history as events arrive.
5. **Email delivery:** A background worker sends queued alert emails over SMTP using STARTTLS. Each email is attempted up to three times (two retries after the initial attempt). The in-memory queue holds up to 200 messages; email delivery failures are logged and do not stop the main sensor notification flow.
6. **Review and acknowledgement:** Users can view saved notifications in their history and mark them as read. On the initial claim flow, the backend publishes `claimed` to `devices/{MAC}/command`; the firmware also recognizes `unclaim`, `on`, and `off`, but the backend currently does not publish those commands.

### Email configuration

Configure the backend's `EmailSettings` through .NET configuration. The SMTP host defaults to `smtp.gmail.com` on port `587` with STARTTLS; provide the sender address, SMTP username, and password before enabling email delivery. For local development, use .NET user secrets; in deployment, use environment variables or a secret manager rather than committing credentials to `appsettings.json`.

The corresponding environment variable names are `EmailSettings__Host`, `EmailSettings__Port`, `EmailSettings__SenderName`, `EmailSettings__SenderEmail`, `EmailSettings__Username`, and `EmailSettings__Password`.

## Firmware and Hardware

The ESP8266 firmware reads a DHT11 temperature/humidity sensor and an analog gas sensor, displays status on a 16x2 I2C LCD, and exchanges announcements, readings, and commands with the backend over MQTT. The code and hardware pin mapping are documented in [firmware/esp8266/README.md](./firmware/esp8266/README.md).

The hardware list and pin mapping in the firmware README are inferred from the source code; the repository does not include a schematic, bill of materials, or a specific gas sensor model. Check the ESP8266 board's analog-input voltage limits and sensor supply requirements before wiring. Firmware currently uses the public HiveMQ broker on port `1883` without TLS or broker credentials; treat this as a development configuration.

## Project Structure

```text
.
├── README.md
├── firmware/
│   └── esp8266/
│       ├── README.md            # Firmware behavior, dependencies, and hardware wiring
│       └── src/
│           └── iot_device.ino   # ESP8266 device firmware
├── iot-system-backend/
│   ├── IoT-system.slnx
│   └── IoT-system/
│       ├── Configurations/       # Authentication, error handling, and MQTT setup
│       ├── Controllers/          # HTTP API endpoints
│       ├── DTOS/                 # API and MQTT request/response models
│       ├── Helper/               # Shared helpers, pagination, and time utilities
│       ├── Hubs/                 # SignalR hubs for real-time device updates
│       ├── Models/               # Entity models and EF Core database context
│       ├── Profiles/             # AutoMapper configuration
│       ├── Services/             # Account, device, dashboard, MQTT, and notification logic
│       ├── Properties/           # Development launch profiles
│       ├── Program.cs            # Application setup and dependency registration
│       └── IoT-system.csproj
└── iot-system-frontend/
    ├── public/                   # Static public assets
    ├── src/
    │   ├── api/
    │   │   ├── admin/            # Administrator account, device, dashboard, and notification APIs
    │   │   ├── common/           # Shared auth, profile, language, Axios, and history APIs
    │   │   └── user/             # User account, device connection, and notification APIs
    │   ├── assets/               # Images and other frontend assets
    │   ├── components/
    │   │   ├── admin/            # Administrator layout and sidebar
    │   │   ├── common/           # Shared dialogs, date picker, pagination, and portal
    │   │   ├── switchLanguage/   # Language switcher
    │   │   └── user/             # User layout and sidebar
    │   ├── css/                  # Shared, admin, and user stylesheets
    │   ├── hooks/                # Shared React hooks, including SignalR
    │   ├── locales/              # English and Vietnamese translations
    │   ├── pages/
    │   │   ├── admin/            # Administrator dashboard, account, profile, and history pages
    │   │   ├── auth/             # Login, registration, and protected routes
    │   │   ├── public/           # Public landing page
    │   │   └── user/             # User dashboard, profile, connection, and history pages
    │   ├── routes/               # Frontend route definitions
    │   ├── utils/                # Shared utility functions
    │   ├── App.jsx               # Root application component
    │   ├── i18n.js               # Localization setup
    │   └── main.jsx              # Frontend entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```
