import { axiosInstance } from "../axiosInstance";

export const UserGetHistory = (page, pageSize) =>
  axiosInstance.get(
    `notification/user-history?page=${page}&pageSize=${pageSize}`,
  );
