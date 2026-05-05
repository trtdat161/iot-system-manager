import { axiosInstance } from "./axiosInstance";

export const GetAccounts = () => axiosInstance.get("action/accounts-list");
