import { axiosInstance } from "../common/axiosInstance";

export const GetUserProfile = () => axiosInstance.get("action/me");

export const ConfirmPassword = (oldPassword) =>
  axiosInstance.post("action/confirm-old-password", {
    password: oldPassword,
    oldPassword,
  });

export const UpdateUserProfile = (data) =>
  axiosInstance.put("action/profile", data);
