import { axiosInstance } from "../axiosInstance";

// list account
export const GetAccounts = (page = 1, pageSize = 10) =>
    axiosInstance.get(`action/account-list?page=${page}&pageSize=${pageSize}`);

// find by id
export const GetAccountById = (id) =>
    axiosInstance.get(`action/find-account-by-id/${id}`);

// search status + name account
export const SearchAccount = (name, status) =>
    axiosInstance.get(`action/search-account?keyword=${name}&status=${status}`);

// khoá account
export const AdminLockAccount = (id, note) =>
    axiosInstance.post(`action/account-lock/${id}?note=${note}`);

// mở account
export const AdminUnlockAccount = (id) =>
    axiosInstance.post(`action/account-unlock/${id}`);

// xoá account
export const DeleteAccount = (id) =>
    axiosInstance.delete(`action/delete-account/${id}`);

// get me
export const AdminGetMe = () => axiosInstance.get("action/me");