import { axiosInstance } from "../axiosInstance";

export const GetAdminProfile = () => axiosInstance.get("action/me");

export const ConfirmPassword = (oldPassword) =>
  axiosInstance.post("action/confirm-old-password", {
    password: oldPassword,
    oldPassword,
  });

export const UpdateAdminProfile = (data) =>
  axiosInstance.put("action/profile", data);
