import { axiosInstance } from "../axiosInstance";

export const adminGetHistory = (page, pageSize) =>
  axiosInstance.get(
    `notification/admin-history?page=${page}&pageSize=${pageSize}`,
  );

export const HistoryDetailForAdmin = (id) =>
  axiosInstance.get(`notification/history-detail/${id}`);
