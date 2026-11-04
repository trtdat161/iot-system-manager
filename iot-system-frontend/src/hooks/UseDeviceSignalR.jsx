import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useDeviceSignalR(mac, handlers = {}) {
  const [connection, setConnection] = useState(null);

  // Luôn sử dụng callback mới nhất mà không phải khởi tạo lại SignalR
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!mac) {
      setConnection(null);
      return;
    }

    let cancelled = false;
    const normalizedMac = mac.trim().toUpperCase();

    const conn = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7115/hubs/notification")
      .withAutomaticReconnect()
      .build();

    // 1. Đăng ký listener TRƯỚC KHI start connection
    conn.on("ReceiveSensorData", (data) => {
      handlersRef.current.onSensorData?.(data);
    });

    conn.on("ReceiveAlert", (data) => {
      handlersRef.current.onAlert?.(data);
    });

    // 2. Reconnect xong phải join lại Group
    conn.onreconnected(async () => {
      try {
        await conn.invoke("JoinDeviceGroup", normalizedMac);
        console.log("[SignalR] Rejoined group:", normalizedMac);
      } catch (err) {
        console.error("[SignalR] Rejoin failed:", err);
      }
    });

    // 3. Start -> Join -> xác nhận connection đã sẵn sàng
    const startConnection = async () => {
      try {
        await conn.start();

        console.log("[SignalR] Connected");

        await conn.invoke("JoinDeviceGroup", normalizedMac);

        console.log("[SignalR] Joined group:", normalizedMac);

        if (!cancelled) {
          setConnection(conn);
        }
      } catch (err) {
        console.error("[SignalR] Connection error:", err);
      }
    };

    startConnection();

    // 4. Cleanup
    return () => {
      cancelled = true;

      setConnection(null);

      if (conn.state === signalR.HubConnectionState.Connected) {
        conn
          .invoke("LeaveDeviceGroup", normalizedMac)
          .catch((err) => console.error("[SignalR] Leave error:", err))
          .finally(() => conn.stop());
      } else {
        conn.stop();
      }
    };
  }, [mac]);

  return connection;
}
