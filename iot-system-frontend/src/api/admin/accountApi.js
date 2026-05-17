import { axiosInstance } from "../axiosInstance";

// list account
export const GetAccounts = () => axiosInstance.get("action/account-list");

// khoá account
export const AdminLockAccount = (id, note) =>
  axiosInstance.post(`action/account-lock/${id}?note=${note}`);

// mở account
export const AdminUnlockAccount = (id) =>
  axiosInstance.post(`action/account-unlock/${id}`);

// xoá account
export const DeleteAccount = (id) =>
  axiosInstance.delete(`action/delete-account/${id}`);
