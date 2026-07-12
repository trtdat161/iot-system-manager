import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useDeviceSignalR(mac) {
  const [connection, setConnection] = useState(null);
  console.log("useDeviceSignalR called with mac:", mac); // thêm dòng này

  useEffect(() => {
    if (!mac) return;
    const normalizedMac = mac.toUpperCase(); // chuẩn hóa 1 lần, dùng xuyên suốt effect

    const conn = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7115/hubs/notification") // port BE
      .withAutomaticReconnect()
      .build();

    conn.onreconnected(() => {
      conn.invoke("JoinDeviceGroup", normalizedMac);
    });

    conn
      .start()
      .then(() => {
        conn.invoke("JoinDeviceGroup", normalizedMac);
        setConnection(conn);
      })
      .catch((err) => console.error("SignalR connect error:", err));

    return () => {
      conn.invoke("LeaveDeviceGroup", normalizedMac).catch(() => {});
      conn.stop();
    };
  }, [mac]);

  return connection;
}
