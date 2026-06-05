import { axiosInstance } from "../axiosInstance";

export const GetAdminProfile = () => axiosInstance.get("action/me");