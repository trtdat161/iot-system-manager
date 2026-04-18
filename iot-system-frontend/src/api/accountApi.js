import { axiosInstance } from "./axiosInstance";

export const GetAccounts = () => axiosInstance.get("auth/accounts-list");
