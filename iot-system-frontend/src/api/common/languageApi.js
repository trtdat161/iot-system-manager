import { axiosInstance } from "./axiosInstance";

// Shared language requests
export const GetLanguages = () => axiosInstance.get("language/languages-list");