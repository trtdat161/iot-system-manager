import { axiosInstance } from "./axiosInstance";

export const Register = (data) => axiosInstance.post("auth/register", data);
export const Login = (data) => axiosInstance.post("auth/login", data);
// file này chỉ gọi axios và export, còn k có j khác