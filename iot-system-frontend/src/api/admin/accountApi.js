import { axiosInstance } from "../axiosInstance";

// list account
export const GetAccounts = (page = 1, pageSize = 10) =>
  axiosInstance.get(`action/account-list?page=${page}&pageSize=${pageSize}`);

// search status + name account
export const SearchAccount = (name, status) =>
  axiosInstance.get(`action/search-account?name=${name}&status=${status}`);

// khoá account
export const AdminLockAccount = (id, note) =>
  axiosInstance.post(`action/account-lock/${id}?note=${note}`);

// mở account
export const AdminUnlockAccount = (id) =>
  axiosInstance.post(`action/account-unlock/${id}`);

// xoá account
export const DeleteAccount = (id) =>
  axiosInstance.delete(`action/delete-account/${id}`);
