import { axiosInstance } from "../axiosInstance";

// list
export const GetDevices = (page = 1, pageSize = 10) =>
    axiosInstance.get(`device/device-list?page=${page}&pageSize=${pageSize}`);

// find by id
export const GetDeviceById = (id) =>
    axiosInstance.get(`device/find-device-by-id/${id}`);

// search name + status
export const SearchDevice = (name, status) =>
    axiosInstance.get(`device/search-device?keyword=${name}&status=${status}`);

// add
export const AdminAddDevice = (data) => axiosInstance.post("device/add", data);

// update
export const AdminUpdateDevice = (id, data) =>
    axiosInstance.put(`device/update/${id}`, data);

// delete
export const AdminDeleteDevice = (id) =>
    axiosInstance.delete(`device/delete/${id}`);