import { axiosInstance } from "../axiosInstance";

export const GetUserProfile = () => axiosInstance.get("action/me");

export const UpdateUserProfile = (data) =>
  axiosInstance.put("action/profile", data);
