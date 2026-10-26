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

The system currently supports gas, temperature, and humidity sensor payloads. Email delivery, household or group management, automatic sensor-signal-loss alerts, and complete historical analytics are not yet implemented. Some dashboard visualizations currently use static data.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite 8, React Router, Axios |
| Backend | ASP.NET Core Web API, .NET 10, C# |
| Data access and storage | Entity Framework Core, SQL Server |
| Authentication and authorization | JWT stored in cookies, role-based access |
| Real-time updates | SignalR |
| Device messaging | MQTTnet |
| Localization | i18next, English and Vietnamese |

## System Architecture and Workflow

```text
ESP8266
   │  Sensor readings and device announcements (MQTT)
   ▼
MQTT Broker
   │  devices/announce, devices/{MAC}/data
   ▼
ASP.NET Core Backend
   ├── Updates device last-seen information
   ├── Stores alert notifications in SQL Server
   └── Publishes live events through SignalR
          │  ReceiveSensorData / ReceiveAlert
          ▼
React Frontend
   └── Displays live sensor readings and alerts on the dashboard
```

1. **Device to broker:** An ESP8266 publishes its MAC address when announcing itself and sends sensor readings, such as gas, temperature, and humidity, over MQTT.
2. **Broker to backend:** The backend subscribes to `devices/announce` and `devices/{MAC}/data`. It registers newly announced devices, processes incoming readings, and updates the device's last-seen time.
3. **Backend processing:** Sensor readings are sent to connected dashboards in real time. When a reading indicates an alert, the backend creates notification records for users associated with the device and avoids generating another unread notification of the same type for that device.
4. **Backend to frontend:** The backend emits `ReceiveSensorData` and, when applicable, `ReceiveAlert` through SignalR. The frontend joins a SignalR group for the device MAC and updates the dashboard as events arrive.
5. **Review and acknowledgement:** Users can view saved notifications in their history and mark them as read. The backend also publishes device claim or unclaim commands to `devices/{MAC}/command` when device ownership changes.

## Project Structure

```text
.
├── README.md
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
    │   ├── api/                  # Backend API clients
    │   ├── assets/               # Images and other frontend assets
    │   ├── components/           # Shared layouts and interface components
    │   ├── css/                  # Application styles
    │   ├── hooks/                # Shared React hooks, including SignalR
    │   ├── locales/              # English and Vietnamese translations
    │   ├── pages/                # Admin, user, authentication, and public pages
    │   ├── routes/               # Frontend route definitions
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```
