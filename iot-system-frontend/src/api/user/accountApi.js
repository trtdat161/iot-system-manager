import { axiosInstance } from "../axiosInstance";

// get me
export const UserGetMe = () => axiosInstance.get("action/me");