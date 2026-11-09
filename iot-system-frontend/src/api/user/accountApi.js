import { axiosInstance } from "../common/axiosInstance";

// get me
export const UserGetMe = () => axiosInstance.get("action/me");