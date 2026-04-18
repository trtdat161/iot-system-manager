# IoT System Devices Management

## Overview

This project is an **IoT System Management Platform** that allows administrators and users to monitor, manage, and interact with IoT devices in real time.
The system supports device notifications, user management, and data visualization through dashboards and charts.

---

## Key Features

### Admin Features

* Manage users (create, update, delete)
* Manage IoT devices (e.g., fire alarm modules, gas sensors, etc.)
* View notification history from devices
* Monitor user activity statistics (charts)
* Analyze device notification trends via dashboards

---

### User Features

* View device connection status (success/failure)
* Receive real-time alerts (e.g., gas leaks, high temperature)
* View notification history
* Update personal profile
* Automatic reminders:

  * If notifications are not acknowledged, the system will resend alerts via email or UI until confirmed

---

### Device Features

* Send alerts based on sensor data
* Push notifications to:

  * Dashboard UI
  * Email system
* Handle sensor failures:

  * If no signal → display warning on dashboard only
* Store sensor data for historical tracking

---

### History & Logging

* Store logs of all notifications sent from devices
* Enable tracking and auditing of system events

---

### Future Enhancements

* Integration with AI frameworks:

  * LangChain
  * LangGraph
    → for intelligent alert analysis and automation

---

## Tech Stack

### Backend

* ASP.NET Core (C#)
* RESTful API
* SQL Server
* JWT Authentication
* SignalR (real-time communication)

### Frontend

* React (Vite)
* Axios (API communication)
* Recharts (data visualization)
* Context API (state management)

---

## Real-time Communication

* Uses **SignalR** for:

  * Live device status updates
  * Instant notifications
  * Real-time dashboard updates

---

## Authentication

* JWT-based authentication
* Role-based access:

  * Admin
  * User

---

## Data Visualization

* Charts for:

  * User activity
  * Device notifications
* Built using **Recharts**

---

## Goal

To build a scalable IoT monitoring system that:

* Ensures real-time responsiveness
* Provides clear insights via dashboards
* Enhances safety through automated alerts

