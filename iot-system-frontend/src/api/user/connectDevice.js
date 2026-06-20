import { axiosInstance } from "../axiosInstance";

// hiển thị thiết bị đã connect wifi nhưng chưa connect với app của user
export const DeviceDepending = () => axiosInstance.get("device/pending");

// connect với device
export const connectDevice = () => axiosInstance.post("device/claim");
