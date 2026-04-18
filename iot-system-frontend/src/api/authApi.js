import { axiosInstance } from "./axiosInstance";

export const RegisterAction = (data) =>
  axiosInstance.post("auth/register", data);
export const LoginAction = (data) => axiosInstance.post("auth/login", data);
// file này chỉ gọi axios và export, còn k có j khác
