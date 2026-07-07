import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function UseDeviceSignalR(mac) {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    if (!mac) return; // chưa chọn thiết bị thì chưa cần connect

    const conn = new signalR.HubConnectionBuilder()
      .withUrl("https://your-api.com/hubs/notification")
      .withAutomaticReconnect() // ESP + mạng dễ rớt, bắt buộc có
      .build();

    // Khi reconnect lại sau khi mất mạng, phải join lại group,
    // vì SignalR không tự nhớ group cũ sau khi connection bị đứt và tạo lại
    conn.onreconnected(() => {
      conn.invoke("JoinDeviceGroup", mac);
    });

    conn
      .start()
      .then(() => {
        conn.invoke("JoinDeviceGroup", mac); // join phòng đúng thiết bị
        setConnection(conn);
      })
      .catch((err) => console.error("SignalR connect error:", err));

    return () => {
      conn.invoke("LeaveDeviceGroup", mac).catch(() => {});
      conn.stop();
    };
  }, [mac]);

  return connection;
}
