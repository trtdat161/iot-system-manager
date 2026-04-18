import { axiosInstance } from "./axiosInstance";

export const GetLanguages = () => axiosInstance.get("language/languages-list");
