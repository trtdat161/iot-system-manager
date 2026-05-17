import { axiosInstance } from "../axiosInstance";

// list
export const GetDevices = () => axiosInstance.get("device/list");

// add
export const AdminAddDevice = (data) => axiosInstance.post("device/add", data);

// update
export const AdminUpdateDevice = (id, data) =>
  axiosInstance.put(`device/update/${id}`, data);

// delete
export const AdminDeleteDevice = (id) =>
  axiosInstance.delete(`device/delete/${id}`);
