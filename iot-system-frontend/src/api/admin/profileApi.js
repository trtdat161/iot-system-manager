import { axiosInstance } from "../axiosInstance";

export const GetAdminProfile = () => axiosInstance.get("action/me");

export const UpdateAdminProfile = (data) =>
  axiosInstance.put("action/profile", data);
