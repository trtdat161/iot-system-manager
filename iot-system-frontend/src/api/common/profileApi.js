import { axiosInstance } from "./axiosInstance";

export const GetProfile = () => axiosInstance.get("action/me");

export const ConfirmPassword = (oldPassword) =>
  axiosInstance.post("action/confirm-old-password", {
    password: oldPassword,
    oldPassword,
  });

export const UpdateProfile = (data) =>
  axiosInstance.put("action/profile", data);
