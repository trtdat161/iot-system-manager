import { axiosInstance } from "../common/axiosInstance";

export const UserGetHistory = (page, pageSize) =>
  axiosInstance.get(
    `notification/user-history?page=${page}&pageSize=${pageSize}`,
  );

export const UserIsRead = (notificationId) =>
  axiosInstance.post(`notification/is-read/${notificationId}`);
