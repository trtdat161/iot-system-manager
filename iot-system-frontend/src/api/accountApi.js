import { axiosInstance } from "./axiosInstance";

// list account
export const GetAccounts = () => axiosInstance.get("action/accounts-list");

// khoá account
export const AdminLockAccount = (id, note) =>
  axiosInstance.post(`action/accounts-lock/${id}?note=${note}`);

// mở account
export const AdminUnlockAccount = (id) =>
  axiosInstance.post(`action/account-unlock/${id}`);
