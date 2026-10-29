import { axiosInstance } from "../axiosInstance";

// hiển thị thiết bị đã connect wifi nhưng chưa connect với app của user
export const DeviceDepending = () => axiosInstance.get("device/pending");

// claim với device lần đầu
export const ClaimDevice = (deviceId) =>
  axiosInstance.post(`device/claim/${deviceId}`);

// kêt nối với thiết bị đã đc claim
export const ConnectDevice = (deviceId) =>
  axiosInstance.post(`device/${deviceId}/connect-device`);

// kêt nối với thiết bị đã đc claim
export const DisconnectDevice = (deviceId) =>
  axiosInstance.post(`device/${deviceId}/disconnect-device`);

// thiết bị user đã chọn vào để connectd dẻ trả về id gắn vào hàm connect và disconnect
export const GetConnectedDevice = () =>
  axiosInstance.get(`get-connected-device`);
